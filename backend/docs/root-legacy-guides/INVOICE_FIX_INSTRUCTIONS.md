# INVOICE VISIBILITY FIX - STEP BY STEP

## The Problem
Tenants cannot see their initial payment invoices because of RLS (Row Level Security) policy restrictions.

## The Solution
Update the RLS policy on the `invoices` table to allow access via APPLICANT_ID in invoice notes.

## STEP 1: Go to Supabase Dashboard

Open: https://app.supabase.com

Select your project.

## STEP 2: Open SQL Editor

Click: **SQL Editor** (in the left sidebar)

Click: **New Query**

## STEP 3: Copy the SQL Fix

Copy the entire content below:

---

```sql
-- FIX: Allow tenant access to onboarding invoices via APPLICANT_ID in notes
-- This RLS policy change allows tenants to see their first-time payment invoices

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;

-- Create the new permissive policy
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

-- Also backfill invoices.tenant_id from APPLICANT_ID metadata
-- This normalizes data so invoices are properly linked
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
```

---

## STEP 4: Run the SQL

Paste the SQL into the editor and click: **Run** (or press `Ctrl+Enter`)

You should see: ✓ Success or similar confirmation

## STEP 5: Verify the Fix

Refresh the tenant's dashboard. The invoice should now appear in "Outstanding Initial Invoices".

---

## If You See Errors

1. **Policy already exists**: Don't worry, the DROP POLICY handles this
2. **Policy syntax error**: Check that the entire SQL was copied correctly
3. **Permission denied**: Make sure you're using the Supabase dashboard the primary owner account

## Support

If issues persist:
1. Check that the invoice exists: Query `SELECT id, tenant_id, notes FROM invoices WHERE status = 'unpaid'`
2. Verify RLS is enabled: `ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;`
3. Ensure the policy was created: `SELECT * FROM pg_policies WHERE tablename = 'invoices';`
