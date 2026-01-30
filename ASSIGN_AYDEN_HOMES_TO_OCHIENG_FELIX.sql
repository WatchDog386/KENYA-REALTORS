-- ============================================================================
-- Assign Ayden Homes Property to Ochieng Felix (Property Manager)
-- ============================================================================

-- Assign Ayden Homes to Ochieng Felix
UPDATE properties
SET manager_id = (
  SELECT id 
  FROM profiles 
  WHERE (first_name ILIKE 'ochieng' OR last_name ILIKE 'ochieng')
    AND (first_name ILIKE 'felix' OR last_name ILIKE 'felix')
    AND role = 'property_manager'
  LIMIT 1
)
WHERE LOWER(name) = 'ayden homes';

-- Verify the assignment
SELECT 
  p.id as property_id,
  p.name as property_name,
  p.address,
  p.city,
  m.id as manager_id,
  m.first_name,
  m.last_name,
  m.email,
  m.phone,
  m.role,
  m.status,
  p.created_at
FROM properties p
LEFT JOIN profiles m ON p.manager_id = m.id
WHERE LOWER(p.name) = 'ayden homes';
