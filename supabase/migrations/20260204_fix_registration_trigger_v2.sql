-- ============================================================================
-- EMERGENCY REGISTRATION FIX V2
-- fixes "Database error finding user" by ensuring profiles table is compatible
-- ============================================================================

-- 1. DROP TRIGGER and FUNCTION first to release locks
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. ENSURE PROFILES TABLE IS COMPATIBLE
-- We act defensively here to ensure columns exist and don't have bad constraints
DO $$
BEGIN
    -- Ensure status column exists and is text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Ensure user_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'tenant';
    END IF;

    -- Drop potential check constraints on role if they restrict our new roles
    -- (It's hard to target specific constraints without name, so we rely on TEXT type)
    -- We can try to alter the column type to TEXT to drop constraint effects if it was an ENUM
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;
    ALTER TABLE public.profiles ALTER COLUMN user_type TYPE TEXT;
    
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Error during table alteration: %', SQLERRM;
END $$;

-- 3. RECREATE THE HANDLER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_phone TEXT;
    v_status TEXT;
BEGIN
    -- Safe extraction with defaults
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    
    -- Status logic
    IF v_role = 'super_admin' THEN
        v_status := 'active';
    ELSE
        v_status := 'pending';
    END IF;
    
    -- Insert profile with conflict handling
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name,
        last_name,
        phone,
        role,
        user_type,
        status,
        is_active,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_phone,
        v_role,
        v_role,
        v_status,
        (v_role = 'super_admin'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type, -- Ensure this is updated too
        status = EXCLUDED.status,
        updated_at = NOW();
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- VITAL: We log the error but we MUST NOT FAIL the transaction if we want the user to be created in auth.users
    -- However, if we don't create the profile, the app might break later. 
    -- But "Database error finding user" is caused by RAISE EXCEPTION here.
    -- Better to RAISE WARNING and let the user be created, then the UI retries profile creation?
    -- NO, the UI expects profile to exist. We must fix the root cause. 
    -- The root cause is usually column mismatch.
    RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    -- We re-raise to ensure we don't have half-baked users
    RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$;

-- 4. RECREATE TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFY/FIX RLS POLICIES (Simplest set to ensure it works)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- We don't strictly need insert policy for the trigger (it bypasses RLS), but for manual fixes:
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

