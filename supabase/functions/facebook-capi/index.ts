/**
 * Facebook Conversions API Edge Function
 * Sends server-side events to Facebook via Conversions API
 * 
 * Setup:
 * 1. Set environment variables in Supabase Dashboard:
 *    - FACEBOOK_PIXEL_ID: Your Facebook Pixel ID
 *    - FACEBOOK_CAPI_ACCESS_TOKEN: Your Conversions API access token
 * 
 * 2. Deploy:
 *    supabase functions deploy facebook-capi
 * 
 * Usage:
 * POST /functions/v1/facebook-capi
 * {
 *   "event": {
 *     "event_name": "Purchase",
 *     "event_id": "unique-event-id",
 *     "event_time": 1234567890,
 *     "user_data": {
 *       "phone": "+919876543210",
 *       "email": "user@example.com",
 *       "external_id": "user-uuid"
 *     },
 *     "custom_data": {
 *       "currency": "INR",
 *       "value": 1000
 *     }
 *   }
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Hash value using SHA-256 (required by Facebook CAPI)
 */
async function sha256Hash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Normalize phone number for India (+91 format)
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return "91" + cleaned;
}

interface ConversionEvent {
  event_name: string;
  event_id: string;
  event_time?: number;
  user_data?: {
    phone?: string;
    email?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
    external_id?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    num_items?: number;
    order_id?: string;
  };
  event_source_url?: string;
  action_source?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const PIXEL_ID = Deno.env.get("FACEBOOK_PIXEL_ID");
    const ACCESS_TOKEN = Deno.env.get("FACEBOOK_CAPI_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error("Missing Facebook configuration:", { hasPixelId: !!PIXEL_ID, hasToken: !!ACCESS_TOKEN });
      throw new Error("Facebook Pixel ID or Access Token not configured");
    }

    // Parse request body
    const body = await req.json();
    const event: ConversionEvent = body.event;

    if (!event || !event.event_name) {
      throw new Error("Missing event data");
    }

    // Set event time (default to now if not provided)
    const eventTime = event.event_time || Math.floor(Date.now() / 1000);
    
    // Extract client IP from request headers (important for CAPI)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     "unknown";
    
    // Hash user data (required by Facebook CAPI)
    const hashedUserData: Record<string, string> = {};

    if (event.user_data) {
      if (event.user_data.phone) {
        const normalizedPhone = normalizePhone(event.user_data.phone);
        hashedUserData.ph = await sha256Hash(normalizedPhone);
      }
      if (event.user_data.email) {
        hashedUserData.em = await sha256Hash(event.user_data.email);
      }
      if (event.user_data.external_id) {
        hashedUserData.external_id = await sha256Hash(event.user_data.external_id);
      }
      // Use IP from headers if not provided in event
      if (event.user_data.client_ip_address) {
        hashedUserData.client_ip_address = event.user_data.client_ip_address;
      } else if (clientIp !== "unknown") {
        hashedUserData.client_ip_address = clientIp;
      }
      if (event.user_data.client_user_agent) {
        hashedUserData.client_user_agent = event.user_data.client_user_agent;
      }
      if (event.user_data.fbc) {
        hashedUserData.fbc = event.user_data.fbc;
      }
      if (event.user_data.fbp) {
        hashedUserData.fbp = event.user_data.fbp;
      }
    }

    // Build Facebook CAPI event payload
    const fbEvent = {
      event_name: event.event_name,
      event_time: eventTime,
      event_id: event.event_id,
      event_source_url: event.event_source_url || body.source_url,
      action_source: event.action_source || "website",
      user_data: hashedUserData,
      custom_data: event.custom_data || {},
    };

    const fbPayload = {
      data: [fbEvent],
    };

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fbPayload),
      }
    );

    const fbResult = await fbResponse.json();

    // Log to Supabase if configured (optional)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("conversion_events").insert({
          event_name: event.event_name,
          event_id: event.event_id,
          user_id: event.user_data?.external_id || null,
          event_data: {
            custom_data: event.custom_data,
            event_source_url: event.event_source_url,
          },
          facebook_response: fbResult,
          status: fbResponse.ok ? "sent" : "failed",
        });
      } catch (dbError) {
        // Don't fail the request if DB insert fails
        console.error("Failed to log to database:", dbError);
      }
    }

    // Return response
    return new Response(
      JSON.stringify({ 
        success: true, 
        fb_response: fbResult,
        event_id: event.event_id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Facebook CAPI error:", message, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
