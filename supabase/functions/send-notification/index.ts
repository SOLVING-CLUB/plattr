/**
 * Supabase Edge Function: Send Push Notification
 * Sends notifications via Firebase V1 API
 * 
 * Usage:
 * POST /send-notification
 * {
 *   "user_id": "user-uuid",
 *   "title": "Notification Title",
 *   "body": "Notification Body",
 *   "event_name": "order_confirmed",
 *   "deep_link": "plattr://orders/123",
 *   "category": "transactional"
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "plattr-cf2ce";
const FIREBASE_ACCESS_TOKEN = Deno.env.get("FIREBASE_ACCESS_TOKEN");

// Get Firebase access token
async function getFirebaseAccessToken(): Promise<string> {
  if (FIREBASE_ACCESS_TOKEN) {
    return FIREBASE_ACCESS_TOKEN;
  }
  
  // For now, require the token to be set
  // In production, you can use service account JSON to generate tokens
  throw new Error("FIREBASE_ACCESS_TOKEN not set. Get it from: gcloud auth print-access-token");
}

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  event_name?: string;
  deep_link?: string;
  category?: "transactional" | "marketing" | "behavioral";
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const payload: NotificationPayload = await req.json();
    const { user_id, title, body, event_name, deep_link, category = "transactional", metadata } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get device tokens for user
    const { data: tokens, error: tokensError } = await supabase
      .from("device_tokens")
      .select("*")
      .eq("user_id", user_id);

    if (tokensError) {
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No device tokens found for user", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Firebase access token
    let accessToken: string;
    try {
      accessToken = await getFirebaseAccessToken();
    } catch (error: any) {
      return new Response(
        JSON.stringify({ 
          error: error.message || "Firebase access token not configured. Set FIREBASE_ACCESS_TOKEN in Supabase Edge Function environment variables." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Send notification to each device
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tokenData of tokens) {
      // Check preferences
      const preferences = tokenData.preferences || {};
      if (category === "marketing" && !preferences.offers_promotions && !preferences.menu_recommendations) {
        continue; // Skip if user opted out
      }
      if (category === "behavioral" && !preferences.reminders) {
        continue; // Skip if user opted out
      }
      // Transactional notifications always sent

      const notificationPayload = {
        message: {
          token: tokenData.device_token,
          notification: {
            title,
            body,
          },
          data: {
            notification_id: crypto.randomUUID(),
            category,
            event_name: event_name || "",
            user_id,
            deep_link: deep_link || "",
            metadata: JSON.stringify(metadata || {}),
            created_at: new Date().toISOString(),
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "plattr_notifications",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        },
      };

      try {
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(notificationPayload),
          }
        );

        if (!fcmResponse.ok) {
          const errorData = await fcmResponse.json();
          failed++;
          errors.push(`Token ${tokenData.device_token.substring(0, 20)}...: ${errorData.error?.message || "Unknown error"}`);
          
          // Remove invalid tokens
          if (errorData.error?.message?.includes("invalid") || errorData.error?.message?.includes("not found")) {
            await supabase
              .from("device_tokens")
              .delete()
              .eq("id", tokenData.id);
          }
        } else {
          sent++;
        }
      } catch (error) {
        failed++;
        errors.push(`Token ${tokenData.device_token.substring(0, 20)}...: ${error.message || "Network error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

