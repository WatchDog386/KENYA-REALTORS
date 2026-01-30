-- SQL Script to Add Mock Data for Tenant Portal Testing
-- This script adds sample data to allow testing the tenant portal

-- Note: Replace {SUPER_ADMIN_ID}, {MANAGER_ID}, {TENANT_USER_ID}, {PROPERTY_ID} with actual UUIDs from your database

-- Step 1: Check existing data or insert mock property
INSERT INTO public.properties (
    id,
    name,
    address,
    city,
    state,
    zip_code,
    property_type,
    bedrooms,
    bathrooms,
    square_feet,
    property_manager_id,
    status,
    created_at
)
SELECT
    'prop-123e4567-e89b-12d3-a456-426614174000'::uuid,
    'Sunset Villa Apartments',
    '1234 Sunset Blvd',
    'Los Angeles',
    'CA',
    '90028',
    'apartment',
    2,
    1,
    1200,
    (SELECT id FROM public.profiles WHERE role = 'property_manager' LIMIT 1),
    'active',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.properties WHERE name = 'Sunset Villa Apartments'
);

-- Step 2: Add mock unit
INSERT INTO public.units (
    id,
    property_id,
    unit_number,
    floor,
    bedrooms,
    bathrooms,
    monthly_rent,
    type,
    status,
    created_at
)
SELECT
    'unit-123e4567-e89b-12d3-a456-426614174001'::uuid,
    'prop-123e4567-e89b-12d3-a456-426614174000'::uuid,
    '204',
    '2',
    2,
    1,
    1500,
    'standard',
    'occupied',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.units WHERE unit_number = '204'
);

-- Step 3: Add mock lease
INSERT INTO public.leases (
    id,
    property_id,
    unit_id,
    tenant_id,
    start_date,
    end_date,
    monthly_rent,
    security_deposit,
    status,
    terms,
    created_at
)
SELECT
    'lease-123e4567-e89b-12d3-a456-426614174002'::uuid,
    'prop-123e4567-e89b-12d3-a456-426614174000'::uuid,
    'unit-123e4567-e89b-12d3-a456-426614174001'::uuid,
    (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1),
    '2024-01-01'::timestamp with time zone,
    '2025-12-31'::timestamp with time zone,
    1500,
    3000,
    'active',
    'Standard lease terms',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.leases WHERE status = 'active' LIMIT 1
)
AND EXISTS (SELECT 1 FROM public.tenants WHERE status = 'active' LIMIT 1);

-- Step 4: Add mock rent payments
INSERT INTO public.rent_payments (
    id,
    tenant_id,
    lease_id,
    property_id,
    amount,
    payment_date,
    due_date,
    payment_method,
    status,
    created_at
)
SELECT
    gen_random_uuid(),
    t.id,
    (SELECT id FROM public.leases WHERE status = 'active' LIMIT 1),
    t.property_id,
    1500,
    NOW() - interval '30 days',
    NOW() - interval '25 days',
    'bank_transfer',
    'completed',
    NOW() - interval '30 days'
FROM public.tenants t
WHERE t.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM public.rent_payments WHERE tenant_id = t.id
)
LIMIT 5;

-- Step 5: Add more mock payments (pending and overdue)
INSERT INTO public.rent_payments (
    id,
    tenant_id,
    lease_id,
    property_id,
    amount,
    payment_date,
    due_date,
    payment_method,
    status,
    created_at
)
SELECT
    gen_random_uuid(),
    t.id,
    (SELECT id FROM public.leases WHERE status = 'active' LIMIT 1),
    t.property_id,
    1500,
    NOW(),
    NOW() + interval '5 days',
    'credit_card',
    'pending',
    NOW()
FROM public.tenants t
WHERE t.status = 'active'
LIMIT 1;

-- Step 6: Add mock maintenance requests
INSERT INTO public.maintenance_requests (
    id,
    title,
    description,
    property_id,
    user_id,
    status,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'Kitchen Sink Leak',
    'The kitchen sink has a slow leak underneath. Water drips when the faucet is turned on.',
    t.property_id,
    t.user_id,
    'in_progress',
    'medium',
    NOW() - interval '2 days',
    NOW() - interval '1 day'
FROM public.tenants t
WHERE t.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests WHERE title = 'Kitchen Sink Leak'
)
LIMIT 1;

-- Step 7: Add another maintenance request
INSERT INTO public.maintenance_requests (
    id,
    title,
    description,
    property_id,
    user_id,
    status,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'AC Unit Needs Service',
    'Air conditioning unit is not cooling properly. Temperature settings not working.',
    t.property_id,
    t.user_id,
    'pending',
    'high',
    NOW() - interval '5 days',
    NOW() - interval '5 days'
FROM public.tenants t
WHERE t.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests WHERE title = 'AC Unit Needs Service'
)
LIMIT 1;

-- Step 8: Add completed maintenance request
INSERT INTO public.maintenance_requests (
    id,
    title,
    description,
    property_id,
    user_id,
    status,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    'Door Lock Repair',
    'Front door lock was repaired and all keys were tested.',
    t.property_id,
    t.user_id,
    'completed',
    'low',
    NOW() - interval '15 days',
    NOW() - interval '10 days'
FROM public.tenants t
WHERE t.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests WHERE title = 'Door Lock Repair'
)
LIMIT 1;

-- Verify data was inserted
SELECT 'Properties' as table_name, COUNT(*) as count FROM public.properties
UNION ALL
SELECT 'Units', COUNT(*) FROM public.units
UNION ALL
SELECT 'Leases', COUNT(*) FROM public.leases
UNION ALL
SELECT 'Tenants', COUNT(*) FROM public.tenants
UNION ALL
SELECT 'Rent Payments', COUNT(*) FROM public.rent_payments
UNION ALL
SELECT 'Maintenance Requests', COUNT(*) FROM public.maintenance_requests;
