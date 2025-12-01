# Supabase CLI Setup Instructions

## Step 1: Login to Supabase

Run this command in your terminal (it will open a browser for authentication):

```bash
supabase login
```

This will:
1. Open your browser
2. Ask you to log in to Supabase
3. Authorize the CLI
4. Save your access token

## Step 2: Link Your Project

After logging in, link your project using the project reference ID:

```bash
supabase link --project-ref leltckltotobsibixhqo
```

Your project reference ID is: **leltckltotobsibixhqo**

(You can also find this in Supabase Dashboard → Settings → General → Reference ID)

## Step 3: Verify Connection

Check that you're connected:

```bash
supabase projects list
```

## Step 4: Deploy Edge Functions

Once linked, you can deploy the functions:

```bash
# Deploy send-otp
supabase functions deploy send-otp

# Deploy verify-otp
supabase functions deploy verify-otp

# Deploy create-payment-intent
supabase functions deploy create-payment-intent
```

## Step 5: Set Environment Variables

Set secrets in Supabase Dashboard:
1. Go to Project Settings → Edge Functions → Secrets
2. Add these secrets:
   - `SUPABASE_URL` = https://leltckltotobsibixhqo.supabase.co
   - `SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
   - `STRIPE_SECRET_KEY` = (your Stripe secret key)
   - `TWOFACTOR_API_KEY` = (your 2factor.in API key)
   - `TWOFACTOR_TEMPLATE_NAME` = PLATTR (optional)

## Alternative: Use Access Token

If you can't use interactive login, you can set an access token:

1. Get your access token from: https://supabase.com/dashboard/account/tokens
2. Set it as an environment variable:
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_token_here
   ```
3. Then run `supabase link --project-ref leltckltotobsibixhqo`

