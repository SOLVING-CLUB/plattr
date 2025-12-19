/**
 * Facebook Conversions API Client
 * Sends server-side events to Facebook via Supabase Edge Function
 * Uses same event_id for browser pixel and CAPI for deduplication
 */
import { supabaseAuth } from './supabase-auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzQ4ODUsImV4cCI6MjA3ODI1MDg4NX0.dWl2qdTuQujNwi6X0UJOcbwP9GaP-HRfYgsmBnJzLsY';

function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function getUserData() {
  try {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    const user = session?.user;
    
    return {
      external_id: user?.id || null,
      email: user?.email || null,
      phone: user?.phone || null,
      client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
    };
  } catch {
    return {
      external_id: null,
      email: null,
      phone: null,
      client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
    };
  }
}

interface CustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  num_items?: number;
  order_id?: string;
}

interface TrackOptions {
  eventName: string;
  customData?: CustomData;
  eventId?: string;
}

async function sendToCapiEdgeFunction(options: TrackOptions): Promise<void> {
  const { eventName, customData, eventId } = options;
  const generatedEventId = eventId || generateEventId();
  
  try {
    const userData = await getUserData();
    
    const payload = {
      event: {
        event_name: eventName,
        event_id: generatedEventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        action_source: 'website',
        user_data: {
          phone: userData.phone,
          email: userData.email,
          external_id: userData.external_id,
          client_user_agent: userData.client_user_agent,
          fbc: userData.fbc,
          fbp: userData.fbp,
        },
        custom_data: customData,
      },
    };

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-capi`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error('CAPI request failed:', await response.text());
    }
  } catch (error) {
    console.error('Facebook CAPI error:', error);
  }
}

function trackBrowserPixel(eventName: string, customData?: CustomData, eventId?: string): void {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, customData || {}, { eventID: eventId });
  }
}

export const facebookEvents = {
  trackAddToCart: (dishId: string, dishName: string, price: number, quantity: number) => {
    const eventId = generateEventId();
    const customData: CustomData = {
      currency: 'INR',
      value: price * quantity,
      content_ids: [dishId],
      content_type: 'product',
      content_name: dishName,
      num_items: quantity,
    };
    
    trackBrowserPixel('AddToCart', customData, eventId);
    sendToCapiEdgeFunction({ eventName: 'AddToCart', customData, eventId }).catch(() => {});
  },

  trackInitiateCheckout: (cartTotal: number, itemCount: number, orderType: string) => {
    const eventId = generateEventId();
    const customData: CustomData = {
      currency: 'INR',
      value: cartTotal,
      num_items: itemCount,
      content_type: orderType,
    };
    
    trackBrowserPixel('InitiateCheckout', customData, eventId);
    sendToCapiEdgeFunction({ eventName: 'InitiateCheckout', customData, eventId }).catch(() => {});
  },

  trackPurchase: (orderId: string, total: number, itemCount: number, contentIds?: string[]) => {
    const eventId = generateEventId();
    const customData: CustomData = {
      currency: 'INR',
      value: total,
      order_id: orderId,
      num_items: itemCount,
      content_ids: contentIds,
      content_type: 'product',
    };
    
    trackBrowserPixel('Purchase', customData, eventId);
    sendToCapiEdgeFunction({ eventName: 'Purchase', customData, eventId }).catch(() => {});
  },

  trackLead: (formType: string, guestCount?: number, eventType?: string) => {
    const eventId = generateEventId();
    const customData: CustomData = {
      content_name: formType,
      content_type: 'lead',
      num_items: guestCount,
    };
    
    trackBrowserPixel('Lead', customData, eventId);
    sendToCapiEdgeFunction({ eventName: 'Lead', customData, eventId }).catch(() => {});
  },

  trackViewContent: (contentId: string, contentName: string, contentType: string) => {
    const eventId = generateEventId();
    const customData: CustomData = {
      content_ids: [contentId],
      content_name: contentName,
      content_type: contentType,
    };
    
    trackBrowserPixel('ViewContent', customData, eventId);
    sendToCapiEdgeFunction({ eventName: 'ViewContent', customData, eventId }).catch(() => {});
  },
};
