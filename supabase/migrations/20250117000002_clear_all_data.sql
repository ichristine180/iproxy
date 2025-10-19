-- Clear all data from tables (keeps structure intact)
-- Run this to start fresh with a clean database

-- Disable triggers temporarily to avoid audit logging during cleanup
ALTER TABLE public.proxies DISABLE TRIGGER audit_proxies;
ALTER TABLE public.orders DISABLE TRIGGER audit_orders;
ALTER TABLE public.payments DISABLE TRIGGER audit_payments;
ALTER TABLE public.api_keys DISABLE TRIGGER audit_api_keys;

-- Delete in order respecting foreign key constraints
TRUNCATE TABLE public.webhook_events CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.rotations CASCADE;
TRUNCATE TABLE public.proxies CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.api_keys CASCADE;
TRUNCATE TABLE public.plans CASCADE;

-- Optionally clear profiles (keeps auth.users intact but clears profile data)
-- Uncomment the line below if you want to also clear user profiles
-- TRUNCATE TABLE public.profiles CASCADE;

-- Re-enable triggers
ALTER TABLE public.proxies ENABLE TRIGGER audit_proxies;
ALTER TABLE public.orders ENABLE TRIGGER audit_orders;
ALTER TABLE public.payments ENABLE TRIGGER audit_payments;
ALTER TABLE public.api_keys ENABLE TRIGGER audit_api_keys;
