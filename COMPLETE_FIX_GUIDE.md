# 🚨 COMPLETE RLS FIX - ALL ISSUES AT ONCE

## The Problems You're Experiencing
1. ❌ 401 error when super_admin tries to create profiles
2. ❌ RLS policy violations on INSERT
3. ❌ Sync showing `profilesCount: 0` (profiles might be missing)
4. ❌ Properties table might have similar issues
5. ❌ Users without profiles in the system

## Solution: Run These TWO Scripts in Order

### ✅ SCRIPT 1: Complete RLS Fix (Run First)
**File:** [database/COMPLETE_RLS_FIX_ALL_TABLES.sql](database/COMPLETE_RLS_FIX_ALL_TABLES.sql)

This single script:
- ✅ Diagnoses current state
- ✅ Drops ALL old conflicting policies
- ✅ Creates the `is_super_admin()` helper function
- ✅ Creates new non-recursive RLS policies for:
  - **profiles** table (8 policies)
  - **properties** table (5 policies)
  - **units_detailed** table (3 policies)
  - **leases** table (3 policies)
- ✅ Provides verification report

**In Supabase SQL Editor:**
1. Copy entire content of `COMPLETE_RLS_FIX_ALL_TABLES.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Check the verification output

### ✅ SCRIPT 2: Sync Missing Profiles (Run Second)
**File:** [database/SYNC_MISSING_PROFILES.sql](database/SYNC_MISSING_PROFILES.sql)

This script:
- ✅ Creates profiles for any auth.users that are missing profiles
- ✅ Syncs metadata from auth.users to profiles table
- ✅ Shows you how many profiles were created
- ✅ Confirms no orphaned users remain

**In Supabase SQL Editor:**
1. Copy entire content of `SYNC_MISSING_PROFILES.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Check the sync results

## Why This Works

### The Key: `is_super_admin()` Function
```sql
CREATE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
```

**SECURITY DEFINER** - This is crucial! It:
- ✅ Bypasses RLS checks when looking up if someone is super_admin
- ✅ Prevents infinite recursion that causes 500 errors
- ✅ Allows super_admin policies to work without querying the same table they're protecting

### Policy Structure
```
1. Service role policies → Full access (for auth triggers)
2. User self policies → Can only read/write their own profile
3. Super admin policies → Can do anything (using is_super_admin function)
```

## Expected Results After Fix

✅ Super_admin can create profiles for new users
✅ Super_admin can assign roles to users
✅ No more 401 Unauthorized errors
✅ No more RLS violation errors
✅ User sync shows correct profile counts
✅ All tables have proper access controls

## If It Still Doesn't Work

1. **Check super_admin profile exists:**
   ```sql
   SELECT * FROM public.profiles WHERE role = 'super_admin';
   ```

2. **Verify helper function:**
   ```sql
   SELECT public.is_super_admin('your-super-admin-uuid-here'::uuid);
   ```

3. **Check recent auth users:**
   ```sql
   SELECT email, role FROM public.profiles ORDER BY created_at DESC LIMIT 10;
   ```

## Files Created
- `database/COMPLETE_RLS_FIX_ALL_TABLES.sql` - Main fix (run first)
- `database/SYNC_MISSING_PROFILES.sql` - Profile sync (run second)
- `supabase/migrations/20260209_super_admin_profile_creation.sql` - Migration file
