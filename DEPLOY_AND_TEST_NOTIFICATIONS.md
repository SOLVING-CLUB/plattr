# Deploy Edge Function & Test iOS Notifications

## Step 1: Deploy the Updated Edge Function

### Option A: Using Supabase CLI (Recommended)

1. **Open Terminal** and navigate to your project:
   ```bash
   cd /Users/bhanu/Desktop/Plattr/plattr
   ```

2. **Check if Supabase CLI is installed:**
   ```bash
   supabase --version
   ```
   If not installed, install it:
   ```bash
   npm install -g supabase
   ```

3. **Login to Supabase** (if not already logged in):
   ```bash
   supabase login
   ```
   This will open a browser window for authentication.

4. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref leltckltotobsibixhqo
   ```
   You may need to enter your database password.

5. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy send-notification
   ```

   You should see output like:
   ```
   Deploying function send-notification...
   Function deployed successfully!
   ```

### Option B: Using Supabase Dashboard (Manual Upload)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/leltckltotobsibixhqo
   - Navigate to **Edge Functions** → **send-notification**

2. **Upload the function:**
   - Click **"Edit Function"** or **"Deploy"**
   - Copy the entire contents of `plattr/supabase/functions/send-notification/index.ts`
   - Paste it into the editor
   - Click **"Deploy"**

### Verify Secrets Are Set

The Edge Function needs these secrets. Check they're configured:

1. **Go to Supabase Dashboard:**
   - **Project Settings** → **Edge Functions** → **Secrets**

2. **Verify these secrets exist:**
   - `FIREBASE_PROJECT_ID` = `plattr-cf2ce`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = (your Firebase service account JSON, base64 encoded)

3. **If `FIREBASE_SERVICE_ACCOUNT_JSON` is missing:**
   - Get your Firebase service account JSON from Firebase Console
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Base64 encode it:
     ```bash
     # On Mac/Linux:
     base64 -i path/to/service-account.json | tr -d '\n'
     ```
   - Copy the base64 string and paste it as the value for `FIREBASE_SERVICE_ACCOUNT_JSON` in Supabase Dashboard

---

## Step 2: Clear App Storage on iPhone

### Option A: Delete & Reinstall App (Most Reliable)

1. **On your iPhone:**
   - Long-press the Plattr app icon
   - Tap **"Remove App"** → **"Delete App"**
   - Confirm deletion

2. **Reinstall from TestFlight:**
   - Open **TestFlight** app
   - Find **Plattr** and tap **"Install"**

3. **Open the app** and log in again

### Option B: Clear App Data (Without Reinstalling)

1. **On your iPhone:**
   - Go to **Settings** → **General** → **iPhone Storage**
   - Find **Plattr** app
   - Tap on it
   - Tap **"Offload App"** (this removes the app but keeps documents)
   - Then tap **"Reinstall App"**

   OR

   - Go to **Settings** → **Plattr** (if it appears)
   - Look for **"Reset"** or **"Clear Data"** options

### Option C: Just Reopen App (Simplest - May Work)

Since we added automatic token migration in the code, you can try:
1. **Force close the app:**
   - Swipe up from bottom (or double-tap home button on older iPhones)
   - Swipe up on the Plattr app to close it

2. **Reopen the app** and log in

The new code will automatically detect and clear any old APNs tokens.

---

## Step 3: Test the Notification

1. **Open the Plattr app** on your iPhone

2. **Log in** with your account

3. **Navigate to Notification Settings:**
   - Go to the app's settings/profile section
   - Find **"Notification Settings"** or **"Notifications"**

4. **Send Test Notification:**
   - Tap the **"Send Test Notification"** button
   - Wait a few seconds

5. **Check for the notification:**
   - Look at the top of your iPhone screen
   - Swipe down from the top to see Notification Center
   - The notification should appear with title and body

### Troubleshooting

**If notification doesn't appear:**

1. **Check notification permissions:**
   - Go to iPhone **Settings** → **Notifications** → **Plattr**
   - Make sure **"Allow Notifications"** is ON
   - Check that **"Lock Screen"**, **"Notification Center"**, and **"Banners"** are enabled

2. **Check the app's response:**
   - After tapping "Send Test Notification", look for a toast message or success/error message
   - Note any error messages

3. **Check device token registration:**
   - In the app, check if you see any logs or messages about "Device token registered"
   - The token should be an FCM token (long string starting with letters/numbers, NOT a 64-character hex string)

4. **Verify Edge Function logs:**
   - Go to Supabase Dashboard → **Edge Functions** → **send-notification** → **Logs**
   - Look for any errors when you send the test notification
   - Check if it says "Sent successfully" or shows error messages

5. **Check Firebase Console:**
   - Go to Firebase Console → **Cloud Messaging** → **Reports**
   - See if messages are being sent and if there are any delivery failures

---

## Quick Command Reference

```bash
# Navigate to project
cd /Users/bhanu/Desktop/Plattr/plattr

# Deploy Edge Function
supabase functions deploy send-notification

# View Edge Function logs
supabase functions logs send-notification

# Check Supabase project status
supabase status
```

---

## What Changed?

The Edge Function was updated to:
- ✅ Use proper `apns-push-type: alert` for iOS (instead of silent background flags)
- ✅ Include `aps.alert` with title and body for iOS notifications
- ✅ Remove conflicting `content-available` and `mutable-content` flags

The client app was updated to:
- ✅ Automatically detect and clear old APNs tokens (64-char hex strings)
- ✅ Only store valid FCM tokens for iOS devices
