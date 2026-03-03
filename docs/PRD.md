# USHER — Product Requirements Document

**Version:** 1.2
**Last Updated:** 2026-03-02
**Status:** Living document — update after each phase completion

---

## 0. Development Workflow (Follow This Every Phase)

```
Step 1 ✅  BRAIN DUMP → Research → PRD          ← YOU ARE HERE (PRD done)
Step 2 🔄  CREATE RULES → Update CLAUDE.md       ← DO THIS NEXT
              + on-demand context docs
Step 3 📋  FOR EACH PHASE (4.1 → 4.2 → 4.3...):
              a. /prime        Orient new session
              b. /plan-feature Build structured plan → docs/plans/<phase>.md
              c. Env vars      Confirm required env vars exist (parallel)
              d. /execute      Run plan file only — no extra context
              e. Validate      Manual QA in browser
              f. /commit       Standard message with [PHASE-X] tag
Step 4 📋  Regression testing after each phase
Step 5 📋  On issues: evolve AI layer, add failing test, re-execute
```

**Current status:** Step 1 complete. Step 2 is next — update `CLAUDE.md` with data sourcing rules, then start Phase 4.1.

---

## 1. Product Overview

**USHER** is a federal government bid management platform built for contractors pursuing SAM.gov opportunities. It consolidates the entire bid lifecycle — from opportunity discovery through proposal submission — into a single workspace.

### Problem Statement

Federal contractors lose bids not because they lack capability, but because the administrative overhead of managing solicitations is too high. Tracking deadlines, generating Statements of Work, coordinating subcontractors, and assembling bid packages across disconnected tools wastes time and introduces errors.

### Solution

USHER provides a unified workspace per opportunity that guides users through a structured workflow: discover → assess → scope → generate SOW → find subs → get quotes → assemble bid → submit.

### Target Users

| Persona | Role | Key Needs |
|---------|------|-----------|
| Bid Manager | Owns opportunity pipeline | Track status, prioritize by margin, meet deadlines |
| Proposal Writer | Generates SOWs and bid documents | AI-assisted content, PDF export, version control |
| Subcontract Coordinator | Manages vendor relationships | Call tracking, SOW delivery, quote collection |
| Executive / Principal | Go/no-go decisions | Margin analysis, pipeline overview, win rate |

---

## 2. Core Principles

- **One workspace per opportunity** — all data, documents, and actions live in a single view
- **AI-assisted, human-controlled** — AI generates content, humans edit and approve
- **Progress-gated workflow** — the system guides users to the next action; nothing is a dead end
- **Stone palette only** — consistent, professional UI using Tailwind `stone-*` exclusively

### Data Sourcing Rules (Non-Negotiable)

> **No mock data. Ever.**

| Situation | Rule |
|-----------|------|
| Opportunity has historical awards | Pull from USASpending API (`lib/usaspending.ts`) by NAICS + agency. Display real award amounts, contractor names, dates. |
| No historical data for this exact opportunity | Search USASpending by NAICS code broadly (same trade, any agency). Tag results: `Source: USASpending.gov — NAICS 238210 comparables` |
| No USASpending data at all | Search industry data sources (BLS wage data, RSMeans if accessible, GSA rate cards). Tag prominently: `Source: [BLS / GSA Schedule / Industry avg]` |
| Absolutely no external data | Show "Insufficient data to estimate" — never invent a number. Prompt user to enter a manual estimate. |

All displayed estimates must show:
- The source (USASpending award ID, BLS table, etc.)
- The date of the source data
- A confidence indicator: `High` (direct match) / `Medium` (NAICS comparable) / `Low` (industry benchmark)

---

## 3. Feature Inventory

### 3.1 Opportunity Management ✅ Complete

**What it does:** Connects to SAM.gov to surface, import, and track federal solicitations.

**Features built:**
- Fetch opportunities from SAM.gov Opportunities API by keyword, NAICS, agency, or set-aside type
- Store full raw SAM.gov response (`rawData` JSON column) for downstream extraction
- Display opportunity cards with title, agency, NAICS code, deadline, and set-aside type
- `DeadlineIndicator` component with urgency color coding (red < 3 days, amber < 7 days)
- Opportunity detail page with tabbed workspace
- Status tracking: ACTIVE / EXPIRED / AWARDED / CANCELLED
- Advanced filtering: margin range, status, NAICS, deadline window, set-aside type

**Key files:**
- `lib/samgov.ts` — SAM.gov Opportunities API + Entity Management API integration
- `app/api/opportunities/` — List, fetch, update routes
- `app/api/opportunities/fetch/route.ts` — Import from SAM.gov
- `components/opportunities/OpportunityCard.tsx` — Card component with deadline indicator

---

### 3.2 Opportunity Workspace ✅ Complete

**What it does:** The core UI — a single page that houses all panels for a given opportunity.

**Architecture:** Parent-as-state-hub pattern. `app/opportunities/[id]/page.tsx` owns all state and passes typed props to panels. Panels never fetch their own primary data.

**Panels:**

| Panel | Route Key | Purpose |
|-------|-----------|---------|
| Summary | `summary` | Attachment viewer, parsed content, opportunity metadata |
| Scope | `scope` | Products / Services / Documentation / Compliance overview |
| SOW | `sow` | SOW editor with section-by-section editing and plain language view |
| Subcontractors | `subcontractors` | Vendor discovery, call workflow, quote tracking |
| Bid Editor | `bid` | Pricing assembly, margin calculator |
| Email | `email` | Email composer with templates and attachment selection |

**Key files:**
- `app/opportunities/[id]/page.tsx` — Parent state hub
- `components/workspace/WorkspaceLayout.tsx` — Shell with sidebar + progress bar
- `components/workspace/panels/` — All panel components

---

### 3.3 Solicitation Attachment Handling ✅ Complete

**What it does:** Downloads, parses, displays, and allows renaming of SAM.gov solicitation attachments (RFPs, SOWs, amendments, etc.).

**Features built:**
- Server-side proxy for SAM.gov attachment downloads (avoids CORS + S3 redirect issues)
- Fullscreen inline viewer with iframe modal (PDF and DOCX)
- Parse all attachments into structured JSON: scope, deliverables, compliance, FAR references
- Parsed content cached in `opportunity.parsedAttachments` (no re-parse on reload)
- **Dual filename tracking:** `AttachmentOverride` stores original SAM.gov name + user-editable working name
- Inline rename UI with extension lock, duplicate validation, Escape-to-cancel
- "edited" amber badge with tooltip showing renamer + timestamp
- Append-only `AttachmentEditHistory` log
- `RichAttachment` shared type across all panels

**Key files:**
- `lib/attachment-parser.ts` — PDF/DOCX download and structured extraction
- `app/api/opportunities/[id]/attachments/` — List, rename, proxy routes
- `lib/types/attachment.ts` — `RichAttachment` interface

---

### 3.4 Opportunity Assessment ✅ Complete

**What it does:** Go/no-go decision support with margin analysis before committing to a bid.

**Features built:**
- Assessment form: estimated value, estimated cost, profit margin ($ and %)
- Color-coded margin display: green > 20%, amber 10–20%, red < 10%
- Strategic value rating (HIGH / MEDIUM / LOW)
- Risk level rating (HIGH / MEDIUM / LOW)
- Recommendation field: GO / NO_GO / REVIEW
- AI auto-generate assessment from solicitation data
- Assessment gate: displayed before SOW creation to encourage pre-qualification

**Key files:**
- `app/api/opportunities/[id]/assessment/` — GET/POST assessment
- `components/assessment/MarginCalculator.tsx`

---

### 3.5 Progress Tracking ✅ Complete

**What it does:** Visual pipeline tracker per opportunity from discovery to submission.

**Stages:** DISCOVERY → ASSESSMENT → SOW_CREATION → SOW_REVIEW → BID_ASSEMBLY → READY → SUBMITTED

**Features built:**
- `OpportunityProgress` DB model with stage, completion %, blockers, next actions
- Progress bar in `WorkspaceLayout` sidebar showing current stage
- `StageIndicator` and `NextActionCard` components
- `WIPProgressTracker` main component
- Stage auto-advance on key actions (SOW generated → SOW_CREATION, etc.)

**Key files:**
- `app/api/opportunities/[id]/progress/` — GET/PUT progress
- `components/progress/` — StageIndicator, NextActionCard, WIPProgressTracker

---

### 3.6 SOW Generation & Management ✅ Complete

**What it does:** AI-powered Statement of Work generation with structured editing, versioning, and approval workflow.

**Generation flow:**
1. Parse solicitation attachments (PDF/DOCX) → structured content
2. OpenAI GPT-4o generates sections 1–6 from parsed content
3. Rule-based builders append sections 7+ (attachments list, FAR, evaluation, qualifications)
4. Falls back to full rule-based if OpenAI fails
5. Structured JSON stored in `SOW.content`

**SOW content structure:**
```
sections[]:
  id, title, summary (italic overview), bullets[] (key points), details (full text), content (legacy fallback)
```

**Features built:**
- One-click SOW generation from solicitation context
- Section-by-section editor in `SOWPanel`
- Plain language view — AI-transforms legal language to plain English (default view)
- Section editor with structured title / summary / bullets / details fields
- PDF export — server-side `@react-pdf/renderer`, streamed on demand (no file storage)
- Version history with diff support
- Approval workflow: assign approver → approve/reject → accepted
- SOW send to vendor via email
- `SOWCard`, `SOWStatusBadge`, `SOWViewer` components

**Key files:**
- `lib/openai.ts` — `generateSOWSections()`, `generateOpportunitySynopsis()`
- `lib/sow-utils.ts` — Rule-based section builders
- `app/api/sows/` — Full SOW CRUD + workflow routes
- `app/api/sows/[id]/download/route.ts` — PDF streaming
- `components/sows/SOWPDF.tsx` — react-pdf template
- `components/workspace/panels/SOWPanel.tsx` — Editor UI

---

### 3.7 Scope Overview Panel ✅ Complete

**What it does:** Parses opportunity data into 4 scannable sections to quickly understand what a bid requires.

**Sections:**

| Section | Data Source |
|---------|-------------|
| Products | `opportunity.title` + description keyword scan |
| Services | `parsedAttachments.structured.scope` filtered by action verbs |
| Documentation | `parsedAttachments.structured.deliverables` as sortable table |
| Compliance | `parsedAttachments.structured.compliance` + FAR/MIL regex |

**Features built:**
- Pill tags with severity color coding
- Critical item detection (amber border)
- Expand/collapse cards
- Copy-to-clipboard per section
- Checkboxes for item selection
- Quick filter bar (text search across all sections)
- Team notes (local state, per session)

**Key files:**
- `components/workspace/panels/ScopeOverviewPanel.tsx`

---

### 3.8 Subcontractor Management ✅ Complete

**What it does:** Discovers, tracks, and coordinates subcontractors and vendors throughout the bid workflow.

**Discovery sources:**
- SAM.gov Entity Management API — registered vendors by NAICS/capability
- Google Places API — local businesses by trade keyword + location
- Results geo-filtered to match opportunity's place of performance state

**Workflow states:**

| State | Description | UI |
|-------|-------------|-----|
| Active | Not yet called | White card, call checklist visible |
| Pending | Called, awaiting response | Stone-50 card, "✓ Called" badge |

**Features built:**
- Auto-discover by NAICS code + place of performance
- Deduplication merge (same vendor from multiple sources)
- Call checklist per vendor
- "Mark Call Complete" → moves to pending
- Quote tracking (`quotedAmount`, `isActualQuote`)
- SAM.gov verification badge (registered entities)
- "Send SOW" → switches to Email panel with SOW delivery template
- "Request Quote" → switches to Email panel with quote request template
- Unverified vendor flagging script

**Key files:**
- `lib/google-places.ts`, `lib/samgov.ts` (entity search)
- `app/api/opportunities/[id]/subcontractors/` — CRUD + discover + deduplicate
- `components/workspace/panels/SubcontractorPanel.tsx`

---

### 3.9 Bid Assembly ✅ Complete

**What it does:** Assembles the final bid package with pricing, margins, and document generation.

**Features built:**
- Bid creation linked to opportunity
- Pricing table with line items, unit costs, quantities
- Margin calculator overlaid on bid
- Historical pricing data from USASpending API (comparable past awards by NAICS)
- Bid document generation
- Bid status tracking: DRAFT / SUBMITTED / AWARDED / LOST

**Key files:**
- `app/api/bids/` — List, create, update
- `app/api/bids/[id]/` — Detail, document generation
- `components/workspace/panels/BidEditorPanel.tsx`
- `components/bids/`
- `lib/usaspending.ts`

---

### 3.10 Email Composer ✅ Complete

**What it does:** Sends templated emails to vendors and government contacts with attachment selection.

**Templates:**
- SOW delivery (to subcontractor)
- Quote request (to subcontractor)
- General inquiry

**Features built:**
- Template auto-population from opportunity + vendor context
- Attachment checkbox list with `currentName` display (respects renames)
- Select All / Deselect All
- "X of Y selected" counter
- SOW checkbox locked on (always included in SOW delivery)
- `emailSelectedAttachments` state survives panel switching (lives in parent)
- Nodemailer integration for actual send

**Key files:**
- `lib/email.ts`
- `components/workspace/panels/EmailDraftPanel.tsx`

---

### 3.11 Vendor CRM ✅ Complete

**What it does:** Long-term vendor relationship management across opportunities (unlike `Subcontractor`, which is per-opportunity).

**Features built:**
- Vendor list with search
- Vendor detail page
- Communication log (`VendorCommunication`) — notes, calls, emails
- Cross-opportunity vendor history

**Key files:**
- `app/api/vendors/` — List, create, update
- `app/vendors/` — Vendor pages

---

### 3.12 Navigation & Layout ✅ Complete

**What it does:** App-wide navigation and breadcrumb system.

**Features built:**
- Top navigation bar: Dashboard, Opportunities, SOWs, Bids, Reports, Admin
- Dropdown menus per section
- Breadcrumb component
- `AppLayout` wrapper used by all pages

**Key files:**
- `components/layout/Navigation.tsx`
- `components/layout/Breadcrumbs.tsx`
- `app/layout.tsx`

---

### 3.13 Reports ✅ Scaffolded / 🔄 Needs Enhancement

**What it does:** Analytics and reporting across the opportunity pipeline.

**Built:**
- `/app/reports/` page exists
- API routes: `/api/reports/margins`, `/api/reports/pipeline`, `/api/reports/win-rate`

**Needs enhancement:**
- Pipeline funnel visualization (count by stage, conversion rates)
- Financial summary (total potential value, average margin %)
- Win rate chart (submitted vs awarded, historical trend, by contract type)
- Margin analysis table (top opportunities by margin)

---

### 3.14 Admin Panel ✅ Complete

**What it does:** User management, system logs, and data maintenance tools.

**Features built:**
- User list, role management (USER / ADMIN / VIEWER)
- System log viewer
- Backfill SOWs button (migrates legacy plain-text SOWs to structured content)
- Settings

**Key files:**
- `app/admin/`
- `app/api/admin/`

---

### 3.15 Authentication ✅ Complete

**What it does:** Secure multi-provider auth.

**Features built:**
- NextAuth v5 (beta), JWT strategy
- Credentials provider (email + bcrypt password)
- Google OAuth provider
- User registration
- Role-based access (ADMIN gates for admin routes)
- Custom login page (`/login`)

**Key files:**
- `lib/auth.ts`
- `app/api/auth/register/`
- `app/(auth)/login/`

---

### 3.16 MCP Servers ✅ Complete

**What it does:** AI development tools for in-session database queries and SAM.gov lookups.

**Servers configured:**
- **Prisma DB MCP** — read-only Prisma queries against live DB (findMany, findFirst, count, aggregate, groupBy)
- **SAM.gov MCP** — direct opportunity and entity lookups

**Key files:**
- `mcp-servers/`
- `.mcp.json`

---

### 3.17 Agentic Development Framework ✅ Complete

**What it does:** Slash commands and on-demand context files to accelerate AI-assisted development.

**Commands:**
- `/prime` — Session startup: reads context files, checks types, outputs prime report
- `/plan-feature` — Designs implementation plan for a feature
- `/execute` — Executes a plan file step by step
- `/commit` — Structured commit with phase tagging

**On-demand docs:**
- `docs/api-endpoints.md`
- `docs/database-schema.md`
- `docs/frontend-components.md`

**Key files:**
- `.claude/commands/`
- `docs/`

---

## 3.18 Design Decisions Log (from Research Q&A — 2026-03-02)

All decisions below were confirmed before any code is written. Reference these in every `/plan-feature` session.

| # | Decision | Answer |
|---|----------|--------|
| 1 | SOW editor style | Click-to-edit — always-editable textareas styled as a document (Google Docs style). No click-to-activate button. Sections always show as styled textareas. |
| 2 | SOW default view | Plain language (AI-simplified) by default. "Edit Sections" switches to PDF-style edit view. |
| 3 | SOW auto-save | Auto-save on blur (click away). Brief "Saved ✓" flash. No save button. |
| 4 | Opportunity Brief placement | Top of Summary tab (replaces current default view). Attachments and details move below. |
| 5 | Brief generation | GPT-4o from `parsedAttachments` + `rawData`. Cached to new `opportunity.opportunityBrief` JSON field. |
| 6 | Brief required sections | (1) What they're buying — plain English, (2) Place of performance — city/state/on-site vs remote, (3) Who qualifies — licenses/clearances/set-aside/certs, (4) Key deliverables + period of performance |
| 7 | Brief "Heads Up" triggers | All four: bonding/insurance >$100K, security clearance (Secret/TS/DD-254), set-aside eligibility (SDVOSB/8a/WOSB/HUBZone), unusual timelines (<30 days) or mandatory on-site |
| 8 | Vendor search keywords | Internal only — derived from NAICS + brief content, used silently for Google Places queries. Not shown to user. |
| 9 | Scope Overview redesign | Full replace — remove pill/card layout entirely. New: prose + numbered deliverables table + interactive compliance checklist + "Heads Up" section. |
| 10 | Compliance checklist persistence | Save per user per opportunity to DB. Field: `opportunityProgress.complianceChecks` JSON `{ userId, checks: { [item]: { checked, checkedAt, checkedBy } } }` |
| 11 | Vendor radius | Configurable radius. Default 50mi from place-of-performance city. Dropdown: 25/50/100/250mi. Shows "Searching within 50mi of [City, STATE]". |
| 12 | Vendor no-results behavior | Auto-expand in steps: 50mi → 100mi → 250mi → statewide. UI shows each expansion as it happens. |
| 13 | Form detection method | Filename pattern matching + first-page text. Forms: SF-1449, SF-33, DD-254, DD-1155, OF-347, wage determinations. Badge: `FORM`. |
| 14 | Form editing UI | Inline field overlay on PDF viewer. Detected field zones highlighted. User types into overlay. Field values saved as JSON. |
| 15 | Attachment AI-suggested names | Show as pending rename with confidence indicator. "Use suggestion" button. User confirms before applying. |
| 16 | Price fallback (no mock data) | Remove hardcoded NAICS fallback table entirely. Show "Insufficient data" state with option to broaden search or enter manual estimate. |
| 17 | Historical contracts in Bid panel | Show comparable awards table: recipient, agency, amount, year. Sourced from `bid.historicalData`, tagged "Source: USASpending.gov". |
| 18 | USASpending refresh | On-demand only. "Refresh Pricing Data" button in Bid panel. Shows last-fetched timestamp. |
| 19 | Team notes (Scope panel) | Persist to DB per opportunity. Field: `opportunityProgress.teamNotes` JSON array `[{ author, text, createdAt }]`. |

---

## 4. Next Phases

### 4.1 Opportunity Brief — "Know Before You Search" 📋

**Problem:** The workspace displays organized data but doesn't help the user *understand* an opportunity well enough to take action. Users need to be briefed — not just shown data. A user who doesn't understand what the government is actually buying cannot effectively search for a qualified vendor.

**Goal:** Replace the current data-dump experience with a concise, narrative-style opportunity brief that answers the questions a bid manager actually asks before picking up the phone.

**Questions the brief must answer:**
- What is the government actually buying? (plain-language summary)
- Who is the end user / beneficiary?
- What skills or trades are required from a subcontractor?
- What is the place of performance — city, state, site type (office, field, remote)?
- What is the period of performance and are there option years?
- What are the key deliverables (in plain language, not legalese)?
- What certifications, clearances, or set-asides apply?
- Are there any unusual requirements (specialized equipment, bonding, travel)?
- What is the estimated value and contract type?

**Design:**

```
┌─ Opportunity Brief ─────────────────────────────────────────────┐
│  🏛  USACE – Louisville District                                  │
│  Electrical Systems Maintenance, Fort Knox, KY                   │
│                                                                   │
│  WHAT THEY'RE BUYING                                              │
│  The Army needs a licensed electrical contractor to perform       │
│  preventive maintenance and emergency repair on ~200 buildings    │
│  at Fort Knox over a 1-year base period (+ 4 option years).      │
│                                                                   │
│  WHERE                     WHO QUALIFIES                         │
│  Fort Knox, KY             Licensed electrician (KY)             │
│  On-site required          Secret clearance preferred            │
│                            SDVOSB set-aside                      │
│                                                                   │
│  KEY DELIVERABLES          PERIOD                                │
│  • Monthly PM reports      Base: Oct 2026 – Sep 2027            │
│  • 4hr emergency response  Options: 4 × 1-year                  │
│  • Annual system audit                                           │
│                                                                   │
│  VALUE: ~$2.4M / year      TYPE: FFP     NAICS: 238210          │
│                                                                   │
│  ⚠ HEADS UP                                                      │
│  Requires DD Form 254 (Security clearance requirements)          │
│  Bonding required ($500K performance bond)                       │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation notes:**
- GPT-4o generates the brief from `parsedAttachments` + `opportunity.rawData` + `opportunity.description`
- Brief is cached in a new `opportunityBrief` field (JSON) on the `Opportunity` model
- Displayed as the first thing seen in the workspace — above or replacing the current summary tab default view
- Plain language always — no FAR clause numbers, no acronym soup
- "Heads up" section surfaces gotchas: unusual requirements, missing info, forms needed

---

### 4.2 SOW Editor — PDF-Style Editable Layout 📋

**Problem:** The current SOW editor shows sections as form fields. Users want to see exactly what the final document will look like while they edit — a WYSIWYG experience that mirrors the PDF output.

**Goal:** The SOW panel should look and feel like the actual PDF document — complete with page layout, header, section numbering, and typography — but every section is click-to-edit in place.

**Design:**

```
┌─ SOW Document ──────────────────────────────────────────────────┐
│                                                                   │
│  ████████████████████████████████████████  ← USHER watermark    │
│                                                                   │
│  STATEMENT OF WORK                                               │
│  Electrical Systems Maintenance — Fort Knox, KY                  │
│  Solicitation No. W912QR-26-R-0042                               │
│  USACE Louisville District                                       │
│                                                                   │
│  ─────────────────────────────────────────────────────          │
│                                                                   │
│  1. BACKGROUND                                          [edit]   │
│  ┌─────────────────────────────────────────────────┐            │
│  │ The U.S. Army Corps of Engineers, Louisville    │            │
│  │ District, requires preventive maintenance...    │  ← click   │
│  └─────────────────────────────────────────────────┘    to edit │
│                                                                   │
│  2. SCOPE OF WORK                                       [edit]   │
│  ┌─────────────────────────────────────────────────┐            │
│  │ The contractor shall provide all labor,         │            │
│  │ equipment, and materials to...                  │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
│  [↓ Download PDF]  [✉ Send to Vendor]  [✓ Mark Approved]        │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Document-style layout: white card on stone-50 background, shadow, realistic page proportions
- Section headers numbered (1, 2, 3...) with title, same as PDF output
- Click any section body → inline rich text editor (or simple textarea) activates in place
- Editing toolbar appears on focus (bold, italic, bullet list minimum)
- Auto-save on blur
- "Download PDF" always available — renders the current saved state
- Match PDF typography as closely as possible (font sizes, spacing, header hierarchy)

---

### 4.3 Attachment Management — Names & Form Detection 📋

**Problem:**
1. Attachment names from SAM.gov are often cryptic codes (`W912QR26R0042_0001.pdf`). Users need to see what a file actually is.
2. Some attachments are government forms (SF-1449, SF-33, DD-1155, etc.) that require the contractor to fill them out. These need to be identified and made available for editing — the same way the SOW is.

**Goal:** Every attachment is clearly labeled. Form attachments are flagged and made fillable.

**Requirements — Naming:**
- On parse, AI infers a human-readable name for each attachment if the SAM.gov name is cryptic (e.g., `W912QR26R0042_0001.pdf` → `Solicitation Cover Sheet (SF-1449)`)
- Show AI-suggested name by default; user can override (existing rename flow)
- Original SAM.gov name always visible as secondary label (existing `originalName` field)
- Confidence indicator: if AI is uncertain about a file's purpose, show a `?` badge prompting user review

**Requirements — Form Detection:**
- On parse, detect standard government forms by content pattern:
  - SF-1449 (Solicitation/Contract/Order)
  - SF-33 (Solicitation for Bids)
  - SF-26 (Award/Contract)
  - DD-1155 (Order for Supplies or Services)
  - DD-254 (Security Requirement)
  - OF-347 (Order for Supplies or Services)
- Flag detected forms with a `FORM` badge in the attachment list
- "Fill Form" button appears on form attachments — opens an inline editor panel (similar to SOW editor)
- Form editor shows fields extracted from the PDF overlaid on a document-style layout
- Filled form values saved to DB; editable at any time
- Filled forms can be downloaded as PDF or included in email attachments

**Data model additions:**
```prisma
model AttachmentFormData {
  id            String   @id @default(cuid())
  opportunityId String
  attachmentId  String   // SAM.gov attachment ID
  formType      String?  // "SF-1449", "DD-254", etc.
  isForm        Boolean  @default(false)
  aiSuggestedName String?
  fields        Json?    // extracted + filled field values
  filledAt      DateTime?
  filledById    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

### 4.4 Vendor Search — Geo-Localized to Place of Performance 📋

**Status:** Partially implemented (state-level geo-filter on SAM.gov + Google Places results). Needs tightening and surfacing to the user.

**Problem:** Vendors returned by search may be registered nationally but have no local presence near the work site. A Fort Knox contract should surface Louisville-area electricians, not a national firm headquartered in Virginia.

**Goal:** Vendor search is always anchored to the opportunity's place of performance — city and state minimum. Search radius is configurable. The UI makes the search geography explicit so the user knows exactly what area was searched.

**Requirements:**
- Extract `city`, `state`, `zip`, `country` from `opportunity.rawData.placeOfPerformance` on load
- Pass full place of performance (city + state, or lat/lng if available) to both SAM.gov entity search and Google Places search
- Display the search geography prominently above vendor results: `Searching within 50 miles of Fort Knox, KY`
- Allow user to adjust radius (25 / 50 / 100 / 250 miles) and re-run search
- Post-filter: drop any returned vendor whose address does not match state (existing logic) OR falls outside the radius (enhancement)
- "No local vendors found" state with option to expand radius or search nationally

---

### 4.5 Scope Overview — Reader-Friendly Redesign 📋

**Problem:** The current Scope Overview panel displays pill tags, collapsible cards, and filter bars — technically functional but cognitively dense. It reads like a data dump, not a briefing.

**Goal:** Redesign the Scope Overview to read like a well-formatted briefing document — scannable, prioritized, and structured so a user can absorb it in 2 minutes and know exactly what the job entails.

**Design principles:**
- Lead with the most important information (what, where, who)
- Use clear section headings with icons — not just pill clouds
- Surface critical items (clearance, bonding, unusual requirements) at the top, not buried
- Use prose + bullets, not tag clouds
- Compliance items rendered as a checklist, not pills
- Deliverables shown as a numbered list with due-date column, not a card grid

**Proposed layout:**

```
SCOPE OVERVIEW — Electrical Maintenance, Fort Knox

  📍 PLACE OF PERFORMANCE
     Fort Knox, KY (Hardin County) — on-site required

  🔧 WHAT'S REQUIRED
     • Preventive maintenance on electrical systems across ~200 buildings
     • Emergency response within 4 hours of call
     • Annual system-wide audit and report

  📦 KEY DELIVERABLES
     #   Deliverable                  Due
     1   Monthly PM Report            Last day of each month
     2   4-hr Emergency Response      Per incident
     3   Annual Audit Report          Sept 30 each year

  ⚖️ COMPLIANCE
     ☐ FAR 52.228-5 — Insurance requirements
     ☐ FAR 52.222-6 — Davis-Bacon wage rates
     ☐ KY Electrical Contractor License (state-required)
     ☐ Performance Bond — $500K minimum
     ☐ Secret clearance preferred (not mandatory)

  ⚠️ HEADS UP
     • DD Form 254 required (security clearance documentation)
     • Bonding requirement may disqualify small subs
     • Set-aside: SDVOSB only
```

**Implementation notes:**
- Replace tag clouds with structured prose sections
- Use GPT-4o to produce the narrative "What's Required" summary instead of keyword extraction
- Compliance section renders as interactive checklist (check off as reviewed)
- "Heads Up" section auto-generated from anomalies detected in parsed content
- Team notes move to a persistent sidebar or drawer (saved to DB)

---

### 4.6 Reports Enhancement 📋

**Goal:** Build out the reports page with meaningful visualizations.

**Planned features:**
- Pipeline funnel chart — count by stage with conversion rates
- Financial summary — total contract value in pipeline, average margin %, top 5 by margin
- Win rate — submitted vs awarded, trended over time, breakdown by contract type
- Margin analysis table — sortable, filterable

---

### 4.7 Dashboard Widgets 📋

**Goal:** Homepage dashboard with high-level metrics at a glance.

**Planned widgets:**

| Widget | Description |
|--------|-------------|
| Pipeline Overview | Count by stage, visual funnel, conversion rate |
| Financial Summary | Total value, avg margin %, top opps |
| Upcoming Deadlines | Next 7 days, color-coded urgency, quick links |
| SOW Status | Pending approval count, recently generated, action required |
| Win Rate | Submitted vs awarded, trend sparkline |

---

## 5. Backlog

| Item | Priority | Notes |
|------|----------|-------|
| Saved filters per user | Medium | Store filter presets in DB per user |
| Persist team notes (Scope panel) | High | Move from local state to DB; part of 4.5 redesign |
| Mobile responsive layout | Low | Currently desktop-only |
| User onboarding flow | Low | First-run wizard for new users |
| Attachment fetch caching | Low | Cache parsed content longer; reduce re-parse |
| E2E test suite | Medium | `tests/e2e/` scaffolded, tests TBD |

---

## 6. Technical Architecture Summary

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router |
| Language | TypeScript 5.9 (strict) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5 beta (JWT, Credentials + Google) |
| AI | OpenAI GPT-4o (`generateSOWSections`) + gpt-4o-mini (`generateOpportunitySynopsis`) |
| PDF | @react-pdf/renderer v4 (server-side streaming) |
| Storage | Vercel Blob (SOW file URLs) |
| Email | Nodemailer |
| Styling | Tailwind CSS v4 (stone-* palette only) |
| Document parsing | pdf-parse (PDFs), mammoth (DOCX) |

### Key Architectural Patterns

- **Parent-as-state-hub** — workspace page owns all state, passes typed props to panels
- **Server-side proxy** — all SAM.gov attachment fetches go through `/api/.../proxy` to avoid CORS
- **Parsed attachment cache** — structured JSON cached in `opportunity.parsedAttachments` after first parse
- **On-demand PDF streaming** — SOW PDFs rendered at download time, not stored
- **Dual filename tracking** — `AttachmentOverride` preserves SAM.gov original name while allowing user renames

---

## 7. Data Model Summary

| Model | Purpose |
|-------|---------|
| `Opportunity` | Core entity. Links to SAM.gov via `solicitationNumber`. Stores `rawData` + `parsedAttachments` |
| `Subcontractor` | Per-opportunity vendor with call workflow and quote tracking |
| `SOW` | Statement of Work with versioning, approval workflow, structured content JSON |
| `Bid` | Pricing and bid package with historical data from USASpending |
| `OpportunityProgress` | Stage tracking (DISCOVERY → SUBMITTED) with blockers and next actions |
| `OpportunityAssessment` | Go/no-go with margin analysis, risk, and recommendation |
| `Vendor` | Cross-opportunity CRM vendor record |
| `VendorCommunication` | Communication log per CRM vendor |
| `AttachmentOverride` | User rename record (originalName → currentName) per attachment per opportunity |
| `AttachmentEditHistory` | Append-only rename history log |

---

## 8. Environment Variables

```
DATABASE_URL                    # PostgreSQL connection string
NEXTAUTH_SECRET                 # NextAuth JWT secret
NEXTAUTH_URL                    # App URL
SAM_GOV_API_KEY                 # SAM.gov Opportunities API key
SAM_GOV_ENTITY_API_KEY          # SAM.gov Entity Management (FOUO)
GOOGLE_PLACES_API_KEY           # Google Places vendor discovery
GOOGLE_CLIENT_ID                # Google OAuth
GOOGLE_CLIENT_SECRET            # Google OAuth
BLOB_READ_WRITE_TOKEN           # Vercel Blob storage
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  # Email
OPENAI_API_KEY                  # OpenAI GPT-4o
```

---

## 9. Success Metrics

| Metric | Status |
|--------|--------|
| 100% of SOWs have structured content (backfill complete) | ✅ |
| Progress tracked for all opportunities | ✅ |
| Margin assessment before SOW creation | ✅ |
| Advanced filtering reduces search time | ✅ |
| Navigation accessible in < 2 clicks | ✅ |
| SOW PDF download works server-side | ✅ |
| Subcontractor discovery geo-localized to place of performance | ✅ |
| Dashboard loads key metrics in < 1 second | 📋 Pending dashboard build |
| Reports show pipeline + margin + win-rate | 🔄 In progress |

---

## 10. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-02 | 1.0 | Initial PRD — documents all phases 1–6 as-built; captures in-progress reports + dashboard |
| 2026-03-02 | 1.1 | Added next phases: Opportunity Brief (4.1), SOW PDF-style editor (4.2), Attachment form detection (4.3), Vendor geo-localization (4.4), Scope Overview redesign (4.5) |
| 2026-03-02 | 1.2 | Added 19-decision design log (§3.18) from research + Q&A session. All decisions confirmed before build. |

---

*Update this document after each major feature completion. Add a changelog entry and update the feature status (✅ / 🔄 / 📋).*
