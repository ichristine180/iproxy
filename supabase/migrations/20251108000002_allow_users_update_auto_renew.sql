-- Allow users to update auto_renew on their own orders
-- This policy specifically allows users to update only the auto_renew field

CREATE POLICY "Users can update auto_renew on their own orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant UPDATE permission to authenticated users
GRANT UPDATE ON public.orders TO authenticated;
