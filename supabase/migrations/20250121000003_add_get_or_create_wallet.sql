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
