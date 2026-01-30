-- =====================================================
-- TENANT DASHBOARD - DOCUMENTS TABLE ADDITION
-- =====================================================
-- This SQL adds the documents table if it doesn't exist

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('lease', 'receipt', 'notice', 'other')),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_user_policy ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DOCUMENTS FOR TESTING
-- =====================================================
INSERT INTO public.documents (user_id, title, file_type, file_url, document_type) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Lease Agreement', 'PDF', '/documents/lease.pdf', 'lease'),
('00000000-0000-0000-0000-000000000001'::uuid, 'January Payment Receipt', 'PDF', '/documents/receipt-jan.pdf', 'receipt')
ON CONFLICT DO NOTHING;
