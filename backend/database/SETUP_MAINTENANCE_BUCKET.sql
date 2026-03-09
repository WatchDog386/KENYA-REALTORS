-- ============================================================================
-- STORAGE SETUP: MAINTENANCE IMAGES
-- Date: February 13, 2026
-- Purpose: Create bucket for maintenance reports and set policies
-- ============================================================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'maintenance_images', 
    'maintenance_images', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public View Maintenance" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Upload Maintenance" ON storage.objects;
DROP POLICY IF EXISTS "Technician Upload Maintenance" ON storage.objects;

-- 3. Create RLS Policies

-- Allow everyone to view images (simpler for now, or restrict to auth)
CREATE POLICY "Public View Maintenance" ON storage.objects
FOR SELECT USING (bucket_id = 'maintenance_images');

-- Allow authenticated users (tenants) to upload
CREATE POLICY "Tenant Upload Maintenance" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'maintenance_images' 
    AND auth.role() = 'authenticated'
);

-- Allow technicians/managers to upload (e.g. proof of work)
CREATE POLICY "Technician Upload Maintenance" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'maintenance_images' 
    AND auth.role() = 'authenticated'
);

-- Note: 'assigned_to_technician_id' and 'category_id' were added in previous script
