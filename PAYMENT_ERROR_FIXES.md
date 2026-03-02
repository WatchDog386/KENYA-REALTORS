# Payment Error Fixes - Summary

## Date: 2026-02-28

### Issues Identified

#### 1. **Row-Level Security (RLS) Policy Missing for bills_and_utilities**
**Error**: `403 (Forbidden)` - "new row violates row-level security policy for table 'bills_and_utilities'"

**Root Cause**: 
- The `bills_and_utilities` table had RLS enabled but NO policies defined
- The GRANT statement only allowed SELECT, not INSERT/UPDATE
- When tenants tried to save payment records, all inserts were blocked

**Solution**: Created migration file **`20260228_fix_bills_and_utilities_rls.sql`**
- Added RLS policies for bills_and_utilities:
  - `super_admin_bills_all` - Super admins can see/manage all bills
  - `manager_see_property_bills` - Property managers can see bills for their properties
  - `tenant_see_own_bills` - Tenants can see/update their own unit's bills
  - `authenticated_insert_bills` - Authenticated users can create new bill records
- Updated GRANT permissions to include INSERT and UPDATE for authenticated users

---

#### 2. **Paystack Secret Key Security Issue**
**Error**: `401 (Unauthorized)` - "Invalid key" from Paystack API

**Root Cause**:
- The client-side code was using `VITE_PAYSTACK_SECRET_KEY` in environment variables
- Secret keys exposed to client bundles (VITE_ prefix) are security risks
- Browser CORS policies blocked direct Paystack API calls with the secret key
- The secret key access from client-side requests was being rejected

**Solution**: Implemented secure backend verification using Supabase Edge Functions

**Files Created**:
1. **`supabase/functions/initialize-paystack-payment/index.ts`**
   - Securely handles payment initialization
   - Receives payment details from client
   - Uses server-side PAYSTACK_SECRET_KEY to call Paystack API
   - Secret key never exposed to client

2. **`supabase/functions/verify-paystack-transaction/index.ts`**
   - Securely verifies completed payments
   - Client sends transaction reference only
   - Backend uses PAYSTACK_SECRET_KEY to verify with Paystack
   - Returns verification status to client

**Files Modified**:
- **`src/services/paystackService.ts`**
  - Updated `initializePaystackPayment()` to call backend Edge Function
  - Updated `verifyPaystackTransaction()` to call backend Edge Function
  - Removed client-side secret key usage
  - Deprecated unsafe functions that required secret key (`getPaystackBanks`, `createPaymentPlan`, `chargeAuthorization`)
  - These functions now throw errors directing to use backend endpoints

---

### Environment Variables Required

#### New/Updated Configuration Needed:

In your Supabase Edge Functions environment or `.env`:

```bash
# This environment variable is used by Supabase Edge Functions
PAYSTACK_SECRET_KEY=your_actual_paystack_secret_key_here
```

**Important**: Do NOT use `VITE_` prefix for the secret key. Supabase Edge Functions access environment variables directly without exposing them.

---

### Payment Flow (After Fixes)

#### Before (Broken):
```
Client → Paystack Payment Dialog → Client calls Paystack API with secret key 
  ↓ (Fails with 401 because client can't use secret key)
Client → Attempts to save bill record → RLS policy blocks insert (no policies defined)
  ↓ (Error: 403 Forbidden)
```

#### After (Fixed):
```
Client → Paystack Payment Dialog
  ↓
Client → Backend Function (initialize-paystack-payment)
  ↓ (Backend uses secure secret key)
Paystack API → Returns authorization URL to client
  ↓
Client → User completes payment on Paystack
  ↓
Client → Backend Function (verify-paystack-transaction) with reference only
  ↓ (Backend uses secure secret key for verification)
Paystack API → Confirms transaction
  ↓
Client → Saves bill record with RLS policy allowing insert
  ✅ (Success)
```

---

### Testing Checklist

After deploying these fixes:

1. **Test Payment Initialization**:
   - [ ] Ensure `initialize-paystack-payment` Edge Function is deployed
   - [ ] Verify `PAYSTACK_SECRET_KEY` is set in Supabase Edge Functions environment
   - [ ] Test payment dialog opens and shows Paystack checkout

2. **Test Payment Verification**:
   - [ ] Ensure `verify-paystack-transaction` Edge Function is deployed
   - [ ] Complete a test payment through Paystack
   - [ ] Verify transaction is confirmed without 401 errors

3. **Test Bill Record Creation**:
   - [ ] Verify bills_and_utilities RLS policies are applied
   - [ ] Confirm tenant can create new bill records
   - [ ] Check bill records appear in tenant payment history

4. **Test as Different Roles**:
   - [ ] Tenant: Should only see own unit's bills
   - [ ] Property Manager: Should see all bills for managed properties
   - [ ] Super Admin: Should see all bills

---

### Deployment Steps

1. **Run the SQL migration**:
   ```sql
   -- Apply the migration in Supabase SQL Editor
   -- File: supabase/migrations/20260228_fix_bills_and_utilities_rls.sql
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy initialize-paystack-payment
   supabase functions deploy verify-paystack-transaction
   ```

3. **Set Environment Variables**:
   - In Supabase Project Settings → Edge Functions → Secrets
   - Add: `PAYSTACK_SECRET_KEY=your_key_here`

4. **Verify Changes**:
   - Check that database migrations are applied
   - Test payment flow end-to-end

---

### Security Improvements

✅ **Secret keys no longer exposed in client bundle**
✅ **Backend validates all payment operations**
✅ **RLS policies enforce data access restrictions by role**
✅ **CORS issues resolved by using backend validation**
✅ **Transaction verification is cryptographically secure**

---

### Files Changed Summary

| File | Type | Change |
|------|------|--------|
| `supabase/migrations/20260228_fix_bills_and_utilities_rls.sql` | NEW | RLS policy fixes |
| `supabase/functions/initialize-paystack-payment/index.ts` | NEW | Backend payment init |
| `supabase/functions/verify-paystack-transaction/index.ts` | NEW | Backend payment verify |
| `src/services/paystackService.ts` | MODIFIED | Use backend functions |

---

### Remaining Work (Optional)

These functions also need backend implementations but are not critical for current payment flow:
- `getPaystackBanks()` - For bank transfer support
- `createPaymentPlan()` - For subscription payments
- `chargeAuthorization()` - For saved card charging

These can be implemented when needed using the same Edge Function pattern.

