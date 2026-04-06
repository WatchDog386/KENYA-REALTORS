-- ============================================================================
-- UPDATE RENT PAYMENTS AND BILLS TO INCLUDE RECEIPT STATUS
-- Date: February 28, 2026
-- ============================================================================

BEGIN;

-- Add receipt_generated column to rent_payments
ALTER TABLE public.rent_payments
ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL;

-- Add receipt_generated column to bills_and_utilities
ALTER TABLE public.bills_and_utilities
ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rent_payments_receipt_id ON public.rent_payments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_bills_utilities_receipt_id ON public.bills_and_utilities(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_by ON public.receipts(generated_by);

COMMIT;
