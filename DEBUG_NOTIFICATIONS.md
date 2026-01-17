# Debugging Push Notifications

## 1. View Console Logs on Mobile (Android)

### Method 1: Chrome DevTools Remote Debugging (Recommended)

1. **Enable USB Debugging on your Android phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your phone to your Mac via USB**

3. **Open Chrome on your Mac:**
   - Go to `chrome://inspect`
   - You should see your device listed
   - Click "inspect" next to your app

4. **View logs:**
   - Open the Console tab
   - Filter by `[Notifications]` to see only notification logs
   - You'll see all console.log statements from your app

### Method 2: Android Logcat (Command Line)

```bash
# Connect your phone via USB
# Then run:
adb logcat | grep -i "notifications"

# Or see all logs:
adb logcat
```

### Method 3: Android Studio Logcat

1. Open Android Studio
2. Connect your phone
3. Open the Logcat tab at the bottom
4. Filter by "Notifications" or your app package name

## 2. Test in Chrome Browser (Web Push Notifications)

**Note:** Web push notifications work differently than native push notifications, but you can test the token registration flow.

### Setup:

1. **Run your app locally:**
   ```bash
   cd /Users/bhanu/Desktop/Plattr/plattr
   npm run dev
   ```

2. **Open Chrome and navigate to:**
   ```
   http://localhost:5173
   ```

3. **Enable notifications:**
   - Chrome will prompt for notification permission
   - Click "Allow"
   - The app will try to register for web push notifications

4. **Check console:**
   - Open Chrome DevTools (F12)
   - Go to Console tab
   - Look for `[Notifications]` logs

**Important:** Web push notifications require:
- HTTPS (or localhost)
- Service Worker registration
- Different FCM setup for web

For now, **testing on a real Android device is recommended** since that's your target platform.

## 2b. View Console Logs on Mobile (iOS)

### Method: Xcode Console (Recommended)

1. Open `plattr/ios/App/App.xcworkspace` in Xcode
2. Run the app on a real device
3. Open **View → Debug Area → Activate Console**
4. Filter logs by `[Notifications]` (JS) or `[Plattr]` (native)

### What tokens to expect on iOS

- **FCM token (used by backend)**: `[Plattr] FCM token:` and `[Notifications] iOS FCM token...`
- **APNs token (not used by backend)**: stored in `localStorage.getItem('plattr_apns_token')`

### TestFlight note (important)

TestFlight uses a **Release** build, which requires `aps-environment=production`.
This repo is configured as:
- Debug: `ios/App/App/AppDebug.entitlements` → `development`
- Release/TestFlight: `ios/App/App/App.entitlements` → `production`

## 3. Debugging Steps

### Step 1: Check if token is received
Look for this log:
```
[Notifications] Device token: <token>
```

On iOS, ensure you also see:
```
[Notifications] iOS FCM token received: <token...>
```

### Step 2: Check if user is logged in
Look for:
```
[Notifications] Registering token directly in Supabase...
user_id: <user_id>
```

### Step 3: Check for errors
Look for:
```
[Notifications] Error saving token to Supabase: <error>
```

### Step 4: Verify in Supabase
1. Go to Supabase Dashboard
2. Navigate to Table Editor → `device_tokens`
3. Check if a row was created

## 4. Common Issues

### Issue: "No user ID available"
**Solution:** Make sure you're logged in before the token is registered. The app will retry automatically when you log in.

### Issue: "Error saving token to Supabase"
**Possible causes:**
- RLS (Row Level Security) policies blocking the insert
- Missing columns in the table
- Network error

**Check:**
1. Supabase RLS policies on `device_tokens` table
2. Table schema matches the insert data
3. Network connectivity

### Issue: Token registered but not in database
**Check:**
- Supabase logs for errors
- RLS policies
- Table permissions

## 5. Manual Token Registration Test

If automatic registration isn't working, you can manually test:

1. **Get your device token:**
   - Check console logs: `[Notifications] Device token: <token>`
   - Or check localStorage: `localStorage.getItem('plattr_device_token')`

2. **Get your user ID:**
   - Check console logs when logged in
   - Or check Supabase `auth.users` table

3. **Manually insert into Supabase:**
   ```sql
   INSERT INTO device_tokens (user_id, device_token, platform, preferences)
   VALUES (
     'your-user-id',
     'your-device-token',
     'android',
     '{"order_updates": true, "offers_promotions": false, "menu_recommendations": false, "reminders": true}'::jsonb
   );
   ```

## 6. Testing Notifications

Once a token is registered:

```bash
curl -X POST https://leltckltotobsibixhqo.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "title": "Test Notification",
    "body": "This is a test notification!",
    "event_name": "order_confirmed",
    "category": "transactional"
  }'
```

Replace `YOUR_USER_ID` with your actual user ID from Supabase.
