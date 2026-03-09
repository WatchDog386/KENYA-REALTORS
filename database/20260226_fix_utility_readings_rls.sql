-- Drop existing policies first
DROP POLICY IF EXISTS "Superadmin can manage utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Manager can manage utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Property manager can manage utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Tenants can view their own utility readings" ON public.utility_readings;

-- Policy 1: Super Admin can do everything
CREATE POLICY "Superadmin can manage utility readings"
  ON public.utility_readings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 2: Manager can manage utility readings
CREATE POLICY "Manager can manage utility readings"
  ON public.utility_readings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Policy 3: Property Manager can manage utility readings for their assigned properties
CREATE POLICY "Property manager can manage utility readings"
  ON public.utility_readings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.property_manager_assignments 
      WHERE property_manager_id = auth.uid() AND property_id = public.utility_readings.property_id
    )
  );

-- Policy 4: Tenants can view their own readings
CREATE POLICY "Tenants can view their own utility readings"
  ON public.utility_readings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE user_id = auth.uid() AND unit_id IN (
        SELECT id FROM public.units WHERE id = public.utility_readings.unit_id
      )
    )
  );
