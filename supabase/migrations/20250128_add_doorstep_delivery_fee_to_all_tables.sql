-- Add doorstep_delivery_fee column to all order tables
-- This column stores the ₹300 addon fee for doorstep delivery service

-- Add to mealbox_orders
ALTER TABLE public.mealbox_orders
ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Add to bulk_meal_orders
ALTER TABLE public.bulk_meal_orders
ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Add to snack_box_orders
ALTER TABLE public.snack_box_orders
ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Add to sixty_min_mealbox_orders
ALTER TABLE public.sixty_min_mealbox_orders
ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Add to sixty_min_bulk_orders
ALTER TABLE public.sixty_min_bulk_orders
ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Add to catering_orders (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'catering_orders') THEN
        ALTER TABLE public.catering_orders
        ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add to corporate_orders (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'corporate_orders') THEN
        ALTER TABLE public.corporate_orders
        ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add to tasting_menu_orders (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasting_menu_orders') THEN
        ALTER TABLE public.tasting_menu_orders
        ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add to orders table (regular orders, if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders
        ADD COLUMN IF NOT EXISTS doorstep_delivery_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.mealbox_orders.doorstep_delivery_fee IS 'Additional fee (₹300) for doorstep delivery service addon';
COMMENT ON COLUMN public.bulk_meal_orders.doorstep_delivery_fee IS 'Additional fee (₹300) for doorstep delivery service addon';
COMMENT ON COLUMN public.snack_box_orders.doorstep_delivery_fee IS 'Additional fee (₹300) for doorstep delivery service addon';
COMMENT ON COLUMN public.sixty_min_mealbox_orders.doorstep_delivery_fee IS 'Additional fee (₹300) for doorstep delivery service addon';
COMMENT ON COLUMN public.sixty_min_bulk_orders.doorstep_delivery_fee IS 'Additional fee (₹300) for doorstep delivery service addon';
