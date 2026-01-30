# SignDoc - Document Signature App

A step-based PDF signature tool with a wizard flow: Upload → Add Fields → Submission Options → Sign → Download.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **PDF Rendering**: pdfjs-dist v2.16.105
- **PDF Export**: pdf-lib
- **Backend**: Lovable Cloud (PostgreSQL, Storage, Auth)

---

## Database Schema

### Enums

```sql
CREATE TYPE document_status AS ENUM ('draft', 'pending', 'completed', 'expired');
CREATE TYPE submission_type AS ENUM ('sign-now', 'send-email');
CREATE TYPE signature_type AS ENUM ('draw', 'type', 'upload');
```

### Documents Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (references auth.users) |
| `name` | TEXT | Original filename |
| `file_url` | TEXT | URL to PDF in storage |
| `num_pages` | INTEGER | Total pages in PDF |
| `status` | document_status | draft, pending, completed, expired |
| `submission_type` | submission_type | sign-now or send-email |
| `recipient_email` | TEXT | Email recipient (nullable) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modified |
| `signed_at` | TIMESTAMPTZ | Completion timestamp |
| `signed_file_url` | TEXT | URL to signed PDF |

### Signature Fields Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | References documents.id |
| `signer_id` | UUID | Who should sign (nullable) |
| `page_number` | INTEGER | Page number (1-indexed) |
| `x` | DECIMAL(5,2) | X position (0-100%) |
| `y` | DECIMAL(5,2) | Y position (0-100%) |
| `width` | DECIMAL(5,2) | Width (0-100%) |
| `height` | DECIMAL(5,2) | Height (0-100%) |
| `is_signed` | BOOLEAN | Signature applied? |
| `signature_type` | signature_type | draw, type, or upload |
| `signature_url` | TEXT | URL to signature image |
| `signed_at` | TIMESTAMPTZ | When signed |
| `created_at` | TIMESTAMPTZ | When field was added |

### Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `documents` | Original PDFs | No |
| `signed-documents` | Completed signed PDFs | No |
| `signatures` | Signature images | No |

---

## JSON Structures

### Document Object

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "contract.pdf",
  "file_url": "https://storage.../documents/user_id/file.pdf",
  "num_pages": 5,
  "status": "pending",
  "submission_type": "sign-now",
  "recipient_email": null,
  "created_at": "2025-01-30T06:30:00Z",
  "updated_at": "2025-01-30T06:35:00Z",
  "signed_at": null,
  "signed_file_url": null
}
```

### Signature Field Object

```json
{
  "id": "uuid",
  "document_id": "uuid",
  "signer_id": null,
  "page_number": 2,
  "x": 50.5,
  "y": 75.2,
  "width": 25.0,
  "height": 10.0,
  "is_signed": true,
  "signature_type": "draw",
  "signature_url": "https://storage.../signatures/user_id/sig.png",
  "signed_at": "2025-01-30T06:40:00Z",
  "created_at": "2025-01-30T06:31:00Z"
}
```

---

## TypeScript Types

```typescript
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

interface SignatureField {
  id: string;
  document_id: string;
  signer_id: string | null;
  page_number: number;
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
  width: number;
  height: number;
  is_signed: boolean;
  signature_type: 'draw' | 'type' | 'upload' | null;
  signature_url: string | null;
  signed_at: string | null;
  created_at: string;
}
```

---

## Important Notes

### Percentage-Based Positioning

All field positions (`x`, `y`, `width`, `height`) are stored as percentages (0-100):
- Ensures consistent placement regardless of zoom or screen size
- To convert: `pixelX = (percentX / 100) * pageWidth`

### File Storage

⚠️ **Never store file data in the database!**
- Store files in blob storage (Lovable Cloud Storage)
- Only store URL references in database columns

### Signature Methods

Users can sign using three methods:
1. **Draw** - Canvas drawing with stylus/mouse
2. **Type** - Typed name rendered in Dancing Script font
3. **Upload** - Upload PNG/JPG signature image

---

## Development

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deployment

Open [Lovable](https://lovable.dev) and click Share → Publish.

## Custom Domain

Navigate to Project → Settings → Domains → Connect Domain.

Read more: [Custom Domain Setup](https://docs.lovable.dev/features/custom-domain#custom-domain)
