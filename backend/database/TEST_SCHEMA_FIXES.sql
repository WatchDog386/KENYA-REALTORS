-- ============================================================================
-- QUICK REFERENCE: Schema Fixes Applied
-- Run this AFTER the migration to verify everything works
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify Critical Foreign Keys Are Fixed
-- ============================================================================

-- Test support_tickets can reference tenants properly
SELECT COUNT(*) as total_support_tickets
FROM information_schema.table_constraints
WHERE table_name = 'support_tickets' 
AND constraint_name LIKE '%tenant_id_fkey%';
-- Should return: 1

-- Test tenant_documents references are correct
SELECT COUNT(*) as total_constraints
FROM information_schema.table_constraints
WHERE table_name = 'tenant_documents' 
AND constraint_name LIKE '%tenant_id_fkey%';
-- Should return: 1

-- ============================================================================
-- TEST 2: Verify Tables Exist with Correct Columns
-- ============================================================================

-- Check rent_payments has unit_id
SELECT COUNT(*) as has_unit_id
FROM information_schema.columns
WHERE table_name = 'rent_payments' AND column_name = 'unit_id';
-- Should return: 1

-- Check maintenance_requests has all columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'maintenance_requests'
ORDER BY column_name;
-- Should include: completed_at, image_url, manager_notes, property_id, tenant_id, unit_id

-- Check vacation_notices has all columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'vacation_notices'
ORDER BY column_name;
-- Should include: acknowledged_at, acknowledged_by, property_id, tenant_id, unit_id

-- ============================================================================
-- TEST 3: Verify UNIQUE Constraints
-- ============================================================================

-- Check property_manager_assignments enforces 1:1 mapping
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'property_manager_assignments'
AND constraint_name LIKE '%unique%';
-- Should show constraints on both property_manager_id AND property_id

-- Check tenants enforces unique user_id
SELECT COUNT(*) as has_unique_user_id
FROM information_schema.table_constraints
WHERE table_name = 'tenants'
AND constraint_name LIKE '%unique%'
AND constraint_type = 'UNIQUE';
-- Should return: 1 or more

-- ============================================================================
-- TEST 4: Check for Orphaned Records (Data Integrity)
-- ============================================================================

-- Find support tickets with tenant_id that don't have a corresponding auth.users
SELECT st.id, st.tenant_id
FROM support_tickets st
LEFT JOIN auth.users u ON st.tenant_id = u.id
WHERE u.id IS NULL
LIMIT 10;
-- Should return: 0 rows (if returns rows, those records are orphaned)

-- Find rent payments with tenant_id that don't exist in auth.users
SELECT rp.id, rp.tenant_id
FROM rent_payments rp
LEFT JOIN auth.users u ON rp.tenant_id = u.id
WHERE u.id IS NULL
LIMIT 10;
-- Should return: 0 rows

-- Find support_tickets that reference deleted tenants
SELECT st.id, st.subject
FROM support_tickets st
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = st.tenant_id)
LIMIT 10;
-- Should return: 0 rows

-- ============================================================================
-- TEST 5: Verify New Tables Exist
-- ============================================================================

-- Check messages table exists with correct structure
SELECT COUNT(*) as has_messages_table
FROM information_schema.tables
WHERE table_name = 'messages' AND table_schema = 'public';
-- Should return: 1

-- Check approvals table exists
SELECT COUNT(*) as has_approvals_table
FROM information_schema.tables
WHERE table_name = 'approvals' AND table_schema = 'public';
-- Should return: 1

-- Check deposits table exists
SELECT COUNT(*) as has_deposits_table
FROM information_schema.tables
WHERE table_name = 'deposits' AND table_schema = 'public';
-- Should return: 1

-- Check bills_and_utilities table exists
SELECT COUNT(*) as has_bills_table
FROM information_schema.tables
WHERE table_name = 'bills_and_utilities' AND table_schema = 'public';
-- Should return: 1

-- ============================================================================
-- TEST 6: Verify Indices Are Created
-- ============================================================================

-- List all indices on critical tables
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('rent_payments', 'maintenance_requests', 'vacation_notices', 'messages', 'approvals')
ORDER BY tablename, indexname;
-- Should return multiple indices for performance

-- ============================================================================
-- TEST 7: Verify RLS Is Enabled
-- ============================================================================

-- Check RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('messages', 'approvals', 'deposits', 'bills_and_utilities')
ORDER BY tablename;
-- All should show: rowsecurity = true

-- ============================================================================
-- TEST 8: Quick Data Validation
-- ============================================================================

-- Count total records by table type
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'rent_payments', COUNT(*) FROM rent_payments
UNION ALL
SELECT 'maintenance_requests', COUNT(*) FROM maintenance_requests
UNION ALL
SELECT 'vacation_notices', COUNT(*) FROM vacation_notices
UNION ALL
SELECT 'support_tickets', COUNT(*) FROM support_tickets;

-- ============================================================================
-- COMMON ISSUES & SOLUTIONS
-- ============================================================================

-- Issue: "constraint already exists" error
-- Solution: The DROP IF EXISTS in the migration handles this

-- Issue: "relation does not exist" for a table
-- Solution: The migration creates tables with IF NOT EXISTS

-- Issue: "column already exists" error
-- Solution: The migration adds columns with IF NOT EXISTS

-- Issue: "foreign key violation"
-- Solution: Run the orphaned records tests above and delete invalid records:
-- Example for support_tickets:
-- DELETE FROM support_tickets WHERE tenant_id NOT IN (SELECT id FROM auth.users);

-- ============================================================================
-- DATA FIX FOR ORPHANED RECORDS (if needed)
-- ============================================================================

-- Fix orphaned support_tickets (if any exist)
-- DELETE FROM support_tickets 
-- WHERE tenant_id NOT IN (SELECT id FROM auth.users);

-- Fix orphaned rent_payments (if any exist)
-- DELETE FROM rent_payments 
-- WHERE tenant_id NOT IN (SELECT id FROM auth.users);

-- Fix orphaned maintenance_requests (if any exist)
-- DELETE FROM maintenance_requests 
-- WHERE tenant_id NOT IN (SELECT id FROM auth.users);

-- ============================================================================
-- POST-FIX DEPLOYMENT CHECKLIST
-- ============================================================================

-- [ ] Run complete migration (20260215_002_fix_mismatches.sql)
-- [ ] Run TEST 1-8 queries above and verify all pass
-- [ ] Check Supabase dashboard for any schema validation errors
-- [ ] Run queries to find orphaned records and clean them up
-- [ ] Redeploy React application
-- [ ] Test Super Admin Dashboard - verify can see all properties
-- [ ] Test Property Manager Dashboard - verify can see only assigned property
-- [ ] Test Tenant Portal - verify can see only assigned unit
-- [ ] Test creating new support ticket
-- [ ] Test creating new maintenance request
-- [ ] Test submitting vacation notice
-- [ ] Verify payments can be recorded with unit_id
-- [ ] Check that messages are working between users
-- [ ] Verify approvals workflow works

-- ============================================================================
-- If all tests pass, schema is fixed and ready for production!
-- ============================================================================
