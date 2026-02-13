-- FIX_ACCOUNTANT_ROLE_ASSIGNMENT.sql
-- This script ensures accountants, technicians, proprietors, and caretakers are properly registered
-- It first fixes schema strictness issues that prevent auto-creation

-- ==============================================================================
-- PART 0: FIX SCHEMA INCONSISTENCIES TO ALLOW AUTO-CREATION
-- ==============================================================================

-- 1. Add assigned_by to proprietors (was missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proprietors' AND column_name = 'assigned_by') THEN
        ALTER TABLE public.proprietors ADD COLUMN assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Make technician category optional initially (was NOT NULL)
ALTER TABLE public.technicians ALTER COLUMN category_id DROP NOT NULL;

-- 3. Make caretaker assignments optional initially (were NOT NULL)
ALTER TABLE public.caretakers ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN property_manager_id DROP NOT NULL;

-- ==============================================================================
-- PART 1: CREATE TRIGGER TO AUTO-CREATE ROLE-SPECIFIC RECORDS
-- ==============================================================================

-- Function to create role-specific records when profile role is updated or inserted
CREATE OR REPLACE FUNCTION create_role_specific_record()
RETURNS TRIGGER AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  -- Get the current authenticated user (if available)
  current_admin_id := auth.uid();
  
  -- Logic for INSERT or UPDATE where role is set/changed
  IF (TG_OP = 'INSERT' AND NEW.role IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NEW.role IS NOT NULL) THEN
     
    -- Delete existing role-specific record if switching roles (only for UPDATE)
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM accountants WHERE user_id = NEW.id;
        DELETE FROM technicians WHERE user_id = NEW.id;
        DELETE FROM proprietors WHERE user_id = NEW.id;
        DELETE FROM caretakers WHERE user_id = NEW.id;
    END IF;

    -- Create new role-specific record
    CASE NEW.role
      WHEN 'accountant' THEN
        INSERT INTO accountants (user_id, assigned_by, status, transactions_processed)
        VALUES (NEW.id, COALESCE(current_admin_id, NEW.id), 'active', 0)
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          updated_at = NOW();

      WHEN 'technician' THEN
        INSERT INTO technicians (user_id, status, is_available, total_jobs_completed)
        VALUES (NEW.id, 'active', true, 0)
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          is_available = true,
          updated_at = NOW();

      WHEN 'proprietor' THEN
        INSERT INTO proprietors (user_id, assigned_by, status)
        VALUES (NEW.id, COALESCE(current_admin_id, NEW.id), 'active')
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          updated_at = NOW();

      WHEN 'caretaker' THEN
        INSERT INTO caretakers (user_id, assigned_by, status)
        VALUES (NEW.id, COALESCE(current_admin_id, NEW.id), 'active')
        ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          updated_at = NOW();
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_role_specific_record ON profiles;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_create_role_specific_record
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_role_specific_record();

-- ==============================================================================
-- PART 2: CREATE EXISTING ROLE RECORDS FOR EXISTING USERS
-- ==============================================================================

-- Create accountant records for users with accountant role
INSERT INTO accountants (user_id, assigned_by, status, transactions_processed)
SELECT p.id, p.id as assigned_by, 'active', 0
FROM profiles p
WHERE p.role = 'accountant'
  AND p.id NOT IN (SELECT user_id FROM accountants)
ON CONFLICT (user_id) DO NOTHING;

-- Create technician records for users with technician role
INSERT INTO technicians (user_id, status, is_available, total_jobs_completed)
SELECT p.id, 'active', true, 0
FROM profiles p
WHERE p.role = 'technician'
  AND p.id NOT IN (SELECT user_id FROM technicians)
ON CONFLICT (user_id) DO NOTHING;

-- Create proprietor records for users with proprietor role
INSERT INTO proprietors (user_id, assigned_by, status)
SELECT p.id, p.id as assigned_by, 'active'
FROM profiles p
WHERE p.role = 'proprietor'
  AND p.id NOT IN (SELECT user_id FROM proprietors)
ON CONFLICT (user_id) DO NOTHING;

-- Create caretaker records for users with caretaker role
INSERT INTO caretakers (user_id, assigned_by, status, is_available)
SELECT p.id, p.id as assigned_by, 'active', true
FROM profiles p
WHERE p.role = 'caretaker'
  AND p.id NOT IN (SELECT user_id FROM caretakers)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- PART 3: VERIFICATION QUERIES
-- ==============================================================================

-- Verify accountants
SELECT COUNT(*) as accountant_count FROM accountants;

-- Verify technicians
SELECT COUNT(*) as technician_count FROM technicians;

-- Verify proprietors
SELECT COUNT(*) as proprietor_count FROM proprietors;

-- Verify caretakers
SELECT COUNT(*) as caretaker_count FROM caretakers;

-- Check if current accountant user is in the accountants table
SELECT 
  p.id,
  p.email,
  p.role,
  a.status as accountant_status
FROM profiles p
LEFT JOIN accountants a ON p.id = a.user_id
WHERE p.email = 'bildadogewno23@gmail.com';
