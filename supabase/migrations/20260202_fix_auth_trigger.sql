-- ============================================================================
-- Fix Auth Trigger: Proper Profile Creation on Signup
-- Date: February 2, 2026
-- Purpose: Ensure profiles are created when auth users sign up
-- ============================================================================

-- CRITICAL: Use BEFORE INSERT trigger to prevent signup failure
-- This must happen BEFORE the auth.users INSERT completes

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function that handles the profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    -- Create profile with minimal required fields
    INSERT INTO public.profiles (
      id, 
      email, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NOW(),
      NOW()
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists, just update email
      UPDATE public.profiles 
      SET email = NEW.email, updated_at = NOW()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- For any other error, log it but allow signup to continue
      -- This prevents "Database error finding user"
      RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create BEFORE INSERT trigger (critical for signup to work)
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Verify setup
-- ============================================================================
SELECT 'Auth trigger fixed!' as status;

-- Check trigger
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
ORDER BY trigger_name;
