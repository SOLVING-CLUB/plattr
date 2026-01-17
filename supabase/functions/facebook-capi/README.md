# Facebook Conversions API Edge Function

This Supabase Edge Function sends server-side events to Facebook via the Conversions API (CAPI).

## Why CAPI?

- **Better tracking accuracy**: Server-side events aren't blocked by ad blockers
- **Deduplication**: Uses same `event_id` as browser pixel to avoid double-counting
- **Privacy compliance**: Better for GDPR/privacy regulations
- **Improved attribution**: More reliable conversion tracking

## Setup

### 1. Get Facebook Pixel ID and Access Token

1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel
3. Go to **Settings** → **Conversions API**
4. Click **Set up manually** or use **Partner Integration**
5. Copy your **Pixel ID** and generate an **Access Token**

### 2. Set Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `FACEBOOK_PIXEL_ID` | Your Facebook Pixel ID | `123456789012345` |
| `FACEBOOK_CAPI_ACCESS_TOKEN` | Your Conversions API access token | `EAABsbCS1iHg...` |

### 3. Deploy the Function

```bash
# From project root
supabase functions deploy facebook-capi
```

### 4. (Optional) Create Conversion Events Table

If you want to log events to Supabase for debugging:

```sql
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  event_data JSONB,
  facebook_response JSONB,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX idx_conversion_events_event_id ON conversion_events(event_id);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at);
```

## How It Works

1. **Client sends event** → `facebook-capi.ts` calls this Edge Function
2. **Edge Function hashes user data** → Phone, email, external_id (SHA-256)
3. **Sends to Facebook** → Via Graph API v18.0
4. **Logs to database** → (Optional) Stores event for debugging

## Event Deduplication

The client generates a unique `event_id` and sends it to:
- **Browser Pixel** (`fbq('track', ...)`)
- **CAPI** (this Edge Function)

Facebook automatically deduplicates events with the same `event_id` within 48 hours.

## Testing

### Test from Client

```typescript
import { facebookEvents } from '@/lib/facebook-capi';

// Test AddToCart
facebookEvents.trackAddToCart('dish-123', 'Butter Chicken', 250, 2);

// Test Purchase
facebookEvents.trackPurchase('order-456', 1000, 3, ['dish-123', 'dish-456']);
```

### Test Directly (cURL)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/facebook-capi \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "event_name": "Purchase",
      "event_id": "test-123",
      "user_data": {
        "phone": "+919876543210",
        "email": "test@example.com"
      },
      "custom_data": {
        "currency": "INR",
        "value": 1000
      }
    }
  }'
```

## Troubleshooting

### Error: "Facebook Pixel ID or Access Token not configured"
- Check that secrets are set in Supabase Dashboard
- Verify secret names are exactly: `FACEBOOK_PIXEL_ID` and `FACEBOOK_CAPI_ACCESS_TOKEN`

### Events not showing in Facebook
- Check Facebook Events Manager → Test Events
- Verify Pixel ID is correct
- Check access token has proper permissions
- Ensure `event_id` is unique and matches browser pixel

### Database insert fails
- This is optional - function will still work
- Check `conversion_events` table exists
- Verify service role key has insert permissions

## Supported Events

- `AddToCart` - When user adds item to cart
- `InitiateCheckout` - When user starts checkout
- `Purchase` - When order is completed
- `Lead` - When user submits a form
- `ViewContent` - When user views a product/page

## User Data Hashing

The function automatically hashes:
- Phone numbers (normalized to +91 format)
- Email addresses
- External IDs (user UUIDs)

This is required by Facebook CAPI for privacy compliance.
