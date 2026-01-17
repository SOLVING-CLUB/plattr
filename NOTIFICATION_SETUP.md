# Plattr Notification System - Setup Guide

## Overview

This document provides setup instructions for the Plattr notification system, which supports:
- **Transactional Notifications**: Order tracking and updates (always enabled)
- **Marketing Notifications**: Offers, promotions, new menus (user preference)
- **Behavioral Notifications**: Cart reminders, checkout nudges (user preference)

## Frontend Implementation ✅

The frontend notification system is fully implemented with:
- Capacitor Push Notifications plugin installed
- Notification service with categories and preferences
- Deep linking handler
- Notification settings page
- Integration in App.tsx

## Backend Integration Required

### 1. Device Token Registration

When a user's device token is received, send it to your backend:

**Endpoint**: `POST /api/notifications/register`

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "device_token": "fcm-token-or-apns-token",
  "platform": "ios" | "android" | "web",
  "preferences": {
    "order_updates": true,
    "offers_promotions": false,
    "menu_recommendations": false,
    "reminders": true
  }
}
```

**Implementation Location**: Update `client/src/lib/notifications/service.ts` line 220-228

### 2. Notification Payload Format

All notifications should follow this structure:

```typescript
{
  notification_id: string;        // UUID
  category: "transactional" | "marketing" | "behavioral";
  event_name: string;            // See event names below
  user_id: string;
  title: string;
  body: string;
  deep_link?: string;            // e.g., "plattr://orders/{order_id}"
  image_url?: string;            // For rich push
  cta_text?: string;             // e.g., "Track order"
  metadata?: {                   // JSON object
    order_id?: string;
    cart_id?: string;
    coupon_code?: string;
    // ... other fields
  };
  dedupe_key: string;            // Critical for preventing duplicates
  created_at: string;            // ISO timestamp
}
```

### 3. Transactional Notification Events

These are sent based on order status changes:

| Event Name | When to Send | Deep Link |
|------------|--------------|-----------|
| `order_confirmed` | Payment success or COD confirmed | `plattr://orders/{order_id}` |
| `payment_failed` | Payment gateway failure | `plattr://checkout/{order_id}` |
| `order_processing` | Ops starts processing | `plattr://orders/{order_id}` |
| `order_dispatched` | Vehicle assigned / left kitchen | `plattr://orders/{order_id}` |
| `order_delivered` | Delivery marked complete | `plattr://orders/{order_id}/feedback` |
| `order_cancelled` | Order cancelled | `plattr://orders/{order_id}` |
| `order_delayed` | ETA risk flagged | `plattr://orders/{order_id}/support` |
| `action_required` | Ops needs clarification | `plattr://orders/{order_id}/support-chat` |
| `refund_initiated` | Refund started | `plattr://orders/{order_id}` |
| `refund_completed` | Refund processed | `plattr://orders/{order_id}` |

**Current Order Statuses**: `pending`, `confirmed`, `preparing`, `delivering`, `delivered`, `cancelled`

### 4. Behavioral Notification Events

| Event Name | When to Send | Deep Link |
|------------|--------------|-----------|
| `cart_abandoned_30m` | Cart has items, no checkout after 30 min | `plattr://cart` |
| `cart_abandoned_24h` | Cart has items, no order after 24h | `plattr://cart` |
| `checkout_dropoff_10m` | Checkout started, no payment in 10 mins | `plattr://checkout/{cart_id}` |

### 5. Marketing Notification Events

| Event Name | When to Send | Deep Link |
|------------|--------------|-----------|
| `promo_offer` | Campaign/promotion | `plattr://offers/{coupon_id}` |
| `festival_pack_launch` | Festival packs available | `plattr://collections/{collection_id}` |
| `new_menu_drop` | New menu items | `plattr://menus?tag={tag}` |
| `reorder_nudge` | 7/14/30 days after order | `plattr://reorder/{last_order_id}` |
| `referral_push` | Referral program | `plattr://referrals` |

### 6. Deduplication Logic

**Critical**: Every notification must have a unique `dedupe_key`:

- **Transactional**: `{event_name}:{order_id}` (e.g., `order_confirmed:order-123`)
- **Behavioral**: `{event_name}:{cart_id}` or `{event_name}:{user_id}:{date}`
- **Marketing**: `{event_name}:{campaign_id}:{user_id}`

**TTL Windows**:
- Transactional: Forever (never send same event for same order)
- Behavioral: 24-72 hours
- Marketing: Per campaign per user

### 7. Sending Notifications

**Using Firebase Cloud Messaging (FCM)**:

```javascript
// Example backend code (Node.js)
const admin = require('firebase-admin');

async function sendNotification(deviceToken, payload) {
  const message = {
    token: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      notification_id: payload.notification_id,
      category: payload.category,
      event_name: payload.event_name,
      user_id: payload.user_id,
      deep_link: payload.deep_link || '',
      image_url: payload.image_url || '',
      cta_text: payload.cta_text || '',
      metadata: JSON.stringify(payload.metadata || {}),
      dedupe_key: payload.dedupe_key,
      created_at: payload.created_at,
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'plattr_notifications',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
```

### 8. Trigger Points

**Order Status Changes** (Supabase Database Trigger or Backend):

```sql
-- Example: Trigger on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when status changes
  -- Call your notification service API
  PERFORM pg_notify('order_status_changed', json_build_object(
    'order_id', NEW.id,
    'old_status', OLD.status,
    'new_status', NEW.status,
    'user_id', NEW.user_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_notification
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_order_status_change();
```

**Cart Abandonment** (Scheduled Job):

```javascript
// Run every 30 minutes
// Check for carts with items older than 30 minutes
// Send cart_abandoned_30m notification
```

### 9. User Preferences API

**Update Preferences**: `PUT /api/notifications/preferences`

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "preferences": {
    "order_updates": true,
    "offers_promotions": false,
    "menu_recommendations": false,
    "reminders": true
  }
}
```

**Implementation Location**: Update `client/src/lib/notifications/service.ts` line 247-256

### 10. Firebase Setup

**Android**:
1. Add `google-services.json` to `android/app/`
2. Already configured in `android/app/build.gradle`

**iOS**:
1. Add `GoogleService-Info.plist` to `ios/App/App/`
2. Configure Firebase in Xcode
3. Ensure Push Notifications entitlement is enabled (this repo sets `CODE_SIGN_ENTITLEMENTS` to `ios/App/App/App.entitlements`)
4. Important: when using the backend FCM v1 sender, iOS must register/store an **FCM registration token** (not the raw APNs token).
   - The app now bridges the FCM token from native → JS via `ios/App/App/FCMTokenPlugin.swift`

### 11. Deep Link Configuration

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="plattr" />
</intent-filter>
```

**iOS** (`ios/App/App/Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>plattr</string>
    </array>
  </dict>
</array>
```

## Testing

1. **Test Device Token Registration**: Check console logs for token registration
2. **Test Deep Links**: Use `plattr://orders/123` in browser (mobile)
3. **Test Preferences**: Toggle settings in Notification Settings page
4. **Test Notifications**: Send test notification from Firebase Console

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Set up Firebase project and add config files
3. ⏳ Implement backend API endpoints for token registration
4. ⏳ Set up database triggers for order status changes
5. ⏳ Implement scheduled jobs for behavioral notifications
6. ⏳ Test end-to-end notification flow

## Notes

- Transactional notifications should work even if user opts out of marketing
- All notifications respect user preferences
- Deduplication prevents spam
- Deep links ensure users land on the right screen
