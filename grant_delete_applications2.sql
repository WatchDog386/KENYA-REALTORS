-- Check if table "profiles" has "role"
-- Adjust policy for lease_applications
DROP POLICY IF EXISTS "Superadmins can delete lease_applications" ON public.lease_applications;
CREATE POLICY "Superadmins can delete lease_applications"
ON public.lease_applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);
