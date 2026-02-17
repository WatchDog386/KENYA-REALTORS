-- Backfill category_id for maintenance requests
-- This handles requests created before category_id was properly integrated

-- STEP 1: For requests that are assigned to a technician, use their category
UPDATE maintenance_requests mr
SET category_id = t.category_id
WHERE mr.assigned_to_technician_id IS NOT NULL
  AND mr.category_id IS NULL
  AND EXISTS (
    SELECT 1 FROM technicians t 
    WHERE t.id = mr.assigned_to_technician_id
  );

-- STEP 2: For requests not assigned yet, try to find a technician assigned to that property
-- and use one of their categories (prefer the first one available)
UPDATE maintenance_requests mr
SET category_id = (
  SELECT DISTINCT t.category_id
  FROM technician_property_assignments tpa
  JOIN technicians t ON tpa.technician_id = t.id
  WHERE tpa.property_id = mr.property_id
    AND tpa.is_active = true
    AND t.category_id IS NOT NULL
  LIMIT 1
)
WHERE mr.category_id IS NULL
  AND mr.assigned_to_technician_id IS NULL
  AND mr.property_id IS NOT NULL;

-- STEP 3: For any remaining requests without category_id, assign a default category
-- (Choose "General" or the first available category)
UPDATE maintenance_requests mr
SET category_id = (
  SELECT id FROM technician_categories 
  WHERE is_active = true
  ORDER BY name
  LIMIT 1
)
WHERE mr.category_id IS NULL;

-- VERIFY: Show the results
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as with_category,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as without_category,
  COUNT(CASE WHEN assigned_to_technician_id IS NOT NULL THEN 1 END) as assigned_count,
  COUNT(CASE WHEN assigned_to_technician_id IS NULL THEN 1 END) as unassigned_count
FROM maintenance_requests;

-- Show sample of updated requests
SELECT 
  id,
  title,
  category_id,
  assigned_to_technician_id,
  property_id,
  status,
  created_at
FROM maintenance_requests
WHERE category_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
