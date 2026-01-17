/**
 * Notification Service
 * Handles push notifications, preferences, and deep linking
 * Shows REAL system notifications (not in-app toasts)
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useLocation } from 'wouter';
import type {
  NotificationPayload,
  NotificationPreferences,
  NotificationCategory,
  NotificationEventName,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_TEMPLATES } from './types';

const PREFERENCES_STORAGE_KEY = 'plattr_notification_preferences';
const DEVICE_TOKEN_STORAGE_KEY = 'plattr_device_token';
const APNS_TOKEN_STORAGE_KEY = 'plattr_apns_token';
const DEDUPE_STORAGE_KEY = 'plattr_notification_dedupe';

type FCMTokenPlugin = {
  getToken: () => Promise<{ token: string }>;
  addListener: (
    eventName: 'fcmToken',
    listenerFunc: (data: { token: string }) => void
  ) => Promise<{ remove: () => Promise<void> }>;
};

const FCMToken = registerPlugin<FCMTokenPlugin>('FCMToken');

class NotificationService {
  private deviceToken: string | null = null;
  private apnsToken: string | null = null;
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private listeners: Set<(payload: NotificationPayload) => void> = new Set();
  private didInitialize = false;
  private didSetupListeners = false;
  private fcmListenerHandle: { remove: () => Promise<void> } | null = null;

  constructor() {
    this.loadPreferences();
    this.loadDeviceToken();
    this.loadApnsToken();
  }

  /**
   * Initialize push notifications
   * Call this when app starts
   */
  async initialize(): Promise<void> {
    if (this.didInitialize) return;
    this.didInitialize = true;

    console.log('[Notifications] Initializing...', { isNative: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform() });
    
    if (!Capacitor.isNativePlatform()) {
      console.log('[Notifications] Web platform detected - push notifications only work on native (iOS/Android)');
      console.log('[Notifications] For testing, build and run on device/emulator');
      return;
    }

    try {
      // Request PUSH notification permission
      console.log('[Notifications] Requesting push notification permissions...');
      const pushPermission = await PushNotifications.requestPermissions();
      console.log('[Notifications] Push permission result:', pushPermission);
      
      // Request LOCAL notification permission (needed for foreground notifications)
      console.log('[Notifications] Requesting local notification permissions...');
      const localPermission = await LocalNotifications.requestPermissions();
      console.log('[Notifications] Local permission result:', localPermission);
      
      if (pushPermission.receive === 'granted') {
        console.log('[Notifications] Permission granted, registering for push...');
        // Register for push
        await PushNotifications.register();
        console.log('[Notifications] Registration initiated, waiting for token...');
        // On iOS, wait for APNs token first, then fetch FCM token.
        await this.setupIOSFCMTokenHandling();
      } else {
        console.warn('[Notifications] Push permission denied:', pushPermission);
      }
      
      // Set up local notification action listener (when user taps local notification)
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[Notifications] Local notification tapped:', action);
        const data = action.notification.extra;
        if (data?.deep_link) {
          this.handleDeepLink(data.deep_link);
        }
      });
      
    } catch (error) {
      console.error('[Notifications] Initialization error:', error);
    }
  }

  /**
   * Set up notification listeners
   * Call this in App.tsx
   */
  setupListeners(): () => void {
    if (!Capacitor.isNativePlatform()) {
      return () => {}; // No-op cleanup
    }

    // Avoid registering duplicate listeners if multiple parts of the app call this.
    if (this.didSetupListeners) {
      return () => {};
    }
    this.didSetupListeners = true;

    // Handle registration
    const registrationListener = PushNotifications.addListener('registration', (token) => {
      // NOTE:
      // - Android: token.value is an FCM registration token (usable by backend)
      // - iOS: token.value is an APNs token (NOT usable by backend FCM v1 sender)
      if (Capacitor.getPlatform() === 'ios') {
        console.log('[Notifications] iOS APNs token (not stored as device token):', token.value);
        this.apnsToken = token.value;
        this.saveApnsToken(token.value);

        // Now that APNs token exists, Firebase can mint an FCM token. Trigger a fetch.
        this.fetchIOSFCMTokenOnceApnsReady();
        return;
      }

      console.log('[Notifications] Device token:', token.value);
      this.deviceToken = token.value;
      this.saveDeviceToken(token.value);
      this.sendTokenToBackend(token.value);
    });

    // Handle registration errors
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('[Notifications] Registration error:', error);
    });

    // Handle notification received (foreground)
    const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Notifications] Push received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification action (tapped)
    const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Notifications] Push action:', action);
      this.handleNotificationAction(action);
    });

    // Cleanup function
    return () => {
      registrationListener.remove();
      registrationErrorListener.remove();
      pushReceivedListener.remove();
      pushActionListener.remove();
    };
  }

  /**
   * Handle notification received (foreground)
   * Shows a REAL system notification using Local Notifications
   */
  private async handleNotificationReceived(notification: any): Promise<void> {
    try {
      console.log('[Notifications] Push received in foreground:', notification);
      
      // Get notification title and body from the push notification
      const title = notification.title || notification.data?.title || 'Plattr';
      const body = notification.body || notification.data?.body || '';
      const data = notification.data || {};

      // On iOS, we present foreground banners via AppDelegate (willPresent).
      // Scheduling a local notification here would cause duplicates.
      if (Capacitor.getPlatform() === 'ios') {
        const payload = this.parseNotificationPayload(data);
        if (payload) {
          this.notifyListeners(payload);
        }
        return;
      }
      
      // Show a REAL system notification using Local Notifications
      // This makes it appear in the notification tray like other apps (WhatsApp, Instagram, etc.)
      const notificationConfig: any = {
        id: Math.floor(Math.random() * 100000), // Unique ID
        title: title,
        body: body,
        sound: 'default',
        channelId: 'plattr_notifications',
        extra: data, // Pass along the original data for when tapped
      };
      
      // Add Android-specific options
      if (Capacitor.getPlatform() === 'android') {
        notificationConfig.smallIcon = 'ic_notification';
        notificationConfig.iconColor = '#F5A524'; // Plattr brand color
      }
      
      await LocalNotifications.schedule({
        notifications: [notificationConfig],
      });
      
      console.log('[Notifications] ✅ Local notification shown in system tray');
      
      // Also notify listeners for any in-app handling if needed
      const payload = this.parseNotificationPayload(data);
      if (payload) {
        this.notifyListeners(payload);
      }
    } catch (error) {
      console.error('[Notifications] Error showing local notification:', error);
    }
  }

  /**
   * Handle notification action (tapped)
   */
  private handleNotificationAction(action: any): void {
    try {
      const payload = this.parseNotificationPayload(action.notification.data);
      if (payload && payload.deep_link) {
        this.handleDeepLink(payload.deep_link);
      }
    } catch (error) {
      console.error('[Notifications] Error handling notification action:', error);
    }
  }

  /**
   * Parse notification payload from push data
   */
  private parseNotificationPayload(data: any): NotificationPayload | null {
    if (!data || !data.notification_id) {
      return null;
    }

    return {
      notification_id: data.notification_id,
      category: data.category,
      event_name: data.event_name,
      user_id: data.user_id,
      title: data.title,
      body: data.body,
      deep_link: data.deep_link,
      image_url: data.image_url,
      cta_text: data.cta_text,
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
      dedupe_key: data.dedupe_key,
      created_at: data.created_at,
    };
  }

  /**
   * Check if notification should be shown based on preferences
   */
  private shouldShowNotification(payload: NotificationPayload): boolean {
    // Check deduplication
    if (this.isDuplicate(payload.dedupe_key)) {
      return false;
    }

    // Check preferences
    switch (payload.category) {
      case 'transactional':
        return this.preferences.order_updates;
      case 'marketing':
        return this.preferences.offers_promotions || this.preferences.menu_recommendations;
      case 'behavioral':
        return this.preferences.reminders;
      default:
        return true;
    }
  }

  /**
   * Check if notification is duplicate
   */
  private isDuplicate(dedupeKey: string): boolean {
    const sent = localStorage.getItem(`${DEDUPE_STORAGE_KEY}:${dedupeKey}`);
    if (sent) {
      return true;
    }
    // Mark as sent
    localStorage.setItem(`${DEDUPE_STORAGE_KEY}:${dedupeKey}`, Date.now().toString());
    return false;
  }

  /**
   * Handle deep link navigation
   */
  private handleDeepLink(deepLink: string): void {
    try {
      // Parse deep link: plattr://orders/{id} or /orders/{id}
      let path = '';
      
      if (deepLink.startsWith('plattr://')) {
        // Custom scheme: plattr://orders/123
        path = deepLink.replace('plattr://', '');
      } else if (deepLink.startsWith('http')) {
        // HTTP URL
        const url = new URL(deepLink);
        path = url.pathname;
      } else {
        // Already a path
        path = deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
      }

      if (path.startsWith('/orders/')) {
        const orderId = path.split('/orders/')[1]?.split('?')[0];
        if (orderId) {
          window.location.href = `/orders/${orderId}`;
        }
      } else if (path === '/cart' || path.startsWith('/cart')) {
        window.location.href = '/checkout';
      } else if (path.startsWith('/offers/')) {
        const couponId = path.split('/offers/')[1]?.split('?')[0];
        if (couponId) {
          window.location.href = `/?coupon=${couponId}`;
        }
      } else if (path.startsWith('/menus')) {
        window.location.href = '/menu';
      } else if (path.startsWith('/reorder/')) {
        const orderId = path.split('/reorder/')[1]?.split('?')[0];
        if (orderId) {
          window.location.href = `/orders/${orderId}?reorder=true`;
        }
      } else if (path === '/referrals' || path === '/referral') {
        window.location.href = '/referral';
      } else {
        // Default to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[Notifications] Error handling deep link:', error);
      window.location.href = '/';
    }
  }

  /**
   * Send device token directly to Supabase (no backend needed)
   * Retries if user is not logged in yet
   */
  private async sendTokenToBackend(token: string, retryCount = 0): Promise<void> {
    try {
      console.log('[Notifications] sendTokenToBackend called, attempt:', retryCount + 1);
      
      // Import dynamically to avoid circular dependencies
      const { Capacitor } = await import('@capacitor/core');
      const { supabaseAuth } = await import('@/lib/supabase-auth');
      
      // Try to get session
      let session: any = null;
      try {
        const result = await supabaseAuth.auth.getSession();
        session = result.data?.session;
        console.log('[Notifications] Session check:', session ? 'Found session' : 'No session');
      } catch (e) {
        console.warn('[Notifications] Error getting session:', e);
      }
      
      // Get user ID from session or localStorage
      const userId = session?.user?.id || localStorage.getItem('userId');
      console.log('[Notifications] User ID:', userId ? userId.substring(0, 8) + '...' : 'null');
      
      if (!userId) {
        // Retry up to 10 times with exponential backoff
        if (retryCount < 10) {
          const delay = Math.min(2000 * Math.pow(1.5, retryCount), 30000);
          console.log(`[Notifications] No user ID, retrying in ${delay}ms (attempt ${retryCount + 1}/10)`);
          setTimeout(() => {
            this.sendTokenToBackend(token, retryCount + 1);
          }, delay);
          return;
        }
        console.warn('[Notifications] No user ID after 10 retries, giving up');
        return;
      }

      const platform = Capacitor.getPlatform() || 'web';
      const platformType = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';
      
      console.log('[Notifications] Registering token in Supabase...', {
        user_id: userId.substring(0, 8) + '...',
        platform: platformType,
        token_preview: token.substring(0, 20) + '...'
      });

      // First ensure user exists in public.users table (required by RLS)
      console.log('[Notifications] Checking if user exists in users table...');
      const { data: existingUser, error: userCheckError } = await supabaseAuth
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userCheckError) {
        console.warn('[Notifications] Error checking user:', userCheckError);
      }

      if (!existingUser) {
        console.log('[Notifications] User not in users table, creating...');
        const phone = session?.user?.phone || localStorage.getItem('phone') || '';
        const { error: createUserError } = await supabaseAuth
          .from('users')
          .insert({
            id: userId,
            username: `user_${Math.floor(1000 + Math.random() * 9000)}`,
            phone: phone.replace('+91', ''),
            password: 'OTP_AUTH',
            is_verified: true,
          });

        if (createUserError && !createUserError.message?.includes('duplicate')) {
          console.error('[Notifications] Failed to create user:', createUserError);
          // Continue anyway - maybe user exists but RLS blocked us from seeing
        } else {
          console.log('[Notifications] User created in users table');
        }
      } else {
        console.log('[Notifications] User exists in users table');
      }

      // Check if this exact token already exists for this user
      console.log('[Notifications] Checking for existing token...');
      const { data: existingToken, error: tokenCheckError } = await supabaseAuth
        .from('device_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('device_token', token)
        .maybeSingle();

      if (tokenCheckError) {
        console.warn('[Notifications] Error checking token:', tokenCheckError);
      }

      if (existingToken) {
        // Update existing token
        console.log('[Notifications] Token exists, updating...');
        const { error: updateError } = await supabaseAuth
          .from('device_tokens')
          .update({
            platform: platformType,
            preferences: this.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        if (updateError) {
          console.error('[Notifications] Update failed:', updateError);
          throw updateError;
        }
        console.log('[Notifications] ✅ Token updated successfully');
      } else {
        // Insert new token
        console.log('[Notifications] Inserting new token...');
        const { data: insertedData, error: insertError } = await supabaseAuth
          .from('device_tokens')
          .insert({
            user_id: userId,
            device_token: token,
            platform: platformType,
            preferences: this.preferences,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Notifications] Insert failed:', insertError);
          console.error('[Notifications] Insert error details:', JSON.stringify(insertError));
          throw insertError;
        }
        console.log('[Notifications] ✅ Token inserted successfully:', insertedData?.id);
      }
    } catch (error: any) {
      console.error('[Notifications] Error saving token:', error);
      console.error('[Notifications] Error message:', error?.message);
      console.error('[Notifications] Error details:', JSON.stringify(error));
      
      // Retry on network errors
      if (retryCount < 3 && (error?.message?.includes('network') || error?.message?.includes('fetch'))) {
        const delay = 3000 * (retryCount + 1);
        console.log(`[Notifications] Network error, retrying in ${delay}ms`);
        setTimeout(() => {
          this.sendTokenToBackend(token, retryCount + 1);
        }, delay);
      }
    }
  }

  /**
   * Retry token registration (call after user logs in)
   */
  async retryTokenRegistration(): Promise<void> {
    const token = this.deviceToken || localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    if (token) {
      console.log('[Notifications] Retrying token registration after login...');
      await this.sendTokenToBackend(token, 0);
    }
  }

  /**
   * Get device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
    
    try {
      // Import dynamically to avoid circular dependencies
      const { apiRequest } = await import('@/lib/queryClient');
      const { supabaseAuth } = await import('@/lib/supabase-auth');
      
      // Get current user
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const userId = session?.user?.id || localStorage.getItem('userId');
      
      if (userId) {
        await apiRequest('PUT', '/api/notifications/preferences', {
          user_id: userId,
          preferences: this.preferences,
        });
        console.log('[Notifications] Preferences saved to backend');
      }
    } catch (error) {
      console.error('[Notifications] Error saving preferences to backend:', error);
      // Don't throw - preferences are saved locally
    }
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        this.preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[Notifications] Error loading preferences:', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[Notifications] Error saving preferences:', error);
    }
  }

  /**
   * Load device token from storage
   */
  private loadDeviceToken(): void {
    try {
      const stored = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);

      // iOS gotcha: older builds often saved the APNs token into plattr_device_token.
      // APNs tokens are 64-hex chars; FCM tokens are typically much longer and include non-hex chars.
      if (Capacitor.getPlatform() === 'ios' && stored && /^[0-9a-fA-F]{64}$/.test(stored)) {
        console.warn('[Notifications] Detected APNs token stored as device token. Clearing and waiting for FCM token.');
        localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
        this.deviceToken = null;
        return;
      }

      this.deviceToken = stored;
    } catch (error) {
      console.error('[Notifications] Error loading device token:', error);
    }
  }

  private loadApnsToken(): void {
    try {
      this.apnsToken = localStorage.getItem(APNS_TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('[Notifications] Error loading APNs token:', error);
    }
  }

  /**
   * Save device token to storage
   */
  private saveDeviceToken(token: string): void {
    try {
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('[Notifications] Error saving device token:', error);
    }
  }

  private saveApnsToken(token: string): void {
    try {
      localStorage.setItem(APNS_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('[Notifications] Error saving APNs token:', error);
    }
  }

  /**
   * iOS: bridge Firebase Messaging FCM token into JS, and store that token for backend usage.
   */
  private async setupIOSFCMTokenHandling(): Promise<void> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
    if (this.fcmListenerHandle) return;

    try {
      this.fcmListenerHandle = await FCMToken.addListener('fcmToken', ({ token }) => {
        if (!token) return;
        if (token === this.deviceToken) return;

        console.log('[Notifications] iOS FCM token received:', token.substring(0, 20) + '...');
        this.deviceToken = token;
        this.saveDeviceToken(token);
        this.sendTokenToBackend(token);
      });
    } catch (error) {
      // On non-iOS/native builds this plugin won't exist; fail silently.
      console.warn('[Notifications] iOS FCM token bridge not available:', error);
    }
  }

  private async fetchIOSFCMTokenOnceApnsReady(): Promise<void> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
    
    // Ensure APNs token is set before fetching FCM token to avoid Firebase warning
    if (!this.apnsToken) {
      console.log('[Notifications] Waiting for APNs token before fetching FCM token...');
      // APNs token will be set in the registration listener, which will call this again
      return;
    }
    
    try {
      const result = await FCMToken.getToken();
      if (!result?.token) return;
      if (result.token === this.deviceToken) return;

      console.log('[Notifications] iOS FCM token fetched:', result.token.substring(0, 20) + '...');
      this.deviceToken = result.token;
      this.saveDeviceToken(result.token);
      this.sendTokenToBackend(result.token);
    } catch (error: any) {
      // Check if error is about APNs token not being set (Firebase warning)
      if (error?.message?.includes('APNS') || error?.message?.includes('device token not set')) {
        console.log('[Notifications] FCM token not ready yet (APNs token still being set), will retry...');
      } else {
        // This will happen if APNs token is not ready yet; we'll retry when PushNotifications registration fires again.
        console.warn('[Notifications] iOS FCM token fetch failed (will retry after APNs):', error);
      }
    }
  }

  /**
   * Subscribe to notification events
   */
  subscribe(callback: (payload: NotificationPayload) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(payload: NotificationPayload): void {
    this.listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Notifications] Error in listener:', error);
      }
    });
  }

  /**
   * Format notification template with variables
   */
  static formatTemplate(
    eventName: NotificationEventName,
    variables: Record<string, string>
  ): { title: string; body: string } {
    const template = NOTIFICATION_TEMPLATES[eventName];
    if (!template) {
      return { title: 'Notification', body: 'You have a new notification' };
    }

    let title = template.title;
    let body = template.body;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { title, body };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

