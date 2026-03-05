-- ============================================================================
-- FIX RECEIPTS RLS FOR TENANT PAYMENT FLOW
-- Date: March 4, 2026
-- Purpose: Allow tenants to insert and view their own receipts after Paystack success
-- ============================================================================

BEGIN;

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Keep accountant visibility
DROP POLICY IF EXISTS "Accountants can view all receipts" ON public.receipts;
CREATE POLICY "Accountants can view all receipts" ON public.receipts
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')
    )
  );

-- Tenants can view their own receipts by either tenant_id or generated_by
DROP POLICY IF EXISTS "Tenants can view their own receipts" ON public.receipts;
CREATE POLICY "Tenants can view their own receipts" ON public.receipts
  FOR SELECT
  USING (
    auth.uid() = tenant_id
    OR auth.uid() = generated_by
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')
    )
  );

-- Tenants can create receipts for their own successful payments
DROP POLICY IF EXISTS "Tenants can insert own receipts" ON public.receipts;
CREATE POLICY "Tenants can insert own receipts" ON public.receipts
  FOR INSERT
  WITH CHECK (
    auth.uid() = tenant_id
    OR auth.uid() = generated_by
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')
    )
  );

COMMIT;
