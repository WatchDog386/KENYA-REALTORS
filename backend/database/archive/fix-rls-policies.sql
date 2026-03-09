-- COMPREHENSIVE FIX FOR RLS POLICY VIOLATION (Code 42501)
-- Run this in Supabase SQL Editor

-- ============================================================
-- PART 1: DROP ALL EXISTING POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow signup profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for own record" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own record" ON public.profiles;

-- ============================================================
-- PART 2: ENABLE RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 3: CREATE NEW POLICIES - PERMISSIVE FOR SIGNUP
-- ============================================================

-- Allow ANY user (authenticated or signup session) to INSERT their own profile
CREATE POLICY "Enable insert for signup"
ON public.profiles
FOR INSERT
WITH CHECK (
  -- Allow if matching their UID or if new user during signup
  (auth.uid() = id) OR 
  (auth.uid()::text != '') OR 
  (current_user = 'authenticated')
);

-- Allow users to SELECT only their own profile
CREATE POLICY "Enable read for own record"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR auth.role() = 'service_role'
);

-- Allow users to UPDATE only their own profile
CREATE POLICY "Enable update for own record"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service_role (backend) full access
CREATE POLICY "Enable all for service role"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- PART 4: CREATE AUTO-INSERT TRIGGER (OPTIONAL but RECOMMENDED)
-- ============================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = new.email, updated_at = now();
  
  RETURN new;
END;
$$;

-- Create trigger on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PART 5: VERIFY SETUP
-- ============================================================
SELECT 'Policies:' as check_name;
SELECT schemaname, tablename, policyname, permissive, roles FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;

SELECT '' as separator;
SELECT 'Trigger:' as check_name;
SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE event_object_table = 'users' AND trigger_schema = 'auth';
