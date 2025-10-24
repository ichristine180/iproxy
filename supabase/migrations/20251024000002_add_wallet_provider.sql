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
