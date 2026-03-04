# Paystack Integration - Deployment & Integration Guide

## Overview

This guide covers how to deploy and integrate the new Paystack payment system into your property management application.

---

## Pre-Deployment Checklist

### 1. Paystack Account Setup
- [ ] Create Paystack account: https://paystack.co
- [ ] Verify email
- [ ] Complete KYC (Know Your Customer)
- [ ] Get test API keys
- [ ] Activate live API keys (once verified)

### 2. Collect Required Keys
From Paystack Dashboard → Settings → API Keys & Webhooks:
- [ ] Public Key (Test): `pk_test_...`
- [ ] Secret Key (Test): `sk_test_...`
- [ ] Webhook Secret (Test): `whsec_...`

### 3. Supabase Preparation
- [ ] Access Supabase dashboard
- [ ] Identify project URL: `https://[project].supabase.co`
- [ ] Get service role key for Edge Functions
- [ ] Confirm database access

---

## Deployment Steps

### Step 1: Configure Environment Variables

#### A. Frontend Configuration (.env)
```env
# Add this to your .env file
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
```

**Location:** Root directory of project
**Access:** Client-side only (public)

#### B. Backend Configuration (Supabase Secrets)

```bash
# Using Supabase CLI
supabase secrets set PAYSTACK_SECRET_KEY "sk_test_xxxxxxxxxxxx"
supabase secrets set PAYSTACK_WEBHOOK_SECRET "whsec_xxxxxxxxxxxx"
```

**Location:** Supabase project secrets
**Access:** Backend only (protected)

### Step 2: Deploy Database Schema

#### Option A: Using SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy all content from `supabase/migrations/20260304_paystack_payment_system.sql`
4. Paste into editor
5. Click "Run"
6. Verify no errors

#### Option B: Using CLI
```bash
cd project-root
supabase db push
```

#### Verify Migration
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'payments', 'receipts');

-- Should return 3 rows
```

### Step 3: Deploy Supabase Edge Functions

#### Deploy create-rent-payment Function
```bash
supabase functions deploy create-rent-payment
```

#### Deploy paystack-webhook Function
```bash
supabase functions deploy paystack-webhook
```

#### Verify Functions
```bash
# List deployed functions
supabase functions list

# Should show:
# - create-rent-payment
# - paystack-webhook
# - initialize-paystack-payment (existing)
# - verify-paystack-transaction (existing)
```

### Step 4: Configure Paystack Webhook

1. **Login to Paystack Dashboard**
2. **Navigation:** Settings → Webhooks
3. **Add Webhook:**
   - URL: `https://[your-project].supabase.co/functions/v1/paystack-webhook`
   - Event: `charge.success`
4. **Save**
5. **Verify:** Test webhook should show in Paystack logs

### Step 5: Create Test Data

Run this SQL to create test invoices:

```sql
-- Create test tenant (if not exists)
INSERT INTO tenants (id, auth_user_id, email, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'test-auth-user-id',
  'tenant@example.com',
  'John',
  'Doe'
)
ON CONFLICT DO NOTHING;

-- Create test property (if not exists)
INSERT INTO properties (id, name, location)
VALUES (
  gen_random_uuid(),
  'Test Apartment Complex',
  'Nairobi, Kenya'
)
ON CONFLICT DO NOTHING;

-- Create test invoices
INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status, description)
SELECT
  t.id,
  p.id,
  '101',
  5000,
  CURRENT_DATE + INTERVAL '7 days',
  'unpaid',
  'March 2024 Rent'
FROM tenants t
CROSS JOIN properties p
WHERE t.email = 'tenant@example.com'
AND p.name = 'Test Apartment Complex'
LIMIT 1;
```

---

## Integration with Existing Application

### Step 1: Update Routes

#### In `src/App.tsx` or your router setup:

```typescript
import { lazy } from 'react';

// Lazy load the new payment page
const TenantPayments = lazy(() => 
  import('@/pages/portal/tenant/PaymentsTenantNew')
);

// Add route
const routes = [
  // ... existing routes ...
  {
    path: '/tenant/payments',
    element: <TenantPayments />,
    requiresAuth: true,
    role: 'tenant'
  },
];
```

### Step 2: Update Navigation

#### In `src/components/layout/SidebarNav.tsx` or similar:

```typescript
// Update tenant navigation menu
const tenantNavItems = [
  // ... existing items ...
  {
    label: 'Payments',
    path: '/tenant/payments',
    icon: <CreditCard className="h-4 w-4" />,
  },
];
```

### Step 3: Remove Old Payment Flow (Optional)

If replacing old payment system:

```typescript
// OLD - Remove or deprecate
// import MakePayment from '@/pages/portal/tenant/MakePayment';

// NEW - Use instead
import TenantPayments from '@/pages/portal/tenant/PaymentsTenantNew';
```

### Step 4: Verify Imports in Components

Check that these imports work:

```typescript
// These should all resolve without errors
import { createRentPayment } from '@/services/paystackService';
import PaystackPaymentDialog from '@/components/dialogs/PaystackPaymentDialog';
import { useRentPayment } from '@/hooks/useRentPayment';
import { downloadReceiptPDF } from '@/utils/receiptGenerator';
```

---

## Integration with Dashboards

### Manager Dashboard - Add Payment View

#### File: `src/pages/portal/manager/PaymentsManagement.tsx`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ManagerPaymentsView = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          invoices(unit_number, due_date),
          tenants(first_name, last_name)
        `)
        .in('invoice_id', propertyInvoiceIds) // Filter by managed properties
        .order('created_at', { ascending: false });

      setPayments(data || []);
    };

    fetchPayments();

    // Subscribe to new payments
    const subscription = supabase
      .channel('manager-payments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
      }, (payload) => {
        // Check if payment is for managed property
        if (managedInvoices.includes(payload.new.invoice_id)) {
          setPayments(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tenant</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(payment => (
          <TableRow key={payment.id}>
            <TableCell>{payment.tenants?.first_name} {payment.tenants?.last_name}</TableCell>
            <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
            <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge className={payment.status === 'successful' ? 'bg-green-100' : 'bg-red-100'}>
                {payment.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### Admin Dashboard - Add Analytics

#### File: `src/pages/portal/super-admin/PaymentAnalytics.tsx`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const PaymentAnalytics = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paymentCount: 0,
    averageTransaction: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'successful');

      if (data) {
        const total = data.reduce((sum, p) => sum + p.amount, 0);
        setStats({
          totalRevenue: total,
          paymentCount: data.length,
          averageTransaction: data.length > 0 ? total / data.length : 0,
        });
      }
    };

    fetchAnalytics();

    // Subscribe to new payments
    const subscription = supabase
      .channel('admin-payments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
      }, () => {
        fetchAnalytics(); // Refresh stats
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            KES {stats.totalRevenue.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Count</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.paymentCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            KES {stats.averageTransaction.toLocaleString('en-US', {
              maximumFractionDigits: 0
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Testing After Deployment

### Test 1: Create Invoice
```sql
INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status)
VALUES ('tenant-uuid', 'property-uuid', '101', 5000, CURRENT_DATE + INTERVAL '7 days', 'unpaid')
RETURNING id;
```

### Test 2: Access Payment Page
1. Login as tenant
2. Navigate to `/tenant/payments`
3. Should see invoice in list
4. Button should show "Pay Now"

### Test 3: Complete Payment
1. Click "Pay Now"
2. Dialog opens
3. Fill test card: 4242424242424242
4. Complete payment
5. Success message appears

### Test 4: Verify Data
```sql
-- Check invoice marked paid
SELECT status FROM invoices WHERE id = 'test-invoice-id';

-- Check payment created
SELECT * FROM payments WHERE invoice_id = 'test-invoice-id';

-- Check receipt created
SELECT receipt_number FROM receipts WHERE invoice_id = 'test-invoice-id';
```

### Test 5: Test Webhook Manually
```bash
# Test webhook processing
curl -X POST "https://[project].supabase.co/functions/v1/paystack-webhook" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $(echo -n '{"event":"charge.success","data":{"reference":"RENT-test","amount":500000,"currency":"KES","status":"success"}}' | openssl dgst -sha512 -hmac 'webhook_secret' | cut -d' ' -f2)" \
  -d '{"event":"charge.success","data":{"reference":"RENT-test","amount":500000,"currency":"KES","status":"success"}}'
```

---

## Troubleshooting

### Issue: "Paystack public key is not configured"
**Solution:**
1. Check `.env` file exists
2. Verify `VITE_PAYSTACK_PUBLIC_KEY` is set
3. Restart development server

### Issue: Edge Function returns 500 error
**Solution:**
1. Check Supabase function logs
2. Verify `PAYSTACK_SECRET_KEY` is in secrets
3. Check function code for syntax errors
4. Redeploy: `supabase functions deploy`

### Issue: Webhook not processing payments
**Solution:**
1. Verify webhook URL in Paystack dashboard
2. Check webhook logs in Paystack dashboard
3. Verify `PAYSTACK_WEBHOOK_SECRET` in Supabase
4. Check Edge Function logs for errors

### Issue: Invoice not updating to "paid" after payment
**Solution:**
1. Check if webhook was received
2. Verify signature validation in webhook logs
3. Check payments table for record
4. Check receipts table for entry

### Issue: Receipt not downloading
**Solution:**
1. Verify jsPDF is installed: `npm list jspdf`
2. Check browser console for errors
3. Verify receipt exists in database
4. Check jsPDF call in receiptGenerator.ts

---

## Production Deployment

### Before Going Live

- [ ] Get live Paystack API keys
- [ ] Update environment variables with live keys
- [ ] Test with live keys (small transaction first)
- [ ] Update webhook URL to production
- [ ] Enable HTTPS (required by Paystack)
- [ ] Set up monitoring and alerts
- [ ] Configure email notifications
- [ ] Set up database backups
- [ ] Create runbook for common issues

### Deployment Commands

```bash
# 1. Update environment variables
# Edit .env with live keys

# 2. Redeploy to production
supabase functions deploy create-rent-payment --project-ref your-prod-project
supabase functions deploy paystack-webhook --project-ref your-prod-project

# 3. Deploy frontend
npm run build
# Then deploy to your hosting (Vercel, Netlify, etc.)

# 4. Verify in production
# Test with small payment
# Monitor logs
# Check webhooks received
```

### Rollback Plan

If issues occur:

1. **Disable payments temporarily:**
   ```typescript
   // In PaymentsTenantNew.tsx
   const handlePayNow = () => {
     toast.error("Payments temporarily disabled for maintenance");
     return;
   };
   ```

2. **Revert to previous version:**
   ```bash
   git revert [commit-hash]
   git push
   npm run build && deploy
   ```

3. **Contact Paystack support** if webhook issues

---

## Monitoring & Support

### Key Metrics to Monitor

1. **Payment Success Rate**
   ```sql
   SELECT 
     COUNT(*) as total,
     SUM(CASE WHEN status='successful' THEN 1 END) as successful,
     ROUND(100.0 * SUM(CASE WHEN status='successful' THEN 1 END) / COUNT(*), 2) as success_rate
   FROM payments
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Payment Processing Time**
   - Target: < 5 seconds
   - Monitor in Edge Function logs

3. **Webhook Delivery Rate**
   - Check Paystack dashboard → Webhooks → Status
   - Target: 100% delivered

4. **Error Rate**
   - Monitor Supabase logs
   - Set alerts for failures > 5%

### Support Contacts

- **Paystack Support:** support@paystack.co
- **Paystack Community:** community.paystack.co
- **Supabase Support:** supabase.com/support

---

## Migration from Old System

If migrating from old payment system:

### 1. Data Migration
```sql
-- Migrate old rent payments to invoices/payments
INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status, paid_at)
SELECT 
  tenant_id,
  property_id,
  unit_number,
  amount,
  due_date,
  CASE WHEN status='paid' THEN 'paid' ELSE 'unpaid' END,
  paid_date
FROM old_rent_payments;
```

### 2. Notify Users
- Send email about new payment system
- Update tenant portal documentation
- Create FAQ for common questions

### 3. Parallel Run (Optional)
- Keep old system active for 2 weeks
- Support both payment methods
- Gradual migration

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `PAYSTACK_INTEGRATION_GUIDE.md` | Technical architecture |
| `PAYSTACK_QUICK_START.md` | Setup instructions |
| `PAYSTACK_TESTING_GUIDE.md` | Testing procedures |
| `PAYSTACK_IMPLEMENTATION_COMPLETION_REPORT.md` | Implementation summary |

---

## Conclusion

✅ Your Paystack payment system is ready for production.

**Next Steps:**
1. Complete all pre-deployment checks
2. Deploy to staging environment first
3. Run full test suite
4. Get stakeholder approval
5. Deploy to production
6. Monitor for 24 hours
7. Document any issues
8. Communicate with users

**Success Criteria:**
- ✅ All tests pass
- ✅ Webhooks processed successfully
- ✅ Invoices marked paid correctly
- ✅ Receipts generated and downloadable
- ✅ Dashboards updated in real-time
- ✅ Zero critical errors in logs

---

**Ready to deploy!** 🚀
