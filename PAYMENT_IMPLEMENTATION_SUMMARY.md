# Payment Details Storage Implementation Summary

## ✅ Completed

### 1. Database Migration (`supabase/migrations/20250102_create_payments_table.sql`)
- ✅ Created `payments` table with all required fields
- ✅ Made migration idempotent (safe to run multiple times)
- ✅ Added foreign key constraint to `users` table
- ✅ Created indexes for performance
- ✅ Added RLS policies for security

### 2. Payment Service (`client/src/lib/supabase-service.ts`)
- ✅ Added `paymentService.create()` - stores initial payment details
- ✅ Added `paymentService.updateStatus()` - updates payment status
- ✅ Added `paymentService.getByOrderId()` - gets all payments for an order
- ✅ Added `paymentService.getByRazorpayPaymentId()` - gets payment by Razorpay ID
- ⚠️ **TODO**: Add `paymentService.addPaymentStage()` method (see code below)

### 3. BulkMealDelivery Integration (`client/src/pages/BulkMealDelivery.tsx`)
- ✅ Updated to store payment details when initial payment is made
- ✅ Stores all payment information including:
  - User ID
  - Razorpay payment IDs and signature
  - Order items with quantities
  - Payment stage (initial/full)
  - Delivery date and time
  - All financial details (subtotal, GST, fees, etc.)

## ⚠️ Pending: Add `addPaymentStage` Method

Add this method to `paymentService` in `client/src/lib/supabase-service.ts` before the closing `};` of the `paymentService` object:

```typescript
  /**
   * Add a new payment stage for an existing order
   * Used when subsequent payments are made (second, final stages)
   */
  async addPaymentStage(paymentData: {
    orderId: string;
    orderType: 'bulk_meal' | 'mealbox' | 'sixty_min_bulk' | 'sixty_min_mealbox';
    orderNumber: number;
    userId: string;
    paymentStage: 'second' | 'final';
    amount: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayReceipt?: string;
    paymentStatus?: 'pending' | 'success' | 'failed' | 'refunded';
    isTestPayment?: boolean;
    metadata?: Record<string, any>;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Get existing order to get items and details
    const { supabaseAuth } = await import("@/lib/supabase-auth");
    const tableName = paymentData.orderType === 'sixty_min_bulk' 
      ? 'sixty_min_bulk_orders' 
      : paymentData.orderType === 'sixty_min_mealbox'
      ? 'sixty_min_mealbox_orders'
      : paymentData.orderType === 'mealbox'
      ? 'mealbox_orders'
      : 'bulk_meal_orders';

    const { data: order, error: orderError } = await supabaseAuth
      .from(tableName)
      .select('*')
      .eq('id', paymentData.orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Parse order items
    let orderItems: Array<{ dishId: string; name?: string; quantity: number; price: number }> = [];
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      orderItems = items.map((item: any) => ({
        dishId: item.dishId || item.dish_id || String(item.id || ''),
        name: item.name || item.dish_name || `Item ${item.dishId || item.id}`,
        quantity: item.quantity || 1,
        price: item.price || 0,
      }));
    } catch (e) {
      console.error('Error parsing order items:', e);
    }

    const itemsCount = orderItems.length;
    const totalItemsQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: paymentData.orderId,
        order_type: paymentData.orderType,
        order_number: paymentData.orderNumber,
        user_id: paymentData.userId,
        payment_stage: paymentData.paymentStage,
        amount: paymentData.amount.toFixed(2),
        currency: 'INR',
        razorpay_order_id: paymentData.razorpayOrderId || null,
        razorpay_payment_id: paymentData.razorpayPaymentId || null,
        razorpay_signature: paymentData.razorpaySignature || null,
        razorpay_receipt: paymentData.razorpayReceipt || null,
        payment_status: paymentData.paymentStatus || 'success',
        payment_method: 'razorpay',
        is_test_payment: paymentData.isTestPayment || false,
        order_items: JSON.stringify(orderItems),
        items_count: itemsCount,
        total_items_quantity: totalItemsQuantity,
        subtotal: parseFloat(order.subtotal?.toString() || '0').toFixed(2),
        gst: parseFloat(order.gst?.toString() || order.tax?.toString() || '0').toFixed(2),
        platform_fee: parseFloat(order.platform_fee?.toString() || order.delivery_fee?.toString() || '0').toFixed(2),
        packaging_fee: parseFloat(order.packaging_fee?.toString() || '0').toFixed(2),
        delivery_fee: parseFloat(order.delivery_fee?.toString() || order.platform_fee?.toString() || '0').toFixed(2),
        discount_applied: parseFloat(order.discount_applied?.toString() || '0').toFixed(2),
        total_order_amount: parseFloat(order.total?.toString() || '0').toFixed(2),
        delivery_date: order.delivery_date || order.deliveryDate || null,
        delivery_time: order.delivery_time || order.deliveryTime || null,
        payment_date: new Date().toISOString(),
        payment_time: new Date().toISOString(),
        metadata: paymentData.metadata ? JSON.stringify(paymentData.metadata) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
```

## 📋 Next Steps

1. **Add `addPaymentStage` method** to `paymentService` (code provided above)
2. **Update order status pages** (`OrderDetailsPage.tsx` and `BulkMealOrderDetailsPage.tsx`) to:
   - Use `paymentService.addPaymentStage()` when subsequent payments are made
   - Store payment details when "Pay" buttons are clicked for second/final stages

## 🔍 Migration Safety

The migration file is now **idempotent** and safe to run multiple times:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Uses `DO $$` blocks to check for existing constraints/policies before creating them
- Will not cause errors if run multiple times
- Will not affect existing tables or data

## 📊 Payment Data Stored

Each payment record includes:
- **User Information**: `user_id`
- **Order Reference**: `order_id`, `order_type`, `order_number`
- **Payment Details**: `payment_stage`, `amount`, `currency`
- **Razorpay Details**: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `razorpay_receipt`
- **Payment Status**: `payment_status`, `payment_method`, `is_test_payment`
- **Order Items**: `order_items` (JSONB), `items_count`, `total_items_quantity`
- **Financial Details**: `subtotal`, `gst`, `platform_fee`, `packaging_fee`, `delivery_fee`, `discount_applied`, `total_order_amount`
- **Delivery Info**: `delivery_date`, `delivery_time`
- **Timestamps**: `payment_date`, `payment_time`, `created_at`, `updated_at`
- **Metadata**: Additional JSON data
