import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function fixRLS() {
  // Use service role to execute RLS policy changes
  const supabase = createClient(supabaseUrl, serviceKey);
  
  const sqlStatements = [
    // Drop existing policy
    'DROP POLICY IF EXISTS \"Tenants can view their own invoices\" ON public.invoices;',
    
    // Create new policy that allows access via APPLICANT_ID in notes
    \CREATE POLICY \"Tenants can view their own invoices\"
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
);\,
    
    // Backfill tenant_id from APPLICANT_ID for invoices that don't have tenant_id
    \WITH onboarding_candidates AS (
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
  AND c.applicant_id IS NOT NULL;\
  ];

  for (const sql of sqlStatements) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log('Error executing SQL:', error);
      } else {
        console.log('✓ Executed SQL successfully');
      }
    } catch (e: any) {
      console.log('Exception:', e.message);
      // Try alternative approach
    }
  }
}

fixRLS().catch(console.error);
