-- Create documents table for Tenant Portal
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('lease', 'receipt', 'notice', 'other')),
    file_type TEXT,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own documents" 
ON public.documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Property Managers can view documents for their properties" 
ON public.documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = documents.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    )
);

CREATE POLICY "Admins can view all documents" 
ON public.documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);
