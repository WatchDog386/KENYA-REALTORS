-- ============================================================================
-- DATABASE MIGRATION: Initialize Technician Categories
-- Date: February 13, 2026
-- Purpose: Populate technician categories for property maintenance
-- ============================================================================

BEGIN;

-- Get super admin user
DO $$
DECLARE
  v_super_admin_id UUID;
BEGIN
  -- Get the first super admin or use a default
  SELECT id INTO v_super_admin_id FROM public.profiles 
  WHERE role = 'super_admin' 
  LIMIT 1;

  -- If no super admin exists, use a dummy ID (will fail if profiles table empty)
  IF v_super_admin_id IS NULL THEN
    v_super_admin_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Insert technician categories if they don't exist
  INSERT INTO public.technician_categories (name, description, is_active, created_by)
  VALUES 
    ('Plumbing', 'Water pipes, fixtures, drainage systems maintenance and repair', true, v_super_admin_id),
    ('Electrical', 'Power systems, wiring, outlets, switches, safety inspections', true, v_super_admin_id),
    ('HVAC', 'Heating, ventilation, air conditioning system maintenance and repair', true, v_super_admin_id),
    ('Carpentry', 'Wooden structures, doors, windows, frames, built-in repairs', true, v_super_admin_id),
    ('Tile Fixing', 'Tile installation, repair, and grouting for walls and floors', true, v_super_admin_id),
    ('Painting', 'Interior and exterior painting, wall preparation, aesthetic finishes', true, v_super_admin_id),
    ('Lift Maintenance', 'Elevator and lift installation, maintenance, safety checks', true, v_super_admin_id),
    ('Roofing', 'Roof repairs, waterproofing, material installation, inspections', true, v_super_admin_id),
    ('Pest Control', 'Pest elimination, prevention, and property sanitization services', true, v_super_admin_id),
    ('Masonry', 'Bricklaying, concrete work, wall repairs, structural fixes', true, v_super_admin_id),
    ('Landscaping', 'Grounds maintenance, garden care, outdoor aesthetics', true, v_super_admin_id),
    ('General Maintenance', 'Multi-purpose maintenance: locks, hinges, general repairs', true, v_super_admin_id)
  ON CONFLICT (name) DO NOTHING;

  RAISE NOTICE 'Technician categories initialized successfully';
END $$;

COMMIT;
