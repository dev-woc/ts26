# Plan: Phase 4.3 — Attachment Management (AI Names + Form Detection + Form Fill)

## Goal
For every solicitation attachment: (1) auto-generate a human-readable AI-suggested name with a confidence indicator, (2) detect standard government forms by filename/content and badge them, and (3) provide a PDF field-overlay editor for detected forms so users can fill them in-app.

## Success Criteria
- [ ] Opening the Summary tab auto-triggers AI analysis; attachment list shows AI-suggested names with confidence badges within one page lifecycle
- [ ] "Use suggestion" button applies the AI name through the existing rename flow
- [ ] Manually renamed attachments are skipped by AI re-analysis (existing `AttachmentOverride.currentName !== originalName`)
- [ ] Detected government forms show a `FORM` badge (SF-1449, SF-33, SF-26, DD-1155, DD-254, OF-347, wage determinations)
- [ ] "Fill Form" button opens a modal with the PDF rendered on canvas + AcroForm fields overlaid as inputs
- [ ] Filled field values are saved to `AttachmentFormData.fields` (JSON) via PATCH
- [ ] Re-analysis works on existing parsed opportunities (backfill)
- [ ] No TypeScript errors (`npx tsc --noEmit`)

## Context References
- Relevant files:
  - `lib/types/attachment.ts` — `RichAttachment` interface (extend with form data)
  - `lib/openai.ts` — add `analyzeAttachments()` function
  - `lib/attachment-parser.ts` — understand what `parsedAttachments` contains
  - `app/api/opportunities/[id]/attachments/route.ts` — GET, include `AttachmentFormData`
  - `app/api/opportunities/[id]/attachments/[attachmentId]/route.ts` — PATCH (rename)
  - `components/workspace/panels/OpportunitySummaryPanel.tsx` — add AI name UI + FORM badge
  - `prisma/schema.prisma` — add `AttachmentFormData` model

## Database Changes

### New model: `AttachmentFormData`
```prisma
model AttachmentFormData {
  id              String    @id @default(cuid())
  opportunityId   String
  attachmentId    String    // SAM.gov attachment ID
  formType        String?   // "SF-1449", "DD-254", etc. — null if not a form
  isForm          Boolean   @default(false)
  aiSuggestedName String?   // GPT-4o suggested human-readable name
  aiConfidence    String?   // "HIGH", "MEDIUM", "LOW"
  fields          Json?     // AcroForm field values: { [fieldName]: string }
  filledAt        DateTime?
  filledById      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  opportunity Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  filledBy    User?       @relation(fields: [filledById], references: [id])

  @@unique([opportunityId, attachmentId])
  @@index([opportunityId])
  @@map("attachment_form_data")
}
```

Add to `Opportunity` model:
```prisma
attachmentFormData AttachmentFormData[]
```

Add to `User` model:
```prisma
attachmentFormData AttachmentFormData[]
```

Migration: `npx prisma db push` (Render PG — non-interactive, cannot use migrate dev)

## API Routes

### New: `POST /api/opportunities/[id]/attachments/analyze`
- Reads all raw attachments + `parsedAttachments` text for the opportunity
- For each attachment without an existing `AttachmentFormData` record:
  - Skip if already has manual rename (`AttachmentOverride.currentName !== originalName`)
  - Call `analyzeAttachments()` in `lib/openai.ts` (batch call — all attachments in one GPT-4o request)
  - Detect forms by filename pattern first (fast, no LLM needed); refine with text if available
  - Upsert `AttachmentFormData` with `aiSuggestedName`, `aiConfidence`, `isForm`, `formType`
- Returns: `{ analyzed: number, skipped: number }`
- Auth: session required

### Modified: `GET /api/opportunities/[id]/attachments`
- Include `attachmentFormData` in the Prisma query (by `opportunityId`)
- Merge into each `RichAttachment`: add `formData?: { aiSuggestedName, aiConfidence, isForm, formType, fields, filledAt } | null`

### New: `PATCH /api/opportunities/[id]/attachments/[attachmentId]/form-data`
- Body: `{ fields: Record<string, string> }`
- Upserts `AttachmentFormData.fields` + sets `filledAt`, `filledById`
- Returns the updated `AttachmentFormData`
- Auth: session required

## UI Components

### Modified: `lib/types/attachment.ts`
Add `formData` field to `RichAttachment`:
```typescript
formData?: {
  aiSuggestedName: string | null
  aiConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  isForm: boolean
  formType: string | null
  fields: Record<string, string> | null
  filledAt: string | null
} | null
```

### Modified: `lib/openai.ts`
Add `analyzeAttachments(attachments: AttachmentInput[]): Promise<AttachmentAnalysis[]>`:
- Input per attachment: `{ id, originalName, textContent?: string }` (text from `parsedAttachments`)
- Single GPT-4o call with all attachments batched in the prompt
- Returns per attachment: `{ id, suggestedName, confidence, isForm, formType }`
- Form detection fallback (no LLM needed): regex on filename for known form numbers

Form detection patterns (filename or first-page text):
```
SF-1449 | SF1449 | "solicitation/contract/order"
SF-33   | SF33   | "solicitation for bids"
SF-26   | SF26   | "award/contract"
DD-1155 | DD1155 | "order for supplies or services"
DD-254  | DD254  | "contract security classification"
OF-347  | OF347  | "order for supplies"
wage determination | "WD " | "davis-bacon"
```

### New: `components/workspace/panels/FormFillModal.tsx`
PDF.js-powered form fill modal:
- Rendered in a fixed-position overlay (fullscreen, stone-900/80 backdrop)
- Loads PDF via proxy URL → `ArrayBuffer` → `pdfjs-dist` render
- Canvas renders one page at a time; left/right arrow navigation for multi-page
- After render: calls `page.getAnnotations()` → AcroForm fields
- For each annotation: render absolutely-positioned `<input>` (text) or `<input type="checkbox">` (checkboxes)
- Coordinate transform: PDF uses bottom-left origin; canvas uses top-left. Scale to viewport.
- Local state: `Record<string, string>` for field values, initialized from `formData.fields`
- "Save" button → PATCH form-data endpoint → closes modal
- "Cancel" button → closes without save
- Worker config: `pdfjs-dist/build/pdf.worker.min.mjs` via dynamic import

### Modified: `components/workspace/panels/OpportunitySummaryPanel.tsx`

**Auto-analyze trigger:**
- After fetching attachments, check if any lack `formData` records
- If so, fire `POST .../attachments/analyze` in the background (no spinner blocking the UI)
- After analyze resolves, refetch the attachment list
- Add `isAnalyzing` state: show a subtle "Analyzing attachments…" indicator in the attachment list header

**AI name UI (per attachment row):**
- If `formData.aiSuggestedName` exists AND no manual rename:
  - Show suggested name as the primary display name (in italics or stone-500 to indicate it's a suggestion)
  - Show a confidence badge: `HIGH` → no badge, `MEDIUM` → `?` amber badge, `LOW` → `?` red badge
  - "Use suggestion" button (small, text style): clicking it → fires the existing PATCH rename flow with `aiSuggestedName` as the `currentName`
- If manual rename exists: show `currentName` as-is (no suggestion shown)

**FORM badge (per attachment row):**
- If `formData.isForm === true`: show `FORM` badge (stone-700 background, white text, xs)
- If `formData.formType`: add the form type as a tooltip on the badge

**Fill Form button (per attachment row):**
- If `formData.isForm === true`: show "Fill Form" button (outline style, xs)
- Clicking opens `FormFillModal` with the attachment's proxy URL + existing `formData`
- After modal closes with save: update local `attachments` state with updated `formData`

## Implementation Task List

1. [ ] **Install pdf.js**: `npm install pdfjs-dist`
2. [ ] **DB schema**: Add `AttachmentFormData` model to `prisma/schema.prisma`; add relations to `Opportunity` and `User`
3. [ ] **DB push**: `npx prisma db push`
4. [ ] **Types**: Extend `RichAttachment` in `lib/types/attachment.ts` with `formData` field
5. [ ] **OpenAI**: Add `analyzeAttachments()` in `lib/openai.ts`
6. [ ] **Analyze API**: `POST /api/opportunities/[id]/attachments/analyze/route.ts`
7. [ ] **Form data API**: `PATCH /api/opportunities/[id]/attachments/[attachmentId]/form-data/route.ts`
8. [ ] **GET attachments**: Extend `GET /api/opportunities/[id]/attachments/route.ts` to join `AttachmentFormData`
9. [ ] **FormFillModal**: Create `components/workspace/panels/FormFillModal.tsx`
10. [ ] **OpportunitySummaryPanel**: Add auto-analyze trigger, AI name UI, FORM badge, Fill Form button
11. [ ] **Type check**: `npx tsc --noEmit`

## Validation Strategy

### Automated
- Type check: `npx tsc --noEmit`

### Manual User Journey — AI Name Suggestions
1. Open any opportunity with solicitation attachments
2. Navigate to Summary tab → attachments load
3. After a few seconds, "Analyzing attachments…" indicator appears then disappears
4. Attachment list refreshes: cryptic names now show AI-suggested names with confidence badges
5. Click "Use suggestion" on one attachment → name is applied (existing rename flow)
6. Verify the renamed attachment shows the amber "edited" badge and original name tooltip

### Manual User Journey — Form Detection
1. Open an opportunity with SF-1449 or DD-254 in its attachments
2. After analysis: attachment shows `FORM` badge + form type tooltip
3. Click "Fill Form" → `FormFillModal` opens
4. PDF renders on canvas; form fields overlaid as inputs
5. Type in several fields; click "Save"
6. Reopen modal — filled values persist from DB
7. Click "Cancel" after typing — values are NOT saved

### Manual User Journey — Backfill
1. Open an older opportunity that was parsed before Phase 4.3
2. Summary tab loads → auto-analyze fires
3. AI-suggested names appear (or "Analyzing…" → then appear)
4. Manually renamed attachments are skipped (no suggestion shown)
