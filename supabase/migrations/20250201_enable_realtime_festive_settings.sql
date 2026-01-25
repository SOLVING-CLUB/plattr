-- Enable Realtime for festive_settings table
-- This allows instant updates when festive settings change in Supabase

-- Enable Realtime publication for festive_settings table (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'festive_settings'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.festive_settings;
  END IF;
END $$;

-- Note: If the publication doesn't exist, you may need to create it first:
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.festive_settings;

-- Verify Realtime is enabled (this will show in Supabase Dashboard → Database → Replication)
-- The table should appear in the Replication section with realtime enabled
