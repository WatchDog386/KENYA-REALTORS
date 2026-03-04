# Paystack Integration Implementation Guide

## Overview

This document describes the complete Paystack payment integration for tenant rent payments in the property management system.

**Payment Flow:**
1. Tenant views invoices on Payment page
2. Clicks "Pay Now" for unpaid invoice
3. Backend validates invoice (tenant, amount, status)
4. Generates Paystack transaction reference
5. Frontend redirected to Paystack checkout
6. Paystack sends webhook on successful payment
7. Backend verifies signature & transaction
8. Invoice marked "paid" & receipt auto-generated
9. Dashboard updates reflected across all user roles

---

## Architecture

### Components

#### 1. **Frontend - Tenant Payment Page**
- **File:** `src/pages/portal/tenant/PaymentsTenantNew.tsx`
- **Features:**
  - Display invoices with status (unpaid, paid, overdue)
  - Real-time sync with Supabase
  - Summary cards (total, paid, unpaid, overdue)
  - "Pay Now" button for unpaid invoices
  - Receipt table with download functionality
  - Paystack payment dialog

#### 2. **Payment Dialog Component**
- **File:** `src/components/dialogs/PaystackPaymentDialog.tsx`
- **Responsibilities:**
  - Display payment details
  - Handle Paystack popup
  - Show payment status (initializing, waiting, verifying, success, error)
  - Provide manual verification fallback

#### 3. **Paystack Service**
- **File:** `src/services/paystackService.ts`
- **Methods:**
  - `initializePaystackPayment()` - Generic payment initialization
  - `createRentPayment()` - Rent-specific payment with invoice validation
  - `verifyPaystackTransaction()` - Transaction verification

#### 4. **Custom Hook**
- **File:** `src/hooks/useRentPayment.ts`
- **Functionality:**
  - Initialize rent payment
  - Check payment status
  - Fetch receipt data
  - State management

#### 5. **Receipt Generator**
- **File:** `src/utils/receiptGenerator.ts`
- **Features:**
  - Generate PDF receipt with jsPDF
  - Format receipt data
  - Download receipt to device
  - Includes tenant info, property details, transaction reference

---

## Backend - Supabase Edge Functions

### 1. **Create Rent Payment**
- **Function:** `supabase/functions/create-rent-payment/index.ts`
- **Endpoint:** `POST /functions/v1/create-rent-payment`
- **Request Body:**
  ```json
  {
    "tenantId": "uuid",
    "invoiceId": "uuid",
    "amount": 50000,
    "tenantEmail": "tenant@example.com"
  }
  ```
- **Validation:**
  - Tenant exists
  - Invoice exists & belongs to tenant
  - Invoice status = "unpaid"
  - Amount matches invoice amount
- **Response:**
  ```json
  {
    "status": true,
    "message": "Payment link created successfully",
    "data": {
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "...",
      "reference": "RENT-{tenantId}-{invoiceId}-{timestamp}",
      "amount": 50000,
      "tenantId": "uuid",
      "invoiceId": "uuid"
    }
  }
  ```

### 2. **Paystack Webhook**
- **Function:** `supabase/functions/paystack-webhook/index.ts`
- **Endpoint:** `POST /functions/v1/paystack-webhook`
- **Headers Required:**
  - `x-paystack-signature` - HMAC SHA512 signature

#### Webhook Processing Flow:

1. **Verify Signature**
   - Extract signature from header
   - Compute HMAC SHA512 using `PAYSTACK_WEBHOOK_SECRET`
   - Compare with received signature
   - Reject if invalid

2. **Verify Transaction**
   - Extract reference from payload
   - Call Paystack API to verify transaction
   - Confirm:
     - `status === "success"`
     - `amount` matches invoice (in kobo)
     - `currency === "KES"`

3. **Prevent Duplicates**
   - Check if reference already exists in payments table
   - Skip processing if already processed
   - Idempotency key: reference

4. **Update Database**
   - Mark invoice as `status = "paid"`
   - Set `paid_at` timestamp
   - Insert payment record
   - Generate receipt record

5. **Auto-Generate Receipt**
   - Create receipt number: `RCPT-{YEAR}-{RANDOM6}`
   - Store receipt metadata:
     - Tenant name, property name, unit
     - Amount, payment method, transaction reference
     - Generated timestamp

#### Webhook Payload (Paystack):
```json
{
  "event": "charge.success",
  "data": {
    "id": 12345,
    "reference": "RENT-{tenantId}-{invoiceId}-{timestamp}",
    "amount": 5000000,
    "currency": "KES",
    "status": "success",
    "paid_at": "2024-03-04T10:30:00Z",
    "metadata": {
      "tenantId": "uuid",
      "invoiceId": "uuid",
      "paymentType": "rent"
    }
  }
}
```

---

## Database Schema

### Invoices Table
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
property_id UUID REFERENCES properties(id)
unit_number VARCHAR(50)
amount DECIMAL(10,2)
description TEXT
due_date DATE
status VARCHAR(20) -- unpaid, paid, overdue, cancelled
paid_at TIMESTAMP (nullable)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP
```

### Payments Table
```sql
id UUID PRIMARY KEY
tenant_id UUID REFERENCES tenants(id)
invoice_id UUID REFERENCES invoices(id)
amount DECIMAL(10,2)
reference VARCHAR(255) UNIQUE -- Paystack reference
gateway VARCHAR(50) -- 'paystack', 'mpesa', 'manual'
status VARCHAR(50) -- 'successful', 'failed', 'pending'
paid_at TIMESTAMP
paystack_transaction_id INTEGER
created_at TIMESTAMP DEFAULT NOW()
```

### Receipts Table
```sql
id UUID PRIMARY KEY
payment_id UUID UNIQUE REFERENCES payments(id)
receipt_number VARCHAR(50) UNIQUE
tenant_id UUID REFERENCES tenants(id)
invoice_id UUID REFERENCES invoices(id)
amount DECIMAL(10,2)
tenant_name VARCHAR(255)
property_name VARCHAR(255)
unit_number VARCHAR(50)
payment_method VARCHAR(50)
transaction_reference VARCHAR(255)
generated_at TIMESTAMP DEFAULT NOW()
pdf_url VARCHAR(500) (nullable)
```

---

## Environment Variables

### Frontend (.env)
```env
# Supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_live_... or pk_test_...
```

### Backend (.env.local for Edge Functions)
```env
# Paystack
PAYSTACK_SECRET_KEY=sk_live_... or sk_test_...
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_from_paystack_dashboard

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Setup Instructions

### Step 1: Paystack Account Setup
1. Create account at https://dashboard.paystack.co
2. Get API keys from Settings → API Keys & Webhooks
3. Set webhook URL:
   - **URL:** `https://[your-supabase-project].supabase.co/functions/v1/paystack-webhook`
   - **Select:** charge.success event
4. Copy keys to environment variables

### Step 2: Database Migration
1. Run migration in Supabase:
   ```bash
   psql < supabase/migrations/20260304_paystack_payment_system.sql
   ```
   OR
2. Use Supabase dashboard SQL editor & paste migration file

### Step 3: Deploy Edge Functions
```bash
# Using Supabase CLI
supabase functions deploy create-rent-payment
supabase functions deploy paystack-webhook
```

### Step 4: Environment Configuration
```bash
# Set Supabase secrets
supabase secrets set PAYSTACK_SECRET_KEY "sk_..."
supabase secrets set PAYSTACK_WEBHOOK_SECRET "whsec_..."
```

### Step 5: Update Frontend Routes
- Update routes to include new Payment page
- Map `PaymentsTenantNew.tsx` to tenant portal payment route

---

## Testing

### 1. Test Invoice Creation
```sql
INSERT INTO invoices (tenant_id, property_id, unit_number, amount, due_date, status)
VALUES (
  'tenant-uuid',
  'property-uuid',
  '101',
  50000,
  CURRENT_DATE + INTERVAL '7 days',
  'unpaid'
);
```

### 2. Test Payment Flow (Paystack Test Mode)
- Use test keys from Paystack dashboard
- Card: 4242424242424242 (Visa)
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 123456

### 3. Test Webhook
```bash
# Simulate webhook locally using curl
curl -X POST http://localhost:3000/functions/v1/paystack-webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <computed-signature>" \
  -d '{
    "event": "charge.success",
    "data": {
      "id": 12345,
      "reference": "RENT-...",
      "amount": 5000000,
      "currency": "KES",
      "status": "success",
      "paid_at": "2024-03-04T10:30:00Z",
      "metadata": {}
    }
  }'
```

### 4. Verify Database Updates
After successful payment:
```sql
-- Check invoice is marked paid
SELECT id, status, paid_at FROM invoices WHERE id = 'invoice-uuid';

-- Check payment record created
SELECT id, gateway, status FROM payments WHERE invoice_id = 'invoice-uuid';

-- Check receipt created
SELECT receipt_number FROM receipts WHERE invoice_id = 'invoice-uuid';
```

---

## Dashboard Synchronization

### Tenant Dashboard
- **Page:** `src/pages/portal/tenant/PaymentsTenantNew.tsx`
- **Updates:**
  - Invoice status changes
  - Payment appears in history
  - Receipt available for download
- **Real-time:** Uses Supabase realtime subscriptions

### Property Manager Dashboard
- **Updates:**
  - Payment appears under property
  - Invoice marked paid
  - Tenant payment history updated
- **Implementation:** Add payment subscription in manager payments view

### Super Admin Dashboard
- **Updates:**
  - Global payment record
  - Revenue totals updated
  - Payment analytics
- **Implementation:** Add subscription for all payments

---

## Error Handling

### Common Errors & Solutions

#### 1. Webhook Signature Invalid
- **Cause:** `PAYSTACK_WEBHOOK_SECRET` mismatch
- **Solution:** Verify secret in both Paystack dashboard & Supabase environment

#### 2. Invoice Not Found
- **Cause:** Invalid tenantId or invoiceId
- **Solution:** Check metadata in Paystack transaction

#### 3. Amount Mismatch
- **Cause:** Client modified amount before payment
- **Solution:** Server-side validation rejects
- **Result:** Payment created but invoice NOT marked paid

#### 4. Duplicate Payment
- **Cause:** Webhook retried by Paystack
- **Solution:** Idempotency check using `reference` field

#### 5. Webhook Timeout
- **Cause:** Edge Function processing too slow
- **Solution:** Return 200 OK immediately, process async

---

## Security Considerations

✅ **Implemented:**
- Secret keys in backend environment only
- Webhook signature verification (HMAC SHA512)
- Server-side amount validation
- Idempotency to prevent duplicate processing
- Invoice status validation before payment
- No client-side payment confirmation

⚠️ **Important:**
- Never expose `PAYSTACK_SECRET_KEY` in frontend code
- Always verify webhook signature
- Use environment variables, not hardcoded secrets
- Enable RLS on database tables
- Regularly rotate webhook secrets

---

## Deployment Checklist

- [ ] Paystack webhook URL configured
- [ ] API keys in environment variables (.env)
- [ ] Database migration applied
- [ ] Edge Functions deployed
- [ ] Frontend routes updated
- [ ] Real-time subscriptions configured
- [ ] Error handling tested
- [ ] Webhook signature verification tested
- [ ] Receipt generation working
- [ ] Dashboard updates verified
- [ ] Load testing completed
- [ ] Monitoring configured

---

## Support & Troubleshooting

### Paystack Documentation
- https://paystack.com/docs/

### Supabase Edge Functions
- https://supabase.com/docs/guides/functions

### Testing
- Use Paystack test API keys
- Monitor webhook logs in Paystack dashboard
- Check Supabase function logs for errors

### Contact
For issues with Paystack, contact: support@paystack.co
