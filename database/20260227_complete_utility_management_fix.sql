-- **IMPORTANT**: Run this in Supabase SQL Editor to ensure SuperAdmin can update utility constants
-- This migration ensures consistency across all utility management tables

-- ============================================================================
-- 1. FIX UTILITY_SETTINGS TABLE
-- ============================================================================

-- Ensure utility_settings table has all required columns
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS water_constant DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS electricity_constant DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS custom_utilities JSONB DEFAULT '{}'::jsonb;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view utility settings" ON public.utility_settings;
DROP POLICY IF EXISTS "Superadmins can update utility settings" ON public.utility_settings;
DROP POLICY IF EXISTS "Superadmins can insert utility settings" ON public.utility_settings;

-- Create comprehensive RLS policies that handle both role name variations
CREATE POLICY "Anyone can view utility settings"
    ON public.utility_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Superadmin can update utility settings"
    ON public.utility_settings FOR UPDATE
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

CREATE POLICY "Superadmin can insert utility settings"
    ON public.utility_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
        )
    );

-- Create trigger to auto-update the updated_at timestamp on changes
CREATE OR REPLACE FUNCTION public.update_utility_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_utility_settings_timestamp ON public.utility_settings;
CREATE TRIGGER trigger_update_utility_settings_timestamp
    BEFORE UPDATE ON public.utility_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_utility_settings_updated_at();

-- Ensure default row exists
INSERT INTO public.utility_settings (water_fee, electricity_fee, garbage_fee, security_fee, service_fee, water_constant, electricity_constant)
SELECT 0, 0, 0, 0, 0, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.utility_settings)
LIMIT 1;

-- ============================================================================
-- 2. FIX UTILITY_CONSTANTS TABLE
-- ============================================================================

-- Ensure all required columns exist
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop all existing policies
DROP POLICY IF EXISTS "Superadmin can manage utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can select utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can insert utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can update utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can delete utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Everyone can view utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Managers can view utility constants" ON public.utility_constants;

-- Create comprehensive RLS policies that handle both role name variations
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

CREATE POLICY "Everyone can view utility constants"
    ON public.utility_constants FOR SELECT
    USING (TRUE);

-- Create trigger to auto-update the updated_at timestamp on changes
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

-- Ensure default utilities exist
INSERT INTO public.utility_constants (utility_name, constant, price, is_metered, description)
VALUES 
    ('Electricity', 1, 0, TRUE, 'Metered utility - rate per unit'),
    ('Water', 1, 0, TRUE, 'Metered utility - rate per unit'),
    ('Garbage', 1, 500, FALSE, 'Fixed fee - not metered'),
    ('Security', 1, 1000, FALSE, 'Fixed fee - not metered'),
    ('Service', 1, 500, FALSE, 'Fixed fee - not metered')
ON CONFLICT (utility_name) DO NOTHING;

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================

-- Verify utility_settings structure
SELECT 
    'utility_settings' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utility_settings'
ORDER BY ordinal_position;

-- Verify utility_constants structure
SELECT 
    'utility_constants' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utility_constants'
ORDER BY ordinal_position;

-- Show current utility constants
SELECT id, utility_name, constant, price, is_metered, description, updated_at 
FROM public.utility_constants 
ORDER BY utility_name;

-- Show current utility settings
SELECT 
    id, 
    water_fee, 
    electricity_fee, 
    garbage_fee, 
    security_fee, 
    service_fee,
    water_constant,
    electricity_constant,
    updated_at
FROM public.utility_settings;
