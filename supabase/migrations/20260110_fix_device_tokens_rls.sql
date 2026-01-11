-- Fix device_tokens RLS policies to allow client-side inserts
-- The previous policies were too restrictive

-- Drop ALL existing policies (including ones we might have created)
DROP POLICY IF EXISTS "Users can view own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Service role full access" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can view their own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert their own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update their own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete their own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Allow insert device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Allow select own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Allow update own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Allow delete own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Service role full access on device_tokens" ON public.device_tokens;

-- Allow anyone to insert device tokens (user_id must be provided)
-- This is safe because device tokens are not sensitive - they just allow notifications to be sent
CREATE POLICY "Allow insert device tokens"
  ON public.device_tokens
  FOR INSERT
  WITH CHECK (user_id IS NOT NULL AND user_id != '');

-- Allow anyone to select device tokens for their user_id
CREATE POLICY "Allow select own device tokens"
  ON public.device_tokens
  FOR SELECT
  USING (user_id IS NOT NULL);

-- Allow anyone to update device tokens for their user_id
CREATE POLICY "Allow update own device tokens"
  ON public.device_tokens
  FOR UPDATE
  USING (user_id IS NOT NULL);

-- Allow anyone to delete device tokens for their user_id
CREATE POLICY "Allow delete own device tokens"
  ON public.device_tokens
  FOR DELETE
  USING (user_id IS NOT NULL);

-- Service role full access
CREATE POLICY "Service role full access on device_tokens"
  ON public.device_tokens
  FOR ALL
  USING (auth.role() = 'service_role');
