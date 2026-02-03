# Fix: Profile 500 Error - Complete Solution

## Problem

You're seeing this error in the console:

```
Failed to load resource: the server responded with a status of 500 ()
Error fetching profile: Object
User authenticated but no profile
```

The issue: Supabase returns a **500 error** when trying to fetch the profile for user ID `0cef7b99-69ab-4a16-ba5b-b76fb0295e7e`.

### Root Cause

The RLS (Row Level Security) policy for super admins contains a **subquery that fails**:

```sql
-- BROKEN - This causes 500 errors
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  );
```

**Why it fails:**
1. User logs in with ID `0cef7b99-69ab-4a16-ba5b-b76fb0295e7e`
2. App tries to fetch profile: `SELECT * FROM profiles WHERE id = auth.uid()`
3. RLS policy runs, and it tries to execute the subquery
4. The subquery also tries to query the profiles table
5. Since the policy blocks all access to profiles for this user (they don't have a profile yet), the subquery returns 0 rows
6. RLS policy blocks the query
7. **500 error**

## Solution

### 1. Updated SQL Migration (Apply this one instead)

File: `supabase/migrations/20260203_fix_infinite_recursion.sql`

This new migration fixes the recursion by:
- ✅ Creating a `SECURITY DEFINER` function `check_is_super_admin()`
- ✅ This function bypasses RLS to check the role safely
- ✅ Replacing policies to use this function instead of direct table queries

**Why this works:** `SECURITY DEFINER` functions run with the permissions of the creator (database owner), bypassing the Row Level Security policies on the table. This breaks the infinite loop where "Checking if I can read the table requires reading the table".

### 2. Updated TypeScript Code

File: `src/contexts/AuthContext.tsx` - Line 111

**Changed from:**
```typescript
.single()  // ❌ Throws error if no row found
```

**Changed to:**
```typescript
.maybeSingle()  // ✅ Returns null if no row found, doesn't throw
```

**Why:** The `.maybeSingle()` method gracefully handles missing profiles instead of throwing an error, which was causing the promise rejection.

## What to Do Now

### Step 1: Run the SQL Migration

Execute the new SQL migration in Supabase SQL Editor:

```bash
# Copy all content from:
supabase/migrations/20260203_fix_infinite_recursion.sql

# Paste into Supabase Dashboard > SQL Editor > Run
```

Or if using Supabase CLI:
```bash
supabase migration up
```

### Step 2: Clear Browser Cache

The changes are in place. Clear your browser's local storage and reload:

```javascript
// In browser console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 3: Test

1. **Log in** with the super admin account:
   - Email: `duncanmarshel@gmail.com`
   - Password: `Marshel@1992`

2. **Check console** for these log messages:
   ```
   ✅ Profile found: duncanmarshel@gmail.com Role: super_admin
   ✅ User authenticated with profile
   ✅ Supabase connection OK
   ```

3. **Verify** you can:
   - Access the dashboard
   - Navigate without "User authenticated but no profile" errors
   - See profile data load successfully

## Troubleshooting

### Still seeing 500 errors?

1. **Verify the migration ran:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM public.profiles 
   WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';
   ```
   Should return 1 row with role = 'super_admin'

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles' 
   ORDER BY policyname;
   ```
   Should show the new policies from migration 20260203

3. **Hard refresh the app:**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - Clear Supabase cache in local storage
   - Log out and log in again

### Profile still not showing?

If the profile fetch works but you're still redirected to profile recovery:

1. Check if role is being set correctly:
   ```typescript
   // Add this to AuthContext.tsx after line 123:
   console.log("✅ Profile found:", data.email, "Role:", data.role);
   ```

2. Verify the profile has a role assigned:
   ```sql
   SELECT id, email, role, status FROM public.profiles;
   ```

## Files Changed

| File | Change | Why |
|------|--------|-----|
| `supabase/migrations/20260203_fix_infinite_recursion.sql` | New migration | Fixes 42P17 infinite recursion error |
| `src/contexts/AuthContext.tsx` | Line 111: `.single()` → `.maybeSingle()` | Gracefully handle missing profiles |

## Technical Details

### Why RLS Policies Were Breaking

The original policies had circular dependency:
- Policy: "Can I query profiles?" → Check subquery
- Subquery: "SELECT FROM profiles WHERE..." → Hits the RLS policy again
- RLS policy blocks it → 500 error

### The Fix

New policies avoid subqueries by:
1. **Service role bypass**: Migrations and triggers don't need RLS
2. **Simple auth checks**: Use `auth.uid()` directly, not subqueries
3. **Single subquery check**: Only one level of nesting in super admin check
4. **Defensive client code**: Use `.maybeSingle()` to handle missing data

## Prevention

For future development:
- ✅ Avoid circular RLS policy dependencies
- ✅ Use `.maybeSingle()` instead of `.single()` for optional profiles
- ✅ Test RLS policies with missing rows before applying
- ✅ Keep RLS policies as simple as possible

---

**Status:** ✅ Ready to deploy

**Date Fixed:** February 3, 2026

**Next Steps:** Run the migration and reload the application.
