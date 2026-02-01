-- ============================================================================
-- Cleanup: Reset Failed Registration Attempts
-- Date: February 1, 2026
-- Purpose: Clean up partial/failed registrations to start fresh
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY PROBLEMATIC USERS
-- ============================================================================
-- Run this to see which users have issues:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
-- SELECT id, email, role FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- ============================================================================
-- STEP 2: CLEAN UP FAILED ATTEMPTS
-- ============================================================================
-- Delete profiles without corresponding auth users (orphaned)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Delete manager approvals for non-existent managers
DELETE FROM public.manager_approvals 
WHERE manager_id NOT IN (SELECT id FROM auth.users);

-- Delete tenant verifications for non-existent tenants
DELETE FROM public.tenant_verifications 
WHERE tenant_id NOT IN (SELECT id FROM auth.users);

-- Delete notifications for non-existent users
DELETE FROM public.notifications 
WHERE recipient_id NOT IN (SELECT id FROM auth.users)
   OR sender_id NOT IN (SELECT id FROM auth.users);

-- ============================================================================
-- STEP 3: FIX THE AUTO-TRIGGER
-- ============================================================================
-- The trigger should create profile on auth user creation
-- Let's verify it exists and works

-- Drop and recreate the trigger to ensure it's correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get email from the new auth user
  v_email := NEW.email;
  
  -- Insert into profiles with basic info
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    v_email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = v_email, updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the trigger
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: VERIFY SETUP
-- ============================================================================
SELECT 'Cleanup and trigger fix complete!' as message;

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Check policies exist
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';
