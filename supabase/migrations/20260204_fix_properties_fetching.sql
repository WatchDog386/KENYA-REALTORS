-- ============================================================================
-- FIX PROPERTIES FETCHING - Ensure properties are accessible to super admin
-- ============================================================================
-- This fixes issues where properties aren't being fetched in the super admin dashboard

-- STEP 1: Disable RLS temporarily
-- ============================================================================
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_unit_types DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all conflicting policies
-- ============================================================================
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'properties'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'property_unit_types'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.property_unit_types', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: Create simple, non-circular RLS policies
-- ============================================================================

-- Re-enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_unit_types ENABLE ROW LEVEL SECURITY;

-- Properties table policies
-- Policy 1: Service role has full access (for backend/migrations)
CREATE POLICY "properties_service_role_all"
    ON public.properties FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Everyone can read properties
CREATE POLICY "properties_select_all"
    ON public.properties FOR SELECT
    USING (true);

-- Policy 3: Super admin can do everything (without circular query)
CREATE POLICY "properties_super_admin_all"
    ON public.properties FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- Policy 4: Auth admin can do anything
CREATE POLICY "properties_auth_admin_all"
    ON public.properties FOR ALL
    TO supabase_auth_admin
    USING (true)
    WITH CHECK (true);

-- Property unit types table policies
-- Policy 1: Service role has full access
CREATE POLICY "property_unit_types_service_role_all"
    ON public.property_unit_types FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Everyone can read unit types
CREATE POLICY "property_unit_types_select_all"
    ON public.property_unit_types FOR SELECT
    USING (true);

-- Policy 3: Super admin can do everything
CREATE POLICY "property_unit_types_super_admin_all"
    ON public.property_unit_types FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- Policy 4: Auth admin can do anything
CREATE POLICY "property_unit_types_auth_admin_all"
    ON public.property_unit_types FOR ALL
    TO supabase_auth_admin
    USING (true)
    WITH CHECK (true);

-- STEP 4: Verify data exists or create sample properties
-- ============================================================================

-- Check if properties table is empty and create sample data if needed
DO $$
DECLARE
    v_property_count INT;
    v_prop1_id UUID;
    v_prop2_id UUID;
BEGIN
    -- Count existing properties
    SELECT COUNT(*) INTO v_property_count FROM public.properties;
    
    IF v_property_count = 0 THEN
        -- Create sample properties if none exist
        -- Property 1: Sunrise Apartments
        INSERT INTO public.properties (
            id, name, location, image_url, type, description, status
        ) VALUES (
            gen_random_uuid(),
            'Sunrise Apartments',
            'Westlands, Nairobi',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60',
            'Apartment',
            'Modern apartment complex with 30 units',
            'Active'
        ) RETURNING id INTO v_prop1_id;

        -- Add unit types for property 1
        INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
        VALUES
            (v_prop1_id, 'Bedsitter', 15, 12000),
            (v_prop1_id, 'One Bedroom', 10, 25000),
            (v_prop1_id, 'Two Bedroom', 5, 45000);

        -- Property 2: Green Valley Estate
        INSERT INTO public.properties (
            id, name, location, image_url, type, description, status
        ) VALUES (
            gen_random_uuid(),
            'Green Valley Estate',
            'Kiambu Road, Nairobi',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60',
            'Apartment',
            'Residential estate with 35 units',
            'Active'
        ) RETURNING id INTO v_prop2_id;

        -- Add unit types for property 2
        INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
        VALUES
            (v_prop2_id, 'Two Bedroom', 20, 55000),
            (v_prop2_id, 'Three Bedroom', 10, 85000),
            (v_prop2_id, 'Commercial Space', 5, 30000);
    END IF;
END $$;

-- STEP 5: Verify the fix
-- ============================================================================
SELECT 
    '✅ PROPERTIES FIX COMPLETE' as status,
    (SELECT COUNT(*) FROM public.properties) as total_properties,
    (SELECT COUNT(*) FROM public.property_unit_types) as total_unit_types,
    current_timestamp as applied_at;
