-- ============================================================================
-- URGENT FIX FOR REGISTRATION ERROR 500 (VERSION 2 - CRASH PROOF)
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/rcxmrtqgppayncelonls/sql/new
-- 2. Paste this ENTIRE file content into the SQL Editor.
-- 3. Click "Run" (bottom right).
-- ============================================================================

BEGIN;

-- 1. CLEANUP: Drop all existing triggers on auth.users causing the crash
DO $$
DECLARE
    trg record;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE;', trg.trigger_name);
    END LOOP;
END $$;

-- 2. CLEANUP: Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. SCHEMA: Ensure profiles table has all needed columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. FUNCTION: Create a crash-proof profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  -- Safe metadata extraction with defaults
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Validate role
  IF v_role NOT IN ('tenant', 'property_manager', 'super_admin') THEN
    v_role := 'tenant';
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- UPSERT into profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role, 
    user_type, 
    is_active, 
    status, 
    approved
  ) VALUES (
    NEW.id, 
    NEW.email, 
    v_first_name, 
    v_last_name, 
    v_phone, 
    v_role, 
    v_role, 
    true,         -- Active
    'active',     -- Status
    false         -- Approved (set to true if you want auto-approval)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Catch errors so auth.users insert doesn't fail!
  RAISE WARNING 'User created but profile sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 5. TRIGGER: Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. SYNC: Restore email sync trigger
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email <> OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_email_trigger
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email();

COMMIT;
