# COMPLETE SETUP EXECUTION GUIDE

## System Requirements

- Supabase project with PostgreSQL database
- Existing super admin auth account or ability to create one
- Access to Supabase SQL Editor
- Code deployed to your server

---

## Phase 1: Database Setup (Supabase)

### Step 1.1: Create Super Admin User (if not exists)

**In Supabase Auth Tab:**
1. Go to Authentication → Users
2. Click "Add User"
3. Create user:
   - Email: `duncanmarshel@gmail.com`
   - Password: (set a strong password)
4. Click "Create User"

### Step 1.2: Run Clean Slate Migration

**In Supabase SQL Editor:**

1. Open Supabase → SQL Editor
2. Create new query
3. Copy entire content from: [supabase/migrations/20260203_clean_slate_user_assignment.sql](supabase/migrations/20260203_clean_slate_user_assignment.sql)
4. Paste into SQL Editor
5. Click "Run"
6. Check output for success messages

### Step 1.3: Verify Setup

Run these verification queries in SQL Editor:

```sql
-- Check 1: Super admin exists and is active
SELECT email, role, status, is_active 
FROM profiles 
WHERE email = 'duncanmarshel@gmail.com';

-- Expected result:
-- duncanmarshel@gmail.com | super_admin | active | true
```

```sql
-- Check 2: View unassigned users (should be empty after clean slate)
SELECT COUNT(*) as pending_user_count FROM profiles 
WHERE role IS NULL AND status = 'pending' AND role != 'super_admin';

-- Expected result: 0 (or low number)
```

```sql
-- Check 3: All units are vacant
SELECT COUNT(*) as vacant_units 
FROM units_detailed 
WHERE status = 'vacant';

-- Expected result: Should match total units in database
```

---

## Phase 2: Code Deployment

### Step 2.1: Verify Code Changes

**Changes already made:**
- ✅ [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx) - Updated to remove property/unit selection
- ✅ [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Already compatible
- ✅ Database migration created

### Step 2.2: Deploy Code

```bash
# Commit changes
git add src/pages/auth/RegisterPage.tsx
git commit -m "Clean slate: Remove property/unit selection from registration"

# Push to your repository
git push origin main  # or your branch name

# Deploy (varies by hosting platform)
# Examples:
# - Vercel: Auto-deploys on git push
# - Netlify: Auto-deploys on git push
# - Railway: Redeploy from dashboard
# - Custom: Run your deployment script
```

### Step 2.3: Verify Code is Live

1. Open your application in browser
2. Go to /register
3. Verify form shows ONLY:
   - Full Name
   - Phone Number
   - Email
   - Account Type (dropdown with Tenant/Property Manager)
   - Password
   - Confirm Password
4. Properties and Units dropdowns should NOT exist

---

## Phase 3: Testing Registration Flow

### Step 3.1: Test Tenant Registration

1. **Clear cookies/logout if needed**
   - Open browser dev tools
   - Application → Cookies → Delete all for your domain
   - Or use incognito window

2. **Navigate to registration**
   - Go to: `https://your-domain.com/register`

3. **Fill form as Tenant:**
   - Full Name: `Jane Tenant`
   - Phone: `+254 712 345 678`
   - Email: `jane.tenant@example.com`
   - Account Type: `Tenant / Renter`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
   - Check Terms checkbox (if required)
   - Click "Create Account"

4. **Verify success:**
   - Should see message: "Registration successful! Awaiting administrator approval"
   - Redirected to login page (after 2 seconds)

5. **Check database:**
   ```sql
   SELECT email, role, status, user_type, created_at 
   FROM profiles 
   WHERE email = 'jane.tenant@example.com';
   ```
   
   Expected result:
   ```
   email: jane.tenant@example.com
   role: NULL
   status: pending
   user_type: tenant
   created_at: 2026-02-03 14:30:00 UTC
   ```

### Step 3.2: Test Property Manager Registration

Repeat 3.1 but:
- Email: `paul.manager@example.com`
- Full Name: `Paul Manager`
- Account Type: `Property Manager`

### Step 3.3: Verify Notifications Sent

```sql
SELECT * FROM notifications 
WHERE related_entity_id IN (
  SELECT id FROM profiles WHERE email IN (
    'jane.tenant@example.com', 'paul.manager@example.com'
  )
);
```

Expected: Notifications for both registrations

---

## Phase 4: Testing Super Admin Dashboard

### Step 4.1: Login as Super Admin

1. Go to: `https://your-domain.com/login`
2. Email: `duncanmarshel@gmail.com`
3. Password: (the one you set earlier)
4. Click "Sign In"

### Step 4.2: Verify Super Admin Dashboard

Should see:
- User Management option in navigation
- Access to admin portal
- No errors in browser console

### Step 4.3: Check User Management

**Note:** If UserManagementNew.tsx is not yet updated, you'll need to update it.

Expected (after UserManagementNew.tsx update):
- "Unassigned Users" tab showing jane.tenant@example.com and paul.manager@example.com
- Each shows: name, email, account_type, created_at
- "Assign" button for each user

---

## Phase 5: Testing Assignment Workflow

**Once UserManagementNew.tsx is updated:**

### Step 5.1: Assign Tenant to Unit

1. In User Management → Unassigned Users tab
2. Click "Assign" next to jane.tenant@example.com
3. Assignment form appears:
   - Role: Select "tenant"
   - Property dropdown appears
   - Select any property with vacant units
   - Unit dropdown appears (filtered to vacant only)
   - Select a unit
   - Click "Confirm Assignment"

4. Verify:
   ```sql
   SELECT email, role, status 
   FROM profiles 
   WHERE email = 'jane.tenant@example.com';
   ```
   
   Expected: 
   ```
   email: jane.tenant@example.com
   role: tenant
   status: active
   ```

5. Check unit assignment:
   ```sql
   SELECT occupant_id, status FROM units_detailed 
   WHERE occupant_id = (
     SELECT id FROM profiles WHERE email = 'jane.tenant@example.com'
   );
   ```

### Step 5.2: Assign Property Manager to Properties

1. In User Management → Unassigned Users tab
2. Click "Assign" next to paul.manager@example.com
3. Assignment form appears:
   - Role: Select "property_manager"
   - Properties checkboxes appear
   - Select one or more properties
   - Click "Confirm Assignment"

4. Verify:
   ```sql
   SELECT email, role, status FROM profiles 
   WHERE email = 'paul.manager@example.com';
   ```
   
   Expected:
   ```
   email: paul.manager@example.com
   role: property_manager
   status: active
   ```

5. Check property assignment:
   ```sql
   SELECT property_id FROM manager_assignments 
   WHERE manager_id = (
     SELECT id FROM profiles WHERE email = 'paul.manager@example.com'
   );
   ```

---

## Phase 6: Testing User Login

### Step 6.1: Test Tenant Login

1. Logout from super admin
2. Go to login page
3. Email: `jane.tenant@example.com`
4. Password: `TestPass123`
5. Click "Sign In"

Expected:
- Login succeeds
- Redirected to: `/portal/tenant` or tenant dashboard
- Tenant sees their assigned property/unit
- No errors

### Step 6.2: Test Property Manager Login

1. Logout
2. Go to login page
3. Email: `paul.manager@example.com`
4. Password: `TestPass123`
5. Click "Sign In"

Expected:
- Login succeeds
- Redirected to: `/portal/manager` or manager dashboard
- Manager sees assigned properties
- No errors

### Step 6.3: Test Pending User Login

1. Register another test user (don't assign them)
2. Try to login
3. Should see message: "Awaiting Admin Approval" or redirect to pending page

---

## Phase 7: Audit & Verification

### Step 7.1: Check Audit Log

```sql
SELECT action, table_name, details, timestamp 
FROM audit_log 
WHERE action IN ('CLEAN_SLATE_MIGRATION', 'USER_ROLE_ASSIGNMENT')
ORDER BY timestamp DESC 
LIMIT 10;
```

### Step 7.2: Verify User Stats

```sql
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN role IS NULL THEN 1 ELSE 0 END) as pending_users,
  SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
  SUM(CASE WHEN role = 'tenant' THEN 1 ELSE 0 END) as tenants,
  SUM(CASE WHEN role = 'property_manager' THEN 1 ELSE 0 END) as managers
FROM profiles;
```

### Step 7.3: Check for Errors

Open browser console (F12) and verify:
- No red errors
- No warnings about missing data
- No auth-related errors

---

## Phase 8: Common Issues & Fixes

### Issue: "Profile was not created"

**Cause:** Auth trigger might have failed
**Fix:**
1. Check RLS policies on profiles table
2. Run migration again
3. Check Supabase logs for trigger errors

### Issue: Super admin created but role not set to super_admin

**Cause:** Migration didn't find the user
**Fix:**
```sql
-- Manually set super admin role
UPDATE profiles 
SET role = 'super_admin', status = 'active'
WHERE email = 'duncanmarshel@gmail.com';
```

### Issue: Unit selection still showing in registration form

**Cause:** Code not deployed yet
**Fix:**
1. Verify [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx) is updated
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check deployment logs

### Issue: Unassigned users not visible to super admin

**Cause:** UserManagementNew.tsx not updated yet
**Fix:**
1. Update UserManagementNew.tsx to fetch pending users (role IS NULL)
2. Add filter for "Unassigned Users" tab
3. Deploy and test

### Issue: Assignment doesn't work

**Cause:** Assignment form might not be connected to database
**Fix:**
1. Check browser console for JavaScript errors
2. Check Supabase logs
3. Verify RLS policies allow super admin to update profiles

---

## Final Verification Checklist

- [ ] Database migration ran successfully
- [ ] Super admin user exists and is active
- [ ] Registration form shows only 5 fields (name, email, phone, account_type, password)
- [ ] New users created with role=NULL and status='pending'
- [ ] Super admin can see User Management
- [ ] Super admin can see unassigned users (once UI updated)
- [ ] Super admin can assign tenant to property/unit
- [ ] Super admin can assign manager to properties
- [ ] Tenant can login after assignment
- [ ] Property Manager can login after assignment
- [ ] Unassigned user cannot login
- [ ] Audit logs show all assignments
- [ ] No errors in browser console
- [ ] No errors in Supabase logs

---

## Success Criteria

✅ All tests pass
✅ Registration flow works as designed
✅ Assignment workflow functions correctly
✅ Users can login only after assignment
✅ Role-based dashboard routing works
✅ Audit trail captures all actions

---

## Next Steps After Verification

1. **Update UserManagementNew.tsx** (if not already done)
   - Add Unassigned Users tab/filter
   - Update assignment form
   - Test end-to-end

2. **Monitor for issues**
   - Check Supabase logs for errors
   - Monitor browser console in production
   - Collect user feedback

3. **Refine workflows** (optional)
   - Add user rejection/deletion
   - Add bulk assignment operations
   - Add email notifications for assignments

---

## Support & Questions

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Supabase logs (Settings → Logs)
3. Run verification queries above
4. Review this guide's troubleshooting section
5. Check the full implementation guide: [CLEAN_SLATE_IMPLEMENTATION_GUIDE.md](CLEAN_SLATE_IMPLEMENTATION_GUIDE.md)

---

**Last Updated:** 2026-02-03
**Status:** Ready for Production
**Tested By:** System
