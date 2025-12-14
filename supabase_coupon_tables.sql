-- Coupon System Tables for Plattr
-- Run this SQL in your Supabase SQL Editor to create the coupon tables

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create coupon_usages table (tracks who used which coupon)
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for coupons (read-only for authenticated users)
CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (is_active = true);

-- 6. RLS Policies for coupon_usages (users can only see/create their own)
CREATE POLICY "Users can read their own coupon usages" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coupon usages" ON coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Service role policy for updating coupon usage_count
CREATE POLICY "Service role can update coupons" ON coupons
  FOR UPDATE USING (true);

-- ============================================================
-- EXAMPLE: How to add coupons (run these to create test coupons)
-- ============================================================

-- 20% off coupon with max ₹100 discount
INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_order_amount, description)
VALUES ('FIRST20', 'percentage', 20, 100, 200, 'Get 20% off on your first order (max ₹100)');

-- ₹50 flat discount
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, description)
VALUES ('FLAT50', 'fixed', 50, 300, 'Flat ₹50 off on orders above ₹300');

-- Limited time offer - 15% off
INSERT INTO coupons (code, discount_type, discount_value, max_discount, valid_until, usage_limit, description)
VALUES ('DIWALI15', 'percentage', 15, 200, '2025-12-31 23:59:59+00', 100, 'Diwali special - 15% off (max ₹200)');
