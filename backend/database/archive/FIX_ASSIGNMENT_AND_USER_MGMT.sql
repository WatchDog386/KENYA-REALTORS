-- FIX: Assign Sunrise Apartments to the first available Property Manager
-- and ensure User Management logic relies on profiles status.

BEGIN;

-- 1. Find the Property 'Sunrise Apartments' (or fallback to the first property found)
DO $$
DECLARE
    v_property_id UUID;
    v_manager_id UUID;
BEGIN
    -- Get 'Sunrise Apartments' id
    SELECT id INTO v_property_id FROM properties 
    WHERE name ILIKE '%Sunrise Apartment%' 
    LIMIT 1;

    -- If not found, get ANY property
    IF v_property_id IS NULL THEN
        SELECT id INTO v_property_id FROM properties LIMIT 1;
    END IF;

    -- Get the first available Property Manager
    SELECT id INTO v_manager_id FROM profiles 
    WHERE role = 'property_manager' 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- If we have both, perform the assignment
    IF v_property_id IS NOT NULL AND v_manager_id IS NOT NULL THEN
        -- Check if assignment already exists
        IF NOT EXISTS (SELECT 1 FROM property_manager_assignments WHERE property_id = v_property_id AND property_manager_id = v_manager_id) THEN
            INSERT INTO property_manager_assignments (property_id, property_manager_id, assigned_by)
            VALUES (v_property_id, v_manager_id, (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1));
            
            RAISE NOTICE 'Assigned Property % to Manager %', v_property_id, v_manager_id;
        ELSE
            RAISE NOTICE 'Assignment already exists for Property % and Manager %', v_property_id, v_manager_id;
        END IF;
    ELSE
        RAISE NOTICE 'Missing property or manager. Property: %, Manager: %', v_property_id, v_manager_id;
    END IF;
END $$;

-- 2. Verify and Fix User Management Logic (Policies)
-- Ensure Super Admins can update profiles to 'active', 'suspended'
-- This logic usually resides in RLS policies. We will recreate/ensure they exist.

-- Policy for Super Admins to update ANY profile
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy for Super Admins to delete ANY profile
DROP POLICY IF EXISTS "Super admins can delete any profile" ON profiles;
CREATE POLICY "Super admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

COMMIT;
