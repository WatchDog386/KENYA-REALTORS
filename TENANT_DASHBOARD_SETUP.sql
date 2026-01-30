-- Quick Setup Guide for Tenant Dashboard
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Verify tables exist
SELECT 
    'tenants'::text as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') as exists
UNION ALL
SELECT 'rent_payments', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rent_payments')
UNION ALL
SELECT 'maintenance_requests', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_requests');

-- Step 2: Check if you have an active tenant (run this first)
SELECT id, user_id, status FROM public.tenants WHERE status = 'active' LIMIT 5;

-- Step 3: If you have an active tenant, add mock data
-- Copy the content from: supabase/migrations/20260129_add_mock_data.sql
-- And paste it here

-- Step 4: Verify data was added
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

-- If you DON'T have an active tenant, create one with this:
-- (Replace {YOUR_USER_ID} with an actual user ID from the profiles table)
INSERT INTO public.tenants (
    user_id,
    property_id,
    unit_id,
    status,
    move_in_date,
    created_at
)
VALUES (
    '{YOUR_USER_ID}'::uuid,
    (SELECT id FROM public.properties LIMIT 1),
    (SELECT id FROM public.units LIMIT 1),
    'active',
    NOW() - interval '6 months',
    NOW()
);

-- Then run the mock data script again
