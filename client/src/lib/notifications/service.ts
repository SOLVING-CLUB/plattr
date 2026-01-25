/**
 * Notification Service
 * Handles push notifications, preferences, and deep linking
 * Shows REAL system notifications (not in-app toasts)
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import type {
  NotificationPayload,
  NotificationPreferences,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './types';
import { logger } from '../debug-logger';

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
  private didInitialize = false;
  private didSetupListeners = false;
  private fcmListenerHandle: { remove: () => Promise<void> } | null = null;
  private listeners: Set<(payload: NotificationPayload) => void> = new Set();

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

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    console.log('[Notifications] Initializing...', { isNative, platform });
    logger.info('Initializing Notifications Service', { isNative, platform });

    // Show initialization status
    if (isNative && platform === 'ios') {
      toast({
        variant: 'info',
        title: 'Initializing Notifications',
        description: 'Setting up iOS push notifications...',
      });
    }

    if (!isNative) {
      logger.warn('Web platform detected - push notifications disabled');
      return;
    }

    try {
      // Request PUSH notification permission
      logger.info('Requesting push notification permissions...');
      const pushPermission = await PushNotifications.requestPermissions();
      logger.info('Push permission result', pushPermission);

      // Request LOCAL notification permission (needed for foreground notifications)
      logger.info('Requesting local notification permissions...');
      const localPermission = await LocalNotifications.requestPermissions();
      logger.info('Local permission result', localPermission);

      if (pushPermission.receive === 'granted') {
        logger.success('Push permission granted, registering...');
        toast({
          variant: 'success',
          title: 'Notifications Enabled',
          description: 'Registering for push notifications...',
        });

        // Register for push
        await PushNotifications.register();
        logger.info('Registration initiated, waiting for token...');

        // On iOS, wait for APNs token first, then fetch FCM token.
        if (platform === 'ios') {
          logger.info('Setting up iOS FCM token handling...');
          await this.setupIOSFCMTokenHandling();
        }
      } else {
        logger.warn('Push permission denied');
        toast({
          variant: 'destructive',
          title: 'Notifications Disabled',
          description: 'Please enable notifications in Settings to receive updates.',
        });
      }

      // Set up local notification action listener (when user taps local notification)
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        logger.info('Local notification tapped', action);
        const data = action.notification.extra;
        if (data?.deep_link) {
          this.handleDeepLink(data.deep_link);
        }
      });

    } catch (error: any) {
      logger.error('Initialization error', error);
      toast({
        variant: 'destructive',
        title: 'Notification Setup Failed',
        description: error?.message || 'Failed to initialize notifications. Please try again.',
      });
    }
  }

  /**
   * Set up notification listeners
   * Call this in App.tsx
   */
  setupListeners(): () => void {
    if (!Capacitor.isNativePlatform()) {
      return () => { }; // No-op cleanup
    }

    // Avoid registering duplicate listeners if multiple parts of the app call this.
    if (this.didSetupListeners) {
      return () => { };
    }
    this.didSetupListeners = true;

    // Handle registration
    const registrationListener = PushNotifications.addListener('registration', (token) => {
      // NOTE:
      // - Android: token.value is an FCM registration token (usable by backend)
      // - iOS: token.value is an APNs token (NOT usable by backend FCM v1 sender)
      if (Capacitor.getPlatform() === 'ios') {
        const apnsToken = token.value;
        logger.success('✅ iOS APNs token received', { token: apnsToken.substring(0, 10) + '...' });
        this.apnsToken = apnsToken;
        this.saveApnsToken(apnsToken);

        toast({
          variant: 'info',
          title: 'APNs Token Received',
          description: 'Ready for FCM exchange...',
        });

        // Trigger FCM exchange
        setTimeout(() => {
          logger.info('Triggering FCM exchange after APNs...');
          this.fetchIOSFCMTokenOnceApnsReady();
        }, 1000);

        return;
      }

      logger.success('✅ Device token (Android)', { token: token.value });
      this.deviceToken = token.value;
      this.saveDeviceToken(token.value);

      // Show success toast for Android
      toast({
        variant: 'success',
        title: 'Device Token Registered',
        description: 'Your device is now ready to receive notifications.',
      });

      this.sendTokenToBackend(token.value);
    });

    // Handle registration errors
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      logger.error('❌ Registration error', error);

      // Show error on screen
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      toast({
        variant: 'destructive',
        title: 'Push Notification Error',
        description: `Failed to register for notifications: ${errorMessage}`,
      });
    });

    // Handle notification received (foreground)
    const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      logger.info('Push received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification action (tapped)
    const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      logger.info('Push action:', action);
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
   * iOS: Fetch FCM token once APNs is ready
   */
  private async fetchIOSFCMTokenOnceApnsReady(retryCount = 0): Promise<void> {
    logger.info(`fetchIOSFCMTokenOnceApnsReady attempt ${retryCount + 1}`);

    if (!this.apnsToken) {
      logger.warn('APNs token not ready yet');
      return;
    }

    if (!FCMToken) {
      logger.error('FCMToken plugin is missing');
      return;
    }

    try {
      const result = await FCMToken.getToken();
      if (result && result.token) {
        logger.success('✅ FCM Token fetched successfully', { token: result.token.substring(0, 10) + '...' });
        this.deviceToken = result.token;
        this.saveDeviceToken(result.token);
        this.sendTokenToBackend(result.token);
      } else {
        throw new Error('Empty token returned');
      }
    } catch (e: any) {
      logger.error('Error fetching FCM token', e);
      if (retryCount < 3) {
        setTimeout(() => this.fetchIOSFCMTokenOnceApnsReady(retryCount + 1), 2000);
      }
    }
  }

  /**
   * iOS: bridge Firebase Messaging FCM token into JS, and store that token for backend usage.
   */
  private async setupIOSFCMTokenHandling(): Promise<void> {
    logger.info('Setup iOS FCM Token Handling started');

    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
      return;
    }
    if (this.fcmListenerHandle) {
      return;
    }

    try {
      logger.info('Setting up FCM listener...');

      // Try to verify plugin is actually available by checking if methods exist
      if (!FCMToken || typeof FCMToken.addListener !== 'function') {
        logger.error('❌ FCMToken plugin missing or invalid');
        toast({
          variant: 'destructive',
          title: 'FCMToken Plugin Not Available',
          description: 'Plugin not registered. Add FCMTokenPlugin to packageClassList and rebuild.',
        });
        return;
      }

      this.fcmListenerHandle = await FCMToken.addListener('fcmToken', ({ token }) => {
        if (!token) {
          logger.warn('Received empty FCM token event');
          return;
        }
        logger.success('✅ Received FCM token from listener', { token: token.substring(0, 10) + '...' });
        this.deviceToken = token;
        this.saveDeviceToken(token);
        this.sendTokenToBackend(token);
      });
      logger.success('✅ FCM listener registered');

    } catch (error: any) {
      logger.error('❌ Error setting up FCM token handling', error);
    }
  }


  /**
   * Handle notification received (foreground)
   * Shows a REAL system notification using Local Notifications
   */
  private async handleNotificationReceived(notification: any): Promise<void> {
    try {
      logger.info('Push received in foreground', notification);

      // Get notification title and body from the push notification
      const title = notification.title || notification.data?.title || 'Plattr';
      const body = notification.body || notification.data?.body || '';
      const data = notification.data || {};

      // On iOS, the native visual presentation seems unreliable in the current configuration.
      // To ensure the user SEES the notification, we will fallback to scheduling a local notification manually.
      if (Capacitor.getPlatform() === 'ios') {
        logger.info('iOS foreground push received - scheduling manual local notification fallback');

        // Schedule a local notification to ensure it appears visually
        try {
          // Import dynamically to ensure it's available
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.schedule({
            notifications: [{
              id: Math.floor(Math.random() * 100000),
              title: title,
              body: body,
              sound: 'default',
              badge: 1,
              extra: data,
            }],
          });
          logger.success('✅ Manual local notification scheduled for iOS');
        } catch (error) {
          logger.error('❌ Failed to schedule manual local notification', error);
        }

        const payload = this.parseNotificationPayload(data);
        if (payload) {
          this.notifyListeners(payload);
        }
        return;
      }

      // Show a REAL system notification using Local Notifications
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

      logger.success('✅ Local notification shown in system tray');

      // Also notify listeners for any in-app handling if needed
      const payload = this.parseNotificationPayload(data);
      if (payload) {
        this.notifyListeners(payload);
      }
    } catch (error) {
      logger.error('Error showing local notification', error);
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

  private shouldShowNotification(payload: NotificationPayload): boolean {
    if (this.isDuplicate(payload.dedupe_key)) {
      return false;
    }
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

  private isDuplicate(dedupeKey: string): boolean {
    const sent = localStorage.getItem(`${DEDUPE_STORAGE_KEY}:${dedupeKey}`);
    if (sent) {
      return true;
    }
    localStorage.setItem(`${DEDUPE_STORAGE_KEY}:${dedupeKey}`, Date.now().toString());
    return false;
  }

  private handleDeepLink(deepLink: string): void {
    try {
      let path = '';
      if (deepLink.startsWith('plattr://')) {
        path = deepLink.replace('plattr://', '');
      } else if (deepLink.startsWith('http')) {
        const url = new URL(deepLink);
        path = url.pathname;
      } else {
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
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[Notifications] Error handling deep link:', error);
      window.location.href = '/';
    }
  }

  private async sendTokenToBackend(token: string, retryCount = 0): Promise<void> {
    try {
      logger.info(`sendTokenToBackend attempt ${retryCount + 1}`);

      const { supabaseAuth } = await import('@/lib/supabase-auth');

      // Try to get session
      let session: any = null;
      try {
        const result = await supabaseAuth.auth.getSession();
        session = result.data?.session;
      } catch (e) {
        logger.warn('Error getting session', e);
      }

      const userId = session?.user?.id || localStorage.getItem('userId');

      if (!userId) {
        if (retryCount < 10) {
          const delay = Math.min(2000 * Math.pow(1.5, retryCount), 30000);
          logger.warn(`No user ID, retrying in ${delay}ms`);
          setTimeout(() => {
            this.sendTokenToBackend(token, retryCount + 1);
          }, delay);
          return;
        }
        logger.error('No user ID after 10 retries, giving up');
        return;
      }

      const platform = Capacitor.getPlatform() || 'web';
      const platformType = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';

      logger.info('Registering token in Supabase', {
        user_id: userId.substring(0, 8) + '...',
        platform: platformType
      });

      // First ensure user exists in public.users table (required by RLS)
      const { data: existingUser, error: userCheckError } = await supabaseAuth
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        logger.info('User not in users table, creating...');
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
        } else {
          logger.success('User created in users table');
        }
      }

      // Check if this exact token already exists for this user
      const { data: existingToken } = await supabaseAuth
        .from('device_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('device_token', token)
        .maybeSingle();

      if (existingToken) {
        logger.info('Token exists, updating...');
        const { error: updateError } = await supabaseAuth
          .from('device_tokens')
          .update({
            platform: platformType,
            preferences: this.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        if (updateError) throw updateError;
        logger.success('✅ Token updated successfully');
      } else {
        logger.info('Inserting new token...');
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
          logger.error('Insert failed', insertError);
          throw insertError;
        }
        logger.success('✅ Token inserted successfully');
      }
    } catch (error: any) {
      logger.error('Error saving token', error);

      if (retryCount < 3 && (error?.message?.includes('network') || error?.message?.includes('fetch'))) {
        const delay = 3000 * (retryCount + 1);
        setTimeout(() => {
          this.sendTokenToBackend(token, retryCount + 1);
        }, delay);
      }
    }
  }

  // --- Helpers for listeners ---
  private notifyListeners(payload: NotificationPayload) {
    this.listeners.forEach(listener => listener(payload));
  }

  public addListener(listener: (payload: NotificationPayload) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Alias for addListener for compatibility
  public subscribe(listener: (payload: NotificationPayload) => void) {
    return this.addListener(listener);
  }

  // --- Public Getters ---

  /**
   * Get current notification preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get current device token
   */
  public getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Retry device token registration
   * Useful after authentication or when token registration fails
   */
  public async retryTokenRegistration(): Promise<void> {
    logger.info('Retrying device token registration...');
    
    // If we already have a token, try to send it to backend
    if (this.deviceToken) {
      await this.sendTokenToBackend(this.deviceToken);
      return;
    }
    
    // Otherwise, re-initialize to get a new token
    // Reset initialization flag to allow re-initialization
    this.didInitialize = false;
    await this.initialize();
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
    
    // If device token exists, update preferences in backend
    if (this.deviceToken) {
      try {
        const { supabaseAuth } = await import('@/lib/supabase-auth');
        const { data: { session } } = await supabaseAuth.auth.getSession();
        const userId = session?.user?.id || localStorage.getItem('userId');
        
        if (userId) {
          const { error } = await supabaseAuth
            .from('device_tokens')
            .update({ preferences: this.preferences })
            .eq('user_id', userId)
            .eq('device_token', this.deviceToken);
          
          if (error) {
            logger.error('Error updating preferences in backend', error);
          } else {
            logger.success('Preferences updated in backend');
          }
        }
      } catch (error) {
        logger.error('Error updating preferences in backend', error);
      }
    }
  }

  // --- Storage Helpers ---

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

  private savePreferences(): void {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[Notifications] Error saving preferences:', error);
    }
  }

  private loadDeviceToken(): void {
    try {
      const stored = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
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
}

export const notificationService = new NotificationService();
