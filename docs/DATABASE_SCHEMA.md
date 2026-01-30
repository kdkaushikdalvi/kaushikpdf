# Document Signature App - Database Schema

This document describes the JSON structure and database schema for storing signature documents and fields.

## Overview

The app stores two main entities:
1. **Documents** - The PDF files being signed
2. **Signature Fields** - Individual signature placeholders on documents

---

## JSON Structures

### Document Object

```json
{
  "id": "doc_uuid_here",
  "user_id": "user_uuid",
  "name": "contract.pdf",
  "file_url": "https://storage.example.com/documents/doc_uuid.pdf",
  "num_pages": 5,
  "status": "pending",
  "submission_type": "sign-now",
  "recipient_email": "recipient@example.com",
  "created_at": "2025-01-30T06:30:00Z",
  "updated_at": "2025-01-30T06:35:00Z",
  "signed_at": null,
  "signed_file_url": null
}
```

#### Document Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner/creator of the document |
| `name` | String | Original filename |
| `file_url` | String | URL to the uploaded PDF in blob storage |
| `num_pages` | Integer | Total number of pages in the PDF |
| `status` | Enum | `draft`, `pending`, `completed`, `expired` |
| `submission_type` | Enum | `sign-now` or `send-email` |
| `recipient_email` | String | Email of recipient (if sending) |
| `created_at` | Timestamp | When document was created |
| `updated_at` | Timestamp | Last modification time |
| `signed_at` | Timestamp | When all signatures were completed |
| `signed_file_url` | String | URL to the final signed PDF |

---

### Signature Field Object

```json
{
  "id": "sig_uuid_here",
  "document_id": "doc_uuid_here",
  "signer_id": "user_uuid_or_null",
  "page_number": 2,
  "x": 50.5,
  "y": 75.2,
  "width": 25.0,
  "height": 10.0,
  "is_signed": false,
  "signature_type": null,
  "signature_url": null,
  "signed_at": null,
  "created_at": "2025-01-30T06:31:00Z"
}
```

#### Signature Field Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to documents table |
| `signer_id` | UUID | Who should/did sign (nullable for self-sign) |
| `page_number` | Integer | Page number (1-indexed) |
| `x` | Float | X position as percentage (0-100) |
| `y` | Float | Y position as percentage (0-100) |
| `width` | Float | Width as percentage of page |
| `height` | Float | Height as percentage of page |
| `is_signed` | Boolean | Whether signature has been applied |
| `signature_type` | Enum | `draw`, `type`, or `upload` |
| `signature_url` | String | URL to signature image in blob storage |
| `signed_at` | Timestamp | When this field was signed |
| `created_at` | Timestamp | When field was added |

---

## SQL Schema (PostgreSQL/Supabase)

### Enums

```sql
-- Document status enum
CREATE TYPE document_status AS ENUM ('draft', 'pending', 'completed', 'expired');

-- Submission type enum
CREATE TYPE submission_type AS ENUM ('sign-now', 'send-email');

-- Signature type enum
CREATE TYPE signature_type AS ENUM ('draw', 'type', 'upload');
```

### Documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  num_pages INTEGER NOT NULL DEFAULT 1,
  status document_status NOT NULL DEFAULT 'draft',
  submission_type submission_type NOT NULL DEFAULT 'sign-now',
  recipient_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  signed_file_url TEXT
);

-- Index for user queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### Signature Fields Table

```sql
CREATE TABLE signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  x DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  y DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  width DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  height DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_signed BOOLEAN NOT NULL DEFAULT FALSE,
  signature_type signature_type,
  signature_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure x, y, width, height are valid percentages
  CONSTRAINT valid_x CHECK (x >= 0 AND x <= 100),
  CONSTRAINT valid_y CHECK (y >= 0 AND y <= 100),
  CONSTRAINT valid_width CHECK (width > 0 AND width <= 100),
  CONSTRAINT valid_height CHECK (height > 0 AND height <= 100)
);

-- Index for document queries
CREATE INDEX idx_signature_fields_document_id ON signature_fields(document_id);
CREATE INDEX idx_signature_fields_signer_id ON signature_fields(signer_id);

-- RLS Policies
ALTER TABLE signature_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields on their documents"
  ON signature_fields FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fields on their documents"
  ON signature_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields on their documents"
  ON signature_fields FOR UPDATE
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields on their documents"
  ON signature_fields FOR DELETE
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );
```

---

## Storage Buckets

### Required Buckets

```sql
-- Create storage buckets for files
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', false),      -- Original PDFs (private)
  ('signed-documents', 'signed-documents', false),  -- Signed PDFs (private)
  ('signatures', 'signatures', false);    -- Signature images (private)
```

### Storage Policies

```sql
-- Documents bucket policies
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Similar policies for signatures and signed-documents buckets
```

---

## Example API Responses

### Create Document Response

```json
{
  "success": true,
  "data": {
    "id": "d7f8e9a0-1234-5678-abcd-ef0123456789",
    "name": "contract.pdf",
    "file_url": "https://your-project.supabase.co/storage/v1/object/documents/user_id/contract.pdf",
    "num_pages": 3,
    "status": "draft",
    "signature_fields": []
  }
}
```

### Get Document with Fields Response

```json
{
  "success": true,
  "data": {
    "id": "d7f8e9a0-1234-5678-abcd-ef0123456789",
    "name": "contract.pdf",
    "file_url": "https://...",
    "num_pages": 3,
    "status": "pending",
    "submission_type": "sign-now",
    "signature_fields": [
      {
        "id": "s1f2g3h4-...",
        "page_number": 1,
        "x": 65.5,
        "y": 80.2,
        "width": 25,
        "height": 10,
        "is_signed": true,
        "signature_type": "draw",
        "signature_url": "https://..."
      },
      {
        "id": "s5f6g7h8-...",
        "page_number": 2,
        "x": 50,
        "y": 75,
        "width": 25,
        "height": 10,
        "is_signed": false,
        "signature_type": null,
        "signature_url": null
      }
    ]
  }
}
```

---

## Important Notes

### Field Positioning (Percentage-Based)

All position values (`x`, `y`, `width`, `height`) are stored as **percentages** (0-100):
- This ensures consistent placement regardless of zoom level or screen size
- To convert to pixels: `pixelX = (percentX / 100) * pageWidth`

### File Storage

⚠️ **CRITICAL**: Never store file binary data in the database!
- Store PDFs and signature images in blob storage (Supabase Storage, S3, etc.)
- Only store the URL/path reference in the database
- This prevents disk space issues and performance degradation

### Signature Images

When a user signs:
1. Capture the signature as PNG (base64)
2. Upload to storage bucket
3. Store the returned URL in `signature_fields.signature_url`
4. Set `is_signed = true` and `signature_type`

---

## TypeScript Types

```typescript
// Document type
interface Document {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  num_pages: number;
  status: 'draft' | 'pending' | 'completed' | 'expired';
  submission_type: 'sign-now' | 'send-email';
  recipient_email: string | null;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  signed_file_url: string | null;
}

// Signature field type
interface SignatureField {
  id: string;
  document_id: string;
  signer_id: string | null;
  page_number: number;
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
  width: number;  // percentage
  height: number;  // percentage
  is_signed: boolean;
  signature_type: 'draw' | 'type' | 'upload' | null;
  signature_url: string | null;
  signed_at: string | null;
  created_at: string;
}
```
