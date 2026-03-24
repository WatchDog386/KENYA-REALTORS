-- ============================================================================
-- EMPLOYEE LEAVE REQUESTS WORKFLOW
-- Date: March 2026
-- Purpose: Allow employee leave requests, manager review, and optional
--          proprietor visibility for approved requests.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NULL REFERENCES public.properties(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  manager_notes TEXT NULL,
  reviewed_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  share_with_proprietor BOOLEAN NOT NULL DEFAULT FALSE,
  shared_with_proprietor_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_leave_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT employee_leave_requests_dates_check
    CHECK (end_date >= start_date),
  CONSTRAINT employee_leave_requests_days_check
    CHECK (days_requested > 0)
);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_user_id
  ON public.employee_leave_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_property_id
  ON public.employee_leave_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_status_created_at
  ON public.employee_leave_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_share_with_proprietor
  ON public.employee_leave_requests(share_with_proprietor, status);

CREATE OR REPLACE FUNCTION public.set_employee_leave_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employee_leave_requests_updated_at ON public.employee_leave_requests;
CREATE TRIGGER trg_employee_leave_requests_updated_at
  BEFORE UPDATE ON public.employee_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_employee_leave_requests_updated_at();

ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_leave_select_own" ON public.employee_leave_requests;
CREATE POLICY "employee_leave_select_own"
ON public.employee_leave_requests
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "employee_leave_insert_own" ON public.employee_leave_requests;
CREATE POLICY "employee_leave_insert_own"
ON public.employee_leave_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "employee_leave_update_own_pending" ON public.employee_leave_requests;
CREATE POLICY "employee_leave_update_own_pending"
ON public.employee_leave_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
);

DROP POLICY IF EXISTS "manager_super_admin_select_leave_requests" ON public.employee_leave_requests;
CREATE POLICY "manager_super_admin_select_leave_requests"
ON public.employee_leave_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('property_manager', 'super_admin')
  )
);

DROP POLICY IF EXISTS "manager_super_admin_update_leave_requests" ON public.employee_leave_requests;
CREATE POLICY "manager_super_admin_update_leave_requests"
ON public.employee_leave_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('property_manager', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('property_manager', 'super_admin')
  )
);

DROP POLICY IF EXISTS "proprietor_select_shared_leave_requests" ON public.employee_leave_requests;
CREATE POLICY "proprietor_select_shared_leave_requests"
ON public.employee_leave_requests
FOR SELECT
USING (
  share_with_proprietor = TRUE
  AND status = 'approved'
  AND property_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.proprietors pr
    JOIN public.proprietor_properties pp ON pp.proprietor_id = pr.id
    WHERE pr.user_id = auth.uid()
      AND pp.property_id = employee_leave_requests.property_id
      AND pp.is_active = TRUE
  )
);
