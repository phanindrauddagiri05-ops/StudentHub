# StudentHub — Academic Workspace

StudentHub is an all-in-one productivity platform tailored for student life, study organization, and document management.

## Project Roadmap

- **Phase 1: Website + PDF Tools** ✅ COMPLETED
- **Phase 2: Authentication + Dashboard** ✅ COMPLETED
- **Phase 3: Document Converters** ✅ COMPLETED (Current Phase)
- **Phase 4: Image Converters** (Locked)
- **Phase 5: PDF Summary + AI** (Locked)
- **Phase 6: Mind Maps + Questions** (Locked)
- **Phase 7: Timetable + Attendance** (Locked)
- **Phase 8: Resume Generator** (Locked until Phase 8 — all code preserved)
- **Phase 9: Notes + Search** (Locked)
- **Phase 10: Study Search** (Locked)
- **Phase 11: Ads + Analytics + Monetization** (Locked)

---

## Phase 3: Document Converters

The Document Converters system (`/tools/document-converters`) provides reliable, server-side conversions for common student formats without client bloat or fake extension renaming.

### Supported Conversions (Available)

| Source Format | Target Format | Engine / Library | Preserved Attributes |
|---|---|---|---|
| **PDF** | **DOCX** | `pdf-parse` + `docx` | Extracted structured paragraphs, headings, typography |
| **PDF** | **TXT** | `pdf-parse` | Clean text streams with page markers |
| **DOCX** | **PDF** | `mammoth` + `pdf-lib` | Paragraphs, headings, bullet lists, page margins |
| **DOCX** | **TXT** | `mammoth` | Raw plain text extraction |
| **XLSX** | **CSV** | `xlsx` (SheetJS) | Multi-sheet comma-separated records |
| **CSV** | **XLSX** | `xlsx` (SheetJS) | Tabular binary workbook with worksheets |
| **XLSX** | **PDF** | `xlsx` + `pdf-lib` | Paginated landscape tables with header fill and zebra striping |
| **CSV** | **PDF** | `xlsx` + `pdf-lib` | Clean grid table report |
| **CSV** | **TXT** | `xlsx` | Formatted plain text table |
| **TXT** | **PDF** | `pdf-lib` | Automatic line-wrapping, margins, page numbers |
| **TXT** | **DOCX** | `docx` | Standard Word paragraphs, 1-inch margins |

### Unsupported Conversions (Coming Soon)

In strict adherence to the project policy (**No fake support**), the following formats are transparently marked as **Coming Soon**:
- **PPTX → PDF & PPT → PDF**: Requires a headless desktop office suite (e.g. LibreOffice/soffice); marked Coming Soon to avoid low-fidelity or corrupt outputs.
- **DOC → PDF & XLS → PDF**: Legacy binary formats.
- **PDF → XLSX**: Requires AI-assisted table boundary OCR.
- **PDF → JPG / PNG**: Scheduled for Phase 4 (Image Converters).

### Architecture & Dependencies

- **API Route**: `/api/convert` (Next.js App Router POST)
- **Centralized Registry**: `src/lib/converters/registry.ts`
- **Format Metadata**: `src/lib/converters/formats.ts`
- **Conversion Engines**: `src/lib/converters/server/`
- **Dependencies**: `docx`, `mammoth`, `xlsx`, `pdf-lib`, `pdf-parse`
- **Limits**: `MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB = 25` (25 MB limit)
- **Storage**: Converted files are stored privately in Supabase Storage under `users/{user_id}/conversions/` and recorded in the `document_conversions` table with Row-Level Security (RLS). Fallbacks to local storage and browser blobs are available for offline/dev environments.

### How to Add a New Converter

1. Create a converter implementation file in `src/lib/converters/server/<source>-to-<target>.ts`:
   ```ts
   export async function convertSourceToTarget(inputBuffer: Buffer): Promise<Buffer> {
     // perform conversion
     return outputBuffer;
   }
   ```
2. Add the conversion definition to `CONVERSIONS` in `src/lib/converters/registry.ts`:
   ```ts
   {
     id: 'source-to-target',
     sourceFormat: 'source',
     targetFormat: 'target',
     displayName: 'Source to Target',
     description: '...',
     categories: ['popular', '...'],
     available: true,
     maxFileSizeMB: 25,
   }
   ```
3. Register the handler in `executeServerConversion()` in `src/lib/converters/server/index.ts`.

---

## Running Locally

```bash
# Run the development server
npm run dev

# Build the production bundle
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
