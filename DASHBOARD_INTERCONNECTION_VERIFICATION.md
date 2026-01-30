# Dashboard Interconnection Verification Guide

**Date:** January 25, 2026  
**Status:** Complete Implementation with Verification Checklist  

---

## PART 1: What Changed & Why

### Summary of Priority 1 Fixes (COMPLETED)

| Dashboard | Issue | Fix Applied | Impact |
|-----------|-------|------------|--------|
| **SuperAdmin** | Used `approval_requests` (old table) | Now uses `approval_queue` (single source) | ✅ Unified approval tracking |
| **Manager Portal** | `fetchRecentPayments()` was stubbed | Implemented with property scoping | ✅ Payments visible for assigned properties |
| **TenantDashboard** | Queried `rent_payments` (doesn't exist) | Now queries `payments` with user_id filter | ✅ Payments accessible |
| **TenantDashboard** | No tenant property context | Added `fetchTenantInfo()` → sets tenantInfo | ✅ All queries properly scoped |
| **TenantDashboard** | No maintenance property scoping | Now scopes to `property_id` + `user_id` | ✅ Isolation enforced |

---

## PART 2: Data Flow Diagrams

### SuperAdmin Dashboard Data Flow

```
┌──────────────────────┐
│ SuperAdmin Logged In │
│   (role=super_admin) │
└──────────┬───────────┘
           │
           ▼
    ✅ is_super_admin() 
    (RLS policy passes)
           │
           ├─→ Query: ALL properties (no filter)
           │   └─→ Display: "123 Properties"
           │
           ├─→ Query: ALL users (role != super_admin)
           │   └─→ Display: "456 Active Users"
           │
           ├─→ Query: ALL payments
           │   └─→ Display: "KSH 1.2M Monthly Revenue"
           │
           ├─→ Query: approval_queue (status=pending)
           │   ├─ request_type: role_assignment
           │   ├─ request_type: manager_assignment
           │   ├─ request_type: tenant_addition
           │   └─ request_type: tenant_removal
           │   └─→ Display: "5 Pending Approvals"
           │
           └─→ Query: ALL maintenance requests
               └─→ Display: "8 Pending Maintenance"
```

### Manager Portal Data Flow

```
┌──────────────────────┐
│ Manager Logged In    │
│ (role=property_mgr)  │
└──────────┬───────────┘
           │
           ▼
    ✅ is_property_manager()
    (RLS policy passes)
           │
           ├─→ RPC: get_manager_dashboard_stats(manager_id)
           │   │
           │   ├─→ Query: manager_assignments 
           │   │   WHERE manager_id=current_user & status='active'
           │   │   └─→ Return: [property_ids]
           │   │
           │   ├─→ Query: properties WHERE id IN [property_ids]
           │   │   └─→ Display: "3 Managed Properties"
           │   │
           │   ├─→ Query: tenants WHERE property_id IN [property_ids]
           │   │   └─→ Display: "12 Active Tenants"
           │   │
           │   └─→ Query: payments WHERE property_id IN [property_ids]
           │       └─→ Display: "KSH 450K Pending Rent"
           │
           └─→ fetchRecentPayments() 
               ├─→ Get managed property_ids from stats
               ├─→ Query: payments WHERE property_id IN [property_ids]
               └─→ Display: "5 Recent Payments"
```

### Tenant Dashboard Data Flow

```
┌──────────────────────┐
│ Tenant Logged In     │
│   (role=tenant)      │
└──────────┬───────────┘
           │
           ▼
    ✅ is_tenant()
    (RLS policy passes)
           │
           ▼
    STEP 1: fetchTenantInfo()
    ├─→ Query: tenants 
    │   WHERE user_id=current_user & status='active'
    │   JOIN units, properties
    │   └─→ Result: tenantInfo = {
    │       user_id, property_id, unit_id,
    │       properties: {name, address},
    │       units: {unit_number, floor, type}
    │   }
    │
    ▼
    STEP 2: All subsequent queries use tenantInfo
    │
    ├─→ fetchPayments()
    │   └─→ Query: payments 
    │       WHERE user_id=current_user 
    │       & property_id=tenantInfo.property_id
    │       └─→ Display: "KSH 50K Balance Due"
    │
    ├─→ fetchMaintenanceRequests()
    │   └─→ Query: maintenance_requests
    │       WHERE property_id=tenantInfo.property_id
    │       & user_id=current_user
    │       └─→ Display: "2 Active Maintenance Requests"
    │
    └─→ fetchUpcomingDueDates()
        └─→ Query: payments
            WHERE user_id=current_user
            & property_id=tenantInfo.property_id
            & status IN ['pending', 'overdue']
            └─→ Display: "3 Upcoming Due Dates"
```

---

## PART 3: Table Reference Mapping (CORRECTED)

### What Each Dashboard Queries

| Query Scope | SuperAdmin | Manager | Tenant |
|------------|-----------|---------|--------|
| **profiles** | All users | Own profile | Own profile |
| **properties** | All properties | Assigned only | Their property |
| **units** | All units | In assigned properties | Their unit |
| **tenants** | All tenants | In assigned properties | Self (if role=tenant) |
| **manager_assignments** | All assignments | Own assignments | N/A |
| **payments** | All payments | Assigned properties' tenants | Self only |
| **approval_queue** | All pending | Own requests only | N/A |
| **vacation_notices** | All notices | Assigned properties' tenants | Self only |
| **maintenance_requests** | All requests | Assigned properties | Self only |

---

## PART 4: Code Location Reference

### SuperAdmin Dashboard Changes

**File:** `src/pages/portal/SuperAdminDashboard.tsx`

| Change | Lines | Before | After |
|--------|-------|--------|-------|
| Approval queries | ~320-355 | Uses `approval_requests` | Uses `approval_queue` |
| Pending count | ~253 | `approval_requests` table | `approval_queue` table |
| Request mapping | ~330-345 | Basic title mapping | Extended with request_type labels |

**Current Implementation:**
```typescript
// Line 247: ✅ Unified approval queue
const { data: recentApprovals } = await supabase
  .from("approval_queue")           // ← Single table of truth
  .select("id, request_type, status, requested_by, metadata, created_at")
  .eq("status", "pending")
  .order("created_at", { ascending: false })
  .limit(5);
```

---

### Manager Portal Changes

**File:** `src/pages/portal/ManagerPortal.tsx`

| Change | Lines | Before | After |
|--------|-------|--------|-------|
| Payments fetch | ~60-78 | Stub returning empty | Actual implementation |
| Property scoping | ~65-71 | N/A | Uses `stats.properties` for filtering |
| Error handling | ~75-78 | Basic catch | Detailed error logging |

**Current Implementation:**
```typescript
// Lines 60-78: ✅ Properly scoped payment fetching
const fetchRecentPayments = async () => {
  try {
    if (!stats?.properties || stats.properties.length === 0) {
      setRecentPayments([]);
      return;
    }
    
    const propertyIds = stats.properties.map(p => p.id);
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .in("property_id", propertyIds)              // ← Scoped to assigned properties
      .order("created_at", { ascending: false })
      .limit(5);
    
    setRecentPayments(payments || []);
  } catch (err) {
    console.error("Error fetching payments:", err);
    setRecentPayments([]);
  }
};
```

---

### Tenant Dashboard Changes

**File:** `src/pages/portal/TenantDashboard.tsx`

| Change | Lines | Before | After |
|--------|-------|--------|-------|
| Tenant info function | NEW | N/A | Added fetchTenantInfo() |
| Dashboard init | ~183-230 | Skip setup | Call fetchTenantInfo() FIRST |
| Payments fetch | ~252-271 | `rent_payments` table | `payments` table + user_id |
| Maintenance scope | ~281-296 | Requires tenantInfo | Checks tenantInfo before query |
| Due dates scope | ~321-345 | `rent_payments` + tenant_id | `payments` + user_id + property_id |

**New fetchTenantInfo() Function:**
```typescript
// Lines 161-188: ✅ Critical new function
const fetchTenantInfo = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select(`
        id, user_id, property_id, unit_id, status,
        properties(id, name, address, city),
        units(id, unit_number, floor, type)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")                  // ← Only active tenants
      .single();                               // ← One tenant per user
    
    if (!error && data) {
      setTenantInfo(data);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
```

**Updated fetchDashboardData():**
```typescript
// Lines 190-235: ✅ Proper initialization order
const fetchDashboardData = async () => {
  // ... setup ...
  
  // CRITICAL: STEP 1 - Fetch tenant info
  const hasTenantInfo = await fetchTenantInfo();
  if (!hasTenantInfo) {
    setError("Tenant information not found.");
    return;
  }
  
  // STEP 2 - All other fetches depend on tenantInfo
  await fetchPayments();
  await fetchMaintenanceRequests();
  await fetchUpcomingDueDates();
  
  setupRealtimeSubscriptions();
};
```

---

## PART 5: Integration Test Cases

### Test Case 1: SuperAdmin Role Isolation ✅

**Objective:** Verify SuperAdmin sees ALL data

**Setup:**
```
User: super_admin@realtors.com (role=super_admin)
DB: 3 properties, 12 tenants, 25 payments, 5 pending approvals
```

**Expected Results:**
| Metric | Expected | Location |
|--------|----------|----------|
| Properties visible | 3 | SuperAdminDashboard stats |
| Tenants visible | 12 | SuperAdminDashboard stats |
| Payments visible | 25 | SuperAdminDashboard stats |
| Pending approvals | 5 | Recent items section |
| Can access all user profiles | ✅ Yes | User management |
| Can access all properties | ✅ Yes | Property management |

**Test Steps:**
1. Login as super_admin
2. Navigate to SuperAdminDashboard
3. Verify stats show ALL properties (3)
4. Verify recent items include ALL users
5. Verify pending approvals show all request types
6. Try accessing any property/user → should succeed

**Validation Query:**
```sql
-- Should return 5 pending items
SELECT COUNT(*) FROM approval_queue WHERE status='pending';

-- Should return 25 payments (all)
SELECT COUNT(*) FROM payments;
```

---

### Test Case 2: Manager Property Scoping ✅

**Objective:** Verify Manager sees ONLY assigned properties

**Setup:**
```
User: john@realtors.com (role=property_manager)
Assigned properties: ["prop-001", "prop-002"] (2 properties)
Other properties: ["prop-003"] (1 property - NOT assigned)

prop-001: 5 units, 5 tenants, 8 payments
prop-002: 3 units, 3 tenants, 5 payments
prop-003: 4 units, 4 tenants, 6 payments
```

**Expected Results:**
| Metric | Expected | Location |
|--------|----------|----------|
| Properties visible | 2 | ManagerPortal stats |
| Tenants visible | 8 | ManagerPortal stats |
| Payments visible | 13 | ManagerPortal recent payments |
| Can access prop-001 | ✅ Yes | Can navigate |
| Can access prop-002 | ✅ Yes | Can navigate |
| Can access prop-003 | ❌ RLS blocks | 403 error |
| Can see prop-003 payments | ❌ RLS blocks | Empty list |

**Test Steps:**
1. Login as manager (john@realtors.com)
2. Navigate to ManagerPortal
3. Verify stats show 2 properties only
4. Verify stats show 8 tenants only
5. Check recent payments → should show 13 only
6. Try accessing prop-003 → should get RLS error
7. Verify no data leakage from prop-003

**Validation Query:**
```sql
-- Should return 2 assignments
SELECT COUNT(*) FROM manager_assignments 
WHERE manager_id=<john_id> AND status='active';

-- Should return 13 payments (prop-001 + prop-002 only)
SELECT COUNT(*) FROM payments 
WHERE property_id IN (
  SELECT property_id FROM manager_assignments
  WHERE manager_id=<john_id> AND status='active'
);
```

---

### Test Case 3: Tenant User Isolation ✅

**Objective:** Verify Tenant sees ONLY their own data

**Setup:**
```
User: alice@tenant.com (role=tenant)
Assigned: property-A, unit-5
User Alice's data: 3 payments, 1 maintenance request
Other tenants' data: 15 payments, 8 maintenance requests
```

**Expected Results:**
| Metric | Expected | Location |
|--------|----------|----------|
| Tenant info loaded | ✅ Yes | tenantInfo state |
| Property visible | property-A only | Dashboard context |
| Unit visible | unit-5 only | Dashboard context |
| Payments visible | 3 | Recent payments section |
| Maintenance requests | 1 | Active requests |
| Can see other tenants | ❌ No | RLS blocks |
| Can see other payments | ❌ No | RLS blocks |
| Can see other maintenance | ❌ No | RLS blocks |

**Test Steps:**
1. Login as tenant (alice@tenant.com)
2. Navigate to TenantDashboard
3. Wait for fetchTenantInfo() to complete
4. Verify tenantInfo shows property-A + unit-5
5. Verify "Current Balance" shows alice's 3 payments only
6. Verify maintenance requests show 1 only (alice's)
7. Try direct API query for other tenant's payment → 403 RLS error
8. Verify zero data leakage

**Validation Query:**
```sql
-- Should return 1 tenant record
SELECT COUNT(*) FROM tenants 
WHERE user_id=<alice_id> AND status='active';

-- Should return 3 payments (alice's only)
SELECT COUNT(*) FROM payments 
WHERE user_id=<alice_id>;

-- Should return 1 maintenance request
SELECT COUNT(*) FROM maintenance_requests
WHERE user_id=<alice_id>;
```

---

### Test Case 4: Approval Queue Interconnection ✅

**Objective:** Verify approval workflow connects all roles

**Setup:**
```
Manager (john) requests to add tenant
1. John submits: Add Alice to prop-001, unit-5
2. System creates approval_queue entry (request_type=tenant_addition)
3. SuperAdmin sees pending approval
4. SuperAdmin approves
5. System creates tenant record
6. Alice can login and see property/unit
```

**Expected Results:**
| Stage | SuperAdmin View | Manager View | Tenant View |
|-------|-----------------|-------------|------------|
| **Step 1:** Manager submits | Pending approval visible | Shows "Pending" | N/A (not yet tenant) |
| **Step 2:** Queue entry created | Counts in stats | Shown in own requests | N/A |
| **Step 3:** SuperAdmin approves | Approval removed from pending | Request marked approved | N/A (not yet login) |
| **Step 4:** Tenant record created | Now appears in stats | Tenant visible in list | Can login |
| **Step 5:** Alice logins | Can see all alice activity | Can see alice in assigned tenants | Sees their unit/property |

**Test Steps:**
1. Login as manager (john)
2. Navigate to tenant assignment page
3. Submit: "Add Alice to prop-001, unit-5"
4. See: "Request submitted for approval"
5. Logout
6. Login as super_admin
7. See: "Tenant Addition request from John" in pending
8. Click Approve
9. See: Request removed from pending
10. Logout
11. Login as alice@tenant.com
12. Verify: Can see property-A, unit-5
13. Verify: Can see own payments
14. Verify: Cannot see other tenants

**Validation Queries:**
```sql
-- Stage 1: Should have 1 pending tenant_addition request
SELECT COUNT(*) FROM approval_queue 
WHERE request_type='tenant_addition' AND status='pending';

-- Stage 4: Should have 1 approved tenant_addition request
SELECT COUNT(*) FROM approval_queue 
WHERE request_type='tenant_addition' AND status='approved';

-- Stage 5: Alice should have 1 active tenant record
SELECT COUNT(*) FROM tenants 
WHERE user_id=<alice_id> AND status='active';
```

---

## PART 6: Deployment Verification

### Pre-Deployment Checklist

- [ ] `20260125_rls_hardening.sql` deployed to Supabase
- [ ] All RLS policies confirmed active
- [ ] Test users created: super_admin, manager-1, tenant-1
- [ ] Test data populated (properties, units, tenants, payments)
- [ ] All three dashboards code changes merged

### Deployment Steps

1. **Database Layer:**
   ```bash
   supabase migration up
   # Verify: All RLS policies active
   ```

2. **Frontend Build:**
   ```bash
   npm run build
   # Verify: No TypeScript errors
   ```

3. **Staging Deployment:**
   ```bash
   npm run deploy:staging
   ```

4. **Run Integration Tests:**
   - [ ] Test Case 1: SuperAdmin isolation
   - [ ] Test Case 2: Manager scoping
   - [ ] Test Case 3: Tenant isolation
   - [ ] Test Case 4: Approval workflow

5. **Production Deployment:**
   ```bash
   npm run deploy:production
   ```

6. **Post-Deployment Monitoring:**
   - [ ] Monitor logs for RLS errors
   - [ ] Check error rates in Sentry
   - [ ] Verify dashboard load times
   - [ ] Spot-check data for leakage

---

## PART 7: Troubleshooting Guide

### Symptom: Manager sees no properties

**Likely Cause:** `manager_assignments` records missing

**Fix:**
```sql
-- Insert test manager assignment
INSERT INTO manager_assignments (manager_id, property_id, status)
VALUES ('<manager_id>', '<property_id>', 'active');
```

**Verify:**
```typescript
// Check RPC response in browser console
const stats = await supabase.rpc('get_manager_dashboard_stats', {
  manager_id: '<manager_id>'
});
console.log(stats.data); // Should show properties array
```

---

### Symptom: Tenant cannot see payments

**Likely Cause:** 
- `tenantInfo` not loaded
- Payment filtering incomplete

**Fix:**
```typescript
// In browser console, check:
console.log('tenantInfo:', tenantInfo);           // Should exist
console.log('tenantInfo.property_id:', tenantInfo?.property_id); // Should have ID
console.log('tenantInfo.user_id:', tenantInfo?.user_id);       // Should equal user.id
```

**Verify:**
```sql
-- Check if payments exist for tenant
SELECT * FROM payments 
WHERE user_id = '<tenant_id>' 
AND property_id = '<property_id>';
```

---

### Symptom: RLS 403 errors in console

**Status:** This is EXPECTED! Means RLS is working.

**Difference Between Expected vs. Actual Errors:**

**Expected (✅ RLS Working):**
```
POST /rest/v1/rpc/get_manager_dashboard_stats 403
→ Cause: User doesn't have is_property_manager() permission
→ Fix: Ensure user has property_manager role
```

**Actual Error (❌ Code Bug):**
```
GET /rest/v1/properties 403
→ Cause: Query has wrong filter syntax
→ Fix: Check filter logic in component
```

---

## PART 8: FAQ

**Q: Why did we create fetchTenantInfo() for TenantDashboard?**

A: Tenants must be isolated to ONE property and ONE unit. By fetching this info first, all subsequent queries can be scoped correctly and safely.

**Q: Why use approval_queue instead of approval_requests?**

A: Single source of truth reduces bugs and confusion. All approval types (role, manager, tenant_add, tenant_remove) go through one table with proper request_type filtering.

**Q: What if manager tries to access property they don't manage?**

A: RLS policy `manager_can_view_properties` checks `manager_has_property()` which queries `manager_assignments`. If manager has no assignment, RLS returns 0 rows (not error).

**Q: Can SuperAdmin disable another SuperAdmin?**

A: No - there's a trigger that prevents `role` UPDATEs except for self-assignment to 'tenant'. Only SuperAdmin can assign super_admin role via approval_queue.

---

## PART 9: Success Criteria

All three dashboards are considered **INTEGRATED** when:

✅ **SuperAdmin Dashboard:**
- Shows all properties/users/payments
- Uses ONLY `approval_queue` table
- Shows filtered pending approvals
- No data leakage to other roles

✅ **Manager Portal:**
- Shows ONLY assigned properties
- Shows tenants ONLY in assigned properties
- Shows payments ONLY for assigned properties
- 403 errors when accessing other managers' data

✅ **Tenant Dashboard:**
- `fetchTenantInfo()` runs first
- Shows only own property/unit
- Shows only own payments
- Shows only own maintenance requests
- Locked to ONE active tenant record per user

✅ **Cross-Dashboard:**
- Approval workflow spans all roles
- No data consistency issues
- All RLS policies enforced
- Zero data leakage in logs

---

**Document Version:** 1.0  
**Implementation Status:** ✅ COMPLETE  
**Testing Status:** Ready for execution  
**Deployment Status:** Ready for staging
