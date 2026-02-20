# USHER Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                    │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         Opportunity Workspace Page               │ │
│  │         app/opportunities/[id]/page.tsx          │ │
│  │                                                   │ │
│  │  ┌──────────┐ ┌──────────────────────────────┐  │ │
│  │  │ Sidebar  │ │   Active Panel               │  │ │
│  │  │ + Prog.  │ │   (Summary|SOW|Subs|Bid|     │  │ │
│  │  │   Bar    │ │    Scope|SOW|Subs|Bid|Email)  │  │ │
│  │  └──────────┘ └──────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  │ fetch() calls
                  ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes (app/api/)            │
│                                                       │
│  opportunities/  sows/  bids/  vendors/  admin/      │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
│ SAM.gov  │ │OpenAI  │ │ Google │ │ PostgreSQL │
│ APIs     │ │  API   │ │ Places │ │ (Prisma)   │
└──────────┘ └────────┘ └────────┘ └────────────┘

Note: Vercel Blob is still used for general file storage
(SOW.fileUrl, SOWVersion.fileUrl), but SOW PDF generation
no longer writes to Blob — PDFs are streamed on demand.
```

## Workspace Data Flow

The opportunity workspace page is the application's core. It follows a **parent-as-state-hub** pattern.

```
┌─ app/opportunities/[id]/page.tsx ─────────────────────────────┐
│                                                                │
│  State:                                                        │
│    opportunity          ← GET /api/opportunities/[id]          │
│    assessment           ← GET /api/opportunities/[id]/assessment│
│    activePanel          ← sidebar button clicks                │
│    selectedSubcontractor← from SubcontractorPanel callbacks    │
│    emailTemplateType    ← set by workflow transitions          │
│    emailContext          ← SOW synopsis for email body         │
│    solicitationAttachments (RichAttachment[])                   │
│                         ← GET /api/opportunities/[id]/attachments│
│    emailSelectedAttachments (Set<string>)                      │
│                         ← survives panel switching             │
│    generatingSOW        ← loading state for SOW generation     │
│    discoveringSubcontractors ← loading state for vendor search │
│                                                                │
│  Renders ONE panel at a time based on activePanel:             │
│                                                                │
│    'summary'  → OpportunitySummaryPanel                        │
│    'scope'    → ScopeOverviewPanel (products/services/         │
│                   documentation/compliance)                    │
│    'sow'      → SOWPanel                                       │
│    'subcontractors' → SubcontractorPanel                       │
│    'bid'      → BidEditorPanel                                 │
│    'email'    → EmailDraftPanel                                │
│                                                                │
│  Cross-panel workflows (parent orchestrates):                  │
│    SubcontractorPanel.onSendDetails(sub)                       │
│      → setSelectedSubcontractor(sub)                           │
│      → setEmailTemplateType('sow_delivery')                    │
│      → setActivePanel('email')                                 │
│                                                                │
│    SubcontractorPanel.onRequestQuote(sub)                      │
│      → setSelectedSubcontractor(sub)                           │
│      → setEmailTemplateType('quote_request')                   │
│      → setActivePanel('email')                                 │
└────────────────────────────────────────────────────────────────┘
```

## Bid Workflow Pipeline

```
1. SOW           2. Subs          3. Quotes        4. Bid          5. Submit
───────────      ───────────      ───────────      ──────────      ──────────
Parse docs  →    Discover    →    Call vendors →   Assemble   →   Review &
Generate SOW     vendors          Get quotes       pricing        submit
Edit sections    (SAM + Google)   Email SOW        Build doc
                 Call checklist   Track responses   Finalize
                 Sort active/
                 pending
```

Progress tracked in `OpportunityProgress` model and visualized in `WorkspaceLayout` progress bar.

## API Route Map

### Opportunities
```
GET/POST   /api/opportunities                              # List/create
GET/PUT    /api/opportunities/[id]                          # Detail/update
POST       /api/opportunities/fetch                         # Fetch from SAM.gov
GET/PUT    /api/opportunities/[id]/progress                 # Stage tracking
GET/POST   /api/opportunities/[id]/assessment               # Go/no-go analysis
POST       /api/opportunities/[id]/assessment/auto-generate # AI assessment

GET        /api/opportunities/[id]/attachments              # List SAM.gov attachments (returns RichAttachment[])
PATCH      /api/opportunities/[id]/attachments/[attId]      # Rename attachment (upserts AttachmentOverride)
GET        /api/opportunities/[id]/attachments/[attId]/proxy # Proxy download (CORS fix)
POST       /api/opportunities/[id]/parse-attachments        # Parse PDF/DOCX content

GET/POST   /api/opportunities/[id]/subcontractors           # List/add vendors
PUT/DELETE /api/opportunities/[id]/subcontractors/[subId]   # Update/remove vendor
POST       /api/opportunities/[id]/subcontractors/discover  # Auto-discover (SAM + Google)
POST       /api/opportunities/[id]/subcontractors/deduplicate # Merge duplicates
```

### SOWs
```
GET/POST   /api/sows                        # List/generate
GET/PUT    /api/sows/[id]                   # Detail/update
GET        /api/sows/[id]/download          # Download file
POST       /api/sows/[id]/approve           # Approval action
POST       /api/sows/[id]/assign-approver   # Set reviewer
POST       /api/sows/[id]/send              # Email to vendor
POST       /api/sows/[id]/accept            # Vendor acceptance
GET/POST   /api/sows/[id]/versions          # Version history
POST       /api/sows/backfill-content       # Migrate legacy SOWs
```

### Bids
```
GET/POST   /api/bids                        # List/create
GET/PUT    /api/bids/[id]                   # Detail/update
POST       /api/bids/[id]/document          # Generate document
```

### Other
```
POST       /api/auth/register               # User registration
GET/POST   /api/vendors                     # CRM vendors
GET/PUT    /api/vendors/[id]                # CRM vendor detail
GET/POST   /api/vendors/[id]/communications # Communication log
GET        /api/reports/margins|pipeline|win-rate  # Analytics
GET/POST   /api/admin/users|logs|settings   # Admin
```

## External API Integration

### SAM.gov (lib/samgov.ts)

Two separate APIs, potentially needing different keys:

| API | Endpoint | Key | Data |
|-----|----------|-----|------|
| Opportunities | api.sam.gov/opportunities/v2 | `SAM_GOV_API_KEY` | Solicitations, deadlines, NAICS, attachments |
| Entity Management | api.sam.gov/entity-information/v3 | `SAM_GOV_ENTITY_API_KEY` (FOUO) | Vendor registration, UEI, CAGE, certifications |

Attachment download: SAM.gov returns 303 redirects to S3. Must follow server-side — browser fetch fails on cross-origin redirect. The proxy route handles this.

### Google Places (lib/google-places.ts)

Used in subcontractor discovery. Searches by NAICS-derived trade keywords + location. Returns business name, address, phone, rating, place ID.

### USASpending (lib/usaspending.ts)

Historical contract pricing for bid intelligence. Searches by NAICS code to find comparable past awards.

## SOW Content Structure

SOWs store structured JSON in the `content` column:

```typescript
{
  sections: [
    {
      id: string,
      title: string,         // "Scope of Work"
      summary?: string,      // Brief overview (italic in UI)
      bullets?: string[],    // Key deliverables
      details?: string,      // Full section text
      content: string,       // Legacy plain text (fallback)
    }
  ],
  opportunity?: { ... },     // Opportunity metadata snapshot
  scope?: { ... },           // Parsed scope from attachments
  attachments?: [ ... ],     // Referenced solicitation docs
  sourceEnhanced?: boolean,  // True if built from parsed attachments
  aiGenerated: boolean,      // True when sections 1-6 generated by GPT-4o
}
```

## Subcontractor Card States

```
┌─────────────────────────┐
│  ACTIVE (not yet called) │  bg-white, border-stone-200
│  - Phone link visible    │  Sorted first in list
│  - Call checklist shown  │
│  - "Mark Call Complete"  │
└─────────────────────────┘
         │ click "Mark Call Complete"
         ▼
┌─────────────────────────┐
│  PENDING (called)        │  bg-stone-50/70, border-stone-200/60
│  - "✓ Called" badge      │  Sorted below divider
│  - "Send SOW" button     │
│  - Next-step badges      │
│  - Checklist hidden      │
└─────────────────────────┘
```

## Database Schema (Key Relations)

```
User ──┬── OpportunityWatch ──── Opportunity
       ├── Bid ──────────────── Opportunity
       ├── SOW (generator) ──── Opportunity
       ├── SOW (approver)
       ├── SOWApproval
       └── OpportunityAssessment

Opportunity ──┬── Subcontractor (per-opp vendors)
              ├── SOW (versioned, with approval flow)
              ├── Bid (pricing + document)
              ├── OpportunityProgress (stage tracking)
              └── OpportunityAssessment (go/no-go)

Vendor ─── VendorCommunication (CRM, cross-opportunity)
```

## Authentication Flow

```
NextAuth v5 (beta) → JWT strategy
  ├── Credentials provider (email/password, bcrypt)
  └── Google OAuth provider

Session includes: { user: { id, email, name, role } }
Roles: USER, ADMIN, VIEWER
Custom pages: /login, /auth/error
```

## File Storage

SOW documents are stored in Vercel Blob (`@vercel/blob`):
- Upload via `lib/storage.ts` → returns public URL
- Referenced in `SOW.fileUrl` and `SOWVersion.fileUrl`
- Download via `/api/sows/[id]/download`

Solicitation attachments are NOT stored locally — they're proxied from SAM.gov on demand via the attachment proxy route.

## PDF Generation

SOW PDFs are rendered server-side on demand — no file storage required:

```
GET /api/sows/[id]/download
    │
    ├── Fetch SOW.content JSON from DB
    ├── React.createElement(SOWPDF, { content })
    ├── renderToBuffer() → @react-pdf/renderer
    └── Stream as application/pdf with Content-Disposition: attachment
```

Template: `components/sows/SOWPDF.tsx`
Layout: Watermark · Header · Solicitation Details · Issuing Agency · 5 numbered sections · Prepared By footer · Running page numbers

The deprecated Python pipeline (`lib/python/sow_generator_pdf.py`, `api/python/generate_sow.py`) is no longer called.

## AI Integration (OpenAI)

`lib/openai.ts` — singleton + two exported functions:

| Function | Model | Purpose |
|----------|-------|---------|
| `generateSOWSections(input)` | gpt-4o | Returns 6 SOW sections as structured JSON `{title, summary, bullets[], details}` |
| `generateOpportunitySynopsis(title, desc, agency, naics)` | gpt-4o-mini | 2–3 sentence plain-English summary of a solicitation |

SOW generation fallback: if OpenAI call fails, `app/api/sows/route.ts` falls back to the rule-based section builders that were in place before.

## Scope Overview Panel

`components/workspace/panels/ScopeOverviewPanel.tsx`

Parses opportunity data into 4 scannable sections using keyword extraction + parsed attachment structured content:

| Section | Icon | Data Source |
|---------|------|-------------|
| Products | 📦 | `opportunity.title` + description keyword scan |
| Services | 🔧 | `parsedAttachments.structured.scope` filtered by action verbs |
| Documentation | 📄 | `parsedAttachments.structured.deliverables` as sortable table |
| Compliance | ⚖️ | `parsedAttachments.structured.compliance` + FAR/MIL regex from description |

Features: pill tags with severity colors, critical item detection (amber border), expand/collapse cards, copy-to-clipboard, checkboxes for selection, collapsible sections, quick filter bar, team notes (local state).

## Parsed Attachment Caching

```
First SOW generation or manual "Parse" click
    │
    ▼
POST /api/opportunities/[id]/parse-attachments
  OR auto-triggered in POST /api/sows
    │
    ├── Download each PDF/DOCX from SAM.gov (via proxy)
    ├── Parse text content (pdf-parse / mammoth)
    ├── Extract structured sections (scope, deliverables, compliance, etc.)
    ├── Merge content from all attachments
    └── Cache in opportunity.parsedAttachments (JSON column)
          │
          └── Used by SOW generation, call checklist, synopsis
```

## Attachment Rename Data Flow

```
SAM.gov rawData
    │
    ├── extractAttachmentsFromRawData()
    │       Returns SamAttachment[] with id, name, url, size, type, postedDate
    │
    └── GET /api/opportunities/[id]/attachments
            │
            ├── Fetch AttachmentOverride[] for this opportunity
            │
            └── Merge → RichAttachment[]
                  { id, originalName, currentName, isEdited,
                    url, type, size, postedDate, editedAt, editedBy }
                        │
                        ├── OpportunitySummaryPanel → AttachmentRow UI
                        │     • Shows currentName prominently
                        │     • Shows originalName when isEdited === true
                        │     • Pencil icon → inline rename input
                        │     • "edited" amber badge with tooltip
                        │
                        └── EmailDraftPanel
                              • Checkbox per attachment (currentName label)
                              • Select All / Deselect All
                              • "X of Y selected" counter

Rename flow (PATCH):
  User edits name in AttachmentRow
      │
      └── PATCH /api/opportunities/[id]/attachments/[attachmentId]
              { currentName: "new-name.pdf" }
              │
              ├── Validate (non-empty, no bad chars, extension unchanged, no dupe)
              ├── Upsert AttachmentOverride
              └── Append AttachmentEditHistory entry
                      { previousName, newName, editedById, editedAt }
```
