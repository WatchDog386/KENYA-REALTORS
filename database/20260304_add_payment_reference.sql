-- ============================================================================
-- ADD PAYMENT_REFERENCE COLUMN TO BILLS & UTILITIES
-- Date: March 4, 2026
-- Purpose: Track Paystack transaction references for bill payments
-- ============================================================================

BEGIN;

-- Add payment_reference column to bills_and_utilities table
ALTER TABLE public.bills_and_utilities
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Create index for faster lookups by payment reference
CREATE INDEX IF NOT EXISTS idx_bills_utilities_payment_reference 
ON public.bills_and_utilities(payment_reference);

-- Add transaction_id column to rent_payments if missing (for consistency)
ALTER TABLE public.rent_payments
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Create index for rent_payments transaction lookup
CREATE INDEX IF NOT EXISTS idx_rent_payments_transaction_id 
ON public.rent_payments(transaction_id);

-- Add transaction_id as alias to payment_reference for bills_and_utilities
-- (both refer to Paystack transaction reference)
COMMENT ON COLUMN public.bills_and_utilities.payment_reference IS 'Paystack transaction reference for tracking payment verification';
COMMENT ON COLUMN public.rent_payments.transaction_id IS 'Paystack transaction reference for tracking payment verification';

COMMIT;
