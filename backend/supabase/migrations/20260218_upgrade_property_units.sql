-- Migration to support detailed unit management
-- 1. Add structure to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS number_of_floors INTEGER DEFAULT 1;

-- 2. Add detailed columns to units (IF NOT EXISTS to be safe)
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS floor_number INTEGER;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS price NUMERIC; -- Override for specific unit price

-- 3. Ensure property_unit_types has necessary fields
ALTER TABLE public.property_unit_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.property_unit_types ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0;
ALTER TABLE public.property_unit_types ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 0;

-- 4. Create function to bulk generate units (helper)
CREATE OR REPLACE FUNCTION generate_units_for_property(
    p_property_id UUID,
    p_unit_type_id UUID,
    p_start_floor INTEGER,
    p_end_floor INTEGER,
    p_units_per_floor INTEGER,
    p_naming_pattern TEXT -- e.g. "A-{floor}-{n}"
) RETURNS VOID AS $$
DECLARE
    f INTEGER;
    u INTEGER;
    u_num TEXT;
BEGIN
    FOR f IN p_start_floor..p_end_floor LOOP
        FOR u IN 1..p_units_per_floor LOOP
            -- Simple logic to replace placeholders
            u_num := REPLACE(p_naming_pattern, '{floor}', f::TEXT);
            u_num := REPLACE(u_num, '{n}', u::TEXT);
            
            INSERT INTO public.units (property_id, unit_type_id, floor_number, unit_number, status)
            VALUES (p_property_id, p_unit_type_id, f, u_num, 'available')
            ON CONFLICT (property_id, unit_number) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Insert mock data for testing (optional)
-- This section creates sample units for the first property with unit types (if they exist)
-- Adjust property_id and unit_type_id based on your actual IDs

DO $$
DECLARE
    v_property_id UUID;
    v_unit_type_id_1 UUID;
    v_unit_type_id_2 UUID;
    v_unit_type_id_3 UUID;
BEGIN
    -- Get the first property ID (if creating from scratch, this would be Sunrise Heights or similar)
    SELECT id INTO v_property_id FROM public.properties LIMIT 1;
    
    IF v_property_id IS NOT NULL THEN
        -- Get unit type IDs for the property
        SELECT id INTO v_unit_type_id_1 FROM public.property_unit_types 
        WHERE property_id = v_property_id LIMIT 1;
        
        SELECT id INTO v_unit_type_id_2 FROM public.property_unit_types 
        WHERE property_id = v_property_id ORDER BY created_at OFFSET 1 LIMIT 1;
        
        SELECT id INTO v_unit_type_id_3 FROM public.property_unit_types 
        WHERE property_id = v_property_id ORDER BY created_at OFFSET 2 LIMIT 1;
        
        -- FLOOR 1: Bedsitter units
        IF v_unit_type_id_1 IS NOT NULL THEN
            INSERT INTO public.units (property_id, unit_type_id, unit_number, floor_number, status, description, price)
            VALUES 
                (v_property_id, v_unit_type_id_1, 'A-101', 1, 'available', 'Cosy bedsitter with kitchenette', 40000),
                (v_property_id, v_unit_type_id_1, 'A-102', 1, 'occupied', 'Bedsitter, east facing', 40000),
                (v_property_id, v_unit_type_id_1, 'A-103', 1, 'available', 'Bedsitter with balcony', 42000),
                (v_property_id, v_unit_type_id_1, 'A-104', 1, 'maintenance', 'Under renovation', 40000),
                (v_property_id, v_unit_type_id_1, 'A-105', 1, 'available', 'Standard bedsitter', 40000)
            ON CONFLICT (property_id, unit_number) DO NOTHING;
        END IF;
        
        -- FLOOR 2: One Bedroom units
        IF v_unit_type_id_2 IS NOT NULL THEN
            INSERT INTO public.units (property_id, unit_type_id, unit_number, floor_number, status, description, price)
            VALUES 
                (v_property_id, v_unit_type_id_2, 'B-201', 2, 'available', 'Spacious 1BR, new fittings', 65000),
                (v_property_id, v_unit_type_id_2, 'B-202', 2, 'occupied', '1BR with modern kitchen', 65000),
                (v_property_id, v_unit_type_id_2, 'B-203', 2, 'available', '1BR, ground floor access', 65000),
                (v_property_id, v_unit_type_id_2, 'B-204', 2, 'available', '1BR with built-in wardrobes', 68000),
                (v_property_id, v_unit_type_id_2, 'B-205', 2, 'occupied', '1BR duplex', 70000)
            ON CONFLICT (property_id, unit_number) DO NOTHING;
        END IF;
        
        -- FLOOR 3: Two Bedroom units
        IF v_unit_type_id_3 IS NOT NULL THEN
            INSERT INTO public.units (property_id, unit_type_id, unit_number, floor_number, status, description, price)
            VALUES 
                (v_property_id, v_unit_type_id_3, 'C-301', 3, 'available', 'Luxury 2BR, high ceiling', 95000),
                (v_property_id, v_unit_type_id_3, 'C-302', 3, 'occupied', '2BR with terrace', 95000),
                (v_property_id, v_unit_type_id_3, 'C-303', 3, 'available', '2BR, family friendly', 95000),
                (v_property_id, v_unit_type_id_3, 'C-304', 3, 'available', '2BR penthouse view', 110000)
            ON CONFLICT (property_id, unit_number) DO NOTHING;
        END IF;
    END IF;
END $$;
