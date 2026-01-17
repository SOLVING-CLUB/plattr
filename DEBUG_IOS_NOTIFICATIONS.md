# Debug iOS Notifications Not Appearing

## Quick Checks

### 1. **Check iPhone Notification Permissions**
- Go to **iPhone Settings** → **Notifications** → **Plattr**
- Make sure **"Allow Notifications"** is **ON**
- Check that **"Lock Screen"**, **"Notification Center"**, and **"Banners"** are enabled
- If disabled, enable them and try again

### 2. **Check What the App Says**
After tapping "Send Test Notification", look for:
- ✅ **"Test sent! Notification sent to 1 device(s)"** → Edge Function succeeded, but notification might not be showing
- ❌ **"No notifications sent"** or **"Failed: ..."** → Check the error message
- ❌ **"Notifications Disabled"** → Enable in iPhone Settings

### 3. **Check Edge Function Logs**
1. Go to: https://supabase.com/dashboard/project/leltckltotobsibixhqo/functions
2. Click on **`send-notification`**
3. Click **"Logs"** tab
4. Send a test notification from the app
5. Look for:
   - ✅ `[Notification] Sent successfully:` → FCM accepted it
   - ❌ `INVALID` or `UNREGISTERED` → Token is wrong/expired
   - ❌ `Failed to get access token` → Firebase credentials issue

### 4. **Check Device Token Format**
In the app, open browser console (if using Safari remote debugging) or check logs:
- **FCM token** should be: Long string with letters/numbers/hyphens (e.g., `cXyZ123...`)
- **APNs token** (wrong): 64-character hex string (e.g., `a1b2c3d4e5f6...`)
- If you see APNs token format, the token migration didn't work - reinstall the app

### 5. **Test with App in Background**
iOS might suppress notifications when app is in foreground:
1. Send test notification
2. **Immediately press Home button** (or swipe up) to background the app
3. Wait 5-10 seconds
4. Check notification tray

### 6. **Check Firebase Console**
1. Go to Firebase Console → **Cloud Messaging** → **Reports**
2. Look for recent message sends
3. Check delivery status and any errors

## Common Issues & Fixes

### Issue: "No device tokens found"
**Fix:** 
- Make sure you're logged in
- Check that device token was registered in Supabase:
  - Go to Supabase Dashboard → **Table Editor** → **device_tokens**
  - Look for a row with your `user_id`
  - Check `device_token` column - should be an FCM token (long string), not APNs hex

### Issue: "INVALID" or "UNREGISTERED" token error
**Fix:**
- Token is expired or wrong format
- Delete the app and reinstall from TestFlight
- Log in again to register a new token

### Issue: Edge Function says "Sent successfully" but no notification
**Possible causes:**
1. **App is in foreground** → Background the app and try again
2. **Notification permissions denied** → Check iPhone Settings
3. **APNs environment mismatch** → TestFlight uses Production APNs, make sure Firebase is configured for Production
4. **Silent notification** → Check Edge Function logs to see the exact payload sent

### Issue: "Failed to get access token"
**Fix:**
- Check Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
- Make sure `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
- Should be base64-encoded Firebase service account JSON

## Debug Steps

1. **Send test notification** from app
2. **Note the exact message** shown (success/error)
3. **Check Edge Function logs** immediately after
4. **Check iPhone notification permissions**
5. **Try with app in background**
6. **Check device_tokens table** in Supabase to verify token format

## What to Share for Help

If still not working, share:
1. The exact message shown after tapping "Send Test Notification"
2. Edge Function logs (screenshot or copy/paste)
3. Device token format (first 30 characters, from console logs)
4. Whether notification permissions are enabled in iPhone Settings
5. Whether you tried with app in background
