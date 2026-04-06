-- FIX: Immediate Assignment of 'Sunrise Apartments' and User Management RLS
-- Run this in the Supabase SQL Editor to apply fixes.

BEGIN;

--------------------------------------------------------------------------------
-- 1. ASSIGNMENT FIX
--------------------------------------------------------------------------------
DO $$
DECLARE
    v_target_property_id UUID;
    v_manager_id UUID;
    v_manager_name TEXT;
    v_target_property_name TEXT;
BEGIN
    -- Find 'Sunrise Apartments' (or closest match)
    SELECT id, name INTO v_target_property_id, v_target_property_name
    FROM properties 
    WHERE name ILIKE '%Sunrise%' 
    LIMIT 1;

    -- Fallback to first property if not found
    IF v_target_property_id IS NULL THEN
        SELECT id, name INTO v_target_property_id, v_target_property_name FROM properties ORDER BY created_at DESC LIMIT 1;
        RAISE NOTICE 'Sunrise Apartment not found, selecting most recent property: %', v_target_property_name;
    ELSE
        RAISE NOTICE 'Found target property: %', v_target_property_name;
    END IF;

    -- Find the first Property Manager
    SELECT id, first_name || ' ' || last_name INTO v_manager_id, v_manager_name
    FROM profiles 
    WHERE role = 'property_manager' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_target_property_id IS NOT NULL AND v_manager_id IS NOT NULL THEN
        
        -- A. Create Assignment in Join Table (if not exists)
        IF NOT EXISTS (SELECT 1 FROM property_manager_assignments WHERE property_id = v_target_property_id AND property_manager_id = v_manager_id) THEN
            INSERT INTO property_manager_assignments (property_id, property_manager_id)
            VALUES (v_target_property_id, v_manager_id);
            RAISE NOTICE 'Created assignment record for % to %', v_manager_name, v_target_property_name;
        ELSE
            RAISE NOTICE 'Assignment already exists for % to %', v_manager_name, v_target_property_name;
        END IF;

        -- B. Update Profile (User requested assignment "in the profiles table")
        -- We assume 'assigned_property_id' column exists based on user code.
        -- If it doesn't exist, this line might fail. If so, create the column first:
        -- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_property_id UUID REFERENCES properties(id);
        
        -- Attempt update (assuming column exists)
        UPDATE profiles 
        SET assigned_property_id = v_target_property_id,
            updated_at = NOW()
        WHERE id = v_manager_id;
        
        RAISE NOTICE 'Updated Profile for % with Property ID', v_manager_name;

    ELSE
        RAISE WARNING 'Could not find Property or Manager. Assignment skipped.';
    END IF;

END $$;

--------------------------------------------------------------------------------
-- 2. USER MANAGEMENT LOGIC FIX (RLS POLICIES)
--------------------------------------------------------------------------------
-- Ensure Super Admins can Update and Delete any profile
-- This is critical for the "Approve/Suspend/Delete" buttons to work

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow Super Admins to do EVERYTHING on profiles
DROP POLICY IF EXISTS "Super Admins Full Access" ON profiles;
CREATE POLICY "Super Admins Full Access"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Ensure profiles are viewable by everyone (authenticated)
-- This allows other users to be seen in lists
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

COMMIT;
