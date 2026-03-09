-- ============================================================================
-- DIAGNOSTIC: WHY CAN'T TECHNICIAN SEE JOBS?
-- Run this in Supabase SQL Editor to check your data connections.
-- ============================================================================

-- 1. Check if the Technician exists and has a category
-- Replace 'YOUR_USER_ID' with the actual user_id from the logs or auth table if known, 
-- or just inspect the table manually.
SELECT t.id as tech_id, t.user_id, c.name as category_name, t.category_id
FROM public.technicians t
JOIN public.technician_categories c ON t.category_id = c.id;

-- 2. Check Property Assignments for Technicians
-- Does your technician have any active property assignments?
SELECT tpa.technician_id, p.name as property_name, tpa.property_id
FROM public.technician_property_assignments tpa
JOIN public.properties p ON tpa.property_id = p.id
WHERE tpa.is_active = true;

-- 3. Check Available "Pool" Jobs
-- These are jobs that SHOULD show up (Unassigned, matching category, matching property)
SELECT mr.id, mr.title, mr.status, c.name as category_required, p.name as at_property
FROM public.maintenance_requests mr
JOIN public.technician_categories c ON mr.category_id = c.id
JOIN public.properties p ON mr.property_id = p.id
WHERE mr.assigned_to_technician_id IS NULL;

-- If Query 3 returns results, but you can't see them in the App, 
-- IT IS DEFINITELY AN RLS (PERMISSION) ISSUE.
-- Run "FIX_TECHNICIAN_RLS_VISIBILITY.sql" to fix it.
