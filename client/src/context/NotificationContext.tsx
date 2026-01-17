import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/notifications/service';
import type { NotificationPayload } from '@/lib/notifications/types';

// Extended notification type that includes UI state
export interface PlattrNotification extends NotificationPayload {
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: PlattrNotification[];
  unreadCount: number;
  addNotification: (notification: PlattrNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  requestPermissions: () => Promise<{ granted: boolean; platform: string }>;
  registerPush: () => Promise<string | null>;
  isInitialized: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<PlattrNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const addNotification = useCallback((notification: PlattrNotification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.find((n) => n.notification_id === notification.notification_id)) {
        return prev;
      }
      return [notification, ...prev].slice(0, 100); // Keep last 100 notifications
    });
  }, []);

  // Initialize notification service
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      await notificationService.initialize();
      
      // Subscribe to new notifications
      unsubscribe = notificationService.subscribe((payload) => {
        const notification: PlattrNotification = {
          ...payload,
          read: false,
          timestamp: new Date(payload.created_at || Date.now()),
        };
        addNotification(notification);
      });
      
      setIsInitialized(true);
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [addNotification]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('plattr_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('plattr_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('plattr_notifications');
  }, []);

  const requestPermissions = useCallback(async () => {
    // Use the notification service's permission request
    // For now, return a mock response since the service handles it internally
    return { granted: true, platform: 'native' };
  }, []);

  const registerPush = useCallback(async () => {
    return notificationService.getDeviceToken();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        requestPermissions,
        registerPush,
        isInitialized,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
