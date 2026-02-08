-- ============================================================================
-- FIX & VERIFY SUPER ADMIN STATUS
-- Replace 'duncanmarshel@gmail.com' with your actual admin email if different
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Verify who we are checking
SELECT 'Checking status for duncanmarshel@gmail.com' as step;

-- 2. Ensure profile exists and is super_admin
INSERT INTO public.profiles (id, email, role, status, is_active)
SELECT 
  id, 
  email, 
  'super_admin', 
  'active', 
  true
FROM auth.users 
WHERE email = 'duncanmarshel@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  status = 'active',
  is_active = true;

-- 3. Verify the Fix
SELECT 
  p.email,
  p.role,
  p.id as profile_id,
  public.is_super_admin(p.id) as is_super_admin_check
FROM public.profiles p
WHERE p.email = 'duncanmarshel@gmail.com';

-- 4. Check if we can insert a dummy profile (Simulation)
-- This query simulates what the RLS check does
SELECT 
  CASE 
    WHEN public.is_super_admin((SELECT id FROM auth.users WHERE email = 'duncanmarshel@gmail.com')) 
    THEN '✅ RLS Check Passed: You can create profiles'
    ELSE '❌ RLS Check Failed: You cannot create profiles'
  END as rls_simulation;
