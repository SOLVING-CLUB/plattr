-- Create storage bucket for festive banner videos and images
-- This bucket will be used to store festive banner videos and images

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'festive_banners',
  'festive_banners',
  true, -- Public bucket (accessible without authentication)
  52428800, -- 50 MB file size limit (in bytes: 50 * 1024 * 1024)
  ARRAY['video/*', 'image/*'] -- Allowed MIME types
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
-- This allows anyone to read files from the bucket
-- Note: For public buckets, read access is usually automatic, but we'll create an explicit policy
DO $$
BEGIN
  -- Check if policy exists by querying pg_policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for festive banners'
  ) THEN
    CREATE POLICY "Public read access for festive banners"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'festive_banners');
  END IF;
END $$;

-- Note: For uploading files through the app, you may need additional policies
-- For now, you can upload files through the Supabase Dashboard:
-- 1. Go to Supabase Dashboard → Storage → festive_banners
-- 2. Click "Upload file"
-- 3. Select your image or video file
-- 4. Copy the public URL and use it in the festive_settings table

-- Example URL format after upload:
-- https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/sankranthi-banner.mp4

-- To use in festive_settings table:
-- UPDATE festive_settings 
-- SET banner_media_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/festive_banners/sankranthi-banner.mp4',
--     banner_media_type = 'video'
-- WHERE festive_name = 'Sankranthi';
