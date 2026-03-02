# Tenant Payments System - Redesign Documentation

## Overview

The tenant payments page has been completely redesigned to provide a modern, user-friendly interface for managing rent and utility bill payments. The system now includes:

1. **Comprehensive Bill Statement** - Shows rent + utilities combined in one clear view
2. **Visual Breakdown** - Separate sections for rent and utility charges with detailed calculations
3. **Combined Payment Option** - Tenants can pay all outstanding bills at once
4. **Enhanced Security** - Secure Paystack integration with real-time payment status updates
5. **Automatic Synchronization** - Payment updates automatically sync across property manager and superadmin dashboards

## Key Features

### 1. Redesigned Payments Page (`/pages/portal/tenant/Payments.tsx`)

#### Components:
- **Bill Statement Card**: Displays comprehensive summary of all charges
  - Total amount due with visual indicators
  - Breakdown of rent charges
  - Breakdown of utility bills
  - Payment buttons for each category

- **Summary Cards**: Quick overview of:
  - Total outstanding (rent + utilities)
  - Rent arrears
  - Utility bills arrears

- **Payment History Table**: Detailed view of all transactions with:
  - Payment description with icons
  - Due dates
  - Amount, paid amount, and balance
  - Payment status badges
  - Quick action buttons

#### Features:
```tsx
- Three-tab navigation: Overview, Rent Payments, Utility Bills
- Responsive design for mobile and desktop
- Real-time data fetching from Supabase
- Color-coded sections for quick identification
```

### 2. Enhanced Make Payment Page (`/pages/portal/tenant/MakePayment.tsx`)

#### Payment Type Selection:
- **Pay All Bills** (Recommended) - Pay combined rent and utilities
- **Rent Payment** - Pay only rent charges
- **Water Bill** - Pay utility charges
- **Electricity, Garbage, Other** - Pay specific utility types

#### Key Features:
```tsx
- "Pay All" functionality distributes payment across multiple bills
- Automatic calculation of total outstanding amount
- Detailed bill information cards
- Flexible amount input with validation
- Optional payment notes/remarks
- Secure Paystack gateway integration
```

#### Payment Distribution Logic:
When a tenant chooses "Pay All":
1. The system fetches all unpaid rent records
2. Fetches all unpaid utility bills for the unit
3. Divides the payment to cover rent first, then utilities
4. Updates both `rent_payments` and `bills_and_utilities` tables
5. Records transaction reference and payment status
6. Automatically sets status to 'completed' if bill is fully paid
7. Sets status to 'partial' if bill is partially paid

### 3. Billing Utilities (`/utils/billingCalculations.ts`)

Shared utility functions for all components:

```tsx
// Main functions:
fetchTenantBillingStatement()      // Get complete billing data
calculatePaymentDistribution()     // Distribute payment across bills
updatePaymentRecords()             // Update payment status in DB
formatCurrency()                   // Format amounts in KES
formatDate()                       // Format dates consistently
getStatusColor()                   // Get color coding for status
```

## Data Flow

### Payment Processing Flow:

```
Tenant Views Payments Page
    ↓
Fetches Rent Payments + Utility Bills from Supabase
    ↓
Displays Bill Statement with Breakdown
    ↓
Tenant Clicks "Make Payment"
    ↓
Selects Payment Type (All/Rent/Utilities)
    ↓
Enters Amount (or auto-filled if "Pay All")
    ↓
Paystack Dialog Opens
    ↓
Tenant Completes Paystack Payment
    ↓
On Success: Updates rent_payments & bills_and_utilities tables
    ↓
Sets payment_method='paystack', status='completed'/'partial'
    ↓
Records transaction_reference & paid_date
    ↓
Property Manager sees update in real-time
    ↓
SuperAdmin sees update in reports
```

### Database Updates:

**Rent Payments Table** (`rent_payments`):
```sql
UPDATE rent_payments
SET 
  amount_paid = amount_paid + payment,
  status = CASE WHEN amount_paid + payment >= amount THEN 'completed' ELSE 'partial' END,
  payment_method = 'paystack',
  paid_date = NOW(),
  transaction_reference = transactionRef,
  remarks = remarks || 'Partial payment via Paystack'
WHERE id = rent_id
```

**Bills & Utilities Table** (`bills_and_utilities`):
```sql
UPDATE bills_and_utilities
SET 
  paid_amount = paid_amount + payment,
  status = CASE WHEN paid_amount + payment >= amount THEN 'completed' ELSE 'partial' END,
  payment_reference = transactionRef,
  remarks = remarks || 'Partial payment via Paystack'
WHERE id = bill_id
```

## Integration with Other Dashboards

### Property Manager Dashboard:
- The ManagerRentCollection component automatically displays updated payment status
- Uses real-time Supabase subscriptions
- Shows "Paid" status when `rent_payments.status = 'completed'`
- Shows "Unpaid" balance when `amount - amount_paid > 0`

### SuperAdmin Dashboard:
- Reports component fetches latest payment data
- Calculates arrears based on current `amount_paid` fields
- Shows collection status and trends

## User Interactions

### Tenant Journey:

1. **View Payments**:
   - Navigate to "My Payments"
   - See total bill breakdown (rent + utilities)
   - Review payment history

2. **Make Payment**:
   - Click "Make Payment" button
   - Select "Pay All Bills" (recommended)
   - Review calculated amount
   - Enter optional payment notes
   - Complete Paystack payment

3. **Payment Confirmation**:
   - Instant success message
   - Redirect to payment history
   - See updated payment status
   - Receive email receipt (via Paystack)

### Property Manager Journey:

1. **Monitor Collections**:
   - View ManagerRentCollection page
   - See real-time payment updates
   - Identify outstanding arrears
   - Track collection trends

2. **Track Tenant Payments**:
   - Status updates to 'completed' or 'partial'
   - Transaction reference recorded
   - Payment date tracked
   - Payment method stored (Paystack)

## Security Features

1. **Secure Payment Processing**:
   - All payments through Paystack
   - Card details never stored on servers
   - PCI DSS compliance

2. **Data Protection**:
   - Row Level Security (RLS) policies on all tables
   - Tenants can only view their own payments
   - Managers can only view their assigned properties
   - Transaction references for audit trail

3. **Payment Validation**:
   - Amount validation before processing
   - User email verification
   - Transaction success confirmation

## Status Codes

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `pending` | Bill created, no payment yet | Pay required |
| `paid` | Fully paid (legacy) | None |
| `completed` | Bill fully paid via payment | None |
| `partial` | Partially paid | Pay remaining balance |
| `overdue` | Due date passed, unpaid | Urgent payment |
| `open` | New bill, awaiting payment | Pay |

## Testing Checklist

- [ ] Tenant can view bill statement
- [ ] Rent and utility amounts calculated correctly
- [ ] "Pay All" option available
- [ ] Single payment type selection works
- [ ] Amount pre-fills when navigating from history
- [ ] Paystack dialog opens correctly
- [ ] Payment success updates database
- [ ] Status changes from 'partial' to 'completed' when fully paid
- [ ] Property manager sees updates in real-time
- [ ] SuperAdmin reports show correct totals
- [ ] Transaction references recorded
- [ ] Payment history shows all transactions
- [ ] Mobile responsive design works
- [ ] Error messages display correctly

## API Endpoints Used

- `supabase.from('rent_payments').select()` - Fetch rent
- `supabase.from('bills_and_utilities').select()` - Fetch utilities
- `supabase.from('tenants').select()` - Get tenant unit info
- Paystack API - Process payment
- Real-time subscriptions for live updates

## Future Enhancements

1. **Recurring Payments**: Auto-charge for pending bills
2. **Payment Plans**: Allow tenants to set up installment plans
3. **Mobile App**: Native mobile payment app
4. **Payment Reminders**: Email/SMS before due dates
5. **Electronic Receipts**: Enhanced receipt with QR codes
6. **Analytics Dashboard**: Tenant payment health score
7. **Multiple Payment Methods**: Add M-Pesa, bank transfers, etc.

## Troubleshooting

### Issue: Payment updates not showing in manager dashboard
**Solution**: Check Supabase real-time subscription is active, refresh page if needed

### Issue: Amount showing incorrectly
**Solution**: Verify all records in database have `amount` field populated, check calculation logic

### Issue: Paystack dialog not opening
**Solution**: Verify user email is set, check Paystack API keys in environment variables

### Issue: Payment status not updating
**Solution**: Check database permissions (RLS policies), verify payment success callback is firing

## Support

For issues or questions about the new payments system:
1. Check the testing checklist above
2. Review database records for data integrity
3. Check browser console for errors
4. Verify Supabase connection and permissions
