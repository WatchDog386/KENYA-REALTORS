-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Tenant',
  location TEXT,
  quote TEXT NOT NULL,  -- The main review text
  headline TEXT,        -- Short summary/title
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  impact INTEGER DEFAULT 85, -- Random metric for UI flair
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read testimonials (public)
CREATE POLICY "Testimonials are viewable by everyone" 
ON testimonials FOR SELECT 
USING (true);

-- Policy: Anyone can insert testimonials (public submission)
CREATE POLICY "Anyone can submit testimonials" 
ON testimonials FOR INSERT 
WITH CHECK (true);

-- Insert some dummy data to match the hardcoded ones
INSERT INTO testimonials (name, role, location, headline, quote, rating, impact, status)
VALUES 
('James Kennedy', 'Property Owner', 'Nairobi, Kilimani', 'Cashflow Efficiency', 'Managing the portfolio used to be chaos. Now, with automated collections, our arrears dropped by 90% in two months.', 5, 98, 'approved'),
('Sarah M.', 'Verified Tenant', 'Mombasa, Nyali', 'Tenant Transparency', 'I finally have a real-time view of my rent payments. The SMS receipts give me peace of mind every month.', 5, 94, 'approved'),
('David Ochieng', 'Contractor', 'Nakuru', 'Vendor Integration', 'Work orders are clear, photos are attached, and billing is instant. It''s the most professional system I''ve used.', 4, 88, 'approved'),
('Metro Housing', 'Manager', 'Nairobi, CBD', 'Seamless Scaling', 'We doubled our unit count without hiring new staff. The ''Unit Volumetrics'' feature is an absolute game changer.', 5, 99, 'approved');
