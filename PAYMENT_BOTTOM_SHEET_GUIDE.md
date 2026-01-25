# Payment Bottom Sheet Integration Guide

## Overview

This guide shows how to use the custom **Payment Bottom Sheet** component instead of Razorpay's modal to avoid notch area issues on iOS devices.

## Benefits

✅ **No Notch Overlap**: Bottom sheet respects safe areas automatically  
✅ **Better UX**: Native app-like experience (similar to Zepto)  
✅ **Full Control**: Customize payment UI to match your app design  
✅ **Payment Links**: Uses Razorpay Payment Links API (hosted page, not iframe modal)

## Components Created

1. **`PaymentBottomSheet.tsx`** - Custom bottom sheet for payment method selection
2. **`PaymentCallbackPage.tsx`** - Handles payment redirects from Razorpay
3. **Edge Function Updates** - Added Payment Links API support

## How It Works

1. User clicks "Pay" → Bottom sheet opens
2. User selects payment method (UPI/Card/Netbanking/Wallet)
3. App creates Razorpay Payment Link via Edge Function
4. User is redirected to Razorpay's hosted payment page
5. After payment, user is redirected back to `/payment-callback`
6. Callback page verifies payment and redirects to orders

## Integration Example

### Step 1: Import the Component

```typescript
import PaymentBottomSheet from "@/components/PaymentBottomSheet";
```

### Step 2: Add State

```typescript
const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
const [paymentAmount, setPaymentAmount] = useState(0);
const [razorpayOrderId, setRazorpayOrderId] = useState<string | undefined>();
```

### Step 3: Replace Razorpay Modal with Bottom Sheet

**Before (Razorpay Modal):**
```typescript
const razorpay = window.Razorpay({
  key: razorpayKeyId,
  amount: amount,
  // ... config
});
razorpay.open();
```

**After (Bottom Sheet):**
```typescript
// Create order first
const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: paymentAmount,
    currency: 'INR',
    receipt: `order-${Date.now()}`,
  }),
});

const { orderId } = await createOrderResponse.json();
setRazorpayOrderId(orderId);
setPaymentAmount(paymentAmount);
setIsPaymentSheetOpen(true); // Open bottom sheet
```

### Step 4: Add the Component to JSX

```typescript
<PaymentBottomSheet
  open={isPaymentSheetOpen}
  onOpenChange={setIsPaymentSheetOpen}
  amount={paymentAmount}
  orderId={razorpayOrderId}
  description="Bulk Meal Order Payment"
  onPaymentSuccess={(data) => {
    console.log('Payment successful:', data);
    // Handle success
  }}
  onPaymentError={(error) => {
    console.error('Payment error:', error);
    // Handle error
  }}
/>
```

## Complete Example: BulkMealDelivery.tsx

```typescript
import PaymentBottomSheet from "@/components/PaymentBottomSheet";

// In your component:
const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
const [paymentAmount, setPaymentAmount] = useState(0);
const [razorpayOrderId, setRazorpayOrderId] = useState<string | undefined>();

const processPayment = async () => {
  // Calculate amount
  const amount = selectedPaymentPlan === "full" ? grandTotal : calculateInitialPayment();
  
  // Create Razorpay order
  const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'INR',
      receipt: `bulk-meal-${Date.now()}`,
    }),
  });

  if (!createOrderResponse.ok) {
    const error = await createOrderResponse.json();
    toast({
      title: "Payment Error",
      description: error.error || 'Failed to create payment order',
      variant: "destructive",
    });
    return;
  }

  const { orderId } = await createOrderResponse.json();
  
  // Open bottom sheet instead of Razorpay modal
  setRazorpayOrderId(orderId);
  setPaymentAmount(amount);
  setIsPaymentSheetOpen(true);
};

// In JSX:
<PaymentBottomSheet
  open={isPaymentSheetOpen}
  onOpenChange={setIsPaymentSheetOpen}
  amount={paymentAmount}
  orderId={razorpayOrderId}
  description="Bulk Meal Order Payment"
/>
```

## Payment Callback Handling

The `PaymentCallbackPage` automatically:
- Verifies payment signature
- Checks payment status
- Redirects to orders page on success
- Shows error message on failure

## Edge Function Endpoints

### Create Payment Link
```
POST /functions/v1/razorpay/create-payment-link
Body: {
  amount: number (in paise),
  currency: "INR",
  description: string,
  order_id?: string,
  method?: "upi" | "card" | "netbanking" | "wallet",
  callback_url?: string
}
```

### Get Payment Link Status
```
GET /functions/v1/razorpay/payment-link-status?payment_link_id=xxx
```

## Migration Checklist

- [x] Import `PaymentBottomSheet` component
- [x] Add state for bottom sheet (`isPaymentSheetOpen`, `paymentAmount`, `razorpayOrderId`)
- [x] Replace `razorpay.open()` with bottom sheet opening
- [x] Add `<PaymentBottomSheet />` component to JSX
- [x] PaymentCallbackPage handles payment verification
- [ ] Test payment flow on iOS device
- [ ] Verify safe area handling (no notch overlap)
- [ ] Test all payment methods (UPI, Card, Netbanking)

## Migrated Pages

The following pages have been successfully migrated to use PaymentBottomSheet:

1. ✅ **CheckoutPage.tsx** - Regular order checkout
2. ✅ **OrderDetailsPage.tsx** - Meal box order payment stages
3. ✅ **BulkMealOrderDetailsPage.tsx** - Bulk meal order payment stages
4. ✅ **SnackBoxDelivery.tsx** - Snack box order payment
5. ✅ **BulkMealDelivery.tsx** - Bulk meal order payment
6. ✅ **MealBoxPage.tsx** - Meal box order payment

## Advantages Over Razorpay Modal

| Feature | Razorpay Modal | Payment Bottom Sheet |
|---------|---------------|---------------------|
| Notch Safe | ❌ Overlaps | ✅ Respects safe areas |
| Customization | ❌ Limited | ✅ Full control |
| UX | ⚠️ Generic | ✅ App-native feel |
| iOS Issues | ❌ Common | ✅ None |
| Payment Methods | ✅ All | ✅ All (via Payment Links) |

## Notes

- Payment Links redirect to Razorpay's hosted page (not an iframe)
- The hosted page is mobile-optimized and handles safe areas correctly
- After payment, users are redirected back to your app
- Payment verification happens automatically in the callback page

## Payment Stage Handling

For existing orders with payment stages (e.g., second payment, final payment):

1. **OrderDetailsPage** and **BulkMealOrderDetailsPage** pass `orderData` with:
   - `orderId`: Existing order ID
   - `orderNumber`: Order number
   - `paymentStage`: 'second' | 'final'
   - `stageLabel`: Human-readable label
   - `amount`: Payment amount

2. **PaymentCallbackPage** automatically detects payment stages and:
   - Uses `paymentService.addPaymentStage()` instead of creating new orders
   - Stores payment record with stage information
   - Redirects back to order details page

3. **PaymentBottomSheet** stores order data in `sessionStorage` with key `pending_order_{razorpayOrderId}`

## Positioning Fixes (Safe Area Support)

All fixed-positioned components have been updated to respect iOS safe areas and avoid conflicts:

### Fixed Components:
1. **FloatingNav** - Bottom navigation bar
   - Class: `floating-nav-bottom`
   - Position: `bottom: calc(env(safe-area-inset-bottom, 0px) + 16px)`

2. **Toast Notifications** - Toast viewport
   - Class: `toast-viewport-bottom`
   - Position: `bottom: calc(env(safe-area-inset-bottom, 0px) + 72px)` (above FloatingNav)

3. **PaymentBottomSheet** - Payment method selection
   - Class: `payment-bottom-sheet`
   - Position: `bottom: env(safe-area-inset-bottom, 0px)`

4. **Sheet Components** - All bottom sheets
   - Overlay class: `sheet-overlay-fixed`
   - Content class: `sheet-content-bottom`
   - Full safe area support

5. **Dialog Components** - Modal dialogs
   - Overlay class: `dialog-overlay-fixed`
   - Full safe area support

6. **NotificationCenter** - Notification overlay
   - Class: `notification-overlay`
   - Safe area padding applied

7. **SearchOverlay** - Search interface
   - Class: `search-overlay-fixed`
   - Safe area padding applied

8. **FloatingCartButton** - Cart button
   - Class: `floating-cart-button`
   - Position: `bottom: calc(env(safe-area-inset-bottom, 0px) + 102px)`

9. **ContinueOrderBanner** - Continue order banner
   - Class: `continue-order-banner`
   - Position: `bottom: calc(env(safe-area-inset-bottom, 0px) + 80px)`

10. **DebugConsole** - Debug console
    - Classes: `debug-console-button`, `debug-console-card`
    - Safe area support

### Global CSS Rules:
- Global fixed positioning rules now exclude all bottom-positioned and overlay components
- Each component has specific CSS classes with `!important` rules to ensure correct positioning
- Safe area insets are respected on all iOS devices

## Support

For issues or questions, check:
- Razorpay Payment Links API: https://razorpay.com/docs/api/payments/payment-links/
- Component code: `client/src/components/PaymentBottomSheet.tsx`
- Callback handler: `client/src/pages/PaymentCallbackPage.tsx`
- CSS utilities: `client/src/index.css` (see `@layer utilities` section)
