-- FIX SCRIPT: Create the missing 'property_images' bucket for unit uploads

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property_images', 'property_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop old policies to ensure clean state
DROP POLICY IF EXISTS "Public Access Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Property Images" ON storage.objects;

-- 3. Create Policies

-- READ: Public access (so images show on the website)
CREATE POLICY "Public Access Property Images" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'property_images' );

-- UPLOAD: Any authenticated user (Managers/Admin)
CREATE POLICY "Authenticated Upload Property Images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'property_images' );

-- UPDATE: Any authenticated user
CREATE POLICY "Authenticated Update Property Images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'property_images' );

-- DELETE: Any authenticated user
CREATE POLICY "Authenticated Delete Property Images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'property_images' );
