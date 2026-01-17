/**
 * Notification Helper Functions
 * Helper functions to create different notification types
 */

import type { NotificationPayload } from './types';
import type { PlattrNotification } from '@/context/NotificationContext';
import { NotificationService } from './service';

/**
 * Create an order status notification
 */
export const createOrderStatusNotification = (
  orderId: string,
  status: 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled' | 'delayed',
  orderNumber?: string,
  estimatedTime?: number
): PlattrNotification => {
  const statusConfig: Record<string, { title: string; body: string; eventName: string }> = {
    confirmed: {
      title: 'Order Confirmed! 🎉',
      body: `Your order #${orderNumber || orderId} has been confirmed and is being prepared.`,
      eventName: 'order_confirmed',
    },
    processing: {
      title: 'Order Being Prepared 👨‍🍳',
      body: `Your order #${orderNumber || orderId} is being prepared with fresh ingredients.`,
      eventName: 'order_processing',
    },
    dispatched: {
      title: 'Out for Delivery 🚚',
      body: `Your order #${orderNumber || orderId} is on its way! ${estimatedTime ? `Estimated arrival: ${estimatedTime} minutes.` : ''}`,
      eventName: 'order_dispatched',
    },
    delivered: {
      title: 'Order Delivered! 📦',
      body: `Your order #${orderNumber || orderId} has been delivered. Enjoy your meal!`,
      eventName: 'order_delivered',
    },
    cancelled: {
      title: 'Order Cancelled',
      body: `Your order #${orderNumber || orderId} has been cancelled.`,
      eventName: 'order_cancelled',
    },
    delayed: {
      title: 'Update on your delivery',
      body: `Slight delay for order #${orderNumber || orderId}. ${estimatedTime ? `Updated ETA: ${estimatedTime} minutes.` : 'We\'ll keep you updated.'}`,
      eventName: 'order_delayed',
    },
  };

  const config = statusConfig[status] || {
    title: 'Order Update',
    body: `Your order #${orderNumber || orderId} status: ${status}`,
    eventName: 'order_confirmed',
  };

  return {
    notification_id: `order-${orderId}-${Date.now()}`,
    category: 'transactional',
    event_name: config.eventName as any,
    user_id: '', // Will be set by the service
    title: config.title,
    body: config.body,
    deep_link: `/orders/${orderId}`,
    metadata: {
      orderId,
      orderNumber,
      status,
      estimatedTime,
    },
    dedupe_key: `order_${status}:${orderId}`,
    created_at: new Date().toISOString(),
    read: false,
    timestamp: new Date(),
  };
};

/**
 * Create a payment notification
 */
export const createPaymentNotification = (
  orderId: string,
  success: boolean,
  amount: number,
  transactionId?: string
): PlattrNotification => {
  return {
    notification_id: `payment-${orderId}-${Date.now()}`,
    category: 'transactional',
    event_name: success ? 'order_confirmed' : 'payment_failed',
    user_id: '',
    title: success ? 'Payment Successful! 💳' : 'Payment Failed ⚠️',
    body: success
      ? `Payment of ₹${amount} for order #${orderId} was successful.`
      : `Payment of ₹${amount} for order #${orderId} failed. Please try again.`,
    deep_link: success ? `/orders/${orderId}` : `/orders/${orderId}/payment`,
    metadata: {
      orderId,
      amount,
      transactionId,
    },
    dedupe_key: `payment_${success ? 'success' : 'failed'}:${orderId}`,
    created_at: new Date().toISOString(),
    read: false,
    timestamp: new Date(),
  };
};

/**
 * Create a promotion notification
 */
export const createPromotionNotification = (
  promotionId: string,
  title: string,
  body: string,
  discount?: number,
  code?: string
): PlattrNotification => {
  return {
    notification_id: `promo-${promotionId}-${Date.now()}`,
    category: 'marketing',
    event_name: 'promo_offer',
    user_id: '',
    title: title || 'Special Promotion! 🎉',
    body: body || (discount ? `Get ${discount}% off on your next order!` : 'Check out our latest offers!'),
    deep_link: `/?coupon=${promotionId}`,
    metadata: {
      promotionId,
      discount,
      code,
    },
    dedupe_key: `promo:${promotionId}`,
    created_at: new Date().toISOString(),
    read: false,
    timestamp: new Date(),
  };
};

/**
 * Create a cart reminder notification
 */
export const createCartReminderNotification = (
  cartId: string,
  type: '30m' | '24h' = '30m'
): PlattrNotification => {
  const config = {
    '30m': {
      title: 'Still planning the order?',
      body: 'Your cart is ready. Checkout in 2 taps.',
      eventName: 'cart_abandoned_30m' as const,
    },
    '24h': {
      title: 'Need help finalizing the menu?',
      body: 'Tell us the headcount & budget — we\'ll suggest a perfect platter.',
      eventName: 'cart_abandoned_24h' as const,
    },
  };

  const selected = config[type];

  return {
    notification_id: `cart-reminder-${cartId}-${Date.now()}`,
    category: 'behavioral',
    event_name: selected.eventName,
    user_id: '',
    title: selected.title,
    body: selected.body,
    deep_link: '/checkout',
    metadata: {
      cartId,
      type,
    },
    dedupe_key: `cart_reminder_${type}:${cartId}`,
    created_at: new Date().toISOString(),
    read: false,
    timestamp: new Date(),
  };
};

/**
 * Send a test notification (for development/testing)
 */
export const sendTestNotification = async (notification: PlattrNotification): Promise<void> => {
  const { notificationService } = await import('./service');
  
  // Convert to NotificationPayload for the service
  const payload: NotificationPayload = {
    notification_id: notification.notification_id,
    category: notification.category,
    event_name: notification.event_name,
    user_id: notification.user_id,
    title: notification.title,
    body: notification.body,
    deep_link: notification.deep_link,
    image_url: notification.image_url,
    cta_text: notification.cta_text,
    metadata: notification.metadata,
    dedupe_key: notification.dedupe_key,
    created_at: notification.created_at,
  };

  // The service will handle showing the notification and notifying listeners
  // For testing, we can manually trigger the notification received handler
  console.log('[Test Notification] Sending:', payload);
};
