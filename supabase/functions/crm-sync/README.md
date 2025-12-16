# CRM Sync Edge Function

This Supabase Edge Function syncs data from Plattr to Odoo CRM/ERP.

## Setup

### 1. Create the Tracking Table

Run the SQL migration in Supabase Dashboard → SQL Editor:

```sql
-- See: supabase/migrations/20251216_create_odoo_integration_table.sql
```

### 2. Set Odoo Secrets

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ODOO_URL` | Your Odoo instance URL | `https://your-company.odoo.com` |
| `ODOO_DB` | Odoo database name | `your_database` |
| `ODOO_USERNAME` | Odoo login email/username | `admin@company.com` |
| `ODOO_API_KEY` | Odoo API key (generate in Odoo settings) | `your-api-key` |

**To generate Odoo API key:**
1. Login to Odoo
2. Go to Settings → Users → Select your user
3. Under "API Keys" tab, create a new key
4. Copy and save the key securely

### 3. Deploy the Function

```bash
# From project root
supabase functions deploy crm-sync --no-verify-jwt
```

The `--no-verify-jwt` flag is required for webhook endpoints.

### 4. Configure Webhooks

In Supabase Dashboard → Database → Webhooks, create webhooks pointing to:

```
https://leltckltotobsibixhqo.supabase.co/functions/v1/crm-sync
```

## Webhook Events

| Table | Event | Odoo Action |
|-------|-------|-------------|
| `users` | INSERT | Create Lead |
| `users` | UPDATE | Update Lead |
| `catering_orders` | INSERT | Convert Lead → Opportunity + Create Quotation |
| `corporate_orders` | INSERT | Convert Lead → Opportunity + Create Quotation |
| `bulk_meal_orders` | INSERT | If status=pending: Opportunity + Quotation; If status=paid: Sales Order + Invoice |
| `mealbox_orders` | INSERT | If status=pending: Opportunity + Quotation; If status=paid: Sales Order + Invoice |
| `sixty_min_bulk_orders` | INSERT | Same as bulk_meal_orders |
| `sixty_min_mealbox_orders` | INSERT | Same as mealbox_orders |

## Status Logic

- **pending**: Customer needs clarification → Creates Opportunity + Quotation
- **paid**: Payment completed → Creates confirmed Sales Order + Invoice
- **failed**: Payment failed → No Odoo action (logged only)

## Testing

Test locally:

```bash
supabase functions serve crm-sync

# Test user creation
curl -X POST http://localhost:54321/functions/v1/crm-sync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "users",
    "record": {
      "id": "test-123",
      "username": "testuser",
      "phone": "9876543210",
      "email": "test@example.com"
    }
  }'
```

## File Structure

```
supabase/functions/crm-sync/
├── index.ts              # Main entry point + router
├── odoo-client.ts        # Odoo API client
├── types.ts              # TypeScript interfaces
├── README.md             # This file
└── handlers/
    ├── user-handler.ts   # User → Lead sync
    ├── inquiry-handler.ts # Catering/Corporate → Opportunity + Quotation
    └── order-handler.ts  # Bulk/Mealbox orders with status-based logic
```

## Troubleshooting

### Check Function Logs
Supabase Dashboard → Edge Functions → crm-sync → Logs

### Test Odoo Connection
The function logs authentication status. Check for "Odoo authentication successful" or error messages.

### Common Issues
1. **Auth failed**: Verify ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY are correct
2. **Permission denied**: Ensure Odoo user has CRM and Sales access
3. **Model not found**: Verify Odoo has CRM and Sales modules installed
