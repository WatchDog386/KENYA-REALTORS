-- Enforce strict property-scoped utility billing isolation.
-- Result:
-- 1) Same utility name can exist across different properties.
-- 2) Utility constants cannot be shared between properties.
-- 3) Utility names are unique within each property workspace.

BEGIN;

ALTER TABLE public.utility_constants
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.utility_constants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.property_utilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  utility_constant_id UUID NOT NULL REFERENCES public.utility_constants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, utility_constant_id)
);

ALTER TABLE public.property_utilities
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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

-- If one utility constant is attached to multiple properties, clone it so each
-- property owns an independent row/value set.
DO $$
DECLARE
  rec RECORD;
  src RECORD;
  cloned_id UUID;
BEGIN
  FOR rec IN
    SELECT
      pu.id,
      pu.property_id,
      pu.utility_constant_id,
      ROW_NUMBER() OVER (
        PARTITION BY pu.utility_constant_id
        ORDER BY pu.created_at NULLS FIRST, pu.id
      ) AS rn
    FROM public.property_utilities pu
  LOOP
    IF rec.rn <= 1 THEN
      CONTINUE;
    END IF;

    SELECT
      uc.utility_name,
      uc.constant,
      uc.price,
      uc.is_metered,
      uc.description
    INTO src
    FROM public.utility_constants uc
    WHERE uc.id = rec.utility_constant_id;

    IF src.utility_name IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.utility_constants (
      utility_name,
      constant,
      price,
      is_metered,
      description
    ) VALUES (
      src.utility_name,
      src.constant,
      src.price,
      src.is_metered,
      src.description
    )
    RETURNING id INTO cloned_id;

    UPDATE public.property_utilities
    SET utility_constant_id = cloned_id,
        updated_at = NOW()
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Remove duplicate name assignments inside the same property (keep first one).
WITH ranked_assignments AS (
  SELECT
    pu.id,
    ROW_NUMBER() OVER (
      PARTITION BY pu.property_id, LOWER(TRIM(uc.utility_name))
      ORDER BY pu.created_at NULLS FIRST, pu.id
    ) AS rn
  FROM public.property_utilities pu
  JOIN public.utility_constants uc
    ON uc.id = pu.utility_constant_id
)
DELETE FROM public.property_utilities pu
USING ranked_assignments ra
WHERE pu.id = ra.id
  AND ra.rn > 1;

-- A utility constant now belongs to exactly one property assignment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_utilities_unique_constant_per_property
  ON public.property_utilities (utility_constant_id);

CREATE OR REPLACE FUNCTION public.assert_property_utility_name_unique(
  p_property_id UUID,
  p_utility_name TEXT,
  p_utility_constant_id UUID,
  p_ignore_assignment_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  conflict_name TEXT;
BEGIN
  IF p_property_id IS NULL OR COALESCE(TRIM(p_utility_name), '') = '' THEN
    RETURN;
  END IF;

  SELECT uc.utility_name
    INTO conflict_name
  FROM public.property_utilities pu
  JOIN public.utility_constants uc
    ON uc.id = pu.utility_constant_id
  WHERE pu.property_id = p_property_id
    AND LOWER(TRIM(uc.utility_name)) = LOWER(TRIM(p_utility_name))
    AND pu.utility_constant_id <> p_utility_constant_id
    AND (p_ignore_assignment_id IS NULL OR pu.id <> p_ignore_assignment_id)
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Utility "%" already exists for this property.', p_utility_name
      USING ERRCODE = '23505';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trg_property_utilities_enforce_name_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  incoming_name TEXT;
BEGIN
  SELECT utility_name
    INTO incoming_name
  FROM public.utility_constants
  WHERE id = NEW.utility_constant_id;

  PERFORM public.assert_property_utility_name_unique(
    NEW.property_id,
    incoming_name,
    NEW.utility_constant_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_utilities_enforce_name_uniqueness ON public.property_utilities;
CREATE TRIGGER property_utilities_enforce_name_uniqueness
BEFORE INSERT OR UPDATE OF property_id, utility_constant_id
ON public.property_utilities
FOR EACH ROW
EXECUTE FUNCTION public.trg_property_utilities_enforce_name_uniqueness();

CREATE OR REPLACE FUNCTION public.trg_utility_constants_enforce_property_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  assignment_row RECORD;
BEGIN
  IF LOWER(TRIM(COALESCE(NEW.utility_name, ''))) = LOWER(TRIM(COALESCE(OLD.utility_name, ''))) THEN
    RETURN NEW;
  END IF;

  FOR assignment_row IN
    SELECT id, property_id
    FROM public.property_utilities
    WHERE utility_constant_id = NEW.id
  LOOP
    PERFORM public.assert_property_utility_name_unique(
      assignment_row.property_id,
      NEW.utility_name,
      NEW.id,
      assignment_row.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS utility_constants_enforce_property_uniqueness ON public.utility_constants;
CREATE TRIGGER utility_constants_enforce_property_uniqueness
BEFORE UPDATE OF utility_name
ON public.utility_constants
FOR EACH ROW
EXECUTE FUNCTION public.trg_utility_constants_enforce_property_uniqueness();

COMMIT;
