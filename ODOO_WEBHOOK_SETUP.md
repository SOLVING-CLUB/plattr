# Odoo Webhook Setup Guide

This guide will help you set up webhooks to sync orders from Supabase to Odoo.

## Prerequisites

1. ✅ Edge Function `crm-sync` is deployed
2. ✅ Odoo secrets are configured in Supabase
3. ✅ You have access to Supabase Dashboard

## Step 1: Get Your Project Details

1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. Note down:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **Service Role Key**: (keep this secret!)

## Step 2: Configure Webhooks in Supabase Dashboard

For each order table, create a webhook:

### Webhook Configuration Template

1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **"Create a new webhook"**
3. Fill in:

**General:**
- **Name**: `{table_name}_to_odoo` (e.g., `bulk_meal_orders_to_odoo`)
- **Table**: Select the table (e.g., `bulk_meal_orders`)
- **Events**: Check `INSERT` and `UPDATE`

**HTTP Request:**
- **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/crm-sync`
- **HTTP Method**: `POST`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  ```
- **HTTP Request Body** (select "JSON"):
  ```json
  {
    "type": "{{$event.type}}",
    "table": "{{$event.table}}",
    "record": {{$event.record}},
    "old_record": {{$event.old_record}}
  }
  ```

### Tables to Configure

Create webhooks for these tables:

1. ✅ `bulk_meal_orders`
2. ✅ `mealbox_orders`
3. ✅ `sixty_min_bulk_orders`
4. ✅ `sixty_min_mealbox_orders`

## Step 3: Verify Edge Function is Deployed

```bash
# From project root
supabase functions deploy crm-sync --no-verify-jwt
```

## Step 4: Set Odoo Secrets

In **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, add:

- `ODOO_URL`: Your Odoo instance URL (e.g., `https://your-company.odoo.com`)
- `ODOO_DB`: Your Odoo database name
- `ODOO_USERNAME`: Your Odoo username/email
- `ODOO_API_KEY`: Your Odoo API key

**To get Odoo API key:**
1. Login to Odoo
2. Go to **Settings** → **Users** → Select your user
3. Under **"API Keys"** tab, create a new key
4. Copy and save securely

## Step 5: Test the Integration

1. **Create a test order** in your app
2. **Check Supabase logs**:
   - Dashboard → Edge Functions → crm-sync → Logs
   - Look for "Processing bulk meal order" messages
3. **Check Odoo**:
   - Go to **Sales** → **Orders**
   - You should see the new order
   - Test orders will have `[TEST]` prefix if using test Razorpay keys

## Troubleshooting

### Orders not appearing in Odoo?

1. **Check webhook is firing**:
   - Dashboard → Database → Webhooks → Click on webhook → View logs
   - Should show successful requests

2. **Check Edge Function logs**:
   - Dashboard → Edge Functions → crm-sync → Logs
   - Look for errors or "Odoo authentication successful"

3. **Check Odoo connection**:
   - Verify all 4 secrets are set correctly
   - Test Odoo API key is valid

4. **Check order status**:
   - Orders with `status='pending'` create Opportunity + Quotation
   - Orders with `status='paid'` create Sales Order + Invoice
   - Orders with `status='failed'` are ignored

### Test payments not marked?

- Test detection uses `RAZORPAY_KEY_ID` environment variable
- If it contains "test" or "rzp_test", orders will be marked with `[TEST]` prefix
- Make sure the secret is set in Supabase Edge Function secrets

## What Gets Synced?

| Order Status | Odoo Action |
|-------------|-------------|
| `pending` | Creates **Opportunity** + **Quotation** |
| `paid` | Creates **Sales Order** + **Invoice** |
| `failed` | No action (logged only) |

## Next Steps

- ✅ Webhooks configured
- ✅ Edge Function deployed
- ✅ Odoo secrets set
- ✅ Test order created
- ✅ Order appears in Odoo

You're all set! 🎉
