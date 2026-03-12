-- Fix login_activity table to allow NULL user_id for failed logins
-- This allows recording failed login attempts from non-existent users

ALTER TABLE login_activity ALTER COLUMN user_id DROP NOT NULL;

-- Drop all existing policies
DROP POLICY IF EXISTS "service_role_insert_login_activity" ON login_activity;
DROP POLICY IF EXISTS "authenticated_insert_login_activity" ON login_activity;
DROP POLICY IF EXISTS "authenticated_update_own_logout" ON login_activity;
DROP POLICY IF EXISTS "super_admin_view_all_login_activity" ON login_activity;
DROP POLICY IF EXISTS "users_view_own_login_activity" ON login_activity;

-- SELECT policies (viewing)
CREATE POLICY "super_admin_view_all_login_activity"
  ON login_activity
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'super_admin'
    )
  );

CREATE POLICY "users_view_own_login_activity"
  ON login_activity
  FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- INSERT policy - allow anyone (authenticated or not) to insert login records
-- This is necessary for recording failed login attempts
CREATE POLICY "allow_insert_login_activity"
  ON login_activity
  FOR INSERT
  WITH CHECK (true);

-- UPDATE policy - allow authenticated users to update their own logout records
CREATE POLICY "authenticated_update_own_logout"
  ON login_activity
  FOR UPDATE
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());
