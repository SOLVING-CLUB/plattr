/**
 * Analytics Tracking Service
 * Tracks user events to Supabase for internal analytics
 */
import { supabaseAuth } from './supabase-auth';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getSessionId(): string {
  if (!isBrowser()) return '';
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  if (!isBrowser()) return 'unknown';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

async function getUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

interface EventData {
  [key: string]: any;
}

async function trackEvent(eventName: string, eventData: EventData = {}): Promise<void> {
  if (!isBrowser()) return;
  try {
    const userId = await getUserId();
    const sessionId = getSessionId();
    const deviceType = getDeviceType();

    await supabaseAuth.from('user_events').insert({
      user_id: userId,
      event_name: eventName,
      event_data: eventData,
      device_type: deviceType,
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

export const analytics = {
  trackPageView: (screen: string, category?: string) => {
    return trackEvent('page_view', { screen, category });
  },

  trackAddToCart: (dishId: string, dishName: string, price: number, quantity: number, category?: string) => {
    return trackEvent('add_to_cart', { dish_id: dishId, dish_name: dishName, price, quantity, category });
  },

  trackRemoveFromCart: (dishId: string, dishName: string) => {
    return trackEvent('remove_from_cart', { dish_id: dishId, dish_name: dishName });
  },

  trackCartAbandoned: (cartTotal: number, itemCount: number, items: string[], timeInCartSeconds: number) => {
    return trackEvent('cart_abandoned', { cart_total: cartTotal, item_count: itemCount, items, time_in_cart_seconds: timeInCartSeconds });
  },

  trackCheckoutStarted: (cartTotal: number, itemCount: number, orderType: string) => {
    return trackEvent('checkout_started', { cart_total: cartTotal, item_count: itemCount, order_type: orderType });
  },

  trackCheckoutAbandoned: (step: string, cartTotal: number, timeOnCheckoutSeconds: number) => {
    return trackEvent('checkout_abandoned', { step, cart_total: cartTotal, time_on_checkout_seconds: timeOnCheckoutSeconds });
  },

  trackOrderCompleted: (orderId: string, total: number, itemCount: number, paymentMethod?: string) => {
    return trackEvent('order_completed', { order_id: orderId, total, item_count: itemCount, payment_method: paymentMethod });
  },

  trackAIPlannerInitiated: (guestCount: number, eventType: string, budgetRange?: string) => {
    return trackEvent('ai_planner_initiated', { guest_count: guestCount, event_type: eventType, budget_range: budgetRange });
  },

  trackAIPlannerSuggestionReceived: (guestCount: number, suggestionsCount: number, responseTimeMs: number) => {
    return trackEvent('ai_planner_suggestion_received', { guest_count: guestCount, suggestions_count: suggestionsCount, response_time_ms: responseTimeMs });
  },

  trackAIPlannerSuggestionFailed: (guestCount: number, error: string, retryCount: number) => {
    return trackEvent('ai_planner_suggestion_failed', { guest_count: guestCount, error, retry_count: retryCount });
  },

  trackCouponApplied: (code: string, discountType: string, discountValue: number, discountAmount: number, orderTotal: number) => {
    return trackEvent('coupon_applied', { code, discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount, order_total: orderTotal });
  },

  trackCouponFailed: (code: string, reason: string) => {
    return trackEvent('coupon_failed', { code, reason });
  },

  trackFormAbandoned: (formType: string, lastCompletedField: string, fieldsFilled: string[], fieldsMissing: string[], timeOnFormSeconds: number) => {
    return trackEvent(`${formType}_form_abandoned`, { last_completed_field: lastCompletedField, fields_filled: fieldsFilled, fields_missing: fieldsMissing, time_on_form_seconds: timeOnFormSeconds });
  },

  trackSearch: (query: string, resultsCount: number) => {
    return trackEvent('search', { query, results_count: resultsCount });
  },

  track: trackEvent,
};
