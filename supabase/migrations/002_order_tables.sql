-- Create base tables if they don't exist (required for foreign keys)
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  email TEXT,
  phone TEXT UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false
);

-- Addresses table (must be created before order tables that reference it)
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false
);

-- Create MealBox Orders Table
CREATE TABLE IF NOT EXISTS mealbox_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL UNIQUE,
  portions TEXT NOT NULL,
  meal_preference TEXT NOT NULL,
  selected_meal_type TEXT,
  veg_boxes INTEGER NOT NULL DEFAULT 0,
  egg_boxes INTEGER NOT NULL DEFAULT 0,
  non_veg_boxes INTEGER NOT NULL DEFAULT 0,
  veg_plate_selections TEXT, -- JSON array
  egg_plate_selections TEXT, -- JSON array
  non_veg_plate_selections TEXT, -- JSON array
  selected_addons TEXT, -- JSON array
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_date TEXT,
  delivery_time TEXT,
  address_id VARCHAR REFERENCES addresses(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Bulk Meal Orders Table
CREATE TABLE IF NOT EXISTS bulk_meal_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL UNIQUE,
  items TEXT NOT NULL, -- JSON array of {dishId, quantity, price}
  subtotal DECIMAL(10, 2) NOT NULL,
  gst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  packaging_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_date TEXT,
  delivery_time TEXT,
  address_id VARCHAR REFERENCES addresses(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Catering Orders Table
-- Drop existing table if it has wrong schema (will recreate with correct schema)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'catering_orders') THEN
    -- Check if user_id column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'catering_orders' AND column_name = 'user_id') THEN
      -- Drop the old table if it doesn't have user_id
      DROP TABLE IF EXISTS catering_orders CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS catering_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL, -- Optional for guest orders
  order_number INTEGER NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  veg_count INTEGER DEFAULT 0,
  non_veg_count INTEGER DEFAULT 0,
  egg_count INTEGER DEFAULT 0,
  event_date TEXT NOT NULL,
  event_time TEXT,
  meal_times TEXT, -- JSON array
  dietary_types TEXT, -- JSON array
  cuisines TEXT, -- JSON array
  cuisine_preferences TEXT, -- JSON array
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  add_on_ids TEXT, -- JSON array
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  address_id VARCHAR REFERENCES addresses(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Corporate Orders Table
-- Drop existing table if it has wrong schema
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'corporate_orders') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'corporate_orders' AND column_name = 'user_id') THEN
      DROP TABLE IF EXISTS corporate_orders CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS corporate_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL, -- Optional for guest orders
  order_number INTEGER NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  number_of_people INTEGER NOT NULL,
  veg_count INTEGER DEFAULT 0,
  non_veg_count INTEGER DEFAULT 0,
  egg_count INTEGER DEFAULT 0,
  event_type TEXT NOT NULL,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  event_date TEXT NOT NULL,
  event_time TEXT,
  additional_services TEXT, -- JSON array
  message TEXT,
  address_id VARCHAR REFERENCES addresses(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Concierge Preferences Table
CREATE TABLE IF NOT EXISTS concierge_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences TEXT NOT NULL, -- JSON object
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mealbox_orders_user_id ON mealbox_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_mealbox_orders_order_number ON mealbox_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_bulk_meal_orders_user_id ON bulk_meal_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_meal_orders_order_number ON bulk_meal_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_catering_orders_user_id ON catering_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_orders_order_number ON catering_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_corporate_orders_user_id ON corporate_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_orders_order_number ON corporate_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_concierge_preferences_user_id ON concierge_preferences(user_id);

-- Enable RLS
ALTER TABLE mealbox_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_meal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MealBox Orders
CREATE POLICY "Users can view own mealbox orders"
  ON mealbox_orders FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own mealbox orders"
  ON mealbox_orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own mealbox orders"
  ON mealbox_orders FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for Bulk Meal Orders
CREATE POLICY "Users can view own bulk meal orders"
  ON bulk_meal_orders FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own bulk meal orders"
  ON bulk_meal_orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own bulk meal orders"
  ON bulk_meal_orders FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for Catering Orders
-- Users can view their own orders, or if user_id is null (guest order), allow if they match phone/email
CREATE POLICY "Users can view own catering orders"
  ON catering_orders FOR SELECT
  USING (
    auth.uid()::text = user_id OR 
    (user_id IS NULL AND auth.uid() IS NULL) -- Guest orders visible to anyone (can be restricted further)
  );

CREATE POLICY "Users can insert catering orders"
  ON catering_orders FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id OR 
    user_id IS NULL -- Allow guest orders
  );

CREATE POLICY "Users can update own catering orders"
  ON catering_orders FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for Corporate Orders
CREATE POLICY "Users can view own corporate orders"
  ON corporate_orders FOR SELECT
  USING (
    auth.uid()::text = user_id OR 
    (user_id IS NULL AND auth.uid() IS NULL) -- Guest orders
  );

CREATE POLICY "Users can insert corporate orders"
  ON corporate_orders FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id OR 
    user_id IS NULL -- Allow guest orders
  );

CREATE POLICY "Users can update own corporate orders"
  ON corporate_orders FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for Concierge Preferences
CREATE POLICY "Users can view own concierge preferences"
  ON concierge_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own concierge preferences"
  ON concierge_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own concierge preferences"
  ON concierge_preferences FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own concierge preferences"
  ON concierge_preferences FOR DELETE
  USING (auth.uid()::text = user_id);

