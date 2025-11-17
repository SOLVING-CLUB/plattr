# Firebase Phone Authentication Setup

This project uses Firebase for phone authentication, while all other operations continue to use Supabase.

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Phone Authentication** in Authentication > Sign-in method

### 2. Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on the web app icon (`</>`) or add a web app if you haven't
4. Copy the Firebase configuration object

### 3. Set Environment Variables

#### Client-side (`.env` or `.env.local`)

Add these variables to your client environment:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Server-side (`.env`)

For server-side token verification, you need Firebase Admin SDK credentials:

**Option 1: Service Account JSON (Recommended)**
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Set the environment variable:

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Option 2: Project ID only (for emulator or default credentials)**
```env
FIREBASE_PROJECT_ID=your-project-id
```

### 4. Configure reCAPTCHA

Firebase Phone Authentication uses reCAPTCHA. The implementation uses invisible reCAPTCHA, which should work automatically. If you encounter issues:

1. Make sure your domain is authorized in Firebase Console
2. For local development, add `localhost` to authorized domains in Authentication > Settings > Authorized domains

### 5. Test the Setup

1. Start your development server
2. Navigate to the auth page
3. Enter a phone number
4. You should receive an OTP via SMS
5. Enter the OTP to complete authentication

## How It Works

1. **Client-side (Firebase)**: 
   - User enters phone number
   - Firebase sends OTP via SMS
   - User verifies OTP with Firebase
   - Firebase returns an ID token

2. **Server-side (Supabase sync)**:
   - Client sends Firebase ID token to `/api/auth/firebase-sync`
   - Server verifies the token using Firebase Admin SDK
   - Server creates/updates user in Supabase database
   - Server creates a session for the user

3. **Subsequent Operations**:
   - All other operations (orders, cart, etc.) continue to use Supabase
   - Firebase token is stored in localStorage and sent with API requests
   - Server can verify the token if needed for protected routes

## Troubleshooting

### "Firebase Admin not initialized"
- Make sure you've set `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID` in your server environment variables
- Restart your server after adding environment variables

### "Failed to send OTP"
- Check that Phone Authentication is enabled in Firebase Console
- Verify your Firebase configuration variables are correct
- Check browser console for detailed error messages
- Ensure reCAPTCHA is working (check for reCAPTCHA errors in console)

### "Invalid or expired Firebase token"
- Tokens expire after 1 hour. The client should refresh tokens automatically
- Check that Firebase Admin SDK is properly initialized on the server

## Notes

- Firebase handles phone authentication and OTP delivery
- Supabase handles all user data, orders, cart, and other operations
- The Firebase ID token is used to verify authentication on the server
- User data is synced between Firebase and Supabase after successful authentication

