# Dashboard Integration Analysis & Fixes

**Date:** January 25, 2026  
**Status:** Critical review for functional connectivity  
**Scope:** SuperAdminDashboard, ManagerPortal, TenantDashboard

---

## Executive Summary

The three dashboards exist but **lack proper functional integration** with:
1. The new RLS policies from `20260125_rls_hardening.sql`
2. The hardened approval workflow (approval_queue → approval_requests)
3. Proper role-based data scoping
4. Business requirement enforcement

**Result:** Dashboards fetch data without proper filtering, violating role isolation requirements.

---

## CRITICAL ISSUES IDENTIFIED

### 1. SuperAdmin Dashboard - Incomplete Query Coverage

**Current State:**
- Queries tables directly WITHOUT verification of super_admin role
- Uses `approval_requests` table (old schema) instead of `approval_queue` (new)
- Doesn't validate request types for approval tracking

**Lines of Concern:**
- Line 247: `approval_queue` queried but status checks only "pending"
- Line 253: Uses `approval_requests` instead of `approval_queue`
- Missing: Role validation before data return

**Risk:** 
- RLS policies will filter this data anyway (GOOD), but frontend assumes full visibility
- Approval workflow fragmented between two tables

**Fix Required:**
- ✅ Update to use ONLY `approval_queue` table
- ✅ Filter by request_type (role_assignment, manager_assignment, tenant_addition, etc.)
- ✅ Add explicit check for super_admin role before rendering sensitive sections

---

### 2. Manager Portal - NO PROPERTY SCOPING

**Current State:**
```typescript
// ManagerPortal.tsx - Line ~50
const fetchRecentPayments = async () => {
  try {
    // rent_payments table doesn't exist or has different structure
    // Skip for now
    setRecentPayments([]);
```

**Issues:**
- Uses `useManager()` hook which calls RPC `get_manager_dashboard_stats()` (good!)
- BUT: Direct queries in ManagerPortal LACK property filtering
- Comments indicate "tables don't exist" - this is WRONG, they do exist in hardened schema
- No RLS policy enforcement at component level

**Lines of Concern:**
- Line 60-65: `fetchRecentPayments()` stub - skips payments entirely
- Line 67-72: `fetchUnreadMessages()` stub - skips messages
- Line 146-160: Properties shown but NO verification manager owns them

**Risk:**
- Manager could see other managers' properties if RLS not applied
- Payments data not loaded at all (feature broken)
- No interconnection with approval workflows

**Fix Required:**
- ✅ Implement actual payment fetching filtered by manager_has_property()
- ✅ Add RLS policy layer to queries
- ✅ Connect to approval_queue for manager-initiated requests
- ✅ Show only manager's assigned properties

---

### 3. Tenant Dashboard - NO USER ISOLATION

**Current State:**
```typescript
// TenantDashboard.tsx - Line ~215
const fetchPayments = async () => {
  try {
    const { data: payments, error: paymentsError } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("tenant_id", user.id)  // ← Filtering by tenant_id
```

**Issues:**
- GOOD: Filters by `user.id`
- BAD: Uses `rent_payments` table (doesn't exist in schema)
- BAD: No reference to `tenants` table linking user to unit/property
- BAD: Missing lease/property/unit context from `tenants` + `units` tables

**Lines of Concern:**
- Line 215: Queries non-existent `rent_payments` table
- Line 231: Queries non-existent `tenant_properties` table
- Line 259: Uses non-existent `maintenance_requests` table with tenant_id
- Missing: Connection to `tenants` → `units` → `properties` hierarchy

**Risk:**
- Tenant can't see their actual property/unit information
- Financial data inaccessible
- Violates "Tenant sees only their own dashboard" requirement

**Fix Required:**
- ✅ Query actual schema: `tenants` (user_id, unit_id, property_id)
- ✅ Join to `units` and `properties` for context
- ✅ Scope payments/maintenance to user's property via RLS
- ✅ Show proper vacation_notice + refund status

---

## DASHBOARD FUNCTIONAL ARCHITECTURE

### Current State (BROKEN)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ SuperAdmin      │     │  Manager Portal  │     │ Tenant      │
│ Dashboard       │     │                  │     │ Dashboard   │
└────────┬────────┘     └────────┬─────────┘     └──────┬──────┘
         │                       │                       │
    ❌ UNSCOPED              ❌ PARTIAL                ❌ WRONG
    queries to all        filtering                tables
    tables                 (incomplete)            
         │                       │                       │
         └───────────┬───────────┴─────────────────────┘
                     │
              ❌ NO RLS VERIFICATION
              ❌ OLD APPROVAL TABLES
              ❌ MISSING INTERCONNECTIONS
                     │
                Supabase
                Database
```

### Required State (FIXED)

```
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ SuperAdmin Dashboard │  │ Manager Portal   │  │ Tenant Dashboard │
│ (Full System View)   │  │ (Assigned Only)  │  │ (User Isolated)  │
└──────────┬───────────┘  └────────┬─────────┘  └────────┬─────────┘
           │                       │                     │
     ✅ is_super_admin()     ✅ manager_has_property()   ✅ tenant_has_unit()
     ✅ All tables           ✅ Assigned properties       ✅ Own property only
     ✅ All request types    ✅ Property-scoped payments  ✅ Own unit/payments
           │                       │                     │
           └───────────────────────┼─────────────────────┘
                                   │
                    ✅ RLS POLICIES ENFORCE ALL
                    ✅ approval_queue (SINGLE TABLE)
                    ✅ INTERCONNECTED DATA FLOWS
                                   │
                            Supabase Auth +
                           RLS-Protected DB
```

---

## INTERCONNECTION REQUIREMENTS

### 1. SuperAdmin → Approval Workflow

**Should Connect:**
- SuperAdmin sees `approval_queue` entries from ALL users
- Filters by `request_type`: role_assignment, manager_assignment, tenant_addition, tenant_removal
- Can approve/reject each (triggers `useApprovalSystem.processApprovedRequest()`)
- Creates full audit trail

**Current Gaps:**
- Queries `approval_requests` (old table) AND `approval_queue` (new table)
- No filtering by role/request_type
- No interconnection to approval processor

**Fix:**
```typescript
// SuperAdminDashboard.tsx - loadRecentItems() → approval section
const { data: recentApprovals } = await supabase
  .from("approval_queue")  // ← Single table of truth
  .select(`
    id, 
    request_type,  // ← Filter by this
    status,
    requested_by,
    created_at,
    metadata
  `)
  .eq("status", "pending")
  .order("created_at", { ascending: false })
  .limit(5);
```

---

### 2. SuperAdmin → Manager → Property → Tenant Hierarchy

**Should Connect:**
- SuperAdmin queries all properties
- Manager queries via `manager_has_property()`
- Tenant queries via `tenant_has_unit()`
- Each filters downstream data accordingly

**Current Gaps:**
- SuperAdmin has full access ✅ (queries all properties)
- Manager uses RPC `get_manager_dashboard_stats()` ✅ (but needs verification)
- Tenant doesn't connect to property/unit ❌ (missing tenants table join)

**Fix:**
```typescript
// TenantDashboard.tsx - fetchDashboardData()
const fetchTenantInfo = async () => {
  const { data: tenantRecord, error } = await supabase
    .from("tenants")
    .select(`
      id,
      user_id,
      property_id,
      unit_id,
      status,
      properties(id, name, address),
      units(id, unit_number, floor, type)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")  // ← Only active tenant
    .single();  // ← Each user has ONE active tenant
    
  if (tenantRecord) {
    setTenantInfo(tenantRecord);
    // Now can scope all OTHER queries to this property_id
  }
};
```

---

### 3. Manager-Tenant Relationship

**Should Connect:**
- Manager assigned to property via `manager_assignments`
- Tenants exist in units within that property
- Manager sees only their tenants

**Current Gaps:**
- ManagerPortal doesn't show tenants
- No query of `manager_assignments` table
- No filtering of tenant list

**Fix:**
```typescript
// ManagerPortal.tsx - new function
const fetchAssignedTenants = async () => {
  const { data, error } = await supabase
    .from("tenants")
    .select(`
      id,
      user_id,
      unit_id,
      property_id,
      status,
      units(property_id),
      profiles:user_id(first_name, last_name, email)
    `)
    .eq("units.property_id", managedPropertyIds)  // ← Only assigned properties
    .order("created_at", { ascending: false });
};
```

---

### 4. Financial Data Interconnection

**Should Connect:**
- SuperAdmin: All payments from all tenants
- Manager: Payments from tenants in assigned properties only
- Tenant: Their own payments only

**Current Gaps:**
- SuperAdmin queries all payments ✅
- Manager: `fetchRecentPayments()` returns empty
- Tenant: Queries non-existent `rent_payments` table

**Fix:**
```typescript
// ManagerPortal.tsx - UPDATE fetchRecentPayments()
const fetchRecentPayments = async () => {
  try {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("user_id")
      .in("property_id", stats?.properties?.map(p => p.id) || []);
    
    const tenantIds = tenants?.map(t => t.user_id) || [];
    
    const { data: payments } = await supabase
      .from("payments")  // ← Correct table
      .select("*")
      .in("user_id", tenantIds)  // ← Only assigned tenants
      .order("created_at", { ascending: false })
      .limit(5);
      
    setRecentPayments(payments || []);
  } catch (err) {
    console.error("Error fetching payments:", err);
  }
};
```

---

### 5. Approval Workflow Integration

**Should Connect:**
- All role changes → approval_queue
- All manager assignments → approval_queue
- All tenant additions → approval_queue
- SuperAdmin approves → triggers state change
- Manager/Tenant see "Pending" status until approved

**Current Gaps:**
- SuperAdmin doesn't show approval counts/details
- Manager doesn't see pending requests for their assignments
- Tenant doesn't see pending role/unit assignment status

**Fix:**
```typescript
// All dashboards: Add approval status section
const fetchPendingApprovals = async () => {
  const { data } = await supabase
    .from("approval_queue")
    .select("*")
    .eq("status", "pending")
    .eq("requested_by", userRole === "manager" ? user.id : null)
    // ↑ Only show own pending requests if manager/tenant
};
```

---

## REQUIRED CODE CHANGES (PRIORITIZED)

### Priority 1: CRITICAL - Fix Data Scoping

#### A. SuperAdminDashboard.tsx - Fix Approval Table Reference
**File:** `src/pages/portal/SuperAdminDashboard.tsx`  
**Lines:** 320-328  
**Change:** Replace `approval_requests` queries with `approval_queue`

#### B. TenantDashboard.tsx - Fix Table References
**File:** `src/pages/portal/TenantDashboard.tsx`  
**Lines:** 215, 231, 259  
**Changes:**
- `rent_payments` → `payments` (filtered by user_id)
- `tenant_properties` → `tenants` (join to units → properties)
- `maintenance_requests` → Scope to user's property

#### C. ManagerPortal.tsx - Fix Stub Functions
**File:** `src/pages/portal/ManagerPortal.tsx`  
**Lines:** 60-72  
**Changes:**
- Implement actual payment fetching (scoped to assigned properties)
- Connect to message system (if exists)
- Filter all data by managed properties

---

### Priority 2: HIGH - Add Interconnections

#### A. Add Tenant Property Context
**File:** `src/pages/portal/TenantDashboard.tsx`  
**New Function:** `fetchTenantInfo()`  
**Purpose:** Load tenant's property/unit info on mount; use for all subsequent queries

#### B. Add Manager Assignment Verification
**File:** `src/pages/portal/ManagerPortal.tsx`  
**New Function:** `verifyManagerProperties()`  
**Purpose:** Fetch `manager_assignments` to scope all dashboard data

#### C. Add SuperAdmin Role Verification
**File:** `src/pages/portal/SuperAdminDashboard.tsx`  
**New Check:** Verify `is_super_admin()` before rendering sensitive sections

---

### Priority 3: MEDIUM - Enhance Approval Integration

#### A. Show Approval Counts
**Files:** All three dashboards  
**Addition:** Add pending approval metrics to stats cards

#### B. Show Approval Requests
**Files:** All three dashboards  
**Addition:** New section showing relevant approval queue entries

#### C. Create Approval Action Buttons
**File:** `src/pages/portal/SuperAdminDashboard.tsx`  
**Addition:** Approve/Reject buttons that call `useApprovalSystem` hooks

---

## SCHEMA VALIDATION

**Verify These Tables Exist:**
- ✅ `profiles` (id, role, email, first_name, last_name)
- ✅ `properties` (id, name, address, total_units)
- ✅ `units` (id, property_id, unit_number, type, floor)
- ✅ `tenants` (id, user_id, property_id, unit_id, status)
- ✅ `manager_assignments` (id, manager_id, property_id, status)
- ✅ `payments` (id, user_id, property_id, amount, status)
- ✅ `approval_queue` (id, requested_by, request_type, status, metadata)
- ✅ `maintenance_requests` (id, property_id, unit_id, tenant_id, status)
- ✅ `vacation_notices` (id, tenant_id, property_id, unit_id, status)

**Remove References To:**
- ❌ `rent_payments` (doesn't exist - use `payments`)
- ❌ `approval_requests` (duplicate - use `approval_queue`)
- ❌ `tenant_properties` (doesn't exist - use `tenants` + join)
- ❌ `property_managers` (doesn't exist - use `manager_assignments`)

---

## TESTING CHECKLIST

After implementing fixes, verify:

### SuperAdmin Dashboard
- [ ] Queries all properties without filter
- [ ] Shows all pending approvals from approval_queue
- [ ] Filters by request_type (role_assignment, manager_assignment, etc.)
- [ ] Can approve/reject each request
- [ ] Shows all managers, tenants, payments
- [ ] Approval counts match actual pending items

### Manager Portal
- [ ] Shows ONLY assigned properties
- [ ] Payments filtered to assigned properties' tenants only
- [ ] Tenant list filtered to assigned properties only
- [ ] No access to other managers' data
- [ ] Pending approval requests shown for own assignments

### Tenant Dashboard
- [ ] Shows only their own unit and property
- [ ] Payments filtered to their account only
- [ ] Cannot see other tenants or properties
- [ ] Vacation notice status visible
- [ ] Refund status tracked through completion
- [ ] Auto-logout after refund completion works

### Cross-Dashboard
- [ ] Data consistency between dashboards
- [ ] Role-based access enforced at component AND database level
- [ ] No data leakage between roles
- [ ] All approval workflows complete end-to-end

---

## IMPLEMENTATION ROADMAP

```
Week 1:
  Day 1: Fix SuperAdmin & Tenant dashboard table references (Priority 1)
  Day 2: Fix Manager Portal stubs + add property scoping (Priority 1)
  Day 3: Add tenant property context + manager verification (Priority 2)
  Day 4: Test data isolation between roles

Week 2:
  Day 1: Add approval count metrics (Priority 3)
  Day 2: Add approval request sections (Priority 3)
  Day 3: Implement approve/reject UI (Priority 3)
  Day 4: Full integration testing

Week 3:
  Day 1-2: Load testing & RLS validation
  Day 3-4: Deployment to staging → production
```

---

## NEXT STEPS

1. **Immediate (Today):**
   - Review this document with team
   - Verify schema table names against actual migrations
   - Confirm RLS policies from `20260125_rls_hardening.sql` are deployed

2. **Today (Implementation):**
   - Start with Priority 1 fixes (critical table references)
   - Test each dashboard independently

3. **Tomorrow:**
   - Priority 2: Add interconnections
   - Test data scoping between roles

4. **This Week:**
   - Priority 3: Enhanced approval workflows
   - Full integration testing
   - Deploy to staging

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Author:** Senior Full-Stack Architect  
**Status:** Ready for Implementation
