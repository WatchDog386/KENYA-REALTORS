# Quick Implementation: Fix Registration 500 Error

## TL;DR - What to Do Now

### Step 1: Apply the Migration to Supabase

1. Open [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/20260202_fix_signup_500_error.sql`
4. Paste it into the SQL Editor
5. Click **"Run"**
6. Wait for completion (should take a few seconds)

### Step 2: Verify the Fix

Run this query in SQL Editor:

```sql
-- Check if trigger exists with correct timing
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth'
ORDER BY trigger_name;
```

**Expected output**: One trigger named `on_auth_user_created` with `action_timing = AFTER`

### Step 3: Test Registration

1. Go to your app in browser
2. Click **"Register"**
3. Fill in form as **Property Manager**:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Phone: `+1234567890`
   - Password: `SecurePass123!`
   - Role: `Property Manager`
4. Click **Register**

**Expected**: User created successfully, redirected to profile page

**If Error**: Check browser console for error messages

### Step 4: Check Profile Was Created

1. Supabase Dashboard → **Table Editor**
2. Go to **profiles** table
3. Look for your new user with email `test@example.com`
4. Should see: `id`, `email`, `created_at`, `updated_at` populated

## What This Fix Does

| Issue | Before | After |
|-------|--------|-------|
| Auth Trigger Timing | BEFORE INSERT (blocks auth) | AFTER INSERT (auth completes first) |
| RLS Policies | Strict (blocks trigger) | Service role bypasses (trigger works) |
| Error Handling | Fails on exception | Logs exception, continues |
| Table Structure | May be incomplete | Ensures all columns exist |

## If You Get Errors

### Error: "Trigger does not exist after running migration"
- Migration may have failed
- Check the migration status in Supabase Migrations tab
- Try running the migration again

### Error: "403 Forbidden" or "permission denied"
- RLS policies still blocking
- Run the SQL migration again
- Ensure you're logged in as project admin

### Error: "Relation profiles does not exist"
- The first part of migration (STEP 0) didn't create table
- Run just this part:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Still getting 500 error after migration
- Run this check:
```sql
-- Check profile was created
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check auth users
SELECT COUNT(*) as auth_count FROM auth.users;

-- Check if trigger is active
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';
```

## Testing Email: korrifantes36gmail.com (as mentioned)

Now you can register:
- Email: `korrifantes36gmail.com`
- Password: any password
- Role: `Property Manager`

This should work without 500 error!

## Files Changed

- ✅ `supabase/migrations/20260202_fix_signup_500_error.sql` - Created (migration)
- ✅ `src/contexts/AuthContext.tsx` - Modified (profile fetch)
- ℹ️ `SIGNUP_500_ERROR_FIX.md` - Created (this explanation)

## Rollback (if needed)

If something goes wrong, you can rollback by:

1. Drop the problematic trigger:
```sql
DROP TRIGGER on_auth_user_created ON auth.users;
DROP FUNCTION public.handle_new_user();
```

2. Then contact Supabase support or re-run the migration

## Next: Monitor for Issues

After applying fix, watch for:
- ✅ Users can register successfully
- ✅ Profiles are created in database
- ✅ No 500 errors in browser console
- ✅ Users can login after registering

If any issues occur, check:
1. Supabase Dashboard → Logs
2. Browser DevTools → Console
3. Supabase Dashboard → Database Activity

---

**Need help?** Check the detailed explanation in `SIGNUP_500_ERROR_FIX.md`
