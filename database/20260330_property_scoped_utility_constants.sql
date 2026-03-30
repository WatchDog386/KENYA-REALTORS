-- Allow the same utility_name to exist across different properties.
-- This supports property-scoped billing constants and independent recurring rates.

DO $$
DECLARE
  unique_constraint_name text;
BEGIN
  SELECT tc.constraint_name
    INTO unique_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'utility_constants'
    AND tc.constraint_type = 'UNIQUE'
    AND ccu.column_name = 'utility_name'
  LIMIT 1;

  IF unique_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.utility_constants DROP CONSTRAINT %I',
      unique_constraint_name
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_utility_constants_name_lower
  ON public.utility_constants (LOWER(utility_name));
