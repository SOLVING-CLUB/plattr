/**
 * Notification Service
 * Handles push notifications, preferences, and deep linking
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
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
const DEDUPE_STORAGE_KEY = 'plattr_notification_dedupe';

class NotificationService {
  private deviceToken: string | null = null;
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private listeners: Set<(payload: NotificationPayload) => void> = new Set();

  constructor() {
    this.loadPreferences();
    this.loadDeviceToken();
  }

  /**
   * Initialize push notifications
   * Call this when app starts
   */
  async initialize(): Promise<void> {
    console.log('[Notifications] Initializing...', { isNative: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform() });
    
    if (!Capacitor.isNativePlatform()) {
      console.log('[Notifications] Web platform detected - push notifications only work on native (iOS/Android)');
      console.log('[Notifications] For testing, build and run on device/emulator');
      return;
    }

    try {
      console.log('[Notifications] Requesting push notification permissions...');
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      console.log('[Notifications] Permission result:', permission);
      
      if (permission.receive === 'granted') {
        console.log('[Notifications] Permission granted, registering for push...');
        // Register for push
        await PushNotifications.register();
        console.log('[Notifications] Registration initiated, waiting for token...');
      } else {
        console.warn('[Notifications] Permission denied:', permission);
      }
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

    // Handle registration
    const registrationListener = PushNotifications.addListener('registration', (token) => {
      console.log('[Notifications] Device token:', token.value);
      this.deviceToken = token.value;
      this.saveDeviceToken(token.value);
      // TODO: Send token to backend
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
   */
  private handleNotificationReceived(notification: any): void {
    try {
      const payload = this.parseNotificationPayload(notification.data);
      if (payload && this.shouldShowNotification(payload)) {
        // Show in-app notification or toast
        this.notifyListeners(payload);
      }
    } catch (error) {
      console.error('[Notifications] Error handling received notification:', error);
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
   * Send device token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { apiRequest } = await import('@/lib/queryClient');
      const { Capacitor } = await import('@capacitor/core');
      
      // Get current user
      const { supabaseAuth } = await import('@/lib/supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      
      // Fallback to localStorage if no session
      const userId = session?.user?.id || localStorage.getItem('userId');
      
      if (!userId) {
        console.warn('[Notifications] No user ID available, skipping token registration');
        return;
      }

      const platform = Capacitor.getPlatform() || 'web';
      
      await apiRequest('POST', '/api/notifications/register', {
        user_id: userId,
        device_token: token,
        platform: platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
        preferences: this.preferences,
      });
      
      console.log('[Notifications] Token saved to backend');
    } catch (error) {
      console.error('[Notifications] Error sending token to backend:', error);
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
      this.deviceToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('[Notifications] Error loading device token:', error);
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

