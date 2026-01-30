# Developer Quick Reference - New Role/Approval Workflow

## What Changed (TL;DR)

🔒 **Role changes are now approval-based, not direct DB updates**

### Before (❌ OLD)
```typescript
// Dangerous: Direct DB update, privilege escalation risk
await supabase
  .from('profiles')
  .update({ role: 'property_manager' })
  .eq('id', userId);
```

### After (✅ NEW)
```typescript
// Safe: Creates approval request, enforced by DB trigger
const { data } = await supabase
  .from('approval_queue')
  .insert({
    requested_by: user.id,
    request_type: 'role_assignment',  // or 'tenant_addition', 'tenant_removal'
    request_id: user.id,
    status: 'pending',
    metadata: { requested_role: 'property_manager' },
    created_at: new Date().toISOString(),
  })
  .select()
  .single();
```

---

## New Request Types

| Type | Used For | Who Can Create | Notes |
|------|----------|---|---|
| `role_assignment` | Changing user role | Anyone (must be approved) | SuperAdmin approves to finalize role change |
| `tenant_addition` | Adding tenant to property | SuperAdmin (from dashboard) | Creates tenant record after approval |
| `tenant_removal` | Removing tenant from property | SuperAdmin (from dashboard) | Marks tenant as inactive after approval |
| `manager_assignment` | Assigning manager to property | SuperAdmin (from dashboard) | Uses `manager_assignments` many-to-many table |

---

## Updated Hooks/Components

### `useAuth()` - AuthContext
```typescript
// OLD: updateUserRole(role: string) → Direct DB write
// NEW: updateUserRole(role: string) → Creates approval_queue request

const { updateUserRole } = useAuth();

try {
  await updateUserRole('property_manager');
  // Now shows: "Role request submitted for approval"
} catch (err) {
  // Handle approval queue creation failure
}
```

### `useApprovalSystem()`
```typescript
// NEW request types supported
const { 
  approveRequest,     // Applies the approved change
  rejectRequest,      // Rejects the pending request
  fetchApprovalRequests,  // Gets all pending approvals
} = useApprovalSystem();

// Approve a role_assignment
await approveRequest(requestId, 'Role approved');
// Internally calls processApprovedRequest() → Updates profiles.role

// Approve a tenant_addition
await approveRequest(tenantAdditionRequestId, 'Tenant approved');
// Internally calls processApprovedRequest() → Inserts into tenants table
```

### Profile.tsx
```typescript
// OLD: User redirected immediately after role selection
// NEW: User sees approval message, waits for SuperAdmin approval

const handleRoleChange = async (role: string) => {
  try {
    await updateUserRole(role);
    setSuccess("Role request submitted for approval!");
    // ❌ No redirect here anymore
  } catch (err) {
    setError(err.message);
  }
};
```

### UserManagement.tsx (Super Admin Dashboard)
```typescript
// OLD: handleAssignRole() → Direct DB writes
// NEW: handleAssignRole() → Creates approval_queue requests

const handleAssignRole = async () => {
  // For property managers:
  await supabase.from('approval_queue').insert({
    request_type: 'manager_assignment',
    metadata: { user_id, license_number, experience_years, ... }
  });
  
  // For tenants:
  await supabase.from('approval_queue').insert({
    request_type: 'tenant_addition',
    metadata: { user_id, property_id, unit_id, move_in_date, ... }
  });
};
```

---

## RLS Policy Changes

### Before (❌ PERMISSIVE)
```sql
-- Anyone authenticated could read any profile
CREATE POLICY "Authenticated users can view any profile" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

### After (✅ SCOPED)
```sql
-- Users see only their own, SuperAdmin sees all, 
-- Managers see tenants in their properties
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_super_admin" ON profiles
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "profiles_select_manager_tenants" ON profiles
  FOR SELECT
  USING (
    public.is_property_manager()
    AND EXISTS (SELECT 1 FROM tenants t
               JOIN manager_assignments ma ...
               WHERE t.user_id = profiles.id)
  );
```

**All tables scoped similarly:** properties, units, tenants, payments, refunds, vacation_notices

---

## Approval Flow Example

### Step 1: User Requests Role Change
```typescript
// User goes to /profile → selects "Property Manager" role
await supabase.from('approval_queue').insert({
  requested_by: 'user123',
  request_type: 'role_assignment',
  request_id: 'user123',
  status: 'pending',
  metadata: { requested_role: 'property_manager' }
});
// ✅ Request created, status='pending'
```

### Step 2: SuperAdmin Sees Pending Request
```typescript
// Dashboard queries approval_queue
const { data: pendingRequests } = await supabase
  .from('approval_queue')
  .select('*')
  .eq('status', 'pending');

// User sees: "user123 wants to be Property Manager"
```

### Step 3: SuperAdmin Approves
```typescript
const { approveRequest } = useApprovalSystem();
await approveRequest(requestId, 'Approved');

// Internally:
// 1. Updates approval_queue: status='approved'
// 2. Calls processApprovedRequest()
// 3. processApprovedRequest() updates profiles.role = 'property_manager'
// 4. User now has access to manager features
```

### Step 4: User Refreshes / Logs In Again
```typescript
// Auth context refreshes user profile
const profile = await fetchUserProfileFromDB(userId);
// profile.role is now 'property_manager'
// User can now access /portal/manager
```

---

## Common Development Tasks

### ✅ Adding a New Approval Type
```typescript
// 1. Add to union type in useApprovalSystem.ts
interface ApprovalRequest {
  request_type: 
    | "role_assignment"
    | "tenant_addition"
    | "my_new_type"  // ← Add here
}

// 2. Add case to processApprovedRequest()
case "my_new_type":
  // Do whatever should happen when approved
  break;

// 3. Add case to processRejectedRequest()
case "my_new_type":
  // Do whatever should happen when rejected
  break;
```

### ✅ Creating an Approval Request (From Component)
```typescript
const { data: { user: currentUser } } = await supabase.auth.getUser();

await supabase.from('approval_queue').insert({
  requested_by: currentUser.id,
  request_type: 'my_new_type',
  request_id: relatedRecordId,
  status: 'pending',
  metadata: { /* any data needed for approval */ },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ✅ Approval request created, waiting for SuperAdmin
```

### ✅ Testing Approval Workflow
```bash
# 1. Log in as regular user
# 2. Request role change → See "submitted for approval" message
# 3. Check Supabase directly:
SELECT * FROM approval_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;

# 4. Log in as SuperAdmin
# 5. Go to approvals dashboard
# 6. Approve the request
# 7. Check that user's role was updated:
SELECT role FROM profiles WHERE id = 'user123';
# Should now show 'property_manager'
```

---

## DB Helper Functions (For SQL Queries)

```sql
-- Check if current user is SuperAdmin
SELECT public.is_super_admin();

-- Check if current user is a Property Manager
SELECT public.is_property_manager();

-- Check if current user is a Tenant
SELECT public.is_tenant();

-- Check if manager has access to property
SELECT public.manager_has_property('property-uuid');

-- Check if tenant has access to property
SELECT public.tenant_has_property('property-uuid');

-- Check if tenant has access to unit
SELECT public.tenant_has_unit('unit-uuid');
```

---

## Migration Reference

**File:** `supabase/migrations/20260125_rls_hardening.sql`

**What it does:**
- ✅ Adds role-change prevention triggers
- ✅ Adds tenant integrity constraints (unique user_id, unique active unit)
- ✅ Harddens all RLS policies (scoped by role)
- ✅ Adds helper functions for permission checks
- ✅ Adds column compatibility for approval tables

**Deploy with:**
```bash
supabase db push
# or copy entire SQL to Supabase Dashboard → SQL Editor
```

---

## Troubleshooting

### Problem: "Permission denied" when updating profile
```
Error: permission denied for table profiles
```
**Cause:** Your RLS policy doesn't allow the update  
**Fix:** Check that your role is allowed to update that specific field via the policy

### Problem: Role doesn't change after approval
```
Approved in approval_queue, but profiles.role still null
```
**Cause:** processApprovedRequest() for role_assignment didn't run  
**Fix:** Check that approval system successfully processed the request (check logs)

### Problem: Can't see tenants assigned to property
```
Manager querying tenants, getting zero results
```
**Cause:** manager_has_property() function not working correctly  
**Fix:** Check that manager_assignments table has status='active' for that manager+property combo

### Problem: User can still see other users' profiles
```
Tenant reading another tenant's personal info
```
**Cause:** RLS policy still too permissive  
**Fix:** Revert migrations and reapply 20260125_rls_hardening.sql

---

## Key Takeaways

1. **All role changes are now approval-based** — No exceptions
2. **RLS is now the enforcement mechanism** — Not UI validation
3. **Approval queue is the single source of truth** for pending operations
4. **DB triggers prevent** direct role escalation
5. **Tenants are isolated** — Can only see their own data
6. **Managers are scoped** — Can only see assigned properties + related tenants
7. **SuperAdmins have full access** — Can approve/reject/view everything

---

**Questions? Check SECURITY_HARDENING_SUMMARY.md or DEPLOYMENT_CHECKLIST.md**
