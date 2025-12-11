# Supabase Edge Functions Deployment Guide

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Get your project ref from Supabase Dashboard → Settings → General → Reference ID)

## Environment Variables

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (for payment intents)
- `TWOFACTOR_API_KEY` or `BULK_SMS_API_KEY` - Your 2factor.in API key (for SMS)
- `TWOFACTOR_TEMPLATE_NAME` - Your SMS template name (optional, defaults to 'PLATTR')

## Deploy Functions

Deploy each function:

```bash
# Deploy send-otp function
supabase functions deploy send-otp

# Deploy verify-otp function
supabase functions deploy verify-otp

# Deploy create-payment-intent function
supabase functions deploy create-payment-intent
```

## Apply RLS Policies

Run the migration to set up Row Level Security:

```bash
# Apply RLS policies
supabase db push
```

Or manually run the SQL in Supabase Dashboard → SQL Editor:
- Copy contents of `supabase/migrations/001_rls_policies.sql`
- Paste and run in SQL Editor

## Testing

Test each function:

```bash
# Test send-otp
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'

# Test verify-otp
curl -X POST https://your-project-ref.supabase.co/functions/v1/verify-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "otp": "123456"}'

# Test create-payment-intent (requires auth token)
curl -X POST https://your-project-ref.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer USER_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cartItems": []}'
```

## Local Development

To test functions locally:

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve functions locally
supabase functions serve send-otp --no-verify-jwt
supabase functions serve verify-otp --no-verify-jwt
supabase functions serve create-payment-intent --no-verify-jwt
```

## Troubleshooting

1. **Function not found**: Make sure you've deployed the function
2. **Authentication errors**: Check that you're passing the correct auth token
3. **Database errors**: Verify RLS policies are applied correctly
4. **SMS not sending**: Check 2factor.in API key and template name
5. **Stripe errors**: Verify Stripe secret key is set correctly

