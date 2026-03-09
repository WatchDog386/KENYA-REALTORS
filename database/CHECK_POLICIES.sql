-- Check what policies currently exist on utility_constants
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'utility_constants';
