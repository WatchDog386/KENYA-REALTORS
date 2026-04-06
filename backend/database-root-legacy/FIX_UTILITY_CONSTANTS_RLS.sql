-- Fix RLS policies for utility_constants table
-- Run this in Supabase Dashboard to update existing policies

-- Drop ALL old policies first
DROP POLICY IF EXISTS "Superadmin can manage utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can select utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can insert utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can update utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Superadmin can delete utility constants" ON public.utility_constants;
DROP POLICY IF EXISTS "Everyone can view utility constants" ON public.utility_constants;

-- Create proper split policies with WITH CHECK clause for updates
CREATE POLICY "Superadmin can select utility constants"
    ON public.utility_constants FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can insert utility constants"
    ON public.utility_constants FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can update utility constants"
    ON public.utility_constants FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can delete utility constants"
    ON public.utility_constants FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Everyone can view utility constants"
    ON public.utility_constants FOR SELECT
    USING (TRUE);
