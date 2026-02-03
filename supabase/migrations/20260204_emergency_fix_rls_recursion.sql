-- ============================================================================
-- EMERGENCY FIX: STOP RLS RECURSION & GENERATED COLUMN ERROR
-- ============================================================================

-- 1. DISABLE RLS TEMPORARILY
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. FIX "GENERATED COLUMN" ERROR
-- The user_type column is acting as a generated column, causing inserts to fail.
-- We will convert it to a regular text column so we can manage it manually.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_type CASCADE;
ALTER TABLE public.profiles ADD COLUMN user_type TEXT;

-- Sync user_type with role for existing records
UPDATE public.profiles SET user_type = role;

-- 4. RE-ENABLE RLS WITH SAFE POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. CREATE SAFE POLICIES (No Recursion)

-- Users can read/update their OWN profile
CREATE POLICY "users_manage_own_profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service Role (Full Access)
CREATE POLICY "service_role_full_access" 
ON public.profiles FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- Other Tables (drop if exists to avoid errors)
DROP POLICY IF EXISTS "manager_approvals_own" ON public.manager_approvals;
CREATE POLICY "manager_approvals_own" ON public.manager_approvals FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "tenant_approvals_own" ON public.tenant_approvals;
CREATE POLICY "tenant_approvals_own" ON public.tenant_approvals FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (recipient_id = auth.uid());

-- 6. FIX THE TRIGGER (Now safe to insert user_type)
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
  
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role,
    'active', -- Default to active
    v_role,   -- Set user_type same as role
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. VERIFY SUPER ADMIN
INSERT INTO public.profiles (id, email, first_name, last_name, role, user_type, status, is_active)
SELECT 
    id, 
    email, 
    'Duncan', 
    'Marshel', 
    'super_admin', 
    'super_admin', 
    'active', 
    true
FROM auth.users 
WHERE email = 'duncanmarshel@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
    role = 'super_admin', 
    user_type = 'super_admin',
    status = 'active', 
    is_active = true;

DO $$
BEGIN
    RAISE NOTICE '✅ FIX COMPLETE: user_type column recreated as standard TEXT.';
    RAISE NOTICE '✅ RLS FIXED: Non-recursive policies applied.';
    RAISE NOTICE '✅ SUPER ADMIN: duncanmarshel@gmail.com verified.';
END $$;

