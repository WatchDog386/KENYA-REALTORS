# 🚨 CRITICAL FIX: RLS Profile Creation Error (401/42501)

## The Problem
Super_admin can't create profiles for other users. Error: `new row violates row-level security policy for table "profiles"`

## Why It's Happening
The current RLS policies only allow users to create their **own** profile (`auth.uid() = id`). When super_admin tries to create a profile for a different user ID, it's blocked.

## Solution: 3 Steps in Supabase SQL Editor

### ✅ STEP 1: Drop All Conflicting Policies
Copy and run this SQL in your Supabase SQL Editor:

```sql
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

SELECT 'Step 1 Complete: All policies dropped' as status;
```

### ✅ STEP 2: Create Helper Function
Copy and run this SQL:

```sql
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = user_id LIMIT 1),
    FALSE
  )
$$;

SELECT 'Step 2 Complete: Helper function created' as status;
```

**Why this function?** It uses `SECURITY DEFINER` to bypass RLS checks when checking if a user is super_admin. This prevents infinite recursion that causes 500 errors.

### ✅ STEP 3: Create New Non-Recursive RLS Policies
Copy and run this SQL:

```sql
-- Service role can do everything (for auth triggers)
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Users can create their own profile
CREATE POLICY "profiles_user_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can read their own profile
CREATE POLICY "profiles_user_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_user_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Super admin can INSERT any profile (uses helper function - no recursion!)
CREATE POLICY "profiles_admin_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admin can UPDATE any profile
CREATE POLICY "profiles_admin_update"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admin can SELECT all profiles
CREATE POLICY "profiles_admin_select"
    ON public.profiles FOR SELECT
    USING (public.is_super_admin(auth.uid()));

-- Super admin can DELETE profiles
CREATE POLICY "profiles_admin_delete"
    ON public.profiles FOR DELETE
    USING (public.is_super_admin(auth.uid()));

SELECT 'Step 3 Complete: New non-recursive RLS policies created' as status;
```

## 🎯 Expected Results After Fix

✅ Super_admin can create profiles for other users
✅ Super_admin can assign roles to users
✅ Users can fetch their own profiles
✅ No more 401 errors
✅ No more RLS violation errors

## Files Created
- `database/STEP1_DROP_ALL_POLICIES.sql` - First step
- `database/STEP2_CREATE_HELPER_FUNCTION.sql` - Second step  
- `database/STEP3_CREATE_NEW_POLICIES.sql` - Third step
- `supabase/migrations/20260209_super_admin_profile_creation.sql` - Migration file for future deployments
