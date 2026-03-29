import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function debugInvoiceVisibility() {
  console.log('\n' + '='.repeat(70));
  console.log('DEBUG: INVOICE VISIBILITY ISSUE');
  console.log('='.repeat(70) + '\n');

  const tid = '8412a687-23c1-4ca3-bb9d-1cf560f45772';

  // Test 1: Service role (should work)
  console.log('TEST 1: Query with SERVICE ROLE key');
  console.log('-'.repeat(70));
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('invoices')
    .select('id, tenant_id, status, property_id, notes')
    .eq('tenant_id', tid);

  console.log('Result:', serviceData?.length || 0, 'invoices found');
  if (serviceData?.length > 0) {
    console.log('✓ Service role CAN see invoice');
    console.log('  Invoice ID:', serviceData[0].id);
    console.log('  Status:', serviceData[0].status);
    console.log('  Notes preview:', serviceData[0].notes?.substring(0, 80));
  }

  // Test 2: Anon role (currently fails)
  console.log('\nTEST 2: Query with ANON key (what frontend uses)');
  console.log('-'.repeat(70));
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: anonData, error: anonError } = await anonClient
    .from('invoices')
    .select('id, tenant_id, status, property_id, notes')
    .eq('tenant_id', tid);

  console.log('Result:', anonData?.length || 0, 'invoices found');
  console.log('Error:', anonError?.message || 'None');
  if (anonError) {
    console.log('✗ ANON key CANNOT see invoice (RLS is blocking)');
    console.log('  Error code:', anonError.code);
    console.log('  Error message:', anonError.message);
  }

  // Test 3: Check if RLS is enabled
  console.log('\nTEST 3: RLS Status on invoices table');
  console.log('-'.repeat(70));
  const { data: rlsInfo } = await serviceClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'invoices');

  console.log('Invoices table exists:', rlsInfo?.length > 0 ? 'Yes' : 'No');

  // Test 4: Get current RLS policies
  console.log('\nTEST 4: Current RLS Policies');
  console.log('-'.repeat(70));
  const { data: policiesRaw } = await serviceClient.rpc('get_policies', {
    schema: 'public',
    table: 'invoices'
  }).catch(() => ({ data: null }));

  if (policiesRaw) {
    console.log('Policies found:', policiesRaw.length);
  } else {
    console.log('Cannot query policies directly');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY & FIX');
  console.log('='.repeat(70) + '\n');

  if (serviceData?.length > 0 && (!anonData || anonData.length === 0)) {
    console.log('⚠️  ROOT CAUSE: RLS Policy Blocking Anon Access\n');
    console.log('✓ Invoice EXISTS in database');
    console.log('✓ Service role CAN access it');
    console.log('✗ Anon role CANNOT access it (RLS blocks)\n');
    
    console.log('FIX: Update RLS Policy on the invoices table\n');
    console.log('Action required:');
    console.log('1. Go to: https://rcxmrtqgppayncelonls.supabase.co');
    console.log('2. Open: SQL Editor → New Query');
    console.log('3. Run this SQL:\n');
    console.log('--- CUT HERE ---');
    console.log(`
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;

CREATE POLICY "Tenants can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR auth.uid() = (
    SELECT t.user_id
    FROM public.tenants t
    WHERE t.id = invoices.tenant_id
    LIMIT 1
  )
  OR (
    coalesce(invoices.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
    AND (regexp_match(coalesce(invoices.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid = auth.uid()
  )
);

WITH onboarding_candidates AS (
  SELECT
    i.id,
    (regexp_match(coalesce(i.notes, ''), '(?i)APPLICANT_ID:([0-9a-fA-F-]{36})'))[1]::uuid AS applicant_id
  FROM public.invoices i
  WHERE coalesce(i.notes, '') ~* 'BILLING_EVENT:(first_payment|unit_allocation)'
    AND i.tenant_id IS NULL
)
UPDATE public.invoices i
SET tenant_id = c.applicant_id,
    updated_at = now()
FROM onboarding_candidates c
WHERE i.id = c.id
  AND c.applicant_id IS NOT NULL;
`);
    console.log('--- END ---\n');
    console.log('4. Click "Run"');
    console.log('5. Refresh the tenant portal\n');
  } else if (!serviceData || serviceData.length === 0) {
    console.log('⚠️  DIFFERENT ISSUE: Invoice not in database\n');
    console.log('The invoice might not be created for this tenant.');
    console.log('Check: Has the property manager assigned this unit to the tenant?');
  }
}

debugInvoiceVisibility().catch(console.error);
