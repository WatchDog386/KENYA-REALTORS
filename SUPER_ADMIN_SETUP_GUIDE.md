# SUPER ADMIN USER SETUP - COMPLETE GUIDE

## Overview
This guide will help you create a super admin user that has full control and authority over the entire Realtors-Leasers system.

**Super Admin Credentials:**
- Email: `duncanmarshel@gmail.com`
- Password: `Marshel@1992`
- Role: `super_admin`
- Access Level: Full system access to SuperAdminDashboard

---

## STEP 1: Create User in Supabase Authentication

### Method A: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (REALTORS-LEASERS)
3. Navigate to **Authentication > Users**
4. Click **"Add user"** or **"Invite"**
5. Fill in the details:
   - Email: `duncanmarshel@gmail.com`
   - Password: `Marshel@1992`
   - Auto confirm email: **✓ Check this box**
6. Click **"Create user"**
7. **IMPORTANT**: Copy the User ID (UUID) that appears - you'll need this next

### Method B: Using Supabase CLI (if installed)

```bash
supabase auth create --email duncanmarshel@gmail.com --password "Marshel@1992"
```

---

## STEP 2: Create Profile in Database

After creating the user in Supabase Authentication, you'll have a User ID (UUID).

### Update the SQL Script

1. Open `CREATE_SUPER_ADMIN_USER.sql` in your editor
2. Replace `{USER_ID}` with the actual UUID from Step 1
   - Example: `5f8d9e2c-4a1b-47e5-8f3c-2d1a9b5c4e3f`

### Run the SQL Script

1. Go to Supabase Dashboard > SQL Editor
2. Create a new query
3. Copy and paste the SQL from `CREATE_SUPER_ADMIN_USER.sql`
4. Click **"Run"**
5. Verify the profile was created by checking the results

### Verification Queries in SQL Editor

```sql
-- Check if super admin was created
SELECT id, email, role, status, is_active FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';

-- Show all super admin users
SELECT id, email, role, status FROM public.profiles WHERE role = 'super_admin';
```

---

## STEP 3: Verify Access in Application

### Test Login

1. Start your application: `npm run dev`
2. Go to the Login page
3. Login with:
   - Email: `duncanmarshel@gmail.com`
   - Password: `Marshel@1992`
4. You should be automatically redirected to `/portal/super-admin/dashboard`

### Verify Admin Access

Once logged in, the super admin should have access to:

- **Dashboard** - View system metrics and overview
- **Properties Management** - Manage all properties in the system
- **User Management** - Create, edit, delete, and manage all users
- **Approval Queue** - Review and approve/reject all requests
- **Analytics** - View detailed system analytics and reports
- **System Settings** - Configure all system settings
- **Leases Management** - Manage all property leases
- **Payments Management** - View and manage all payments
- **Manager Portal** - Manage property managers
- **Profile Management** - Manage user profiles
- **Refund Status** - Track all deposit refunds

---

## SUPER ADMIN PERMISSIONS

The `super_admin` role has the following permissions:

```
* (wildcard - all permissions)
manage_all_properties
manage_all_users
manage_all_leases
manage_all_payments
manage_approvals
manage_settings
view_analytics
manage_refunds
manage_managers
manage_maintenance
view_audit_logs
manage_system
```

---

## IMPORTANT NOTES

### Security Considerations

1. **Change Password**: After first login, the super admin should change the password for security
2. **Email Confirmation**: The email should be confirmed immediately
3. **Audit Trail**: All actions performed by super admin are logged
4. **Backup Account**: Consider creating a backup super admin account

### If User Already Exists

If you receive an error that the user already exists, you can:

1. Delete the existing user from Supabase Auth
2. Run the setup again, OR
3. Just update the profile role to `super_admin` using the SQL update query

### Troubleshooting

**Problem**: "User not found" error after login
- **Solution**: Make sure you ran STEP 2 (the SQL script) after creating the user in auth

**Problem**: "Access denied" to admin dashboard
- **Solution**: Verify the role is set to `super_admin` in the profiles table:
  ```sql
  SELECT email, role FROM public.profiles WHERE email = 'duncanmarshel@gmail.com';
  ```

**Problem**: Cannot create super admin through UI
- **Solution**: Super admin accounts must be created via Supabase Dashboard or this SQL script

---

## RELATED FILES

- **Auth Context**: `src/contexts/AuthContext.tsx`
- **Protected Routes**: `src/components/ProtectedRoute.tsx`
- **Super Admin Layout**: `src/components/layout/SuperAdminLayout.tsx`
- **Super Admin Routes**: `src/config/superAdminRoutes.ts`
- **Admin Dashboard**: `src/pages/portal/AdminDashboard.tsx`

---

## NEXT STEPS

1. ✅ Create user in Supabase Auth
2. ✅ Run SQL script with correct User ID
3. ✅ Test login with credentials
4. ✅ Verify access to all admin pages
5. ✅ Change password if needed
6. ✅ Set up additional super admins if needed (repeat steps 1-4)

---

## COMMANDS TO RUN IN SUPABASE SQL EDITOR

### Quick Setup (All in One)

```sql
-- 1. First create user in Auth tab, copy the UUID
-- 2. Run this SQL with the actual UUID:

INSERT INTO public.profiles (
  id, email, first_name, last_name, full_name, role, user_type, 
  status, is_active, email_confirmed, email_confirmed_at, created_at, updated_at
) VALUES (
  'YOUR_UUID_HERE',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'Duncan Marshel',
  'super_admin',
  'super_admin',
  'active',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  user_type = 'super_admin',
  status = 'active',
  is_active = true,
  updated_at = NOW();

-- Verify it worked:
SELECT id, email, role, status, is_active FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';
```

---

## SUPPORT

If you encounter any issues:

1. Check the browser console (F12) for error messages
2. Check the Supabase logs for auth errors
3. Verify the UUID format is correct (should be a valid UUID v4)
4. Ensure the SQL script replaced `{USER_ID}` with actual UUID
5. Make sure email_confirmed is set to `true` in the database

---

**Last Updated**: February 3, 2026
**Created for**: duncanmarshel@gmail.com
