# Paystack Integration - Quick Start Guide

## Pre-requisites

✅ Paystack account created at https://dashboard.paystack.co
✅ API keys obtained (Public & Secret Key)
✅ Webhook secret configured

---

## Step 1: Configure Environment Variables

### Add to `.env` file:

```env
# Frontend (expose only public key)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx  # from Paystack dashboard
```

### Add to Supabase Secrets (via CLI or Dashboard):

```bash
supabase secrets set PAYSTACK_SECRET_KEY "sk_test_xxxxxxxxxxxx"
supabase secrets set PAYSTACK_WEBHOOK_SECRET "whsec_xxxxxxxxxxxx"
```

**Get these from:**
- `PAYSTACK_SECRET_KEY`: Paystack Dashboard → Settings → API Keys & Webhooks → Secret Key
- `PAYSTACK_WEBHOOK_SECRET`: Paystack Dashboard → Settings → Webhooks → Test Secret

---

## Step 2: Deploy Database Schema

### Option A: Using Supabase Dashboard SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy & paste content from: `supabase/migrations/20260304_paystack_payment_system.sql`
4. Click "Run"

### Option B: Using Supabase CLI
```bash
supabase migration up
```

---

## Step 3: Deploy Edge Functions

```bash
# Option 1: Using CLI
supabase functions deploy create-rent-payment
supabase functions deploy paystack-webhook

# Option 2: Manual via Dashboard
# Copy file contents to Supabase → Functions → Create New Function
```

**Test functions:**
```bash
# Test create-rent-payment
curl -X POST https://[project].supabase.co/functions/v1/create-rent-payment \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant-id",
    "invoiceId": "test-invoice-id",
    "amount": 50000,
    "tenantEmail": "tenant@example.com"
  }'
```

---

## Step 4: Create Test Data

### Create test invoice:
```sql
-- Insert tenant first
INSERT INTO tenants (id, auth_user_id, email, first_name, last_name)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'auth-uuid', 'tenant@example.com', 'John', 'Doe')
ON CONFLICT DO NOTHING;

-- Create property
INSERT INTO properties (id, name, location)
VALUES ('660e8400-e29b-41d4-a716-446655440000', 'Test Property', 'Nairobi')
ON CONFLICT DO NOTHING;

-- Create invoice
INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000',
  '101',
  5000,  -- KES
  CURRENT_DATE + INTERVAL '7 days',
  'unpaid'
);
```

---

## Step 5: Test Payment Flow

### 1. **Start Frontend**
```bash
npm run dev:frontend
```

### 2. **Navigate to Tenant Portal**
- Login as tenant
- Go to Payments section
- Should see the test invoice

### 3. **Click "Pay Now"**
- Dialog opens
- Shows amount: KES 5,000
- Click "Pay Now" button

### 4. **Paystack Checkout (Test Mode)**
Use these test credentials:
- **Card Number:** 4242424242424242
- **Expiry:** 12/25 (any future date)
- **CVV:** 123
- **OTP:** 123456

### 5. **Verify Success**
- Payment successful message
- Check database for payment record:
  ```sql
  SELECT id, status FROM payments WHERE reference LIKE 'RENT-%';
  ```

- Check receipt created:
  ```sql
  SELECT receipt_number FROM receipts LIMIT 1;
  ```

---

## Step 6: Configure Webhook (Production)

### Paystack Dashboard:
1. Settings → Webhooks
2. Enter webhook URL:
   ```
   https://[your-project].supabase.co/functions/v1/paystack-webhook
   ```
3. Select event: `charge.success`
4. Save

### Test webhook:
```bash
# Generate signature
PAYLOAD='{"event":"charge.success","data":{"reference":"RENT-test"}}'
SECRET="webhooksecret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$SECRET" | cut -d' ' -f2)

# Send test
curl -X POST https://[your-project].supabase.co/functions/v1/paystack-webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Step 7: Integrate with Dashboards

### Update Property Manager Dashboard:
Add to payment view: `src/pages/portal/manager/PaymentsManagement.tsx`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Subscribe to new payments for properties
const subscription = supabase
  .channel('payments-update')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'payments',
    },
    (payload) => {
      // Refresh payments list
      fetchPayments();
    }
  )
  .subscribe();
```

### Update Super Admin Dashboard:
Add to analytics: `src/pages/portal/super-admin/SuperAdminDashboard.tsx`

```typescript
// Calculate revenue
const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
const successfulPayments = payments.filter(p => p.status === 'successful').length;
```

---

## Troubleshooting

### Issue: "Paystack public key not configured"
**Solution:** Check `.env` file has `VITE_PAYSTACK_PUBLIC_KEY`

### Issue: "Webhook signature invalid"
**Solution:** Verify `PAYSTACK_WEBHOOK_SECRET` in Supabase secrets matches Paystack dashboard

### Issue: "Invoice not found"
**Solution:** Check tenant_id in URL or metadata matches invoice record

### Issue: Payment successful but invoice not updated
**Solution:** 
- Check webhook function logs in Supabase
- Verify webhook URL is correct in Paystack dashboard
- Check database for payment record created

### Issue: Receipt not generated
**Solution:**
- Receipt only generates on successful webhook verification
- Check payments table for successful status
- Check receipts table for entry

---

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Edge Functions deployed
- [ ] Test invoice created
- [ ] Frontend loads payment page
- [ ] "Pay Now" button works
- [ ] Paystack popup opens
- [ ] Test payment completes
- [ ] Invoice marked "paid" in database
- [ ] Receipt created and downloadable
- [ ] Webhook processes payment
- [ ] Dashboard shows updated payment
- [ ] Multiple payments don't duplicate (idempotency)

---

## Production Deployment

### Pre-deployment Checklist:
- [ ] Switch to live Paystack keys
- [ ] Update webhook URL to production
- [ ] Run database migrations in production
- [ ] Deploy Edge Functions to production
- [ ] Set production environment variables
- [ ] Enable HTTPS (required by Paystack)
- [ ] Configure email notifications
- [ ] Set up backup & monitoring
- [ ] Load test payment flow
- [ ] Document runbook for issues

### Go Live:
```bash
# Deploy to production
supabase functions deploy create-rent-payment --project-ref prod-project
supabase functions deploy paystack-webhook --project-ref prod-project

# Verify with production payment
# (Use Paystack test mode until confident)
```

---

## Support Resources

- **Paystack Docs:** https://paystack.com/docs/
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Supabase Webhooks:** https://supabase.com/docs/guides/webhooks
- **jsPDF:** https://jspdf.dev/

---

## File References

| File | Purpose |
|------|---------|
| `supabase/functions/create-rent-payment/index.ts` | Initialize payment |
| `supabase/functions/paystack-webhook/index.ts` | Process webhook |
| `supabase/migrations/20260304_paystack_payment_system.sql` | Database schema |
| `src/services/paystackService.ts` | Frontend service |
| `src/hooks/useRentPayment.ts` | Custom hook |
| `src/utils/receiptGenerator.ts` | Receipt PDF generation |
| `src/pages/portal/tenant/PaymentsTenantNew.tsx` | Tenant payment page |
| `src/components/dialogs/PaystackPaymentDialog.tsx` | Payment dialog |

---

## Next Steps

1. ✅ Complete this setup
2. ✅ Test with Paystack test mode
3. ✅ Verify all data flows correctly
4. ✅ Get Paystack live keys
5. ✅ Update production environment
6. ✅ Switch webhook to production
7. ✅ Enable all dashboard features
8. ✅ Monitor & optimize
