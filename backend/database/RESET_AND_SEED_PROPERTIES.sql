-- RESET AND SEED PROPERTIES
-- Adapted to match the schema used by propertyService.ts

BEGIN;

-- 1. DELETE EXISTING DATA
-- First, clear references in profiles table to avoid foreign key violation
UPDATE public.profiles SET assigned_property_id = NULL;

-- Delete dependent tables first (ignore errors if tables don't exist is harder in pure SQL block, 
-- but provided the tables exist this works)
DELETE FROM public.leases;
DELETE FROM public.tenants;
DELETE FROM public.units;
DELETE FROM public.property_unit_types;
DELETE FROM public.property_manager_assignments;
DELETE FROM public.properties;

-- 2. INSERT MOCK PROPERTIES
-- Note: 'total_monthly_rental_expected' is removed as it's computed on frontend
-- Note: 'status' is not in propertyService but might be in DB. If this fails, remove 'status'.
-- We'll try to keep 'status' as it's common, but if it fails we'll need to remove it.
-- Based on the error, 'total_monthly_rental_expected' was the issue.

-- Property 1: Sunrise Heights
INSERT INTO public.properties (id, name, location, type, description, amenities, image_url)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Sunrise Heights',
    'Westlands, Nairobi',
    'Apartment',
    'Modern apartment complex with stunning city views, gym, and swimming pool.',
    'Gym, Swimming Pool, High-speed Lifts, Backup Generator, 24/7 Security, CCTV',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000'
);

-- Property 2: CBD Business Plaza
INSERT INTO public.properties (id, name, location, type, description, amenities, image_url)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'CBD Business Plaza',
    'Moi Avenue, CBD',
    'Commercial',
    'Prime office space in the heart of the city. Ideal for startups and corporate headquarters.',
    'Fiber Internet, Conference Rooms, Secure Parking, Coffee Shop, Reception',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000'
);

-- Property 3: Karen Green Villas
INSERT INTO public.properties (id, name, location, type, description, amenities, image_url)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Karen Green Villas',
    'Karen, Nairobi',
    'Villa',
    'Exclusive gated community with spacious 5-bedroom villas. Serene environment.',
    'Private Garden, Clubhouse, jogging tracks, electric fence, DSQ',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1000'
);


-- 3. INSERT UNIT TYPES
-- Schema matched to propertyService.ts: name, units_count, price_per_unit

-- For Sunrise Heights
INSERT INTO public.property_unit_types (id, property_id, name, units_count, price_per_unit)
VALUES 
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'One Bedroom Deluxe', 20, 45000.00),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Two Bedroom Executive', 10, 75000.00);

-- For CBD Plaza
INSERT INTO public.property_unit_types (id, property_id, name, units_count, price_per_unit)
VALUES 
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Standard Office Suite', 15, 60000.00),
    ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Ground Floor Shop', 5, 120000.00);

-- For Karen Villas
INSERT INTO public.property_unit_types (id, property_id, name, units_count, price_per_unit)
VALUES 
    ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '5 Bedroom Villa', 8, 250000.00);


-- 4. INSERT INDIVIDUAL UNITS
-- Schema: property_id, unit_number, status (unit_type_id not available in the actual schema)

-- Sunrise Heights - One Bedrooms (A1-A20)
INSERT INTO public.units (property_id, unit_number, status)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A1', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A2', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A3', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A4', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A5', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A6', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A7', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A8', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A9', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A10', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A11', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A12', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A13', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A14', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A15', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A16', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A17', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A18', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A19', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'A20', 'available');

-- Sunrise Heights - Two Bedrooms (B1-B10)
INSERT INTO public.units (property_id, unit_number, status)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B1', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B2', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B3', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B4', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B5', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B6', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B7', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B8', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B9', 'available'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B10', 'available');

-- CBD Business Plaza - Office Suites (S1-S15)
INSERT INTO public.units (property_id, unit_number, status)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S1', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S2', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S3', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S4', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S5', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S6', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S7', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S8', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S9', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S10', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S11', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S12', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S13', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S14', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'S15', 'available');

-- CBD Business Plaza - Ground Floor Shops (G1-G5)
INSERT INTO public.units (property_id, unit_number, status)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'G1', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'G2', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'G3', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'G4', 'available'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'G5', 'available');

-- Karen Green Villas - Villas (V1-V8)
INSERT INTO public.units (property_id, unit_number, status)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V1', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V2', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V3', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V4', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V5', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V6', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V7', 'available'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'V8', 'available');

COMMIT;
