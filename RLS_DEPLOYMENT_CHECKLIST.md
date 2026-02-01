# RLS FIX - DEPLOYMENT CHECKLIST

## Pre-Deployment (Do These First)

- [ ] Read `RLS_COMPLETE_SOLUTION.md` (10 min)
- [ ] Read `RLS_FIX_DEPLOYMENT_GUIDE.md` (10 min)
- [ ] Back up your database (or ensure backups are recent)
- [ ] Have Supabase Dashboard open and ready
- [ ] Have your code editor open to RegisterPage.tsx

---

## DEPLOYMENT PHASE 1: Apply Database Fix

### Supabase Setup

- [ ] Open [Supabase Dashboard](https://app.supabase.com)
- [ ] Verify you're in the correct project
- [ ] Click **SQL Editor** in left sidebar
- [ ] Click **New Query** button

### Apply Migration

- [ ] Copy entire file: `supabase/migrations/20260201_comprehensive_rls_fix.sql`
- [ ] Paste into SQL editor
- [ ] Review the SQL (should see DROP, CREATE POLICY commands)
- [ ] Click **Run** button
- [ ] **WAIT** for completion message
- [ ] **Verify:** See message `"RLS Policies created successfully"`

### Verify Policies Applied

- [ ] Copy this SQL:
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
  ```
- [ ] Run it in SQL editor
- [ ] **Verify:** Should see 6 rows:
  - [ ] `profiles_delete_own`
  - [ ] `profiles_insert_own`
  - [ ] `profiles_select_own`
  - [ ] `profiles_select_super_admin`
  - [ ] `profiles_service_role_all`
  - [ ] `profiles_update_own`

- [ ] If NOT 6 rows, something failed - see troubleshooting section

---

## DEPLOYMENT PHASE 2: Deploy Code Changes

### Update Code

- [ ] Pull latest changes: `git pull`
- [ ] Verify `src/pages/auth/RegisterPage.tsx` is updated
- [ ] Look for: `const { error: insertError } = await supabase.from("profiles").insert(profileData);`
- [ ] Build: `npm run build`
- [ ] No errors should appear

### Deploy to Production

- [ ] Deploy to your hosting (Vercel, Netlify, etc.)
- [ ] Wait for deployment to complete
- [ ] Verify deployment was successful
- [ ] No build errors in logs

---

## DEPLOYMENT PHASE 3: Quick Verification

### Test Basic Functionality

- [ ] Go to your app's registration page
- [ ] **DON'T** register yet, just verify page loads
- [ ] Check browser console for errors (F12)
- [ ] Should see NO errors

### Test Registration (Test 1: Tenant)

- [ ] Fill registration form:
  ```
  Full Name: Test User Tenant
  Email: testtenant@example.com
  Phone: +254712345678
  Role: Tenant
  Property: Select any property
  Unit: Select any unit
  Password: TestPass123
  Confirm: TestPass123
  ```
- [ ] Click **Create Account**
- [ ] **WATCH CONSOLE** for logs (F12)
- [ ] Should see:
  - [ ] `🔐 Creating/updating profile for user: [some-uuid]`
  - [ ] `✅ Profile inserted successfully` (or `📝 Profile exists...`)
- [ ] Should see success toast message
- [ ] Should be redirected to login page after 3 seconds
- [ ] **Check Email:** Should receive verification email

### Test Registration (Test 2: Property Manager)

- [ ] Go back to registration page
- [ ] Fill registration form:
  ```
  Full Name: Test User Manager
  Email: testmanager@example.com
  Phone: +254712345679
  Role: Property Manager
  Select Properties: Check any property
  Password: TestPass123
  Confirm: TestPass123
  ```
- [ ] Click **Create Account**
- [ ] **WATCH CONSOLE** for logs
- [ ] Should see success message
- [ ] **Check Email:** Should receive verification email

---

## DEPLOYMENT PHASE 4: Verify in Supabase

### Check New Users Created

- [ ] Open Supabase Dashboard
- [ ] Go to **Authentication** section
- [ ] Should see your test users:
  - [ ] `testtenant@example.com` ✅
  - [ ] `testmanager@example.com` ✅

### Check Profiles Created

- [ ] Click **SQL Editor**
- [ ] Run:
  ```sql
  SELECT id, email, role, status, phone FROM public.profiles 
  WHERE email IN ('testtenant@example.com', 'testmanager@example.com')
  ORDER BY created_at DESC;
  ```
- [ ] Should see:
  - [ ] Two profiles returned
  - [ ] Correct email addresses
  - [ ] Correct roles (tenant, property_manager)
  - [ ] Status = 'active' for tenant, 'pending' for manager
  - [ ] Phone numbers filled in

### Check Tenant-Specific Data

- [ ] Run:
  ```sql
  SELECT id, email, property_id, unit_id FROM public.profiles
  WHERE role = 'tenant' AND email = 'testtenant@example.com';
  ```
- [ ] Should see:
  - [ ] `property_id` is filled
  - [ ] `unit_id` is filled

---

## DEPLOYMENT PHASE 5: Test Login

### Test Tenant Login

- [ ] Go to login page
- [ ] Enter:
  ```
  Email: testtenant@example.com
  Password: TestPass123
  ```
- [ ] Click **Sign In**
- [ ] **Should login successfully** ✅
- [ ] Should see tenant dashboard
- [ ] Should see user profile with all data

### Test Manager Login

- [ ] Log out
- [ ] Go to login page
- [ ] Enter:
  ```
  Email: testmanager@example.com
  Password: TestPass123
  ```
- [ ] Click **Sign In**
- [ ] Should see manager dashboard
- [ ] Should see pending approval message

---

## DEPLOYMENT PHASE 6: Monitor for Issues

### First 24 Hours

- [ ] Monitor console logs for errors
- [ ] Check Supabase **Logs** section for any errors
- [ ] Test registration with multiple users
- [ ] Try different account types
- [ ] Monitor email delivery
- [ ] Check user signups in dashboard

### First Week

- [ ] Monitor all registrations
- [ ] Watch for any 42501 errors
- [ ] Verify all users can log in
- [ ] Check that all profiles are created correctly

---

## POST-DEPLOYMENT: Cleanup

### Optional: Remove Debug Logging

- [ ] Open `src/pages/auth/RegisterPage.tsx`
- [ ] Find and remove these console.log statements (or leave them):
  ```typescript
  console.log("🔐 Creating/updating profile for user:", data.user.id);
  console.log("📝 Profile exists, updating instead:", insertError.message);
  ```
- [ ] Rebuild and redeploy

### Document What Was Done

- [ ] Save this checklist
- [ ] Keep migration file for reference
- [ ] Document in your project notes

---

## TROUBLESHOOTING: If Something Goes Wrong

### Issue: Policies Not Applied

```
Symptom: SELECT shows fewer than 6 policies
Fix:
1. Copy SQL again
2. Run in SQL editor
3. Wait for success message
4. Verify again
```

- [ ] Redo the SQL step above

### Issue: Still Getting 42501 Error

```
Symptom: Registration fails with "row-level security policy"
Debug:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser storage
3. Check if SQL really ran
4. Try incognito window
5. Check Supabase status
```

- [ ] Hard refresh browser
- [ ] Try private/incognito window
- [ ] Verify policies are there (re-run verification SQL)

### Issue: Registration Page Errors

```
Symptom: JavaScript errors in console
Debug:
1. Check code was deployed
2. Check for build errors
3. Clear browser cache
```

- [ ] Verify code is deployed (check RegisterPage.tsx)
- [ ] Hard refresh: Ctrl+Shift+R
- [ ] Check console for errors

### Issue: Users Can't Log In

```
Symptom: Login fails after registration
Debug:
1. Check profile was created in database
2. Verify user is confirmed by email
3. Check Supabase logs
```

- [ ] Check Supabase Dashboard → Authentication → Users
- [ ] Verify user's email is confirmed
- [ ] Check profile exists in profiles table

---

## ROLLBACK: If You Need to Undo

### If Something Breaks

1. **Option 1: Re-run Migration**
   - Copy migration SQL
   - Run in SQL editor again
   - Usually fixes issues

2. **Option 2: Restore Database**
   - If you have backups, restore from before migration
   - Reapply migration more carefully

3. **Option 3: Manual Policy Reset**
   - Contact Supabase support
   - They can help reset policies

- [ ] Keep this in mind, but should not be needed

---

## FINAL VERIFICATION

After everything is done, verify:

- [ ] ✅ Registration works without errors
- [ ] ✅ Users receive verification emails
- [ ] ✅ Users can log in after verification
- [ ] ✅ User profiles show all correct data
- [ ] ✅ Dashboard works for all user types
- [ ] ✅ No 42501 errors in console
- [ ] ✅ No errors in Supabase logs
- [ ] ✅ Multiple user registrations work
- [ ] ✅ All user roles work (tenant, manager, owner)
- [ ] ✅ Database shows profiles correctly

---

## SIGN-OFF

When everything is complete:

- [ ] Date completed: _________________
- [ ] Deployed by: _________________
- [ ] All tests passed: ✅ YES / ❌ NO
- [ ] Issues found: _________________
- [ ] Notes: _________________

---

## CONTACT & REFERENCE

- **Deployment Guide:** `RLS_FIX_DEPLOYMENT_GUIDE.md`
- **Quick Reference:** `RLS_FIX_QUICK_REFERENCE.md`
- **Complete Solution:** `RLS_COMPLETE_SOLUTION.md`
- **Implementation Status:** `RLS_FIX_IMPLEMENTATION_STATUS.md`

---

**Created:** February 1, 2026
**Status:** ✅ Ready for Deployment
**Estimated Time:** 15-20 minutes total
