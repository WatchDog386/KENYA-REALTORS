# Paystack Integration - Testing Guide

## Test Scenarios

### 1. UNIT TESTS - Payment Service

```typescript
// src/services/__tests__/paystackService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRentPayment } from '@/services/paystackService';

describe('Paystack Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRentPayment', () => {
    it('should initialize rent payment with valid invoice', async () => {
      const result = await createRentPayment(
        'tenant-uuid',
        'invoice-uuid',
        5000,
        'tenant@example.com'
      );

      expect(result.status).toBe(true);
      expect(result.data?.authorization_url).toBeDefined();
      expect(result.data?.reference).toMatch(/^RENT-/);
    });

    it('should reject payment with invalid tenant', async () => {
      await expect(
        createRentPayment(
          'invalid-tenant',
          'invoice-uuid',
          5000,
          'tenant@example.com'
        )
      ).rejects.toThrow('Tenant not found');
    });

    it('should reject payment with invalid invoice', async () => {
      await expect(
        createRentPayment(
          'tenant-uuid',
          'invalid-invoice',
          5000,
          'tenant@example.com'
        )
      ).rejects.toThrow('Invoice not found');
    });

    it('should reject payment if invoice already paid', async () => {
      // Setup: Create paid invoice
      const paidInvoiceId = await createPaidInvoice();

      await expect(
        createRentPayment(
          'tenant-uuid',
          paidInvoiceId,
          5000,
          'tenant@example.com'
        )
      ).rejects.toThrow('already paid');
    });

    it('should reject payment with mismatched amount', async () => {
      await expect(
        createRentPayment(
          'tenant-uuid',
          'invoice-uuid',
          9999, // Wrong amount
          'tenant@example.com'
        )
      ).rejects.toThrow('Amount mismatch');
    });
  });
});
```

### 2. INTEGRATION TESTS - Webhook Handler

```typescript
// supabase/functions/paystack-webhook/__tests__/handler.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { handlePaystackWebhook } from '../handler';

describe('Paystack Webhook Handler', () => {
  describe('Signature Verification', () => {
    it('should reject webhook with invalid signature', async () => {
      const response = await handlePaystackWebhook(
        { event: 'charge.success', data: {} },
        'invalid-signature'
      );

      expect(response.status).toBe(401);
    });

    it('should accept webhook with valid signature', async () => {
      const payload = generateTestPayload();
      const signature = generateSignature(payload);

      const response = await handlePaystackWebhook(
        payload,
        signature
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Payment Processing', () => {
    it('should mark invoice as paid after successful payment', async () => {
      const invoiceId = await createTestInvoice();
      const response = await handlePaystackWebhook(
        generateSuccessPayload(invoiceId),
        validSignature
      );

      expect(response.status).toBe(200);

      // Verify database
      const invoice = await getInvoice(invoiceId);
      expect(invoice.status).toBe('paid');
    });

    it('should create payment record', async () => {
      const invoiceId = await createTestInvoice();
      const reference = `RENT-tenant-${invoiceId}-${Date.now()}`;

      await handlePaystackWebhook(
        generateSuccessPayload(invoiceId, reference),
        validSignature
      );

      const payment = await getPaymentByReference(reference);
      expect(payment).toBeDefined();
      expect(payment.status).toBe('successful');
    });

    it('should generate receipt after payment', async () => {
      const invoiceId = await createTestInvoice();

      await handlePaystackWebhook(
        generateSuccessPayload(invoiceId),
        validSignature
      );

      const receipt = await getReceiptByInvoiceId(invoiceId);
      expect(receipt).toBeDefined();
      expect(receipt.receipt_number).toMatch(/^RCPT-\d{4}-[A-Z0-9]{6}$/);
    });

    it('should prevent duplicate payment processing', async () => {
      const invoiceId = await createTestInvoice();
      const reference = `RENT-tenant-${invoiceId}-${Date.now()}`;
      const payload = generateSuccessPayload(invoiceId, reference);

      // First webhook
      await handlePaystackWebhook(payload, validSignature);

      // Second webhook (should not duplicate)
      await handlePaystackWebhook(payload, validSignature);

      const payments = await getPaymentsByReference(reference);
      expect(payments.length).toBe(1); // Only one payment created
    });

    it('should reject payment with invalid amount', async () => {
      const invoiceId = await createTestInvoice(5000);
      const payload = generateSuccessPayload(invoiceId);
      payload.data.amount = 4999 * 100; // Wrong amount in kobo

      await handlePaystackWebhook(payload, validSignature);

      // Payment should not be created
      const payment = await getPaymentByInvoiceId(invoiceId);
      expect(payment).toBeNull();
    });

    it('should reject payment with non-KES currency', async () => {
      const invoiceId = await createTestInvoice();
      const payload = generateSuccessPayload(invoiceId);
      payload.data.currency = 'USD';

      await handlePaystackWebhook(payload, validSignature);

      // Invoice should not be marked paid
      const invoice = await getInvoice(invoiceId);
      expect(invoice.status).toBe('unpaid');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing webhook secret gracefully', async () => {
      // Temporarily unset secret
      const oldSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
      process.env.PAYSTACK_WEBHOOK_SECRET = undefined;

      const response = await handlePaystackWebhook(payload, signature);

      expect(response.status).toBe(500);

      // Restore
      process.env.PAYSTACK_WEBHOOK_SECRET = oldSecret;
    });

    it('should handle database errors without crashing', async () => {
      // Mock database error
      const mockInvoiceDb = vi.spyOn(db, 'getInvoice').mockRejectedValue(
        new Error('Database error')
      );

      const response = await handlePaystackWebhook(payload, signature);

      expect(response.status).toBe(200); // Return 200 to stop Paystack retry
      mockInvoiceDb.mockRestore();
    });
  });
});
```

---

## Manual Testing

### Scenario 1: Successful Payment

**Steps:**
1. Login as tenant
2. Navigate to Payments
3. View test invoice (unpaid, 5000 KES)
4. Click "Pay Now"
5. Fill Paystack form with test card:
   - Card: 4242424242424242
   - Exp: 12/25
   - CVV: 123
6. Enter OTP: 123456
7. Click "Pay"

**Expected Results:**
- ✅ Payment successful page appears
- ✅ Redirect back to payments page
- ✅ Invoice status changes to "Paid"
- ✅ Receipt appears in list
- ✅ Receipt can be downloaded

**Database Verification:**
```sql
-- Check invoice
SELECT id, status, paid_at FROM invoices WHERE id = 'test-invoice-id';
-- Expected: status='paid', paid_at is set

-- Check payment
SELECT * FROM payments WHERE invoice_id = 'test-invoice-id';
-- Expected: gateway='paystack', status='successful'

-- Check receipt
SELECT receipt_number FROM receipts WHERE invoice_id = 'test-invoice-id';
-- Expected: receipt_number matches pattern RCPT-2024-XXXXXX
```

### Scenario 2: Payment Cancellation

**Steps:**
1. Click "Pay Now"
2. Paystack popup opens
3. Click close button (X)
4. Back to payment page

**Expected Results:**
- ✅ Payment dialog closes
- ✅ Invoice still shows "Unpaid"
- ✅ No payment record created

### Scenario 3: Failed Payment

**Steps:**
1. Click "Pay Now"
2. Enter test card: 4000000000000002 (failed card)
3. Complete transaction

**Expected Results:**
- ✅ Error message appears
- ✅ Invoice remains "Unpaid"
- ✅ No payment record created
- ✅ No receipt generated

### Scenario 4: Webhook Test

**Use curl to trigger webhook:**
```bash
#!/bin/bash

# Configuration
WEBHOOK_URL="https://[project].supabase.co/functions/v1/paystack-webhook"
SECRET="your_webhook_secret"

# Generate test payload
PAYLOAD='{
  "event": "charge.success",
  "data": {
    "id": 1234567890,
    "reference": "RENT-tenant-invoice-'"$(date +%s)"'",
    "amount": 500000,
    "currency": "KES",
    "status": "success",
    "paid_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "metadata": {
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "invoiceId": "invoice-uuid"
    }
  }
}'

# Generate signature (HMAC SHA512)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$SECRET" | cut -d' ' -f2)

# Send webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIGNATURE" \
  -d "$PAYLOAD"

echo "Webhook sent"
```

**Expected Results:**
- ✅ HTTP 200 response
- ✅ Invoice marked paid in database
- ✅ Payment record created
- ✅ Receipt generated

---

## Property Manager Dashboard Testing

### Test: View Tenant Payment

**Steps:**
1. Login as property manager
2. Go to Payments section
3. Should see all payments for managed properties

**Expected:**
- ✅ List shows recent payments
- ✅ Shows tenant name, amount, date
- ✅ Status column shows "successful"
- ✅ Filter by date/property works

**Real-time Test:**
1. Tenant completes payment in another window
2. Property manager dashboard should update within 3 seconds
3. New payment appears in list

### SQL Verification:
```sql
-- Property manager should see payments
SELECT p.id, p.amount, i.unit_number, t.first_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN tenants t ON p.tenant_id = t.id
WHERE i.property_id IN (
  SELECT property_id FROM property_managers 
  WHERE auth_user_id = 'manager-uuid'
);
```

---

## Super Admin Dashboard Testing

### Test: View All Payments & Analytics

**Steps:**
1. Login as super admin
2. Go to Payments/Analytics
3. Should see all payments system-wide

**Expected:**
- ✅ Total revenue calculated correctly
- ✅ Payment trend chart shows data
- ✅ Can filter by date range
- ✅ Can sort by amount, date, etc.

**Calculate Expected Revenue:**
```sql
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count,
  COUNT(CASE WHEN status='successful' THEN 1 END) as successful_count
FROM payments
WHERE status='successful';
```

---

## Load Testing

### Test: Multiple Simultaneous Payments

```bash
#!/bin/bash
# Load test script

for i in {1..10}; do
  (
    curl -X POST "https://[project].supabase.co/functions/v1/create-rent-payment" \
      -H "Content-Type: application/json" \
      -d "{
        \"tenantId\": \"tenant-$i\",
        \"invoiceId\": \"invoice-$i\",
        \"amount\": 5000,
        \"tenantEmail\": \"tenant$i@example.com\"
      }" &
  )
done
wait

echo "Load test completed"
```

**Monitor:**
- Function execution time
- Database response time
- Edge function logs for errors

---

## Edge Cases

### Case 1: Webhook Timeout
**Test:** Simulate slow database
```sql
-- SQL trigger to slow down inserts
CREATE OR REPLACE FUNCTION slow_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_sleep(5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Expected:** Webhook returns 200 OK immediately, processes async

### Case 2: Duplicate Invoice IDs
**Test:** Send same `invoiceId` in two webhooks

**Expected:**
- First invoice marked paid ✅
- Second invoice skipped due to idempotency ✅
- Only one payment record ✅

### Case 3: Webhook Order
**Test:** Send webhook events out of order

**Expected:** System handles regardless of order

### Case 4: Large Transaction
**Test:** Payment with 9,999,999 KES

**Expected:** No overflow, handles correctly

---

## Regression Testing

### Before Each Release:

1. **Payment Flow**
   - [ ] Create invoice
   - [ ] Initiate payment
   - [ ] Complete payment
   - [ ] Verify invoice updated
   - [ ] Verify receipt created

2. **Webhook**
   - [ ] Send valid webhook
   - [ ] Verify signature check works
   - [ ] Verify duplicate detection
   - [ ] Verify database updates

3. **UI/UX**
   - [ ] Payment dialog opens
   - [ ] Dialog shows correct amounts
   - [ ] Error messages display properly
   - [ ] Receipt download works

4. **Dashboards**
   - [ ] Tenant: Invoice list, pay button, receipts
   - [ ] Manager: Payment history, filtering
   - [ ] Admin: Analytics, revenue totals

5. **Performance**
   - [ ] Payment endpoint < 2 seconds
   - [ ] Webhook processing < 1 second
   - [ ] No database locks

---

## Testing Checklist

**Pre-Testing:**
- [ ] Test Paystack account setup
- [ ] Test API keys configured
- [ ] Test database migrated
- [ ] Test functions deployed
- [ ] Test data created

**Functional Tests:**
- [ ] Create invoice
- [ ] Initiate payment
- [ ] Complete payment (success)
- [ ] Check invoice updated
- [ ] Download receipt
- [ ] Cancel payment
- [ ] Failed payment handling

**Webhook Tests:**
- [ ] Valid signature accepted
- [ ] Invalid signature rejected
- [ ] Payment marked successful
- [ ] Invoice marked paid
- [ ] Receipt created
- [ ] Duplicate prevention

**Dashboard Tests:**
- [ ] Tenant view invoices
- [ ] Tenant pay invoice
- [ ] Manager view payments
- [ ] Admin view analytics
- [ ] Real-time updates
- [ ] Filters/sorting work

**Error Tests:**
- [ ] Missing invoice
- [ ] Invalid tenant
- [ ] Amount mismatch
- [ ] Already paid
- [ ] Network error
- [ ] Webhook timeout

**Load Tests:**
- [ ] 10+ simultaneous payments
- [ ] 100+ concurrent users
- [ ] Large transactions
- [ ] Webhook retry handling

**Security Tests:**
- [ ] Secret keys not exposed
- [ ] Signature validation works
- [ ] RLS policies enforced
- [ ] XSS prevention
- [ ] Rate limiting

---

## Logging & Monitoring

### Key Metrics to Monitor:

```typescript
// Log payment initialization
console.log('Payment initialized:', {
  tenantId,
  invoiceId,
  amount,
  timestamp: new Date().toISOString(),
});

// Log webhook receipt
console.log('Webhook received:', {
  event,
  reference,
  timestamp: new Date().toISOString(),
});

// Log successful payment
console.log('Payment successful:', {
  reference,
  invoiceId,
  amountProcessed,
  duration: endTime - startTime,
});
```

### Alerts to Set Up:
- ⚠️ Failed payment: > 5 in last hour
- ⚠️ Webhook error: Any failures
- ⚠️ Database error: Connection issues
- ⚠️ Signature mismatch: Potential attacks

---

## Test Data Utilities

```sql
-- Quick setup for testing
CREATE OR REPLACE FUNCTION setup_test_data()
RETURNS void AS $$
BEGIN
  -- Insert test tenant
  INSERT INTO tenants (id, auth_user_id, email, first_name, last_name)
  VALUES ('test-tenant-001', 'test-auth-001', 'test@example.com', 'Test', 'Tenant')
  ON CONFLICT DO NOTHING;

  -- Insert test property
  INSERT INTO properties (id, name, location)
  VALUES ('test-prop-001', 'Test Property', 'Nairobi')
  ON CONFLICT DO NOTHING;

  -- Insert test invoices
  FOR i IN 1..5 LOOP
    INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status)
    VALUES (
      'test-tenant-001',
      'test-prop-001',
      '10'||i,
      5000 + (i * 1000),
      CURRENT_DATE + (i || ' days')::INTERVAL,
      CASE WHEN i = 1 THEN 'paid' ELSE 'unpaid' END
    );
  END LOOP;

  RAISE NOTICE 'Test data created';
END;
$$ LANGUAGE plpgsql;

-- Run it
SELECT setup_test_data();
```
