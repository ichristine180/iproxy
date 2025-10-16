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
