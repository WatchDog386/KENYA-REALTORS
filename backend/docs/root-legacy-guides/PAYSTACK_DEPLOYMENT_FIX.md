# Paystack Configuration Fix - Deployment Guide

## Problem
The payment system shows "Paystack public key is not configured" in hosted environments but works locally.

## Root Cause
- The `VITE_PAYSTACK_PUBLIC_KEY` environment variable was not set during the build process in the hosted environment
- The Paystack public key needs to be available at build time for frontend integration

## Solution Implemented

### 1. **Backend Configuration Endpoint** (`get-paystack-config`)
- Created a new Supabase Edge Function that serves the Paystack public key
- This acts as a fallback when the environment variable isn't available at build time
- The function securely retrieves the key from `PAYSTACK_PUBLIC_KEY` server environment variable

### 2. **Frontend Fallback Mechanism**
- Updated `PaystackService` to include `getPaystackPublicKey()` function
- First tries to use the environment variable from build time
- If not available, fetches from the backend `get-paystack-config` endpoint
- Caches the result to avoid repeated calls

### 3. **Updated PaystackPaymentDialog**
- Now dynamically loads the public key when the dialog opens
- Shows appropriate error messages if configuration fails
- Uses the fetched key for all payment transactions

## Deployment Steps

### For Vercel / Netlify / Similar Hosting Platforms:

1. **Set Build Environment Variables:**
   ```
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_<your-key> (or pk_live_<your-key> for production)
   ```

2. **Set Supabase Edge Function Secrets:**
   - Go to Supabase Dashboard → Edge Functions → Settings
   - Add secret: `PAYSTACK_PUBLIC_KEY` with your public key value
   - Note: The edge function also needs `PAYSTACK_SECRET_KEY` for payment initialization

3. **Verify Configuration:**
   - After deployment, test the payment flow
   - Monitor browser console for any configuration errors
   - The system will automatically fall back to fetching from backend if env var is missing

### For Docker / Custom Deployment:

```bash
# During build:
export VITE_PAYSTACK_PUBLIC_KEY=pk_test_<your-key>
npm run build

# In runtime (Supabase secrets):
PAYSTACK_PUBLIC_KEY=pk_test_<your-key>
PAYSTACK_SECRET_KEY=sk_test_<your-key>
```

## Verification Checklist

- [ ] Set `VITE_PAYSTACK_PUBLIC_KEY` in build environment variables
- [ ] Set `PAYSTACK_PUBLIC_KEY` in Supabase Edge Function secrets
- [ ] Set `PAYSTACK_SECRET_KEY` in Supabase Edge Function secrets (for payment initialization)
- [ ] Rebuild and redeploy
- [ ] Test payment flow in hosted environment
- [ ] Verify no errors in browser console
- [ ] Confirm payment modal opens successfully

## Local Development

Local development should work without additional changes as long as `.env` file contains:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_<your-test-key>
PAYSTACK_SECRET_KEY=sk_test_<your-test-key>
```

## Troubleshooting

1. **Still seeing "Paystack public key is not configured":**
   - Check that `PAYSTACK_PUBLIC_KEY` is set in Supabase secrets
   - Verify the key value is correct (starts with pk_test_ or pk_live_)
   - Check browser console for network errors fetching from backend

2. **Payment initialization still fails:**
   - Ensure `PAYSTACK_SECRET_KEY` is set in Supabase Edge Function secrets
   - Verify it's the correct secret key (starts with sk_test_ or sk_live_)

3. **Build errors:**
   - Make sure `VITE_PAYSTACK_PUBLIC_KEY` is set during build time (not just runtime)
   - This helps avoid the fallback mechanism in production

## Files Modified

- `supabase/functions/get-paystack-config/index.ts` - New endpoint to serve Paystack config
- `src/services/paystackService.ts` - Added `getPaystackPublicKey()` function with fallback logic
- `src/components/dialogs/PaystackPaymentDialog.tsx` - Updated to use dynamic key loading
