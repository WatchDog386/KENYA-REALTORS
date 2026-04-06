-- ============================================================================
-- FIX: TECHNICIAN DASHBOARD AND MAINTENANCE REQUEST COLUMNS
-- Date: February 13, 2026
-- Purpose: Ensure all columns and relationships required by TechnicianDashboard exist
-- ============================================================================

BEGIN;

-- 1. Ensure 'technicians' table exists
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.technician_categories(id) ON DELETE RESTRICT,
    -- ... other columns might be missing if created partially
    is_available BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    average_rating DECIMAL(3, 2),
    total_jobs_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure 'technician_categories' exists
CREATE TABLE IF NOT EXISTS public.technician_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add missing columns to 'maintenance_requests'
-- These are required by technicianService.getTechnicianJobs
DO $$
BEGIN
    -- assigned_to_technician_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'maintenance_requests' 
        AND column_name = 'assigned_to_technician_id'
    ) THEN
        ALTER TABLE public.maintenance_requests 
        ADD COLUMN assigned_to_technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL;
    END IF;

    -- category_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'maintenance_requests' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.maintenance_requests 
        ADD COLUMN category_id UUID REFERENCES public.technician_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Fix Foreign Key relationships explicitly for PostgREST embedding

-- maintenance_requests -> technicians (assigned_to_technician_id)
-- This is handled by REFERENCES above, or existing constraint. 
-- Ensure constraint name enables embedding if needed, but standard should work.

-- maintenance_requests -> profiles (tenant_id)
-- We need to ensure 'tenant_id' references 'profiles' so 'tenant:profiles' works.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_maintenance_tenant_profile' AND table_name = 'maintenance_requests'
    ) THEN
        -- Check if tenant_id exists first
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'tenant_id') THEN
             ALTER TABLE public.maintenance_requests 
             ADD CONSTRAINT fk_maintenance_tenant_profile
             FOREIGN KEY (tenant_id) 
             REFERENCES public.profiles(id) 
             ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 5. RLS Policies
-- Allow technicians to view maintenance requests assigned to them
DROP POLICY IF EXISTS "Technicians view assigned requests" ON public.maintenance_requests;
CREATE POLICY "Technicians view assigned requests"
ON public.maintenance_requests FOR SELECT
USING (
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
);

-- Allow technicians to view profiles of tenants for their assigned requests
-- This is tricky because we need to join maintenance_requests.
-- Simpler: Allow authenticated users to view profiles (already done in FIX_PROFILES_RLS_VISIBILITY.sql)

-- 6. Grant Permissions (Just in case)
GRANT SELECT, INSERT, UPDATE ON public.technicians TO authenticated;
GRANT SELECT ON public.technician_categories TO authenticated;
GRANT SELECT, UPDATE ON public.maintenance_requests TO authenticated;

COMMIT;
