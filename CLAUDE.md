# USHER — Federal Bid Management System

## What This Is

USHER is a federal government bid management platform that helps contractors discover SAM.gov opportunities, generate Statements of Work (SOWs), find and manage subcontractors, build bid packages, and submit proposals. It runs as a Next.js 16 app with a PostgreSQL database.

## Tech Stack

- **Framework:** Next.js 16 (App Router, `use client` components)
- **Language:** TypeScript 5.9 (strict mode)
- **Database:** PostgreSQL via Prisma ORM (`lib/db.ts` exports singleton)
- **Auth:** NextAuth v5 beta — JWT sessions, Credentials + Google providers (`lib/auth.ts`)
- **Storage:** Vercel Blob for SOW file uploads (`lib/storage.ts`)
- **PDF generation:** @react-pdf/renderer v4 — server-side via `renderToBuffer()` in the download route (`components/sows/SOWPDF.tsx`)
- **AI copy:** OpenAI GPT-4o via `openai` SDK — SOW section generation (`lib/openai.ts`). Key: `OPENAI_API_KEY`
- **Styling:** Tailwind CSS v4 — stone-\* palette exclusively, no other color families
- **Document parsing:** pdf-parse (PDFs), mammoth (DOCX) in `lib/attachment-parser.ts`

## Project Structure

```
app/
  api/                      # All API routes (REST, no tRPC)
    opportunities/[id]/     # Core: fetch, assess, subcontractors, attachments, progress
      attachments/[attachmentId]/ # PATCH — rename attachment (upserts AttachmentOverride)
    sows/                   # SOW CRUD, approval workflow, versioning
    bids/                   # Bid CRUD, document generation
    vendors/                # CRM for long-term vendor relationships
    admin/                  # User management, system logs
    auth/                   # NextAuth + registration
  opportunities/[id]/       # Workspace page (the main UI)
  login/                    # Auth pages
  dashboard/                # Dashboard

components/
  workspace/                # The main bid workspace
    WorkspaceLayout.tsx     # Shell: sidebar nav + progress bar + panel container
    DocumentDirectory.tsx   # Document tree sidebar
    panels/                 # Content panels swapped via activePanel state
      OpportunitySummaryPanel.tsx  # Opportunity details, attachments, parsed content
      SOWPanel.tsx                 # SOW editor with structured sections
      SubcontractorPanel.tsx       # Vendor discovery, call workflow, quotes
      BidEditorPanel.tsx           # Bid assembly and pricing
      ScopeOverviewPanel.tsx  # Scope tab: products/services/docs/compliance + team notes
      EmailDraftPanel.tsx          # Email composer with templates + attachments
  layout/                   # AppLayout, Navigation, Breadcrumbs
  shared/                   # Reusable: DeadlineIndicator, NextActionBanner, etc.
  sows/                     # SOW-specific: SOWCard, SOWEditor, SOWViewer, SOWStatusBadge
    SOWPDF.tsx               # react-pdf document template (exec summary layout)
  bids/                     # BidCard, BidDocumentEditor
  assessment/               # MarginCalculator
  progress/                 # StageIndicator, NextActionCard, WIPProgressTracker

lib/
  db.ts                     # Prisma client singleton
  auth.ts                   # NextAuth config (JWT strategy)
  samgov.ts                 # SAM.gov Opportunities API + Entity Management API
  google-places.ts          # Google Places API for vendor discovery
  attachment-parser.ts      # PDF/DOCX download + parse + structured extraction
  email.ts                  # Nodemailer setup
  storage.ts                # Vercel Blob upload/delete
  sow-utils.ts              # SOW content generation helpers
  opportunity-classification.ts  # NAICS-based opportunity classification
  usaspending.ts            # USASpending API for historical pricing
  thomasnet.ts              # ThomasNet supplier lookup (limited use)
  openai.ts              # OpenAI singleton + generateSOWSections(), generateOpportunitySynopsis()

prisma/
  schema.prisma             # Full schema — see Data Model section below
```

## Key Patterns

### Parent-as-state-hub

The opportunity workspace page (`app/opportunities/[id]/page.tsx`) owns ALL state and threads props down to panels. Panels never fetch their own primary data — the parent fetches and passes it. This prevents duplicate requests and keeps state synchronized across panels.

Exception: `OpportunitySummaryPanel` fetches its own attachment list because it was built first. The parent now also fetches attachments into `solicitationAttachments` for other panels.

### Panel switching

`activePanel` state in the parent controls which panel renders. Values: `'summary'`, `'sow'`, `'subcontractors'`, `'bid'`, `'email'`. The `WorkspaceLayout` sidebar buttons set this.

### SAM.gov API keys

Two separate API keys are needed:
- `SAM_GOV_API_KEY` — for the Opportunities API (public data)
- `SAM_GOV_ENTITY_API_KEY` — for the Entity Management API (FOUO, requires separate registration)

The entity key falls back to the opportunities key if not set, but will get 403 errors on entity searches.

### Server-side proxy for attachments

SAM.gov attachment URLs use 303 redirects to S3 which fail with CORS in the browser. All attachment viewing goes through `/api/opportunities/[id]/attachments/[attachmentId]/proxy` which follows redirects server-side and streams the content.

### SOW generation flow

1. User clicks "Generate SOW" in SOWPanel or OpportunitySummaryPanel
2. POST `/api/sows` — auto-parses solicitation attachments if `parsedAttachments` is null
3. Attachment content is parsed via `parseAllAttachments()` → cached in `opportunity.parsedAttachments`
4. SOW content is generated from the parsed content using `generateSOWContent()` in `lib/sow-utils.ts`
5. Structured sections with `{ title, summary, bullets[], details }` format

### PDF generation (SOW download)
`GET /api/sows/[id]/download` renders the PDF on-the-fly server-side:
1. Fetch SOW content JSON from DB
2. `React.createElement(SOWPDF, { content })` — no JSX in route file
3. `renderToBuffer()` from `@react-pdf/renderer` → streams as `application/pdf`
No Python, no Vercel Blob storage needed. The Python `lib/python/sow_generator_pdf.py` pipeline is deprecated — do not use.

### OpenAI SOW copy generation
`POST /api/sows` calls `generateSOWSections()` in `lib/openai.ts`:
- Sections 1–6 (Background, Scope, Place, Period, Deliverables, Compliance) → GPT-4o with solicitation context
- Sections 7+ (attachments list, FAR references, evaluation, qualifications) → rule-based builders appended after
- Falls back to rule-based builders if OpenAI call fails

### Attachment inline viewer
`OpportunitySummaryPanel` attachment list: clicking the eye icon opens a fullscreen modal with an `<iframe>` pointed at the server-side proxy route. Download button sits beside it. SAM.gov attachments are never fetched client-side due to CORS/redirect constraints.

### Subcontractor workflow order

Discovery → Call → SOW delivery → Quote collection

Vendors are sorted: active (not yet called) first, then "pending" (called, awaiting response) below a divider. Each vendor card tracks call status, email, and quote receipt.

### Progress bar order

SOW → Subs → Quotes → Bid → Submit (matches actual workflow sequence)

## Conventions

### Styling
- Use `stone-*` Tailwind classes exclusively for all UI colors
- Never use `gray-*`, `slate-*`, `zinc-*`, or `neutral-*`
- Text: `text-stone-900` (primary), `text-stone-600` (secondary), `text-stone-400` (tertiary)
- Borders: `border-stone-200` (default), `border-stone-100` (subtle)
- Backgrounds: `bg-white` (cards), `bg-stone-50` (page), `bg-stone-100` (inputs/badges)
- Buttons: `bg-stone-800 text-white hover:bg-stone-700` (primary)

### Component patterns
- All workspace panels are `'use client'` components
- Panel components receive typed props interfaces (no `any` for props)
- State lives in the parent page, not in panels (except local UI state like form inputs)
- Use `useCallback` for handlers passed as props
- Use `useMemo` for expensive derived values
- `isGenerating` / `isGeneratingSOW` props passed from parent to panels to show button spinners — never derive loading state inside a panel

### API routes
- All routes in `app/api/` directory using Next.js Route Handlers
- Return `NextResponse.json()` with consistent shape: `{ opportunity, error, etc. }`
- Use Prisma for all DB access via `import { prisma } from '@/lib/db'`
- Validate with Zod where needed

### File naming
- Components: PascalCase (`SubcontractorPanel.tsx`)
- Lib files: kebab-case (`attachment-parser.ts`)
- API routes: always `route.ts` in nested directories

## Data Model (Key Models)

- **Opportunity** — Core entity. Linked to SAM.gov via `solicitationNumber`. Has `parsedAttachments` (JSON cache of parsed solicitation content), `rawData` (full SAM.gov response).
- **Subcontractor** — Per-opportunity vendor. Tracks call workflow (`callCompleted`, `callCompletedAt`), quotes (`quotedAmount`, `isActualQuote`), verification status, SAM.gov data, Google Places data.
- **SOW** — Statement of Work with versioning, approval workflow, structured `content` JSON, file storage via Vercel Blob.
- **Bid** — Pricing and bid package. `content` JSON mirrors SOW structure. Tracks `historicalData` from USASpending.
- **OpportunityProgress** — Stage tracking (DISCOVERY through SUBMITTED), blockers, next actions.
- **OpportunityAssessment** — Go/no-go decision with margin analysis.
- **Vendor** / **VendorCommunication** — CRM for cross-opportunity vendor relationships.
- **AttachmentOverride** — Per-opportunity rename record. Stores `originalName` (SAM.gov, immutable) and `currentName` (user-edited). Unique on `[opportunityId, attachmentId]`.
- **AttachmentEditHistory** — Append-only log of every rename (`previousName` → `newName`, `editedById`, `editedAt`).

### Shared Type: `RichAttachment` (`lib/types/attachment.ts`)
Returned by `GET /api/opportunities/[id]/attachments`. Fields: `id`, `originalName`, `currentName`, `isEdited`, `url`, `type`, `size`, `postedDate`, `editedAt`, `editedBy`.

## Environment Variables

```
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET           # NextAuth JWT secret
NEXTAUTH_URL              # App URL (http://localhost:3000 in dev)
SAM_GOV_API_KEY           # SAM.gov Opportunities API key
SAM_GOV_ENTITY_API_KEY    # SAM.gov Entity Management API key (FOUO)
GOOGLE_PLACES_API_KEY     # Google Places API
GOOGLE_CLIENT_ID          # Google OAuth
GOOGLE_CLIENT_SECRET      # Google OAuth
BLOB_READ_WRITE_TOKEN     # Vercel Blob storage
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  # Email (Nodemailer)
OPENAI_API_KEY            # OpenAI GPT-4o for SOW section generation
```

## Common Commands

```bash
npm run dev               # Start dev server
npm run build             # Production build
npx tsc --noEmit          # Type check without emitting
npx prisma migrate dev    # Run migrations
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Open DB browser
```
