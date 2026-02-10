# 🔧 REGISTRATION FIX GUIDE (February 2024)

## Problem
Users are getting **"Database error finding user"** when trying to register. This happens because:
1. The auth trigger that creates user profiles is not working
2. RLS (Row Level Security) policies may be blocking profile creation
3. Conflicting triggers or invalid function syntax

## Solution: 3 Easy Steps

### Step 1: Run the SQL Fix in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content of `database/20260204_comprehensive_registration_fix.sql`
4. Paste it into a new SQL query
5. Click **"Run"**
6. Wait for it to complete successfully (should see "COMMIT" at the end)

### Step 2: Verify the Fix
Run this verification query in SQL Editor:
```sql
-- Check that the trigger exists
SELECT 
  schemaname,
  tablename,
  trigger_name,
  function_name
FROM information_schema.triggers
WHERE tablename = 'users' AND schemaname = 'auth'
LIMIT 10;

-- Check the function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Check that profiles RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
```

**Expected Results:**
- ✅ One trigger: `on_auth_user_created` on `auth.users`
- ✅ One function: `handle_new_user` in `public` schema
- ✅ Profiles table has `rowsecurity = true`

### Step 3: Clear Browser Cache & Test
1. Clear your browser cache (or use Incognito/Private mode)
2. Try registering with a new email
3. You should see: "✅ Registration successful!"
4. Then: "📧 Awaiting administrator approval..."

---

## What the Fix Does

### 1. **Removes Conflicting Triggers** 🗑️
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
```
Clears out any duplicate or outdated triggers that might be causing issues.

### 2. **Creates a Bulletproof Function** 🔒
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
```

**Key Features:**
- **SECURITY DEFINER**: Runs as the function creator (superuser), bypassing RLS safely
- **Error Handling**: Logs warnings but doesn't block registration
- **Auto-Approval**: New users are immediately active and approved
- **Null-Safe**: Handles missing metadata gracefully

### 3. **Sets Up Proper RLS Policies** 🛡️
```sql
-- Service role can insert (for the trigger)
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Super admins can manage all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
    AND p.is_active = true
  ));
```

---

## How Registration Works After the Fix

```
User fills form and clicks "Create Account"
        ↓
Supabase creates auth.user with metadata:
  - first_name, last_name, phone, role (from form)
        ↓
Trigger fires: on_auth_user_created
        ↓
Function runs: handle_new_user()
  - Extracts: first_name, last_name, phone, role from raw_user_meta_data
  - Creates: Profile record in public.profiles
  - Status: 'active' (auto-approved)
  - Role: Set to what user selected (tenant/property_manager)
        ↓
Frontend receives auth.user created
        ↓
Frontend waits 1.2 seconds
        ↓
Frontend queries: SELECT id FROM profiles WHERE id = {user_id}
        ↓
Profile is found ✅
        ↓
User is marked as registered
        ↓
"Registration successful!" message
```

---

## Field Mapping

When user fills the registration form, here's what happens to each field:

| Form Field | Database Table | Column | Value |
|-----------|-----------------|--------|-------|
| First Name | profiles | first_name | User input |
| Last Name | profiles | last_name | User input |
| Phone | profiles | phone | User input |
| Email | auth.users + profiles | email | User input |
| Account Type (Dropdown) | profiles | role | 'tenant' OR 'property_manager' |
| Account Type (Dropdown) | profiles | user_type | Same as role |
| - | profiles | status | 'active' (auto) |
| - | profiles | approved | true (auto) |
| - | profiles | is_active | true (auto) |
| Password | auth.users | encrypted_password | Hashed password |

---

## Testing Registration

### Test Case 1: Tenant Registration
```
Email: testenant@example.com
Name: Test Tenant
Phone: +254 712 345 678
Account Type: 👤 Tenant / Renter
Expected: Auto-approved, role='tenant'
```

### Test Case 2: Property Manager Registration
```
Email: testpm@example.com
Name: Test PM
Phone: +254 723 456 789
Account Type: 🏢 Property Manager
Expected: Auto-approved, role='property_manager'
```

### Test Case 3: Verify Profile Created
Query in Supabase:
```sql
SELECT id, email, first_name, last_name, role, status, approved, is_active
FROM profiles
WHERE email = 'testenant@example.com';
```

Expected output:
```
id               | email                  | first_name | last_name | role   | status | approved | is_active
-----------------+------------------------+------------+-----------+--------+--------+----------+-----------
550e8400-e29b... | testenant@example.com | Test       | Tenant    | tenant | active | true     | true
```

---

## Troubleshooting

### Error: "Database error. PLEASE RUN '20260204_comprehensive_registration_fix.sql'"

**This means the trigger is failing.** Check:

1. **Trigger doesn't exist?**
   ```sql
   SELECT COUNT(*) FROM information_schema.triggers 
   WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
   ```
   If count = 0, run the fix again.

2. **Function has syntax errors?**
   ```sql
   SELECT routine_definition FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```
   Look for syntax errors in the output.

3. **RLS policies are too strict?**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'profiles' 
   ORDER BY policyname;
   ```
   Should show:
   - Service role full access
   - Users can view own profile
   - Users can update own profile
   - Super admins can view all profiles
   - Super admins can update all profiles

### Error: "Profile creation failed. Please contact support."

**This means profile query failed.** Check:

1. Wait longer (was 1.2s, but slow servers need more)
2. Check if 'profiles' table exists: `SELECT COUNT(*) FROM profiles;`
3. Check RLS: Is "authenticate" user able to read profiles?

### Profile exists but wrong fields?

Check the handle_new_user function is extracting metadata correctly:
```sql
-- Test the function manually
SELECT nspname, proname, prosecdef 
FROM pg_proc 
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
WHERE proname = 'handle_new_user';
```

Should show: `prosecdef = true` (SECURITY DEFINER is enabled)

---

## FAQ

**Q: Will this auto-approve all registrations?**
A: Yes, by default. If you want manual approval, change `approved = true` to `approved = false` and `status = 'active'` to `status = 'pending'` in the SQL file.

**Q: Can super admins still manage users?**
A: Yes! Super admins can view and edit all profiles due to the "Super admins can view/update all profiles" RLS policies.

**Q: What about roles?**
A: Roles are set during registration based on user selection (tenant/property_manager). Super admins can change roles in User Management.

**Q: Will this work with existing users?**
A: No, it only affects new registrations. For existing users, a separate migration is needed.

**Q: Is SECURITY DEFINER safe?**
A: Yes! It's the best practice for this use case. It allows the TRIGGER to insert into profiles without needing INSERT permission on the table. It's like sudo for SQL.

---

## Quick Reference

| File | Purpose | When to Run |
|------|---------|------------|
| `20260204_comprehensive_registration_fix.sql` | Main fix | When you see "Database error" |
| `URGENT_FIX_REGISTRATION.sql` | Alternative fix | If the main fix fails |
| `database/archive/*` | Old attempts | Don't run these |

---

## Next Steps

After running the fix:

1. ✅ Test registration with a test email
2. ✅ Verify profile was created in SQL Editor
3. ✅ Check super admin can see the user in User Management
4. ✅ All set! Users can now register themselves

---

## Support

If registration still isn't working after running the fix:

1. Run the verification queries above
2. Check the browser console for specific error messages
3. Look at Supabase SQL Editor → Logs for database errors
4. Contact support with the error message

Generated: February 4, 2024
Author: REALTORS System
