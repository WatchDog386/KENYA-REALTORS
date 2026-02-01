# Troubleshooting: Registration 500 Error Fix

## Issue: Still Getting 500 Error After Migration

### Diagnosis Steps

1. **Check if migration was actually applied**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'users' 
   AND trigger_schema = 'auth'
   AND trigger_name = 'on_auth_user_created';
   ```
   - If no results: Migration didn't run. Run it again.
   - If results: Trigger exists, check next step.

2. **Check trigger timing**:
   ```sql
   SELECT action_timing FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created' 
   AND trigger_schema = 'auth';
   ```
   - Should show: `AFTER`
   - If shows `BEFORE`: Old trigger still active. Need to manually drop it.

3. **Check if profiles table exists**:
   ```sql
   SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'profiles');
   ```
   - Should return: `true`
   - If `false`: Table wasn't created. Run STEP 0 from migration separately.

4. **Check RLS status**:
   ```sql
   SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';
   ```
   - Should return: `profiles | true` (RLS enabled)

### If Trigger Doesn't Exist

Run this to recreate it:

```sql
-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation for user % failed: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger as AFTER INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### If Profiles Table Doesn't Exist

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    email_confirmed BOOLEAN DEFAULT FALSE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    house_number VARCHAR(50),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
```

## Issue: "New row violates row-level security policy"

### Solution

RLS policies are blocking the trigger. Run this:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Recreate the trigger (run the trigger creation code above)

-- Re-enable RLS with correct policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Create new policies
CREATE POLICY "profiles_service_role_all"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id OR auth.role() = 'service_role');
```

## Issue: Profile Not Created After Registration

### Check if auth user exists:

```sql
SELECT id, email, created_at FROM auth.users 
WHERE email = 'test@example.com' 
LIMIT 1;
```

### Check if profile exists:

```sql
SELECT id, email, created_at FROM public.profiles 
WHERE email = 'test@example.com' 
LIMIT 1;
```

### If auth user exists but no profile:

The trigger didn't run or failed silently. Run this:

```sql
-- Manually create profile for user
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT u.id, u.email, u.created_at, NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.email = 'test@example.com';
```

## Issue: 500 Error Specifically with "korrifantes36gmail.com"

### Common Causes

1. **Email format issue**: Email has no @ symbol or invalid format
   - Fix: Use valid email format like `korrifantes36@gmail.com`

2. **Email already exists in auth.users**:
   ```sql
   SELECT * FROM auth.users WHERE email = 'korrifantes36gmail.com';
   ```
   - If found: Delete it from auth and try again
   - Or use a different email

3. **Email already in profiles**:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'korrifantes36gmail.com';
   ```
   - If found: Delete it and try registration again

### Nuclear Option: Reset for Testing

```sql
-- DELETE old test user data (BE CAREFUL!)
DELETE FROM auth.users WHERE email = 'korrifantes36gmail.com';
DELETE FROM public.profiles WHERE email = 'korrifantes36gmail.com';

-- Now try registering again
```

## Checking Trigger Execution Logs

Enable debugging:

```sql
-- Check if function has logs
SELECT 
  pg_get_functiondef(p.oid)
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Check trigger function source code
SELECT pg_get_triggerdef(t.oid)
FROM pg_trigger t
WHERE t.tgname = 'on_auth_user_created';
```

## Verification After Fix

Run all these checks:

```sql
-- 1. Check trigger exists and is AFTER INSERT
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 4. Check RLS policies
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Count users and profiles
SELECT 
  'Auth users' as type,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
  'Profiles',
  COUNT(*)
FROM public.profiles;
```

All checks should show:
- ✅ Trigger exists with `AFTER INSERT` timing
- ✅ Profiles table has all required columns
- ✅ RLS is enabled on profiles
- ✅ 5 RLS policies exist (service_role_all, insert_own, select_own, update_own, delete_own)
- ✅ Auth users and profiles counts are equal or profiles has all auth users

## Still Not Working?

1. **Check Supabase logs**:
   - Dashboard → Database → Logs
   - Look for errors around signup time

2. **Check browser console**:
   - Press F12 in browser
   - Console tab
   - Look for exact error message

3. **Check network tab**:
   - Network tab in DevTools
   - Look at the signup API call
   - Check the response for error details

4. **Contact Supabase Support**:
   - Include trigger code
   - Include RLS policies
   - Include browser console error
   - Include network response

---

**Last Resort**: You can also disable RLS entirely on profiles table (NOT RECOMMENDED for production, only for testing):

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Then try registration. If it works, the issue is RLS-related.
