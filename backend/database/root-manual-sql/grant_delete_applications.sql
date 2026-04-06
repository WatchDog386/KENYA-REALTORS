-- Drop the policy if it already exists to avoid errors
DROP POLICY IF EXISTS "Superadmins can delete lease_applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Enable delete for super_admins" ON public.lease_applications;

-- Create the delete policy for super_admin
CREATE POLICY "Superadmins can delete lease_applications"
ON public.lease_applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);
