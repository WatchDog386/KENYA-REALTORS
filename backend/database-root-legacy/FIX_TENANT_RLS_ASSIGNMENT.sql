-- FIX TENANT ASSIGNMENT RLS ISSUE
-- This script fixes the "409 Conflict" error when assigning a tenant who already has a record (possibly at another property).
-- It allows managers to VIEW all tenant records (to avoid creation conflicts) and UPDATE them (to move them to their property).

BEGIN;

-- 1. ENABLE RLS (Ensure it's on)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. DROP RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "Manager Manage Tenants" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenants_service_role" ON public.tenants;
DROP POLICY IF EXISTS "tenants_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "Unified View Policy" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Managers can update tenants to their properties" ON public.tenants;
DROP POLICY IF EXISTS "Managers can insert tenants for their properties" ON public.tenants;

-- DROP NEW POLICIES (If re-running script)
DROP POLICY IF EXISTS "tenants_service_role_full" ON public.tenants;
DROP POLICY IF EXISTS "tenants_super_admin_full" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_delete" ON public.tenants;


-- 3. CREATE NEW POLICIES

-- A. SERVICE ROLE (Full Access)
CREATE POLICY "tenants_service_role_full"
ON public.tenants FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- B. SUPER ADMIN (Full Access)
CREATE POLICY "tenants_super_admin_full"
ON public.tenants FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- C. MANAGER VIEW (Select)
-- Allow managers to see ALL tenant records. This allows checking if a tenant exists before insertion.
CREATE POLICY "tenants_manager_select"
ON public.tenants FOR SELECT
USING (
    -- If user is a manager of ANY active property
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    -- Or user is the tenant themselves
    (auth.uid() = user_id)
);

-- D. MANAGER INSERT (Create)
-- Managers can create new tenant records for their properties
CREATE POLICY "tenants_manager_insert"
ON public.tenants FOR INSERT
WITH CHECK (
    -- The tenant must be assigned to a property the manager manages
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = property_id
        AND property_manager_id = auth.uid()
        AND status = 'active'
    )
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- E. MANAGER UPDATE (Move/Edit)
-- Managers can update ANY tenant record, BUT only if they are assigning it to one of THEIR properties.
CREATE POLICY "tenants_manager_update"
ON public.tenants FOR UPDATE
USING (
    -- Must be a manager
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
)
WITH CHECK (
    -- PROPOSED CHANGE must point to a property the manager owns
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = property_id -- usage of the NEW property_id
        AND property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- F. MANAGER DELETE
CREATE POLICY "tenants_manager_delete"
ON public.tenants FOR DELETE
USING (
    -- Can only delete if currently assigned to your property
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = public.tenants.property_id
        AND property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

COMMIT;
