-- Create enums for document and signature types
CREATE TYPE public.document_status AS ENUM ('draft', 'pending', 'completed', 'expired');
CREATE TYPE public.submission_type AS ENUM ('sign-now', 'send-email');
CREATE TYPE public.signature_type AS ENUM ('draw', 'type', 'upload');

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  num_pages INTEGER NOT NULL DEFAULT 1,
  status public.document_status NOT NULL DEFAULT 'draft',
  submission_type public.submission_type NOT NULL DEFAULT 'sign-now',
  recipient_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  signed_file_url TEXT
);

-- Create signature_fields table
CREATE TABLE public.signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  x DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  y DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  width DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  height DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_signed BOOLEAN NOT NULL DEFAULT FALSE,
  signature_type public.signature_type,
  signature_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_x CHECK (x >= 0 AND x <= 100),
  CONSTRAINT valid_y CHECK (y >= 0 AND y <= 100),
  CONSTRAINT valid_width CHECK (width > 0 AND width <= 100),
  CONSTRAINT valid_height CHECK (height > 0 AND height <= 100)
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_signature_fields_document_id ON public.signature_fields(document_id);

-- Enable RLS on both tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_fields ENABLE ROW LEVEL SECURITY;

-- Documents RLS policies
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Signature fields RLS policies
CREATE POLICY "Users can view fields on their documents"
  ON public.signature_fields FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fields on their documents"
  ON public.signature_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT id FROM public.documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields on their documents"
  ON public.signature_fields FOR UPDATE
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields on their documents"
  ON public.signature_fields FOR DELETE
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE user_id = auth.uid()
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', false),
  ('signed-documents', 'signed-documents', false),
  ('signatures', 'signatures', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for signed-documents bucket
CREATE POLICY "Users can upload own signed documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own signed documents files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signed-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for signatures bucket
CREATE POLICY "Users can upload own signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own signatures files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();