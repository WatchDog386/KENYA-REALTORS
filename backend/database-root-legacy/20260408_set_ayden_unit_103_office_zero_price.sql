-- ============================================================================
-- SCRIPT: Set Ayden Home(s) Towers Unit 103 as Office with Zero Price
-- Date: April 8, 2026
-- Purpose: Ensure unit 103 is classified as Office and priced at KES 0
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_property_id UUID;
    v_office_type_id UUID;
BEGIN
    -- Match either naming variant used in the database.
    SELECT id
    INTO v_property_id
    FROM public.properties
    WHERE LOWER(TRIM(name)) IN ('ayden home towers', 'ayden homes towers')
    ORDER BY CASE
        WHEN LOWER(TRIM(name)) = 'ayden home towers' THEN 0
        WHEN LOWER(TRIM(name)) = 'ayden homes towers' THEN 1
        ELSE 2
    END
    LIMIT 1;

    IF v_property_id IS NULL THEN
        RAISE EXCEPTION 'Property Ayden Home(s) Towers not found.';
    END IF;

    -- Create or reuse an Office unit type for this property and keep it at zero price.
    INSERT INTO public.property_unit_types (
        property_id,
        unit_type_name,
        unit_category,
        total_units_of_type,
        price_per_unit,
        occupied_count,
        vacant_count,
        maintenance_count
    )
    VALUES (
        v_property_id,
        'Office',
        'commercial',
        0,
        0,
        0,
        0,
        0
    )
    ON CONFLICT (property_id, unit_type_name)
    DO UPDATE SET
        price_per_unit = 0,
        updated_at = NOW()
    RETURNING id INTO v_office_type_id;

    UPDATE public.units
    SET unit_type_id = v_office_type_id,
        price = 0,
        updated_at = NOW()
    WHERE property_id = v_property_id
      AND unit_number = '103';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unit 103 not found for Ayden Home(s) Towers.';
    END IF;
END $$;

-- Verification
SELECT
    p.name AS property_name,
    u.unit_number,
    put.unit_type_name,
    put.unit_category,
    u.price AS unit_price,
    put.price_per_unit AS unit_type_price
FROM public.units u
JOIN public.properties p ON p.id = u.property_id
LEFT JOIN public.property_unit_types put ON put.id = u.unit_type_id
WHERE LOWER(TRIM(p.name)) IN ('ayden home towers', 'ayden homes towers')
  AND u.unit_number = '103';

COMMIT;
