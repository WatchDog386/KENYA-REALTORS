# 🔧 MANUAL CLEANUP - Remove Broken User & Start Fresh

## The Problem
The user registration is failing with "Database error finding user" - this means the auth.users record is being created but the trigger to create the profile is failing.

## Solution: Manual Cleanup

### Option 1: Database Cleanup (Recommended)

Run this in Supabase SQL Editor:

```sql
-- ============================================================================
-- IDENTIFY THE BROKEN USER
-- ============================================================================
-- Find the most recent failed user (run this first to see what to delete)
SELECT id, email, created_at FROM auth.users 
ORDER BY created_at DESC LIMIT 1;

-- Check if profile exists for that user
SELECT id, email, role FROM public.profiles 
WHERE email = 'PASTE_EMAIL_HERE';
```

Then delete the broken user:

```sql
-- ============================================================================
-- DELETE THE BROKEN USER
-- ============================================================================
-- Copy the user ID from the SELECT above, then run:
DELETE FROM auth.users WHERE id = 'PASTE_USER_ID_HERE';

-- Also delete any orphaned profile data:
DELETE FROM public.manager_approvals 
WHERE manager_id = 'PASTE_USER_ID_HERE';

DELETE FROM public.profiles 
WHERE id = 'PASTE_USER_ID_HERE';
```

### Option 2: Run Full Cleanup Migration

1. Go to Supabase SQL Editor
2. Copy entire file: `supabase/migrations/20260202_cleanup_and_reset.sql`
3. Paste and Run
4. This will:
   - ✅ Delete orphaned profiles
   - ✅ Delete orphaned approvals/verifications
   - ✅ Recreate the trigger properly
   - ✅ Verify all policies exist

---

## After Cleanup: Try Registration Again

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Go to registration page**
3. **Try creating property manager account again:**
   ```
   Email: propertymanager@test.com
   Password: Test123456
   Full Name: Test Manager
   Phone: +254712345680
   Role: Property Manager
   Properties: Select any property
   ```
4. **Watch console for logs**
5. Should see: `✅ Profile inserted successfully` (or `📝 Profile exists...`)

---

## If Still Failing

1. **Check the trigger is working:**
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE event_object_table = 'users';
   ```
   Should return: `on_auth_user_created`

2. **Check RLS policies:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
   ```
   Should return 5 policies:
   - profiles_service_role_all
   - profiles_insert_own
   - profiles_select_own
   - profiles_update_own
   - profiles_delete_own

3. **Check if related table policies exist:**
   ```sql
   SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('manager_approvals', 'tenant_verifications', 'notifications');
   ```
   Should return 9+ policies

---

## Step-by-Step Cleanup Instructions

### Step 1: Find the Broken User
```
1. Supabase Dashboard
2. SQL Editor
3. Run:
   SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 1;
4. Copy the ID (looks like: 550e8400-e29b-41d4-a716-446655440005)
```

### Step 2: Delete the Broken User
```
1. In SQL Editor, run:
   DELETE FROM auth.users WHERE id = '[PASTE_ID_HERE]';
2. Verify it's deleted:
   SELECT * FROM auth.users WHERE id = '[PASTE_ID_HERE]';
   Should return nothing
```

### Step 3: Run Cleanup Migration
```
1. Copy: supabase/migrations/20260202_cleanup_and_reset.sql
2. Paste in SQL Editor
3. Run it
4. Should see: "Cleanup and trigger fix complete!"
```

### Step 4: Try Registration Again
```
1. Go to registration page
2. Create new property manager account with NEW email (different from before)
3. Check console for success logs
```

---

## Quick Reference

| Issue | Check |
|-------|-------|
| Trigger not firing | `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';` |
| RLS blocking access | `SELECT policyname FROM pg_policies WHERE tablename = 'profiles';` |
| Orphaned data | `DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);` |
| User still exists | `SELECT id FROM auth.users WHERE email = 'test@test.com';` |

---

## Recommended Flow

1. ✅ Run cleanup migration (20260202_cleanup_and_reset.sql)
2. ✅ Wait 5 seconds
3. ✅ Clear browser cache (Ctrl+Shift+R)
4. ✅ Try registration with NEW email address
5. ✅ Monitor console logs
6. ✅ Should work now!

---

**Go ahead and try this. The cleanup migration should fix everything!** ✅
