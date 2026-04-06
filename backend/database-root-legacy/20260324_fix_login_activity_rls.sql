-- Fix login activity RLS policies for Super Admin view

BEGIN;

-- Drop the broken policies that referenced user_id instead of id in profiles
DROP POLICY IF EXISTS "super_admin_view_all_login_activity" ON public.login_activity;

-- Recreate policy using correct column (id)
CREATE POLICY "super_admin_view_all_login_activity"
  ON public.login_activity
  FOR SELECT
  USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND role = 'super_admin'
    )
  );

COMMIT;