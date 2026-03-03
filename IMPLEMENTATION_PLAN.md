# USHER Platform Enhancement Plan

## Overview
Transform USHER into a complete bid management platform with progress tracking, profit analysis, enhanced content, and advanced filtering.

---

## Phase 1: Backfill Old SOWs (Quick Win)
**Goal**: Update existing SOWs with structured content

### Tasks:
1. Add "Backfill SOWs" button to admin dashboard
2. Show progress indicator during backfill
3. Display success/error summary

**Estimated Impact**: All SOWs become editable and viewable consistently

---

## Phase 2: WIP Progress Monitor
**Goal**: Visual pipeline from opportunity → SOW → bid-ready package

### Design:
```
[Opportunity] → [SOW Draft] → [SOW Approved] → [Bid Package] → [Submitted]
     ↓              ↓              ↓                 ↓             ↓
   Active      In Review      Ready to Send      Assembled      Done
```

### Features:
- **Progress bar** showing completion percentage
- **Status badges** at each stage with colors
- **Timeline view** with dates
- **Blockers** highlighted in red
- **Next actions** prominently displayed

### Components:
- `WIPProgressTracker.tsx` - Main progress component
- `StageIndicator.tsx` - Individual stage display
- `NextActionCard.tsx` - Action items

### Database:
```prisma
model OpportunityProgress {
  id              String   @id @default(cuid())
  opportunityId   String   @unique
  currentStage    Stage    @default(DISCOVERY)
  completionPct   Int      @default(0)
  blockers        Json?
  nextActions     Json?
  lastUpdated     DateTime @updatedAt

  opportunity     Opportunity @relation(...)
}

enum Stage {
  DISCOVERY       // Opportunity identified
  ASSESSMENT      // Margin analysis in progress
  SOW_CREATION    // Generating SOW
  SOW_REVIEW      // Awaiting approval
  BID_ASSEMBLY    // Creating bid package
  READY           // Ready to submit
  SUBMITTED       // Submitted to gov
}
```

### UI Locations:
1. Dashboard - Summary widget
2. Opportunity detail page - Full tracker
3. Dedicated "Pipeline" page - All opportunities view

---

## Phase 3: Margin-Based Assessment
**Goal**: Calculate and display profit margins for filtering/prioritization

### Calculations:
- **Contract Value** - From SAM.gov (estimated or stated)
- **Cost Estimate** - AI-generated or manual input
- **Profit Margin ($)** = Contract Value - Cost
- **Profit Margin (%)** = (Profit / Contract Value) × 100

### Features:
- **Margin calculator** on opportunity detail page
- **Quick estimate** using historical data + AI
- **Color coding**:
  - Green: >20% margin
  - Yellow: 10-20% margin
  - Red: <10% margin
- **Assessment gate**: Must calculate margin before creating SOW

### Database:
```prisma
model OpportunityAssessment {
  id                  String   @id @default(cuid())
  opportunityId       String   @unique

  // Financial
  estimatedValue      Float?
  estimatedCost       Float?
  profitMarginDollar  Float?
  profitMarginPercent Float?

  // Qualification
  meetsMarginTarget   Boolean  @default(false)
  strategicValue      String?  // HIGH, MEDIUM, LOW
  riskLevel           String?  // HIGH, MEDIUM, LOW

  // Decision
  assessedAt          DateTime @default(now())
  assessedById        String
  recommendation      String?  // GO, NO_GO, REVIEW
  notes               String?  @db.Text

  opportunity         Opportunity @relation(...)
  assessedBy          User        @relation(...)
}
```

### UI:
- Assessment form modal
- Quick assessment widget on opportunity card
- Filter by margin range in opportunity list

---

## Phase 4: Enhanced SOW Content
**Goal**: Pull comprehensive details from SAM.gov data into SOW

### Current SOW Sections (Basic):
1. Background & Introduction
2. Scope of Services
3. Period of Performance
4. Deliverables

### Enhanced SOW Sections:
1. **Background & Introduction**
   - Agency background
   - Contract history
   - Program objectives

2. **Scope of Services Required**
   - Detailed task breakdown from solicitation
   - Technical requirements
   - Performance standards
   - Quality metrics

3. **Period of Performance**
   - Base period + option years
   - Key milestones from solicitation
   - Reporting schedule

4. **Deliverables**
   - Specific deliverables from RFP
   - Acceptance criteria
   - Delivery schedule
   - Format requirements

5. **Personnel Requirements** (NEW)
   - Skill sets required
   - Certifications needed
   - Security clearances

6. **Place of Performance** (NEW)
   - Location details
   - Travel requirements
   - Remote work provisions

7. **Contract Type & Terms** (NEW)
   - Contract type (FFP, T&M, etc.)
   - Payment terms
   - NAICS code implications

8. **Compliance & Regulations** (NEW)
   - FAR clauses applicable
   - Agency-specific requirements
   - Security requirements

### Data Extraction:
```typescript
// Extract from opportunity.rawData (SAM.gov response)
function extractEnhancedSOWData(opportunity: Opportunity) {
  const raw = opportunity.rawData

  return {
    background: raw.description,
    tasks: raw.performanceRequirements,
    milestones: raw.keyDates,
    deliverables: raw.deliverables,
    personnel: raw.laborRequirements,
    location: raw.placeOfPerformance,
    contractType: raw.type,
    regulations: raw.farClauses,
    // ... more fields
  }
}
```

---

## Phase 5: Navigation Menu
**Goal**: Easy navigation throughout the app

### Top Navigation Bar:
```
[USHER Logo] [Dashboard] [Opportunities ▾] [SOWs ▾] [Bids ▾] [Reports ▾] [Admin ▾] [Profile]
```

### Dropdown Menus:

**Opportunities**:
- All Opportunities
- Active Opportunities
- Assessed Opportunities
- Archived

**SOWs**:
- All SOWs
- Pending Approval
- Approved
- Sent to Subcontractors

**Bids**:
- All Bids
- In Progress
- Submitted
- Awarded

**Reports**:
- Pipeline Report
- Margin Analysis
- Win Rate
- Performance Metrics

**Admin** (ADMIN only):
- User Management
- Settings
- Backfill Data
- System Logs

### Breadcrumbs:
```
Dashboard > Opportunities > [Opp Title] > SOW > Edit
```

### Implementation:
- `components/layout/Navigation.tsx`
- `components/layout/Breadcrumbs.tsx`
- Update all pages to use layout

---

## Phase 6: Advanced Filtering
**Goal**: Multi-faceted filtering for opportunities

### Filter Categories:

1. **Financial**
   - Profit margin range ($ and %)
   - Contract value range
   - Assessment status

2. **Location**
   - State
   - City
   - Remote eligible

3. **Timeline**
   - Response deadline (next 7/14/30 days)
   - Posted date range
   - Contract duration

4. **Contract Details**
   - Contract type (FFP, T&M, CPFF, etc.)
   - Solicitation type (RFP, RFQ, IFB, etc.)
   - Set-aside type (8(a), HUBZone, SDVOSB, etc.)

5. **Technical**
   - NAICS code
   - Agency
   - Keywords in description

6. **Status & Progress**
   - Opportunity status
   - Has SOW
   - Has bid
   - Assessment recommendation

### UI:
```tsx
<FilterPanel>
  <FilterSection title="Profit Margin">
    <RangeSlider min={0} max={1000000} label="$ Margin" />
    <RangeSlider min={0} max={100} label="% Margin" />
  </FilterSection>

  <FilterSection title="Location">
    <MultiSelect options={states} />
    <Toggle label="Remote OK" />
  </FilterSection>

  <FilterSection title="Timeline">
    <DateRangePicker />
    <Select options={deadlineOptions} />
  </FilterSection>

  {/* More sections... */}
</FilterPanel>
```

### Database Query:
```typescript
const opportunities = await prisma.opportunity.findMany({
  where: {
    AND: [
      // Margin filter
      assessments: {
        profitMarginPercent: { gte: minMargin, lte: maxMargin }
      },
      // Location filter
      state: { in: selectedStates },
      // Timeline filter
      responseDeadline: { gte: startDate, lte: endDate },
      // Type filter
      rawData: {
        path: ['type'],
        equals: contractType
      }
    ]
  },
  include: { assessments: true }
})
```

### Saved Filters:
- Save common filter combinations
- Quick access to "My Saved Searches"
- Default filters per user

---

## Phase 7: Dashboard Enhancement
**Goal**: High-level metrics and insights

### Widgets:

1. **Pipeline Overview**
   - Count by stage
   - Visual funnel chart
   - Conversion rates

2. **Financial Summary**
   - Total potential value
   - Average margin %
   - Top opportunities by margin

3. **Upcoming Deadlines**
   - Next 7 days
   - Color-coded urgency
   - Quick links

4. **SOW Status**
   - Pending approval (count)
   - Recently generated
   - Action required

5. **Win Rate**
   - Submitted vs awarded
   - Historical trend
   - By contract type

### Layout:
```
┌────────────────────────────────────────────┐
│  Welcome, [User]!                          │
├──────────────┬─────────────────────────────┤
│   Pipeline   │   Financial Summary         │
│   Funnel     │   $2.5M Total Value         │
│              │   18% Avg Margin            │
├──────────────┼─────────────────────────────┤
│   Upcoming Deadlines   │   SOW Status      │
│   3 in next 7 days     │   5 Pending       │
├────────────────────────┴───────────────────┤
│   Recent Activity Feed                     │
└────────────────────────────────────────────┘
```

---

## Implementation Status

### ✅ Completed
- Backfill old SOWs (admin script)
- WIP Progress Tracker (`OpportunityProgress` model, progress bar in workspace)
- Margin-Based Assessment (`OpportunityAssessment` model, margin calculator)
- Enhanced SOW Content — OpenAI GPT-4o generates sections 1–6 from real solicitation data
- Navigation menu (`components/layout/`)
- PDF generation — replaced Python/reportlab with `@react-pdf/renderer` (server-side streaming)
- Attachment inline viewer — fullscreen iframe modal in summary panel
- Scope Overview panel — Products / Services / Documentation / Compliance with pill tags, filters, team notes
- Loading states — Generate SOW buttons show spinner during OpenAI call (~15-20s)
- MCP servers — SAM.gov and Prisma DB direct query tools
- **Agentic framework scaffolding** — `.claude/commands/` (/prime, /plan-feature, /execute, /commit), `docs/` on-demand context, `tests/e2e/` with agent-browser E2E tests
- **Phase 4.1: Opportunity Brief** — GPT-4o "Know Before You Search" card at top of Summary tab; cached in `opportunityBrief` JSON; Heads Up alerts for clearance/bonding/set-aside/timeline

### 🔄 In Progress / Next
- **Phase 4.2: SOW Editor** — PDF-style WYSIWYG editable layout
- **Phase 4.3: Attachment Management** — AI-suggested names + government form detection
- **Phase 4.4: Vendor Search** — configurable radius, explicit search geography UI
- **Phase 4.5: Scope Overview Redesign** — prose + deliverables table + compliance checklist
- Phase 4.6: Reports enhancement (pipeline, margins, win-rate)
- Phase 4.7: Dashboard widgets

### 📋 Backlog
- Saved filters per user
- Mobile responsive layout
- User onboarding flow
- Performance optimization (attachment fetch caching)
- Scope Overview: persist team notes to DB
- Scope Overview: OpenAI-powered section extraction (currently rule-based)

---

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (existing)
- **Charts**: Recharts or Chart.js
- **State**: React hooks + Context
- **Validation**: Zod
- **PDF**: @react-pdf/renderer (server-side, replaces Python/reportlab)
- **AI**: OpenAI GPT-4o + gpt-4o-mini via `openai` SDK
- **MCPs**: SAM.gov MCP + Prisma DB MCP for AI-assisted development
- **E2E Testing**: `agent-browser` skill — scripts in `tests/e2e/`
- **AI Layer**: `.claude/commands/` (prime, plan-feature, execute, commit), `docs/` on-demand context

---

## Success Metrics

- ✅ 100% of SOWs have structured content
- ✅ Users can track progress for all opportunities
- ✅ 90% of opportunities assessed before SOW creation
- ✅ Advanced filters reduce search time by 70%
- ✅ Navigation accessible in <2 clicks from anywhere
- ✅ Dashboard loads key metrics in <1 second

---

## Next Steps

1. Open a fresh session in `usher-nextjs/`
2. Run `/prime` to orient the agent
3. Run `/plan-feature advanced-filtering` to plan Phase 6
4. Reset context, run `/execute docs/plans/advanced-filtering.md`
5. Validate with `npm run test:e2e:filtering`
6. Run `/commit` with `[PHASE-6]` tag

---

## Attachment Handling (ATT-01 through ATT-32) — Completed 

**Status: ✅ Completed**

### What Was Built

- **Dual filename tracking**: `AttachmentOverride` model stores original (SAM.gov) name and user-editable working name
- **Edit history**: `AttachmentEditHistory` model records every rename with timestamp and editor
- **`RichAttachment` type** (`lib/types/attachment.ts`): shared interface with `originalName`, `currentName`, `isEdited`, `editedAt`, `editedBy`
- **Inline rename UI** in `OpportunitySummaryPanel`: pencil icon → input with extension locked; Enter saves, Escape cancels; duplicate/invalid-char validation
- **"edited" badge** with amber dot and tooltip showing renamer + timestamp
- **GET `/api/opportunities/[id]/attachments`**: merges overrides into `RichAttachment[]` response
- **PATCH `/api/opportunities/[id]/attachments/[attachmentId]`**: validates and persists rename, appends history
- **Email panel upgrades**: Select All / Deselect All, "X of Y selected" counter, SOW checkbox always-on with lock icon
- **Parent page state**: `emailSelectedAttachments` (Set<string>) survives panel switching
- **Migration script**: `scripts/migrate-attachments.ts` with `--dry-run` support
