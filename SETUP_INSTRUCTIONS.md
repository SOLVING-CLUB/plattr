# Notification System - Setup Instructions

## ✅ What's Already Done

1. ✅ Firebase config files added (google-services.json, GoogleService-Info.plist)
2. ✅ Android deep linking configured
3. ✅ iOS URL scheme configured  
4. ✅ Backend API routes created
5. ✅ Frontend connected to backend
6. ✅ Database migration SQL created
7. ✅ Notification service utilities created

## 🔧 What You Need to Do Now

### Step 1: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251221_create_device_tokens_table.sql
-- Copy and paste the entire file content into Supabase SQL Editor and run it
```

This creates the `device_tokens` table.

### Step 2: Run Order Notification Trigger Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251221_create_order_notification_trigger.sql
-- Copy and paste the entire file content into Supabase SQL Editor and run it
```

This creates triggers that fire when order status changes.

### Step 3: Set Environment Variables

Add these to your `.env` file or environment:

```bash
# Supabase (you probably already have these)
SUPABASE_URL=https://leltckltotobsibixhqo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Firebase Admin (for sending notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
# OR
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...} # base64 or JSON string
```

### Step 4: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 5: Get Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Either:
   - Place it in your project root and set `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
   - OR base64 encode it and set `FIREBASE_SERVICE_ACCOUNT_JSON`

### Step 6: Configure iOS Push Notifications in Xcode

**You need to do this manually:**

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the App target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "Push Notifications"
6. Add "Background Modes" and check "Remote notifications"

### Step 7: Test the Setup

1. **Build and run the app:**
   ```bash
   npm run build
   npm run android:sync  # or ios:sync
   ```

2. **Open the app and log in**

3. **Check console logs** - you should see:
   ```
   [Notifications] Device token: <token>
   [Notifications] Token saved to backend
   ```

4. **Go to Profile → Notifications** and toggle settings

5. **Test sending a notification** from Firebase Console:
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Use the device token from console logs
   - Send a test notification

### Step 8: Test Order Status Notifications

When an order status changes, the database trigger will fire. You need to create a listener service or Edge Function that:

1. Listens to PostgreSQL `pg_notify` events
2. Calls `sendNotificationToUser()` from `server/notification-sender.ts`
3. Sends the notification via Firebase

**Quick test endpoint** (add to `server/routes.ts`):

```typescript
app.post("/api/notifications/test", async (req: Request, res: Response) => {
  const { sendNotificationToUser, createOrderNotificationPayload } = await import('./notification-sender');
  const { userId, orderId, eventName } = req.body;
  
  const payload = createOrderNotificationPayload(eventName, userId, orderId);
  const result = await sendNotificationToUser(userId, payload);
  
  res.json({ success: true, result });
});
```

## 🎯 How It Works

1. **User opens app** → Device token registered → Saved to `device_tokens` table
2. **User changes preferences** → Saved to backend → Updated in `device_tokens` table
3. **Order status changes** → Database trigger fires → Notification sent via Firebase
4. **User taps notification** → Deep link opens → App navigates to correct screen

## 📝 Next Steps After Testing

1. Create a Supabase Edge Function or service to listen to `order_status_changed` events
2. Set up scheduled jobs for cart abandonment notifications
3. Configure marketing notification campaigns
4. Monitor notification delivery rates in Firebase Console

## ⚠️ Important Notes

- **Transactional notifications** always work (even if user opts out of marketing)
- **Deduplication** prevents duplicate notifications
- **Invalid tokens** are automatically removed
- **Deep links** route users to the correct screen

## 🐛 Troubleshooting

**Token not registering:**
- Check console logs for errors
- Verify backend API is running
- Check Supabase RLS policies allow inserts

**Notifications not received:**
- Verify Firebase Admin is initialized
- Check device token is valid
- Verify user preferences allow the notification type
- Check Firebase Console → Cloud Messaging for delivery status

**Deep links not working:**
- Verify AndroidManifest.xml has intent filter
- Verify Info.plist has URL scheme
- Test with: `adb shell am start -W -a android.intent.action.VIEW -d "plattr://orders/test123" com.caterplanner.app`

