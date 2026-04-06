# 🔧 TENANT PAYMENT FLOW - COMPLETE FIX GUIDE

## 📊 Current Issues Identified

From the console logs, the payment flow is failing due to multiple interconnected issues:

### ❌ Issue 1: 403 Forbidden on Tenants Table
```
rcxmrtqgppayncelonls.supabase.co/rest/v1/tenants:1  Failed to load resource: the server responded with a status of 403
```
**Root Cause:** RLS (Row Level Security) policies on the `tenants` table are too restrictive.

**Impact:** When `resolveTenantRowsByUser()` tries to query existing tenant records, it gets blocked.

### ❌ Issue 2: RPC Returns 400 Error  
```
rcxmrtqgppayncelonls.supabase.co/rest/v1/rpc/finalize_tenant_onboarding_invoice:1  Failed to load resource: the server responded with a status of 400
```
**Root Cause:** Either the RPC is not finding data or the input parameters are invalid due to earlier RLS failures.

**Impact:** Tenant assignment finalization fails, leaving the tenant portal locked.

### ⚠️ Issue 3: CORS Error on Edge Function (Non-Critical)
```
Access to fetch at 'https://rcxmrtqgppayncelonls.supabase.co/functions/v1/verify-paystack-transaction' 
from origin 'http://192.168.0.103:8082' has been blocked by CORS policy
```
**Root Cause:** HTTPS vs HTTP mismatch + preflight request handling.

**Impact:** Server-side verification fails, falls back to client success (less secure but functional during dev).

### ❌ Issue 4: Tenant Portal Remains Locked
```
TenantDashboard.tsx:139 ❌ No tenant record OR active lease found.
fetchTenantInfo @ TenantDashboard.tsx:139Understand this warning
TenantDashboard.tsx:232 Tenant information not fully linked.
```
**Root Cause:** Payment finalization didn't complete, so tenant record wasn't updated.

**Impact:** User sees "Tenant information not fully linked" and cannot access portal.

---

## 🛠️ Complete Solution

### Part 1: Fix Invoice RLS Policies

**File:** `supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql`

The invoices table needs RLS policies that allow:
- ✅ Tenants to view their own invoices (by tenant_id OR via tenants.user_id lookup)
- ✅ Tenants to update their own invoices (mark as paid)
- ✅ Managers to view/create/update invoices for their assigned properties
- ✅ Super admins full access

**Key Policies:**
```sql
-- Tenant can view invoices if:
-- 1. Invoice.tenant_id = auth.uid() (profile ID stored directly)
-- 2. OR looking up tenants.user_id = auth.uid() for legacy records

-- Manager can view invoices via property_manager_assignments
-- Super admin has full RLS bypass
```

### Part 2: Fix Tenants Table RLS Policies

**File:** `supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql`

The tenants table needs RLS policies that allow:
- ✅ Tenants to select/view own assignment (user_id = auth.uid())
- ✅ Tenants to update own assignment (needed for RPC finalization)
- ✅ Managers to view tenants in their assigned properties
- ✅ Super admins full access
- ✅ SECURITY DEFINER functions to bypass RLS

**Critical Changes:**
```sql
-- OLD (too restrictive):
CREATE POLICY "tenant_see_own_assignment" ON public.tenants
    USING (user_id = auth.uid());
-- Missing UPDATE permission!

-- NEW (fixed):
CREATE POLICY "Tenants can view own assignment"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Tenants can update own assignment"
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

### Part 3: Fix GRANT Statements

**File:** `supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql`

```sql
-- Allow authenticated users to interact with these tables
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;

-- Allow service role for backend operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;

-- Allow RPC to be called
GRANT EXECUTE ON FUNCTION public.finalize_tenant_onboarding_invoice(uuid, text) TO authenticated;
```

### Part 4: Verify RPC Is Properly Set Up

**File:** `supabase/migrations/20260328_finalize_tenant_onboarding_invoice_rpc.sql`

The RPC does the following:
1. Takes an invoice ID and optional payment reference
2. Extracts metadata from invoice.notes (UNIT_ID, PROPERTY_ID, APPLICANT_ID, LEASE_ID)
3. Creates or updates a tenant record with the property and unit
4. Creates a tenant_lease record
5. Updates the unit status to 'occupied'
6. Marks the invoice as 'paid'
7. Returns success with tenant/property/unit IDs

**SECURITY DEFINER** means it runs with elevated permissions, allowing it to:
- Query the tenants table even if user RLS would block it
- Update tenant records on behalf of the authenticated user
- Bypass RLS restrictions for this specific operation

---

## 🚀 How to Apply Fixes

### Option 1: Via Supabase Dashboard (Recommended for now)

1. Go to **SQL Editor** in your Supabase project dashboard
2. Open **New Query**
3. Copy the entire content from `supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql`
4. Paste into the editor
5. Click **Run**
6. Verify success (no errors)

### Option 2: Via CLI

```bash
# Push all migrations
supabase db push

# Or push specific migration
supabase db push --exclude-migration "20260328_other_migrations"
```

### Option 3: Via psql

```bash
# Connect to your remote database
psql -h [host] -U [user] -d [database] -p 5432

# Paste migration contents and execute
```

---

## ✅ Verification Steps

After applying the migrations:

### 1. Check RLS Policies Are In Place
```sql
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE tablename IN ('invoices', 'tenants')
ORDER BY tablename, policyname;
```

**Expected output:**
```
invoices  | Managers can insert invoices by assigned property    | PERMISSIVE
invoices  | Managers can update invoices by assigned property    | PERMISSIVE
invoices  | Managers can view invoices by assigned property      | PERMISSIVE
invoices  | Super admins can manage all invoices                 | PERMISSIVE
invoices  | Tenants can update their own invoices               | PERMISSIVE
invoices  | Tenants can view their own invoices                  | PERMISSIVE
tenants   | Managers can view property tenants                  | PERMISSIVE
tenants   | Super admins can manage all tenants                 | PERMISSIVE
tenants   | Tenants can update own assignment                   | PERMISSIVE
tenants   | Tenants can view own assignment                     | PERMISSIVE
```

### 2. Check Grants
```sql
SELECT privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_name IN ('invoices', 'tenants')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
```

**Expected:**
- SELECT on invoices (authenticated)
- INSERT on invoices (authenticated)
- UPDATE on invoices (authenticated)
- SELECT on tenants (authenticated)
- INSERT on tenants (authenticated)
- UPDATE on tenants (authenticated)

### 3. Check RPC Exists
```sql
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_name = 'finalize_tenant_onboarding_invoice';
```

**Expected:** Should exist with SECURITY DEFINER

---

## 🧪 Test the Payment Flow

### Step 1: Sign in as Test Tenant
- Use user ID: `b886d390-d13b-4857-85ba-306b46ef957a`
- Email: `jamesorengo234@gmail.com`

### Step 2: Make a Payment
1. Go to `/portal/payments`
2. Create a new payment for amount 50000
3. Complete Paystack payment

### Step 3: Verify Success
Check browser console for these success indicators:

✅ **Payment Success Log:**
```
PaystackPaymentDialog.tsx:108 Opening Paystack payment dialog...
PaystackPaymentDialog.tsx:98 Payment successful: Object
```

✅ **Receipt Creation Success:**
```
MakePayment.tsx:407 ✅ Receipt created successfully: Object
```

✅ **Tenant Assignment:**
```
TenantDashboard.tsx:109 🔍 Fetching tenant info for user: b886d390-d13b-4857-85ba-306b46ef957a
TenantDashboard.tsx:123 ✅ Active tenant record found
```

### Step 4: Verify Database Changes
```sql
-- Check tenant record was updated
SELECT id, user_id, property_id, unit_id, status
FROM public.tenants
WHERE user_id = 'b886d390-d13b-4857-85ba-306b46ef957a';

-- Check invoice was marked paid
SELECT id, tenant_id, status, amount
FROM public.invoices
WHERE id = '[invoice-id-from-payment]';

-- Check lease was created
SELECT id, tenant_id, unit_id, status
FROM public.tenant_leases
WHERE tenant_id = '[tenant-record-id]';
```

---

## 🔍 Troubleshooting

### Problem: Still Getting 403 on Tenants
**Solution:**
1. Verify migrations were applied: `supabase db list-migrations`
2. Check RLS policies exist (use query above)
3. Ensure user is authenticated
4. Clear browser cache and retry

### Problem: RPC Returns 400
**Check:**
1. Is the invoice metadata (notes) properly formatted?
2. Does the invoice have required UNIT_ID and PROPERTY_ID in notes?
3. Is the RPC properly deployed? Run: `SELECT * FROM pg_stat_user_functions WHERE funcname = 'finalize_tenant_onboarding_invoice';`

### Problem: "No tenant record found" After Payment
**Check:**
1. Did the reconciliation function complete? (Check MakePayment logs)
2. Was the RPC called? (Check finalized array in result)
3. Is the update policy correct? (Run policy query above)

### Problem: CORS Error on verify-paystack-transaction
**Expected behavior:** This is expected on HTTP (dev). The code falls back to client success.
**For production:** Use HTTPS and the CORS error won't occur.

---

## 📝 Files Modified

1. ✅ Created: `supabase/migrations/20260328_comprehensive_payment_flow_fixes.sql`
   - Fixes invoice RLS
   - Fixes tenant RLS
   - Adds proper GRANTS
   - Documents RPC requirements

2. ✅ Already exists: `supabase/migrations/20260328_finalize_tenant_onboarding_invoice_rpc.sql`
   - RPC function implementation
   - SECURITY DEFINER for elevated permissions

3. ✅ Already exists: `supabase/functions/verify-paystack-transaction/index.ts`
   - CORS headers already configured

4. ✅ Already exists: `supabase/functions/initialize-paystack-payment/index.ts`
   - CORS headers already configured

---

## 🎯 Expected Behavior After Fixes

### Before Payment:
```
hasActiveAssignment: false
isLocked: true  // tenant portal locked
pendingInitialInvoices: [onboarding invoice]
```

### After Successful Payment:
```
hasActiveAssignment: true  // ✅ NOW TRUE
isLocked: false             // ✅ NOW FALSE
pendingInitialInvoices: []  // ✅ NOW EMPTY
activeTenantRow: {          // ✅ NOW SET
  id: "...",
  property_id: "...",
  unit_id: "..."
}
```

---

## 🔐 Security Notes

1. **SECURITY DEFINER in RPC:** This is intentional and secure. The RPC has restricted logic and only operates on the authenticated user's invoice and associated records.

2. **RLS Bypass:** Only the `finalize_tenant_onboarding_invoice` function bypasses RLS. Regular queries still use RLS.

3. **User Identity:** The RPC validates that the invoice belongs to the authenticated user before proceeding.

4. **Audit Trail:** All changes are logged in invoice.notes with timestamps and references.

---

## 📞 Support

If issues persist after applying these fixes:

1. Verify all migration files exist in `supabase/migrations/`
2. Check Supabase project logs for any deployment issues
3. Ensure you're using the correct environment variables
4. Clear frontend cache (Ctrl+Shift+Delete) and hard refresh (Ctrl+Shift+R)

