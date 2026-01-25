-- Create festive_settings table to control festive specials dynamically
-- This allows admins to change festive name, tag, and banner video through Supabase

CREATE TABLE IF NOT EXISTS public.festive_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Festive name (e.g., "Sankranthi", "Diwali", "Christmas")
  festive_name TEXT NOT NULL UNIQUE,
  
  -- Tag to filter dishes (must match tags in dishes table)
  filter_tag TEXT NOT NULL,
  
  -- Banner media URL or path (can be image or video)
  banner_media_url TEXT,
  
  -- Media type: 'image' or 'video' (defaults to 'video' for backward compatibility)
  -- Note: Constraint is added later to allow case-insensitive values
  banner_media_type TEXT DEFAULT 'video',
  
  -- Whether this festive is currently active
  is_active BOOLEAN DEFAULT true,
  
  -- Display order (for multiple active festives)
  display_order INTEGER DEFAULT 0,
  
  -- Optional: Button text override
  button_text TEXT DEFAULT 'Special',
  
  -- Optional: Banner background color
  banner_bg_color TEXT DEFAULT '#06352A',
  
  -- Optional: Banner text color
  banner_text_color TEXT DEFAULT '#F5E9DB',
  
  -- Show/hide CTA button on banner
  show_cta_button BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active festives
CREATE INDEX IF NOT EXISTS idx_festive_settings_is_active ON public.festive_settings(is_active, display_order);

-- Enable RLS
ALTER TABLE public.festive_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read active festive settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'festive_settings' 
    AND policyname = 'Anyone can read active festive settings'
  ) THEN
    CREATE POLICY "Anyone can read active festive settings"
      ON public.festive_settings
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- RLS Policy: Service role can manage all festive settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'festive_settings' 
    AND policyname = 'Service role can manage festive settings'
  ) THEN
    CREATE POLICY "Service role can manage festive settings"
      ON public.festive_settings
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_festive_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'festive_settings_updated_at'
  ) THEN
    CREATE TRIGGER festive_settings_updated_at
      BEFORE UPDATE ON public.festive_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_festive_settings_updated_at();
  END IF;
END $$;

-- Add new columns for media support (image or video) if they don't exist
DO $$
BEGIN
  -- Add banner_media_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'banner_media_url'
  ) THEN
    ALTER TABLE public.festive_settings ADD COLUMN banner_media_url TEXT;
  END IF;

  -- Add banner_media_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'banner_media_type'
  ) THEN
    ALTER TABLE public.festive_settings ADD COLUMN banner_media_type TEXT DEFAULT 'video';
  END IF;

  -- Add show_cta_button column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'show_cta_button'
  ) THEN
    ALTER TABLE public.festive_settings ADD COLUMN show_cta_button BOOLEAN DEFAULT true;
  END IF;
  
  -- Normalize any existing banner_media_type values to lowercase first
  UPDATE public.festive_settings
  SET banner_media_type = LOWER(banner_media_type)
  WHERE banner_media_type IS NOT NULL 
    AND banner_media_type != LOWER(banner_media_type);
  
  -- Add or update check constraint (case-sensitive, but data is normalized)
  -- First, drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'festive_settings_banner_media_type_check'
  ) THEN
    ALTER TABLE public.festive_settings DROP CONSTRAINT festive_settings_banner_media_type_check;
  END IF;
  
  -- Add new constraint (case-sensitive, but we've normalized the data)
  ALTER TABLE public.festive_settings ADD CONSTRAINT festive_settings_banner_media_type_check 
    CHECK (banner_media_type IN ('image', 'video') OR banner_media_type IS NULL);
END $$;

-- Migrate data from banner_video_url to banner_media_url if old column exists
-- Also normalize banner_media_type to lowercase
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'banner_video_url'
  ) THEN
    -- Migrate existing data
    UPDATE public.festive_settings
    SET 
      banner_media_url = COALESCE(banner_media_url, banner_video_url),
      banner_media_type = COALESCE(LOWER(banner_media_type), 'video')
    WHERE (banner_media_url IS NULL AND banner_video_url IS NOT NULL)
       OR banner_media_type IS NULL;
  END IF;
  
  -- Normalize any existing banner_media_type values to lowercase
  UPDATE public.festive_settings
  SET banner_media_type = LOWER(banner_media_type)
  WHERE banner_media_type IS NOT NULL 
    AND banner_media_type != LOWER(banner_media_type);
END $$;

-- Insert default Sankranthi festive setting
-- Use banner_media_url if column exists, otherwise fall back to banner_video_url
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'banner_media_url'
  ) THEN
    -- New schema: use banner_media_url
    INSERT INTO public.festive_settings (
      festive_name,
      filter_tag,
      banner_media_url,
      banner_media_type,
      is_active,
      display_order,
      button_text,
      show_cta_button
    ) VALUES (
      'Sankranthi',
      'Sankranthi',
      '/stock_images/IMG_9929.MP4',
      'video',
      true,
      0,
      'Sankranthi Special',
      true
    ) ON CONFLICT (festive_name) DO UPDATE
    SET 
      banner_media_url = EXCLUDED.banner_media_url,
      banner_media_type = EXCLUDED.banner_media_type,
      show_cta_button = COALESCE(EXCLUDED.show_cta_button, true);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'festive_settings' 
    AND column_name = 'banner_video_url'
  ) THEN
    -- Old schema: use banner_video_url
    INSERT INTO public.festive_settings (
      festive_name,
      filter_tag,
      banner_video_url,
      is_active,
      display_order,
      button_text
    ) VALUES (
      'Sankranthi',
      'Sankranthi',
      '/stock_images/IMG_9929.MP4',
      true,
      0,
      'Sankranthi Special'
    ) ON CONFLICT (festive_name) DO NOTHING;
  END IF;
END $$;

-- Optional: Drop old banner_video_url column after migration (uncomment if you want to remove it)
-- Note: Keeping it for now for backward compatibility
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_schema = 'public' 
--     AND table_name = 'festive_settings' 
--     AND column_name = 'banner_video_url'
--   ) THEN
--     ALTER TABLE public.festive_settings DROP COLUMN banner_video_url;
--   END IF;
-- END $$;

-- Comments for documentation
COMMENT ON TABLE public.festive_settings IS 'Controls festive specials banners and filters. Admins can change festive name, tag, and banner through Supabase.';
COMMENT ON COLUMN public.festive_settings.filter_tag IS 'Tag that must match dishes.tags field to show in filtered view';
COMMENT ON COLUMN public.festive_settings.banner_media_url IS 'URL or path to the banner media file (image or video). Can be: 1) Supabase Storage URL (e.g., https://PROJECT.supabase.co/storage/v1/object/public/festive_banners/banner.mp4), 2) Relative path (e.g., /videos/banner.mp4 or /images/banner.jpg), or 3) Full external URL';
COMMENT ON COLUMN public.festive_settings.banner_media_type IS 'Type of banner media: "image" for images (jpg, png, webp) or "video" for videos (mp4, webm). Determines whether to render as <img> or <video> tag';
COMMENT ON COLUMN public.festive_settings.show_cta_button IS 'Whether to show the CTA button (e.g., "Sankranthi Special") on the banner. Set to false to hide the button.';
