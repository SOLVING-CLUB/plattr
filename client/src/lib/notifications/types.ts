/**
 * Notification Types and Interfaces
 * Based on Plattr notification requirements spec
 */

export type NotificationCategory = 'transactional' | 'marketing' | 'behavioral';

export type NotificationEventName =
  // Transactional
  | 'order_confirmed'
  | 'payment_failed'
  | 'order_processing'
  | 'order_dispatched'
  | 'order_delivered'
  | 'order_cancelled'
  | 'refund_initiated'
  | 'refund_completed'
  | 'order_delayed'
  | 'action_required'
  // Behavioral
  | 'cart_item_added'
  | 'cart_abandoned_30m'
  | 'cart_abandoned_24h'
  | 'checkout_dropoff_10m'
  | 'browse_nudge'
  // Marketing
  | 'promo_offer'
  | 'festival_pack_launch'
  | 'new_menu_drop'
  | 'reorder_nudge'
  | 'referral_push';

export interface NotificationPayload {
  notification_id: string; // UUID
  category: NotificationCategory;
  event_name: NotificationEventName;
  user_id: string;
  title: string;
  body: string;
  deep_link?: string; // e.g., plattr://orders/{order_id}
  image_url?: string; // For rich push
  cta_text?: string; // e.g., "Track order"
  metadata?: Record<string, any>; // JSON: order_id, cart_id, coupon_code, etc.
  dedupe_key: string; // Important for preventing duplicates
  created_at: string; // ISO timestamp
}

export interface NotificationPreferences {
  order_updates: boolean; // Transactional - default ON
  offers_promotions: boolean; // Marketing - default OFF
  menu_recommendations: boolean; // Marketing - default OFF
  reminders: boolean; // Behavioral - default ON
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  order_updates: true,
  offers_promotions: false,
  menu_recommendations: false,
  reminders: true,
};

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationEventName, { title: string; body: string }> = {
  // Transactional
  order_confirmed: {
    title: 'Order Confirmed ✅',
    body: 'Your Plattr order #{short_id} is confirmed. We\'ll keep you posted.',
  },
  payment_failed: {
    title: 'Payment failed',
    body: 'Your payment didn\'t go through. Tap to retry and confirm your order.',
  },
  order_processing: {
    title: 'We\'re on it 👨‍🍳',
    body: 'Your order is now being prepared. Track updates inside the app.',
  },
  order_dispatched: {
    title: 'Out for delivery 🚚',
    body: 'Your order #{short_id} is on the way. ETA: {eta}',
  },
  order_delivered: {
    title: 'Delivered ✅',
    body: 'Hope everyone loved it! Rate your experience in 10 seconds.',
  },
  order_cancelled: {
    title: 'Order cancelled',
    body: 'Your order #{short_id} has been cancelled. Tap to view details.',
  },
  refund_initiated: {
    title: 'Refund initiated',
    body: 'Your refund for order #{short_id} has been initiated. It will reflect in 3-5 business days.',
  },
  refund_completed: {
    title: 'Refund completed',
    body: 'Your refund for order #{short_id} has been processed.',
  },
  order_delayed: {
    title: 'Update on your delivery',
    body: 'Slight delay for order #{short_id}. Updated ETA: {eta}.',
  },
  action_required: {
    title: 'Quick confirmation needed',
    body: 'We need 1 detail to proceed with order #{short_id}. Tap to confirm.',
  },
  // Behavioral
  cart_item_added: {
    title: 'Added to cart',
    body: '{dish_name} is in your cart. Checkout when ready.',
  },
  cart_abandoned_30m: {
    title: 'Still planning the order?',
    body: 'Your cart is ready. Checkout in 2 taps.',
  },
  cart_abandoned_24h: {
    title: 'Need help finalizing the menu?',
    body: 'Tell us the headcount & budget — we\'ll suggest a perfect platter.',
  },
  checkout_dropoff_10m: {
    title: 'Almost done',
    body: 'Complete your order to lock the slot for your event.',
  },
  browse_nudge: {
    title: 'Explore our menu',
    body: 'Discover new dishes perfect for your next gathering.',
  },
  // Marketing
  promo_offer: {
    title: 'Limited-time offer 🎉',
    body: 'Flat ₹{x} off on bulk orders today. Tap to apply.',
  },
  festival_pack_launch: {
    title: 'Festival special packs',
    body: 'Celebrate with our curated festival menus. Order now!',
  },
  new_menu_drop: {
    title: 'New menu available',
    body: 'Check out our latest additions. Something new for everyone!',
  },
  reorder_nudge: {
    title: 'Order again in 1 tap',
    body: 'Reorder your last menu — perfect for your next get-together.',
  },
  referral_push: {
    title: 'Refer & earn',
    body: 'Share Plattr with friends and earn rewards on every referral.',
  },
};

