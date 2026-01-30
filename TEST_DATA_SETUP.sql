-- =============================================================================
-- TEST DATA SETUP FOR AYDEN HOMES PROPERTY AND TEST TENANTS
-- =============================================================================
-- This migration:
-- 1. Creates "Ayden Homes" property in the properties table
-- 2. Creates test units for Ayden Homes
-- 3. Creates a test lease agreement
-- 4. Allocates test tenants to Ayden Homes
-- 5. Ensures data is ready for functional testing
-- =============================================================================

-- 1. INSERT AYDEN HOMES PROPERTY
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

-- Get the property ID (we'll use this in subsequent queries)
-- In PostgreSQL, you'll need to save this ID for the next steps
-- For testing purposes, assume the ID will be auto-generated

-- 2. INSERT TEST UNITS FOR AYDEN HOMES
-- First, get the Ayden Homes property ID
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
)
INSERT INTO units (property_id, unit_number, unit_type, created_at, updated_at)
SELECT 
  ap.id,
  unit_num,
  'apartment',
  NOW(),
  NOW()
FROM ayden_property ap,
LATERAL (
  SELECT 'Unit A-101' as unit_num
  UNION ALL SELECT 'Unit A-102'
  UNION ALL SELECT 'Unit A-103'
) units
ON CONFLICT (property_id, unit_number) DO NOTHING;

-- 3. CREATE TEST LEASE AGREEMENT
-- Note: You'll need to have test tenant users created in auth.users first
-- and then in the public.profiles table
-- This creates a lease linking tenants to the property
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
test_unit AS (
  SELECT id FROM units 
  WHERE property_id = (SELECT id FROM ayden_property)
  AND unit_number = 'Unit A-101'
  LIMIT 1
)
INSERT INTO leases (
  property_id,
  start_date,
  end_date,
  monthly_rent,
  security_deposit,
  status,
  terms,
  created_at,
  updated_at
)
SELECT
  ap.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  35000, -- 35,000 KES monthly rent
  70000, -- 70,000 KES security deposit (2 months)
  'active',
  'Standard lease agreement with monthly payment terms',
  NOW(),
  NOW()
FROM ayden_property ap
WHERE NOT EXISTS (
  SELECT 1 FROM leases WHERE property_id = ap.id
)
LIMIT 1;

-- 4. ADDITIONAL LEASES FOR OTHER UNITS
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
)
INSERT INTO leases (
  property_id,
  start_date,
  end_date,
  monthly_rent,
  security_deposit,
  status,
  terms,
  created_at,
  updated_at
)
SELECT
  ap.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  40000, -- 40,000 KES monthly rent
  80000, -- 80,000 KES security deposit
  'active',
  'Standard lease agreement with monthly payment terms',
  NOW(),
  NOW()
FROM ayden_property ap
WHERE (SELECT COUNT(*) FROM leases WHERE property_id = ap.id) < 3
LIMIT 2;

-- 5. CREATE TENANT ALLOCATIONS
-- This assumes you have test users with these emails:
-- Test Tenant 1: tenant1@test.com
-- Test Tenant 2: tenant2@test.com
-- Test Tenant 3: tenant3@test.com

WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
test_leases AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as lease_num
  FROM leases
  WHERE property_id = (SELECT id FROM ayden_property)
  ORDER BY created_at
  LIMIT 3
)
UPDATE tenants
SET 
  property_id = (SELECT id FROM ayden_property),
  status = 'active',
  move_in_date = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('tenant1@test.com', 'tenant2@test.com', 'tenant3@test.com')
);

-- 6. INSERT TENANT RECORDS IF THEY DON'T EXIST
-- This creates the tenant link between users and properties
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
ayden_units AS (
  SELECT id, unit_number, ROW_NUMBER() OVER (ORDER BY unit_number) as unit_num
  FROM units
  WHERE property_id = (SELECT id FROM ayden_property)
  LIMIT 3
),
test_users AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY email) as user_num
  FROM auth.users
  WHERE email IN ('tenant1@test.com', 'tenant2@test.com', 'tenant3@test.com')
  ORDER BY email
)
INSERT INTO tenants (user_id, property_id, unit_id, status, move_in_date, created_at, updated_at)
SELECT 
  tu.id,
  ap.id,
  au.id,
  'active',
  CURRENT_DATE,
  NOW(),
  NOW()
FROM test_users tu
CROSS JOIN LATERAL (
  SELECT id FROM ayden_units WHERE unit_num = tu.user_num LIMIT 1
) au
CROSS JOIN ayden_property ap
ON CONFLICT (user_id, property_id) DO NOTHING;

-- 7. CREATE SAMPLE PAYMENTS FOR TEST TENANTS
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
test_tenants AS (
  SELECT user_id, id as tenant_id
  FROM tenants
  WHERE property_id = (SELECT id FROM ayden_property)
)
INSERT INTO rent_payments (
  user_id,
  property_id,
  amount,
  payment_date,
  due_date,
  status,
  payment_method,
  reference_number,
  created_at,
  updated_at
)
SELECT 
  tt.user_id,
  ap.id,
  35000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'paid',
  'M-Pesa',
  'REF-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || ROW_NUMBER() OVER (ORDER BY tt.user_id),
  NOW(),
  NOW()
FROM test_tenants tt
CROSS JOIN ayden_property ap
WHERE NOT EXISTS (
  SELECT 1 FROM rent_payments 
  WHERE user_id = tt.user_id AND property_id = ap.id
);

-- 8. CREATE SAMPLE MAINTENANCE REQUESTS
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
test_tenants AS (
  SELECT user_id FROM tenants
  WHERE property_id = (SELECT id FROM ayden_property)
  LIMIT 3
)
INSERT INTO maintenance_requests (
  user_id,
  property_id,
  title,
  description,
  status,
  priority,
  requested_date,
  created_at,
  updated_at
)
SELECT 
  user_id,
  (SELECT id FROM ayden_property),
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'Leaking Faucet'
    WHEN 2 THEN 'Broken Window'
    WHEN 3 THEN 'Paint Touch-up'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'Kitchen faucet is leaking. Needs immediate repair.'
    WHEN 2 THEN 'Bedroom window glass is cracked. Safety hazard.'
    WHEN 3 THEN 'Paint in living room needs touch-up. Multiple spots.'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'in_progress'
    WHEN 3 THEN 'completed'
  END,
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'high'
    WHEN 2 THEN 'urgent'
    WHEN 3 THEN 'medium'
  END,
  CURRENT_DATE - INTERVAL '5 days',
  NOW(),
  NOW()
FROM test_tenants
ON CONFLICT DO NOTHING;

-- 9. CREATE SAMPLE DOCUMENTS FOR TEST TENANTS
WITH ayden_property AS (
  SELECT id FROM properties WHERE name = 'Ayden Homes' LIMIT 1
),
test_tenants AS (
  SELECT user_id FROM tenants
  WHERE property_id = (SELECT id FROM ayden_property)
  LIMIT 3
)
INSERT INTO documents (
  user_id,
  title,
  file_type,
  file_url,
  document_type,
  created_at,
  updated_at
)
SELECT 
  user_id,
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'Lease Agreement 2024'
    WHEN 2 THEN 'Security Deposit Receipt'
    WHEN 3 THEN 'Maintenance Request Log'
  END,
  'pdf',
  '/documents/' || TO_CHAR(NOW(), 'YYYY/MM/DD') || '/doc-' || ABS(EXTRACT(EPOCH FROM NOW())::int) || '.pdf',
  CASE ROW_NUMBER() OVER (ORDER BY user_id)
    WHEN 1 THEN 'lease'
    WHEN 2 THEN 'receipt'
    WHEN 3 THEN 'other'
  END,
  NOW(),
  NOW()
FROM test_tenants
ON CONFLICT DO NOTHING;

-- 10. VERIFY SETUP
-- Display the created property and tenant allocations
SELECT 
  'PROPERTY CREATED' as status,
  p.name,
  p.address,
  p.city,
  (SELECT COUNT(*) FROM units WHERE property_id = p.id) as total_units,
  (SELECT COUNT(*) FROM tenants WHERE property_id = p.id) as allocated_tenants,
  (SELECT COUNT(*) FROM leases WHERE property_id = p.id) as active_leases
FROM properties p
WHERE p.name = 'Ayden Homes';

-- Display tenant allocations
SELECT 
  'TENANTS ALLOCATED' as status,
  au.email,
  t.status,
  t.move_in_date,
  u.unit_number,
  p.name as property_name
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
JOIN properties p ON t.property_id = p.id
LEFT JOIN units u ON t.unit_id = u.id
WHERE p.name = 'Ayden Homes'
ORDER BY au.email;

-- =============================================================================
-- SUMMARY OF CREATED TEST DATA:
-- =============================================================================
-- Property: Ayden Homes
--   - Location: Nairobi, Nairobi County
--   - Units: 3 (Unit A-101, A-102, A-103)
--   - Leases: 3 active leases @ 35,000-40,000 KES/month
--   
-- Test Tenants (to be created with these emails):
--   1. tenant1@test.com - Allocated to Unit A-101
--   2. tenant2@test.com - Allocated to Unit A-102
--   3. tenant3@test.com - Allocated to Unit A-103
--
-- Sample Data Created:
--   - 3 rent payment records
--   - 3 maintenance requests (pending, in-progress, completed)
--   - 3 document uploads
--   - Full tenant-property allocation
--
-- NEXT STEPS:
-- 1. Create test user accounts with the emails above in Supabase Auth
-- 2. Run this SQL migration in Supabase SQL Editor
-- 3. Test tenant dashboard - tenants should see "AYDEN HOMES" in header
-- 4. Property name should change based on tenant allocation
-- =============================================================================
