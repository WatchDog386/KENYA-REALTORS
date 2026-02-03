-- ============================================================================
-- ALLOW AUTH ADMIN TO WRITE PROFILES
-- Date: February 8, 2026
-- Purpose: Fix auth signup 500 by allowing auth trigger to insert/update profiles
-- ============================================================================

-- Create policy for supabase_auth_admin (auth trigger role)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_auth_admin_all'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "profiles_auth_admin_all" ON public.profiles';
  END IF;
END
$$;

CREATE POLICY "profiles_auth_admin_all"
  ON public.profiles FOR ALL
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

SELECT 'Auth admin profile policy added' as status;
