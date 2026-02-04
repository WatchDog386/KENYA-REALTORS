-- ============================================================================
-- AUTOMATIC USER ACTIVATION TRIGGER
-- Automatically activates users when they are assigned a role by super admin
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_activate_user_on_role_assignment ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS auto_activate_user_on_role_assignment() CASCADE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION auto_activate_user_on_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being assigned (was NULL before, now has a value)
  -- OR if status is being explicitly updated to active
  -- Then ensure the user is activated
  
  IF (OLD.role IS NULL AND NEW.role IS NOT NULL) THEN
    -- Role is being assigned for the first time
    NEW.status := 'active';
    NEW.is_active := true;
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
    
    RAISE NOTICE 'Auto-activating user % with role %', NEW.id, NEW.role;
  
  ELSIF (NEW.role IS NOT NULL AND NEW.status = 'pending') THEN
    -- User already has a role but status is still pending - activate them
    NEW.status := 'active';
    NEW.is_active := true;
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
    
    RAISE NOTICE 'Converting pending user % to active with role %', NEW.id, NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER auto_activate_user_on_role_assignment
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_user_on_role_assignment();

-- Test: Verify the trigger exists
SELECT 
  t.trg_name,
  t.event_manipulation,
  t.event_object_table,
  p.proname as function_name
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = 'auto_activate_user_on_role_assignment'
WHERE t.event_object_table = 'profiles';

-- Verify all pending users are activated if they have a role
UPDATE public.profiles
SET status = 'active', is_active = true
WHERE role IS NOT NULL AND status = 'pending'
RETURNING id, email, role, status, is_active;
