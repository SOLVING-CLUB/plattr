# Fix: Getting Voice Calls Instead of SMS OTP

If you're receiving **phone calls** instead of **SMS** for OTP, follow these steps:

## Immediate Actions in 2Factor.in Dashboard

### Step 1: Check Account Default Settings

1. Log in to [2Factor.in Dashboard](https://2factor.in)
2. Click **"MY ACCOUNT"** (top right)
3. Go to **Settings** or **Account Settings**
4. Look for these settings:
   - **"Default OTP Method"** → Set to **"SMS"**
   - **"Preferred Delivery Method"** → Set to **"SMS"**
   - **"OTP Delivery Preference"** → Set to **"SMS"**
5. Save changes

### Step 2: Verify Template is SMS Type

1. Go to **"SMS OTP"** → **"OTP Templates"** (NOT "VOICE OTP")
2. Verify your template "PLATTR" is listed under **"SMS OTP Templates"**
3. If it's under "Voice OTP Templates", you need to create a new SMS template

### Step 3: Check API Settings

1. Go to **"API Docs"** in navigation
2. Or go to **"MY ACCOUNT"** → **"API Settings"**
3. Look for:
   - **"Default API Method"** → Should be **"SMS"**
   - **"OTP Delivery Type"** → Should be **"SMS"**

### Step 4: Verify Your Code is Correct

Check your server console when sending OTP. You should see:

```
📤 [2factor.in] Sending SMS OTP (not voice call) to +91XXXXXXXXXX...
🔗 [2factor.in] API URL: https://2factor.in/API/V1/API_KEY_HIDDEN/SMS/91XXXXXXXXXX/XXXXXX/PLATTR
```

**CRITICAL**: The URL must contain `/SMS/` NOT `/VOICE/` or `/CALL/`

### Step 5: Contact 2Factor.in Support

If the above doesn't work, contact 2Factor.in support:

- **Email**: support@2factor.in
- **Phone**: +91-22-48-933-933
- **Support Hours**: Check their website

Tell them:
- "I'm using the `/SMS/` endpoint but still receiving voice calls"
- "My account shows SMS balance: 1,999.00 and Voice balance: 0.00"
- "Please check if there's a default setting forcing voice calls"

## Code Verification

Your code in `server/sms.ts` is already correct - it uses:
```typescript
apiUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/${template}`;
```

This is the correct SMS endpoint format.

## Alternative: Try Without Template

If using template causes issues, try without template:

1. In your `.env` file, comment out or remove:
   ```env
   # TWOFACTOR_TEMPLATE_NAME=PLATTR
   ```

2. Restart server and test

This will use the format: `https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}`

## Debugging Steps

1. **Check Server Logs**: Look for the exact API URL being called
2. **Check API Response**: Look for any error messages
3. **Test with Different Phone**: Try a different phone number
4. **Check 2Factor.in Reports**: Go to "Reports" → "SMS OTP" to see delivery logs

## Most Likely Cause

Since your code is correct and uses `/SMS/` endpoint, the issue is most likely:
- **Account-level default setting** in 2Factor.in dashboard forcing voice calls
- **Template misconfiguration** (though yours shows as SMS template)
- **2Factor.in system issue** that needs their support to fix

**Action Required**: Contact 2Factor.in support with your API key and ask them to:
1. Verify your account is configured for SMS delivery
2. Check if there's a default setting forcing voice calls
3. Ensure your template is properly configured for SMS

