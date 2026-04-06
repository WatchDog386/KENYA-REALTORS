-- Supplier procurement workflow support
-- Adds supplier invoice fields and grants supplier-scoped access to procurement rows.

ALTER TABLE IF EXISTS public.maintenance_completion_reports
  ADD COLUMN IF NOT EXISTS supplier_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS supplier_invoice_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS supplier_invoice_notes TEXT,
  ADD COLUMN IF NOT EXISTS supplier_invoice_image_url TEXT,
  ADD COLUMN IF NOT EXISTS supplier_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mcr_supplier_email ON public.maintenance_completion_reports(supplier_email);
CREATE INDEX IF NOT EXISTS idx_mcr_supplier_status ON public.maintenance_completion_reports(status);

ALTER TABLE IF EXISTS public.maintenance_completion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers view own procurement reports" ON public.maintenance_completion_reports;
CREATE POLICY "Suppliers view own procurement reports"
ON public.maintenance_completion_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supplier'
  )
  AND lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "Suppliers update own procurement reports" ON public.maintenance_completion_reports;
CREATE POLICY "Suppliers update own procurement reports"
ON public.maintenance_completion_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supplier'
  )
  AND lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supplier'
  )
  AND lower(coalesce(supplier_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
