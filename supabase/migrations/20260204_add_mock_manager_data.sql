-- ============================================================================
-- Add Mock Data for Manager Portal Testing
-- Date: February 4, 2026
-- Purpose: Populate test data for property manager portal features
-- ============================================================================

-- Step 1: Verify we have a test property manager user
-- (This should already exist from previous migrations)

-- Step 2: Get the first property manager to use for testing
DO $$
DECLARE
    v_manager_id UUID;
    v_property_id UUID;
BEGIN
    -- Get a property manager
    SELECT id INTO v_manager_id 
    FROM public.profiles 
    WHERE role = 'property_manager' 
    LIMIT 1;
    
    -- If no property manager exists, create one for testing
    IF v_manager_id IS NULL THEN
        INSERT INTO auth.users (
            email, 
            encrypted_password, 
            email_confirmed_at,
            raw_user_meta_data,
            created_at
        ) VALUES (
            'testmanager@ayden.local',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"first_name":"Test","last_name":"Manager"}',
            NOW()
        ) RETURNING id INTO v_manager_id;
        
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            role,
            status,
            is_active,
            user_type,
            created_at,
            updated_at
        ) VALUES (
            v_manager_id,
            'testmanager@ayden.local',
            'Test',
            'Manager',
            'property_manager',
            'active',
            true,
            'property_manager',
            NOW(),
            NOW()
        );
    END IF;

    -- Get a property
    SELECT id INTO v_property_id 
    FROM public.properties 
    LIMIT 1;
    
    -- If no property exists, create one for testing
    IF v_property_id IS NULL THEN
        INSERT INTO public.properties (
            name,
            location,
            type,
            description,
            created_at,
            updated_at
        ) VALUES (
            'Test Property - Westlands',
            'Westlands, Nairobi',
            'Apartment',
            'A beautiful test property for manager portal',
            NOW(),
            NOW()
        ) RETURNING id INTO v_property_id;
        
        -- Add some units to the test property
        INSERT INTO public.property_unit_types (
            property_id,
            name,
            units_count,
            price_per_unit,
            created_at,
            updated_at
        ) VALUES
            (v_property_id, '1 Bedroom', 5, 45000, NOW(), NOW()),
            (v_property_id, '2 Bedroom', 3, 65000, NOW(), NOW()),
            (v_property_id, '3 Bedroom', 2, 95000, NOW(), NOW());
    END IF;

    -- Assign the property manager to the property (if not already assigned)
    INSERT INTO public.property_manager_assignments (
        property_manager_id,
        property_id,
        assigned_at
    ) VALUES (
        v_manager_id,
        v_property_id,
        NOW()
    )
    ON CONFLICT (property_manager_id, property_id) DO NOTHING;
    
    RAISE NOTICE 'Test data setup complete - Manager ID: %, Property ID: %', v_manager_id, v_property_id;
END $$;

-- Step 3: Add some test tenants if needed
DO $$
DECLARE
    v_property_id UUID;
    v_unit_id UUID;
    v_tenant_user_id UUID;
BEGIN
    -- Get the test property
    SELECT id INTO v_property_id FROM public.properties LIMIT 1;
    
    IF v_property_id IS NOT NULL THEN
        -- Get a unit from the property
        SELECT id INTO v_unit_id 
        FROM public.property_unit_types 
        WHERE property_id = v_property_id 
        LIMIT 1;
        
        IF v_unit_id IS NOT NULL THEN
            -- Create a test tenant user
            INSERT INTO auth.users (
                email,
                encrypted_password,
                email_confirmed_at,
                raw_user_meta_data,
                created_at
            ) VALUES (
                'testtenant@ayden.local',
                crypt('password123', gen_salt('bf')),
                NOW(),
                '{"first_name":"Test","last_name":"Tenant"}',
                NOW()
            ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
            RETURNING id INTO v_tenant_user_id;
            
            -- Create profile for tenant
            INSERT INTO public.profiles (
                id,
                email,
                first_name,
                last_name,
                role,
                status,
                is_active,
                user_type,
                created_at,
                updated_at
            ) VALUES (
                v_tenant_user_id,
                'testtenant@ayden.local',
                'Test',
                'Tenant',
                'tenant',
                'active',
                true,
                'tenant',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                role = 'tenant',
                updated_at = NOW();
            
            -- Assign tenant to unit
            INSERT INTO public.tenants (
                user_id,
                property_id,
                unit_id,
                status,
                move_in_date,
                created_at,
                updated_at
            ) VALUES (
                v_tenant_user_id,
                v_property_id,
                v_unit_id,
                'active',
                NOW() - INTERVAL '3 months',
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id) DO NOTHING;
            
            RAISE NOTICE 'Test tenant created and assigned to unit';
        END IF;
    END IF;
END $$;

-- Step 4: Verification queries
SELECT 'Property Manager Assignments Summary' AS section;
SELECT 
    COUNT(*) as total_assignments,
    COUNT(DISTINCT property_manager_id) as unique_managers,
    COUNT(DISTINCT property_id) as unique_properties
FROM public.property_manager_assignments;

SELECT 'Active Tenants Summary' AS section;
SELECT 
    COUNT(*) as total_active_tenants,
    COUNT(DISTINCT property_id) as properties_with_tenants
FROM public.tenants
WHERE status = 'active';

SELECT 'Properties Summary' AS section;
SELECT 
    COUNT(*) as total_properties,
    COUNT(DISTINCT id) as unique_properties
FROM public.properties;
