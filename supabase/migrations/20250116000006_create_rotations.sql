-- Create rotations table
-- Track IP rotation history
CREATE TABLE IF NOT EXISTS public.rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proxy_id UUID NOT NULL REFERENCES public.proxies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'dashboard' CHECK (source IN ('dashboard', 'api', 'schedule')),
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'success', 'failed')),
  old_ip INET,
  new_ip INET,
  latency_ms INTEGER CHECK (latency_ms >= 0),
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rotations_proxy_id ON public.rotations(proxy_id);
CREATE INDEX IF NOT EXISTS idx_rotations_user_id ON public.rotations(user_id);
CREATE INDEX IF NOT EXISTS idx_rotations_source ON public.rotations(source);
CREATE INDEX IF NOT EXISTS idx_rotations_result ON public.rotations(result);
CREATE INDEX IF NOT EXISTS idx_rotations_created_at ON public.rotations(created_at DESC);

-- Enable RLS
ALTER TABLE public.rotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rotations
-- Users can view their own rotations
CREATE POLICY "Users can view their own rotations"
  ON public.rotations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rotations
CREATE POLICY "Users can insert their own rotations"
  ON public.rotations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all rotations
CREATE POLICY "Admins can view all rotations"
  ON public.rotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to rotations"
  ON public.rotations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.rotations TO authenticated;
GRANT ALL ON public.rotations TO service_role;

-- Function to update proxy last_rotated_at and last_ip on successful rotation
CREATE OR REPLACE FUNCTION public.update_proxy_on_rotation()
RETURNS TRIGGER AS $$
BEGIN
  -- If rotation was successful, update the proxy record
  IF NEW.result = 'success' THEN
    UPDATE public.proxies
    SET
      last_rotated_at = NEW.created_at,
      last_ip = NEW.new_ip,
      status = 'active'
    WHERE id = NEW.proxy_id;
  ELSIF NEW.result = 'failed' THEN
    -- Mark proxy as error if rotation failed
    UPDATE public.proxies
    SET status = 'error'
    WHERE id = NEW.proxy_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update proxy on rotation completion
CREATE TRIGGER on_rotation_complete
  AFTER INSERT OR UPDATE ON public.rotations
  FOR EACH ROW
  WHEN (NEW.result IN ('success', 'failed'))
  EXECUTE FUNCTION public.update_proxy_on_rotation();
