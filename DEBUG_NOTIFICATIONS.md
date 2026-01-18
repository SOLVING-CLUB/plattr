# Debug iOS Notifications

## View Edge Function Logs

The Supabase CLI doesn't support `--tail` flag. Use the Dashboard instead:

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
2. Click on **`send-notification`**
3. Click **"Logs"** tab
4. Send a test notification from the app
5. Logs will appear in real-time

### Option 2: Check Browser Console
The app now logs detailed information:
- `[Test Notification] 📤 Calling Edge Function...`
- `[Test Notification] 📥 Edge Function response:`
- `[Test Notification] ✅ Success!` or `❌ Error`

## Common Issues

### Issue: "No device tokens found"
**Check:**
1. Is user logged in? (Check `localStorage.getItem('userId')`)
2. Is device token registered? (Check `device_tokens` table in Supabase)
3. Is platform set correctly? (Should be `'ios'` for iOS devices)

**Fix:**
```sql
-- Check device tokens
SELECT user_id, platform, device_token, created_at 
FROM device_tokens 
WHERE user_id = 'YOUR_USER_ID';
```

### Issue: "Sent successfully" but notification doesn't appear
**Possible causes:**
1. **App is in foreground** - iOS suppresses notifications when app is open
   - **Fix:** Background the app (press Home button) before sending test
   
2. **Notification permissions disabled**
   - **Fix:** iPhone Settings → Notifications → Plattr → Enable all options
   
3. **APNs certificate/environment mismatch**
   - **Fix:** Check Firebase Console → Project Settings → Cloud Messaging → APNs
   - Development builds need Development APNs key
   - Production builds need Production APNs key

4. **Payload structure issue**
   - **Fix:** Check Edge Function logs for FCM API errors
   - Look for: `INVALID`, `UNREGISTERED`, `APNS` errors

### Issue: FCM API returns error
**Check Edge Function logs for:**
- `❌ FCM API Error` - Shows the exact error from Firebase
- `Token ...: INVALID` - Token is wrong format or expired
- `Token ...: UNREGISTERED` - Token was removed from Firebase
- `Token ...: APNS ...` - APNs configuration issue

## Testing Steps

1. **Send test notification from app**
   - Go to Profile → Notification Settings
   - Tap "Send Test Notification"
   - Check browser console for logs

2. **Check Edge Function logs**
   - Go to Supabase Dashboard → Edge Functions → send-notification → Logs
   - Look for: `✅ Sent successfully` or error messages

3. **Test with app in background**
   - Send test notification
   - Immediately background the app (Home button)
   - Wait 5-10 seconds
   - Check notification tray

4. **Compare with Firebase Console**
   - Send notification via Firebase Console (this works)
   - Compare payload structure in Edge Function logs
   - Ensure they match

## Debug Commands

```bash
# Deploy Edge Function with latest changes
supabase functions deploy send-notification

# Check Supabase project status
supabase status

# View function list
supabase functions list
```

## What to Look For in Logs

### Success Logs:
```
[Notification] Platform: ios, Token length: 152, Detected iOS: true
[Notification] 📤 Sending to iOS device:
[Notification] ✅ Sent successfully to iOS device
[Notification] FCM Message ID: projects/.../messages/...
```

### Error Logs:
```
[Notification] ❌ FCM API Error for iOS device:
[Notification] Token: abc123...
[Notification] Error details: {"error": {"message": "..."}}
```

## Next Steps

If notifications still don't work:
1. Share the Edge Function logs (from Dashboard)
2. Share the browser console logs
3. Check Firebase Console → Cloud Messaging → Reports for delivery status
