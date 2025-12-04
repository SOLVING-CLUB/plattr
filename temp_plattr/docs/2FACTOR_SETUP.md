# 2Factor.in SMS Integration Setup

This guide will help you set up 2Factor.in for sending OTP SMS messages in your application.

## Step 1: Create Account on 2Factor.in

1. Visit [https://www.2factor.in/](https://www.2factor.in/)
2. Sign up for a new account
3. Verify your email and complete the registration process
4. Log in to your dashboard

## Step 2: Get Your API Key

1. After logging in, navigate to your **Dashboard** or **API Settings**
2. Find your **API Key** (it will look like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Copy this API key - you'll need it for the environment variable

## Step 3: Create OTP Template (Required)

1. Click **"CREATE NEW OTP TEMPLATE"** button in your dashboard
2. Fill in the form with the following values:

### Template Details:

- **Template Name***: `PLATTR`
  - This is the name you'll use in your `.env` file

- **Sender Id***: `PLATTR` (or `CTRPLN` if PLATTR is not available)
  - Must be exactly 6 characters
  - This appears as the sender name on the SMS

- **Template***: `XXXX is your OTP for Plattr. Valid for 10 minutes. Do not share with anyone.`
  - **Important**: Must contain exactly `XXXX` (4 capital X's) - this will be replaced with the actual OTP
  - Must be less than 150 characters
  - Current length: ~95 characters ✅

### Additional Details:

- **Company Name***: `The Cater Planner` (or `Plattr`)
  - Your company/business name

- **Website***: `plattr.in` (or your actual website URL)
  - Your website domain

3. Click **"SAVE"** button
4. Wait for template approval (usually takes a few hours to 1-2 business days)
5. Once approved, note the exact **Template Name** (case-sensitive) - you'll need it for the `.env` file

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# 2Factor.in Configuration
TWOFACTOR_API_KEY=your-api-key-here
TWOFACTOR_TEMPLATE_NAME=PLATTR

# Optional: Set to 'true' if you want 2factor.in to auto-generate OTP
# Leave as 'false' or unset to use your own generated OTP
TWOFACTOR_USE_AUTO_OTP=false

# IMPORTANT: Disable BYPASS_AUTH to test real OTP flow
# Server-side (disable bypass auth)
BYPASS_AUTH=false

# Client-side (disable bypass auth)
VITE_BYPASS_AUTH=false
```

**⚠️ Important**: To test the actual 2Factor.in integration, you **must** disable BYPASS_AUTH by setting both:
- `BYPASS_AUTH=false` (server-side)
- `VITE_BYPASS_AUTH=false` (client-side)

Otherwise, the OTP flow will be skipped and you'll see: `"BYPASS_AUTH enabled. OTP flow skipped."`

### Environment Variables Explained:

- **TWOFACTOR_API_KEY** (Required): Your 2Factor.in API key from Step 2
- **TWOFACTOR_TEMPLATE_NAME** (Optional): The name of your OTP template. Defaults to `PLATTR` if not set
- **TWOFACTOR_USE_AUTO_OTP** (Optional): Set to `true` if you want 2factor.in to generate the OTP automatically. Defaults to `false` (we generate our own OTP)

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the auth page (`/auth` or `/phone`)

3. Enter a test phone number (10 digits)

4. Click "Send OTP"

5. Check your phone for the OTP message

6. In development mode, the OTP will also be logged to the console and returned in the API response

## API Response Format

The 2Factor.in API returns a JSON response:

```json
{
  "Status": "Success",
  "Details": "OTP Sent Successfully"
}
```

## Troubleshooting

### Getting Phone Call Instead of SMS

If you're receiving a **phone call** instead of an **SMS**, check the following:

1. **Verify API Endpoint**: The code uses `/SMS/` endpoint which should send SMS, not voice calls
   - ✅ Correct: `https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}/{template}`
   - ❌ Wrong: `https://2factor.in/API/V1/{api_key}/VOICE/{phone}/...` or `/CALL/...`

2. **Check 2Factor.in Dashboard Settings**:
   - Log in to your 2Factor.in dashboard
   - Go to **Settings** or **Account Settings**
   - Check if there's a default preference set to "Voice OTP" instead of "SMS OTP"
   - Change it to "SMS OTP" if available

3. **Check Template Type**:
   - In your OTP Templates section, ensure your template is configured for **SMS**, not **Voice**
   - The template should be under "SMS OTP Templates", not "Voice OTP Templates"

4. **Check Account Credits**:
   - Ensure you have **SMS credits**, not just voice credits
   - Go to your dashboard and check your balance
   - SMS and Voice credits are separate

5. **Verify API Response**:
   - Check your server console logs
   - Look for: `📤 [2factor.in] Sending SMS OTP (not voice call)`
   - The API URL should contain `/SMS/` not `/VOICE/` or `/CALL/`

6. **Contact 2Factor.in Support**:
   - If the issue persists, contact 2Factor.in support
   - They can check if your account is configured correctly for SMS

### OTP Not Received

1. **Check API Key**: Ensure `TWOFACTOR_API_KEY` is set correctly in your `.env` file
2. **Check Phone Number**: Ensure the phone number is in correct format (10 digits for India)
3. **Check Template**: If using a template, ensure the template name matches exactly
4. **Check Account Balance**: Log in to 2Factor.in dashboard and check if you have sufficient SMS credits
5. **Check DND Status**: Some numbers might be on DND (Do Not Disturb) list
6. **Check SMS Credits**: Ensure you have SMS credits (not just voice credits)

### Development Mode

In development mode (`NODE_ENV=development`), if the API fails or is not configured, the OTP will be:
- Logged to the console
- Returned in the API response (so you can test without actual SMS)

### Common Errors

- **"Invalid API Key"**: Check that your API key is correct and copied completely
- **"Insufficient Balance"**: Add credits to your 2Factor.in account
- **"Template Not Found"**: Ensure the template name matches exactly (case-sensitive)
- **"Invalid Phone Number"**: Ensure phone number is 10 digits and includes country code in API call

## API Documentation

For more details, refer to the official 2Factor.in API documentation:
- [2Factor.in API Docs](https://2factor.in/API/DOCS/Docs.html)

## Cost Information

2Factor.in typically charges per SMS sent. Check their pricing page for current rates:
- Usually around ₹0.10 - ₹0.20 per SMS in India
- Bulk plans available for better rates

## Security Notes

1. **Never commit your API key to version control**
2. **Use environment variables** for all sensitive configuration
3. **Rate limiting**: Consider implementing rate limiting to prevent abuse
4. **OTP expiration**: OTPs expire after 10 minutes (configurable in your code)

## Alternative: Using 2Factor.in Auto OTP

If you prefer 2Factor.in to generate and manage OTPs:

1. Set `TWOFACTOR_USE_AUTO_OTP=true` in your `.env`
2. The API will return a `Session_ID` that you'll need to store
3. Use the Session_ID to verify the OTP instead of storing it yourself
4. This requires additional code changes to handle Session_ID verification

For now, the implementation uses your own OTP generation and stores it in the database for verification.

