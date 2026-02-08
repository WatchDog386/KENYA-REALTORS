-- ============================================================================
-- UPDATE VACANCY NOTICES - ADD MESSAGING/CONVERSATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vacancy_notice_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_notice_id UUID NOT NULL REFERENCES public.vacancy_notices(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vacancy_notice_messages ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- 1. Tenants: View messages for their own notices
DROP POLICY IF EXISTS "Tenants view own notice messages" ON public.vacancy_notice_messages;
CREATE POLICY "Tenants view own notice messages"
ON public.vacancy_notice_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vacancy_notices
    WHERE id = vacancy_notice_messages.vacancy_notice_id
    AND tenant_id = auth.uid()
  )
);

-- 2. Tenants: Insert messages for their own notices
DROP POLICY IF EXISTS "Tenants insert own notice messages" ON public.vacancy_notice_messages;
CREATE POLICY "Tenants insert own notice messages"
ON public.vacancy_notice_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vacancy_notices
    WHERE id = vacancy_notice_messages.vacancy_notice_id
    AND tenant_id = auth.uid()
  )
  AND sender_id = auth.uid()
);

-- 3. Managers: View messages for properties they manage
DROP POLICY IF EXISTS "Managers view notice messages" ON public.vacancy_notice_messages;
CREATE POLICY "Managers view notice messages"
ON public.vacancy_notice_messages FOR SELECT
USING (
  sender_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.vacancy_notices vn
    JOIN public.property_manager_assignments pma ON vn.property_id = pma.property_id
    WHERE vn.id = vacancy_notice_messages.vacancy_notice_id
    AND pma.property_manager_id = auth.uid()
    AND pma.status = 'active'
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. Managers: Insert messages
DROP POLICY IF EXISTS "Managers insert notice messages" ON public.vacancy_notice_messages;
CREATE POLICY "Managers insert notice messages"
ON public.vacancy_notice_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vacancy_notices vn
    JOIN public.property_manager_assignments pma ON vn.property_id = pma.property_id
    WHERE vn.id = vacancy_notice_messages.vacancy_notice_id
    AND pma.property_manager_id = auth.uid()
    AND pma.status = 'active'
  )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
