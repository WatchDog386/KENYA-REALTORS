-- ============================================================================
-- PROPERTY UTILITY ASSIGNMENTS
-- Date: March 4, 2026
-- Allows each property to have its own set of active utilities
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.property_utilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    utility_constant_id UUID NOT NULL REFERENCES public.utility_constants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, utility_constant_id)
);

CREATE INDEX IF NOT EXISTS idx_property_utilities_property_id
    ON public.property_utilities(property_id);

CREATE INDEX IF NOT EXISTS idx_property_utilities_utility_id
    ON public.property_utilities(utility_constant_id);

ALTER TABLE public.property_utilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view property utilities" ON public.property_utilities;
CREATE POLICY "Everyone can view property utilities"
    ON public.property_utilities FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Superadmin can manage property utilities" ON public.property_utilities;
CREATE POLICY "Superadmin can manage property utilities"
    ON public.property_utilities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    );

CREATE OR REPLACE FUNCTION public.update_property_utilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_property_utilities_timestamp ON public.property_utilities;
CREATE TRIGGER trigger_update_property_utilities_timestamp
    BEFORE UPDATE ON public.property_utilities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_property_utilities_updated_at();

COMMIT;
