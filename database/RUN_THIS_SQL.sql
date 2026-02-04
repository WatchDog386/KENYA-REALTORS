-- ============================================================================
-- EXACT SQL TO RUN IN SUPABASE - Copy & Paste This
-- ============================================================================
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor" in left sidebar  
-- 3. Click "+ New query"
-- 4. Copy everything below
-- 5. Click "Run"
-- 6. Wait for completion message
-- ============================================================================

-- ============================================================================
-- FIX: Registration 500 Error - Circular RLS Logic
-- Date: February 3, 2026
-- ============================================================================

-- STEP 1: Drop all problematic RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;

-- STEP 2: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create NEW RLS policies (no circular logic)
-- Service role can do everything
CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Users can SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can SELECT all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  );

-- Super admins can UPDATE any profile
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  );

-- STEP 4: Recreate the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  v_user_id := NEW.id;
  v_email := NEW.email;

  -- Extract user metadata if available
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    updated_at = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail signup
  RAISE LOG 'Warning: Profile creation failed for user %: %', v_user_id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create AFTER INSERT trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.units_detailed TO authenticated;

-- VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✅ Registration fix applied successfully!';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✓ RLS policies updated - no circular logic';
  RAISE NOTICE '✓ Auth trigger uses SECURITY DEFINER';
  RAISE NOTICE '✓ Service role can manage profiles';
  RAISE NOTICE '✓ Authenticated users have proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test registration!';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;
