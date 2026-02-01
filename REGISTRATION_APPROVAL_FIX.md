# Registration & Approval Workflow Implementation Guide

## Problem & Solution

### The Error You're Experiencing
```
POST https://rcxmrtqgppayncelonls.supabase.co/auth/v1/signup 500 (Internal Server Error)
"Database error saving new user"
```

### Root Cause
The RLS (Row Level Security) policies on the `profiles` table contain **circular logic**:
- When a user signs up, Supabase tries to create their profile via a trigger
- The trigger attempts to execute within the user's authenticated context (not yet a super_admin)
- The INSERT policy checks if the user is a super_admin by querying the profiles table
- But the profile being created doesn't exist yet → infinite loop → 500 error

### The Solution
1. **Fix RLS policies** - Remove circular logic (see: `20260203_fix_registration_signup_error.sql`)
2. **Use SECURITY DEFINER trigger** - Allows the trigger to bypass RLS restrictions
3. **Update registration flow** - Implement approval-based access control instead of relying on profile status alone

---

## Implementation Steps

### STEP 1: Apply the Database Migration

Run this SQL migration in your Supabase dashboard (SQL Editor):

```sql
-- From: supabase/migrations/20260203_fix_registration_signup_error.sql
```

This migration:
- ✅ Removes all problematic RLS policies from `profiles` table
- ✅ Recreates policies without circular logic
- ✅ Updates the auth trigger to use `SECURITY DEFINER`
- ✅ Grants proper permissions to authenticated users

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the migration SQL from `20260203_fix_registration_signup_error.sql`
3. Run it
4. Verify: Check for "Registration fix complete!" message

---

### STEP 2: Understanding the Approval Workflow

#### **Tenant Registration Flow**
```
1. Tenant signs up → Profile created (status: pending)
2. Unit marked as "reserved"
3. Approval Request created (tenant_verification)
4. Notification sent to Property Manager
   ↓
5. Property Manager reviews in their dashboard
   ↓
6. Property Manager clicks "Approve" 
   → Profile status changes to "active"
   → Notification sent to tenant
   ↓
7. Tenant can now login to tenant dashboard
```

#### **Property Manager Registration Flow**
```
1. Property Manager signs up → Profile created (status: pending)
2. Approval Request created (manager_assignment)
3. Notification sent to Super Admin
   ↓
4. Super Admin reviews in their dashboard
   ↓
5. Super Admin clicks "Approve"
   → Profile status changes to "active"
   → Notification sent to property manager
   ↓
6. Property Manager can now login to property manager dashboard
```

---

### STEP 3: Database Tables for Approval System

The system uses these tables:

#### `approval_requests` - Main approval workflow table
```sql
-- New registration awaits approval
INSERT INTO approval_requests (
  submitted_by,        -- User ID requesting approval
  type,                -- 'tenant_verification' or 'manager_assignment'
  title,               -- Readable title
  description,         -- Details
  property_id,         -- Property involved (tenants only)
  unit_id,             -- Unit involved (tenants only)
  status              -- 'pending', 'approved', 'rejected'
);
```

#### `notifications` - Notify users of pending approvals
```sql
-- Sent to property manager (for tenants) or super admin (for managers)
INSERT INTO notifications (
  recipient_id,        -- Who receives the notification
  sender_id,           -- The applicant
  type,                -- 'tenant_verification' or 'manager_approval'
  related_entity_id,   -- User ID being approved
  title,               -- Readable title
  message,             -- Details
  is_read             -- false initially
);
```

---

### STEP 4: Frontend Changes Made

The `RegisterPage.tsx` has been updated to:

1. **On Tenant Signup**
   - Create profile with `status: "pending"`
   - Reserve the unit
   - Create approval request in `approval_requests` table
   - Send notification to property manager
   - Show: "Awaiting property manager verification"

2. **On Property Manager Signup**
   - Create profile with `status: "pending"`
   - Create approval request in `approval_requests` table
   - Send notification to super admin
   - Show: "Awaiting admin approval"

3. **Error Handling**
   - Non-critical errors (profile updates, notifications) don't block signup
   - User receives clear message about approval process

---

### STEP 5: Create Approval Dashboard (Next Steps)

You'll need to create approval management interfaces:

#### **For Property Managers** (to approve tenants)
```
Dashboard → Pending Approvals
  ├─ Show list of approval_requests where type='tenant_verification'
  └─ For each request:
     ├─ Show tenant details
     ├─ Show unit details
     ├─ Approve button → Update status to 'approved' + set profile status to 'active'
     └─ Reject button → Update status to 'rejected' + notify tenant
```

#### **For Super Admin** (to approve property managers)
```
Dashboard → Manager Approvals
  ├─ Show list of approval_requests where type='manager_assignment'
  └─ For each request:
     ├─ Show manager details
     ├─ Show managed properties
     ├─ Approve button → Update status to 'approved' + set profile status to 'active'
     └─ Reject button → Update status to 'rejected' + notify manager
```

---

### STEP 6: Update Login Logic (Important!)

Modify your login to check approval status:

```typescript
// After successful login, check profile status
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

if (profile.status === "pending") {
  // Show message: "Your account is awaiting approval"
  // Redirect to approval status page
  return;
}

if (profile.status === "active") {
  // Allow login to dashboard
  // Redirect based on role (tenant, property_manager, super_admin)
}
```

---

### STEP 7: Testing the Full Workflow

#### **Test Tenant Registration**
1. Go to Register page
2. Select "Tenant / Looking to Rent"
3. Fill all fields with valid data
4. Select a property and unit
5. Click "Create Account"
6. **Expected:** "Registration successful! Awaiting property manager verification."
7. In Supabase, check:
   - ✅ New user in `auth.users`
   - ✅ New profile in `profiles` with status='pending'
   - ✅ New record in `approval_requests`
   - ✅ Unit status='reserved'
   - ✅ Notification sent to property manager

#### **Test Property Manager Registration**
1. Go to Register page
2. Select "Property Manager"
3. Fill all fields
4. Select one or more properties
5. Click "Create Account"
6. **Expected:** "Registration successful! Awaiting admin approval."
7. In Supabase, check:
   - ✅ New user in `auth.users`
   - ✅ New profile in `profiles` with status='pending'
   - ✅ New record in `approval_requests`
   - ✅ Notification sent to super admin

---

## Troubleshooting

### "Database error saving new user" still appears?

1. **Verify migration was applied:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Should show RLS policies without circular logic

2. **Check if trigger exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. **Check trigger definition:**
   ```sql
   SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);
   ```
   Should show `SECURITY DEFINER`

### Profile not created after signup?

The trigger might be failing silently. Check:
```sql
-- In Supabase logs or by manually inserting
INSERT INTO profiles (id, email, role, status) 
VALUES ('user-id-here', 'email@example.com', 'tenant', 'pending');
```

### Can't create approval requests?

Check that `approval_requests` table has proper permissions:
```sql
GRANT INSERT ON public.approval_requests TO authenticated;
```

---

## Quick Summary of Changes

| File | Changes |
|------|---------|
| `supabase/migrations/20260203_fix_registration_signup_error.sql` | 🔧 Fix RLS circular logic, update trigger |
| `src/pages/auth/RegisterPage.tsx` | 🔧 Simplify profile creation, add approval workflow |

---

## Next: Build the Approval Dashboards

Once registrations work, you need:
1. Property Manager dashboard → Approve pending tenants
2. Super Admin dashboard → Approve pending property managers

Would you like me to create these dashboard components?
