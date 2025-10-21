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
