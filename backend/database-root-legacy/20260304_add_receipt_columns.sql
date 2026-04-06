-- ============================================================================
-- ADD MISSING COLUMNS TO RECEIPTS TABLE
-- Date: March 4, 2026
-- Purpose: Support tenant payment receipts with proper tracking
-- ============================================================================

BEGIN;

-- Add missing columns to receipts table for payment tracking
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'generated',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON public.receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_property_id ON public.receipts(property_id);
CREATE INDEX IF NOT EXISTS idx_receipts_unit_id ON public.receipts(unit_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_reference ON public.receipts(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);

-- Add comments for clarity
COMMENT ON COLUMN public.receipts.tenant_id IS 'Reference to the tenant who made the payment';
COMMENT ON COLUMN public.receipts.property_id IS 'Reference to the property where payment was made';
COMMENT ON COLUMN public.receipts.unit_id IS 'Reference to the unit in the property';
COMMENT ON COLUMN public.receipts.transaction_reference IS 'Paystack transaction reference for verification';
COMMENT ON COLUMN public.receipts.status IS 'Receipt status (generated, downloaded, emailed, etc.)';
COMMENT ON COLUMN public.receipts.metadata IS 'Additional receipt data (items, payment details, etc.)';

COMMIT;
