-- Create the duty-reports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('duty-reports', 'duty-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Report Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Report Upload" ON storage.objects;
DROP POLICY IF EXISTS "Report Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Report Delete Access" ON storage.objects;

-- ALLOW PUBLIC READ ACCESS
-- Everyone (authenticated or not) can view the report images if they have the link
CREATE POLICY "Public Report Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'duty-reports' );

-- ALLOW AUTHENTICATED UPLOAD
-- Any logged-in user can upload a file to the 'duty-reports' bucket
CREATE POLICY "Authenticated Report Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
    bucket_id = 'duty-reports' 
    AND auth.role() = 'authenticated'
);

-- ALLOW USERS TO UPDATE THEIR OWN UPLOADS
CREATE POLICY "Report Update Access" 
ON storage.objects FOR UPDATE
USING ( 
    bucket_id = 'duty-reports' 
    AND auth.uid() = owner
);

-- ALLOW USERS TO DELETE THEIR OWN UPLOADS
CREATE POLICY "Report Delete Access" 
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'duty-reports' 
    AND auth.uid() = owner
);
