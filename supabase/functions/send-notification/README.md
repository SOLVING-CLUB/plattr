# Send Notification Edge Function

This Supabase Edge Function sends push notifications via Firebase V1 API.

## Setup

1. Deploy the function:
```bash
supabase functions deploy send-notification
```

2. Set environment variables in Supabase Dashboard:
   - Go to Project Settings → Edge Functions → Environment Variables
   - Add:
     - `FIREBASE_PROJECT_ID=plattr-cf2ce`
     - `FIREBASE_ACCESS_TOKEN=<your-firebase-access-token>`

## Getting Firebase Access Token

You need to get an OAuth2 access token for Firebase. Options:

### Option 1: Use Google Cloud Service Account (Recommended)

1. Create a service account in Google Cloud Console
2. Grant it "Firebase Cloud Messaging Admin" role
3. Generate a key (JSON file)
4. Use `gcloud auth activate-service-account` to authenticate
5. Get token: `gcloud auth print-access-token`

### Option 2: Use Firebase Admin SDK in another service

If you have a service that can generate tokens, call it from the Edge Function.

### Option 3: Manual Token (Temporary)

For testing, you can manually get a token and set it as environment variable (expires in 1 hour).

## Usage

### From Client (Test Notification)

```typescript
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/send-notification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'user-uuid',
    title: 'Test Notification',
    body: 'This is a test!',
    event_name: 'test',
    deep_link: 'plattr://orders/123',
    category: 'transactional'
  })
});
```

### From Database Trigger

Create a database function that calls this Edge Function when order status changes.


