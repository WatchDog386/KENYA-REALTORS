# CRITICAL: Fix Infinite Recursion RLS Error

## Problem
```
Error: infinite recursion detected in policy for relation "profiles"
Code: 42P17
```

This happens when RLS policies contain subqueries that reference the same table being protected.

## Root Cause
The policies in `20260130_fix_profiles_rls.sql` contain:
```sql
auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
```

This is a **recursive policy** - the policy tries to read from the profiles table while enforcing RLS on the profiles table, creating infinite recursion.

## Solution

### Step 1: Run the SQL Fix
Go to **Supabase → SQL Editor** and paste the contents of:
```
FIX_INFINITE_RECURSION_RLS.sql
```

This will:
1. Temporarily disable RLS (so we can modify policies)
2. Drop all problematic recursive policies
3. Create new non-recursive policies that:
   - Only check `auth.uid()` and `auth.role()` (no subqueries)
   - Use `service_role` for admin operations
   - Avoid any table self-references

### Step 2: Verify the Fix
After running the SQL, check the browser console:
- ✅ Should see profile fetch succeed
- ❌ No more "infinite recursion" errors

### Step 3: If You Need Super Admin Access
If regular users still can't access certain features, you can:
1. Have super admins manage role changes via the backend
2. Use a separate "permissions" or "roles" table instead of querying profiles within policies
3. Use auth.jwt() claims instead of subqueries

## New Policy Structure
```
- Service role (backend/database functions): Full access
- Regular users: Can READ/INSERT/UPDATE only their own profile
- All checks use auth.uid() and auth.role() - NO subqueries
```

## Prevention
Always remember in RLS policies:
- ✅ Safe: `auth.uid() = id`
- ✅ Safe: `auth.role() = 'service_role'`
- ❌ Dangerous: `auth.uid() IN (SELECT id FROM [same_table] ...)`
