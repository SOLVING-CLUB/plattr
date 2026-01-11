-- Create device_tokens table for push notification registration
-- This table stores FCM/APNs tokens for each user's devices

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id VARCHAR NOT NULL,
  
  -- Device token from FCM/APNs
  device_token TEXT NOT NULL,
  
  -- Platform (ios, android, web)
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  
  -- Notification preferences (stored as JSONB)
  preferences JSONB DEFAULT '{"order_updates": true, "offers_promotions": false, "menu_recommendations": false, "reminders": true}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate tokens
  UNIQUE(user_id, device_token)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_device_token ON public.device_tokens(device_token);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'device_tokens' 
    AND policyname = 'Users can view own device tokens'
  ) THEN
    CREATE POLICY "Users can view own device tokens"
      ON public.device_tokens
      FOR SELECT
      USING (
        user_id IS NOT NULL 
        AND EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id)
      );
  END IF;
END $$;

-- Users can insert their own device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'device_tokens' 
    AND policyname = 'Users can insert own device tokens'
  ) THEN
    CREATE POLICY "Users can insert own device tokens"
      ON public.device_tokens
      FOR INSERT
      WITH CHECK (
        user_id IS NOT NULL 
        AND EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id)
      );
  END IF;
END $$;

-- Users can update their own device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'device_tokens' 
    AND policyname = 'Users can update own device tokens'
  ) THEN
    CREATE POLICY "Users can update own device tokens"
      ON public.device_tokens
      FOR UPDATE
      USING (
        user_id IS NOT NULL 
        AND EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id)
      );
  END IF;
END $$;

-- Users can delete their own device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'device_tokens' 
    AND policyname = 'Users can delete own device tokens'
  ) THEN
    CREATE POLICY "Users can delete own device tokens"
      ON public.device_tokens
      FOR DELETE
      USING (
        user_id IS NOT NULL 
        AND EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id)
      );
  END IF;
END $$;

-- Service role policy for server-side operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'device_tokens' 
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.device_tokens
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.device_tokens IS 'Stores FCM/APNs device tokens for push notifications';
COMMENT ON COLUMN public.device_tokens.platform IS 'Device platform: ios, android, or web';
COMMENT ON COLUMN public.device_tokens.preferences IS 'User notification preferences for different notification types';
