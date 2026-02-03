-- Fix: Add missing INSERT policy for profiles table
-- FIXED: Removed recursive subqueries that cause infinite recursion error (42P17)
-- The 403 error occurs because there's no policy allowing authenticated users to insert profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Service role (backend) can do everything - NO RECURSION
CREATE POLICY "Service role full access"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Any authenticated user can insert their own profile (for auth trigger)
-- NO RECURSIVE SUBQUERY
CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Users can read their own profile - NO RECURSIVE SUBQUERY
CREATE POLICY "Users can read their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own profile - NO RECURSIVE SUBQUERY
CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
