# RLS Policy Fix - Deployment Guide

## Problem
When users try to register, they get the error:
```
new row violates row-level security policy for table "profiles"
```

This is error code **42501** - a PostgreSQL row-level security violation.

## Root Cause
1. The RLS policies on the `profiles` table were too restrictive
2. During registration, Supabase couldn't INSERT the profile row due to RLS constraints
3. The `upsert()` operation wasn't properly handling the auth context

## Solution Implemented

### 1. New Migration File
**File:** `supabase/migrations/20260201_comprehensive_rls_fix.sql`

This migration:
- ✅ Drops all conflicting RLS policies
- ✅ Creates simplified, permissive policies for registration
- ✅ Ensures `auth.role() = 'service_role'` has full access
- ✅ Allows authenticated users to INSERT/UPDATE their own profiles
- ✅ Recreates the trigger for automatic profile creation on signup

### 2. Updated RegisterPage
**File:** `src/pages/auth/RegisterPage.tsx`

Changes:
- ✅ Removed `upsert()` which was causing issues
- ✅ Changed to `insert()` first, then `update()` if it fails
- ✅ Added better error handling for RLS violations (error code 42501)
- ✅ Improved logging for debugging

### 3. How It Works
```typescript
// Step 1: User signs up via Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password
});

// Step 2: Trigger automatically creates basic profile
// (handled by handle_new_user() trigger)

// Step 3: We attempt to INSERT with additional data
const { error: insertError } = await supabase
  .from("profiles")
  .insert(profileData);

// Step 4: If profile already exists, UPDATE instead
if (insertError) {
  await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", data.user.id);
}
```

## Deployment Steps

### Step 1: Apply the Migration in Supabase
```bash
# Option A: Using Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Create new query
3. Copy-paste the entire content of: supabase/migrations/20260201_comprehensive_rls_fix.sql
4. Click "Run"

# Option B: Using Supabase CLI
supabase db push
```

### Step 2: Verify the Migration
Run this SQL in Supabase to verify policies are correct:
```sql
SELECT schemaname, tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
```

Expected output should show:
- `profiles_delete_own`
- `profiles_insert_own`
- `profiles_select_own`
- `profiles_select_super_admin`
- `profiles_service_role_all`
- `profiles_update_own`

### Step 3: Deploy Code Changes
```bash
# Pull latest changes
git pull

# Install dependencies (if needed)
npm install

# Deploy to production
npm run build
```

### Step 4: Test Registration
1. Go to your registration page
2. Create a test account with:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Phone: `+254712345678`
   - Role: `Tenant` (or any role)
   - Password: `TestPassword123`
   
3. Watch the console logs - you should see:
   ```
   🔐 Creating/updating profile for user: [uuid]
   ✅ Profile inserted successfully
   ```

## Troubleshooting

### Still Getting RLS Errors?

**Check 1: Verify policies exist**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Check 2: Check RLS is enabled**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

**Check 3: Clear browser cache and try again**
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear localStorage
- Try incognito/private window

**Check 4: Verify trigger exists**
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
```

### If Still Failing

Run this SQL to disable RLS temporarily (NOT for production):
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Then test registration. If it works, the issue is definitely RLS policies.
Then re-enable and fix the policies.

## Prevention for Future

1. **Always allow `auth.role() = 'service_role'`** in RLS policies
2. **Use INSERT-then-UPDATE pattern** instead of UPSERT for registration flows
3. **Test RLS policies** after any migration
4. **Add comprehensive logging** around auth operations

## Files Changed

```
✅ supabase/migrations/20260201_comprehensive_rls_fix.sql (NEW)
✅ src/pages/auth/RegisterPage.tsx (MODIFIED)
```

## Rollback (If Needed)

If you need to rollback, you can restore from the previous migration:
```sql
-- Run the previous working migration
-- supabase/migrations/20260201_fix_registration_rls.sql
```

## Support

If you continue experiencing issues:
1. Check the browser console for detailed error messages
2. Check Supabase dashboard → Logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Supabase project is on the latest version
