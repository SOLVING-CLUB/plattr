/**
 * React hook for notifications
 */

import { useEffect, useState } from 'react';
import { notificationService } from '@/lib/notifications/service';
import type { NotificationPreferences, NotificationPayload } from '@/lib/notifications/types';

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [deviceToken, setDeviceToken] = useState<string | null>(
    notificationService.getDeviceToken()
  );

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();

    // Set up listeners
    const cleanup = notificationService.setupListeners();

    // Update device token when it changes
    const checkToken = setInterval(() => {
      const token = notificationService.getDeviceToken();
      if (token !== deviceToken) {
        setDeviceToken(token);
      }
    }, 1000);

    return () => {
      cleanup();
      clearInterval(checkToken);
    };
  }, []);

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    await notificationService.updatePreferences(newPreferences);
    setPreferences(notificationService.getPreferences());
  };

  return {
    preferences,
    deviceToken,
    updatePreferences,
  };
}

/**
 * Hook to listen to notification events
 */
export function useNotificationListener(
  callback: (payload: NotificationPayload) => void
) {
  useEffect(() => {
    return notificationService.subscribe(callback);
  }, [callback]);
}

