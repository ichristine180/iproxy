-- Fix infinite recursion in profiles RLS policy
-- The "Admins can view all profiles" policy was causing recursion by querying
-- the profiles table within a policy on the profiles table

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a helper function to check if a user is an admin
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the admin policy using the helper function
-- This avoids recursion because the function runs with SECURITY DEFINER
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));
