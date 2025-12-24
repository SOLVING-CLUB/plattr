/**
 * Notification Handler Component
 * Handles notification initialization and deep linking
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNotificationListener } from '@/hooks/useNotifications';
import { notificationService } from '@/lib/notifications/service';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPayload } from '@/lib/notifications/types';

export function NotificationHandler() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize notifications on mount
  useEffect(() => {
    console.log('[Notifications] NotificationHandler mounted, initializing...');
    notificationService.initialize();
    const cleanup = notificationService.setupListeners();
    return cleanup;
  }, []);

  // Listen to notification events
  useNotificationListener((payload: NotificationPayload) => {
    // Show toast for foreground notifications
    toast({
      title: payload.title,
      description: payload.body,
      duration: 5000,
    });

    // Handle deep link if provided
    if (payload.deep_link) {
      handleDeepLink(payload.deep_link);
    }
  });

  useEffect(() => {
    // Handle deep links from app launch (when app is opened via notification)
    if (Capacitor.isNativePlatform()) {
      // Handle app URL open (deep link)
      const appUrlOpenListener = CapacitorApp.addListener('appUrlOpen', (event) => {
        console.log('[Notifications] App opened via URL:', event.url);
        handleDeepLink(event.url);
      });

      return () => {
        appUrlOpenListener.remove();
      };
    }
  }, []);

  const handleDeepLink = (url: string) => {
    try {
      // Parse deep link: plattr://orders/{id} or https://plattr.app/orders/{id}
      let path = '';
      
      if (url.startsWith('plattr://')) {
        // Custom scheme: plattr://orders/123
        path = url.replace('plattr://', '');
      } else if (url.includes('plattr') || url.startsWith('http')) {
        // Universal link or HTTP URL
        try {
          const urlObj = new URL(url);
          path = urlObj.pathname;
        } catch {
          // If URL parsing fails, try regex
          const match = url.match(/\/[^?]*/);
          path = match ? match[0] : '';
        }
      } else {
        // Fallback: try to extract path
        const match = url.match(/\/[^?]*/);
        path = match ? match[0] : '';
      }

      // Navigate based on path
      if (path.startsWith('/orders/')) {
        const orderId = path.split('/orders/')[1]?.split('?')[0];
        if (orderId) {
          setLocation(`/orders/${orderId}`, { replace: false });
        }
      } else if (path === '/cart' || path.startsWith('/cart')) {
        setLocation('/checkout', { replace: false });
      } else if (path.startsWith('/offers/')) {
        const couponId = path.split('/offers/')[1]?.split('?')[0];
        if (couponId) {
          setLocation(`/?coupon=${couponId}`, { replace: false });
        }
      } else if (path.startsWith('/menus')) {
        setLocation('/menu', { replace: false });
      } else if (path.startsWith('/reorder/')) {
        const orderId = path.split('/reorder/')[1]?.split('?')[0];
        if (orderId) {
          setLocation(`/orders/${orderId}?reorder=true`, { replace: false });
        }
      } else if (path === '/referrals' || path === '/referral') {
        setLocation('/referral', { replace: false });
      } else {
        // Default to home
        setLocation('/', { replace: false });
      }
    } catch (error) {
      console.error('[Notifications] Error handling deep link:', error);
      setLocation('/', { replace: false });
    }
  };

  return null; // This component doesn't render anything
}

