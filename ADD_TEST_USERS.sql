-- Add Missing Test Users to the System
-- This script adds:
-- 1. Ochieng Felix - Property Manager
-- 2. Felix Ochieng - Tenant
-- And documents all users for reference

BEGIN;

-- First, let's verify Duncan Marshall is marked as super_admin
UPDATE profiles
SET role = 'super_admin', status = 'active'
WHERE email = 'duncanmarshel@gmail.com'
  AND (first_name = 'Duncan' AND last_name = 'Marshel');

-- Insert Ochieng Felix as Property Manager if not exists
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  status,
  avatar_url,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'ochieng.felix@example.com',
  'Ochieng',
  'Felix',
  '+254712345000',
  'property_manager',
  'active',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=OchiengFelix',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'property_manager', status = 'active';

-- Insert Felix Ochieng as Tenant if not exists
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  status,
  avatar_url,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'felix.ochieng@example.com',
  'Felix',
  'Ochieng',
  '+254722345000',
  'tenant',
  'active',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=FelixOchieng',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'tenant', status = 'active';

-- Verify the changes
SELECT 
  'User Role Verification' as section,
  COUNT(*) as total_users,
  SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
  SUM(CASE WHEN role = 'property_manager' THEN 1 ELSE 0 END) as property_managers,
  SUM(CASE WHEN role = 'tenant' THEN 1 ELSE 0 END) as tenants,
  SUM(CASE WHEN role = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
  SUM(CASE WHEN role = 'accountant' THEN 1 ELSE 0 END) as accountants
FROM profiles;

-- List all users by role
SELECT 
  'All Users' as section,
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM profiles
ORDER BY role, first_name;

-- Specifically show Duncan Marshall (Super Admin)
SELECT 
  'Duncan Marshall (Super Admin)' as user_info,
  id,
  email,
  first_name,
  last_name,
  role,
  status
FROM profiles
WHERE email = 'duncanmarshel@gmail.com';

-- Specifically show Ochieng Felix (Property Manager)
SELECT 
  'Ochieng Felix (Property Manager)' as user_info,
  id,
  email,
  first_name,
  last_name,
  role,
  status
FROM profiles
WHERE (first_name = 'Ochieng' AND last_name = 'Felix')
   OR email = 'ochieng.felix@example.com';

-- Specifically show Felix Ochieng (Tenant)
SELECT 
  'Felix Ochieng (Tenant)' as user_info,
  id,
  email,
  first_name,
  last_name,
  role,
  status
FROM profiles
WHERE (first_name = 'Felix' AND last_name = 'Ochieng')
   OR email = 'felix.ochieng@example.com';

COMMIT;
