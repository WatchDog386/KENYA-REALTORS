# Database & System Alignment - Clean Slate Implementation

## Current Issues Found

### 1. Registration Flow Issues
- ❌ Current: Tenants selecting properties and units during signup
- ✅ New: Users sign up with only: full_name, email, password, phone, account_type
- ❌ Property and unit assignment must be done by super admin ONLY

### 2. Database Schema Issues to Fix

#### profiles table
**Current problems:**
- `role` field allows direct setting (should be null on signup, set by super_admin)
- `status` field exists but workflow unclear
- Missing clear approval workflow tracking
- `user_type` field (unclear purpose vs `role`)

**Fix:**
```sql
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT NULL;  -- Users sign up without role
  
-- Ensure status field properly tracks: pending → assigned → active
-- Add workflow fields if missing:
-- - assigned_by uuid (references super_admin)
-- - assigned_at timestamp
```

#### Unassigned Users Tracking
**Required additions:**
```sql
-- Table to track unassigned users for super admin view
CREATE TABLE unassigned_users (
  id uuid PRIMARY KEY REFERENCES profiles(id),
  account_type text NOT NULL,  -- 'tenant', 'property_manager', 'maintenance'
  created_at timestamp DEFAULT NOW(),
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamp
);
```

#### Property Manager Assignments
**Current table exists:** manager_assignments
**Status:** ✅ Should work but needs to be populated by super_admin only

#### Tenant-Property-Unit Assignments
**Current issue:** tenant-properties table exists but not fully integrated

**Fix needed:**
```sql
-- This table bridges tenant to their assigned property & unit
CREATE OR REPLACE TABLE tenant_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  unit_id uuid NOT NULL REFERENCES units_detailed(id),
  manager_id uuid REFERENCES profiles(id),  -- Their property manager
  lease_id uuid REFERENCES leases(id),
  assigned_by uuid NOT NULL REFERENCES profiles(id),  -- Super admin
  assigned_at timestamp DEFAULT NOW(),
  move_in_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  UNIQUE(unit_id)  -- One tenant per unit
);
```

### 3. User Management Flow Issues

**Current:** Properties/units selected during signup
**New flow should be:**
```
1. User signs up → Created in auth.users & profiles with role=NULL
2. Profile marked as 'pending' approval/assignment
3. Super admin views in UserManagement → "Unassigned Users"
4. Super admin:
   - Assigns role (property_manager, tenant, maintenance)
   - If property_manager: Assigns properties
   - If tenant: Assigns property + unit
   - Sets status to 'active'
5. User can now login to appropriate dashboard
```

### 4. Super Admin Setup
**Action needed:**
```sql
UPDATE profiles 
SET role = 'super_admin', status = 'active'
WHERE email = 'duncanmarshel@gmail.com';
```

## Implementation Checklist

### Database Layer
- [ ] Review & update profiles table default values
- [ ] Create/update unassigned_users view or table
- [ ] Ensure tenant_properties table structure is correct
- [ ] Ensure manager_assignments table is properly configured
- [ ] Verify RLS policies allow super_admin full access

### Frontend - Registration
- [ ] Remove property selection from RegisterForm
- [ ] Remove unit selection from RegisterForm
- [ ] Keep only: full_name, email, password, phone, account_type
- [ ] On signup: Create profile with role=NULL, status='pending'

### Frontend - Super Admin Dashboard
- [ ] Create "Unassigned Users" tab in UserManagement
- [ ] Show: name, email, account_type, created_at
- [ ] For Property Manager:
   - [ ] Assign multiple properties
   - [ ] Mark as active
- [ ] For Tenant:
   - [ ] Assign single property
   - [ ] Assign unit from that property
   - [ ] Assign property manager
   - [ ] Mark as active

### Frontend - Auth Context
- [ ] Update signUp to NOT set role
- [ ] Update role assignment to only allow super_admin
- [ ] Update login redirect based on role

### Frontend - Navigation
- [ ] Super Admin → Super Admin Dashboard
- [ ] Property Manager → Manager Portal
- [ ] Tenant → Tenant Dashboard
- [ ] Unassigned users → Show message "Awaiting admin assignment"

## Database Tables Involved

1. **profiles** - Core user data, role assignment
2. **auth.users** - Supabase auth table
3. **properties** - Property listings
4. **units_detailed** - Individual units in properties
5. **manager_assignments** - Property managers to properties
6. **tenant_properties** - Tenants to their assigned units
7. **leases** - Lease information

## Clean Slate SQL Statements

```sql
-- 1. Clear all test data from profiles
DELETE FROM profiles WHERE email NOT IN (
  'duncanmarshel@gmail.com'  -- Keep super admin
);

-- 2. Reset role to NULL for anyone not super admin
UPDATE profiles SET role = NULL, status = 'pending' 
WHERE email != 'duncanmarshel@gmail.com';

-- 3. Clear pending assignments
DELETE FROM manager_assignments WHERE manager_id NOT IN (
  SELECT id FROM profiles WHERE role = 'super_admin'
);

-- 4. Reset units to vacant
UPDATE units_detailed SET occupant_id = NULL, status = 'vacant';

-- 5. Clear test leases
DELETE FROM leases;

-- 6. Clear test tenant data
DELETE FROM tenant_properties;
```

## Success Criteria

✅ User signs up with name, email, password, phone, account_type only
✅ Profile created with role=NULL, status='pending'
✅ Super admin sees all pending users in UserManagement
✅ Super admin can assign role, property, unit, and activate user
✅ User receives assignment and can login to correct dashboard
✅ Property manager sees assigned properties only
✅ Tenant sees assigned property/unit only
✅ Audit log shows who assigned what and when

## Files to Update

### Frontend
- `src/components/auth/RegisterForm.tsx` - Remove property/unit fields
- `src/pages/auth/RegisterPage.tsx` - Update form validation
- `src/contexts/AuthContext.tsx` - Update signUp function
- `src/components/portal/super-admin/UserManagementNew.tsx` - Update UI for unassigned users
- `src/pages/AdminDashboard.tsx` - Ensure proper navigation
- `src/config/superAdminRoutes.ts` - Verify routing

### Database
- `supabase/migrations/*` - Create migration for clean slate
- RLS Policies - Verify super_admin access

## Notes

- This is a **clean slate** - existing test data will be cleared
- Only **duncanmarshel@gmail.com** will be the initial super admin
- Users can only be assigned by the super admin
- Assignment changes should be audit logged
- Status flow: pending → active (when assigned)
