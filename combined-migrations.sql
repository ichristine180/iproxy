-- ============================================
-- Combined Migration Script for iProxy
-- Generated from all migration files
-- ============================================
--
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
--
-- ============================================

-- ============================================
-- Migration: 20250116000001_create_profiles.sql
-- ============================================

-- Create profiles table
-- This table extends the auth.users table with additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  tg_chat_id TEXT,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_telegram BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;


-- ============================================
-- Migration: 20250116000002_create_plans.sql
-- ============================================

-- Create plans table
-- Plans are public (can be viewed by anyone) but managed by admins only
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'mobile' CHECK (channel IN ('mobile', 'residential', 'datacenter')),
  price_usd_month DECIMAL(10, 2) NOT NULL CHECK (price_usd_month >= 0),
  rotation_api BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_channel ON public.plans(channel);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
-- Everyone can view active plans (even unauthenticated users)
CREATE POLICY "Anyone can view active plans"
  ON public.plans
  FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON public.plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to plans"
  ON public.plans
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;


-- ============================================
-- Migration: 20250116000003_create_proxies.sql
-- ============================================

-- Create proxies table
-- User-owned proxy configurations
CREATE TABLE IF NOT EXISTS public.proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  host TEXT NOT NULL,
  port_http INTEGER CHECK (port_http >= 1 AND port_http <= 65535),
  port_socks5 INTEGER CHECK (port_socks5 >= 1 AND port_socks5 <= 65535),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'rotating')),
  last_ip INET,
  iproxy_change_url TEXT,
  iproxy_action_link_id TEXT,
  rotation_mode TEXT DEFAULT 'manual' CHECK (rotation_mode IN ('manual', 'api', 'scheduled')),
  rotation_interval_min INTEGER CHECK (rotation_interval_min IS NULL OR rotation_interval_min > 0),
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proxies_user_id ON public.proxies(user_id);
CREATE INDEX IF NOT EXISTS idx_proxies_status ON public.proxies(status);
CREATE INDEX IF NOT EXISTS idx_proxies_last_rotated_at ON public.proxies(last_rotated_at);
CREATE INDEX IF NOT EXISTS idx_proxies_rotation_mode ON public.proxies(rotation_mode);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proxies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proxies
-- Users can view their own proxies
CREATE POLICY "Users can view their own proxies"
  ON public.proxies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own proxies
CREATE POLICY "Users can insert their own proxies"
  ON public.proxies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own proxies
CREATE POLICY "Users can update their own proxies"
  ON public.proxies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own proxies
CREATE POLICY "Users can delete their own proxies"
  ON public.proxies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all proxies
CREATE POLICY "Admins can view all proxies"
  ON public.proxies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to proxies"
  ON public.proxies
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proxies TO authenticated;
GRANT ALL ON public.proxies TO service_role;


-- ============================================
-- Migration: 20250116000004_create_orders.sql
-- ============================================

-- Create orders table
-- User subscription orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'failed', 'cancelled')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: end_at must be after start_at
  CONSTRAINT valid_date_range CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_plan_id ON public.orders(plan_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_start_at ON public.orders(start_at);
CREATE INDEX IF NOT EXISTS idx_orders_end_at ON public.orders(end_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot directly update orders (only via API/admin)
-- But they can view the updates

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to orders"
  ON public.orders
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- Function to auto-expire orders
CREATE OR REPLACE FUNCTION public.check_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.orders
  SET status = 'expired'
  WHERE status = 'active'
    AND end_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- Migration: 20250116000005_create_payments.sql
-- ============================================

-- Create payments table
-- Track all payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'nowpayments' CHECK (provider IN ('nowpayments', 'cryptomus', 'stripe', 'paypal', 'manual')),
  invoice_uuid TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  payer_currency TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  is_final BOOLEAN NOT NULL DEFAULT false,
  txid TEXT,
  invoice_url TEXT,
  signature_ok BOOLEAN,
  raw_payload JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_uuid ON public.payments(invoice_uuid);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own payments
CREATE POLICY "Users can create their own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update payments
CREATE POLICY "Admins can update payments"
  ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to payments"
  ON public.payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Function to activate order on successful payment
CREATE OR REPLACE FUNCTION public.activate_order_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment is marked as paid and final, activate the associated order
  IF NEW.status = 'paid' AND NEW.is_final = true AND NEW.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET
      status = 'active',
      start_at = COALESCE(start_at, NOW()),
      end_at = COALESCE(end_at, NOW() + interval '30 days')
    WHERE id = NEW.order_id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-activate order on successful payment
CREATE TRIGGER on_payment_success
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND NEW.is_final = true)
  EXECUTE FUNCTION public.activate_order_on_payment();


-- ============================================
-- Migration: 20250116000006_create_rotations.sql
-- ============================================

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


-- ============================================
-- Migration: 20250116000007_create_api_keys.sql
-- ============================================

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


-- ============================================
-- Migration: 20250116000008_create_webhook_events_and_audit_logs.sql
-- ============================================

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


-- ============================================
-- Migration: 20250116000009_seed_data.sql
-- ============================================

-- Seed data for development and testing
-- Note: In production, you'll want to remove or modify this seed data

-- Insert test plans
INSERT INTO public.plans (
  id,
  name,
  channel,
  price_usd_month,
  rotation_api,
  description,
  features,
  is_active
) VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy Starter',
    'mobile',
    29.99,
    true,
    'Basic mobile proxy plan with API rotation support',
    '[
      "1 Mobile Proxy",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Residential Proxy Pro',
    'residential',
    49.99,
    true,
    'Professional residential proxy plan',
    '[
      "5 Residential Proxies",
      "Unlimited Bandwidth",
      "Auto Rotation",
      "Multiple Locations",
      "Priority Support"
    ]'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'Datacenter Proxy Basic',
    'datacenter',
    19.99,
    false,
    'Affordable datacenter proxy plan',
    '[
      "10 Datacenter Proxies",
      "High Speed",
      "Multiple Locations",
      "Standard Support"
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Note: Test users, proxies, orders, and rotations require auth.users to exist first
-- Create test users via Supabase Auth Dashboard or signup API
-- The profile will be auto-created via trigger when user signs up

-- Note: To create the actual auth user, run this in Supabase dashboard or via API:
-- The password will be: Test123!@#
--
-- curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
--   -H "apikey: YOUR_ANON_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "test@iproxy.com",
--     "password": "Test123!@#",
--     "options": {
--       "data": {
--         "name": "Test User"
--       }
--     }
--   }'

-- Display summary
DO $$
DECLARE
  plans_count INT;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM public.plans;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Seed data has been inserted!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Plans created: %', plans_count;
  RAISE NOTICE '';
  RAISE NOTICE 'To create test users, proxies, and orders:';
  RAISE NOTICE '1. Create a user via Supabase Auth Dashboard or signup API';
  RAISE NOTICE '2. The profile will be auto-created via trigger';
  RAISE NOTICE '3. Then manually create proxies and orders for that user';
  RAISE NOTICE '===========================================';
END $$;


-- ============================================
-- Migration: 20250117000001_fix_webhook_events_constraint.sql
-- ============================================

-- Fix webhook_events provider constraint to ensure nowpayments is allowed
-- Drop the old constraint if it exists
ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_provider_check;

-- Recreate the constraint with the correct values
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_check
  CHECK (provider IN ('nowpayments', 'cryptomus', 'stripe', 'paypal', 'custom'));


-- ============================================
-- Migration: 20250118000001_create_rotation_logs.sql
-- ============================================

-- Create rotation_logs table
-- Track all IP rotation events for proxies
CREATE TABLE IF NOT EXISTS public.rotation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proxy_id UUID NOT NULL REFERENCES public.proxies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_ip INET,
  new_ip INET,
  rotation_type TEXT NOT NULL CHECK (rotation_type IN ('manual', 'scheduled', 'api')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  response_data JSONB,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rotation_logs_proxy_id ON public.rotation_logs(proxy_id);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_user_id ON public.rotation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_rotated_at ON public.rotation_logs(rotated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rotation_logs_status ON public.rotation_logs(status);

-- Enable RLS
ALTER TABLE public.rotation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rotation_logs
-- Users can view their own rotation logs
CREATE POLICY "Users can view their own rotation logs"
  ON public.rotation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rotation logs
CREATE POLICY "Users can insert their own rotation logs"
  ON public.rotation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all rotation logs
CREATE POLICY "Admins can view all rotation logs"
  ON public.rotation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to rotation logs"
  ON public.rotation_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.rotation_logs TO authenticated;
GRANT ALL ON public.rotation_logs TO service_role;


-- ============================================
-- Migration: 20250118000002_add_connection_id_to_proxies.sql
-- ============================================

-- Add iproxy_connection_id to proxies table for Console API
-- This stores the connection ID needed for IP rotation via command-push

ALTER TABLE public.proxies
ADD COLUMN IF NOT EXISTS iproxy_connection_id TEXT;

-- Add index for connection lookups
CREATE INDEX IF NOT EXISTS idx_proxies_connection_id ON public.proxies(iproxy_connection_id);

-- Add comment
COMMENT ON COLUMN public.proxies.iproxy_connection_id IS 'iProxy.online connection ID for command-push API (Console API)';


-- ============================================
-- Migration: 20250118000003_add_latency_to_rotation_logs.sql
-- ============================================

-- Add latency_ms column to rotation_logs table
ALTER TABLE public.rotation_logs
ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.rotation_logs.latency_ms IS 'Latency in milliseconds for the rotation request';


-- ============================================
-- Migration: 20250118000004_add_connection_support.sql
-- ============================================

-- Add connection support to plans and proxies tables
-- This migration adds fields needed for iProxy.online Console API connection management

-- ==============================================
-- 1. Extend plans table with connection parameters
-- ==============================================

-- Add connection preference columns to plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS city VARCHAR(50),
ADD COLUMN IF NOT EXISTS socks5_udp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30 CHECK (duration_days > 0);

-- Add comments for documentation
COMMENT ON COLUMN public.plans.country IS 'Preferred 2-letter country code for connection (e.g., us, de, fr)';
COMMENT ON COLUMN public.plans.city IS 'Preferred city code for connection (e.g., nyc, fra, lon)';
COMMENT ON COLUMN public.plans.socks5_udp IS 'Require SOCKS5 UDP support on selected server';
COMMENT ON COLUMN public.plans.duration_days IS 'Plan duration in days (default: 30 days)';

-- Create index for faster location lookups
CREATE INDEX IF NOT EXISTS idx_plans_location ON public.plans(country, city) WHERE country IS NOT NULL;

-- ==============================================
-- 2. Extend proxies table for connection management
-- ==============================================

-- Add order and connection tracking columns
ALTER TABLE public.proxies
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS connection_data JSONB,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Make username and password_hash nullable (they're set later when proxy access is granted)
ALTER TABLE public.proxies
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password_hash DROP NOT NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_proxies_order_id ON public.proxies(order_id);
CREATE INDEX IF NOT EXISTS idx_proxies_expires_at ON public.proxies(expires_at);

-- Add comments for documentation
COMMENT ON COLUMN public.proxies.order_id IS 'Order that created this proxy/connection';
COMMENT ON COLUMN public.proxies.connection_data IS 'Full connection details from iProxy.online Console API';
COMMENT ON COLUMN public.proxies.expires_at IS 'When the proxy/connection expires';

-- ==============================================
-- 3. Insert new plans with different durations
-- ==============================================

-- Clear existing test plans (they will be recreated with new structure)
DELETE FROM public.plans WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- Insert Mobile Proxy Plans (US)
INSERT INTO public.plans (
  id,
  name,
  channel,
  price_usd_month,
  rotation_api,
  description,
  features,
  is_active,
  country,
  socks5_udp,
  duration_days
) VALUES
  -- Mobile Proxy - 1 Day (US)
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (US)',
    'mobile',
    3.99,
    true,
    'Daily mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'us',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (US)
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (US)',
    'mobile',
    19.99,
    true,
    'Weekly mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'us',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (US)
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (US)',
    'mobile',
    49.99,
    true,
    'Monthly mobile proxy plan with API rotation',
    '[
      "1 Mobile Proxy Connection",
      "US Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'us',
    false,
    30
  ),

  -- Mobile Proxy - 1 Day (Germany)
  (
    '11000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (DE)',
    'mobile',
    4.99,
    true,
    'Daily mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'de',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (Germany)
  (
    '11000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (DE)',
    'mobile',
    24.99,
    true,
    'Weekly mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'de',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (Germany)
  (
    '11000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (DE)',
    'mobile',
    59.99,
    true,
    'Monthly mobile proxy plan in Germany',
    '[
      "1 Mobile Proxy Connection",
      "Germany Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'de',
    false,
    30
  ),

  -- Mobile Proxy - 1 Day (UK)
  (
    '12000000-0000-0000-0000-000000000001'::uuid,
    'Mobile Proxy - 1 Day (UK)',
    'mobile',
    4.99,
    true,
    'Daily mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "24/7 Support"
    ]'::jsonb,
    true,
    'gb',
    false,
    1
  ),
  -- Mobile Proxy - 1 Week (UK)
  (
    '12000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Proxy - 1 Week (UK)',
    'mobile',
    24.99,
    true,
    'Weekly mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "24/7 Support"
    ]'::jsonb,
    true,
    'gb',
    false,
    7
  ),
  -- Mobile Proxy - 1 Month (UK)
  (
    '12000000-0000-0000-0000-000000000003'::uuid,
    'Mobile Proxy - 1 Month (UK)',
    'mobile',
    59.99,
    true,
    'Monthly mobile proxy plan in United Kingdom',
    '[
      "1 Mobile Proxy Connection",
      "UK Location",
      "Unlimited Bandwidth",
      "API Rotation",
      "99.9% Uptime",
      "Priority Support",
      "Best Value"
    ]'::jsonb,
    true,
    'gb',
    false,
    30
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  channel = EXCLUDED.channel,
  price_usd_month = EXCLUDED.price_usd_month,
  rotation_api = EXCLUDED.rotation_api,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  country = EXCLUDED.country,
  socks5_udp = EXCLUDED.socks5_udp,
  duration_days = EXCLUDED.duration_days,
  updated_at = NOW();

-- Display summary
DO $$
DECLARE
  plans_count INT;
  us_plans_count INT;
  de_plans_count INT;
  gb_plans_count INT;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM public.plans WHERE is_active = true;
  SELECT COUNT(*) INTO us_plans_count FROM public.plans WHERE country = 'us' AND is_active = true;
  SELECT COUNT(*) INTO de_plans_count FROM public.plans WHERE country = 'de' AND is_active = true;
  SELECT COUNT(*) INTO gb_plans_count FROM public.plans WHERE country = 'gb' AND is_active = true;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Connection Support Migration Complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total active plans: %', plans_count;
  RAISE NOTICE '  - US plans: %', us_plans_count;
  RAISE NOTICE '  - DE plans: %', de_plans_count;
  RAISE NOTICE '  - GB plans: %', gb_plans_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to plans table:';
  RAISE NOTICE '  - country (2-letter code)';
  RAISE NOTICE '  - city (city code)';
  RAISE NOTICE '  - socks5_udp (boolean)';
  RAISE NOTICE '  - duration_days (integer)';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to proxies table:';
  RAISE NOTICE '  - order_id (UUID reference)';
  RAISE NOTICE '  - connection_data (JSONB)';
  RAISE NOTICE '  - expires_at (TIMESTAMPTZ)';
  RAISE NOTICE '===========================================';
END $$;


-- ============================================
-- Migration: 20250120000001_create_connection_info.sql
-- ============================================

-- Create connection_info table
-- Admin-managed connection tracking table
CREATE TABLE IF NOT EXISTS public.connection_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id TEXT NOT NULL UNIQUE,
  client_email TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  proxy_id UUID REFERENCES public.proxies(id) ON DELETE SET NULL,
  proxy_access TEXT,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connection_info_connection_id ON public.connection_info(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_user_id ON public.connection_info(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_order_id ON public.connection_info(order_id);
CREATE INDEX IF NOT EXISTS idx_connection_info_is_occupied ON public.connection_info(is_occupied);
CREATE INDEX IF NOT EXISTS idx_connection_info_expires_at ON public.connection_info(expires_at);

-- Add comments for documentation
COMMENT ON TABLE public.connection_info IS 'Admin-managed connection tracking table for iProxy connections';
COMMENT ON COLUMN public.connection_info.connection_id IS 'Connection ID from iProxy.online Console API (required)';
COMMENT ON COLUMN public.connection_info.client_email IS 'Email of the client who paid for the proxy';
COMMENT ON COLUMN public.connection_info.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN public.connection_info.order_id IS 'Reference to the order that created this connection';
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Reference to the proxy using this connection';
COMMENT ON COLUMN public.connection_info.proxy_access IS 'Proxy access credentials in format IP:PORT:LOGIN:PASSWORD';
COMMENT ON COLUMN public.connection_info.is_occupied IS 'Whether this connection is currently occupied';
COMMENT ON COLUMN public.connection_info.expires_at IS 'When the connection expires';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.connection_info
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.connection_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_info
-- Admins can do everything
CREATE POLICY "Admins can manage all connections"
  ON public.connection_info
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own connections
CREATE POLICY "Users can view their own connections"
  ON public.connection_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to connection_info"
  ON public.connection_info
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.connection_info TO authenticated;
GRANT ALL ON public.connection_info TO service_role;


-- ============================================
-- Migration: 20250120000002_alter_proxy_id_to_text.sql
-- ============================================

-- Alter proxy_id column in connection_info table from UUID to TEXT
-- This is to store the proxy access ID from iProxy API

-- Drop the foreign key constraint
ALTER TABLE public.connection_info
DROP CONSTRAINT IF EXISTS connection_info_proxy_id_fkey;

-- Change column type from UUID to TEXT
ALTER TABLE public.connection_info
ALTER COLUMN proxy_id TYPE TEXT USING proxy_id::TEXT;

-- Update comment to reflect new purpose
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Proxy access ID from iProxy API (returned when granting proxy access)';


-- ============================================
-- Migration: 20250120000003_alter_connection_info_to_arrays.sql
-- ============================================

-- Alter proxy_id and proxy_access columns to be arrays
-- This allows one connection to support multiple proxy accesses

-- Change proxy_id from TEXT to TEXT[]
ALTER TABLE public.connection_info
ALTER COLUMN proxy_id TYPE TEXT[] USING
  CASE
    WHEN proxy_id IS NULL THEN NULL
    ELSE ARRAY[proxy_id]
  END;

-- Change proxy_access from TEXT to TEXT[]
ALTER TABLE public.connection_info
ALTER COLUMN proxy_access TYPE TEXT[] USING
  CASE
    WHEN proxy_access IS NULL THEN NULL
    ELSE ARRAY[proxy_access]
  END;

-- Update comments to reflect array nature
COMMENT ON COLUMN public.connection_info.proxy_id IS 'Array of proxy access IDs from iProxy API (returned when granting proxy access)';
COMMENT ON COLUMN public.connection_info.proxy_access IS 'Array of proxy access credentials in format IP:PORT:LOGIN:PASSWORD';


-- ============================================
-- Migration: 20250121000001_create_user_wallet.sql
-- ============================================

-- Create user_wallet table
-- Automatically created when a user profile is created
CREATE TABLE IF NOT EXISTS public.user_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_wallet_user_id ON public.user_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_balance ON public.user_wallet(balance);

-- Add comments for documentation
COMMENT ON TABLE public.user_wallet IS 'User wallet for storing account balance';
COMMENT ON COLUMN public.user_wallet.user_id IS 'Reference to the user profile (one wallet per user)';
COMMENT ON COLUMN public.user_wallet.balance IS 'Current wallet balance in the specified currency';
COMMENT ON COLUMN public.user_wallet.currency IS 'Currency code (default: USD)';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_wallet
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create wallet when profile is created
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallet (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'USD');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_wallet();

-- Enable RLS
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallet
-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallet
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own wallet (for transactions)
-- Note: In production, you may want to restrict updates to specific columns or use a function
CREATE POLICY "Users can update their own wallet"
  ON public.user_wallet
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets"
  ON public.user_wallet
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all wallets
CREATE POLICY "Admins can update all wallets"
  ON public.user_wallet
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to user_wallet"
  ON public.user_wallet
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, UPDATE ON public.user_wallet TO authenticated;
GRANT ALL ON public.user_wallet TO service_role;


-- ============================================
-- Migration: 20250121000002_create_wallet_transactions.sql
-- ============================================

-- Create wallet_transactions table
-- Tracks all wallet transactions (deposits, withdrawals, etc.)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.user_wallet(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'refund', 'payment')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount != 0),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions(reference_type, reference_id);

-- Add comments for documentation
COMMENT ON TABLE public.wallet_transactions IS 'Wallet transaction history for all user wallet operations';
COMMENT ON COLUMN public.wallet_transactions.type IS 'Transaction type: deposit, withdrawal, refund, or payment';
COMMENT ON COLUMN public.wallet_transactions.amount IS 'Transaction amount (positive for deposits, negative for withdrawals)';
COMMENT ON COLUMN public.wallet_transactions.balance_before IS 'Wallet balance before the transaction';
COMMENT ON COLUMN public.wallet_transactions.balance_after IS 'Wallet balance after the transaction';
COMMENT ON COLUMN public.wallet_transactions.reference_type IS 'Type of related entity (e.g., order, payment)';
COMMENT ON COLUMN public.wallet_transactions.reference_id IS 'ID of related entity';

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_transactions
-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access (for automated transactions)
CREATE POLICY "Service role has full access to wallet_transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Function to record wallet transaction
CREATE OR REPLACE FUNCTION public.record_wallet_transaction(
  p_user_id UUID,
  p_wallet_id UUID,
  p_type TEXT,
  p_amount DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance_before
  FROM public.user_wallet
  WHERE id = p_wallet_id;

  -- Calculate new balance
  v_balance_after := v_balance_before + p_amount;

  -- Ensure balance doesn't go negative
  IF v_balance_after < 0 THEN
    RAISE EXCEPTION 'Insufficient funds. Current balance: %, Transaction amount: %', v_balance_before, p_amount;
  END IF;

  -- Update wallet balance
  UPDATE public.user_wallet
  SET balance = v_balance_after,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Record transaction
  INSERT INTO public.wallet_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    p_wallet_id,
    p_type,
    p_amount,
    v_balance_before,
    v_balance_after,
    p_description,
    p_reference_type,
    p_reference_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_wallet_transaction IS 'Records a wallet transaction and updates the wallet balance atomically';


-- ============================================
-- Migration: 20250121000003_add_get_or_create_wallet.sql
-- ============================================

-- Function to get or create user wallet
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_or_create_user_wallet(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  balance DECIMAL(10, 2),
  currency TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Try to get existing wallet
  SELECT w.id INTO v_wallet_id
  FROM public.user_wallet w
  WHERE w.user_id = p_user_id;

  -- If wallet doesn't exist, create it
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.user_wallet (user_id, balance, currency)
    VALUES (p_user_id, 0.00, 'USD')
    RETURNING user_wallet.id INTO v_wallet_id;
  END IF;

  -- Return the wallet
  RETURN QUERY
  SELECT w.id, w.user_id, w.balance, w.currency, w.created_at, w.updated_at
  FROM public.user_wallet w
  WHERE w.id = v_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_or_create_user_wallet IS 'Gets existing wallet or creates a new one for the user. Bypasses RLS using SECURITY DEFINER.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_user_wallet TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_wallet TO authenticated;


-- ============================================
-- Migration: 20251022000001_create_connection_stoplist.sql
-- ============================================

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


-- ============================================
-- Migration: 20251022000002_create_quota.sql
-- ============================================

-- Create quota table
-- Tracks available connection quotas
CREATE TABLE IF NOT EXISTS public.quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  available_connection_number INTEGER NOT NULL DEFAULT 0 CHECK (available_connection_number >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quota_created_at ON public.quota(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.quota IS 'Tracks available connection quotas';
COMMENT ON COLUMN public.quota.available_connection_number IS 'Number of available connections in the quota pool';

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.quota
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.quota ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quota
-- Admins can do everything
CREATE POLICY "Admins can manage quota"
  ON public.quota
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view quota (read-only)
CREATE POLICY "Users can view quota"
  ON public.quota
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Service role has full access
CREATE POLICY "Service role has full access to quota"
  ON public.quota
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.quota TO authenticated;
GRANT ALL ON public.quota TO service_role;


-- ============================================
-- Migration: 20251023000001_add_processing_status.sql
-- ============================================

-- Add 'processing' status to orders table
-- This status is used when an order is waiting for manual provisioning by admin

-- Drop the old constraint
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'processing' included
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'active', 'expired', 'failed', 'cancelled'));


-- ============================================
-- Migration: 20251024000001_create_quota_reservations.sql
-- ============================================

-- Create quota_reservations table to track temporary quota holds
CREATE TABLE IF NOT EXISTS quota_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reserved_connections INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'expired', 'released')),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_quota_reservations_order_id ON quota_reservations(order_id);
CREATE INDEX idx_quota_reservations_user_id ON quota_reservations(user_id);
CREATE INDEX idx_quota_reservations_status ON quota_reservations(status);
CREATE INDEX idx_quota_reservations_expires_at ON quota_reservations(expires_at) WHERE status = 'reserved';

-- Function to automatically release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
  expired_reservation RECORD;
  current_quota RECORD;
BEGIN
  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  IF current_quota IS NULL THEN
    RAISE NOTICE 'No quota found';
    RETURN 0;
  END IF;

  released_count := 0;

  -- Find and release expired reservations
  FOR expired_reservation IN
    SELECT * FROM quota_reservations
    WHERE status = 'reserved'
      AND expires_at <= now()
  LOOP
    -- Update reservation status
    UPDATE quota_reservations
    SET
      status = 'expired',
      released_at = now(),
      updated_at = now()
    WHERE id = expired_reservation.id;

    -- Return quota back to available pool
    UPDATE quota
    SET
      available_connection_number = available_connection_number + expired_reservation.reserved_connections,
      updated_at = now()
    WHERE id = current_quota.id;

    -- Update order status to expired if still pending
    UPDATE orders
    SET
      status = 'expired',
      updated_at = now()
    WHERE id = expired_reservation.order_id
      AND status = 'pending';

    released_count := released_count + 1;

    RAISE NOTICE 'Released expired reservation % for order %', expired_reservation.id, expired_reservation.order_id;
  END LOOP;

  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve quota when order is created
CREATE OR REPLACE FUNCTION reserve_quota(
  p_order_id UUID,
  p_user_id UUID,
  p_connections INT DEFAULT 1,
  p_expiry_minutes INT DEFAULT 15
)
RETURNS JSON AS $$
DECLARE
  current_quota RECORD;
  new_reservation RECORD;
  expiry_time TIMESTAMPTZ;
BEGIN
  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  IF current_quota IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No quota configured'
    );
  END IF;

  -- Check if enough quota is available
  IF current_quota.available_connection_number < p_connections THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient quota available',
      'available', current_quota.available_connection_number,
      'requested', p_connections
    );
  END IF;

  -- Calculate expiry time
  expiry_time := now() + (p_expiry_minutes || ' minutes')::INTERVAL;

  -- Create reservation
  INSERT INTO quota_reservations (
    order_id,
    user_id,
    reserved_connections,
    status,
    reserved_at,
    expires_at
  ) VALUES (
    p_order_id,
    p_user_id,
    p_connections,
    'reserved',
    now(),
    expiry_time
  )
  RETURNING * INTO new_reservation;

  -- Deduct from available quota
  UPDATE quota
  SET
    available_connection_number = available_connection_number - p_connections,
    updated_at = now()
  WHERE id = current_quota.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', new_reservation.id,
    'expires_at', new_reservation.expires_at,
    'expires_in_seconds', EXTRACT(EPOCH FROM (expiry_time - now()))::INT,
    'reserved_connections', p_connections
  );
END;
$$ LANGUAGE plpgsql;

-- Function to confirm reservation when payment is completed
CREATE OR REPLACE FUNCTION confirm_quota_reservation(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  reservation RECORD;
BEGIN
  -- Find reservation for this order
  SELECT * INTO reservation FROM quota_reservations
  WHERE order_id = p_order_id
    AND status = 'reserved'
  ORDER BY created_at DESC
  LIMIT 1;

  IF reservation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active reservation found for this order'
    );
  END IF;

  -- Check if reservation has expired
  IF reservation.expires_at <= now() THEN
    -- Release the reservation
    UPDATE quota_reservations
    SET
      status = 'expired',
      released_at = now(),
      updated_at = now()
    WHERE id = reservation.id;

    RETURN json_build_object(
      'success', false,
      'error', 'Reservation has expired',
      'expired_at', reservation.expires_at
    );
  END IF;

  -- Confirm reservation
  UPDATE quota_reservations
  SET
    status = 'confirmed',
    confirmed_at = now(),
    updated_at = now()
  WHERE id = reservation.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', reservation.id,
    'confirmed_at', now()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to release reservation manually (e.g., cancelled order)
CREATE OR REPLACE FUNCTION release_quota_reservation(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  reservation RECORD;
  current_quota RECORD;
BEGIN
  -- Find reservation for this order
  SELECT * INTO reservation FROM quota_reservations
  WHERE order_id = p_order_id
    AND status = 'reserved'
  ORDER BY created_at DESC
  LIMIT 1;

  IF reservation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active reservation found for this order'
    );
  END IF;

  -- Get current quota
  SELECT * INTO current_quota FROM quota ORDER BY created_at DESC LIMIT 1;

  -- Update reservation
  UPDATE quota_reservations
  SET
    status = 'released',
    released_at = now(),
    updated_at = now()
  WHERE id = reservation.id;

  -- Return quota to pool
  UPDATE quota
  SET
    available_connection_number = available_connection_number + reservation.reserved_connections,
    updated_at = now()
  WHERE id = current_quota.id;

  RETURN json_build_object(
    'success', true,
    'reservation_id', reservation.id,
    'released_connections', reservation.reserved_connections
  );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired reservations every minute
-- Note: This requires pg_cron extension which should be enabled in Supabase
-- If pg_cron is not available, you can call release_expired_reservations() from your application


-- ============================================
-- Migration: 20251024000002_add_wallet_provider.sql
-- ============================================

-- Add 'wallet' as an allowed payment provider

-- Drop the existing constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_provider_check;

-- Add new constraint that includes 'wallet'
ALTER TABLE public.payments
ADD CONSTRAINT payments_provider_check
CHECK (provider IN ('nowpayments', 'cryptomus', 'stripe', 'paypal', 'manual', 'wallet'));

-- Verify the constraint was updated
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass
  AND contype = 'c'
  AND conname = 'payments_provider_check';


-- ============================================
-- Migration: 20251027000001_add_auto_renew_to_proxies.sql
-- ============================================

-- Add auto_renew column to proxies table
-- This column determines whether a proxy should be automatically renewed before expiration

ALTER TABLE proxies
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column
COMMENT ON COLUMN proxies.auto_renew IS 'Whether this proxy should be automatically renewed before expiration';

-- Create an index for efficient queries on auto_renew status
CREATE INDEX IF NOT EXISTS idx_proxies_auto_renew_expires ON proxies(auto_renew, expires_at)
WHERE auto_renew = TRUE AND status = 'active';


-- ============================================
-- Migration: 20251028000001_add_expiry_notification_tracking.sql
-- ============================================

-- Add field to track when expiry notification was sent for a proxy
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS expiry_notification_sent_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN proxies.expiry_notification_sent_at IS 'Timestamp when the 3-day expiry notification was last sent to the user';


-- ============================================
-- Migration: 20251029000001_add_notification_preferences.sql
-- ============================================

-- Add notification preference fields to profiles table
-- This migration adds the missing notification preference fields

-- Rename tg_chat_id to telegram_chat_id for consistency
ALTER TABLE public.profiles
  RENAME COLUMN tg_chat_id TO telegram_chat_id;

-- Add notification preference columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS proxy_expiry_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_confirmations BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_updates BOOLEAN NOT NULL DEFAULT false;

-- Add comment to table for documentation
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for sending notifications';
COMMENT ON COLUMN public.profiles.notify_email IS 'Enable/disable email notifications';
COMMENT ON COLUMN public.profiles.notify_telegram IS 'Enable/disable Telegram notifications';
COMMENT ON COLUMN public.profiles.proxy_expiry_alerts IS 'Receive alerts when proxies are about to expire';
COMMENT ON COLUMN public.profiles.renewal_reminders IS 'Receive reminders for subscription renewals';
COMMENT ON COLUMN public.profiles.payment_confirmations IS 'Receive notifications for successful payments';
COMMENT ON COLUMN public.profiles.system_updates IS 'Receive notifications about system maintenance and updates';


-- ============================================
-- Migration: 20251030000001_restructure_plans_add_pricing.sql
-- ============================================

-- Migration to restructure plans table and add plan_pricing table
-- This migration removes price_usd_month from plans and creates a separate pricing table

-- Step 1: Create the new plan_pricing table
CREATE TABLE IF NOT EXISTS public.plan_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  duration TEXT NOT NULL CHECK (duration IN ('daily', 'weekly', 'monthly', 'yearly')),
  price_usd DECIMAL(10, 2) NOT NULL CHECK (price_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, duration) -- Prevent duplicate durations for same plan
);

-- Create indexes for plan_pricing
CREATE INDEX IF NOT EXISTS idx_plan_pricing_plan_id ON public.plan_pricing(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_pricing_duration ON public.plan_pricing(duration);

-- Step 2: Migrate existing pricing data from plans to plan_pricing
-- Convert existing monthly prices to the new pricing table
INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
SELECT id, 'monthly', price_usd_month
FROM public.plans
WHERE price_usd_month IS NOT NULL;

-- Step 3: Remove price_usd_month column from plans table
ALTER TABLE public.plans DROP COLUMN IF EXISTS price_usd_month;

-- Step 4: Remove duration_days column if it exists (no longer needed with new structure)
ALTER TABLE public.plans DROP COLUMN IF EXISTS duration_days;

-- Step 5: Remove country column if it exists (should be part of plan name)
ALTER TABLE public.plans DROP COLUMN IF EXISTS country;

-- Enable RLS for plan_pricing
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_pricing
-- Everyone can view pricing for active plans (even unauthenticated users)
CREATE POLICY "Anyone can view pricing for active plans"
  ON public.plan_pricing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_pricing.plan_id AND plans.is_active = true
    )
  );

-- Admins can manage pricing
CREATE POLICY "Admins can manage pricing"
  ON public.plan_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to plan_pricing"
  ON public.plan_pricing
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.plan_pricing TO anon, authenticated;
GRANT ALL ON public.plan_pricing TO service_role;

-- Add helpful comment
COMMENT ON TABLE public.plan_pricing IS 'Stores pricing information for plans with different durations (daily, weekly, monthly, yearly)';
COMMENT ON COLUMN public.plan_pricing.duration IS 'Duration type: daily, weekly, monthly, or yearly';
COMMENT ON COLUMN public.plan_pricing.price_usd IS 'Price in USD for the specified duration';


-- ============================================
-- Migration: 20251030000002_add_mobile_proxy_with_pricing.sql
-- ============================================

-- Migration to clear all plans and add Mobile Proxy plan with multiple pricing tiers

-- Step 1: Delete all existing plans (this will cascade to plan_pricing)
DELETE FROM public.plans;

-- Step 2: Insert Mobile Proxy plan
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'Mobile Proxy US',
  'mobile',
  true,
  'High-speed mobile proxies with unlimited bandwidth and advanced features',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature'
  ),
  true
);

-- Step 3: Get the plan ID and insert pricing tiers
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the plan ID we just created
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 100.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 101.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 102.00);
END $$;


-- ============================================
-- Migration: 20251030000003_add_bigdaddy_and_more_plans.sql
-- ============================================

-- Migration to add BigDaddy and additional plans with multiple pricing tiers

-- Step 1: Insert BigDaddy plan (enhanced version)
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'BigDaddy Mobile Proxy US',
  'mobile',
  true,
  'Premium mobile proxies with enhanced limits and all advanced features',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature',
    'Wi-Fi Split - Proxy Speed Accelerator, Saving on Data Usage',
    'SMS duplication in Telegram bot',
    '.ovpn configurations',
    'Find Phone feature',
    'Pseudo pOf substitution'
  ),
  true
);

-- Step 2: Insert Pro plan (intermediate tier)
INSERT INTO public.plans (id, name, channel, rotation_api, description, features, is_active)
VALUES (
  gen_random_uuid(),
  'Pro Mobile Proxy US',
  'mobile',
  true,
  'Professional mobile proxies with enhanced features for demanding tasks',
  jsonb_build_array(
    'Speed limit: 100 Mbit/sec',
    'Logs available for download in the personal account for 12 weeks',
    'Volume discounts up to 30%',
    'Unique IP address feature',
    'Wi-Fi Split - Proxy Speed Accelerator, Saving on Data Usage',
    'SMS duplication in Telegram bot'
  ),
  true
);

-- Step 3: Add pricing for BigDaddy plan
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the BigDaddy plan ID
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'BigDaddy Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 200.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 350.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 600.00);
END $$;

-- Step 4: Add pricing for Pro plan
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the Pro plan ID
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Pro Mobile Proxy US' LIMIT 1;

  -- Insert daily pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'daily', 150.00);

  -- Insert weekly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'weekly', 250.00);

  -- Insert monthly pricing
  INSERT INTO public.plan_pricing (plan_id, duration, price_usd)
  VALUES (v_plan_id, 'monthly', 400.00);
END $$;


-- ============================================
-- Migration: add_expires_at_column.sql
-- ============================================

-- Migration: Add expires_at column to orders table
-- This column is needed to track when an order/subscription expires

-- Add expires_at column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for better query performance on expiry checks
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON public.orders(expires_at);

-- Add start_at column if it doesn't exist (for tracking when order starts)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for start_at as well
CREATE INDEX IF NOT EXISTS idx_orders_start_at ON public.orders(start_at);

-- Update existing orders to set expires_at to 30 days from creation if null
-- (only for active orders)
UPDATE public.orders
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL
  AND status = 'active';

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('expires_at', 'start_at')
ORDER BY column_name;


-- ============================================
-- Migration: combined-migrations.sql
-- ============================================

-- ============================================
-- Combined Migration Script for iProxy
-- Generated from all migration files
-- ============================================
--
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
--
-- ============================================



-- ============================================
-- Migration: fix_payments_constraint.sql
-- ============================================

-- Check current constraint on payments table
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass
  AND contype = 'c'  -- check constraints
  AND conname = 'payments_provider_check';

-- Drop the existing constraint if it exists
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_provider_check;

-- Add a new constraint that allows 'nowpayments' as a provider
-- Adjust the constraint to match your needs (add other providers as needed)
ALTER TABLE public.payments
ADD CONSTRAINT payments_provider_check
CHECK (provider IN ('nowpayments', 'stripe', 'paypal', 'coinbase'));

-- Verify the constraint was added
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass
  AND contype = 'c'
  AND conname = 'payments_provider_check';


-- ============================================
-- All migrations completed successfully!
-- ============================================
