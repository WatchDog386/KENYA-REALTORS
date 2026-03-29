-- QUICK FIX: Allow tenant access to onboarding invoices via APPLICANT_ID in notes
-- This allows tenants to see their first-time payment invoices before they're assigned a tenant_id

DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;

CREATE POLICY "Tenants can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR auth.uid() = (
    SELECT t.user_id
    FROM public.tenants t
    WHERE t.id = invoices.tenant_id
    LIMIT 1
  )
  OR (
    coalesce(invoices.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
    AND (regexp_match(coalesce(invoices.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid = auth.uid()
  )
);

-- Optional: Also update invoices.tenant_id from APPLICANT_ID in notes (data backfill)
WITH onboarding_candidates AS (
  SELECT
    i.id,
    (regexp_match(coalesce(i.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid AS applicant_id
  FROM public.invoices i
  WHERE coalesce(i.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
    AND i.tenant_id IS NULL
)
UPDATE public.invoices i
SET tenant_id = c.applicant_id,
    updated_at = now()
FROM onboarding_candidates c
WHERE i.id = c.id
  AND c.applicant_id IS NOT NULL;
