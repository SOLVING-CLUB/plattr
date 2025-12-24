# Firebase Admin SDK Setup - Alternative Methods

Since your organization restricts service account key creation, here are alternative ways to set up Firebase Admin SDK:

## Option 1: Create a New Service Account (Recommended)

1. Go to **Google Cloud Console** → **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Name it: `plattr-notifications` (or any name you prefer)
4. Grant it the role: **"Firebase Cloud Messaging Admin"** or **"Firebase Admin"**
5. Click **"Done"**
6. Click on the newly created service account
7. Go to **"Keys"** tab
8. Click **"Add Key"** → **"Create New Key"** → **JSON**
9. Download the JSON file
10. Use this new service account key instead

## Option 2: Use Application Default Credentials (If on Google Cloud)

If you're running this on Google Cloud Platform (Cloud Run, App Engine, Compute Engine):

1. Set environment variable:
   ```bash
   FIREBASE_PROJECT_ID=plattr-cf2ce
   ```
2. The SDK will automatically use Application Default Credentials
3. No service account key file needed

## Option 3: Use Environment Variable with JSON String

If you can get the JSON content another way (from a team member, secure vault, etc.):

1. Get the JSON content
2. Base64 encode it:
   ```bash
   cat serviceAccountKey.json | base64
   ```
3. Set environment variable:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_JSON=<base64_encoded_string>
   ```
   Or use plain JSON (less secure):
   ```bash
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

## Option 4: Request Permission from Organization Admin

Contact your Google Workspace/Cloud Organization admin to:
1. Allow service account key creation for your project
2. Or grant you permission to create keys for the existing service account

## Option 5: Use Firebase REST API Directly (No Admin SDK)

If you can't use Firebase Admin SDK at all, you can send notifications via Firebase REST API:

```typescript
// Alternative implementation using REST API
async function sendNotificationViaREST(deviceToken: string, payload: any) {
  const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY; // From Firebase Console → Cloud Messaging → Server Key
  
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    }),
  });
  
  return response.json();
}
```

**To get Server Key:**
1. Firebase Console → Project Settings → Cloud Messaging
2. Look for "Server key" (Legacy) or use "Cloud Messaging API (V1)" with OAuth2

## Recommended Approach

**For local development:** Use Option 1 (create new service account)
**For production:** Use Option 2 (Application Default Credentials) if on Google Cloud, or Option 1

## Quick Test

After setting up, test with:

```bash
# Set your chosen method
export FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
# OR
export FIREBASE_PROJECT_ID=plattr-cf2ce

# Run your server
npm run dev
```

Check logs for: `[Notifications] Firebase Admin initialized successfully`

