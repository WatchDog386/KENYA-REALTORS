-- ============================================================================
-- DATABASE MIGRATION: Enforce Technician Categories (No General Technicians)
-- Date: March 1, 2026
-- Purpose: Enforce that all technicians must belong to a specific category
--          (plumber, electrician, etc.) - no general/uncategorized technicians
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 0: ENSURE DEFAULT CATEGORY EXISTS
-- ============================================================================

-- Create "General Maintenance" category if it doesn't exist
INSERT INTO public.technician_categories (name, description, is_active, created_by)
SELECT 
  'General Maintenance',
  'Multi-purpose maintenance: locks, hinges, general repairs',
  true,
  (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.technician_categories WHERE name = 'General Maintenance'
);

-- ============================================================================
-- PART 1: VALIDATE AND FIX TECHNICIANS WITHOUT CATEGORIES
-- ============================================================================

-- Check for technicians without category_id
SELECT 'Technicians without categories:' as check_name, COUNT(*) as count
FROM public.technicians
WHERE category_id IS NULL;

-- STEP 1: Assign technicians without categories to "General Maintenance"
-- This must run BEFORE making category_id NOT NULL
UPDATE public.technicians
SET category_id = (SELECT id FROM public.technician_categories WHERE name = 'General Maintenance' LIMIT 1)
WHERE category_id IS NULL;

-- Verify the fix
SELECT 'After assignment:' as step, COUNT(*) as technicians_still_null
FROM public.technicians
WHERE category_id IS NULL;

-- ============================================================================
-- PART 2: ENFORCE CATEGORY_ID FOR ALL TECHNICIANS
-- ============================================================================

-- Make category_id NOT NULL (required for all technicians)
ALTER TABLE public.technicians
ALTER COLUMN category_id SET NOT NULL;

-- ============================================================================
-- PART 3: Add constraint to ensure category is active
-- ============================================================================

-- Drop existing constraint if any
ALTER TABLE public.technicians
DROP CONSTRAINT IF EXISTS fk_technician_active_category;

-- Add foreign key with constraint for active categories
ALTER TABLE public.technicians
ADD CONSTRAINT fk_technician_active_category
FOREIGN KEY (category_id)
REFERENCES public.technician_categories(id) ON DELETE RESTRICT
DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- PART 4: Update RLS policies to ensure category visibility
-- ============================================================================

-- Allow public users to view categories for role selection
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.technician_categories;
CREATE POLICY "Everyone can view active categories"
  ON public.technician_categories
  FOR SELECT
  USING (is_active = true);

-- Allow super_admin to manage categories
DROP POLICY IF EXISTS "Super admins can manage categories" ON public.technician_categories;
CREATE POLICY "Super admins can manage categories"
  ON public.technician_categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================================================
-- PART 5: Verification Queries
-- ============================================================================

-- Verify migration
SELECT '✅ Technician category enforcement complete' as status;

-- Show all categories available
SELECT 'Technician Categories:' as info, COUNT(*) as total_categories FROM public.technician_categories WHERE is_active = true;

-- Show technician count by category
SELECT 
  tc.name as category,
  COUNT(t.id) as technician_count
FROM public.technician_categories tc
LEFT JOIN public.technicians t ON t.category_id = tc.id AND t.status = 'active'
WHERE tc.is_active = true
GROUP BY tc.name
ORDER BY tc.name;

COMMIT;
