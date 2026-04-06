-- Ensure tenant application -> manager review -> invoice -> payment flow works across schema variants.

ALTER TABLE public.lease_applications ENABLE ROW LEVEL SECURITY;

-- Drop conflicting or legacy policies if they exist.
DROP POLICY IF EXISTS "Tenants can submit lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can view own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can update own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can view lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can update lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Super admins can manage all lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_select_own" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_insert_own" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_update_own" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_manager_select" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_manager_update" ON public.lease_applications;
DROP POLICY IF EXISTS "lease_applications_super_admin_all" ON public.lease_applications;

-- Tenant can submit applications only for themselves.
CREATE POLICY "Tenants can submit lease applications"
ON public.lease_applications
FOR INSERT
WITH CHECK (applicant_id = auth.uid());

-- Tenant can view their own applications.
CREATE POLICY "Tenants can view own lease applications"
ON public.lease_applications
FOR SELECT
USING (applicant_id = auth.uid());

-- Tenant can update only their own in-flight applications.
CREATE POLICY "Tenants can update own lease applications"
ON public.lease_applications
FOR UPDATE
USING (
  applicant_id = auth.uid()
  AND status IN ('pending', 'under_review')
)
WITH CHECK (
  applicant_id = auth.uid()
  AND status IN ('pending', 'under_review')
);

-- Manager can view applications for properties they manage.
-- Supports both assignment tables and profile.assigned_property_id fallback.
CREATE POLICY "Managers can view lease applications by assigned property"
ON public.lease_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
);

-- Manager can update review status for applications in assigned properties.
CREATE POLICY "Managers can update lease applications by assigned property"
ON public.lease_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
);

-- Super admins can manage all lease applications.
CREATE POLICY "Super admins can manage all lease applications"
ON public.lease_applications
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);

GRANT SELECT, INSERT, UPDATE ON public.lease_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_applications TO service_role;

CREATE INDEX IF NOT EXISTS idx_lease_applications_property_status_created_at
  ON public.lease_applications(property_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_applications_applicant_created_at
  ON public.lease_applications(applicant_id, created_at DESC);
