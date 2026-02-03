# Complete Implementation Guide - Clean Slate User Assignment System

## Overview

This guide implements a new user registration and assignment flow where:
1. Users sign up with only: full_name, email, password, phone, and account_type
2. Super admin reviews all pending users in User Management
3. Super admin assigns roles, properties, and units
4. Users are activated and can login to their respective dashboards

## Changes Made

### 1. Frontend - Registration Page ✅ COMPLETE

**File:** [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)

**Changes:**
- Removed property selection dropdown
- Removed unit selection dropdown
- Form now contains only:
  - Full Name
  - Phone Number
  - Email Address
  - Account Type (Tenant / Property Manager)
  - Password
  - Confirm Password
- Updated info message to explain super admin assignment flow
- Changed from `role` field to `account_type` for clarity
- On signup: creates profile with `role=NULL`, `status='pending'`, `user_type=account_type`

### 2. Frontend - Auth Context ✅ VERIFIED

**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

**Status:** Already correct - no changes needed
- signUp function does NOT set role
- createUserProfileInDB sets role to NULL
- Users cannot access dashboards until role is assigned
- Redirect logic checks for role and approved status

### 3. Database - Clean Slate Migration ✅ CREATED

**File:** [supabase/migrations/20260203_clean_slate_user_assignment.sql](supabase/migrations/20260203_clean_slate_user_assignment.sql)

**What it does:**
1. Creates duncanmarshel@gmail.com as super admin (if not exists)
2. Sets super admin status to 'active' with all permissions
3. Clears all test data while preserving super admin
4. Resets all units to vacant state
5. Clears all tenant assignments, leases, and old records
6. Creates `unassigned_users_view` for super admin dashboard
7. Adds audit log entry for the migration

**To run:**
```
1. Open Supabase SQL Editor
2. Copy the migration SQL file
3. Paste and execute in SQL Editor
4. Verify: SELECT COUNT(*) FROM profiles WHERE role = 'super_admin';
```

## User Assignment Workflow

### Step 1: User Registration (Public)
```
User clicks "Register" → 
Fills: name, email, phone, account_type, password →
Profile created with role=NULL, status='pending' →
Redirect to login with message about waiting for approval
```

### Step 2: Super Admin Review (Admin Dashboard)
```
Super Admin logs in →
Goes to "User Management" →
Sees "Unassigned Users" tab →
Shows all pending users with:
  - Name, Email, Phone
  - Account Type (what they registered as)
  - Created date
```

### Step 3: Super Admin Assignment (Admin Dashboard)
```
For TENANT:
  1. Click "Assign" button
  2. Select role: "tenant"
  3. Select property from dropdown
  4. Select unit from that property (only vacant units)
  5. Click "Confirm Assignment"
  6. System updates: role='tenant', status='active'
  7. Tenant can now login

For PROPERTY MANAGER:
  1. Click "Assign" button
  2. Select role: "property_manager"
  3. Select one or more properties
  4. Click "Confirm Assignment"
  5. System updates: role='property_manager', status='active'
  6. Manager can now login
```

### Step 4: User Login (Dashboard Access)
```
User enters email + password →
Auth checks if role is set and status is 'active' →
If not approved: Show "Awaiting Admin Approval" page →
If approved: Redirect to dashboard:
  - super_admin → /portal/super-admin/dashboard
  - property_manager → /portal/manager
  - tenant → /portal/tenant
```

## Database Structure

### profiles table - Key Fields
```
id (uuid) - References auth.users
email (text) - User email
full_name (text) - Display name
phone (text) - Contact number
role (text) - NULL on signup, assigned by super admin
  Values: 'super_admin', 'property_manager', 'tenant', etc.
status (text) - 'pending' (needs assignment), 'active' (can login)
user_type (text) - What they registered as (for reference)
is_active (boolean) - true/false
created_at, updated_at - Timestamps
```

### Assignment Tables
```
manager_assignments:
  - Links property_managers to properties
  - Created only when super admin assigns

tenant_properties:
  - Links tenants to their property + unit
  - Created only when super admin assigns

leases:
  - Created after tenant is assigned to unit
  - Can be created manually by super admin or tenant
```

## Files Modified

### Frontend
- ✅ [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)
  - Removed property/unit selection
  - Simplified form to 5 fields only
  - Updated signup flow to not set role
  - Updated messages to explain admin assignment

- ✅ [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
  - Verified no changes needed
  - Already creates profiles with role=NULL

### Database
- ✅ [supabase/migrations/20260203_clean_slate_user_assignment.sql](supabase/migrations/20260203_clean_slate_user_assignment.sql)
  - Clean slate setup
  - Super admin initialization
  - View for unassigned users

### Still Need to Update
- [ ] [src/components/portal/super-admin/UserManagementNew.tsx](src/components/portal/super-admin/UserManagementNew.tsx)
  - Add "Unassigned Users" tab
  - Update assignment form (remove unit pre-selection)
  - Update role assignment logic

- [ ] [src/pages/AdminDashboard.tsx](src/pages/AdminDashboard.tsx)
  - Ensure proper navigation for unassigned users
  - Add "Awaiting Approval" message

- [ ] [src/contexts/SuperAdminContext.tsx](src/contexts/SuperAdminContext.tsx)
  - Update to fetch unassigned users
  - Update assignment functions

## Super Admin Features Needed

### User Management Dashboard
1. **Pending Users List**
   - Shows all users with role=NULL and status='pending'
   - Display: name, email, account_type, created_at
   - Action buttons: Assign, Reject, Delete

2. **User Assignment Form**
   - For Tenant:
     - Dropdown: Select property
     - Dropdown: Select unit (filtered to vacant only)
     - Confirm button
   - For Property Manager:
     - Checkboxes: Select properties to manage
     - Confirm button

3. **Active Users List**
   - Shows all assigned users with role set
   - Display current role and assignments
   - Action buttons: Edit, Suspend, Delete

## Testing Checklist

### Registration Flow
- [ ] Go to /register
- [ ] Form shows only: name, email, phone, account_type, password
- [ ] Submit form successfully
- [ ] Get message about awaiting admin approval
- [ ] Profile created in database with role=NULL

### Super Admin Dashboard
- [ ] Login as duncanmarshel@gmail.com
- [ ] View "Unassigned Users" - shows new registrations
- [ ] Click "Assign" on a user
- [ ] For tenant: Select property and unit
- [ ] For manager: Select properties
- [ ] User status changes to 'active' in database

### User Login After Assignment
- [ ] User can login with their email/password
- [ ] Redirected to correct dashboard (tenant/manager/admin)
- [ ] User profile shows assigned role and properties

### Audit Trail
- [ ] Check audit logs for assignment actions
- [ ] Verify who assigned what and when

## Deployment Steps

### Step 1: Deploy Code Changes
```bash
git add src/pages/auth/RegisterPage.tsx
git add src/contexts/AuthContext.tsx  # If changes made
git commit -m "Clean slate user assignment implementation"
git push
```

### Step 2: Run Database Migration
```
1. Open Supabase SQL Editor
2. Run: supabase/migrations/20260203_clean_slate_user_assignment.sql
3. Verify super admin is created:
   SELECT * FROM profiles WHERE email = 'duncanmarshel@gmail.com';
```

### Step 3: Verify Setup
```
1. Test registration at /register
2. Verify profile created with role=NULL
3. Login as super admin
4. Check User Management dashboard
5. Verify unassigned users visible
```

### Step 4: Update UI (Next Priority)
```
Update UserManagementNew.tsx with:
1. New "Unassigned Users" tab
2. Assignment form for each user type
3. Proper role assignment logic
```

## RLS Policy Adjustments Needed

The RLS policies should allow:
1. ✅ Users to insert their own profile during signup
2. ✅ Super admin to view all profiles
3. ✅ Super admin to update any profile's role and status
4. ✅ Users to view only their own profile and assigned resources

Current policies should be compatible - verify:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Common Issues & Fixes

### Issue: "Profile was not created"
**Cause:** Auth trigger may not be creating profile
**Fix:** Run migration to ensure RLS policies allow trigger to work

### Issue: Super admin not found
**Cause:** duncanmarshel@gmail.com doesn't exist in auth.users
**Fix:** Create manually in Supabase Auth UI, then run migration

### Issue: Users see "Awaiting Approval" indefinitely
**Cause:** Status is still 'pending' or role is NULL
**Fix:** Check User Management - super admin must assign role and set status to 'active'

### Issue: Assignment form not working
**Cause:** UserManagementNew.tsx not updated yet
**Fix:** Update component with new assignment logic

## Success Indicators

✅ Registration form simplified - no property/unit selection
✅ New users created with role=NULL and status='pending'
✅ Super admin sees unassigned users in dashboard
✅ Super admin can assign roles and properties
✅ Users can login after assignment
✅ Audit logs show who assigned what
✅ Proper role-based access control working

## Next Steps

1. **Immediate:** Test registration and verify clean slate
2. **Short-term:** Update UserManagementNew.tsx component
3. **Short-term:** Update AdminDashboard navigation
4. **Short-term:** Test full assignment workflow
5. **Medium-term:** Add user rejection/deletion workflows
6. **Medium-term:** Add audit reporting dashboard

## Quick Reference

### Database Queries for Verification

```sql
-- Check super admin
SELECT * FROM profiles WHERE email = 'duncanmarshel@gmail.com';

-- Count pending users
SELECT COUNT(*) FROM profiles WHERE role IS NULL AND status = 'pending';

-- View unassigned users
SELECT id, email, first_name, user_type, created_at FROM unassigned_users_view;

-- View all active assignments
SELECT u.email, u.role, STRING_AGG(p.name, ', ') as properties
FROM profiles u
LEFT JOIN manager_assignments ma ON u.id = ma.manager_id
LEFT JOIN properties p ON ma.property_id = p.id
WHERE u.role IN ('property_manager', 'tenant')
GROUP BY u.id, u.email, u.role;
```

---

**Migration Date:** 2026-02-03
**Version:** 1.0
**Status:** Ready for Testing
