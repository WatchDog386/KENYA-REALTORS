-- Create rental_applications table for both "Post Rental" and "Looking for Rental" applications
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_type text NOT NULL CHECK (application_type IN ('post_rental', 'looking_for_rental')),
  
  -- For "Post Rental" applications
  property_title text,
  property_type text, -- e.g., Studio, 1-Bedroom, 2-Bedroom, Bedsitter
  property_location text,
  property_description text,
  monthly_rent numeric(10,2),
  bedrooms integer,
  bathrooms integer,
  amenities text[], -- Array of amenity strings
  contact_name text,
  contact_phone text,
  contact_email text,
  images_urls text[], -- Array of image URLs
  
  -- For "Looking for Rental" applications
  preferred_unit_type text, -- e.g., Studio, 1-Bedroom, 2-Bedroom, Bedsitter
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  preferred_locations text[], -- Array of preferred locations
  occupancy_date date,
  
  -- Common fields
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rental_applications_user_id ON rental_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_type ON rental_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_rental_applications_created_at ON rental_applications(created_at DESC);

-- Enable RLS
ALTER TABLE rental_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_applications

-- Allow users to view their own applications
DROP POLICY IF EXISTS rental_applications_user_read ON rental_applications;
CREATE POLICY rental_applications_user_read ON rental_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own applications
DROP POLICY IF EXISTS rental_applications_user_insert ON rental_applications;
CREATE POLICY rental_applications_user_insert ON rental_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow super admin to view all applications
DROP POLICY IF EXISTS rental_applications_admin_read ON rental_applications;
CREATE POLICY rental_applications_admin_read ON rental_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Allow super admin to update status
DROP POLICY IF EXISTS rental_applications_admin_update ON rental_applications;
CREATE POLICY rental_applications_admin_update ON rental_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_rental_applications_updated_at ON rental_applications;
CREATE TRIGGER update_rental_applications_updated_at
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();
