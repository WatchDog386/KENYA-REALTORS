-- ============================================================================
-- RLS HARDENING + ROLE/ASSIGNMENT ENFORCEMENT (Minimal, DB-first)
-- Date: 2026-01-25
--
-- WHY this migration exists:
-- - Current policies include overly-broad access (e.g. "Authenticated users can view any profile"),
--   which violates tenant isolation and manager scoping requirements.
-- - The app currently updates `profiles.role` directly from the client; without DB-side safeguards,
--   that enables privilege escalation.
-- - Manager/property/tenant scoping must be enforced at the database level (RLS), not only UI.
-- ============================================================================

-- ----------------------------
-- 0) Helper role functions
-- ----------------------------

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_property_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'property_manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'tenant'
  );
$$;

-- Manager assignment check (many-to-many via manager_assignments)
CREATE OR REPLACE FUNCTION public.manager_has_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = p_property_id
      AND ma.manager_id = auth.uid()
      AND ma.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_has_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.user_id = auth.uid()
      AND t.property_id = p_property_id
      AND t.status IN ('active', 'pending', 'suspended')
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_has_unit(p_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.user_id = auth.uid()
      AND t.unit_id = p_unit_id
      AND t.status IN ('active', 'pending', 'suspended')
  );
$$;

-- ----------------------------
-- 1) Prevent role escalation
-- ----------------------------

CREATE OR REPLACE FUNCTION public.enforce_profile_role_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Non-super-admins may only create their own profile and may not self-assign privileged roles.
  IF NOT public.is_super_admin() THEN
    IF auth.uid() IS NULL OR NEW.id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot create profile for another user';
    END IF;

    IF NEW.role IS NOT NULL AND NEW.role <> 'tenant' THEN
      RAISE EXCEPTION 'Role assignment requires super admin approval';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_on_insert ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role_on_insert();

CREATE OR REPLACE FUNCTION public.enforce_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF public.is_super_admin() THEN
      RETURN NEW;
    END IF;

    -- Allow self-selection ONLY for tenant (from NULL/unassigned)
    IF auth.uid() = OLD.id
       AND NEW.role = 'tenant'
       AND (OLD.role IS NULL OR OLD.role = 'unassigned') THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Role changes require super admin approval';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_changes ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_changes
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role_changes();

-- ----------------------------
-- 2) Tenancy integrity checks
-- ----------------------------

-- Each tenant can only have one tenant record (hard business rule).
-- NOTE: If existing data violates this, you must clean duplicates before applying.
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenants_user_id ON public.tenants(user_id);

-- Only one active tenant per unit.
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenants_active_unit_id
ON public.tenants(unit_id)
WHERE status = 'active' AND unit_id IS NOT NULL;

-- Ensure tenant.property_id matches units.property_id when both are set.
CREATE OR REPLACE FUNCTION public.enforce_tenant_unit_property_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unit_property_id uuid;
BEGIN
  IF NEW.unit_id IS NOT NULL AND NEW.property_id IS NOT NULL THEN
    SELECT u.property_id INTO unit_property_id
    FROM public.units u
    WHERE u.id = NEW.unit_id;

    IF unit_property_id IS NULL THEN
      RAISE EXCEPTION 'Unit not found: %', NEW.unit_id;
    END IF;

    IF unit_property_id <> NEW.property_id THEN
      RAISE EXCEPTION 'Tenant property_id must match unit.property_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tenant_unit_property_match ON public.tenants;
CREATE TRIGGER trg_enforce_tenant_unit_property_match
BEFORE INSERT OR UPDATE OF unit_id, property_id ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_tenant_unit_property_match();

-- ----------------------------
-- 3) Normalize approval table columns (avoid schema drift breaking RLS)
-- ----------------------------

-- approval_queue: support both "requested_by" and "user_id" shapes.
ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS request_id text;

ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS request_data jsonb;

ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- approval_requests: support both "submitted_by" and "user_id" shapes.
ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ----------------------------
-- 4) RLS policy hardening
-- ----------------------------

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove overly-broad policies
DROP POLICY IF EXISTS "Authenticated users can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Keep/replace with scoped policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;
CREATE POLICY "profiles_select_super_admin" ON public.profiles
  FOR SELECT
  USING (public.is_super_admin());

-- Managers may view tenant profiles only for tenants in properties they are assigned to.
DROP POLICY IF EXISTS "profiles_select_manager_tenants" ON public.profiles;
CREATE POLICY "profiles_select_manager_tenants" ON public.profiles
  FOR SELECT
  USING (
    public.is_property_manager()
    AND EXISTS (
      SELECT 1
      FROM public.tenants t
      JOIN public.manager_assignments ma
        ON ma.property_id = t.property_id
       AND ma.manager_id = auth.uid()
       AND ma.status = 'active'
      WHERE t.user_id = public.profiles.id
    )
  );

-- Inserts: users can create their own profile (role restricted by trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Updates: users can update their own profile (role updates restricted by trigger)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can manage all profiles
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- PROPERTIES
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Everyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Property managers can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and managers can manage properties" ON public.properties;

CREATE POLICY "properties_select_super_admin" ON public.properties
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "properties_select_manager_assigned" ON public.properties
  FOR SELECT
  USING (public.is_property_manager() AND public.manager_has_property(public.properties.id));

CREATE POLICY "properties_select_tenant_own" ON public.properties
  FOR SELECT
  USING (public.is_tenant() AND public.tenant_has_property(public.properties.id));

CREATE POLICY "properties_write_super_admin" ON public.properties
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- UNITS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view property units" ON public.units;
DROP POLICY IF EXISTS "Admins and managers can manage units" ON public.units;
DROP POLICY IF EXISTS "units_select_manager_assigned" ON public.units;
DROP POLICY IF EXISTS "units_select_tenant_own" ON public.units;

CREATE POLICY "units_select_super_admin" ON public.units
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "units_select_manager_assigned" ON public.units
  FOR SELECT
  USING (public.is_property_manager() AND public.manager_has_property(public.units.property_id));

CREATE POLICY "units_select_tenant_own" ON public.units
  FOR SELECT
  USING (public.is_tenant() AND public.tenant_has_unit(public.units.id));

CREATE POLICY "units_write_super_admin" ON public.units
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- MANAGER ASSIGNMENTS
ALTER TABLE public.manager_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view own assignments" ON public.manager_assignments;
DROP POLICY IF EXISTS "Managers view own assignments" ON public.manager_assignments;
DROP POLICY IF EXISTS "Super admins can manage all assignments" ON public.manager_assignments;
DROP POLICY IF EXISTS "Super admins manage assignments" ON public.manager_assignments;

CREATE POLICY "manager_assignments_select_own" ON public.manager_assignments
  FOR SELECT
  USING (public.is_property_manager() AND manager_id = auth.uid());

CREATE POLICY "manager_assignments_write_super_admin" ON public.manager_assignments
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- TENANTS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Property managers can view tenants in their properties" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view tenants in their properties" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view own data" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update their own data" ON public.tenants;

CREATE POLICY "tenants_select_super_admin" ON public.tenants
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "tenants_select_manager_assigned" ON public.tenants
  FOR SELECT
  USING (public.is_property_manager() AND public.manager_has_property(public.tenants.property_id));

CREATE POLICY "tenants_select_tenant_own" ON public.tenants
  FOR SELECT
  USING (public.is_tenant() AND user_id = auth.uid());

-- Writes are restricted to super admin to ensure tenant additions/removals require approval.
CREATE POLICY "tenants_write_super_admin" ON public.tenants
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- PAYMENTS (financial isolation)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can do everything on payments" ON public.payments;
DROP POLICY IF EXISTS "payments_select_tenant_own" ON public.payments;
DROP POLICY IF EXISTS "payments_select_manager_assigned" ON public.payments;

CREATE POLICY "payments_select_super_admin" ON public.payments
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "payments_select_manager_assigned" ON public.payments
  FOR SELECT
  USING (
    public.is_property_manager()
    AND public.manager_has_property(public.payments.property_id)
  );

CREATE POLICY "payments_select_tenant_own" ON public.payments
  FOR SELECT
  USING (public.is_tenant() AND public.payments.tenant_id = auth.uid());

CREATE POLICY "payments_write_super_admin" ON public.payments
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- REFUNDS (refund status visibility)
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refunds_select_super_admin" ON public.refunds;
DROP POLICY IF EXISTS "refunds_select_manager_assigned" ON public.refunds;
DROP POLICY IF EXISTS "refunds_select_tenant_own" ON public.refunds;
DROP POLICY IF EXISTS "refunds_write_super_admin" ON public.refunds;

CREATE POLICY "refunds_select_super_admin" ON public.refunds
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "refunds_select_manager_assigned" ON public.refunds
  FOR SELECT
  USING (
    public.is_property_manager()
    AND public.manager_has_property(public.refunds.property_id)
  );

CREATE POLICY "refunds_select_tenant_own" ON public.refunds
  FOR SELECT
  USING (public.is_tenant() AND public.refunds.tenant_id = auth.uid());

CREATE POLICY "refunds_write_super_admin" ON public.refunds
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- VACATION NOTICES (tenants can submit, keep read-only access while refund resolves)
ALTER TABLE public.vacation_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vacation_notices_select_super_admin" ON public.vacation_notices;
DROP POLICY IF EXISTS "vacation_notices_select_manager_assigned" ON public.vacation_notices;
DROP POLICY IF EXISTS "vacation_notices_select_tenant_own" ON public.vacation_notices;
DROP POLICY IF EXISTS "vacation_notices_insert_tenant_own" ON public.vacation_notices;

CREATE POLICY "vacation_notices_select_super_admin" ON public.vacation_notices
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "vacation_notices_select_manager_assigned" ON public.vacation_notices
  FOR SELECT
  USING (
    public.is_property_manager()
    AND EXISTS (
      SELECT 1
      FROM public.leases l
      WHERE l.id = public.vacation_notices.lease_id
        AND public.manager_has_property(l.property_id)
    )
  );

CREATE POLICY "vacation_notices_select_tenant_own" ON public.vacation_notices
  FOR SELECT
  USING (
    public.is_tenant()
    AND EXISTS (
      SELECT 1
      FROM public.leases l
      WHERE l.id = public.vacation_notices.lease_id
        AND l.tenant_id = auth.uid()
    )
  );

CREATE POLICY "vacation_notices_insert_tenant_own" ON public.vacation_notices
  FOR INSERT
  WITH CHECK (
    public.is_tenant()
    AND EXISTS (
      SELECT 1
      FROM public.leases l
      WHERE l.id = public.vacation_notices.lease_id
        AND l.tenant_id = auth.uid()
    )
  );


-- APPROVAL QUEUE (submission allowed; approvals restricted to super admin)
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage approval queue" ON public.approval_queue;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.approval_queue;
DROP POLICY IF EXISTS "Users can create approval queue requests" ON public.approval_queue;

CREATE POLICY "approval_queue_select_super_admin" ON public.approval_queue
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "approval_queue_select_own" ON public.approval_queue
  FOR SELECT
  USING (COALESCE(requested_by, user_id) = auth.uid());

-- Managers/tenants can submit approval requests; only pending allowed.
CREATE POLICY "approval_queue_insert_own" ON public.approval_queue
  FOR INSERT
  WITH CHECK (
    COALESCE(requested_by, user_id) = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "approval_queue_write_super_admin" ON public.approval_queue
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- APPROVAL REQUESTS (legacy table used by some dashboards)
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_requests_select_super_admin" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_select_own" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_insert_own" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_write_super_admin" ON public.approval_requests;

CREATE POLICY "approval_requests_select_super_admin" ON public.approval_requests
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "approval_requests_select_own" ON public.approval_requests
  FOR SELECT
  USING (COALESCE(submitted_by, user_id) = auth.uid());

CREATE POLICY "approval_requests_insert_own" ON public.approval_requests
  FOR INSERT
  WITH CHECK (COALESCE(submitted_by, user_id) = auth.uid());

CREATE POLICY "approval_requests_write_super_admin" ON public.approval_requests
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
