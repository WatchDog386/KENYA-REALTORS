# Paystack Payment Integration Implementation Guide

## Overview
This document outlines the complete Paystack integration for rent and utility bill payments in the Realtors-Leasers system. All payments are now processed exclusively through Paystack with secure payment processing.

## Configuration

### Environment Variables
The following environment variables are configured in `.env`:

```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_test_e1d56a87e7249cbeee059a1cf17e7b1b99ec9b4e
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
VITE_PAYMENT_CURRENCY=KES
```

**⚠️ IMPORTANT**: Replace the secret key with your actual secret key when generating new keys in Paystack Dashboard.

### Project Structure

```
src/
├── services/
│   ├── paystackService.ts           # Main Paystack API integration
│   └── paystackWebhookHandler.ts    # Webhook and verification handler
├── components/
│   └── dialogs/
│       └── PaystackPaymentDialog.tsx    # Paystack payment UI modal
└── pages/
    └── portal/
        └── tenant/
            ├── MakePayment.tsx      # Updated with Paystack integration
            └── Payments.tsx         # Updated with Paystack info banner
```

## Features

### 1. Tenant Dashboard Payment Flow

#### Payment Types Supported:
- Rent Payment
- Water Bill
- Electricity Bill
- Garbage Collection
- Other/Custom Payments

#### Payment Process:
1. **Tenant initiates payment** from the Tenant Dashboard
2. **Select payment type** (Rent, Water, Electricity, Garbage, Other)
3. **Enter payment amount** in KES (Kenyan Shillings)
4. **Optional remarks** for payment details
5. **Initiate Paystack payment** via `PaystackPaymentDialog` component
6. **Redirect to Paystack checkout** for secure payment
7. **Payment verification** and record update in Supabase
8. **Confirmation** and payment receipt

### 2. Property Manager Portal

Property managers can:
- View recent tenant payments
- Track payment methods (Paystack badge shows on all payments)
- See payment status and timing
- Access detailed payment report

## API Integration

### Key Services

#### `paystackService.ts`

**Initialize Payment**
```typescript
initializePaystackPayment({
  email: "tenant@example.com",
  amount: 10000,  // Amount in KES
  reference?: "unique-ref-123", // Optional
  description: "Rent Payment"
});
```

**Verify Payment**
```typescript
verifyPaystackTransaction("payment-reference");
```

**Other features:**
- Bank list retrieval
- Payment plan creation
- Authorization charging (for recurring payments)

#### `paystackWebhookHandler.ts`

Handles webhook events from Paystack:
- `charge.success` - Updates payment status
- `charge.failure` - Handles failed payments
- Verification and database updates

### Database Integration

Payments are stored in two tables:

**rent_payments table**
```sql
- id (UUID)
- tenant_id (UUID)
- property_id (UUID)
- unit_id (UUID)
- amount (DECIMAL)
- amount_paid (DECIMAL)
- payment_date (TIMESTAMP)
- due_date (TIMESTAMP)
- payment_method (TEXT) -- Now "paystack"
- status (TEXT) -- "pending", "partial", "completed"
- remarks (TEXT)
- transaction_reference (TEXT) -- Paystack reference
- created_at (TIMESTAMP)
```

**bills_and_utilities table**
```sql
- id (UUID)
- unit_id (UUID)
- bill_type (TEXT) -- "water", "electricity", "garbage", etc.
- amount (DECIMAL)
- paid_amount (DECIMAL)
- bill_date (TIMESTAMP)
- due_date (TIMESTAMP)
- status (TEXT) -- "pending", "partial", "completed"
- remarks (TEXT)
- payment_reference (TEXT) -- Paystack reference
- created_at (TIMESTAMP)
```

## Component Usage

### PaystackPaymentDialog Component

```typescript
import PaystackPaymentDialog from "@/components/dialogs/PaystackPaymentDialog";

<PaystackPaymentDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  email="tenant@example.com"
  amount={10000}
  description="October Rent Payment"
  paymentType="rent"
  referenceId="payment-id-123"
  onPaymentSuccess={(reference, details) => {
    // Handle successful payment
    console.log("Payment successful:", reference);
  }}
  onPaymentError={(error) => {
    // Handle error
    toast.error(error);
  }}
/>
```

## Payment Flow Diagram

```
Tenant Dashboard
      ↓
Select Payment Type
      ↓
Enter Amount & Remarks
      ↓
Click "Pay via Paystack"
      ↓
Paystack Payment Dialog Opens
      ↓
Paystack Checkout (Redirect)
      ↓
Verify Payment
      ↓
Update Supabase Records
      ↓
Show Confirmation & Receipt
```

## Testing

### Test Payment Credentials
- **Public Key (Test)**: pk_test_e1d56a87e7249cbeee059a1cf17e7b1b99ec9b4e
- **Secret Key (Test)**: sk_test_your_secret_key_here

### Test Card Numbers
Use these for testing in the Paystack test environment:

```
Success Cases:
- Card: 4084084084084081
- Expiry: Any future date
- CVV: Any 3 digits

Decline Cases:
- Card: 4111111111111111
- Expiry: Any future date
- CVV: Any 3 digits
```

### Testing Endpoints
1. Tenant Dashboard: `/portal/tenant`
2. Payments Page: `/portal/tenant/payments`
3. Make Payment: `/portal/tenant/payments/make?type=rent`

## Webhook Setup

### Paystack Dashboard Configuration

1. Go to **Settings** → **API Keys & Webhooks**
2. Add webhook URL (when deployed):
   ```
   https://your-domain.com/api/webhook/paystack
   ```
3. Select events: `charge.success`, `charge.failed`
4. Save webhook

### Webhook Handler
The `paystackWebhookHandler.ts` processes incoming webhook events and updates payment records in Supabase.

## Security Considerations

1. **Public Key Only Used in Frontend**
   - `VITE_PAYSTACK_PUBLIC_KEY` is safe to expose

2. **Secret Key Never Exposed**
   - `VITE_PAYSTACK_SECRET_KEY` should only be used server-side
   - Can be removed from client-side environment if needed

3. **Payment Verification**
   - All payments verified with Paystack before updating database
   - Transaction reference stored for audit trail

4. **SSL/HTTPS Required**
   - All payment communications must be over HTTPS
   - Paystack checkout enforces this automatically

5. **No Card Storage**
   - Card details never stored on our servers
   - All PCI compliance handled by Paystack

## Migration from M-Pesa

If users previously used M-Pesa:

1. **Old Records** remain unchanged with `payment_method = 'mpesa'`
2. **New Payments** use `payment_method = 'paystack'`
3. **Reports** can filter by payment method if needed
4. **User Education** must ensure tenants understand the switch

SQL to check current payment methods:
```sql
SELECT DISTINCT payment_method FROM rent_payments;
SELECT DISTINCT COUNT(*) as total FROM rent_payments WHERE payment_method = 'mpesa';
SELECT DISTINCT COUNT(*) as total FROM rent_payments WHERE payment_method = 'paystack';
```

## Troubleshooting

### Common Issues

**1. Payment Dialog Doesn't Open**
- Check `VITE_PAYSTACK_PUBLIC_KEY` is set correctly
- Verify Paystack script loads: `https://js.paystack.co/v1/inline.js`
- Check browser console for errors

**2. Payment Verification Fails**
- Ensure `VITE_PAYSTACK_SECRET_KEY` is correct
- Verify transaction reference is accurate
- Check Paystack API status

**3. Email Not Found**
- Ensure user is logged in before payment
- Check `useAuth()` context provides email
- Verify auth state is properly initialized

**4. Database Update Fails**
- Check Supabase connection
- Verify table structure matches schema
- Ensure RLS policies allow updates

## Future Enhancements

1. **Recurring Payments**
   - Use `chargeAuthorization` for monthly auto-payments
   - Requires customer authorization

2. **Payment Plans**
   - Create subscription plans for rent
   - Use Paystack plan API

3. **Mobile App Integration**
   - Deploy to iOS/Android with better UX
   - Use Paystack SDK for native integration

4. **Invoice Generation**
   - Create PDF receipts for payments
   - Auto-send to tenant email

5. **SMS Notifications**
   - Send payment confirmations via SMS
   - Send payment reminders

6. **Multi-Currency Support**
   - Allow USD, EUR payments
   - Auto-conversion with Paystack rates

## Support & Monitoring

### Paystack Dashboard
- Monitor transactions: https://dashboard.paystack.com
- View settlements and balance
- Check webhook logs
- Manage API keys and security

### Logs to Monitor
```typescript
// Payment initialization
console.log("Payment initialized:", paymentRef);

// Payment verification
console.log("Payment verified:", transactionData);

// Database updates
console.log("Payment recorded:", recordId);

// Errors
console.error("Payment error:", errorMessage);
```

## Additional Resources

- **Paystack Documentation**: https://paystack.com/doc
- **Paystack API Reference**: https://api.paystack.co/
- **Test Mode Guide**: https://paystack.com/faq/payments
- **Security Best Practices**: https://paystack.com/security

---

**Last Updated**: February 2026
**Integration Status**: ✅ Complete
**Payment Method**: Paystack (KES only)
