-- Add order_type_label column to all order tables
-- This column stores the order type label for easy display in the orders page

-- Add to main orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to mealbox_orders table
ALTER TABLE public.mealbox_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to bulk_meal_orders table
ALTER TABLE public.bulk_meal_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to snack_box_orders table
ALTER TABLE public.snack_box_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to sixty_min_mealbox_orders table
ALTER TABLE public.sixty_min_mealbox_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to sixty_min_bulk_orders table
ALTER TABLE public.sixty_min_bulk_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to catering_orders table
ALTER TABLE public.catering_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to corporate_orders table
ALTER TABLE public.corporate_orders 
ADD COLUMN IF NOT EXISTS order_type_label TEXT;

-- Add to tasting_menu_orders table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasting_menu_orders' AND table_schema = 'public') THEN
    ALTER TABLE public.tasting_menu_orders 
    ADD COLUMN IF NOT EXISTS order_type_label TEXT;
  END IF;
END $$;

-- Update existing records with default labels based on table
UPDATE public.orders 
SET order_type_label = 'Regular Order' 
WHERE order_type_label IS NULL;

UPDATE public.mealbox_orders 
SET order_type_label = 'Meal Box' 
WHERE order_type_label IS NULL;

UPDATE public.bulk_meal_orders 
SET order_type_label = 'Bulk Meal' 
WHERE order_type_label IS NULL;

UPDATE public.snack_box_orders 
SET order_type_label = 'Snack Box' 
WHERE order_type_label IS NULL;

UPDATE public.sixty_min_mealbox_orders 
SET order_type_label = '60-Min Meal Box' 
WHERE order_type_label IS NULL;

UPDATE public.sixty_min_bulk_orders 
SET order_type_label = '60-Min Bulk Meal' 
WHERE order_type_label IS NULL;

UPDATE public.catering_orders 
SET order_type_label = 'Catering' 
WHERE order_type_label IS NULL;

UPDATE public.corporate_orders 
SET order_type_label = 'Corporate' 
WHERE order_type_label IS NULL;

-- Update tasting_menu_orders (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasting_menu_orders' AND table_schema = 'public') THEN
    UPDATE public.tasting_menu_orders 
    SET order_type_label = 'Tasting Menu' 
    WHERE order_type_label IS NULL;
  END IF;
END $$;
