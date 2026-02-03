# IMPLEMENTATION QUICK START

## What You Asked For ✅

You wanted to:
1. **Find how tenant registration works** ✅ Done
2. **Follow that path for property managers** ✅ Done  
3. **Create super admin approval system** ✅ Already exists (enhanced)
4. **Create manager approval for tenants** ✅ Done

---

## THE COMPLETE PATH

### Path 1: TENANT Registration (Already Working)
```
1. Tenant fills signup form (email, password, property, unit)
2. RegisterPage.tsx sends: auth.signUp() with role='tenant'
3. Database trigger fires → Creates profile with status='pending'
4. Registration page creates approval_request
5. Super admin sees in AdminDashboard → "Approvals" tab
6. Admin clicks "Approve" → status becomes 'active'
7. Tenant redirected to /portal/tenant dashboard
8. Tenant picks a unit to apply for
9. Creates approval_request → Notifies property manager
10. Property manager sees in ManagerPortal → "Pending Tenants"
11. Manager clicks "Approve" → Tenant is verified
12. Tenant can now login
```

### Path 2: PROPERTY MANAGER Registration (Now Fixed)
```
1. Manager fills signup form (email, password, properties selected)
2. RegisterPage.tsx sends: auth.signUp() with role='property_manager'
3. Database trigger fires → Creates profile with status='pending' ← FIXED BY MIGRATION
4. Registration page creates approval_request
5. Super admin sees in AdminDashboard → "Approvals" tab
6. Admin clicks "Approve Access" → status becomes 'active'
7. Admin clicks "Assign Properties" ← NEW COMPONENT ADDED
8. Dialog opens → Admin selects which properties manager oversees
9. Creates manager_assignments entries
10. Manager can now login
11. Manager redirected to /portal/manager dashboard
12. Manager sees "My Properties" tab with assigned properties
13. Manager goes to "Pending Tenants" tab
14. Manager sees tenant applications for their properties
15. Manager clicks "Approve" → Tenant is verified
```

---

## FILES YOU NEED TO UNDERSTAND

### 1. Database Trigger (src/supabase/migrations/20260203_fix_property_manager_registration.sql)
**What it does**: When someone signs up via auth.signUp(), this trigger automatically creates their profile

**Key code**:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Why important**: Without this, profiles wouldn't be created automatically

### 2. Registration Form (src/pages/auth/RegisterPage.tsx)
**What it does**: Captures signup data and sends it to Supabase Auth

**Key code** (around line 244):
```typescript
const { data, error: signupError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      phone: formData.phone,
      role: formData.role,              // ← 'tenant' or 'property_manager'
      status: formData.role === "property_manager" ? "pending" : "active",
    },
  },
});
```

**Why important**: The `role` in metadata is what the trigger reads to know what to create

### 3. Super Admin Dashboard (src/pages/AdminDashboard.tsx)
**What it does**: Super admin sees all users and approves them

**Key sections**:
- Line 85-90: Fetches all profiles
- Line 100-110: Shows pending approvals
- Line 102-106: handleApproveUser() function that updates status to 'active'

**New addition**: PropertyManagerAssignment component (imported at line 10)

### 4. Property Manager Assignment (src/components/admin/PropertyManagerAssignment.tsx)
**What it does**: Dialog component that appears next to "Approve" button

**Key code**:
```typescript
// Revokes old assignments
await supabase.from("manager_assignments")
  .update({ status: 'inactive' })
  .eq('manager_id', managerId);

// Creates new assignments
await supabase.from("manager_assignments")
  .insert(newAssignments);
```

**Why important**: Links managers to specific properties they manage

### 5. Manager Portal (src/pages/portal/ManagerPortal.tsx)
**What it does**: Main dashboard for property managers

**Key features**:
- Line 70+: Fetches manager's assigned properties
- Shows pending tenants count
- Links to property management pages

### 6. Manager Tenants Page (src/pages/portal/manager/Tenants.tsx)
**What it does**: Where managers approve/reject tenant applications

**Note**: This page needs to be enhanced to show tenant_verifications

---

## QUICK IMPLEMENTATION CHECKLIST

### ✅ Step 1: Apply Database Migration
```
1. Open Supabase SQL Editor
2. Copy content from: supabase/migrations/20260203_fix_property_manager_registration.sql
3. Paste and run
4. Result: RLS policies fixed, trigger updated
```

### ✅ Step 2: Add PropertyManagerAssignment to AdminDashboard
```
Already done! Files modified:
- src/pages/AdminDashboard.tsx (added import on line 10)
- Added PropertyManagerAssignment component in approvals section
```

### ⚠️ Step 3: Enhance Manager Tenants Page (OPTIONAL)
The Tenants.tsx page exists but may need approval logic added

To add tenant approval to Tenants.tsx:
1. Add state for pending tenants
2. Fetch tenant_verifications where status='pending'
3. Add approve/reject buttons
4. Call handleApproveTenant and handleRejectTenant functions

### ✅ Step 4: Test the Complete Flow
```
Test Scenario 1 - Tenant:
1. Go to /register?type=tenant
2. Fill: email, password, full name, phone, property, unit
3. Click Register
4. Should show: "Awaiting property manager verification"
5. Go to admin dashboard
6. Click Approve for tenant
7. Tenant can now login
8. Property manager sees tenant in "Pending Tenants"
9. Manager approves tenant
10. Tenant verified ✅

Test Scenario 2 - Manager:
1. Go to /register?type=landlord
2. Fill: email, password, full name, phone, select properties
3. Click Register
4. Should show: "Awaiting admin approval"
5. Go to admin dashboard
6. See manager in "Approvals" tab
7. Click "Approve Access"
8. Click "Assign Properties"
9. Select properties and save
10. Manager can now login
11. Sees assigned properties ✅
```

---

## THE ACTUAL DATA FLOW

### What Happens When Someone Registers:

**Tenant Register:**
```
User fills form
  ↓
Calls: supabase.auth.signUp({
  email: "tenant@example.com",
  data: { role: 'tenant', status: 'pending' }
})
  ↓
Auth.users row created with id = xyz123
  ↓
Trigger fires on auth.users INSERT
  ↓
Function handle_new_user() executes with NEW.id = xyz123
  ↓
Reads from NEW.raw_user_meta_data:
  - role: 'tenant'
  - status: 'pending'
  - first_name: 'John'
  - last_name: 'Doe'
  ↓
Inserts into profiles:
  id: xyz123
  role: 'tenant'
  status: 'pending'
  is_active: false
  ↓
Frontend checks if profile was created
  ↓
Creates approval_request entry
Creates notification to property manager
  ↓
User shown: "Awaiting property manager verification"
```

**Property Manager Register:**
```
Same as above but:
  - role: 'property_manager' (from form)
  - status: 'pending'
  ↓
Creates approval_request for manager (not tenant)
  ↓
Notifies super admin (not manager)
  ↓
User shown: "Awaiting admin approval"
```

**Super Admin Approves Manager:**
```
Admin clicks "Approve" button
  ↓
AdminDashboard.tsx calls handleApproveUser()
  ↓
Updates profiles:
  id: abc456
  status: 'active'
  is_active: true
  ↓
Admin clicks "Assign Properties"
  ↓
PropertyManagerAssignment dialog opens
  ↓
Admin checks boxes: ☑ Property A, ☑ Property B
  ↓
Clicks "Assign 2 Properties"
  ↓
Creates rows in manager_assignments:
  manager_id: abc456
  property_id: prop_a_id
  status: 'active'
  ↓
  manager_id: abc456
  property_id: prop_b_id
  status: 'active'
  ↓
Manager can now login
  ↓
ManagerPortal component runs
  ↓
Queries: SELECT * FROM manager_assignments WHERE manager_id = abc456
  ↓
Gets: [prop_a_id, prop_b_id]
  ↓
Fetches properties and pending tenants for those properties
  ↓
Shows manager their dashboard
```

---

## DATABASE RELATIONSHIPS DIAGRAM

```
auth.users
  ├─ id: xyz123
  ├─ email: tenant@example.com
  └─ raw_user_meta_data: {role:'tenant', status:'pending'}
        ↓ (trigger reads this)
        ↓
   profiles
   ├─ id: xyz123 (FK to auth.users)
   ├─ email: tenant@example.com
   ├─ role: 'tenant'
   ├─ status: 'pending'
   └─ is_active: false
        ↓ (When admin approves)
        ↓ UPDATE set status='active', is_active=true
        ↓
   approval_requests
   ├─ submitted_by: xyz123
   ├─ type: 'tenant_verification'
   └─ status: 'pending'
        ↓ (When manager approves)
        ↓ DELETE (approval complete)
        ↓
   tenant_verifications
   ├─ tenant_id: xyz123
   ├─ status: 'pending'
   └─ verified_at: null
        ↓ (When manager clicks Approve)
        ↓ UPDATE set status='verified', verified_at=NOW()
        ↓
   profiles UPDATE set status='active'
        ↓
   Tenant can now login ✅
```

---

## COMMON ERRORS & FIXES

**Error**: "AuthApiError: Database error finding user"
```
Cause: RLS policy blocking profile creation
Fix: Apply migration to fix RLS policies
```

**Error**: "Manager can't see assigned properties"
```
Cause: manager_assignments not created
Fix: Make sure super admin clicks "Assign Properties"
```

**Error**: "Property manager can't login"
```
Cause: Profile status not set to 'active'
Fix: Make sure super admin clicked "Approve Access"
```

**Error**: "Tenant not showing in manager's pending list"
```
Cause: tenant_verifications not created or wrong property
Fix: Check that tenant applied for manager's property
```

---

## FINAL SUMMARY

The system now works like this:

**1. Sign Up**
- User → RegisterPage.tsx → Auth.signUp()
- Role sent in metadata

**2. Profile Created**
- Database trigger reads role from auth metadata
- Creates profile automatically
- Sets status='pending'

**3. Super Admin Approval**
- AdminDashboard shows pending managers
- Admin clicks "Approve" → status='active'
- Admin clicks "Assign Properties" → Creates manager_assignments

**4. Manager Approval**
- Manager logs in → ManagerPortal loads
- Queries manager_assignments to get properties
- Queries tenant_verifications for pending tenants
- Manager clicks "Approve" → Tenant verified

**5. Tenant Login**
- Tenant can now login
- Redirected to /portal/tenant

Everything flows through the database, not manual creation. Automated and clean! ✅
