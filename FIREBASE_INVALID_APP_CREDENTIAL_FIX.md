# Fix: Firebase auth/invalid-app-credential Error

## Error Explanation

The `auth/invalid-app-credential` error typically occurs when:
1. **API Key Restrictions**: Your Firebase API key has restrictions that block phone authentication
2. **reCAPTCHA Configuration**: reCAPTCHA site key is not properly configured
3. **App Registration**: The web app is not properly registered in Firebase
4. **Billing Status**: Even with billing enabled, there might be configuration issues

## Solutions

### Solution 1: Check API Key Restrictions

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials?project=plattr-27430
   - Find your API key (starts with `AIza...`)

2. **Check API Restrictions**
   - Click on your API key
   - Under "API restrictions", make sure:
     - Either "Don't restrict key" is selected, OR
     - "Restrict key" includes:
       - **Identity Toolkit API** (required for phone auth)
       - **Firebase Installations API**
   
3. **Check Application Restrictions**
   - Under "Application restrictions":
     - For development: Select "None" or "HTTP referrers"
     - Add your domains: `localhost`, `127.0.0.1`, your production domain

### Solution 2: Verify Phone Authentication Setup

1. **Enable Phone Authentication**
   - Go to: https://console.firebase.google.com/project/plattr-27430/authentication/providers
   - Click on "Phone"
   - Make sure it's **enabled**
   - Save if you made changes

2. **Check Authorized Domains**
   - Go to: Authentication → Settings → Authorized domains
   - Make sure `localhost` is listed
   - Add your production domain if needed

### Solution 3: Verify Firebase App Configuration

1. **Check Web App Registration**
   - Go to: https://console.firebase.google.com/project/plattr-27430/settings/general
   - Scroll to "Your apps"
   - Make sure your web app is registered
   - Verify the configuration matches your `.env` file

2. **Verify Environment Variables**
   - Check that all `VITE_FIREBASE_*` variables are set correctly
   - Make sure there are no typos or extra spaces
   - Restart dev server after changes

### Solution 4: Enable Required APIs

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/library?project=plattr-27430

2. **Enable Required APIs**
   - Search for and enable:
     - **Identity Toolkit API** (most important)
     - **Firebase Installations API**
     - **Firebase Authentication API**

### Solution 5: Check Billing Status

Even if you see `invalid-app-credential`, it might still be related to billing:

1. **Verify Billing is Enabled**
   - Go to: https://console.firebase.google.com/project/plattr-27430/settings/billing
   - Make sure billing is enabled and active

2. **Use Test Phone Numbers** (No billing needed)
   - Go to: Authentication → Sign-in method → Phone
   - Add test phone numbers for development
   - These work without billing

## Quick Checklist

- [ ] API key has "Identity Toolkit API" enabled (no restrictions or properly restricted)
- [ ] Phone Authentication is enabled in Firebase Console
- [ ] `localhost` is in authorized domains
- [ ] All Firebase environment variables are correct
- [ ] Identity Toolkit API is enabled in Google Cloud Console
- [ ] Billing is enabled (or using test phone numbers)
- [ ] Web app is properly registered in Firebase

## Most Common Fix

**90% of the time**, this error is caused by:
1. API key restrictions blocking Identity Toolkit API
2. Identity Toolkit API not being enabled

**Quick Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=plattr-27430
2. Click your API key
3. Under "API restrictions", ensure "Identity Toolkit API" is allowed
4. Go to: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=plattr-27430
5. Click "Enable" if not already enabled

Then try again!

