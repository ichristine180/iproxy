-- Create connection_stoplist table
-- Tracks connections that should be stopped or blocked
CREATE TABLE IF NOT EXISTS public.connection_stoplist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connection_stoplist_connection_id ON public.connection_stoplist(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_stoplist_created_at ON public.connection_stoplist(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.connection_stoplist IS 'Tracks connections that should be stopped or blocked';
COMMENT ON COLUMN public.connection_stoplist.connection_id IS 'Connection ID to be stopped or blocked';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.connection_stoplist
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.connection_stoplist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_stoplist
-- Admins can do everything
CREATE POLICY "Admins can manage connection stoplist"
  ON public.connection_stoplist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to connection_stoplist"
  ON public.connection_stoplist
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.connection_stoplist TO authenticated;
GRANT ALL ON public.connection_stoplist TO service_role;
