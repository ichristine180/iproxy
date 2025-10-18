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
