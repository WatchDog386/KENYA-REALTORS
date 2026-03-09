-- ============================================================================
-- UPDATE RECEIPTS TABLE TO INCLUDE METADATA
-- Date: February 28, 2026
-- ============================================================================

BEGIN;

-- Add metadata column if it doesn't exist
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add status column if it doesn't exist
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed', 'downloaded'));

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Tenants can view their own receipts" ON public.receipts;
CREATE POLICY "Tenants can view their own receipts" ON public.receipts
    FOR SELECT USING (
        auth.uid() = generated_by OR
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin'))
    );

COMMIT;
