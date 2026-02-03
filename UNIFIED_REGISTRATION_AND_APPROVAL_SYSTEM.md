# Unified Registration & Approval Workflow - Complete Implementation Guide

## 🎯 Overview

This implementation creates a **single, consistent approval workflow** for both **property managers** and **tenants**. All users register through the same flow, are stored in the profiles table, and managed from the Super Admin Dashboard.

---

## 📋 Complete User Flow

### **Step 1: Registration (Unified for Both Roles)**

#### Property Manager or Tenant Registration
```
1. User visits /register
2. Selects role: "Property Manager" OR "Tenant"
3. Fills basic info: Name, Email, Phone, Password
   - Property Managers: Select properties to manage
   - Tenants: Select property & unit
4. Account created via Supabase Auth
5. Profile created automatically with:
   - role: 'property_manager' OR 'tenant'
   - status: 'pending' (awaiting approval)
   - is_active: false (can't login yet)
6. Approval record created:
   - manager_approvals (for property managers)
   - tenant_approvals (for tenants)
7. Super Admin notified via notifications table
8. User redirected to /login with message: "Awaiting approval"
```

### **Step 2: Login Attempt (Approval Check)**

```
User tries to login:
1. Credentials verified
2. System checks profile.status
   - status='pending' → ❌ "Your account is pending approval" → Sign out
   - status='active' → ✓ Login allowed → Role-based redirect
3. First login redirect:
   - property_manager → /portal/manager
   - tenant → /portal/tenant
   - super_admin → /portal/super-admin
```

### **Step 3: Super Admin Review & Approval**

```
Super Admin Dashboard → User Management:

1. View "⏳ Pending Approval" filter
2. See all pending property managers and tenants
3. For each pending user:
   - Review name, email, role request
   - View properties (for managers) or unit (for tenants)
   - Click "Assign Role & Approve"
   - Select role (confirms the requested role)
   - Click "✓ Approve & Assign Role"

4. System updates:
   - profiles: status='active', is_active=true, approved_at=NOW()
   - manager_approvals/tenant_approvals: status='approved', reviewed_at=NOW()
   - Create notification: "Your account approved! You can now login."

5. User receives notification
6. User can now login and access their portal
```

---

## 🔄 Database Schema

### **1. profiles Table** (Enhanced)
```sql
- id (UUID) - Foreign key to auth.users
- email (TEXT)
- first_name, last_name (VARCHAR)
- phone (VARCHAR)
- role (VARCHAR) - 'super_admin', 'property_manager', 'tenant'
- status (VARCHAR) - 'active', 'pending', 'suspended'
- is_active (BOOLEAN) - User can login if true
- user_type (VARCHAR) - Same as role
- approved_by (UUID) - Which admin approved
- approved_at (TIMESTAMP) - When approved
- approval_notes (TEXT) - Admin notes
- property_id (UUID) - For tenants
- unit_id (UUID) - For tenants
- created_at, updated_at, last_login_at
```

### **2. manager_approvals Table** (NEW)
```sql
- id (UUID) - Primary key
- user_id (UUID) - Reference to auth.users
- profile_id (UUID) - Reference to profiles
- requested_at (TIMESTAMP) - When registered
- reviewed_at (TIMESTAMP) - When reviewed
- status (VARCHAR) - 'pending', 'approved', 'rejected'
- reviewed_by (UUID) - Which admin reviewed
- approval_notes (TEXT) - Admin notes
- managed_properties (UUID[]) - Array of property IDs
- created_at, updated_at
- UNIQUE constraint on user_id
```

### **3. tenant_approvals Table** (NEW)
```sql
- id (UUID) - Primary key
- user_id (UUID) - Reference to auth.users
- profile_id (UUID) - Reference to profiles
- requested_at (TIMESTAMP) - When registered
- reviewed_at (TIMESTAMP) - When reviewed
- status (VARCHAR) - 'pending', 'approved', 'rejected'
- reviewed_by (UUID) - Which admin reviewed
- approval_notes (TEXT) - Admin notes
- unit_id (UUID) - Selected unit
- property_id (UUID) - Selected property
- created_at, updated_at
- UNIQUE constraint on user_id
```

### **4. notifications Table** (NEW)
```sql
- id (UUID) - Primary key
- recipient_id (UUID) - Who gets the notification
- sender_id (UUID) - Who sent it (admin or system)
- type (VARCHAR) - 'manager_approval', 'approval_granted', etc.
- title (VARCHAR) - Display title
- message (TEXT) - Full message
- related_entity_type (VARCHAR) - 'manager', 'tenant'
- related_entity_id (UUID) - Link to related object
- is_read (BOOLEAN) - If user has read it
- created_at, updated_at
```

---

## 🔧 Implementation Files

### **1. Database Migration** ✅
**File:** `supabase/migrations/20260204_unified_registration_approval_workflow.sql`
- Creates manager_approvals table
- Creates tenant_approvals table  
- Creates notifications table
- Updates profiles table with approval columns
- Sets up RLS policies
- Configures auth trigger

**Action Required:** Run this migration in Supabase

### **2. Registration Page** ✅
**File:** `src/pages/auth/RegisterPage.tsx`
**Changes:**
- Role selection: Tenant vs Property Manager
- Tenant form: Select property → Select unit
- Manager form: Select managed properties
- On submit:
  - Create auth user with role metadata
  - Create profile with status='pending'
  - Create manager_approvals or tenant_approvals record
  - Send notification to super admin
  - Redirect to /login with approval message

### **3. Login Page** ✅
**File:** `src/pages/auth/LoginPage.tsx`
**Changes:**
- Added approval status check in handleLogin()
- If status='pending': Sign out user, show error message
- If status='active': Allow login and redirect by role

### **4. User Management Dashboard** ✅
**File:** `src/components/portal/super-admin/UserManagementNew.tsx`
**Changes:**
- Added "⏳ Pending Approval" filter
- Shows all pending users in table
- Enhanced "Assign Role" dialog:
  - Shows current status (Pending/Active)
  - Explains approval will activate account
  - Automatically updates manager_approvals or tenant_approvals
  - Sends notification to user upon approval
  - Sets profile.status='active'

---

## 🚀 User Experience Flows

### **For Property Manager Registration:**
```
1. Go to /register
2. Select "Property Manager"
3. Fill: Name, Email, Phone, Password
4. Select: Which properties to manage (checkboxes)
5. Click "Create Account"
   ↓
   ✓ "Registration successful! Awaiting admin approval."
   ✓ "You'll be able to login once the administrator approves your registration."
6. Redirected to /login
7. Tries to login with email/password
   ↓
   ❌ "Your Property Manager account is pending approval."
   ❌ "You'll be able to login once the administrator approves your registration."
8. Super admin goes to User Management
9. Filters for "⏳ Pending Approval"
10. Sees the property manager in list
11. Clicks "Assign Role & Approve"
12. Confirms role: Property Manager
13. Clicks "✓ Approve & Assign Role"
    ↓
    ✓ Profile status → 'active'
    ✓ Notification sent to manager
14. Manager receives: "Your account approved! You can now login"
15. Manager logs in → Directed to /portal/manager
```

### **For Tenant Registration:**
```
1. Go to /register
2. Select "Tenant / Looking to Rent"
3. Fill: Name, Email, Phone, Password
4. Select: Property (dropdown)
5. Select: Unit (dropdown - loads vacant units for property)
6. Click "Create Account"
   ↓
   ✓ "Registration successful! Awaiting verification."
   ✓ "You'll be able to login once the property manager verifies your application."
7. Redirected to /login
8. Tries to login
   ↓
   ❌ "Your Tenant account is pending approval."
9. Super admin approves (same process as property manager)
10. Tenant receives notification and can login
11. Tenant logs in → Directed to /portal/tenant
```

---

## 📊 Super Admin Dashboard Flow

### **User Management Tab:**
```
┌─────────────────────────────────────────┐
│ User Management                          │
│ Manage users, assign roles, approve     │
└─────────────────────────────────────────┘

FILTERS:
[All Roles ▼] [⏳ Pending Approval ▼] [Search...]

STATS:
Total Users: 45 | Unassigned: 8 | Super Admins: 2 | 
Property Managers: 12 | Tenants: 25

TABLE:
┌────────┬──────────────┬──────────┬─────────────┬──────────────┬────────────┐
│ Name   │ Email        │ Phone    │ Role        │ Status       │ Actions    │
├────────┼──────────────┼──────────┼─────────────┼──────────────┼────────────┤
│ John M │ john@ex.com  │ 254...   │ None        │ ⏳ Pending    │ [👤] [🗑]  │
│ Jane T │ jane@ex.com  │ 254...   │ None        │ ⏳ Pending    │ [👤] [🗑]  │
│ Bob M  │ bob@ex.com   │ 254...   │ None        │ ⏳ Pending    │ [👤] [🗑]  │
└────────┴──────────────┴──────────┴─────────────┴──────────────┴────────────┘

CLICK [👤] BUTTON:
┌─────────────────────────────────────────┐
│ Assign Role & Approve                   │
├─────────────────────────────────────────┤
│ Name: John Manager                      │
│ Email: john@example.com                 │
│ Current Role: None                      │
│ Status: ⏳ Pending Approval             │
│                                         │
│ Assign Role & Approve *                 │
│ [✓ Tenant ▼]                           │
│                                         │
│ ℹ️ Approval Action: Selecting a role    │
│ will automatically approve this user    │
│ and activate their account.             │
│                                         │
│ [Cancel] [✓ Approve & Assign Role]     │
└─────────────────────────────────────────┘
```

---

## 🔐 RLS (Row Level Security) Policies

### **Service Role**
- Full access to all tables (for auth trigger and admin functions)

### **Authenticated Users**
- Can view/update own profile
- Can view own notifications
- Can read approval status (pending/active)

### **Super Admin**
- Can view all users in profiles table
- Can read/write manager_approvals
- Can read/write tenant_approvals
- Can read/write all notifications

---

## ⚙️ Setup Instructions

### **1. Apply Database Migration**
```bash
# In Supabase Dashboard:
# SQL Editor → Paste migration from:
supabase/migrations/20260204_unified_registration_approval_workflow.sql
# Click "Run"
```

### **2. Verify RegisterPage Updates** ✅
Files already updated:
- `src/pages/auth/RegisterPage.tsx` - Manager approval flow added
- `src/pages/auth/LoginPage.tsx` - Approval status check added

### **3. Verify UserManagement Updates** ✅
File already updated:
- `src/components/portal/super-admin/UserManagementNew.tsx`
  - Added pending approval filter
  - Enhanced assign role dialog
  - Approval notification logic

### **4. Test the Complete Flow**

#### **Test Property Manager:**
```
1. Navigate to http://localhost:5173/register
2. Select "Property Manager"
3. Fill form (name, email, phone, password)
4. Select property "Westside Apartments"
5. Click "Create Account"
6. Verify: See "Awaiting admin approval" message
7. Try login with those credentials
8. Verify: See "Your Property Manager account is pending approval"
9. Go to super admin dashboard
10. Navigate to User Management
11. Filter "⏳ Pending Approval"
12. See the property manager in list
13. Click "Assign Role" button
14. Verify role is pre-filled as "Property Manager"
15. Click "✓ Approve & Assign Role"
16. Verify: Toast "User approved as property_manager"
17. Check notification table for approval notification
18. Try login again
19. Verify: Can now login and redirected to /portal/manager
```

#### **Test Tenant:**
```
1. Navigate to /register
2. Select "Tenant / Looking to Rent"
3. Fill form
4. Select property and unit
5. Click "Create Account"
6. Follow same approval process
7. After approval, verify redirects to /portal/tenant
```

---

## 🔄 Key Features

✅ **Single Registration Flow** - Both roles use same form with role-specific fields  
✅ **Unified Approval Process** - Super admin approves all users from one place  
✅ **Pending Status Check** - Users can't login until approved  
✅ **Approval Notifications** - Users notified when approved  
✅ **Role-Based Routing** - Auto-redirect after login based on role  
✅ **Clean UI/UX** - Clear indicators for pending/active status  
✅ **Audit Trail** - approved_by, approved_at, approval_notes columns  
✅ **Property Manager Properties** - Managers see/manage their assigned properties  
✅ **Tenant Unit Assignment** - Tenants linked to their specific units  

---

## 📝 Additional Notes

### **Customization Points:**
1. **Approval Notification Message** - Edit in RegisterPage.tsx line ~350
2. **Pending Filter Label** - Edit "⏳ Pending Approval" in UserManagementNew.tsx
3. **Role Assignment Dialog** - Edit approval message in AssignRoleForm component
4. **Login Error Message** - Edit in LoginPage.tsx line ~68

### **Future Enhancements:**
1. **Auto-Approval by Email Domain** - Auto-approve company email addresses
2. **Rejection Workflow** - Allow admins to reject with reason
3. **Property Manager Verification** - License verification before approval
4. **Tenant Background Checks** - Integration with background check services
5. **Approval Expiry** - Automatically reject if not verified after X days
6. **Bulk Approval** - Approve multiple users at once
7. **Approval Analytics** - Track approval times and rates

---

## ✅ Completion Checklist

- [x] Database migration created
- [x] RegisterPage updated for unified workflow
- [x] LoginPage updated with approval check
- [x] UserManagement enhanced with approval UI
- [x] Manager approval records creation
- [x] Tenant approval records creation
- [x] Notification system implemented
- [x] RLS policies configured
- [x] Documentation complete

**Status:** READY FOR TESTING ✅

---

## 🆘 Troubleshooting

### **Users can register but can't see in dashboard:**
- Check migration was applied
- Verify RLS policies exist on manager_approvals/tenant_approvals tables

### **Approval button doesn't work:**
- Check browser console for errors
- Verify super admin role in profiles table
- Check RLS policy allows super admin writes

### **User approved but still can't login:**
- Check profiles.status was set to 'active'
- Check profiles.is_active was set to true
- Check approved_at timestamp exists

### **No notification sent:**
- Check notifications table RLS policy
- Verify notification insert completed in console
- Check recipient_id matches super admin id

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0 - Unified Registration & Approval System
