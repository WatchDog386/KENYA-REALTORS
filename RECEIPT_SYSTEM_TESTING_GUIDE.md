# Receipt System Implementation - Testing Guide

## System Overview

The receipt generation and payment tracking system is now fully integrated across all three user roles:

### 1. **Tenant Dashboard** (`src/pages/portal/tenant`)
- **Payments.tsx**: Smart payment selector with rent/utilities breakdown
- **MakePayment.tsx**: Automatic receipt generation on payment success
- **TenantReceipts.tsx** (in Receipts tab): View, download, and manage receipts

**Key Features:**
- Itemized payment selection (individual utilities or combined)
- Automatic receipt generation per payment
- Receipt number format: RCP-YYYYMMDD-XXXX (unique & auditable)
- Download receipts as PDF
- Email receipt resend capability

---

### 2. **Accountant Dashboard** (`src/pages/portal/accountant`)
- **AccountantReceipts.tsx**: Full receipt management system

**Key Features:**
- View all tenant receipts with property/tenant details
- Send receipts to tenant emails via Supabase Edge Function
- Download receipts as PDF
- Track receipt status (generated → sent → viewed → downloaded)
- Receipt preview dialog with metadata

---

### 3. **Property Manager Dashboard** (`src/pages/portal/manager`)
- **Payments.tsx** (Updated): Receipt-aware payment tracking

**Key Features:**
- View rent & utility payments for managed properties
- See receipt generation status for each payment
- View receipt details in preview dialog
- Receipt number tracking for audit trail

---

### 4. **Super Admin Dashboard** (`src/pages/portal/super-admin`)
- **ReceiptsManagement.tsx** (New): Comprehensive receipt oversight

**Key Features:**
- View ALL receipts across all properties/tenants
- Advanced filtering (by status, tenant, date range)
- Receipt statistics (total amount, sent count, pending)
- Download any receipt as PDF
- Complete audit trail

---

## Database Schema

### Receipts Table Fields:
```
- id: UUID (primary key)
- receipt_number: VARCHAR (unique) - RCP-YYYYMMDD-XXXX format
- invoice_id: UUID (foreign key to invoices)
- amount_paid: DECIMAL
- payment_date: TIMESTAMP
- payment_method: VARCHAR (paystack, manual, etc.)
- status: VARCHAR (generated, sent, viewed, downloaded)
- metadata: JSONB {
    tenant_name: string,
    property_name: string,
    transaction_reference: string,
    items: Array<{description, amount}>,
    email: string
  }
- generated_by: UUID (user who created receipt)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Linking Tables:
- `rent_payments.receipt_id` → receipts.id
- `rent_payments.receipt_generated` → boolean flag
- `bills_and_utilities.receipt_id` → receipts.id
- `bills_and_utilities.receipt_generated` → boolean flag

---

## Payment Flow to Receipt

```javascript
// 1. Tenant selects items and initiates payment
User selects: Rent + Electricity + Water (in MakePayment.tsx)

// 2. Payment succeeds via Paystack
handlePaystackPaymentSuccess() triggered

// 3. Receipt generation begins
Building receipt items array:
[
  { description: 'Rent Payment', amount: 50000, type: 'rent' },
  { description: 'Electricity', amount: 3500, type: 'electricity' },
  { description: 'Water', amount: 1200, type: 'water' }
]

// 4. Receipt record created
INSERT INTO receipts VALUES {
  receipt_number: 'RCP-20250228-0001',
  amount_paid: 54700,
  payment_date: now(),
  status: 'generated',
  metadata: {
    items: [...],
    tenant_name: 'John Doe',
    property_name: 'Highrise Tower',
    transaction_reference: 'paystack_ref_12345'
  }
}

// 5. Email notification sent (async)
supabase.functions.invoke('send-payment-receipt', {
  to_email: tenant@example.com,
  receipt_number: 'RCP-20250228-0001',
  items: [...],
  amount: 54700
})

// 6. Status updates occur
Receipt Status Lifecycle:
- generated: Receipt created in database
- sent: Email delivered to tenant
- viewed: Tenant opened receipt in dashboard
- downloaded: Tenant downloaded PDF
```

---

## Testing Scenarios

### Test 1: Rent-Only Payment
**Setup:** Tenant owes 50,000 KSH rent

**Steps:**
1. Go to Tenant Dashboard → Payments
2. Click "Rent Only" button
3. Proceed to payment with amount 50,000
4. Complete Paystack payment
5. Verify receipt shown in success message
6. Check TenantReceipts tab for receipt

**Expected Results:**
- Receipt generated with rent item only
- Accountant Dashboard shows receipt with status "generated"
- Receipt number follows format RCP-YYYYMMDD-XXXX
- Can download and view receipt

---

### Test 2: Utilities-Only Payment
**Setup:** Tenant owes: Electricity 3,500, Water 1,200, Garbage 600, Security 2,000

**Steps:**
1. Go to Tenant Dashboard → Payments
2. Expand utilities section
3. Select individual items or click "Utilities Only"
4. Proceed with selected amounts
5. Complete payment
6. Verify itemized receipt

**Expected Results:**
- Receipt shows all 4 utility items with separate amounts
- Total = 7,300 KSH
- Each item listed in receipt metadata

---

### Test 3: Combined Payment
**Setup:** Tenant owes rent + multiple utilities

**Steps:**
1. Go to Tenant Dashboard → Payments
2. Select Rent checkbox
3. Expand utilities & select specific items
4. Total updates in real-time
5. Click "Proceed with Selected"
6. Complete payment

**Expected Results:**
- Receipt contains both rent and selected utility items
- Amounts calculated correctly
- Receipt available in all dashboards

---

### Test 4: Accountant Sends Receipt Email
**Setup:** Receipt exists in "generated" status

**Steps:**
1. Go to Accountant Dashboard → Receipts
2. Find receipt from Test 1-3
3. Click "Send" button
4. Verify success message
5. Check receipt status updated to "sent"

**Expected Results:**
- Toast shows: "Receipt sent to [email]"
- Receipt.status = "sent" in database
- Tenant receives email with receipt details

---

### Test 5: Property Manager Views Payment Receipt
**Setup:** Payment made with receipt generated

**Steps:**
1. Go to Property Manager Dashboard → Payments
2. Scroll to receipt status column
3. Click eye icon for receipt
4. View receipt details in modal

**Expected Results:**
- Receipt status shows "generated" or "sent"
- Receipt number visible
- Items breakdown shown
- Can download receipt PDF

---

### Test 6: Super Admin Oversight
**Setup:** Multiple payments with receipts

**Steps:**
1. Go to Super Admin → Receipts Management
2. View receipt stats (total receipts, total amount, sent count)
3. Search by tenant name or receipt number
4. Filter by status (generated, sent, etc.)
5. Preview receipt details
6. Download receipt

**Expected Results:**
- Stats show: Total = 3 receipts, Amount = 112,000, Sent = 2, Pending = 1
- Search functionality works
- Filters narrow results correctly
- Can view any receipt details

---

## Calculation Verification

### Test Case: Combined Payment with 4 Items

```
Rent:              50,000.00
Electricity:        3,500.00
Water:              1,200.00
Garbage:              600.00
Security:           2,000.00
                   ----------
TOTAL:             57,300.00
```

**Verification Points:**
1. Each item amount = correct calculation from rates
2. Sum in receipt metadata = sum in receipt.amount_paid
3. Downloaded PDF shows correct amounts
4. Email template displays formatted currency correctly

---

## Edge Function Email Delivery

### Function: `send-payment-receipt`
**Path:** `supabase/functions/send-payment-receipt/index.ts`

**Triggers On:**
- Accountant clicks "Send" button in AccountantReceipts
- Manual resend from TenantReceipts

**Request Payload:**
```javascript
{
  to_email: "tenant@example.com",
  receipt_number: "RCP-20250228-0001",
  tenant_name: "John Doe",
  amount: 57300,
  items: [...],
  payment_date: "2025-02-28",
  payment_method: "paystack",
  transaction_reference: "ref_12345",
  resend: false
}
```

**Response:**
```javascript
{
  success: true,
  message: "Receipt RCP-20250228-0001 processed for tenant@example.com",
  data: {
    receipt_number: "RCP-20250228-0001",
    email: "tenant@example.com",
    amount: 57300
  }
}
```

---

## Status Tracking

### Receipt Status Transitions

```
┌───────────┐
│ generated │  ← Receipt created on payment success
└─────┬─────┘
      │ (Accountant sends email)
┌─────▼─────┐
│   sent    │  ← Email delivered to tenant
└─────┬─────┘
      │ (Tenant opens receipt)
┌─────▼─────┐
│  viewed   │  ← Tenant viewed receipt
└─────┬─────┘
      │ (Tenant downloads PDF)
┌─────▼──────────┐
│  downloaded    │  ← PDF downloaded
└────────────────┘
```

---

## Calculation Accuracy Checks

### 1. Receipt Item Amount Calculation
```typescript
// In receiptGenerator.ts - buildReceiptItems()
receiptItems.forEach(item => {
  const itemAmount = payment.amount * (item.type === 'rent' ? 1 : rate);
  receipt.items.push({
    description: item.label,
    amount: itemAmount,
    type: item.type
  });
});
```

### 2. Total Amount Verification
```typescript
const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
receipt.amount_paid === totalAmount // Must be TRUE
```

### 3. UI Calculation (Tenant Payment Selection)
```typescript
const selectedItemsTotal = selectedItems
  .map(id => itemsMap[id].amount)
  .reduce((sum, amt) => sum + amt, 0);
```

---

## RLS Policies for Receipt Access

### Tenant Access
```sql
-- Tenants can only see their own receipts
SELECT * FROM receipts 
WHERE generated_by = auth.uid()
```

### Accountant Access
```sql
-- Accountants can see all receipts
SELECT * FROM receipts
-- No WHERE clause - full access
```

### Super Admin Access
```sql
-- Super admins can see all receipts across tenants/properties
SELECT * FROM receipts
-- No WHERE clause - full access
```

---

## Troubleshooting

### Issue: Receipt not appearing after payment
**Solution:**
1. Check if receipt was created: `SELECT * FROM receipts WHERE payment_date = TODAY()`
2. Verify Paystack payment response includes success flag
3. Check browser console for errors during payment success handler

### Issue: Email not received
**Solution:**
1. Verify tenant email in their profile
2. Check `receipts.metadata.email` field is populated
3. Verify Edge Function is deployed
4. Check Resend API key in Supabase env vars
5. Review function logs in Supabase Dashboard

### Issue: Amounts don't match
**Solution:**
1. Verify selected items in Payments component
2. Check receipt_items array building in MakePayment.tsx
3. Compare receipt.amount_paid with sum of items
4. Check utility rate calculations

---

## File Locations Reference

```
src/
├── utils/
│   └── receiptGenerator.ts          # Core receipt functions
├── components/
│   └── TenantReceipts.tsx           # Tenant receipt component
├── pages/portal/
│   ├── tenant/
│   │   ├── Payments.tsx            # Smart payment selector
│   │   ├── MakePayment.tsx         # Payment + receipt generation
│   │   └── [TenantReceipts tab]    # Receipts display
│   ├── accountant/
│   │   └── AccountantReceipts.tsx  # Receipt management
│   ├── manager/
│   │   └── Payments.tsx            # Receipt-aware payments view
│   └── super-admin/
│       └── ReceiptsManagement.tsx  # Receipt oversight
└── supabase/
    └── functions/
        └── send-payment-receipt/
            └── index.ts            # Email delivery function

database/
├── 20260228_update_receipts_metadata.sql    # Metadata columns
└── 20260228_add_receipt_tracking.sql        # Receipt linking
```

---

## Success Criteria

✅ **Receipt Generation**
- Automatic receipt on payment success
- Unique receipt number format
- All payment items captured
- Metadata stored correctly

✅ **Multi-Role Visibility**
- Tenant sees own receipts in dashboard
- Accountant manages all receipts
- Property Manager sees receipts for their properties
- Super Admin sees all receipts system-wide

✅ **Email Functionality**
- Receipt sent to tenant email
- Professional HTML template
- Status updated to "sent"
- Email can be resent by accountant

✅ **Calculations**
- Rent amount correct
- Utility amounts correct
- Total = sum of items
- Currency formatted properly

✅ **Download Functionality**
- PDF generates from receipt HTML
- Professional formatting preserved
- Receipt number visible
- Items breakdown visible

---

## Next Steps

1. **Deploy Edge Function**
   - Ensure Resend API key configured
   - Test email delivery

2. **Integrate Super Admin Routes**
   - Add ReceiptsManagement to super-admin routes
   - Add navigation link in super-admin dashboard

3. **Monitor & Logs**
   - Track receipt generation success rate
   - Monitor email delivery failures
   - Review calculation accuracy in production

4. **User Training**
   - Document accountant email sending process
   - Document property manager receipt viewing
   - Document super admin oversight capabilities

