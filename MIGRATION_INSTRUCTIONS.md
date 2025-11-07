# Migration Instructions: Auto-Renew Update Permission

## Issue
Users cannot toggle auto-renew on their orders because the RLS policy doesn't allow users to update their own orders.

## Solution
Run the migration located at: `supabase/migrations/20251108000002_allow_users_update_auto_renew.sql`

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the following SQL:

```sql
-- Allow users to update auto_renew on their own orders
-- This policy specifically allows users to update only the auto_renew field

CREATE POLICY IF NOT EXISTS "Users can update auto_renew on their own orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant UPDATE permission to authenticated users
GRANT UPDATE ON public.orders TO authenticated;
```

5. Click "Run"

### Option 2: Via Supabase CLI
If you have Supabase linked to your project:

```bash
npx supabase db push
```

### Option 3: Via Local Supabase (if using Docker)
If you're running Supabase locally:

```bash
npx supabase db reset
```

## Verification
After applying the migration, users should be able to:
1. Toggle auto-renew on their active orders from the dashboard
2. See the status update in real-time
3. No longer get "Failed to update auto-renew" errors
