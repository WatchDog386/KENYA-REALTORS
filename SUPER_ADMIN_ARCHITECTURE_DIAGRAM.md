# Super Admin User - Setup Architecture & Flow Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REALTORS-LEASERS APPLICATION              │
└─────────────────────────────────────────────────────────────┘
                                ↓
        ┌───────────────────────┴───────────────────────┐
        ↓                                               ↓
   ┌─────────────┐                              ┌──────────────┐
   │   Login     │                              │   Routes &   │
   │   Page      │                              │  Navigation  │
   └──────┬──────┘                              └──────────────┘
          ↓
   Enter Credentials:
   - Email: duncanmarshel@gmail.com
   - Password: Marshel@1992
          ↓
   ┌─────────────────────────────────────────┐
   │   Supabase Authentication (auth.users)   │
   │   - Validates email & password          │
   │   - Returns session token               │
   │   - Retrieves User ID (UUID)            │
   └──────────────────┬──────────────────────┘
                      ↓
   ┌─────────────────────────────────────────┐
   │   AuthContext (Context/AuthContext.tsx)  │
   │   - Fetches user profile from database   │
   │   - Checks role: super_admin?           │
   │   - Verifies permissions                │
   └──────────────────┬──────────────────────┘
                      ↓
   ┌─────────────────────────────────────────┐
   │   public.profiles (Database)             │
   │   - id: {USER_ID}                       │
   │   - email: duncanmarshel@gmail.com      │
   │   - role: super_admin                   │
   │   - is_active: true                     │
   │   - status: active                      │
   └──────────────────┬──────────────────────┘
                      ↓
   ┌─────────────────────────────────────────┐
   │   ProtectedRoute (ProtectedRoute.tsx)    │
   │   - Checks role matches required access │
   │   - Allows super_admin through          │
   └──────────────────┬──────────────────────┘
                      ↓
   ┌─────────────────────────────────────────┐
   │   SuperAdminLayout (layout)              │
   │   - Renders navigation sidebar           │
   │   - Shows admin menu items               │
   └──────────────────┬──────────────────────┘
                      ↓
   ┌─────────────────────────────────────────┐
   │   Admin Dashboard                        │
   │   /portal/super-admin/dashboard          │
   │   ✅ Full system access                 │
   │   ✅ All menu items available           │
   │   ✅ All actions permitted              │
   └─────────────────────────────────────────┘
```

---

## 📊 User Role Hierarchy

```
┌─────────────────────────────────────────┐
│              ROLE HIERARCHY              │
└─────────────────────────────────────────┘

            SUPER_ADMIN ⭐
            │
            ├─ * (All permissions)
            ├─ manage_all_properties
            ├─ manage_all_users
            ├─ manage_all_leases
            ├─ manage_all_payments
            ├─ manage_approvals
            ├─ manage_settings
            ├─ view_analytics
            ├─ manage_refunds
            ├─ manage_managers
            ├─ manage_maintenance
            ├─ view_audit_logs
            └─ manage_system

               ↓ ↓ ↓ ↓
               
    PROPERTY_MANAGER / OWNER / TENANT
    (Limited permissions per role)
```

---

## 🔐 Authentication & Authorization Flow

```
                    START
                      ↓
         ┌────────────────────────┐
         │  User visits /login    │
         └────────────┬───────────┘
                      ↓
         ┌────────────────────────────────┐
         │  Enter email & password        │
         │  duncanmarshel@gmail.com       │
         │  Marshel@1992                  │
         └────────────┬───────────────────┘
                      ↓
         ┌────────────────────────────────────────┐
         │  Supabase Auth validates credentials   │
         └────────────┬─────────────────────────┬─┘
                      ↓                         ↓
              [SUCCESS]                    [FAILED]
                      ↓                         ↓
       ┌─────────────────────┐    ┌──────────────────┐
       │ Return session      │    │ Show error       │
       │ Create JWT token    │    │ message & stay   │
       │ Store credentials   │    │ on login page    │
       └────────────┬────────┘    └──────────────────┘
                    ↓
       ┌─────────────────────────────────┐
       │ Fetch user profile from db      │
       │ SELECT * FROM profiles          │
       │ WHERE id = {USER_ID}            │
       └────────────┬────────────────────┘
                    ↓
       ┌─────────────────────────────────┐
       │ Check role = super_admin?       │
       └────────────┬────────────────────┘
                    ↓
         [SUPER_ADMIN DETECTED]
                    ↓
       ┌─────────────────────────────────┐
       │ Set permissions to *            │
       │ (All permissions)               │
       └────────────┬────────────────────┘
                    ↓
       ┌──────────────────────────────────┐
       │ Redirect to:                     │
       │ /portal/super-admin/dashboard    │
       └────────────┬─────────────────────┘
                    ↓
       ┌──────────────────────────────────┐
       │ Load SuperAdminLayout            │
       │ Show all menu items              │
       │ Full system access granted ✅    │
       └──────────────────────────────────┘
```

---

## 📋 Setup Process Flow

```
PHASE 1: SUPABASE AUTHENTICATION
═════════════════════════════════

    USER CREATES ACCOUNT IN AUTH UI
              ↓
    ┌─────────────────────────┐
    │ Go to Supabase Dashboard │
    │ Auth > Users            │
    │ Add user                │
    │ - Email                 │
    │ - Password              │
    │ - ✓ Auto confirm        │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Supabase creates:       │
    │ - User in auth.users    │
    │ - Generates UUID        │
    │ - Returns credentials   │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ User copies UUID        │
    │ (Required for next step)│
    └─────────────────────────┘


PHASE 2: DATABASE PROFILE SETUP
════════════════════════════════

    USER RUNS SQL SCRIPT
              ↓
    ┌─────────────────────────┐
    │ Edit SQL file           │
    │ Replace {USER_ID}       │
    │ with actual UUID        │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Go to SQL Editor        │
    │ Create new query        │
    │ Paste SQL script        │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Click RUN               │
    │ Script executes         │
    │ Profile inserted        │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Database creates:       │
    │ - Profile record        │
    │ - Links to auth.users   │
    │ - Sets role: super_admin│
    │ - Sets is_active: true  │
    │ - Sets status: active   │
    └─────────────────────────┘


PHASE 3: TESTING & VERIFICATION
════════════════════════════════

    USER TESTS LOGIN
              ↓
    ┌─────────────────────────┐
    │ npm run dev             │
    │ Start application       │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Navigate to login page  │
    │ Enter credentials       │
    │ Click "Login"           │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Application processes:  │
    │ - Validates credentials │
    │ - Fetches profile       │
    │ - Checks role           │
    │ - Grants permissions    │
    └────────────┬────────────┘
                 ↓
    ┌─────────────────────────┐
    │ Redirects to:           │
    │ /portal/super-admin/    │
    │ dashboard               │
    │                         │
    │ ✅ SUCCESS!             │
    └─────────────────────────┘
```

---

## 🗄️ Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE STRUCTURE                        │
└─────────────────────────────────────────────────────────────┘

AUTHENTICATION LAYER (Supabase Managed)
┌────────────────────────┐
│   auth.users           │
├────────────────────────┤
│ id (UUID)              │ ← Primary Key
│ email                  │
│ password_hash          │
│ created_at             │
│ last_sign_in_at        │
└────────────┬───────────┘
             │
             │ Links via id
             │
             ↓
APPLICATION LAYER (Your Database)
┌────────────────────────┐
│   public.profiles      │
├────────────────────────┤
│ id (UUID) 🔗           │ ← Foreign Key to auth.users
│ email                  │
│ first_name             │
│ last_name              │
│ full_name              │
│ phone                  │
│ role 👑                │ ← 'super_admin'
│ user_type              │
│ status                 │ ← 'active'
│ is_active              │ ← true
│ email_confirmed        │ ← true
│ email_confirmed_at     │
│ avatar_url             │
│ created_at             │
│ updated_at             │
└────────────────────────┘

Key Fields for Super Admin:
├─ role = 'super_admin'
├─ user_type = 'super_admin'
├─ status = 'active'
├─ is_active = true
└─ email_confirmed = true
```

---

## 🔄 Permission Resolution

```
LOGIN
  ↓
FETCH USER PROFILE
  ↓
GET ROLE = 'super_admin'
  ↓
LOOKUP PERMISSIONS FOR ROLE
  ↓
┌──────────────────────────────┐
│ Role Permissions Resolution  │
├──────────────────────────────┤
│ super_admin role has:        │
│  - "*" (wildcard)            │
│                              │
│ Wildcard means:              │
│  ✅ Can do EVERYTHING        │
│  ✅ No restrictions          │
│  ✅ Full system access       │
│  ✅ All pages accessible     │
│  ✅ All actions permitted    │
└──────────────────────────────┘
  ↓
GRANT ACCESS TO:
  ✅ All routes
  ✅ All pages
  ✅ All features
  ✅ All operations
  ↓
ALLOW NAVIGATION
```

---

## 📍 Route Access Control

```
Route Validation Process:
═════════════════════════

Request: /portal/super-admin/dashboard
  ↓
ProtectedRoute Check:
  1. Is user logged in? → YES
  2. Does user have profile? → YES
  3. Is user role super_admin? → YES
  4. Does super_admin have access? → YES (*)
  ↓
SuperAdminLayout:
  ✅ Render navigation
  ✅ Show all menu items
  ✅ Load dashboard page
  ↓
User sees: Full Admin Dashboard ✅


Menu Items Shown to Super Admin:
════════════════════════════════
✓ Dashboard
✓ Properties Management
✓ User Management
✓ Approval Queue
✓ Analytics
✓ System Settings
✓ Leases Management
✓ Payments Management
✓ Manager Portal
✓ Profile Management
✓ Refund Status

(All items visible because role = super_admin)
```

---

## 🎯 Access Control Matrix

```
┌────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL MATRIX                        │
└────────────────────────────────────────────────────────────────┘

Feature/Permission          │ Tenant │ Manager │ Owner │ Super_Admin
────────────────────────────┼────────┼─────────┼───────┼────────────
View Own Lease              │   ✅   │    ✓    │   ✓   │     ✅
View All Leases             │   ❌   │    ✓    │   ✓   │     ✅
Manage Leases               │   ❌   │    ✓    │   ✓   │     ✅
View Own Property           │   ✓    │    ✓    │   ✅  │     ✅
View All Properties         │   ❌   │    ✓    │   ✓   │     ✅
Add Property                │   ❌   │    ❌   │   ✓   │     ✅
Edit Property               │   ❌   │    ✓    │   ✓   │     ✅
Delete Property             │   ❌   │    ❌   │   ❌   │     ✅
View Own Profile            │   ✅   │    ✅   │   ✅  │     ✅
View All Profiles           │   ❌   │    ✓    │   ❌   │     ✅
Edit Profiles               │   ✅*  │    ✓    │   ❌   │     ✅
Create Users                │   ❌   │    ❌   │   ❌   │     ✅
Delete Users                │   ❌   │    ❌   │   ❌   │     ✅
Manage Payments             │   ✓    │    ✓    │   ✓   │     ✅
Process Refunds             │   ❌   │    ✓    │   ✓   │     ✅
View Analytics              │   ❌   │    ✓    │   ✓   │     ✅
Configure Settings          │   ❌   │    ❌   │   ❌   │     ✅
Approve Requests            │   ❌   │    ❌   │   ❌   │     ✅
View Audit Logs             │   ❌   │    ❌   │   ❌   │     ✅
Manage System               │   ❌   │    ❌   │   ❌   │     ✅

Legend: ✅ = Full Access | ✓ = Partial Access | ❌ = No Access | * = Own only
```

---

## 📈 Super Admin Capabilities

```
┌──────────────────────────────────────────┐
│     SUPER ADMIN FULL CAPABILITIES         │
└──────────────────────────────────────────┘

USER MANAGEMENT
├─ Create new users
├─ Edit all user profiles
├─ Suspend/reactivate users
├─ Change user roles
├─ Reset user passwords
├─ View user activity logs
└─ Delete user accounts

PROPERTY MANAGEMENT
├─ Add new properties
├─ Edit property details
├─ Delete properties
├─ Manage property units
├─ Assign property managers
├─ View occupancy status
└─ Generate property reports

FINANCIAL MANAGEMENT
├─ View all payments
├─ Process deposits
├─ Approve refunds
├─ Configure payment methods
├─ Generate financial reports
├─ Manage billing
└─ Track transactions

REQUEST MANAGEMENT
├─ Review approval queue
├─ Approve/reject requests
├─ Add approval notes
├─ Escalate issues
├─ Track request history
├─ Generate request reports
└─ Manage request workflows

SYSTEM CONFIGURATION
├─ Configure system settings
├─ Manage roles & permissions
├─ Set email templates
├─ Configure notifications
├─ Manage API keys
├─ Configure backups
└─ View system logs

ANALYTICS & REPORTING
├─ View system dashboard
├─ Generate analytics reports
├─ Export data
├─ View audit logs
├─ Track system health
└─ Monitor performance

MAINTENANCE & OPERATIONS
├─ View maintenance requests
├─ Assign maintenance staff
├─ Track maintenance status
├─ Approve work orders
└─ View maintenance history
```

---

**Diagram Created**: February 3, 2026  
**Status**: ✅ Complete  
**Super Admin Email**: duncanmarshel@gmail.com  
