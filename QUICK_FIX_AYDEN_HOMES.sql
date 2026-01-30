-- ============================================================================
-- QUICK FIX: AYDEN HOMES MANAGER ASSIGNMENT
-- ============================================================================
-- This script diagnoses and fixes the specific issue with Ayden Homes
-- not showing the assigned manager in the dashboard
--
-- Run this script step-by-step to identify and resolve the issue
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY OCHIENG FELIX EXISTS
-- ============================================================================

SELECT 'STEP 1: Checking if Ochieng Felix exists...' as step;

SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  role,
  status,
  created_at
FROM profiles
WHERE (
  (first_name ILIKE '%ochieng%' OR last_name ILIKE '%ochieng%')
  OR (first_name ILIKE '%felix%' OR last_name ILIKE '%felix%')
  OR email ILIKE '%ochieng%'
)
ORDER BY created_at DESC;

-- If no results, create the manager profile
-- UNCOMMENT AND MODIFY THE FOLLOWING IF OCHIENG FELIX DOESN'T EXIST:
/*
-- First, you need to create an auth user
-- This must be done via Supabase Dashboard or Auth API

-- Then add to profiles:
INSERT INTO profiles (id, email, first_name, last_name, phone, role, status, created_at, updated_at)
VALUES (
  'PASTE_AUTH_USER_ID_HERE',  -- Replace with actual auth user ID
  'ochieng.felix@example.com',
  'Ochieng',
  'Felix',
  '+254712345678',
  'property_manager',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'property_manager',
  status = 'active',
  updated_at = NOW();
*/

-- ============================================================================
-- STEP 2: VERIFY AYDEN HOMES PROPERTY EXISTS
-- ============================================================================

SELECT 'STEP 2: Checking if Ayden Homes property exists...' as step;

SELECT 
  id,
  name,
  address,
  city,
  country,
  manager_id,
  property_manager_id,
  total_units,
  monthly_rent,
  created_at,
  updated_at
FROM properties
WHERE LOWER(name) LIKE '%ayden%homes%'
  OR LOWER(address) LIKE '%ayden%';

-- If no results, create the property:
/*
INSERT INTO properties (
  name, address, city, state, zip_code, country, 
  property_type, type, status, is_active,
  total_units, occupied_units, available_units,
  monthly_rent, security_deposit,
  description, amenities, created_at, updated_at
) VALUES (
  'Ayden Homes',
  '123 Ayden Road',
  'Nairobi',
  'Nairobi County',
  '00100',
  'Kenya',
  'apartment',
  'apartment',
  'active',
  TRUE,
  24,
  0,
  24,
  45000,
  90000,
  'Modern apartment complex with premium amenities and strategic location',
  ARRAY['Swimming Pool', 'Gym', 'Parking', 'Security', 'Wi-Fi', '24/7 Power'],
  NOW(),
  NOW()
) RETURNING id, name, created_at;
*/

-- ============================================================================
-- STEP 3: CHECK CURRENT ASSIGNMENT STATUS
-- ============================================================================

SELECT 'STEP 3: Checking current assignment status...' as step;

WITH ochieng AS (
  SELECT id, first_name, last_name, email
  FROM profiles
  WHERE (
    (first_name ILIKE '%ochieng%' OR last_name ILIKE '%ochieng%')
    OR (first_name ILIKE '%felix%' OR last_name ILIKE '%felix%')
    OR email ILIKE '%ochieng%'
  )
  LIMIT 1
),
ayden AS (
  SELECT id, name
  FROM properties
  WHERE LOWER(name) LIKE '%ayden%homes%'
    OR LOWER(address) LIKE '%ayden%'
  LIMIT 1
)
SELECT 
  a.id as ayden_id,
  a.name as property_name,
  o.id as manager_id,
  o.first_name,
  o.last_name,
  o.email,
  CASE 
    WHEN o.id IS NULL THEN 'ERROR: Manager not found'
    WHEN a.id IS NULL THEN 'ERROR: Property not found'
    ELSE 'Ready to assign'
  END as status
FROM ayden a
CROSS JOIN ochieng o;

-- ============================================================================
-- STEP 4: ASSIGN MANAGER TO PROPERTY
-- ============================================================================

SELECT 'STEP 4: Assigning manager to property...' as step;

-- Find the actual IDs
WITH ochieng AS (
  SELECT id
  FROM profiles
  WHERE (
    (first_name ILIKE '%ochieng%' OR last_name ILIKE '%ochieng%')
    OR (first_name ILIKE '%felix%' OR last_name ILIKE '%felix%')
    OR email ILIKE '%ochieng%'
  )
  LIMIT 1
),
ayden AS (
  SELECT id
  FROM properties
  WHERE LOWER(name) LIKE '%ayden%homes%'
    OR LOWER(address) LIKE '%ayden%'
  LIMIT 1
)
UPDATE properties
SET 
  manager_id = (SELECT id FROM ochieng),
  property_manager_id = (SELECT id FROM ochieng),
  updated_at = NOW()
WHERE id = (SELECT id FROM ayden)
RETURNING id, name, manager_id, property_manager_id, updated_at;

-- ============================================================================
-- STEP 5: VERIFY ASSIGNMENT
-- ============================================================================

SELECT 'STEP 5: Verifying assignment...' as step;

SELECT 
  p.id as property_id,
  p.name as property_name,
  p.address,
  p.city,
  p.manager_id,
  p.property_manager_id,
  pr.id as manager_profile_id,
  pr.first_name as manager_first_name,
  pr.last_name as manager_last_name,
  pr.email as manager_email,
  pr.phone as manager_phone,
  pr.role as manager_role,
  pr.status as manager_status,
  p.updated_at,
  CASE 
    WHEN pr.id IS NOT NULL THEN '✅ ASSIGNED'
    ELSE '❌ UNASSIGNED'
  END as assignment_status
FROM properties p
LEFT JOIN profiles pr ON (p.manager_id = pr.id OR p.property_manager_id = pr.id)
WHERE LOWER(p.name) LIKE '%ayden%homes%'
  OR LOWER(p.address) LIKE '%ayden%';

-- ============================================================================
-- STEP 6: CHECK DATABASE CONSISTENCY
-- ============================================================================

SELECT 'STEP 6: Checking database consistency...' as step;

-- Show all properties and their manager assignments
SELECT 
  p.id,
  p.name,
  p.city,
  COALESCE(pr.first_name || ' ' || pr.last_name, 'UNASSIGNED') as assigned_to,
  pr.role as manager_role,
  p.updated_at,
  CASE 
    WHEN p.manager_id IS NOT NULL OR p.property_manager_id IS NOT NULL THEN 'ASSIGNED'
    ELSE 'UNASSIGNED'
  END as status
FROM properties p
LEFT JOIN profiles pr ON (p.manager_id = pr.id OR p.property_manager_id = pr.id)
ORDER BY 
  CASE WHEN LOWER(p.name) LIKE '%ayden%homes%' THEN 0 ELSE 1 END,
  p.created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 7: CLEAR APPLICATION CACHE
-- ============================================================================

/*
IMPORTANT: After running this fix, you must:

1. HARD REFRESH THE BROWSER (clears JavaScript cache)
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

2. CLEAR SUPABASE CACHE (if using realtime)
   - The dashboard uses Supabase client-side caching
   - A hard refresh clears this

3. CHECK BROWSER CONSOLE (F12)
   - Look for any error messages
   - Check that manager data is being fetched correctly
   - You should see logs like:
     "📦 Fetched X properties"
     "👥 Found X unique manager IDs"
     "✅ Loaded X manager profiles"

4. VERIFY IN DASHBOARD
   - Open Property Manager component
   - Find "Ayden Homes" property
   - Should now show "Ochieng Felix" instead of "Unassigned"
*/

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 'QUICK FIX COMPLETE ✅' as status;

WITH summary AS (
  SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN manager_id IS NULL AND property_manager_id IS NULL THEN 1 END) as unassigned,
    COUNT(DISTINCT CASE WHEN manager_id IS NOT NULL THEN manager_id ELSE property_manager_id END) as unique_managers
  FROM properties
),
ayden_check AS (
  SELECT 
    CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN '✅ ASSIGNED' ELSE '❌ UNASSIGNED' END as ayden_status
  FROM properties
  WHERE LOWER(name) LIKE '%ayden%homes%'
    OR LOWER(address) LIKE '%ayden%'
  LIMIT 1
)
SELECT 
  s.total_properties,
  s.assigned,
  s.unassigned,
  s.unique_managers,
  ac.ayden_status
FROM summary s
CROSS JOIN ayden_check ac;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
If "Ayden Homes" still shows as UNASSIGNED after this fix:

1. Check the browser console for JavaScript errors
2. Run this query to verify the database has the assignment:
   
   SELECT manager_id, property_manager_id FROM properties 
   WHERE LOWER(name) LIKE '%ayden%homes%' LIMIT 1;
   
   Should return a UUID, not NULL

3. If the database shows it assigned but dashboard shows unassigned:
   - There's likely a frontend caching issue
   - Clear localStorage: 
     In browser console run: localStorage.clear()
   - Hard refresh the page
   
4. Check that Ochieng Felix's role is set to 'property_manager' or 'super_admin':
   
   SELECT role FROM profiles 
   WHERE first_name ILIKE '%ochieng%' 
   AND last_name ILIKE '%felix%' LIMIT 1;

5. If still not working, the issue might be with RLS policies
   See: RLS_POLICY_VERIFICATION.sql
*/
