-- ============================================================================
-- Migration: Add Mock Properties, Units, and Unit Specifications
-- Date: January 31, 2026
-- Purpose: Populate database with realistic mock data for testing
-- ============================================================================

-- ======================== PART 1: INSERT MOCK PROPERTIES ==================

INSERT INTO public.properties (
    id, 
    name, 
    address, 
    city, 
    state, 
    country, 
    property_type, 
    status, 
    description,
    created_at, 
    updated_at
) VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'Westside Apartments',
        '123 Main Street',
        'Nairobi',
        'Nairobi',
        'Kenya',
        'apartment',
        'active',
        'Modern residential apartment complex with excellent amenities and location',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        'Downtown Plaza',
        '456 Business Avenue',
        'Nairobi',
        'Nairobi',
        'Kenya',
        'commercial',
        'active',
        'Prime commercial space in the heart of CBD',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        'Suburban Villas',
        '789 Residential Park',
        'Kiambu',
        'Kiambu',
        'Kenya',
        'residential',
        'active',
        'Gated residential community with villa homes',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004'::uuid,
        'Tech Hub Office',
        '321 Innovation District',
        'Nairobi',
        'Nairobi',
        'Kenya',
        'commercial',
        'active',
        'Modern office building for tech startups',
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440005'::uuid,
        'Riverside Bedsitters',
        '654 Water Lane',
        'Nakuru',
        'Nakuru',
        'Kenya',
        'apartment',
        'active',
        'Affordable bedsitter units near the river',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- ======================== PART 2: INSERT MOCK UNIT SPECIFICATIONS ==================

INSERT INTO public.unit_specifications (
    id,
    property_id,
    unit_type_name,
    unit_category,
    total_units_of_type,
    occupied_count,
    vacant_count,
    base_size_sqft,
    base_price,
    available_floors,
    features,
    amenities,
    utilities_included,
    is_active,
    description,
    created_at,
    updated_at
) VALUES
    -- Westside Apartments - Unit Types
    (
        '650e8400-e29b-41d4-a716-446655440001'::uuid,
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'Studio',
        'residential',
        5,
        2,
        3,
        350,
        18000.00,
        ARRAY[1, 2, 3, 4, 5],
        ARRAY['Balcony', 'AC Ready', 'Security Door'],
        ARRAY['Kitchen', 'Bathroom', 'Shower'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Compact studio perfect for singles',
        NOW(),
        NOW()
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002'::uuid,
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '1-Bedroom',
        'residential',
        8,
        3,
        5,
        550,
        28000.00,
        ARRAY[1, 2, 3, 4, 5],
        ARRAY['Kitchen', 'Bathroom', 'Built-in Wardrobe', 'Balcony'],
        ARRAY['Water', 'Electricity meter', 'Waste disposal'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Comfortable 1-bedroom with full amenities',
        NOW(),
        NOW()
    ),
    (
        '650e8400-e29b-41d4-a716-446655440003'::uuid,
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '2-Bedroom',
        'residential',
        6,
        2,
        4,
        750,
        42000.00,
        ARRAY[2, 3, 4, 5],
        ARRAY['Kitchen', 'Dining area', 'Master bedroom with balcony', 'Water tank'],
        ARRAY['Water', 'Electricity meter', 'Parking', 'Waste disposal'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Spacious 2-bedroom apartment',
        NOW(),
        NOW()
    ),
    -- Downtown Plaza - Commercial Units
    (
        '650e8400-e29b-41d4-a716-446655440004'::uuid,
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        'Small Office',
        'commercial',
        10,
        5,
        5,
        200,
        35000.00,
        ARRAY[2, 3, 4, 5, 6, 7],
        ARRAY['Glass partition', 'AC', 'Security system'],
        ARRAY['Power backup', 'Elevator access', 'Toilet'],
        '{"water": true, "electricity": true, "wifi": true}'::jsonb,
        true,
        'Compact office space for small teams',
        NOW(),
        NOW()
    ),
    (
        '650e8400-e29b-41d4-a716-446655440005'::uuid,
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        'Large Office',
        'commercial',
        4,
        2,
        2,
        600,
        85000.00,
        ARRAY[3, 4, 5, 6],
        ARRAY['Multiple rooms', 'Meeting area', 'AC', 'Parking'],
        ARRAY['Power backup', 'High-speed internet', 'Kitchen', 'Restrooms'],
        '{"water": true, "electricity": true, "wifi": true}'::jsonb,
        true,
        'Spacious office for large teams',
        NOW(),
        NOW()
    ),
    -- Suburban Villas - Residential
    (
        '650e8400-e29b-41d4-a716-446655440006'::uuid,
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        '3-Bedroom Villa',
        'residential',
        8,
        3,
        5,
        1200,
        95000.00,
        ARRAY[1],
        ARRAY['Garden', 'Garage', 'Security wall', 'Solar ready'],
        ARRAY['Kitchen', '3 bathrooms', 'Laundry area', 'Dining room'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Premium 3-bedroom villa with garden',
        NOW(),
        NOW()
    ),
    (
        '650e8400-e29b-41d4-a716-446655440007'::uuid,
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        '4-Bedroom Villa',
        'residential',
        5,
        2,
        3,
        1600,
        150000.00,
        ARRAY[1],
        ARRAY['Large garden', 'Double garage', 'Pool ready', 'Security system'],
        ARRAY['Modern kitchen', '4 bathrooms', 'Home office', 'Dining & living'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Luxury 4-bedroom villa',
        NOW(),
        NOW()
    ),
    -- Tech Hub - Office Units
    (
        '650e8400-e29b-41d4-a716-446655440008'::uuid,
        '550e8400-e29b-41d4-a716-446655440004'::uuid,
        'Startup Suite',
        'commercial',
        12,
        6,
        6,
        300,
        25000.00,
        ARRAY[1, 2, 3, 4],
        ARRAY['Open plan', 'Flexible walls', 'WiFi included'],
        ARRAY['Shared kitchen', 'Restrooms', 'Breakout area'],
        '{"water": true, "electricity": true, "wifi": true}'::jsonb,
        true,
        'Perfect for startups and freelancers',
        NOW(),
        NOW()
    ),
    -- Riverside Bedsitters
    (
        '650e8400-e29b-41d4-a716-446655440009'::uuid,
        '550e8400-e29b-41d4-a716-446655440005'::uuid,
        'Bedsitter',
        'residential',
        15,
        7,
        8,
        280,
        12000.00,
        ARRAY[1, 2, 3],
        ARRAY['Compact', 'Single window', 'Basic furnish option'],
        ARRAY['Shared bathroom', 'Small kitchen', 'Storage'],
        '{"water": true, "electricity": false, "wifi": false}'::jsonb,
        true,
        'Affordable bedsitter units',
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- ======================== PART 3: INSERT MOCK UNITS ==================

-- Westside Apartments - Studio Units (5 total: 3 vacant, 2 occupied)
INSERT INTO public.units_detailed (
    id,
    property_id,
    unit_specification_id,
    unit_number,
    unit_type,
    floor_number,
    size_sqft,
    price_monthly,
    price_deposit,
    status,
    created_at,
    updated_at
) VALUES
    -- Westside Apartments - Studios
    ('750e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, '101', 'Studio', 1, 350, 18000.00, 36000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, '102', 'Studio', 1, 350, 18000.00, 36000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, '201', 'Studio', 2, 350, 18000.00, 36000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, '301', 'Studio', 3, 350, 18000.00, 36000.00, 'occupied', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, '401', 'Studio', 4, 350, 18000.00, 36000.00, 'occupied', NOW(), NOW()),
    
    -- Westside Apartments - 1-Bedroom (8 total: 5 vacant, 3 occupied)
    ('750e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '103', '1-Bedroom', 1, 550, 28000.00, 56000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '104', '1-Bedroom', 1, 550, 28000.00, 56000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '202', '1-Bedroom', 2, 550, 28000.00, 56000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '203', '1-Bedroom', 2, 550, 28000.00, 56000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '302', '1-Bedroom', 3, 550, 28000.00, 56000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440011'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '402', '1-Bedroom', 4, 550, 28000.00, 56000.00, 'occupied', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440012'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '403', '1-Bedroom', 4, 550, 28000.00, 56000.00, 'occupied', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440013'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, '501', '1-Bedroom', 5, 550, 28000.00, 56000.00, 'occupied', NOW(), NOW()),
    
    -- Westside Apartments - 2-Bedroom (6 total: 4 vacant, 2 occupied)
    ('750e8400-e29b-41d4-a716-446655440014'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '105', '2-Bedroom', 1, 750, 42000.00, 84000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440015'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '204', '2-Bedroom', 2, 750, 42000.00, 84000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440016'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '303', '2-Bedroom', 3, 750, 42000.00, 84000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440017'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '404', '2-Bedroom', 4, 750, 42000.00, 84000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440018'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '405', '2-Bedroom', 4, 750, 42000.00, 84000.00, 'occupied', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440019'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, '502', '2-Bedroom', 5, 750, 42000.00, 84000.00, 'occupied', NOW(), NOW()),

    -- Riverside Bedsitters - Sample Units (showing how to structure them)
    ('750e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid, 'B101', 'Bedsitter', 1, 280, 12000.00, 24000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440021'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid, 'B102', 'Bedsitter', 1, 280, 12000.00, 24000.00, 'vacant', NOW(), NOW()),
    ('750e8400-e29b-41d4-a716-446655440022'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid, 'B103', 'Bedsitter', 1, 280, 12000.00, 24000.00, 'vacant', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ======================== PART 4: CREATE INDEXES FOR PERFORMANCE ==================

CREATE INDEX IF NOT EXISTS idx_units_detailed_property_id ON public.units_detailed(property_id);
CREATE INDEX IF NOT EXISTS idx_units_detailed_unit_number ON public.units_detailed(unit_number);
CREATE INDEX IF NOT EXISTS idx_units_detailed_status ON public.units_detailed(status);
CREATE INDEX IF NOT EXISTS idx_units_detailed_occupant ON public.units_detailed(occupant_id);
CREATE INDEX IF NOT EXISTS idx_unit_specifications_property ON public.unit_specifications(property_id);

-- ======================== PART 5: UPDATE PROPERTY STATUS ==================

-- Update all inserted properties to ensure they're active
UPDATE public.properties 
SET status = 'active'
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440005'::uuid
);
