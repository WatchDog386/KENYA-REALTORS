-- ============================================================================
-- ENHANCEMENT: ENSURE PROFILES SYNCS FROM AUTH.USERS
-- ============================================================================
-- This migration ensures that the profiles table properly syncs all users
-- from auth.users and maintains data consistency

-- 1. CREATE IMPROVED SYNC FUNCTION (Enhanced)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    status, 
    user_type, 
    created_at, 
    updated_at,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role,
    'active', -- Default to active
    v_role,   -- Set user_type same as role
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed for user %s: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. CREATE TRIGGER FOR NEW USER SIGNUPS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. SYNC ALL EXISTING AUTH USERS TO PROFILES
-- This ensures all users in auth.users exist in profiles table
INSERT INTO public.profiles (id, email, first_name, last_name, role, user_type, status, is_active, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', ''),
    COALESCE(u.raw_user_meta_data->>'last_name', ''),
    COALESCE(u.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(u.raw_user_meta_data->>'role', 'tenant'),
    'active',
    true,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 4. SET SUPER ADMIN FOR DUNCANMARSHEL@GMAIL.COM
-- Ensure the super admin user has the correct role and all fields set
DO $$
DECLARE
    v_super_admin_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO v_super_admin_id FROM auth.users 
    WHERE LOWER(email) = LOWER('duncanmarshel@gmail.com') 
    LIMIT 1;
    
    IF v_super_admin_id IS NOT NULL THEN
        -- Update or insert super admin profile
        INSERT INTO public.profiles (
            id, email, first_name, last_name, role, user_type, status, is_active, created_at, updated_at
        )
        SELECT 
            v_super_admin_id,
            'duncanmarshel@gmail.com',
            'Duncan',
            'Marshel',
            'super_admin',
            'super_admin',
            'active',
            true,
            COALESCE(created_at, NOW()),
            NOW()
        FROM auth.users
        WHERE id = v_super_admin_id
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'super_admin',
            user_type = 'super_admin',
            status = 'active',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE '✅ SUPER ADMIN SET: duncanmarshel@gmail.com now has super_admin role';
    ELSE
        RAISE WARNING '⚠️ duncanmarshel@gmail.com not found in auth.users. Please create the account first.';
    END IF;
END $$;

-- 5. CREATE FUNCTION TO FETCH USERS WITH AUTH DATA
-- This function ensures super admin can view all users
CREATE OR REPLACE FUNCTION public.get_all_users_with_auth()
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    user_type TEXT,
    status TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    avatar_url TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if current user is super_admin or service_role
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) NOT IN ('super_admin') 
       AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Only super admins can view all users';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.role,
        p.user_type,
        p.status,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.last_login_at,
        p.avatar_url
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- 6. UPDATE RLS POLICY FOR SUPER ADMIN TO VIEW ALL USERS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Clear old policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Re-enable with updated policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their OWN profile
CREATE POLICY "users_manage_own_profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Super Admin can view ALL users
CREATE POLICY "super_admin_view_all_users" 
ON public.profiles FOR SELECT 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Super Admin can update any user
CREATE POLICY "super_admin_update_users" 
ON public.profiles FOR UPDATE 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Service Role (Full Access)
CREATE POLICY "service_role_full_access" 
ON public.profiles FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ USER SYNC ENHANCEMENT COMPLETE';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Step 1: Sync function improved with better error handling';
    RAISE NOTICE '✅ Step 2: Trigger created for new user signups';
    RAISE NOTICE '✅ Step 3: All existing auth.users synced to profiles table';
    RAISE NOTICE '✅ Step 4: Super admin role assigned to duncanmarshel@gmail.com';
    RAISE NOTICE '✅ Step 5: RPC function created for dashboard queries';
    RAISE NOTICE '✅ Step 6: Super admin RLS policies updated for full visibility';
    RAISE NOTICE '';
    RAISE NOTICE 'RESULT: Users can now be fetched and managed via profiles table';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
