-- FORCE ASSIGN SUNRISE APARTMENTS TO A PROPERTY MANAGER
-- This script finds "Sunrise Apartments" and assigns it to the first active Property Manager found.

DO $$
DECLARE
    v_property_id UUID;
    v_manager_id UUID;
BEGIN
    -- 1. Find the property
    SELECT id INTO v_property_id
    FROM properties
    WHERE name = 'Sunrise Apartments'
    LIMIT 1;

    IF v_property_id IS NULL THEN
        RAISE NOTICE 'Property "Sunrise Apartments" not found.';
        RETURN;
    END IF;

    -- 2. Find a Property Manager (Active)
    SELECT id INTO v_manager_id
    FROM profiles
    WHERE role = 'property_manager'
    AND status = 'active'
    LIMIT 1;

    IF v_manager_id IS NULL THEN
        -- Try finding one even if not active, or just the first one
        SELECT id INTO v_manager_id
        FROM profiles
        WHERE role = 'property_manager'
        LIMIT 1;
    END IF;

    IF v_manager_id IS NULL THEN
        RAISE NOTICE 'No Property Manager found.';
        RETURN;
    END IF;

    -- 3. Delete existing assignments for this property to avoid duplicates (or just ensuring clean state)
    -- dependent on requirements, but for "force assign" this is often best.
    -- DELETE FROM property_manager_assignments WHERE property_id = v_property_id;

    -- 4. Insert Assignment (Upsert-like logic)
    IF NOT EXISTS (
        SELECT 1 FROM property_manager_assignments 
        WHERE property_id = v_property_id AND property_manager_id = v_manager_id
    ) THEN
        INSERT INTO property_manager_assignments (property_id, property_manager_id)
        VALUES (v_property_id, v_manager_id);
        
        RAISE NOTICE 'Assigned "Sunrise Apartments" (%) to Manager (%)', v_property_id, v_manager_id;
    ELSE
        RAISE NOTICE 'Assignment already exists for "Sunrise Apartments" and this Manager.';
    END IF;

END $$;
