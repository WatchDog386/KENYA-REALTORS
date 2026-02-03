# 🚨 CRITICAL: Fix Infinite Recursion RLS Error - Step by Step

## The Problem
Your app shows: **"infinite recursion detected in policy for relation 'profiles'"** (Error 42P17)

This happens because the RLS policies in migration `20260130_fix_profiles_rls.sql` contain **recursive subqueries**:
```sql
auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
```

When the policy tries to read from `profiles` while protecting `profiles`, it creates infinite recursion.

---

## The Fix (DO THIS NOW)

### Step 1: Go to Supabase Console
1. Open: https://app.supabase.com
2. Select your project: **REALTORS-LEASERS**
3. Click **SQL Editor** (left sidebar)

### Step 2: Copy and Execute the Fix
1. Click **New Query**
2. Copy the ENTIRE content from: `EXECUTE_FIX_IN_SUPABASE_NOW.sql`
3. Paste it into the SQL editor
4. Click **RUN** button (top right)
5. Wait for completion ✅

### Step 3: Verify Success
You should see:
```
BEFORE FIX: [shows all the problematic policies]
AFTER FIX - Current Policies: [shows 4 new safe policies]
Testing user query: [shows your super admin profile]
RLS Status: relrowsecurity = true
```

### Step 4: Reload Your App
1. Close browser tab with React app
2. Go back to: http://192.168.0.106:8081
3. You should now see NO "infinite recursion" error
4. Profile should load successfully ✅

---

## What Changed

### ❌ BEFORE (Recursive - BROKEN):
```sql
CREATE POLICY "Super admins can insert any profile" 
    ON profiles FOR INSERT 
    WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
    );
```
← This reads from `profiles` while protecting `profiles` = INFINITE RECURSION

### ✅ AFTER (Non-recursive - FIXED):
```sql
CREATE POLICY "Service role full access"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
```
← These only use `auth.uid()` and `auth.role()` = NO RECURSION

---

## New Security Model

| User Type | Can Do | How |
|-----------|--------|-----|
| **Service Role** (backend) | Everything | `auth.role() = 'service_role'` |
| **Regular User** | Read own profile | `auth.uid() = id` |
| **Regular User** | Update own profile | `auth.uid() = id` |
| **Super Admin** | Everything | Via service role (backend logic) |

---

## ⚠️ Important Notes

- **Admin operations** now go through your backend/functions, not direct RLS
- **Service role** is used for backend operations only
- **Regular users** can only access their own profile
- This is **more secure** than before

---

## If You Still See the Error After Running the SQL

1. **Hard refresh** your browser: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
2. **Clear browser cache**: DevTools → Application → Clear Storage
3. **Check the Supabase logs**: SQL Editor → Look for any errors from the script
4. **Copy this file** and share the exact error from Supabase

---

## Files Updated
- ✅ Migration file: `20260130_fix_profiles_rls.sql` (fixed)
- ✅ SQL script ready to execute: `EXECUTE_FIX_IN_SUPABASE_NOW.sql`
- ✅ Fix reference: `FIX_INFINITE_RECURSION_RLS.sql`
