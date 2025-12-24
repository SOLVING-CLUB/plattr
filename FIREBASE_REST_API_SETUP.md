# Firebase REST API Setup (No Service Account Key Required)

Since your organization blocks service account key creation, we'll use Firebase REST API instead.

## Step 1: Get Firebase Server Key

1. Go to **Firebase Console** → Your Project
2. Click the **⚙️ Settings** icon → **Project Settings**
3. Go to **Cloud Messaging** tab
4. Under **"Cloud Messaging API (Legacy)"**, find **"Server key"**
5. Copy the Server key

**Note:** If you don't see "Server key", you may need to:
- Enable "Cloud Messaging API (Legacy)" in Google Cloud Console
- Or use the newer "Cloud Messaging API (V1)" with OAuth2 (more complex)

## Step 2: Add to Environment Variables

Add to your `.env` file:

```bash
FIREBASE_SERVER_KEY=your_server_key_here
```

**Important:** Keep this key secure! Never commit it to git.

## Step 3: Test the Setup

The code will automatically use REST API when `FIREBASE_SERVER_KEY` is set and no service account key is available.

## How It Works

- **REST API Method:** Uses `https://fcm.googleapis.com/fcm/send` endpoint
- **Authentication:** Uses Server Key in Authorization header
- **No Admin SDK Required:** Works without `firebase-admin` package
- **Same Functionality:** Sends notifications just like Admin SDK

## Security Notes

- Server Key has full access to send notifications
- Store it securely (environment variable, not in code)
- Consider rotating it periodically
- Monitor usage in Firebase Console

## Testing

After setting `FIREBASE_SERVER_KEY`, test with:

```bash
npm run dev
```

Check logs for: `[Notifications] Sent <event_name> via REST API`

## Alternative: Cloud Messaging API (V1)

If Server Key is not available, you can use the newer API with OAuth2:
1. Enable "Cloud Messaging API (V1)" in Google Cloud Console
2. Use OAuth2 token instead of Server Key
3. More secure but requires additional setup

Let me know if you need help with V1 API setup!

