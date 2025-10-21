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
