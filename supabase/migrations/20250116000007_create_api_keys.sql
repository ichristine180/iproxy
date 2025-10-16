-- Create api_keys table
-- User API keys for programmatic access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars of key for identification (e.g., "sk_test_...")
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:proxies', 'write:rotations'],
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: revoked_at must be set if revoked is true
  CONSTRAINT valid_revocation CHECK (
    (revoked = false AND revoked_at IS NULL) OR
    (revoked = true AND revoked_at IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON public.api_keys(revoked);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON public.api_keys(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
-- Users can view their own API keys (but not the actual key value, only metadata)
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create their own API keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys (e.g., revoke them)
CREATE POLICY "Users can update their own API keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all API keys
CREATE POLICY "Admins can view all API keys"
  ON public.api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to API keys"
  ON public.api_keys
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

-- Function to auto-revoke API key
CREATE OR REPLACE FUNCTION public.revoke_api_key(api_key_id UUID, reason TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys
  SET
    revoked = true,
    revoked_at = NOW(),
    revoked_reason = reason
  WHERE id = api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key and update last_used_at
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash_input TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  scopes TEXT[]
) AS $$
DECLARE
  api_key_record RECORD;
BEGIN
  -- Find the API key
  SELECT * INTO api_key_record
  FROM public.api_keys
  WHERE key_hash = key_hash_input
    AND revoked = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[];
    RETURN;
  END IF;

  -- Update last_used_at
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE id = api_key_record.id;

  -- Return validation result
  RETURN QUERY SELECT true, api_key_record.user_id, api_key_record.scopes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
