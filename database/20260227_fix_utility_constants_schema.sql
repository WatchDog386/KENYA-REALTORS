-- **IMPORTANT**: Run this in Supabase SQL Editor if constants aren't persisting
-- This ensures utility_constants table is fully configured for superadmin updates

-- 1. Ensure table exists with all required columns
CREATE TABLE IF NOT EXISTS public.utility_constants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utility_name VARCHAR(100) NOT NULL UNIQUE,
    constant DECIMAL(10, 4) DEFAULT 1,
    price DECIMAL(10, 2) DEFAULT 0,
    is_metered BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns if they don't exist
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Enable RLS if not already enabled
ALTER TABLE public.utility_constants ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Superadmin can manage utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can select utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can insert utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can update utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can delete utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Everyone can view utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Managers can view utility constants" ON public.utility_constants;

-- 5. Create comprehensive RLS policies for superadmin
CREATE POLICY "Superadmin can select utility constants"
    ON public.utility_constants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    );

CREATE POLICY "Superadmin can insert utility constants"
    ON public.utility_constants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    );

CREATE POLICY "Superadmin can update utility constants"
    ON public.utility_constants FOR UPDATE
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

CREATE POLICY "Superadmin can delete utility constants"
    ON public.utility_constants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    );

-- 6. Allow all roles to view utility constants (needed for calculations)
CREATE POLICY "Everyone can view utility constants"
    ON public.utility_constants FOR SELECT
    USING (TRUE);

-- 7. Create trigger to auto-update the updated_at timestamp on changes
CREATE OR REPLACE FUNCTION public.update_utility_constants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_utility_constants_timestamp ON public.utility_constants;
CREATE TRIGGER trigger_update_utility_constants_timestamp
    BEFORE UPDATE ON public.utility_constants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_utility_constants_updated_at();

-- 8. Ensure default utilities exist with correct structure
INSERT INTO public.utility_constants (utility_name, constant, price, is_metered, description)
VALUES 
    ('Electricity', 1, 0, TRUE, 'Metered utility - rate per unit'),
    ('Water', 1, 0, TRUE, 'Metered utility - rate per unit'),
    ('Garbage', 1, 500, FALSE, 'Fixed fee - not metered'),
    ('Security', 1, 1000, FALSE, 'Fixed fee - not metered'),
    ('Service', 1, 500, FALSE, 'Fixed fee - not metered')
ON CONFLICT (utility_name) DO UPDATE SET
    updated_at = NOW();

-- 9. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utility_constants'
ORDER BY ordinal_position;

-- 10. Verify initial data
SELECT id, utility_name, constant, price, is_metered, description, updated_at 
FROM public.utility_constants 
ORDER BY utility_name;
