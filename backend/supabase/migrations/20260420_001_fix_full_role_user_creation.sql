-- Fix role fallback to tenant during auth -> profile sync.
-- Ensures all application roles are preserved on signup and synced into profiles.

BEGIN;

-- Keep profiles.role aligned with the full application role set.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.profiles'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END
$$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    role IN (
      'super_admin',
      'property_manager',
      'tenant',
      'caretaker',
      'technician',
      'accountant',
      'supplier',
      'proprietor'
    )
  );

-- Recreate auth trigger function with full role support.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  v_role := lower(
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'user_type'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'account_type'), ''),
      'tenant'
    )
  );

  IF v_role = 'manager' THEN
    v_role := 'property_manager';
  ELSIF v_role = 'admin' THEN
    v_role := 'super_admin';
  END IF;

  IF v_role NOT IN (
    'super_admin',
    'property_manager',
    'tenant',
    'caretaker',
    'technician',
    'accountant',
    'supplier',
    'proprietor'
  ) THEN
    v_role := 'tenant';
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    user_type,
    is_active,
    status,
    approved
  ) VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_phone,
    v_role,
    v_role,
    true,
    'active',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'User created but profile sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Backfill any misclassified profiles from auth metadata.
WITH resolved_roles AS (
  SELECT
    p.id,
    CASE
      WHEN lower(COALESCE(NULLIF(trim(au.raw_user_meta_data->>'role'), ''), NULLIF(trim(au.raw_user_meta_data->>'user_type'), ''), NULLIF(trim(au.raw_user_meta_data->>'account_type'), ''), 'tenant')) = 'manager' THEN 'property_manager'
      WHEN lower(COALESCE(NULLIF(trim(au.raw_user_meta_data->>'role'), ''), NULLIF(trim(au.raw_user_meta_data->>'user_type'), ''), NULLIF(trim(au.raw_user_meta_data->>'account_type'), ''), 'tenant')) = 'admin' THEN 'super_admin'
      ELSE lower(COALESCE(NULLIF(trim(au.raw_user_meta_data->>'role'), ''), NULLIF(trim(au.raw_user_meta_data->>'user_type'), ''), NULLIF(trim(au.raw_user_meta_data->>'account_type'), ''), 'tenant'))
    END AS desired_role
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
),
valid_roles AS (
  SELECT id, desired_role
  FROM resolved_roles
  WHERE desired_role IN (
    'super_admin',
    'property_manager',
    'tenant',
    'caretaker',
    'technician',
    'accountant',
    'supplier',
    'proprietor'
  )
)
UPDATE public.profiles p
SET
  role = v.desired_role,
  user_type = v.desired_role,
  updated_at = NOW()
FROM valid_roles v
WHERE p.id = v.id
  AND (
    p.role IS DISTINCT FROM v.desired_role
    OR p.user_type IS DISTINCT FROM v.desired_role
  );

COMMIT;
