import React, { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useLocation } from 'wouter';
import type { PlattrNotification } from '@/context/NotificationContext';
import type { NotificationEventName } from '@/lib/notifications/types';
import './NotificationCenter.css';

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'transactional' | 'marketing' | 'behavioral'>('all');

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter((n) => n.category === filter);

  const getNotificationIcon = (eventName: NotificationEventName): string => {
    switch (eventName) {
      case 'order_confirmed':
        return '✅';
      case 'order_processing':
        return '👨‍🍳';
      case 'order_dispatched':
        return '🚚';
      case 'order_delivered':
        return '📦';
      case 'order_cancelled':
        return '❌';
      case 'payment_failed':
        return '⚠️';
      case 'refund_initiated':
      case 'refund_completed':
        return '💰';
      case 'order_delayed':
        return '⏰';
      case 'promo_offer':
      case 'festival_pack_launch':
        return '🎉';
      case 'new_menu_drop':
        return '🍽️';
      case 'reorder_nudge':
        return '🔄';
      case 'cart_item_added':
      case 'cart_abandoned_30m':
      case 'cart_abandoned_24h':
        return '🛒';
      case 'checkout_dropoff_10m':
        return '💳';
      case 'browse_nudge':
        return '👀';
      case 'referral_push':
        return '👥';
      default:
        return '🔔';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: PlattrNotification) => {
    if (!notification.read) {
      markAsRead(notification.notification_id);
    }
    if (notification.deep_link) {
      // Parse deep link and navigate
      let path = '';
      
      if (notification.deep_link.startsWith('plattr://')) {
        path = notification.deep_link.replace('plattr://', '');
      } else if (notification.deep_link.startsWith('http')) {
        const url = new URL(notification.deep_link);
        path = url.pathname;
      } else {
        path = notification.deep_link.startsWith('/') ? notification.deep_link : `/${notification.deep_link}`;
      }

      setLocation(path);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-overlay" onClick={() => setIsOpen(false)}>
          <div className="notification-center" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <h2>Notifications</h2>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="action-btn">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="action-btn danger">
                    Clear all
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="close-btn">
                  ✕
                </button>
              </div>
            </div>

            <div className="notification-filters">
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={filter === 'transactional' ? 'active' : ''}
                onClick={() => setFilter('transactional')}
              >
                Orders
              </button>
              <button
                className={filter === 'marketing' ? 'active' : ''}
                onClick={() => setFilter('marketing')}
              >
                Promotions
              </button>
              <button
                className={filter === 'behavioral' ? 'active' : ''}
                onClick={() => setFilter('behavioral')}
              >
                Reminders
              </button>
            </div>

            <div className="notification-list">
              {filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.event_name)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h3>{notification.title}</h3>
                        {!notification.read && <span className="unread-dot"></span>}
                      </div>
                      <p>{notification.body}</p>
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <button
                      className="notification-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.notification_id);
                      }}
                      aria-label="Remove notification"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
