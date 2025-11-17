# Firebase Client-Side Configuration

Your Firebase service account has been configured for the server. Now you need to add the client-side configuration.

## Quick Setup Steps

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **plattr-27430**

2. **Get Web App Configuration**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - If you don't have a web app yet:
     - Click the `</>` (web) icon
     - Register your app (you can name it anything)
     - Copy the configuration
   - If you already have a web app:
     - Click on it to see the configuration

3. **Add to Your .env File**

   Add these lines to your `.env` file in the `platter` directory:

   ```env
   VITE_FIREBASE_API_KEY=AIza... (your actual API key)
   VITE_FIREBASE_AUTH_DOMAIN=plattr-27430.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=plattr-27430
   VITE_FIREBASE_STORAGE_BUCKET=plattr-27430.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=... (your sender ID)
   VITE_FIREBASE_APP_ID=1:... (your app ID)
   ```

4. **Enable Phone Authentication**
   - In Firebase Console, go to **Authentication** > **Sign-in method**
   - Click on **Phone** 
   - Enable it if not already enabled
   - For testing, you can add test phone numbers in the "Phone numbers for testing" section

5. **Authorize Your Domain**
   - Go to **Authentication** > **Settings** > **Authorized domains**
   - Make sure `localhost` is listed (it should be by default)
   - For production, add your actual domain

6. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

## Testing

1. Navigate to your auth page
2. Enter a phone number (format: 10 digits, e.g., `9876543210`)
3. Click "Send OTP"
4. You should receive an SMS with a 6-digit code
5. Enter the code to complete authentication

## Troubleshooting

### "Firebase configuration is incomplete"
- Make sure all `VITE_FIREBASE_*` variables are set in your `.env` file
- Restart your dev server after adding environment variables
- Check that variable names start with `VITE_` (required for Vite)

### "Failed to send OTP"
- Verify Phone Authentication is enabled in Firebase Console
- Check that your phone number format is correct (10 digits)
- Check browser console for detailed error messages
- Make sure reCAPTCHA is working (check for reCAPTCHA errors)

### "Invalid or expired Firebase token" (server-side)
- Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly in `.env`
- Check that the service account JSON is properly formatted (single line)
- Restart your server after updating environment variables

## Current Status

✅ **Server-side**: Configured (Firebase Admin SDK)
⏳ **Client-side**: Needs configuration (see steps above)

