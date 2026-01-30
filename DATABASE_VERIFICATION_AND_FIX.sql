-- ============================================================================
-- DATABASE VERIFICATION AND REPAIR SCRIPT
-- ============================================================================
-- This script verifies and repairs all database issues with the
-- Super Admin Dashboard, Property Management, and related features
--
-- Run this in the Supabase SQL Editor to fix all issues
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY TABLE STRUCTURE
-- ============================================================================

-- 1.1: Check if profiles table exists and has correct structure
SELECT 'profiles' as table_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- 1.2: Check if properties table exists and has correct structure
SELECT 'properties' as table_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- ============================================================================
-- SECTION 2: VERIFY CRITICAL COLUMNS
-- ============================================================================

-- 2.1: Check profiles table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2.2: Check properties table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: VERIFY DATA INTEGRITY
-- ============================================================================

-- 3.1: Count profiles by role
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- 3.2: Count properties
SELECT COUNT(*) as total_properties FROM properties;

-- 3.3: Check properties with assigned managers
SELECT 
  COUNT(*) as total_properties,
  SUM(CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN 1 ELSE 0 END) as with_manager,
  SUM(CASE WHEN manager_id IS NULL AND property_manager_id IS NULL THEN 1 ELSE 0 END) as without_manager
FROM properties;

-- 3.4: Check for properties with invalid manager_ids
SELECT 
  p.id,
  p.name,
  p.manager_id,
  p.property_manager_id,
  CASE 
    WHEN p.manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.manager_id) THEN 'INVALID manager_id'
    WHEN p.property_manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.property_manager_id) THEN 'INVALID property_manager_id'
    ELSE 'OK'
  END as status
FROM properties p
WHERE (
  (p.manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.manager_id)) OR
  (p.property_manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.property_manager_id))
);

-- 3.5: Show all properties with their assigned managers
SELECT 
  p.id as property_id,
  p.name as property_name,
  p.address,
  p.city,
  p.manager_id,
  p.property_manager_id,
  pr.first_name,
  pr.last_name,
  pr.email,
  pr.role,
  pr.status,
  CASE 
    WHEN p.manager_id IS NOT NULL OR p.property_manager_id IS NOT NULL THEN 'ASSIGNED'
    ELSE 'UNASSIGNED'
  END as assignment_status
FROM properties p
LEFT JOIN profiles pr ON (p.manager_id = pr.id OR p.property_manager_id = pr.id)
ORDER BY p.created_at DESC;

-- ============================================================================
-- SECTION 4: ENSURE CRITICAL CONSTRAINTS AND RELATIONSHIPS
-- ============================================================================

-- 4.1: Ensure profiles table has proper constraints
DO $$
BEGIN
  -- Check and create role check constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name ILIKE '%role%check%'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profile_role_check 
      CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'maintenance', 'accountant', 'admin', 'manager'));
  END IF;
END $$;

-- 4.2: Ensure properties table has proper foreign key constraints
DO $$
BEGIN
  -- Check if manager_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'properties' AND constraint_name ILIKE '%manager_id%fk%'
  ) THEN
    -- Try to add if not exists
    BEGIN
      ALTER TABLE properties 
      ADD CONSTRAINT properties_manager_id_fk 
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Check if property_manager_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'properties' AND constraint_name ILIKE '%property_manager_id%fk%'
  ) THEN
    -- Try to add if not exists
    BEGIN
      ALTER TABLE properties 
      ADD CONSTRAINT properties_property_manager_id_fk 
      FOREIGN KEY (property_manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: CREATE HELPER VIEWS
-- ============================================================================

-- 5.1: Create view for properties with manager details
CREATE OR REPLACE VIEW v_properties_with_managers AS
SELECT 
  p.id,
  p.name,
  p.property_name,
  p.description,
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.country,
  p.postal_code,
  p.property_type,
  p.type,
  p.status,
  p.is_active,
  p.total_units,
  p.occupied_units,
  p.available_units,
  p.monthly_rent,
  p.security_deposit,
  p.manager_id,
  p.property_manager_id,
  p.owner_id,
  p.super_admin_id,
  p.amenities,
  p.images,
  p.coordinates,
  p.latitude,
  p.longitude,
  p.year_built,
  p.square_feet,
  p.created_at,
  p.updated_at,
  -- Manager fields
  COALESCE(pr.id, pm.id) as assigned_manager_id,
  COALESCE(pr.first_name, pm.first_name) as manager_first_name,
  COALESCE(pr.last_name, pm.last_name) as manager_last_name,
  COALESCE(pr.email, pm.email) as manager_email,
  COALESCE(pr.phone, pm.phone) as manager_phone,
  COALESCE(pr.role, pm.role) as manager_role,
  COALESCE(pr.status, pm.status) as manager_status,
  CASE 
    WHEN COALESCE(pr.id, pm.id) IS NOT NULL THEN 'ASSIGNED'
    ELSE 'UNASSIGNED'
  END as assignment_status
FROM properties p
LEFT JOIN profiles pr ON p.property_manager_id = pr.id
LEFT JOIN profiles pm ON p.manager_id = pm.id AND pr.id IS NULL;

-- ============================================================================
-- SECTION 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- 6.1: Create indexes on properties table
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_manager_id ON properties(property_manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);

-- 6.2: Create indexes on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ============================================================================
-- SECTION 7: VERIFICATION REPORT
-- ============================================================================

SELECT '=== DATABASE VERIFICATION COMPLETE ===' as message;

-- Show summary
WITH property_summary AS (
  SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN 1 END) as with_assigned_manager,
    COUNT(CASE WHEN manager_id IS NULL AND property_manager_id IS NULL THEN 1 END) as without_manager,
    COUNT(DISTINCT CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN manager_id ELSE property_manager_id END) as unique_managers
  FROM properties
),
profile_summary AS (
  SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role IN ('property_manager', 'manager') THEN 1 END) as property_managers
  FROM profiles
)
SELECT 
  'PROPERTY SUMMARY' as category,
  ps.total_properties::text as total_properties,
  ps.with_assigned_manager::text as properties_with_managers,
  ps.without_manager::text as properties_without_managers,
  ps.unique_managers::text as unique_managers,
  prfs.total_profiles::text as total_user_profiles,
  prfs.property_managers::text as property_manager_profiles
FROM property_summary ps, profile_summary prfs;
