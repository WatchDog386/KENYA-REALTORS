-- ============================================================================
-- Assign Ayden Homes Property to a Property Manager
-- ============================================================================
-- This script assigns the "Ayden Homes" property to the first available property manager

-- Get the first property manager and assign Ayden Homes to them
UPDATE properties
SET manager_id = (
  SELECT id 
  FROM profiles 
  WHERE role = 'property_manager' 
  AND status = 'active'
  LIMIT 1
)
WHERE LOWER(name) = 'ayden homes'
  AND manager_id IS NULL;

-- Verify the assignment
SELECT 
  p.id,
  p.name,
  p.address,
  p.city,
  m.id as manager_id,
  m.first_name,
  m.last_name,
  m.email,
  m.phone,
  m.role,
  m.status
FROM properties p
LEFT JOIN profiles m ON p.manager_id = m.id
WHERE LOWER(p.name) = 'ayden homes';
