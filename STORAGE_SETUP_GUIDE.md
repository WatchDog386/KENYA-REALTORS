# Storage Bucket Setup Guide

The tenant profile image upload requires a storage bucket called `avatars` to be created in Supabase.

## Quick Setup (2 minutes)

### Option 1: Using SQL (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (REALTORS-LEASERS)
3. Go to **SQL Editor** (in left sidebar)
4. Click **New Query**
5. Copy and paste the contents of this file: `supabase/migrations/20260130_create_storage_buckets.sql`
6. Click **Run** button
7. Done! ✅

### Option 2: Using Supabase UI

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name: `avatars`
5. Make it **Public** (check the public box)
6. Click **Create bucket**
7. Done! ✅

## Verify Setup

After creating the bucket, try uploading an image from the tenant profile page. You should see:
- ✅ Image uploads successfully
- ✅ No "Bucket not found" error
- ✅ Avatar displays in profile

## Troubleshooting

### "Bucket not found" error
- Make sure you created the bucket named exactly `avatars`
- Make sure the bucket is set to Public
- Try refreshing the page

### Image uploads but doesn't show
- Check Supabase Storage → avatars bucket
- Verify files are there
- Check that bucket is Public

### Permission denied errors
- Run the SQL script from Option 1 to set up RLS policies
- Make sure you're logged in as the tenant user

## Folder Structure

Avatars are stored in: `avatars/{user_id}/{filename}`

Example: `avatars/328e6cf9-49be-4f6f-be44-8d013ed9c698/image-1769748631145.jpg`
