/**
 * Notification Sender Utility
 * Sends push notifications using Firebase Cloud Messaging V1 API
 * 
 * SETUP REQUIRED (choose one):
 * 1. Set FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/service-account.json
 * 2. Set FIREBASE_SERVICE_ACCOUNT_JSON=<json_string_or_base64>
 * 
 * The Legacy Cloud Messaging API was deprecated in June 2024.
 * This module uses the Firebase Admin SDK or V1 REST API.
 */

import { getUserDeviceTokens, shouldSendNotification } from './notifications';
import type { NotificationPayload } from './notifications';

// Firebase Admin will be initialized lazily (optional, if available)
let firebaseAdmin: any = null;
let messaging: any = null;

// Firebase configuration
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'plattr-cf2ce';
const HAS_SERVICE_ACCOUNT = !!(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

async function initializeFirebase() {
  if (firebaseAdmin && messaging) return;

  try {
    const admin = await import('firebase-admin');
    firebaseAdmin = admin;

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (serviceAccountPath) {
        // Load from file
        try {
          const fs = await import('fs');
          const path = await import('path');
          const serviceAccountPathResolved = path.resolve(process.cwd(), serviceAccountPath);
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPathResolved, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } catch (error: any) {
          console.error('[Notifications] Error loading service account file:', error.message);
          throw error;
        }
      } else if (serviceAccountJson) {
        // Load from JSON string (base64 or plain)
        let accountData;
        try {
          accountData = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString());
        } catch {
          accountData = JSON.parse(serviceAccountJson);
        }
        admin.initializeApp({
          credential: admin.credential.cert(accountData),
        });
      } else if (projectId) {
        // Try Application Default Credentials (for Google Cloud environments)
        try {
          admin.initializeApp({
            projectId: projectId,
          });
          console.log('[Notifications] Using Application Default Credentials');
        } catch (error: any) {
          console.warn('[Notifications] Application Default Credentials not available:', error.message);
          throw error;
        }
      } else {
        console.warn('[Notifications] Firebase Admin not configured.');
        console.warn('[Notifications] Options:');
        console.warn('  1. Set FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/key.json');
        console.warn('  2. Set FIREBASE_SERVICE_ACCOUNT_JSON=<json_string>');
        console.warn('  3. Set FIREBASE_PROJECT_ID=<project_id> (for Application Default Credentials)');
        return;
      }
    }

    messaging = admin.messaging();
    console.log('[Notifications] Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[Notifications] Failed to initialize Firebase Admin:', error);
    console.warn('[Notifications] Install firebase-admin: npm install firebase-admin');
  }
}

/**
 * Get OAuth2 access token for Firebase V1 API
 */
async function getAccessToken(): Promise<string> {
  // Try to get from Google Auth Library if available
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      projectId: FIREBASE_PROJECT_ID,
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    if (accessToken?.token) {
      return accessToken.token;
    }
  } catch (error) {
    // Fall back to manual OAuth2 if library not available
    console.warn('[Notifications] google-auth-library not available, using manual OAuth2');
  }

  // Manual OAuth2 flow (requires service account JSON or credentials)
  throw new Error('OAuth2 authentication not configured. Install google-auth-library or provide service account credentials.');
}

/**
 * Send notification via Firebase V1 API (REST)
 */
async function sendNotificationViaV1API(
  deviceToken: string,
  payload: NotificationPayload
): Promise<void> {
  let accessToken: string;
  
  try {
    accessToken = await getAccessToken();
  } catch (error: any) {
    console.error('[Notifications] Failed to get access token:', error.message);
    throw new Error('Failed to authenticate with Firebase. Install google-auth-library: npm install google-auth-library');
  }

  const message = {
    message: {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        notification_id: payload.notification_id,
        category: payload.category,
        event_name: payload.event_name,
        user_id: payload.user_id,
        deep_link: payload.deep_link || '',
        image_url: payload.image_url || '',
        cta_text: payload.cta_text || '',
        metadata: JSON.stringify(payload.metadata || {}),
        dedupe_key: payload.dedupe_key,
        created_at: payload.created_at,
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'plattr_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  try {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.message?.includes('invalid') || result.error?.message?.includes('not found')) {
        console.warn(`[Notifications] Invalid token, removing: ${deviceToken}`);
        throw new Error('INVALID_TOKEN');
      }
      throw new Error(`FCM V1 API error: ${result.error?.message || response.statusText}`);
    }

    console.log(`[Notifications] Sent ${payload.event_name} via V1 API:`, result.name);
  } catch (error: any) {
    if (error.message === 'INVALID_TOKEN') {
      throw error;
    }
    console.error(`[Notifications] V1 API error:`, error);
    throw error;
  }
}

/**
 * Send notification to a single device
 */
export async function sendNotificationToDevice(
  deviceToken: string,
  payload: NotificationPayload,
  preferences?: any
): Promise<void> {
  // Check if notification should be sent based on preferences
  if (!shouldSendNotification(payload.category, preferences)) {
    console.log(`[Notifications] Skipping ${payload.event_name} - user preferences disabled`);
    return;
  }

  // Try Firebase Admin SDK first
  await initializeFirebase();
  
  // If Admin SDK not available, fall back to V1 REST API
  if (!messaging) {
    console.log('[Notifications] Admin SDK not available, using V1 REST API');
    return sendNotificationViaV1API(deviceToken, payload);
  }

  const message = {
    token: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      notification_id: payload.notification_id,
      category: payload.category,
      event_name: payload.event_name,
      user_id: payload.user_id,
      deep_link: payload.deep_link || '',
      image_url: payload.image_url || '',
      cta_text: payload.cta_text || '',
      metadata: JSON.stringify(payload.metadata || {}),
      dedupe_key: payload.dedupe_key,
      created_at: payload.created_at,
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'plattr_notifications',
      },
    },
  };

  try {
    const response = await messaging.send(message);
    console.log(`[Notifications] Sent ${payload.event_name} to device:`, response);
  } catch (error: any) {
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn(`[Notifications] Invalid token, removing: ${deviceToken}`);
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * Send notification to all user's devices
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const tokens = await getUserDeviceTokens(userId);
  
  if (tokens.length === 0) {
    console.log(`[Notifications] No device tokens found for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const tokenData of tokens) {
    try {
      await sendNotificationToDevice(tokenData.device_token, payload, tokenData.preferences);
      sent++;
    } catch (error: any) {
      failed++;
      console.error(`[Notifications] Failed to send to device ${tokenData.device_token}:`, error);
      
      // Remove invalid tokens
      if (error.message === 'INVALID_TOKEN') {
        const { deleteDeviceToken } = await import('./notifications');
        await deleteDeviceToken(userId, tokenData.device_token);
      }
    }
  }

  return { sent, failed };
}

/**
 * Helper: Create notification payload for order status change
 */
export function createOrderNotificationPayload(
  eventName: string,
  userId: string,
  orderId: string,
  orderNumber?: number,
  additionalData?: Record<string, string>
): NotificationPayload {
  // Import templates dynamically
  const templates: Record<string, { title: string; body: string }> = {
    order_confirmed: { title: 'Order Confirmed ✅', body: 'Your Plattr order #{short_id} is confirmed. We\'ll keep you posted.' },
    order_processing: { title: 'We\'re on it 👨‍🍳', body: 'Your order is now being prepared. Track updates inside the app.' },
    order_dispatched: { title: 'Out for delivery 🚚', body: 'Your order #{short_id} is on the way. ETA: {eta}' },
    order_delivered: { title: 'Delivered ✅', body: 'Hope everyone loved it! Rate your experience in 10 seconds.' },
    order_cancelled: { title: 'Order cancelled', body: 'Your order #{short_id} has been cancelled. Tap to view details.' },
  };
  
  const template = templates[eventName] || { title: 'Order Update', body: 'Your order has been updated' };

  // Format template with variables
  let title = template.title;
  let body = template.body;

  if (orderNumber !== undefined) {
    const shortId = String(orderNumber).padStart(4, '0');
    title = title.replace(/{short_id}/g, shortId);
    body = body.replace(/{short_id}/g, shortId);
  }

  // Replace additional variables
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      title = title.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
  }

  return {
    notification_id: require('crypto').randomUUID(),
    category: 'transactional',
    event_name: eventName,
    user_id: userId,
    title,
    body,
    deep_link: `plattr://orders/${orderId}`,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      ...additionalData,
    },
    dedupe_key: `${eventName}:${orderId}`,
    created_at: new Date().toISOString(),
  };
}

