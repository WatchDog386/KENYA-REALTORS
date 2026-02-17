-- Enable the storage schema if not already enabled (usually is by default)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- 1. Create the 'user-avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts when re-running
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;


-- 3. Create RLS Policies for the 'user-avatars' bucket

-- ALLOW PUBLIC READ ACCESS
-- Everyone can view profile pictures
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'user-avatars' );

-- ALLOW AUTHENTICATED UPLOAD
-- Any logged-in user can upload a file to the 'user-avatars' bucket
-- (You can restrict the path in the app code)
CREATE POLICY "Avatar Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'user-avatars' );

-- ALLOW OWNER UPDATE
-- Users can update files where the folder name matches their user ID
CREATE POLICY "Avatar Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- ALLOW OWNER DELETE
-- Users can delete their own files
CREATE POLICY "Avatar Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

