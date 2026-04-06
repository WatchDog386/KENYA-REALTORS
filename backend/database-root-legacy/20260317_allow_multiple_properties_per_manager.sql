-- ============================================================================
-- MIGRATION: Allow Multiple Properties Per Manager (March 17, 2026)
-- ============================================================================
-- Modifies property_manager_assignments table to allow one manager to manage
-- multiple properties. Keeps the constraint that one property can only have
-- one assigned manager.

BEGIN;

-- Drop the existing UNIQUE constraint on property_manager_id
-- This currently enforces ONE property per manager
ALTER TABLE public.property_manager_assignments DROP CONSTRAINT IF EXISTS property_manager_assignments_property_manager_id_key;

-- Keep the UNIQUE constraint on property_id (one manager per property)
-- This is already in place: UNIQUE(property_id)

-- Remove duplicate UNIQUE constraint if it exists on property_id
ALTER TABLE public.property_manager_assignments DROP CONSTRAINT IF EXISTS property_manager_assignments_property_id_key;

-- Re-add the property_id UNIQUE constraint explicitly
ALTER TABLE public.property_manager_assignments ADD CONSTRAINT property_manager_assignments_property_id_unique UNIQUE(property_id);

-- Add a composite unique constraint to prevent duplicate assignments
-- (same manager to same property multiple times is not allowed)
ALTER TABLE public.property_manager_assignments ADD CONSTRAINT property_manager_assignments_unique UNIQUE(property_manager_id, property_id);

-- Create an index on property_manager_id for faster queries when finding all properties for a manager
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_manager_id 
  ON public.property_manager_assignments(property_manager_id);

-- Create an index on property_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_property_id 
  ON public.property_manager_assignments(property_id);

COMMIT;

-- Verification Queries (run these after migration):
-- 1. Check if a manager has multiple properties:
--    SELECT property_manager_id, COUNT(*) as property_count 
--    FROM property_manager_assignments 
--    GROUP BY property_manager_id 
--    HAVING COUNT(*) > 1;

-- 2. Check if a property has multiple managers (should be 0 rows):
--    SELECT property_id, COUNT(*) as manager_count 
--    FROM property_manager_assignments 
--    GROUP BY property_id 
--    HAVING COUNT(*) > 1;
