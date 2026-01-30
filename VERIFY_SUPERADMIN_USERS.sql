-- Verify Super Admin Users and Roles in Database
-- This script checks:
-- 1. Duncan Marshall's role (should be super_admin)
-- 2. Ochieng Felix's role (should be property_manager)
-- 3. Other users in the system

-- Check all users with their roles
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at,
  last_login_at
FROM profiles
ORDER BY created_at DESC;

-- Check specifically for Duncan Marshall (Super Admin)
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM profiles
WHERE first_name = 'Duncan' AND last_name = 'Marshel'
   OR first_name = 'Duncan' AND last_name = 'Marshall';

-- Check specifically for Ochieng Felix (Property Manager)
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM profiles
WHERE (first_name = 'Ochieng' AND last_name = 'Felix')
   OR (first_name = 'Felix' AND last_name = 'Ochieng')
   OR email LIKE '%ochieng%'
   OR email LIKE '%felix%';

-- Check property manager count
SELECT 
  COUNT(*) as total_property_managers,
  role
FROM profiles
WHERE role = 'property_manager'
GROUP BY role;

-- Check all roles and their counts
SELECT 
  role,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- Check all super admins in the system
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at,
  last_login_at
FROM profiles
WHERE role = 'super_admin'
ORDER BY created_at DESC;
