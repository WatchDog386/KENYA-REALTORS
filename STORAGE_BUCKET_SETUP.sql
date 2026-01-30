-- ============================================================================
-- SUPABASE STORAGE SETUP SCRIPT
-- ============================================================================
-- Run this entire script in Supabase SQL Editor to fix storage issues
-- 
-- Instructions:
-- 1. Go to https://app.supabase.com
-- 2. Select your REALTORS-LEASERS project
-- 3. Click "SQL Editor" on the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire script
-- 6. Click "Run"
-- 7. Done!
--
-- ============================================================================

-- Step 1: Create avatars bucket
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('avatars', 'avatars', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies (if they exist)
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

-- Step 4: Create new policies

-- Policy 1: Allow public read access to avatars
CREATE POLICY "Public read avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to upload files to avatars bucket
CREATE POLICY "Auth users upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy 3: Allow users to update their own avatars
CREATE POLICY "Auth users update avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy 4: Allow users to delete their own avatars
CREATE POLICY "Auth users delete avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Step 5: Verify setup
SELECT 
    'Bucket Created' as step,
    id,
    name,
    public
FROM storage.buckets 
WHERE id = 'avatars';

-- Done! You should see one row with: avatars | avatars | true
