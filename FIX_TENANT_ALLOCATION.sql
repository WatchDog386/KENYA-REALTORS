-- =============================================================================
-- CHECK CURRENT USER ROLES AND ALLOCATIONS
-- =============================================================================

-- 1. Check roles table structure
SELECT * FROM roles LIMIT 10;

-- 2. Check user roles
SELECT 
  au.id,
  au.email,
  r.role_name,
  r.role_id
FROM auth.users au
LEFT JOIN user_roles r ON au.id = r.user_id
WHERE au.email IN (
  'korrifantes36@gmail.com',
  'fanteskorri36@gmail.com', 
  'dancunmarshel@gmail.com'
)
ORDER BY au.email;

-- 3. Check properties
SELECT 
  id,
  name,
  address,
  city,
  created_at
FROM properties
ORDER BY name;

-- 4. Check tenant allocations
SELECT 
  t.id,
  au.email,
  p.name as property_name,
  t.status,
  t.move_in_date
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
ORDER BY au.email;

-- 5. Check leases
SELECT 
  l.id,
  p.name as property_name,
  l.monthly_rent,
  l.security_deposit,
  l.status
FROM leases l
LEFT JOIN properties p ON l.property_id = p.id
ORDER BY p.name;

-- 6. Check if Ayden Homes exists
SELECT * FROM properties WHERE name LIKE '%Ayden%' OR name LIKE '%ayden%';

-- 7. Check what property fanteskorri36@gmail.com is allocated to
SELECT 
  t.*,
  p.name as property_name,
  p.address,
  au.email
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';

-- =============================================================================
-- AFTER CHECKING THE ABOVE, RUN THESE FIXES:
-- =============================================================================

-- If Ayden Homes doesn't exist, create it:
INSERT INTO properties (name, address, city, state, zip_code, created_at, updated_at)
VALUES (
  'Ayden Homes',
  '123 Nairobi Avenue',
  'Nairobi',
  'Nairobi County',
  '00200',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Update fanteskorri36@gmail.com to be allocated to Ayden Homes
WITH ayden_prop AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
)
UPDATE tenants
SET 
  property_id = (SELECT id FROM ayden_prop),
  status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fanteskorri36@gmail.com');

-- Verify the update
SELECT 
  au.email,
  p.name as property_name,
  t.status
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';

