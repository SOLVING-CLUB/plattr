# Push Notification Setup for Plattr APK

This guide will help you set up push notifications for the Plattr Android app.

## Overview

The notification system uses:
- **Firebase Cloud Messaging (FCM) V1 API** for sending push notifications
- **Capacitor Push Notifications** plugin on the client
- **Supabase Edge Function** (proxies to backend)
- **Backend Server** (handles FCM authentication - no service account key needed!)
- **Database Triggers** for automatic notifications on order status changes

## Quick Start Summary

✅ **Dependencies**: Already installed (`firebase-admin`, `google-auth-library`)  
✅ **Backend Route**: Already created (`/api/notifications/send`)  
✅ **Edge Function**: Already updated to proxy to backend  

**What you need to do:**
1. Set `FIREBASE_PROJECT_ID=plattr-cf2ce` in backend `.env`
2. Set `BACKEND_API_URL` in Supabase secrets
3. Deploy Edge Function
4. Run database migrations
5. Build APK

## Step 1: Firebase Configuration ✅

The Firebase configuration is already set up in:
- `android/app/google-services.json` - Contains Firebase project credentials
- `android/app/build.gradle` - Includes Firebase messaging dependency
- `android/app/src/main/AndroidManifest.xml` - Has notification permissions and channel config
- `android/app/src/main/java/com/caterplanner/app/MainActivity.java` - Creates notification channel on app start

## Step 2: Configure Backend Server for FCM

✅ **Good news**: `firebase-admin` and `google-auth-library` are already installed!

Since service account key creation may be blocked by organization policies, the Edge Function proxies notifications to your backend server, which handles FCM authentication.

### Backend Configuration

Add to your server's `.env` file:

```env
# Required: Firebase Project ID
FIREBASE_PROJECT_ID=plattr-cf2ce

# Optional: Only if you have a service account key file
# FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/service-account.json
# OR
# FIREBASE_SERVICE_ACCOUNT_JSON=<json_string_or_base64>
```

**How it works:**
1. If `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` is set → Uses that
2. Otherwise → Tries Application Default Credentials (works on Google Cloud automatically)
3. If neither works → Falls back to `google-auth-library` with Application Default Credentials

**For local development:**
- Just set `FIREBASE_PROJECT_ID=plattr-cf2ce`
- The backend will try to use Application Default Credentials
- If that fails, you'll see a warning but can still test the flow

**For production (Google Cloud):**
- Application Default Credentials work automatically
- No service account key needed!

## Step 3: Configure Supabase Edge Function

The Edge Function proxies to your backend. Set the backend URL:

### Via Supabase CLI

```bash
# Set your backend API URL (use your production URL in production)
supabase secrets set BACKEND_API_URL=https://your-backend-url.com
```

### Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `BACKEND_API_URL`
   - Value: Your backend server URL (e.g., `https://api.plattr.com` or `http://localhost:5000` for local dev)

## Step 4: Deploy the Edge Function

```bash
cd plattr
supabase functions deploy send-notification
```

## Step 5: Run Database Migrations

Run these SQL migrations in Supabase Dashboard (SQL Editor):

### 1. Create device_tokens table
File: `supabase/migrations/20250104_create_device_tokens_table.sql`

### 2. Create notification triggers (Optional - for automatic notifications)
File: `supabase/migrations/20250105_create_order_notification_triggers.sql`

> **Note**: The database triggers use the `http` extension which may need to be enabled.
> If triggers don't work, notifications can be sent manually from your backend.

## Step 6: Complete Backend .env Configuration

Your server's `.env` file should have:

```env
# Supabase (for device token storage)
SUPABASE_URL=https://leltckltotobsibixhqo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase (required for notifications)
FIREBASE_PROJECT_ID=plattr-cf2ce

# Optional: Only if you have a service account key (not required!)
# FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/service-account.json
# OR
# FIREBASE_SERVICE_ACCOUNT_JSON=<json_string_or_base64>
```

**That's it!** The backend will automatically use Application Default Credentials if no service account is provided.

## Step 7: Build and Test APK

```bash
# Build the Android app
cd plattr
npx cap sync android
cd android
./gradlew assembleDebug

# The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Testing Notifications

### Test via API

```bash
# Register a test device token (from app logs)
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id"}'
```

### Test via Supabase Edge Function

```bash
curl -X POST https://leltckltotobsibixhqo.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test notification",
    "event_name": "order_confirmed",
    "category": "transactional"
  }'
```

## How It Works

1. **User installs app** → App requests notification permission
2. **Permission granted** → FCM generates a device token
3. **Token registration** → App sends token to backend via `POST /api/notifications/register`
4. **Token stored** → Backend stores token in `device_tokens` table
5. **Order status changes** → Database trigger calls Supabase Edge Function
6. **Edge Function** → Proxies request to backend server (`/api/notifications/send`)
7. **Backend server** → Authenticates with Firebase and sends FCM notification
8. **User receives notification** → App shows notification
9. **User taps notification** → App opens to relevant order page via deep link

## Notification Types

| Event | When Sent | Deep Link |
|-------|-----------|-----------|
| `order_confirmed` | After payment success | `plattr://orders/{id}` |
| `order_processing` | When prep starts | `plattr://orders/{id}` |
| `order_dispatched` | When out for delivery | `plattr://orders/{id}` |
| `order_delivered` | When delivered | `plattr://orders/{id}` |
| `order_cancelled` | If cancelled | `plattr://orders/{id}` |

## Troubleshooting

### Notifications not showing
1. Check if device token is registered: `GET /api/notifications/tokens/:userId`
2. Verify Service Account JSON is correctly configured
3. Check Supabase Edge Function logs in Dashboard

### Token not registering
1. Ensure notification permission is granted on device
2. Check app console logs for `[Notifications]` messages
3. Verify backend API is accessible

### "Backend server error" or connection errors
- Verify `BACKEND_API_URL` is set correctly in Supabase secrets
- Check that your backend server is running and accessible
- Test the backend endpoint directly: `POST /api/notifications/send`

### "Firebase Admin not initialized" error
- Set `FIREBASE_PROJECT_ID=plattr-cf2ce` in backend `.env`
- If on Google Cloud, Application Default Credentials should work automatically
- If local dev, you may see warnings but can still test the flow

### "Authentication failed" error
- If using service account: Verify the JSON is valid
- If using Application Default Credentials: Ensure you're on Google Cloud or have `GOOGLE_APPLICATION_CREDENTIALS` set
- Check the project ID matches your Firebase project (`plattr-cf2ce`)

### "INVALID_ARGUMENT" or "UNREGISTERED" error
- The device token is invalid or the app was uninstalled
- These tokens are automatically cleaned up

### Notifications delayed
- Firebase may batch notifications - this is normal
- Ensure device has stable internet connection
- Check if the device is in battery saver mode

## Files Reference

| File | Purpose |
|------|---------|
| `client/src/lib/notifications/service.ts` | Client notification handling |
| `client/src/lib/notifications/types.ts` | Notification types and templates |
| `server/notifications.ts` | Device token management |
| `server/notification-sender.ts` | FCM notification sending |
| `supabase/functions/send-notification/` | Edge Function for FCM |
| `android/app/google-services.json` | Firebase config |
