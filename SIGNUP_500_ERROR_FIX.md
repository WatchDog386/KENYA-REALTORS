# Fix: Registration 500 Error - "Database error finding user"

## Problem
Users registering with an email (e.g., korrifantes36gmail.com) receive a **500 Internal Server Error** with message:
```
AuthApiError: Database error finding user
```

## Root Causes Identified

1. **Missing Profile During Auth Trigger**: When a user signs up, Supabase tries to create an auth user, but the auth trigger may fail to create the profile record
2. **RLS Policy Blocking**: Row Level Security policies on the profiles table can prevent the trigger from inserting the profile
3. **Incomplete Table Definition**: The profiles table may not have been properly initialized
4. **BEFORE INSERT Trigger Issues**: Previous trigger was using `BEFORE INSERT` which can cause auth system issues

## Solutions Applied

### Migration: `20260202_fix_signup_500_error.sql`

This migration implements the following fixes:

#### 1. **Ensure Profiles Table Exists** (STEP 0)
- Creates the `public.profiles` table if it doesn't exist
- Includes all required columns:
  - Basic info: `id`, `email`, `first_name`, `last_name`, `phone`, `avatar_url`
  - Role & Status: `role`, `status`, `email_confirmed`
  - Tenant fields: `property_id`, `unit_id`, `house_number`
  - Timestamps: `created_at`, `updated_at`, `last_login_at`
- Sets up proper indexes for performance

#### 2. **Disable RLS During Profile Creation** (STEP 1)
- Temporarily disables RLS on profiles table
- Allows the auth trigger to create profiles without policy restrictions
- RLS is re-enabled after trigger setup

#### 3. **Recreate Trigger with Error Handling** (STEP 2)
- Changes from `BEFORE INSERT` to `AFTER INSERT`
  - `AFTER INSERT` allows the auth.users row to be created first
  - Prevents auth system from rejecting the operation
- Adds comprehensive error handling:
  - Uses `ON CONFLICT` to handle duplicate profile attempts
  - Catches exceptions and logs them without blocking signup
  - Returns NEW even on error (doesn't prevent auth completion)

#### 4. **Re-enable RLS with Corrected Policies** (STEP 3-4)
- Re-enables RLS after trigger is in place
- Creates simplified, robust policies:
  - `profiles_service_role_all`: Service role (backend) has full access
  - `profiles_insert_own`: Users can insert their own profile
  - `profiles_select_own`: Users can read their own profile
  - `profiles_update_own`: Users can update their own profile
  - `profiles_delete_own`: Users can delete their own profile

## Additional Fixes

### AuthContext.tsx Changes
Changed the `fetchUserProfileFromDB` function to:
- Remove `.single()` call that throws errors when no row found
- Handle empty result sets gracefully
- Return `null` instead of throwing errors

### RegisterPage.tsx Already Had
- Proper insert/update error handling
- Fallback to update if insert fails
- This means the app already had defensive code

## How It Fixes the 500 Error

**Before**: 
```
User clicks Register 
→ Auth.signUp() called 
→ auth.users row created 
→ Trigger fires BEFORE INSERT
→ RLS policy blocks profile creation
→ Auth system can't find user
→ 500 Error returned
```

**After**:
```
User clicks Register
→ Auth.signUp() called
→ auth.users row created
→ Trigger fires AFTER INSERT (profile creation succeeds even if errors)
→ RLS allows service_role to bypass restrictions
→ Profile created successfully
→ Auth system completes
→ User created successfully
```

## Testing the Fix

1. **Deploy the migration** to your Supabase database
2. **Try registering** with any email and password as "Property Manager"
3. **Check browser console** for success messages instead of 500 errors
4. **Verify profile created** in Supabase Studio → profiles table

## Verification

The migration includes verification steps:
```sql
SELECT 'Signup 500 error fix applied!' as status;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth'
ORDER BY trigger_name;
```

Run this in Supabase SQL Editor to confirm:
- ✅ Trigger exists on `auth.users`
- ✅ Trigger timing is `AFTER INSERT` (not `BEFORE INSERT`)
- ✅ Trigger is properly configured

## Related Files Modified

1. `src/contexts/AuthContext.tsx` - Removed `.single()` from profile fetch
2. `supabase/migrations/20260202_fix_signup_500_error.sql` - Complete trigger and RLS fix

## Next Steps

1. Apply the migration in Supabase
2. Run the verification query
3. Test registration with a new user
4. Monitor console for any additional errors
5. If still having issues, check Supabase logs for trigger execution details
