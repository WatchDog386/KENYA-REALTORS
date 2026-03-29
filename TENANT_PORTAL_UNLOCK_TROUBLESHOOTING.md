# Tenant Portal Lock Issue - Troubleshooting Guide

## Problem
After completing payment in the hosted version, the tenant portal shows "Initial payment pending" and only the Dashboard and Payments pages are accessible. Locally, the portal fully unlocks and all pages become available.

## Root Cause Analysis

The portal remains locked when either:
1. **Outstanding onboarding invoices still exist** - Invoice status is still "unpaid" or "pending"
2. **Tenant assignment incomplete** - The tenant row doesn't have `property_id` and `unit_id` set
3. **Finalization RPC failed silently** - The `finalize_tenant_onboarding_invoice` RPC encountered an error

## Fixes Applied (March 29, 2026)

### 1. **Improved Logging for Diagnosis**
- Added comprehensive logging to `finalizeTenantAssignmentViaRpc()` function
- Logs RPC errors with full error code, message, hint, and details
- Logs success responses with unit/property/tenant IDs
- Helps identify exactly where finalization is failing

### 2. **Payment Handler Improvements**
- Added 1-second delay before navigation after payment to allow finalization to complete
- Added auto-retry loop that checks portal unlock status for up to 10 seconds after payment
- Auto-navigates to dashboard if portal unlocks within the retry window
- Better user message if portal remains locked

### 3. **Portal Layout Auto-Refresh**
- Added periodic access state refresh every 5 seconds while portal is locked
- Automatically detects when finalization completes in background
- Refreshes navigation permissions immediately when access state changes

## Debugging Steps

### For Hosted Environment Issues

1. **Check Browser Console (F12)**
   - Open Developer Tools → Console tab
   - Look for 🔄 prefix for RPC finalization logs
   - Look for ✅ or ❌ markers for success/failure
   - Capture any error messages with error codes

2. **Monitor RPC Response**
   - Check Network tab → XHR/Fetch
   - Find the `finalize_tenant_onboarding_invoice` RPC call
   - Verify response includes `success: true` and valid `unit_id`, `property_id`

3. **Verify Database State After Payment**
   ```sql
   -- Check if invoice status changed to 'paid'
   SELECT id, status, amount, notes FROM invoices 
   WHERE id = '<invoice-id-from-payment>';
   
   -- Check if tenant row got property_id and unit_id
   SELECT id, user_id, property_id, unit_id, status 
   FROM tenants 
   WHERE user_id = '<current-user-id>';
   
   -- Check if lease application is approved
   SELECT id, applicant_id, status FROM lease_applications 
   WHERE applicant_id = '<current-user-id>' 
   LIMIT 5;
   ```

### Common Issues and Solutions

#### Issue 1: "Missing unit metadata on invoice"
**Symptom:** RPC error in console about missing metadata
**Cause:** Super Admin invoice doesn't have UNIT_ID, PROPERTY_ID, APPLICANT_ID in notes
**Solution:** 
- Ensure invoice notes include: `UNIT_ID:xxx PROPERTY_ID:xxx APPLICANT_ID:xxx`
- See [PAYMENT_FLOW_FIX_GUIDE.sh](PAYMENT_FLOW_FIX_GUIDE.sh) for how to set metadata

#### Issue 2: RPC Function Not Found (PGRST202)
**Symptom:** "finalize_tenant_onboarding_invoice doesn't exist"
**Cause:** Database migration not applied
**Solution:**
- Run migration: `20260328_finalize_tenant_onboarding_invoice_rpc.sql`
- Or newer: `20260329_fix_onboarding_invoice_visibility_and_rpc_access.sql`

#### Issue 3: Access Denied (401/403)
**Symptom:** RPC call returns 401 or 403 error
**Cause:** Supabase RLS policies blocking tenant access
**Solution:**
- Run migration: `20260328_comprehensive_payment_flow_fixes.sql`
- Ensures tenants table has READ and UPDATE policies for authenticated users

#### Issue 4: Invoice Already Paid But Portal Still Locked
**Symptom:** Database shows invoice as "paid" but portal remains locked
**Cause:** Finalization may have failed, but invoice is still marked paid
**Solution:**
- Check tenant row in database - should have property_id and unit_id
- If missing, manually set them or re-run RPC
- Check lease_applications status - should be "approved"
- If not, try clicking "Refresh Data" button or reloading page

## Verification Checklist

After completing a test payment:

- [ ] Browser console shows ✅ "RPC finalization succeeded"
- [ ] Invoice status changed from "unpaid" to "paid"
- [ ] Tenant table row now has property_id and unit_id
- [ ] lease_applications status changed to "approved"
- [ ] Portal lock refreshes within 5 seconds
- [ ] Dashboard navigation works
- [ ] All tenant pages (Payments, Maintenance, Messages, etc.) are accessible
- [ ] "Initial payment pending" warning is gone

## Testing Payment Flow Locally vs Hosted

### Local Testing
1. Open http://localhost:8082 with existing .env variables
2. Complete test payment
3. Check browser console for logs
4. Verify portal unlocks immediately

### Hosted Testing
1. Ensure all environment variables set in deployment platform
2. Complete test payment
3. Check browser console (may need to open before payment)
4. Wait up to 10 seconds for auto-refresh
5. Manual page refresh if needed
6. Report console logs if still locked after >30 seconds

## Files Modified (March 29, 2026)

| File | Changes |
|------|---------|
| `src/services/tenantOnboardingService.ts` | Enhanced RPC logging, comprehensive error details |
| `src/pages/portal/tenant/MakePayment.tsx` | Added 1s delay, 10s auto-retry loop, better messages |
| `src/components/layout/TenantPortalLayout.tsx` | Added 5s periodic refresh while locked |

## Related Documentation

- [PAYMENT_FLOW_FIX_GUIDE.sh](PAYMENT_FLOW_FIX_GUIDE.sh)
- [PAYMENT_FLOW_FIX_SUMMARY.md](PAYMENT_FLOW_FIX_SUMMARY.md)
- [PAYSTACK_DEPLOYMENT_FIX.md](PAYSTACK_DEPLOYMENT_FIX.md)
