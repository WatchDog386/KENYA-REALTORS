-- VERIFY REGISTRATION FIX
-- Run this script to check if the registration fix has been applied correctly

DO $$
DECLARE
  func_src TEXT;
  trigger_exists BOOLEAN;
  rls_policy_exists BOOLEAN;
BEGIN
  -- 1. Check for the EXCEPTION block in handle_new_user
  SELECT prosrc INTO func_src FROM pg_proc WHERE proname = 'handle_new_user';
  
  IF func_src IS NULL THEN
    RAISE NOTICE '❌ ERROR: Function handle_new_user does not exist!';
  ELSIF func_src LIKE '%EXCEPTION WHEN OTHERS%' THEN
    RAISE NOTICE '✅ FUNCTION CHECK: handle_new_user includes robust error handling.';
  ELSE
    RAISE NOTICE '❌ FUNCTION CHECK: handle_new_user is missing the EXCEPTION block. Run 20260203_final_fix_registration.sql';
  END IF;

  -- 2. Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND trigger_schema = 'auth'
    AND trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ TRIGGER CHECK: on_auth_user_created exists.';
  ELSE
    RAISE NOTICE '❌ TRIGGER CHECK: on_auth_user_created is missing!';
  END IF;

  -- 3. Check for the non-recursive RLS policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Super admin view all' 
    AND tablename = 'profiles'
  ) INTO rls_policy_exists;

  IF rls_policy_exists THEN
    RAISE NOTICE '✅ RLS CHECK: New non-recursive policies detected.';
  ELSE
    RAISE NOTICE '❌ RLS CHECK: New policies not found. Run 20260203_final_fix_registration.sql';
  END IF;

END $$;
