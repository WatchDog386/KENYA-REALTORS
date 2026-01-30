-- ============================================================================
-- DATABASE RESTRUCTURING: Improved Properties & Units Management
-- Date: January 30, 2026
-- Purpose: Implement comprehensive property management with unit specifications
--          and simplified user management based on profiles table
-- ============================================================================

-- ======================== PART 1: UNITS SPECIFICATIONS TABLE ==================

-- Create a comprehensive units_specifications table for detailed unit types
CREATE TABLE IF NOT EXISTS public.unit_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Unit Type Information
    unit_type_name VARCHAR(100) NOT NULL, -- e.g., "Bedsitter", "1-Bedroom", "2-Bedroom", "Studio", "Shop"
    unit_category VARCHAR(50) NOT NULL, -- e.g., "residential", "commercial"
    
    -- Quantity Information
    total_units_of_type INTEGER NOT NULL DEFAULT 0,
    occupied_count INTEGER DEFAULT 0,
    vacant_count INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,
    
    -- Size & Features
    base_size_sqft INTEGER, -- Base size in square feet
    size_variants JSONB DEFAULT '[]', -- Array of size options: [{name: "Small", sqft: 400, price: 15000}, ...]
    
    -- Pricing Information
    base_price DECIMAL(10,2) NOT NULL, -- Base monthly rent
    price_variants JSONB DEFAULT '[]', -- Array of prices for different sizes/features
    
    -- Floor Information
    available_floors INTEGER[] DEFAULT '{}', -- Array of floor numbers
    
    -- Special Features
    features TEXT[] DEFAULT '{}', -- e.g., ["Balcony", "AC Ready", "Water Tank", "Solar Ready"]
    amenities TEXT[] DEFAULT '{}', -- e.g., ["Kitchen", "Bathroom", "Built-in Wardrobe"]
    
    -- Utility Information
    utilities_included JSONB DEFAULT '{"water": false, "electricity": false, "wifi": false}',
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id, unit_type_name)
);

-- Create detailed units table with specification reference
CREATE TABLE IF NOT EXISTS public.units_detailed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_specification_id UUID REFERENCES public.unit_specifications(id) ON DELETE SET NULL,
    
    -- Unit Identification
    unit_number VARCHAR(20) NOT NULL,
    unit_type VARCHAR(100), -- e.g., "1-Bedroom Apartment"
    
    -- Specifications
    floor_number INTEGER,
    size_sqft INTEGER,
    price_monthly DECIMAL(10,2),
    price_deposit DECIMAL(10,2),
    
    -- Occupancy
    occupant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance', 'reserved')),
    move_in_date DATE,
    move_out_date DATE,
    
    -- Details
    features TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id, unit_number)
);

-- ======================== PART 2: PROPERTY EXPECTED INCOME TABLE ==================

-- Create property income projections table
CREATE TABLE IF NOT EXISTS public.property_income_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Income Calculation
    total_units INTEGER NOT NULL,
    total_monthly_income DECIMAL(15,2) DEFAULT 0,
    
    -- Breakdown by Unit Type
    income_breakdown JSONB DEFAULT '[]', -- Array: [{unitType: "1-Bedroom", count: 10, price: 15000, subtotal: 150000}, ...]
    
    -- Income Projections
    expected_occupancy_rate DECIMAL(5,2) DEFAULT 100, -- Percentage
    projected_monthly_income DECIMAL(15,2) DEFAULT 0, -- Actual expected income based on occupancy
    annual_projected_income DECIMAL(15,2) DEFAULT 0,
    
    -- Additional Income
    additional_income DECIMAL(15,2) DEFAULT 0, -- Parking, utilities, services, etc.
    
    -- Updated tracking
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id)
);

-- ======================== PART 3: USER MANAGEMENT SIMPLIFICATION ==================

-- Add index for faster profile lookups in UserManagement
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Create a view for unassigned users (for UserManagement component)
CREATE OR REPLACE VIEW public.unassigned_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    avatar_url,
    created_at,
    updated_at,
    last_login_at,
    CASE 
        WHEN role IS NULL OR role = 'tenant' THEN 'unassigned'
        ELSE role
    END as assigned_role
FROM public.profiles
WHERE role IS NULL OR role = 'tenant' OR status = 'pending'
ORDER BY created_at DESC;

-- Create a view for assigned users
CREATE OR REPLACE VIEW public.assigned_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    avatar_url,
    created_at,
    updated_at,
    last_login_at
FROM public.profiles
WHERE role IN ('property_manager', 'super_admin', 'maintenance', 'accountant')
AND status != 'pending'
ORDER BY created_at DESC;

-- ======================== PART 4: HELPER FUNCTIONS ==================

-- Function to calculate property income
CREATE OR REPLACE FUNCTION calculate_property_income(property_id_input UUID)
RETURNS TABLE (
    total_units INTEGER,
    total_monthly_income DECIMAL,
    income_breakdown JSONB,
    projected_monthly_income DECIMAL,
    annual_projected_income DECIMAL
) AS $$
DECLARE
    v_occupancy_rate DECIMAL;
    v_total_units INTEGER;
    v_total_income DECIMAL;
    v_breakdown JSONB;
BEGIN
    -- Get occupancy rate from projection
    SELECT expected_occupancy_rate INTO v_occupancy_rate
    FROM public.property_income_projections
    WHERE property_id = property_id_input;
    
    v_occupancy_rate := COALESCE(v_occupancy_rate, 100);
    
    -- Calculate totals from unit specifications
    SELECT 
        COALESCE(SUM(total_units_of_type), 0),
        COALESCE(SUM(total_units_of_type * base_price), 0)
    INTO v_total_units, v_total_income
    FROM public.unit_specifications
    WHERE property_id = property_id_input AND is_active = true;
    
    -- Build breakdown JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'unitType', unit_type_name,
            'count', total_units_of_type,
            'price', base_price,
            'subtotal', total_units_of_type * base_price
        )
    ) INTO v_breakdown
    FROM public.unit_specifications
    WHERE property_id = property_id_input AND is_active = true;
    
    RETURN QUERY SELECT
        v_total_units,
        v_total_income,
        COALESCE(v_breakdown, '[]'::jsonb),
        ROUND(v_total_income * (v_occupancy_rate / 100)::DECIMAL, 2),
        ROUND(v_total_income * (v_occupancy_rate / 100)::DECIMAL * 12, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update property unit counts
CREATE OR REPLACE FUNCTION update_property_unit_counts(property_id_input UUID)
RETURNS VOID AS $$
DECLARE
    v_total_units INTEGER;
    v_occupied_units INTEGER;
BEGIN
    -- Calculate from detailed units
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'occupied' THEN 1 END)
    INTO v_total_units, v_occupied_units
    FROM public.units_detailed
    WHERE property_id = property_id_input;
    
    -- Update properties table
    UPDATE public.properties
    SET 
        total_units = v_total_units,
        occupied_units = v_occupied_units,
        available_units = v_total_units - v_occupied_units,
        updated_at = NOW()
    WHERE id = property_id_input;
END;
$$ LANGUAGE plpgsql;

-- ======================== PART 5: TRIGGERS ==================

-- Trigger to update property counts when units change
CREATE OR REPLACE FUNCTION trigger_update_property_counts()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_property_unit_counts(NEW.property_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_units_detailed_update ON public.units_detailed;
CREATE TRIGGER trigger_units_detailed_update
AFTER INSERT OR UPDATE OR DELETE ON public.units_detailed
FOR EACH ROW EXECUTE FUNCTION trigger_update_property_counts();

-- Trigger to automatically update income projections
CREATE OR REPLACE FUNCTION trigger_update_income_projection()
RETURNS TRIGGER AS $$
DECLARE
    v_result RECORD;
    v_breakdown JSONB;
BEGIN
    SELECT * INTO v_result FROM calculate_property_income(NEW.property_id);
    
    INSERT INTO public.property_income_projections (
        property_id,
        total_units,
        total_monthly_income,
        income_breakdown,
        expected_occupancy_rate,
        projected_monthly_income,
        annual_projected_income,
        last_calculated_at
    ) VALUES (
        NEW.property_id,
        v_result.total_units,
        v_result.total_monthly_income,
        v_result.income_breakdown,
        100,
        v_result.projected_monthly_income,
        v_result.annual_projected_income,
        NOW()
    )
    ON CONFLICT (property_id) DO UPDATE SET
        total_units = v_result.total_units,
        total_monthly_income = v_result.total_monthly_income,
        income_breakdown = v_result.income_breakdown,
        projected_monthly_income = v_result.projected_monthly_income,
        annual_projected_income = v_result.annual_projected_income,
        last_calculated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unit_specs_income ON public.unit_specifications;
CREATE TRIGGER trigger_unit_specs_income
AFTER INSERT OR UPDATE OR DELETE ON public.unit_specifications
FOR EACH ROW EXECUTE FUNCTION trigger_update_income_projection();

-- ======================== PART 6: RLS POLICIES ==================

-- Enable RLS on new tables
ALTER TABLE public.unit_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_income_projections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Super admins can view all unit specifications" ON public.unit_specifications;
DROP POLICY IF EXISTS "Super admins can manage unit specifications" ON public.unit_specifications;
DROP POLICY IF EXISTS "Super admins can view all detailed units" ON public.units_detailed;
DROP POLICY IF EXISTS "Super admins can manage detailed units" ON public.units_detailed;
DROP POLICY IF EXISTS "Super admins can view income projections" ON public.property_income_projections;
DROP POLICY IF EXISTS "Super admins can manage income projections" ON public.property_income_projections;

-- Super admins can view all
CREATE POLICY "Super admins can view all unit specifications" 
ON public.unit_specifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins can manage unit specifications" 
ON public.unit_specifications FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins can view all detailed units" 
ON public.units_detailed FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins can manage detailed units" 
ON public.units_detailed FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins can view income projections" 
ON public.property_income_projections FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Super admins can manage income projections" 
ON public.property_income_projections FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ======================== COMPLETION MESSAGE ==================
-- Run this migration with: psql -f 20260130_property_units_restructure.sql

-- Verification queries:
-- SELECT * FROM public.unit_specifications;
-- SELECT * FROM public.units_detailed;
-- SELECT * FROM public.property_income_projections;
-- SELECT * FROM public.unassigned_users;
-- SELECT * FROM public.assigned_users;
