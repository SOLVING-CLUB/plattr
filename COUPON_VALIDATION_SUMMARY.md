# Coupon Validation - Complete Implementation Summary

## Overview
All coupon conditions from the database are now automatically validated and applied when coupons are used. The system checks all conditions comprehensively to ensure coupons are only applied when all criteria are met.

## Database Schema Updates

A migration file has been created: `supabase/migrations/20250125_update_coupon_schema_complete.sql`

This migration adds all missing columns to support comprehensive coupon validation:

### New Columns in `coupons` Table:
1. **`name`** (TEXT) - Display name for the coupon
2. **`valid_days_of_week`** (INTEGER[]) - Array of day numbers (0=Sunday, 6=Saturday) when coupon is valid
3. **`applicable_order_types`** (TEXT[]) - Array of order types this coupon applies to
4. **`applicable_meal_types`** (TEXT[]) - Array of meal types this coupon applies to
5. **`first_time_user_only`** (BOOLEAN) - If true, coupon can only be used by first-time customers
6. **`returning_user_only`** (BOOLEAN) - If true, coupon can only be used by returning customers
7. **`min_previous_orders`** (INTEGER) - Minimum number of previous orders required

### Updated Columns:
- **`discount_type`** - Now includes 'free_delivery' option (in addition to 'percentage' and 'fixed')

### New Columns in `coupon_usages` Table:
1. **`order_type`** (TEXT) - Type of order that used this coupon
2. **`discount_applied`** (NUMERIC) - Actual discount amount applied

## Automatic Validation Conditions

All the following conditions are **automatically checked** when a coupon is validated:

### 1. Basic Validation
- ✅ Coupon code exists and is active
- ✅ Coupon is not expired (checks `valid_until`)
- ✅ Coupon is active (checks `valid_from`)
- ✅ Coupon has not reached usage limit (`usage_count < usage_limit`)

### 2. Time-Based Restrictions
- ✅ Valid date range (`valid_from` and `valid_until`)
- ✅ Valid days of week (`valid_days_of_week` array)

### 3. Order Requirements
- ✅ Minimum order amount (`min_order_amount`)
- ✅ Applicable order types (`applicable_order_types` array)
- ✅ Applicable meal types (`applicable_meal_types` array)

### 4. User Restrictions
- ✅ Per-user usage limit (`per_user_limit`)
- ✅ First-time user only (`first_time_user_only`) - **Checks ALL order types**
- ✅ Returning user only (`returning_user_only`) - **Checks ALL order types**
- ✅ Minimum previous orders (`min_previous_orders`) - **Checks ALL order types**

### 5. Discount Calculation
- ✅ Percentage discounts with max discount cap
- ✅ Fixed amount discounts
- ✅ Free delivery discounts

## Order Types Checked

When validating user restrictions (first-time, returning, minimum orders), the system checks **ALL** of these order tables:
- `orders`
- `bulk_meal_orders`
- `mealbox_orders`
- `snack_box_orders`
- `catering_orders`
- `corporate_orders`
- `sixty_min_bulk_orders`
- `sixty_min_mealbox_orders`

This ensures comprehensive validation across all order types.

## Automatic Coupon Usage Recording

When orders are created with coupons:
- ✅ Coupon usage is automatically recorded in `coupon_usages` table
- ✅ Coupon `usage_count` is automatically incremented
- ✅ Order type and discount amount are tracked

## How to Apply

1. **Run the migration** in Supabase SQL Editor:
   ```sql
   -- Copy and run: supabase/migrations/20250125_update_coupon_schema_complete.sql
   ```

2. **Verify the columns were added**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'coupons'
   ORDER BY column_name;
   ```

## Example Coupon Configurations

### First-Time User Coupon
```sql
INSERT INTO coupons (
  code, discount_type, discount_value, max_discount, 
  min_order_amount, first_time_user_only, description
) VALUES (
  'WELCOME20', 'percentage', 20, 100, 200, true,
  '20% off for first-time customers (max ₹100)'
);
```

### Weekend-Only Coupon
```sql
INSERT INTO coupons (
  code, discount_type, discount_value, 
  valid_days_of_week, description
) VALUES (
  'WEEKEND15', 'percentage', 15,
  ARRAY[0, 6], -- Sunday and Saturday
  '15% off on weekends'
);
```

### Order-Type Specific Coupon
```sql
INSERT INTO coupons (
  code, discount_type, discount_value,
  applicable_order_types, description
) VALUES (
  'BULK10', 'percentage', 10,
  ARRAY['bulk_meal'], -- Only for bulk meals
  '10% off on bulk meal orders'
);
```

### Returning Customer Coupon
```sql
INSERT INTO coupons (
  code, discount_type, discount_value,
  returning_user_only, min_previous_orders, description
) VALUES (
  'LOYALTY25', 'percentage', 25,
  true, 3, -- For customers with 3+ previous orders
  '25% off for loyal customers'
);
```

## Validation Flow

1. User enters coupon code
2. System validates ALL conditions automatically:
   - Checks if coupon exists and is active
   - Validates date/time restrictions
   - Checks order amount requirements
   - Validates order type restrictions
   - Checks user eligibility (first-time, returning, previous orders)
   - Validates per-user usage limits
3. If all conditions pass, discount is calculated
4. When order is placed, coupon usage is automatically recorded

## Important Notes

- All validations happen **automatically** - no manual checks needed
- Validation is **comprehensive** - checks all order types for user restrictions
- Coupon usage is **automatically tracked** when orders are created
- The system prevents invalid coupon usage at the validation stage
- All conditions from the database are enforced
