-- Fix: Add missing INSERT policy for profiles table
-- The 403 error occurs because there's no policy allowing authenticated users to insert profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Any authenticated user can insert their own profile (for auth trigger)
CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Super admins can insert any profile
CREATE POLICY "Super admins can insert any profile" 
    ON profiles FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_admin'
        )
    );

-- Super admins can update any profile
CREATE POLICY "Super admins can update all profiles" 
    ON profiles FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_admin'
        )
    );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles" 
    ON profiles FOR DELETE 
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'super_admin'
        )
    );
