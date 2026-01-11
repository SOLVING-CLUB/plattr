-- Create payments table to store all payment details
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Reference
  order_id VARCHAR NOT NULL,
  order_type VARCHAR NOT NULL, -- 'bulk_meal', 'mealbox', 'sixty_min_bulk', 'sixty_min_mealbox'
  order_number INTEGER,
  
  -- User Information
  user_id VARCHAR NOT NULL,
  
  -- Payment Details
  payment_stage VARCHAR NOT NULL, -- 'initial', 'second', 'final', 'full'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Razorpay Details
  razorpay_order_id VARCHAR,
  razorpay_payment_id VARCHAR,
  razorpay_signature TEXT,
  razorpay_receipt VARCHAR,
  
  -- Payment Status
  payment_status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
  payment_method VARCHAR DEFAULT 'razorpay',
  is_test_payment BOOLEAN DEFAULT false,
  
  -- Order Items (stored as JSON)
  order_items JSONB NOT NULL, -- Array of {dishId, name, quantity, price}
  items_count INTEGER NOT NULL,
  total_items_quantity INTEGER NOT NULL,
  
  -- Order Details
  subtotal DECIMAL(10, 2),
  gst DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  packaging_fee DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2),
  discount_applied DECIMAL(10, 2),
  total_order_amount DECIMAL(10, 2) NOT NULL,
  
  -- Delivery Information
  delivery_date DATE,
  delivery_time VARCHAR,
  
  -- Timestamps
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_time TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB -- Additional payment metadata
);

-- Note: No foreign key constraint on order_id since it can reference different tables
-- (bulk_meal_orders, mealbox_orders, sixty_min_bulk_orders, sixty_min_mealbox_orders)
-- The order_type column indicates which table the order_id references

-- Add foreign key only for user_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_user_id_fkey'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_stage ON public.payments(payment_stage);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
-- SELECT policy - users can view their own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Users can view their own payments'
  ) THEN
    CREATE POLICY "Users can view their own payments"
      ON public.payments
      FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- INSERT policy - users can insert their own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Users can insert their own payments'
  ) THEN
    CREATE POLICY "Users can insert their own payments"
      ON public.payments
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- UPDATE policy - users can update their own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Users can update their own payments'
  ) THEN
    CREATE POLICY "Users can update their own payments"
      ON public.payments
      FOR UPDATE
      USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.payments IS 'Stores all payment transaction details for orders';
COMMENT ON COLUMN public.payments.payment_stage IS 'Payment stage: initial (10% or 80%), second (70%), final (20%), or full (100%)';
COMMENT ON COLUMN public.payments.order_items IS 'JSON array of ordered items with quantities and prices';
COMMENT ON COLUMN public.payments.is_test_payment IS 'Indicates if payment was made using Razorpay test keys';
