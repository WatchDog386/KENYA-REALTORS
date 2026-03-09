-- ============================================================================
-- AUTOMATED ASSIGNMENT SCRIPT
-- ============================================================================
-- This script:
-- 1. Picks 1 Property Manager
-- 2. Picks 1 Property
-- 3. Picks 3 Tenants
-- 4. Assigns the Property to the Property Manager
-- 5. Creates 3 Units (101, 102, 103) for the Property
-- 6. Assigns each Tenant to one Unit
-- ============================================================================

-- RE-CREATE UNITS TABLE (It was dropped in a previous migration but is needed for individual assignments)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, occupied, maintenance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Create basic policies for units if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'units' AND policyname = 'Public read access') THEN
        CREATE POLICY "Public read access" ON public.units FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'units' AND policyname = 'Super admin full access') THEN
        CREATE POLICY "Super admin full access" ON public.units FOR ALL USING (
             EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
        );
    END IF;
END $$;

DO $$
DECLARE
    v_manager_id UUID;
    v_property_id UUID;
    v_tenant1_id UUID;
    v_tenant2_id UUID;
    v_tenant3_id UUID;
    v_unit1_id UUID;
    v_unit2_id UUID;
    v_unit3_id UUID;
BEGIN
    -- 1. Find 1 Property Manager
    SELECT id INTO v_manager_id FROM public.profiles WHERE role = 'property_manager' LIMIT 1;
    IF v_manager_id IS NULL THEN
        RAISE EXCEPTION 'No Property Manager found. Please create a property manager first.';
    END IF;
    RAISE NOTICE 'Found Manager: %', v_manager_id;

    -- 2. Find 3 Tenants
    SELECT id INTO v_tenant1_id FROM public.profiles WHERE role = 'tenant' ORDER BY created_at ASC LIMIT 1 OFFSET 0;
    SELECT id INTO v_tenant2_id FROM public.profiles WHERE role = 'tenant' ORDER BY created_at ASC LIMIT 1 OFFSET 1;
    SELECT id INTO v_tenant3_id FROM public.profiles WHERE role = 'tenant' ORDER BY created_at ASC LIMIT 1 OFFSET 2;
    
    IF v_tenant1_id IS NULL THEN
        RAISE EXCEPTION 'No tenants found. please create tenants first.';
    END IF;
    RAISE NOTICE 'Found Tenant 1: %', v_tenant1_id;
    RAISE NOTICE 'Found Tenant 2: %', v_tenant2_id;
    RAISE NOTICE 'Found Tenant 3: %', v_tenant3_id;

    -- 3. Find 1 Property
    SELECT id INTO v_property_id FROM public.properties LIMIT 1;
    IF v_property_id IS NULL THEN
         RAISE EXCEPTION 'No Property found. Please create a property first.';
    END IF;
    RAISE NOTICE 'Found Property: %', v_property_id;

    -- 4. Assign Property to Manager
    -- Check if assignment exists
    IF NOT EXISTS (SELECT 1 FROM public.property_manager_assignments WHERE property_manager_id = v_manager_id AND property_id = v_property_id) THEN
        INSERT INTO public.property_manager_assignments (property_manager_id, property_id)
        VALUES (v_manager_id, v_property_id);
        RAISE NOTICE 'Assigned Property % to Manager %', v_property_id, v_manager_id;
    ELSE
        RAISE NOTICE 'Property % already assigned to Manager %', v_property_id, v_manager_id;
    END IF;

    -- 5. Create 3 Units for the Property (if not exist)
    -- Unit 101
    IF NOT EXISTS (SELECT 1 FROM public.units WHERE property_id = v_property_id AND unit_number = '101') THEN
        INSERT INTO public.units (property_id, unit_number, status)
        VALUES (v_property_id, '101', 'available')
        RETURNING id INTO v_unit1_id;
        RAISE NOTICE 'Created Unit 101: %', v_unit1_id;
    ELSE
        SELECT id INTO v_unit1_id FROM public.units WHERE property_id = v_property_id AND unit_number = '101';
        RAISE NOTICE 'Found Unit 101: %', v_unit1_id;
    END IF;

    -- Unit 102
    IF NOT EXISTS (SELECT 1 FROM public.units WHERE property_id = v_property_id AND unit_number = '102') THEN
        INSERT INTO public.units (property_id, unit_number, status)
        VALUES (v_property_id, '102', 'available')
        RETURNING id INTO v_unit2_id;
        RAISE NOTICE 'Created Unit 102: %', v_unit2_id;
    ELSE
        SELECT id INTO v_unit2_id FROM public.units WHERE property_id = v_property_id AND unit_number = '102';
        RAISE NOTICE 'Found Unit 102: %', v_unit2_id;
    END IF;

    -- Unit 103
    IF NOT EXISTS (SELECT 1 FROM public.units WHERE property_id = v_property_id AND unit_number = '103') THEN
        INSERT INTO public.units (property_id, unit_number, status)
        VALUES (v_property_id, '103', 'available')
        RETURNING id INTO v_unit3_id;
        RAISE NOTICE 'Created Unit 103: %', v_unit3_id;
    ELSE
         SELECT id INTO v_unit3_id FROM public.units WHERE property_id = v_property_id AND unit_number = '103';
         RAISE NOTICE 'Found Unit 103: %', v_unit3_id;
    END IF;

    -- 6. Assign Tenants to Units
    -- Tenant 1 -> Unit 101
    IF v_tenant1_id IS NOT NULL THEN
        -- Check if already assigned to avoid duplicates/errors
        DELETE FROM public.tenants WHERE user_id = v_tenant1_id; 
        
        INSERT INTO public.tenants (user_id, property_id, unit_id, status, lease_start_date, lease_end_date)
        VALUES (v_tenant1_id, v_property_id, v_unit1_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');
        RAISE NOTICE 'Assigned Tenant 1 (%) to Unit 101', v_tenant1_id;
    END IF;

    -- Tenant 2 -> Unit 102
    IF v_tenant2_id IS NOT NULL THEN
        DELETE FROM public.tenants WHERE user_id = v_tenant2_id; 
        
        INSERT INTO public.tenants (user_id, property_id, unit_id, status, lease_start_date, lease_end_date)
        VALUES (v_tenant2_id, v_property_id, v_unit2_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');
        RAISE NOTICE 'Assigned Tenant 2 (%) to Unit 102', v_tenant2_id;
    END IF;

    -- Tenant 3 -> Unit 103
    IF v_tenant3_id IS NOT NULL THEN
        DELETE FROM public.tenants WHERE user_id = v_tenant3_id; 
        
        INSERT INTO public.tenants (user_id, property_id, unit_id, status, lease_start_date, lease_end_date)
        VALUES (v_tenant3_id, v_property_id, v_unit3_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');
        RAISE NOTICE 'Assigned Tenant 3 (%) to Unit 103', v_tenant3_id;
    END IF;

END $$;
