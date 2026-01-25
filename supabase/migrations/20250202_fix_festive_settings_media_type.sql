-- Fix banner_media_type constraint issue
-- This migration normalizes existing data and fixes the constraint

-- Step 1: Drop the constraint if it exists (to allow data updates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'festive_settings_banner_media_type_check'
  ) THEN
    ALTER TABLE public.festive_settings DROP CONSTRAINT festive_settings_banner_media_type_check;
  END IF;
END $$;

-- Step 2: Normalize all banner_media_type values to lowercase
UPDATE public.festive_settings
SET banner_media_type = LOWER(banner_media_type)
WHERE banner_media_type IS NOT NULL 
  AND banner_media_type != LOWER(banner_media_type);

-- Step 3: Set default for any NULL values
UPDATE public.festive_settings
SET banner_media_type = 'video'
WHERE banner_media_type IS NULL;

-- Step 4: Re-add the constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'festive_settings_banner_media_type_check'
  ) THEN
    ALTER TABLE public.festive_settings ADD CONSTRAINT festive_settings_banner_media_type_check 
      CHECK (banner_media_type IN ('image', 'video') OR banner_media_type IS NULL);
  END IF;
END $$;
