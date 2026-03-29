-- Re-apply onboarding invoice visibility fixes (idempotent)
-- 1) Backfill invoices.tenant_id from APPLICANT_ID metadata for onboarding invoices
-- 2) Harden RLS to allow APPLICANT_ID-based access
-- 3) Ensure finalize_tenant_onboarding_invoice RPC uses the same ownership rule

-- Enable RLS on invoices (safe if already enabled)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- SECTION 1: DATA NORMALIZATION (tenant_id backfill for onboarding invoices)
-- ---------------------------------------------------------------------------
WITH onboarding_candidates AS (
  SELECT
    i.id,
    (regexp_match(coalesce(i.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid AS applicant_id
  FROM public.invoices i
  WHERE coalesce(i.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
)
UPDATE public.invoices i
SET tenant_id = c.applicant_id,
    updated_at = now()
FROM onboarding_candidates c
WHERE i.id = c.id
  AND c.applicant_id IS NOT NULL
  AND i.tenant_id IS DISTINCT FROM c.applicant_id;

-- ---------------------------------------------------------------------------
-- SECTION 2: RLS POLICY HARDENING FOR TENANT ACCESS
-- ---------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "Tenants can update their own invoices" ON public.invoices;
CREATE POLICY "Tenants can update their own invoices"
ON public.invoices
FOR UPDATE
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
)
WITH CHECK (
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

-- ---------------------------------------------------------------------------
-- SECTION 3: RPC OWNERSHIP CHECK ALIGNMENT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_tenant_onboarding_invoice(
  p_invoice_id uuid,
  p_payment_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_invoice public.invoices%ROWTYPE;
  v_unit_id uuid;
  v_unit_number text;
  v_property_id uuid;
  v_property_name text;
  v_tenant_profile_id uuid;
  v_application_id uuid;
  v_lease_id uuid;
  v_now timestamptz := now();
  v_active_unit_lease_id uuid;
  v_active_unit_lease_tenant_id uuid;
  v_conflict_lease_id uuid;
  v_rent_amount numeric := 0;
  v_existing_notes text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT i.*
    INTO v_invoice
  FROM public.invoices i
  WHERE i.id = p_invoice_id
    AND (
      i.tenant_id = v_actor
      OR EXISTS (
        SELECT 1
        FROM public.tenants t
        WHERE t.id = i.tenant_id
          AND t.user_id = v_actor
      )
      OR (
        coalesce(i.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
        AND (regexp_match(coalesce(i.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid = v_actor
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found or access denied' USING ERRCODE = '42501';
  END IF;

  v_unit_id := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)UNIT_ID:([0-9a-fA-F-]{36})'))[1]::uuid;
  v_unit_number := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)UNIT_NUMBER:([^;\n\r]+)'))[1];
  v_property_id := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)PROPERTY_ID:([0-9a-fA-F-]{36})'))[1]::uuid;
  v_property_name := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)PROPERTY_NAME:([^;\n\r]+)'))[1];
  v_tenant_profile_id := coalesce(
    (regexp_match(coalesce(v_invoice.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid,
    v_invoice.tenant_id,
    v_actor
  );
  v_application_id := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)LEASE_APPLICATION_ID:([0-9a-fA-F-]{36})'))[1]::uuid;
  v_lease_id := (regexp_match(coalesce(v_invoice.notes, ''), '(?i)LEASE_ID:([0-9a-fA-F-]{36})'))[1]::uuid;

  IF v_lease_id IS NOT NULL AND (v_unit_id IS NULL OR v_tenant_profile_id IS NULL OR v_property_id IS NULL) THEN
    SELECT tl.unit_id, tl.tenant_id
      INTO v_unit_id, v_tenant_profile_id
    FROM public.tenant_leases tl
    WHERE tl.id = v_lease_id
    LIMIT 1;
  END IF;

  IF v_property_id IS NULL AND v_unit_id IS NOT NULL THEN
    SELECT u.property_id
      INTO v_property_id
    FROM public.units u
    WHERE u.id = v_unit_id
    LIMIT 1;
  END IF;

  IF v_property_id IS NULL AND v_property_name IS NOT NULL AND btrim(v_property_name) <> '' THEN
    SELECT p.id
      INTO v_property_id
    FROM public.properties p
    WHERE lower(p.name) = lower(btrim(v_property_name))
    LIMIT 1;
  END IF;

  IF v_unit_id IS NULL AND v_unit_number IS NOT NULL AND btrim(v_unit_number) <> '' THEN
    SELECT u.id, u.property_id
      INTO v_unit_id, v_property_id
    FROM public.units u
    WHERE u.unit_number = btrim(v_unit_number)
      AND (v_property_id IS NULL OR u.property_id = v_property_id)
    ORDER BY u.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_tenant_profile_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant profile metadata on invoice';
  END IF;

  IF v_unit_id IS NULL THEN
    RAISE EXCEPTION 'Missing unit metadata on invoice';
  END IF;

  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Missing property metadata on invoice';
  END IF;

  SELECT tl.id, tl.tenant_id
    INTO v_active_unit_lease_id, v_active_unit_lease_tenant_id
  FROM public.tenant_leases tl
  WHERE tl.unit_id = v_unit_id
    AND tl.status IN ('active', 'approved', 'manager_approved', 'pending')
  ORDER BY tl.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_active_unit_lease_id IS NOT NULL AND v_active_unit_lease_tenant_id IS DISTINCT FROM v_tenant_profile_id THEN
    RAISE EXCEPTION 'Unit is already assigned to another tenant.';
  END IF;

  SELECT tl.id
    INTO v_conflict_lease_id
  FROM public.tenant_leases tl
  WHERE tl.tenant_id = v_tenant_profile_id
    AND tl.unit_id <> v_unit_id
    AND tl.status IN ('active', 'approved', 'manager_approved', 'pending')
  ORDER BY tl.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_conflict_lease_id IS NOT NULL THEN
    RAISE EXCEPTION 'Tenant already has an active unit assignment.';
  END IF;

  UPDATE public.tenants
  SET property_id = v_property_id,
      unit_id = v_unit_id,
      status = 'active',
      move_in_date = v_now
  WHERE user_id = v_tenant_profile_id;

  IF NOT FOUND THEN
    INSERT INTO public.tenants (user_id, property_id, unit_id, status, move_in_date)
    VALUES (v_tenant_profile_id, v_property_id, v_unit_id, 'active', v_now);
  END IF;

  IF v_active_unit_lease_id IS NOT NULL THEN
    UPDATE public.tenant_leases
    SET tenant_id = v_tenant_profile_id,
        status = 'active',
        start_date = coalesce(start_date, v_now)
    WHERE id = v_active_unit_lease_id;
  ELSE
    v_rent_amount := coalesce(nullif(v_invoice.items->>'monthly_rent', '')::numeric, 0);

    IF v_rent_amount <= 0 THEN
      SELECT coalesce(nullif(u.price, 0), put.price_per_unit, 0)
        INTO v_rent_amount
      FROM public.units u
      LEFT JOIN public.property_unit_types put ON put.id = u.unit_type_id
      WHERE u.id = v_unit_id
      LIMIT 1;
    END IF;

    INSERT INTO public.tenant_leases (tenant_id, unit_id, status, start_date, rent_amount)
    VALUES (v_tenant_profile_id, v_unit_id, 'active', v_now, coalesce(v_rent_amount, 0));
  END IF;

  UPDATE public.units
  SET status = 'occupied'
  WHERE id = v_unit_id;

  UPDATE public.profiles
  SET role = 'tenant',
      user_type = 'tenant',
      status = 'active',
      is_active = true,
      assigned_property_id = v_property_id,
      updated_at = v_now
  WHERE id = v_tenant_profile_id;

  IF v_application_id IS NOT NULL THEN
    UPDATE public.lease_applications
    SET status = 'approved'
    WHERE id = v_application_id;
  ELSE
    UPDATE public.lease_applications
    SET status = 'approved'
    WHERE applicant_id = v_tenant_profile_id
      AND unit_id = v_unit_id
      AND status IN ('under_review', 'invoice_sent', 'manager_approved', 'approved', 'pending');
  END IF;

  v_existing_notes := coalesce(v_invoice.notes, '');

  IF position('TENANT_ASSIGNED_AT:' in v_existing_notes) = 0 THEN
    v_existing_notes := concat_ws(E'\n', nullif(v_existing_notes, ''), 'TENANT_ASSIGNED_AT:' || v_now::text);
  END IF;

  IF p_payment_reference IS NOT NULL AND p_payment_reference <> ''
     AND position('PAYMENT_REFERENCE:' || p_payment_reference in v_existing_notes) = 0 THEN
    v_existing_notes := concat_ws(E'\n', nullif(v_existing_notes, ''), 'PAYMENT_REFERENCE:' || p_payment_reference);
  END IF;

  UPDATE public.invoices
  SET status = 'paid',
      notes = v_existing_notes
  WHERE id = v_invoice.id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice.id,
    'tenant_profile_id', v_tenant_profile_id,
    'unit_id', v_unit_id,
    'property_id', v_property_id,
    'lease_application_id', v_application_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_tenant_onboarding_invoice(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_tenant_onboarding_invoice(uuid, text) TO authenticated;
