-- Comprehensive diagnostic to find why technician sees 0 jobs

-- 1. Check if maintenance_requests table has any data
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as without_category,
  COUNT(CASE WHEN assigned_to_technician_id IS NULL THEN 1 END) as unassigned,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM maintenance_requests;

-- 2. Show first 10 requests to see their structure
SELECT 
  id,
  title,
  category_id,
  assigned_to_technician_id,
  property_id,
  tenant_id,
  status,
  created_at
FROM maintenance_requests
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check technician's assigned properties
SELECT 
  t.id,
  t.user_id,
  t.category_id,
  tc.name as category_name,
  COUNT(tpa.id) as assigned_properties
FROM technicians t
LEFT JOIN technician_categories tc ON t.category_id = tc.id
LEFT JOIN technician_property_assignments tpa ON t.id = tpa.technician_id AND tpa.is_active = true
GROUP BY t.id, t.user_id, t.category_id, tc.name
ORDER BY t.created_at DESC;

-- 4. For each category, count how many requests exist
SELECT 
  tc.id,
  tc.name,
  COUNT(mr.id) as request_count,
  COUNT(CASE WHEN mr.assigned_to_technician_id IS NULL THEN 1 END) as unassigned_count
FROM technician_categories tc
LEFT JOIN maintenance_requests mr ON tc.id = mr.category_id
GROUP BY tc.id, tc.name
ORDER BY request_count DESC;

-- 5. Check RLS policies on maintenance_requests
SELECT * FROM information_schema.tables 
WHERE table_name = 'maintenance_requests';

-- 6. Count requests by their related tables
SELECT 
  'total_requests' as type,
  COUNT(*) as count
FROM maintenance_requests
UNION ALL
SELECT 
  'requests_with_category' as type,
  COUNT(*) as count
FROM maintenance_requests
WHERE category_id IS NOT NULL
UNION ALL
SELECT 
  'requests_assigned' as type,
  COUNT(*) as count
FROM maintenance_requests
WHERE assigned_to_technician_id IS NOT NULL
UNION ALL
SELECT 
  'requests_for_property' as type,
  COUNT(*) as count
FROM maintenance_requests
WHERE property_id IS NOT NULL;
