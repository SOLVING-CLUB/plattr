# Firebase Billing Setup for Phone Authentication

## Issue: `auth/billing-not-enabled`

Firebase Phone Authentication requires billing to be enabled on your Firebase project. The free Spark plan does not support phone authentication.

## Solution Options

### Option 1: Enable Billing (Recommended for Production)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/plattr-27430/settings/billing
   - Or: Project Settings → Usage and billing

2. **Upgrade to Blaze Plan**
   - Click "Upgrade" or "Modify plan"
   - Select the **Blaze plan** (pay-as-you-go)
   - Add a payment method (credit card)

3. **Phone Authentication Pricing**
   - Firebase charges per SMS sent
   - Pricing varies by country (India: ~₹0.20-0.50 per SMS)
   - First 10,000 verifications/month are free (if using Firebase's default SMS provider)
   - After that, pay per SMS

4. **Enable Phone Authentication**
   - Go to: Authentication → Sign-in method → Phone
   - Make sure it's enabled

### Option 2: Use Test Phone Numbers (For Development)

You can test phone authentication without billing by using test phone numbers:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/plattr-27430/authentication/providers
   - Click on "Phone" provider

2. **Add Test Phone Numbers**
   - Scroll to "Phone numbers for testing"
   - Click "Add phone number"
   - Add test numbers with test codes:
     - Phone: `+919876543210` (or any format)
     - Code: `123456` (any 6-digit code)
   - You can add multiple test numbers

3. **Use Test Numbers**
   - When testing, use the test phone numbers you configured
   - Enter the test code (e.g., `123456`) when prompted
   - No SMS will be sent, and billing is not required

### Option 3: Use Firebase Emulator (For Local Development)

For local development, you can use Firebase Emulator Suite which doesn't require billing:

1. **Install Firebase Emulator**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init emulators
   ```

2. **Configure Emulator**
   - Select Authentication emulator
   - Run: `firebase emulators:start`

3. **Update Firebase Config**
   - Connect to emulator in development mode
   - Phone auth will work locally without billing

## Current Status

Your Firebase project (`plattr-27430`) needs billing enabled to send real SMS messages.

## Quick Fix for Testing

**For immediate testing**, add a test phone number in Firebase Console:
1. Go to: https://console.firebase.google.com/project/plattr-27430/authentication/providers
2. Click "Phone" → Scroll to "Phone numbers for testing"
3. Add: `+916304725752` with code `123456`
4. Use this number in your app - it will work without billing

## Production Setup

For production, you must:
1. Enable billing (Blaze plan)
2. Set up proper phone number verification
3. Monitor usage and costs
4. Consider implementing rate limiting

## Cost Estimate

- **India SMS**: ~₹0.20-0.50 per SMS
- **Free tier**: First 10,000 verifications/month (if using Firebase's default provider)
- **After free tier**: Pay per SMS

For a small app, costs are typically very low (few hundred rupees per month for moderate usage).

