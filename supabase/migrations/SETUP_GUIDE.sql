-- ============================================
-- QUICK SETUP GUIDE - Apply These Migrations in Order
-- ============================================

-- STEP 1: Run 20250115_simplified_schema.sql
-- This creates all the core tables with proper indexes and RLS policies

-- STEP 2: Run 20250115_helper_functions.sql  
-- This adds utility functions, triggers, and views

-- STEP 3: Verify the setup by running these queries:

-- Check if profiles table exists and has correct columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if properties table exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true 
ORDER BY tablename;

-- Check if functions were created
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname LIKE 'get_%' 
ORDER BY proname;

-- ============================================
-- OPTIONAL: Enable all RLS by default
-- ============================================
ALTER DATABASE postgres SET "app.jwt_secret" = 'your-secret-key';

-- ============================================
-- OPTIONAL: Test the setup
-- ============================================

-- 1. Create a test user in auth.users (do this via Supabase UI)
-- 2. Create corresponding profile
INSERT INTO profiles (id, email, first_name, last_name, role, status)
VALUES (
    'YOUR_USER_UUID_HERE', -- Get this from Supabase Auth
    'test@example.com',
    'Test',
    'User',
    'tenant',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 3. Create a test property
INSERT INTO properties (name, address, city, state, zip_code, type, status, total_units, super_admin_id)
VALUES (
    'Demo Property',
    '100 Test Avenue',
    'Nairobi',
    'Nairobi County',
    '00100',
    'apartment',
    'active',
    10,
    'YOUR_SUPER_ADMIN_UUID_HERE'
) RETURNING id, name;

-- 4. Create a test lease (replace IDs with actual values)
INSERT INTO leases (property_id, tenant_id, start_date, end_date, monthly_rent, security_deposit, status)
VALUES (
    'PROPERTY_UUID_HERE',
    'TENANT_UUID_HERE',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    50000,
    100000,
    'active'
) RETURNING id, status;

-- 5. Create a test payment
INSERT INTO payments (lease_id, amount, due_date, status)
VALUES (
    'LEASE_UUID_HERE',
    50000,
    CURRENT_DATE + INTERVAL '7 days',
    'pending'
) RETURNING id, due_date, status;

-- ============================================
-- OPTIONAL: View your data
-- ============================================

-- See all active leases
SELECT * FROM active_leases;

-- See overdue payments
SELECT * FROM overdue_payments;

-- See property occupancy
SELECT * FROM property_occupancy_summary;

-- ============================================
-- MIGRATION STATUS
-- ============================================
-- ✓ Core schema created
-- ✓ RLS policies enabled
-- ✓ Helper functions created
-- ✓ Triggers configured
-- ✓ Views created
-- Ready for application use!
