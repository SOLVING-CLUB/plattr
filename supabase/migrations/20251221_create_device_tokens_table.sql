-- Create device_tokens table for push notification device registration
CREATE TABLE IF NOT EXISTS device_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  preferences JSONB DEFAULT '{"order_updates": true, "offers_promotions": false, "menu_recommendations": false, "reminders": true}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(device_token);

-- Enable RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own device tokens
CREATE POLICY "Users can view their own device tokens"
  ON device_tokens
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- RLS Policy: Users can insert their own device tokens
CREATE POLICY "Users can insert their own device tokens"
  ON device_tokens
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

-- RLS Policy: Users can update their own device tokens
CREATE POLICY "Users can update their own device tokens"
  ON device_tokens
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id);

-- RLS Policy: Users can delete their own device tokens
CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens
  FOR DELETE
  USING (auth.uid()::TEXT = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

