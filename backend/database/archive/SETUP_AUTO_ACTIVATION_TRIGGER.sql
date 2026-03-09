-- ============================================================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR TO ENABLE AUTO-ACTIVATION TRIGGER
-- ============================================================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.auto_activate_user_on_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being assigned (was NULL before, now has a value)
  IF (OLD.role IS NULL AND NEW.role IS NOT NULL) THEN
    NEW.status := 'active';
    NEW.is_active := true;
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
  
  -- OR if user has a role but status is still pending - activate them
  ELSIF (NEW.role IS NOT NULL AND NEW.status = 'pending') THEN
    NEW.status := 'active';
    NEW.is_active := true;
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS auto_activate_user_on_role_assignment ON public.profiles CASCADE;

CREATE TRIGGER auto_activate_user_on_role_assignment
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_user_on_role_assignment();

-- Step 3: Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'auto_activate_user_on_role_assignment';

-- Step 4: Activate any pending users who already have a role assigned
UPDATE public.profiles
SET 
  status = 'active',
  is_active = true,
  updated_at = NOW()
WHERE role IS NOT NULL AND status = 'pending';

-- Step 5: Verify the update
SELECT 
  email,
  role,
  status,
  is_active,
  updated_at
FROM public.profiles
WHERE role IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
