-- Create webhook_events table
-- Track incoming webhooks from payment providers and other services
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('nowpayments', 'cryptomus', 'stripe', 'paypal', 'custom')),
  event_type TEXT NOT NULL,
  signature_ok BOOLEAN,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events
-- Only admins can view webhook events
CREATE POLICY "Admins can view all webhook events"
  ON public.webhook_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access (needed for webhook processing)
CREATE POLICY "Service role has full access to webhook events"
  ON public.webhook_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON public.webhook_events TO service_role;

-- Create audit_logs table
-- Track all important actions in the system for security and debugging
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON public.audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON public.audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to audit logs"
  ON public.audit_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    target_type,
    target_id,
    meta,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_target_type,
    p_target_id,
    p_meta,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO new_log_id;

  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically log important actions
CREATE OR REPLACE FUNCTION public.auto_log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  target_type_name TEXT;
BEGIN
  -- Determine action based on operation
  IF TG_OP = 'INSERT' THEN
    action_name := TG_TABLE_NAME || '.created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := TG_TABLE_NAME || '.updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := TG_TABLE_NAME || '.deleted';
  END IF;

  target_type_name := TG_TABLE_NAME;

  -- Log the event
  PERFORM public.log_audit_event(
    p_user_id := COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
    p_action := action_name,
    p_target_type := target_type_name,
    p_target_id := COALESCE(NEW.id, OLD.id),
    p_meta := jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit logging triggers to important tables
-- Proxies
CREATE TRIGGER audit_proxies
  AFTER INSERT OR UPDATE OR DELETE ON public.proxies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_audit_event();

-- Orders
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_audit_event();

-- Payments
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_audit_event();

-- API Keys
CREATE TRIGGER audit_api_keys
  AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_audit_event();
