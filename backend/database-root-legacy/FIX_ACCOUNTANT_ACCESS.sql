BEGIN;

-- 1. Grant Select on Tenants to Accountants
DROP POLICY IF EXISTS "accountants_select_all_tenants" ON public.tenants;
CREATE POLICY "accountants_select_all_tenants" ON public.tenants FOR SELECT
USING ( 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'accountant') 
);

-- 2. Grant Select on Properties to Accountants
DROP POLICY IF EXISTS "accountants_select_all_properties" ON public.properties;
CREATE POLICY "accountants_select_all_properties" ON public.properties FOR SELECT
USING ( 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'accountant') 
);

-- 3. Grant Select on Units to Accountants
DROP POLICY IF EXISTS "accountants_select_all_units" ON public.units;
CREATE POLICY "accountants_select_all_units" ON public.units FOR SELECT
USING ( 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'accountant') 
);

COMMIT;
