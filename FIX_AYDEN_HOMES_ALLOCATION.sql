-- =============================================================================
-- FIX TENANT ALLOCATION TO AYDEN HOMES
-- =============================================================================
-- This script will:
-- 1. Verify/create Ayden Homes property
-- 2. Allocate fanteskorri36@gmail.com (tenant) to Ayden Homes
-- 3. Verify all user roles
-- =============================================================================

-- Step 1: Check current state
-- ===========================

-- Check user roles
SELECT 
  'USER ROLES' as check_type,
  au.email,
  ur.role_id
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email IN (
  'korrifantes36@gmail.com',
  'fanteskorri36@gmail.com', 
  'dancunmarshel@gmail.com'
)
ORDER BY au.email;

-- Check current properties
SELECT 
  'PROPERTIES' as check_type,
  id,
  name,
  city
FROM properties
WHERE name ILIKE '%ayden%' OR name ILIKE '%kisumu%'
ORDER BY name;

-- Check current tenant allocation
SELECT 
  'CURRENT ALLOCATION' as check_type,
  au.email,
  p.name as property_name,
  t.status,
  t.move_in_date
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';

-- Step 2: Create/Ensure Ayden Homes property exists
-- ==================================================

INSERT INTO properties (
  name, 
  address, 
  city, 
  state, 
  zip_code, 
  created_at, 
  updated_at
)
SELECT 
  'Ayden Homes',
  '123 Nairobi Avenue',
  'Nairobi',
  'Nairobi County',
  '00200',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM properties WHERE LOWER(name) = LOWER('Ayden Homes')
);

-- Step 3: Get IDs we'll need
-- ==========================

-- Get the Ayden Homes property ID
WITH ayden_homes AS (
  SELECT id as property_id
  FROM properties
  WHERE LOWER(name) = LOWER('Ayden Homes')
  LIMIT 1
),
tenant_user AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'fanteskorri36@gmail.com'
  LIMIT 1
)
-- Step 4: Update/Insert tenant allocation
-- =========================================
INSERT INTO tenants (
  user_id,
  property_id,
  status,
  move_in_date,
  created_at,
  updated_at
)
SELECT 
  tu.user_id,
  ah.property_id,
  'active',
  CURRENT_DATE,
  NOW(),
  NOW()
FROM tenant_user tu
CROSS JOIN ayden_homes ah
ON CONFLICT (user_id, property_id) DO UPDATE
SET 
  status = 'active',
  move_in_date = CURRENT_DATE,
  updated_at = NOW();

-- Step 5: Verify the allocation was successful
-- =============================================

SELECT 
  'VERIFICATION: ALLOCATION UPDATED' as status,
  au.email,
  p.name as property_name,
  p.address,
  p.city,
  t.status,
  t.move_in_date
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
WHERE au.email = 'fanteskorri36@gmail.com';

-- Step 6: Check lease information
-- ================================

SELECT 
  'LEASE INFO' as check_type,
  l.id as lease_id,
  p.name as property_name,
  l.monthly_rent,
  l.security_deposit,
  l.status as lease_status,
  l.start_date,
  l.end_date
FROM leases l
LEFT JOIN properties p ON l.property_id = p.id
WHERE p.name ILIKE 'Ayden Homes'
LIMIT 5;

-- If no lease exists for Ayden Homes, create one:

WITH ayden_homes AS (
  SELECT id as property_id
  FROM properties
  WHERE LOWER(name) = LOWER('Ayden Homes')
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
  ah.property_id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  35000, -- KES
  70000, -- KES
  'active',
  'Standard lease agreement',
  NOW(),
  NOW()
FROM ayden_homes ah
WHERE NOT EXISTS (
  SELECT 1 FROM leases WHERE property_id = ah.property_id
)
LIMIT 1;

-- Step 7: Final verification
-- ===========================

SELECT 
  'FINAL VERIFICATION' as status,
  au.email,
  p.name as property_name,
  p.city,
  t.status as tenant_status,
  COALESCE(l.monthly_rent, 0) as monthly_rent_ksh,
  COALESCE(l.security_deposit, 0) as deposit_ksh,
  l.status as lease_status
FROM tenants t
JOIN auth.users au ON t.user_id = au.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN leases l ON p.id = l.property_id
WHERE au.email = 'fanteskorri36@gmail.com';

-- =============================================================================
-- ALL USER ROLES VERIFICATION
-- =============================================================================

SELECT 
  'ALL USERS' as check_type,
  au.email,
  COALESCE(ur.role_id, 'NO ROLE') as role,
  au.created_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email IN (
  'korrifantes36@gmail.com',
  'fanteskorri36@gmail.com', 
  'dancunmarshel@gmail.com'
)
ORDER BY au.email;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- If you see:
-- - fanteskorri36@gmail.com -> Ayden Homes (active)
-- - monthly_rent_ksh = 35000 or similar
-- - deposit_ksh = 70000 or similar
-- Then the fix worked!
-- =============================================================================

