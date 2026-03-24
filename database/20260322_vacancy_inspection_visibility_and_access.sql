-- Vacancy inspection workflow access updates
-- Goal:
-- 1) Let technicians assigned to the property view vacancy notices and send inspection reports.
-- 2) Let proprietors and super admins view the same vacancy notice/messages.
-- 3) Keep manager and tenant access intact.

BEGIN;

-- Expand the security definer access function used by vacancy_notice_messages policies
CREATE OR REPLACE FUNCTION public.check_vacancy_message_access(target_notice_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_property_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT tenant_id, property_id INTO v_tenant_id, v_property_id
  FROM public.vacancy_notices
  WHERE id = target_notice_id;

  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Tenant that created the notice
  IF v_tenant_id = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- Assigned property manager
  IF EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = v_property_id
      AND pma.property_manager_id = v_user_id
      AND pma.status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Assigned technician for that property
  IF EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.technician_property_assignments tpa ON tpa.technician_id = t.id
    WHERE t.user_id = v_user_id
      AND tpa.property_id = v_property_id
      AND tpa.is_active = true
  ) THEN
    RETURN TRUE;
  END IF;

  -- Assigned proprietor for that property
  IF EXISTS (
    SELECT 1
    FROM public.proprietor_properties pp
    WHERE pp.proprietor_id = v_user_id
      AND pp.property_id = v_property_id
      AND pp.is_active = true
  ) THEN
    RETURN TRUE;
  END IF;

  -- Super admin always has visibility
  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_user_id
      AND p.role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Strengthen vacancy_notices SELECT visibility for proprietor and technician roles
DROP POLICY IF EXISTS "Proprietors view property vacancy notices" ON public.vacancy_notices;
CREATE POLICY "Proprietors view property vacancy notices"
ON public.vacancy_notices FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.proprietor_properties pp
    WHERE pp.proprietor_id = auth.uid()
      AND pp.property_id = public.vacancy_notices.property_id
      AND pp.is_active = true
  )
);

DROP POLICY IF EXISTS "Technicians view assigned property vacancy notices" ON public.vacancy_notices;
CREATE POLICY "Technicians view assigned property vacancy notices"
ON public.vacancy_notices FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.technicians t
    JOIN public.technician_property_assignments tpa ON tpa.technician_id = t.id
    WHERE t.user_id = auth.uid()
      AND tpa.property_id = public.vacancy_notices.property_id
      AND tpa.is_active = true
  )
);

-- Recreate unified message policies so they use the updated helper function.
DROP POLICY IF EXISTS "Users can view messages they have access to" ON public.vacancy_notice_messages;
CREATE POLICY "Users can view messages they have access to"
ON public.vacancy_notice_messages FOR SELECT
USING (
  public.check_vacancy_message_access(vacancy_notice_id)
);

DROP POLICY IF EXISTS "Users can insert messages they have access to" ON public.vacancy_notice_messages;
CREATE POLICY "Users can insert messages they have access to"
ON public.vacancy_notice_messages FOR INSERT
WITH CHECK (
  public.check_vacancy_message_access(vacancy_notice_id)
  AND sender_id = auth.uid()
);

COMMIT;
