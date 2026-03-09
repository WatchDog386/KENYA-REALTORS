-- ============================================================================
-- FIX: DROP NOT NULL CONSTRAINTS FOR ROLE CREATION
-- ============================================================================
-- This allows the trigger to create role-specific records even when
-- required fields (like category_id, property_id, assigned_by) aren't 
-- available during signup. These can be filled in later.
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

BEGIN;

-- DROP NOT NULL on technicians.category_id
-- (Users can add their category/specialization later)
ALTER TABLE public.technicians ALTER COLUMN category_id DROP NOT NULL;

-- DROP NOT NULL on caretakers fields
-- (These will be assigned by the property manager later)
ALTER TABLE public.caretakers ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN property_manager_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN assigned_by DROP NOT NULL;

-- DROP NOT NULL on accountants fields
-- (Will be assigned by super admin later)
ALTER TABLE public.accountants ALTER COLUMN assigned_by DROP NOT NULL;

-- Also drop NOT NULL on any other optional accountant fields if they exist
-- These can be filled in after account creation
ALTER TABLE public.accountants ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE public.accountants ALTER COLUMN hire_date DROP NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to confirm the constraints were dropped:
/*
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('technicians', 'caretakers', 'accountants')
AND column_name IN ('category_id', 'property_id', 'property_manager_id', 'assigned_by')
ORDER BY table_name, column_name;

-- Should show is_nullable = YES for all
*/
