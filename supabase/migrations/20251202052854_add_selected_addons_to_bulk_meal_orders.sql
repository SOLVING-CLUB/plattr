-- Add selected_addons column to bulk_meal_orders table
-- This column stores JSON array of addon IDs selected by the user

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bulk_meal_orders') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bulk_meal_orders' AND column_name = 'selected_addons') THEN
      ALTER TABLE bulk_meal_orders ADD COLUMN selected_addons TEXT;
      COMMENT ON COLUMN bulk_meal_orders.selected_addons IS 'JSON array of addon IDs selected for this bulk meal order';
    END IF;
  END IF;
END $$;

