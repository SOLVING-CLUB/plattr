-- Add CTA button position and action method controls to festive_settings table

-- Add CTA action method column (1 = filter method, 2 = direct redirect method)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'cta_action_method'
  ) THEN
    ALTER TABLE public.festive_settings 
    ADD COLUMN cta_action_method INTEGER DEFAULT 1 
    CHECK (cta_action_method IN (1, 2));
    
    COMMENT ON COLUMN public.festive_settings.cta_action_method IS 
    'Action method when CTA is clicked: 1 = Filter method (redirects to bulk-meals with festive filter), 2 = Direct redirect method (redirects to target_page)';
  END IF;
END $$;

-- Add CTA target page column (for method 2)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'cta_target_page'
  ) THEN
    ALTER TABLE public.festive_settings 
    ADD COLUMN cta_target_page TEXT 
    CHECK (cta_target_page IS NULL OR cta_target_page IN ('bulk-meals', 'mealbox', 'snack-box', 'corporate', 'catering'));
    
    COMMENT ON COLUMN public.festive_settings.cta_target_page IS 
    'Target page for method 2: bulk-meals, mealbox, snack-box, corporate, or catering. Only used when cta_action_method = 2';
  END IF;
END $$;

-- Add CTA position column (predefined positions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'cta_position'
  ) THEN
    ALTER TABLE public.festive_settings 
    ADD COLUMN cta_position TEXT DEFAULT 'center';
    
    COMMENT ON COLUMN public.festive_settings.cta_position IS 
    'CTA button position: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right, or custom';
  END IF;
END $$;

-- Add CTA position X (for custom positioning)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'cta_position_x'
  ) THEN
    ALTER TABLE public.festive_settings 
    ADD COLUMN cta_position_x TEXT;
    
    COMMENT ON COLUMN public.festive_settings.cta_position_x IS 
    'Custom X position for CTA button (e.g., "20%", "100px"). Only used when cta_position = "custom"';
  END IF;
END $$;

-- Add CTA position Y (for custom positioning)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'cta_position_y'
  ) THEN
    ALTER TABLE public.festive_settings 
    ADD COLUMN cta_position_y TEXT;
    
    COMMENT ON COLUMN public.festive_settings.cta_position_y IS 
    'Custom Y position for CTA button (e.g., "30%", "200px"). Only used when cta_position = "custom"';
  END IF;
END $$;

-- Update existing records to have default values
UPDATE public.festive_settings
SET 
  cta_action_method = COALESCE(cta_action_method, 1),
  cta_position = COALESCE(cta_position, 'center')
WHERE cta_action_method IS NULL OR cta_position IS NULL;
