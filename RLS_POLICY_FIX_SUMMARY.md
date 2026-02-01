# RLS Policy Violation Fix - Summary

## 🔴 Problem
**Error:** `new row violates row-level security policy for table "profiles"` (Error 42501)

**When:** During user registration when creating a profile

## 🟢 Solution

### What Was Wrong
1. RLS policies on `profiles` table were too restrictive
2. `upsert()` operation wasn't respecting auth context properly
3. Policies didn't allow authenticated users to insert their own profiles

### What We Fixed

#### 1. **Database Migration** 
File: `supabase/migrations/20260201_comprehensive_rls_fix.sql`

✅ Simplified all RLS policies
✅ Enabled `service_role` full access
✅ Allowed authenticated users to insert/update own profiles
✅ Recreated auto-profile creation trigger

#### 2. **Registration Code**
File: `src/pages/auth/RegisterPage.tsx`

✅ Changed from `upsert()` to `insert()` then `update()` pattern
✅ Better error detection and handling
✅ Improved console logging for debugging
✅ Specific handling for error code 42501 (RLS violations)

## 🚀 How to Deploy

### Option 1: Quick Fix (Recommended)
1. **Copy the SQL migration** from `supabase/migrations/20260201_comprehensive_rls_fix.sql`
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the SQL
4. **Deploy the code changes** (already done for RegisterPage.tsx)

### Option 2: Using CLI
```bash
supabase db push
npm run build
```

## ✅ Verification

After deployment, verify the fix:

```sql
-- Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Should return:
-- profiles_delete_own
-- profiles_insert_own
-- profiles_select_own
-- profiles_select_super_admin
-- profiles_service_role_all
-- profiles_update_own
```

Test registration:
- Create new account
- Check console for logs starting with ✅
- Account should be created successfully

## 📋 Technical Details

### The RLS Policy Set
```sql
-- Service role (backend) has full access
CREATE POLICY "profiles_service_role_all" FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Users can see/update/delete their own profile
CREATE POLICY "profiles_select_own" FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');
```

### The Registration Flow
```
User Signup
    ↓
Supabase Auth creates user
    ↓
Trigger: handle_new_user() creates basic profile
    ↓
RegisterPage: Try INSERT with full data
    ├─ Success: Done ✅
    └─ If exists: UPDATE instead ✅
    ↓
Account created, verification emails sent
```

## 🆘 If It Still Doesn't Work

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check Supabase Status** → Is it operational?
3. **Verify environment variables** → Are SUPABASE_URL and SUPABASE_ANON_KEY set?
4. **Check browser console** → What's the exact error message?
5. **Run SQL verification** → Are all policies there?

## 📁 Files Modified

```
NEW:  supabase/migrations/20260201_comprehensive_rls_fix.sql
EDIT: src/pages/auth/RegisterPage.tsx
NEW:  RLS_FIX_DEPLOYMENT_GUIDE.md (detailed deployment guide)
NEW:  RLS_POLICY_FIX_SUMMARY.md (this file)
```

## 🎯 Next Steps

1. ✅ Apply the SQL migration
2. ✅ Deploy code changes
3. ✅ Test registration with a new account
4. ✅ Monitor console for errors (watch for error code 42501)

---
**Created:** February 1, 2026
**Status:** Ready for deployment
