-- Migration: Update coupon schema to support all validation conditions
-- This ensures all coupon conditions from the code are properly stored in the database

-- ============================================
-- 1. UPDATE COUPONS TABLE
-- ============================================

-- Add missing columns to coupons table
DO $$
BEGIN
  -- Add 'free_delivery' to discount_type CHECK constraint
  -- First, drop the existing constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'coupons_discount_type_check'
  ) THEN
    ALTER TABLE public.coupons DROP CONSTRAINT coupons_discount_type_check;
  END IF;
  
  -- Add new constraint that includes 'free_delivery'
  ALTER TABLE public.coupons 
  ADD CONSTRAINT coupons_discount_type_check 
  CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery'));
END $$;

-- Add name column (for display purposes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN name TEXT;
    
    COMMENT ON COLUMN public.coupons.name IS 'Display name for the coupon';
  END IF;
END $$;

-- Add valid_days_of_week (array of integers, 0=Sunday, 6=Saturday)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'valid_days_of_week'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN valid_days_of_week INTEGER[];
    
    COMMENT ON COLUMN public.coupons.valid_days_of_week IS 'Array of day numbers (0=Sunday, 6=Saturday) when coupon is valid';
  END IF;
END $$;

-- Add applicable_order_types (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'applicable_order_types'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN applicable_order_types TEXT[];
    
    COMMENT ON COLUMN public.coupons.applicable_order_types IS 'Array of order types this coupon applies to (e.g., ["bulk_meal", "mealbox", "all"])';
  END IF;
END $$;

-- Add applicable_meal_types (array of text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'applicable_meal_types'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN applicable_meal_types TEXT[];
    
    COMMENT ON COLUMN public.coupons.applicable_meal_types IS 'Array of meal types this coupon applies to (e.g., ["lunch", "dinner"])';
  END IF;
END $$;

-- Add first_time_user_only (boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'first_time_user_only'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN first_time_user_only BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.coupons.first_time_user_only IS 'If true, coupon can only be used by first-time customers';
  END IF;
END $$;

-- Add returning_user_only (boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'returning_user_only'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN returning_user_only BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.coupons.returning_user_only IS 'If true, coupon can only be used by returning customers';
  END IF;
END $$;

-- Add min_previous_orders (integer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'min_previous_orders'
  ) THEN
    ALTER TABLE public.coupons 
    ADD COLUMN min_previous_orders INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.coupons.min_previous_orders IS 'Minimum number of previous orders required to use this coupon';
  END IF;
END $$;

-- ============================================
-- 2. UPDATE COUPON_USAGES TABLE
-- ============================================

-- Add order_type column to track which order type used the coupon
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupon_usages' 
    AND column_name = 'order_type'
  ) THEN
    ALTER TABLE public.coupon_usages 
    ADD COLUMN order_type TEXT;
    
    COMMENT ON COLUMN public.coupon_usages.order_type IS 'Type of order that used this coupon (e.g., "bulk_meal", "mealbox", "regular")';
  END IF;
END $$;

-- Add discount_applied column to track actual discount amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupon_usages' 
    AND column_name = 'discount_applied'
  ) THEN
    ALTER TABLE public.coupon_usages 
    ADD COLUMN discount_applied NUMERIC(10, 2);
    
    COMMENT ON COLUMN public.coupon_usages.discount_applied IS 'Actual discount amount applied in this usage';
  END IF;
END $$;

-- ============================================
-- 3. CREATE INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for first_time_user_only and returning_user_only (for filtering)
CREATE INDEX IF NOT EXISTS idx_coupons_user_restrictions 
ON public.coupons(first_time_user_only, returning_user_only) 
WHERE first_time_user_only = true OR returning_user_only = true;

-- Index for valid_days_of_week (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_coupons_valid_days 
ON public.coupons USING GIN(valid_days_of_week) 
WHERE valid_days_of_week IS NOT NULL;

-- Index for applicable_order_types (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_coupons_order_types 
ON public.coupons USING GIN(applicable_order_types) 
WHERE applicable_order_types IS NOT NULL;

-- Index for order_type in coupon_usages
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_type 
ON public.coupon_usages(order_type) 
WHERE order_type IS NOT NULL;

-- ============================================
-- 4. UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE public.coupons IS 'Coupon codes with all validation conditions and restrictions';
COMMENT ON TABLE public.coupon_usages IS 'Tracks coupon usage by users with order details and discount amounts';

-- ============================================
-- NOTES:
-- ============================================
-- All coupon validation conditions are now supported:
-- 1. Basic: code, discount_type, discount_value, min_order_amount, max_discount
-- 2. Time-based: valid_from, valid_until, valid_days_of_week
-- 3. Usage limits: usage_limit, usage_count, per_user_limit
-- 4. Order restrictions: applicable_order_types, applicable_meal_types
-- 5. User restrictions: first_time_user_only, returning_user_only, min_previous_orders
-- 6. Status: is_active
-- 
-- The application code will automatically validate all these conditions
-- when a coupon is applied.
