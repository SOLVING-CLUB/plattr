# Edge Functions Secrets Setup

## Required Secrets

You need to set these secrets in Supabase Dashboard for the Edge Functions to work:

### 1. Supabase Configuration (Required for all functions)
- `SUPABASE_URL` = `https://leltckltotobsibixhqo.supabase.co`
- `SUPABASE_ANON_KEY` = Your anon key (from Dashboard → Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (from Dashboard → Settings → API)

### 2. Stripe (Required for `create-payment-intent`)
- `STRIPE_SECRET_KEY` = Your Stripe secret key (from Stripe Dashboard)

### 3. SMS Service (Required for `send-otp`)
- `TWOFACTOR_API_KEY` or `BULK_SMS_API_KEY` = Your 2factor.in API key
- `TWOFACTOR_TEMPLATE_NAME` = `PLATTR` (optional, defaults to 'PLATTR')

## How to Set Secrets

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/leltckltotobsibixhqo/functions
2. Click on "Secrets" tab
3. Add each secret:
   - Click "Add Secret"
   - Enter the name (e.g., `SUPABASE_URL`)
   - Enter the value
   - Click "Save"

### Option 2: Via CLI
```bash
# Set Supabase URL
supabase secrets set SUPABASE_URL=https://leltckltotobsibixhqo.supabase.co

# Set Supabase Anon Key
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here

# Set Supabase Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Set 2Factor API Key
supabase secrets set TWOFACTOR_API_KEY=your_2factor_api_key_here

# Set Template Name (optional)
supabase secrets set TWOFACTOR_TEMPLATE_NAME=PLATTR
```

## Verify Secrets

Check that secrets are set:
```bash
supabase secrets list
```

## Important Notes

- **Never commit secrets to git** - They are stored securely in Supabase
- **Service Role Key** - This has admin access, keep it secure
- **Stripe Secret Key** - Starts with `sk_` (not `pk_`)
- **2Factor API Key** - Get from https://2factor.in/API

## Testing

After setting secrets, test the functions:

```bash
# Test send-otp
curl -X POST https://leltckltotobsibixhqo.supabase.co/functions/v1/send-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'
```

