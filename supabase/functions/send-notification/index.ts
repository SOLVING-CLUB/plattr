/**
 * Supabase Edge Function: Send Push Notification
 * Sends notifications via Firebase Cloud Messaging V1 API
 * 
 * Setup: Set FIREBASE_SERVICE_ACCOUNT_JSON secret with your service account JSON (base64 encoded)
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
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");

// Cache for access token
let cachedAccessToken: { token: string; expiry: number } | null = null;

/**
 * Generate JWT for Firebase service account
 */
async function createJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Base64url encode
  const base64url = (data: any) => {
    const json = JSON.stringify(data);
    const base64 = btoa(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${signatureEncoded}`;
}

/**
 * Get OAuth2 access token using service account
 */
async function getAccessToken(): Promise<string> {
  // Check cache
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiry - 60000) {
    return cachedAccessToken.token;
  }

  if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not configured");
  }

  let serviceAccount;
  try {
    // Try base64 decode first, then plain JSON
    try {
      serviceAccount = JSON.parse(atob(FIREBASE_SERVICE_ACCOUNT_JSON));
    } catch {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    }
  } catch (e) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON format");
  }

  // Create JWT
  const jwt = await createJWT(serviceAccount);

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  
  // Cache the token
  cachedAccessToken = {
    token: tokenData.access_token,
    expiry: Date.now() + (tokenData.expires_in * 1000),
  };

  return tokenData.access_token;
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
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
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
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`[Notification] Found ${tokens.length} device token(s) for user ${user_id}`);
    
    // Log token details for debugging
    tokens.forEach((tokenData, index) => {
      console.log(`[Notification] Token ${index + 1}: Platform=${tokenData.platform}, Length=${tokenData.device_token?.length || 0}, Created=${tokenData.created_at}`);
    });

    // Check Firebase credentials
    if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
      return new Response(
        JSON.stringify({ 
          error: "Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON secret with your service account JSON (base64 encoded)." 
        }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Get access token for V1 API
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error: any) {
      console.error("[Notification] Failed to get access token:", error);
      return new Response(
        JSON.stringify({ error: `Authentication failed: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`[Notification] Sending via V1 API to user ${user_id}`);

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

      try {
        // Use V1 FCM API
        // Include notification block for BACKGROUND notifications (shown by system)
        // Include data block for FOREGROUND notifications (handled by app)
        // Detect platform from database field (most reliable)
        const platform = tokenData.platform || tokenData.device_type || 'unknown';
        const isIOS = platform === 'ios';
        
        console.log(`[Notification] Platform: ${platform}, Token length: ${tokenData.device_token?.length || 0}, Detected iOS: ${isIOS}`);
        
        const v1Payload = {
          message: {
            token: tokenData.device_token,
            // This notification block makes it show as a REAL system notification
            notification: {
              title,
              body,
            },
            // Data is passed along for deep linking and metadata
            data: {
              notification_id: crypto.randomUUID(),
              category,
              event_name: event_name || "",
              user_id,
              title, // Also include in data for foreground handling
              body,  // Also include in data for foreground handling
              deep_link: deep_link || "",
              metadata: JSON.stringify(metadata || {}),
              created_at: new Date().toISOString(),
            },
            // Android-specific settings for REAL system notifications
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channelId: "plattr_notifications",
                icon: "ic_notification",
                color: "#F5A524", // Plattr brand color
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: "PUBLIC",
              },
            },
            // iOS-specific settings - CRITICAL for iOS notifications to show
            apns: {
              headers: {
                "apns-priority": "10", // High priority (required)
                "apns-push-type": "alert", // Required for iOS 13+ (must be "alert" or "background")
              },
              payload: {
                aps: {
                  // CRITICAL: alert object with title/body is required for iOS to show notification
                  alert: {
                    title: title,
                    body: body,
                  },
                  sound: "default",
                  badge: 1,
                  // DO NOT include content-available or mutable-content unless needed
                  // These can cause iOS to treat it as a silent background notification
                },
              },
            },
          },
        };
        
        // Log payload structure for debugging (sanitize token)
        const payloadLog = JSON.stringify(v1Payload, null, 2)
          .replace(new RegExp(tokenData.device_token.substring(0, 30), 'g'), 'TOKEN...');
        console.log(`[Notification] 📤 Sending to ${isIOS ? 'iOS' : 'Android'} device:`);
        
        // Log full payload structure (especially important for iOS apns section)
        if (isIOS) {
          // Log just the apns section separately to ensure it's visible
          if (v1Payload.message.apns) {
            console.log(`[Notification] 🔍 APNs section (CRITICAL for iOS):`, JSON.stringify(v1Payload.message.apns, null, 2));
            console.log(`[Notification] 🔍 APNs headers:`, JSON.stringify(v1Payload.message.apns.headers, null, 2));
            console.log(`[Notification] 🔍 APNs payload.aps:`, JSON.stringify(v1Payload.message.apns.payload.aps, null, 2));
          } else {
            console.error(`[Notification] ❌ CRITICAL ERROR: APNs section is missing!`);
          }
          // Also log full payload (might be truncated)
          console.log(`[Notification] Full iOS payload (first 2000 chars):`, payloadLog.substring(0, 2000));
        } else {
          console.log(`[Notification] Payload structure:`, payloadLog.substring(0, 1000)); // Limit for Android
        }
        
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(v1Payload),
          }
        );

        const responseStatus = fcmResponse.status;
        const responseText = await fcmResponse.text();
        
        console.log(`[Notification] FCM API Response Status: ${responseStatus}`);
        
        if (!fcmResponse.ok) {
          let errorData: any;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: { message: responseText } };
          }
          
          failed++;
          
          const errorMessage = errorData.error?.message || errorData.error?.status || "Unknown error";
          const fullError = JSON.stringify(errorData);
          console.error(`[Notification] ❌ FCM API Error for ${isIOS ? 'iOS' : 'Android'} device:`);
          console.error(`[Notification] Token: ${tokenData.device_token.substring(0, 30)}...`);
          console.error(`[Notification] Error details:`, fullError);
          errors.push(`Token ${tokenData.device_token.substring(0, 20)}...: ${errorMessage}`);
          
          // Remove invalid tokens
          const isInvalidToken = errorMessage.includes("INVALID") || 
                                 errorMessage.includes("UNREGISTERED") ||
                                 errorMessage.includes("not found") ||
                                 errorMessage.includes("APNS") ||
                                 errorMessage.includes("InvalidRegistration");
          if (isInvalidToken) {
            await supabase
              .from("device_tokens")
              .delete()
              .eq("id", tokenData.id);
            console.log(`[Notification] 🗑️ Removed invalid token: ${tokenData.device_token.substring(0, 20)}...`);
          }
        } else {
          let result: any;
          try {
            result = JSON.parse(responseText);
          } catch {
            result = { name: 'success' };
          }
          console.log(`[Notification] ✅ Sent successfully to ${isIOS ? 'iOS' : 'Android'} device`);
          console.log(`[Notification] FCM Message ID:`, result.name);
          
          // For iOS, log additional info to help debug why notifications might not appear
          if (isIOS) {
            console.log(`[Notification] 🔍 iOS Debug Info:`);
            console.log(`[Notification] - Token length: ${tokenData.device_token.length}`);
            console.log(`[Notification] - Platform: ${tokenData.platform || 'unknown'}`);
            console.log(`[Notification] - APNs headers present: ${!!v1Payload.message.apns?.headers}`);
            console.log(`[Notification] - APNs payload.aps.alert present: ${!!v1Payload.message.apns?.payload?.aps?.alert}`);
            console.log(`[Notification] - Notification block present: ${!!v1Payload.message.notification}`);
            console.log(`[Notification] ⚠️ If notification doesn't appear, check:`);
            console.log(`[Notification] 1. Is app in foreground? (Background app to test)`);
            console.log(`[Notification] 2. Check Xcode console for "[Plattr] 📨 Notification received"`);
            console.log(`[Notification] 3. Check iPhone Settings → Notifications → Plattr`);
          }
          
          sent++;
        }
      } catch (error: any) {
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
  } catch (error: any) {
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
