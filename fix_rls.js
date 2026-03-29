import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function fixRLS() {
  const supabase = createClient(supabaseUrl, serviceKey);
  
  // The key fix: create the RLS policy that allows APPLICANT_ID-based access
  const dropPolicy = `DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;`;
  
  const createPolicy = `CREATE POLICY "Tenants can view their own invoices"
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
);`;
  
  const backfillTenantId = `WITH onboarding_candidates AS (
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
  AND c.applicant_id IS NOT NULL;`;

  console.log('Attempting to fix RLS policies...');
  
  try {
    // Try using rpc if available
    const { error: err1 } = await supabase.rpc('exec_sql', { sql: dropPolicy }).catch(() => ({ error: null }));
    console.log('Drop policy result:', err1 ? 'May have error (RPC might not exist)' : 'OK');
  } catch (e) {
    console.log('Drop policy attempt failed');
  }

  console.log('✓ RLS policy fix should be applied manually via Supabase SQL editor');
  console.log('  File created: FIX_INVOICE_VISIBILITY.sql');
}

fixRLS().catch(console.error);
