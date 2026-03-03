# Plan: SOW Editor — PDF-Style Editable Layout (Phase 4.2)

## Goal
Replace the click-to-reveal form editor in the SOW panel's "Edit Sections" view with a WYSIWYG document layout — a white page card styled to match the PDF output, with always-visible editable textareas, and auto-save on blur.

## Success Criteria
- [ ] "Edit Sections" view renders as a document page (white card, shadow, stone-50 bg)
- [ ] Document header matches PDF: "STATEMENT OF WORK" label, title, sol #, agency
- [ ] Sections display numbered badges + titles matching PDF typography
- [ ] Section bodies are always-visible textareas — no click-to-activate step
- [ ] Editing any textarea and clicking away auto-saves (blur → PATCH → "Saved ✓" flash)
- [ ] "Save changes" explicit button is removed; toolbar shows "Saved ✓" after blur save
- [ ] Download PDF button always visible in the action bar
- [ ] Plain language view is unchanged
- [ ] No TypeScript errors (`npx tsc --noEmit`)

## Design Decisions (from PRD §3.18)
| # | Decision |
|---|----------|
| 1 | Always-editable textareas styled as document (Google Docs style). No click-to-activate. Sections always show as styled textareas. |
| 2 | Plain language is default view. "Edit Sections" switches to PDF-style edit view. |
| 3 | Auto-save on blur. Brief "Saved ✓" flash. No save button. |

## Current State
`SOWPanel.tsx` has two view modes:
- `'plain'` — plain language cards (default, unchanged)
- `'edit'` — document header + list of sections; clicking a section reveals a title input + textarea form with "Done editing" button

The edit view needs to be redesigned. The plain view is untouched.

## What Changes

### `components/workspace/panels/SOWPanel.tsx` — edit view only

**Layout change:**
- Outer wrapper: `bg-stone-50 min-h-full` (matches PDF page feel)
- Inner page card: `bg-white shadow-md rounded max-w-2xl mx-auto` (simulates paper)
- Page proportions: padding matches PDF (`px-12 py-10`)

**Document header block (matches PDF):**
```
STATEMENT OF WORK                    ← xs, uppercase, tracking-widest, stone-400
[Opportunity Title]                  ← lg, semibold, stone-900
[Solicitation Number]                ← sm, stone-500
[Agency]                             ← sm, stone-400
```
Thin divider (`border-b border-stone-200`) below header.

**Section layout (always editable, no click-to-reveal):**
```
┌─ Section block ──────────────────────────────────┐
│  [3]  [Section Title Input ─────────────────────] │  ← number badge + title input
│       ────────────────────────────────────────────│  ← thin divider
│       [                                          ]│
│       [ auto-resizing textarea — body text       ]│
│       [                                          ]│
└────────────────────────────────────────────────────┘
```
- Number badge: `w-6 h-6 bg-stone-900 text-white text-xs font-bold rounded flex items-center justify-center`
- Title input: `text-sm font-semibold text-stone-800 bg-transparent border-none outline-none w-full` (looks like text, not a form field)
- Thin divider: `border-b border-stone-100 my-2`
- Body textarea: `w-full text-sm text-stone-700 leading-relaxed bg-transparent border-none outline-none resize-none` (auto-height via `onInput` row expansion)
- On focus: subtle `ring-1 ring-stone-200 rounded` to indicate editable
- On blur: trigger auto-save (see below)

**Auto-save on blur:**
- Both the title input and body textarea share `handleBlur(sectionIndex)`
- `handleBlur` calls `debouncedSave()` — 400ms debounce
- `debouncedSave()` calls `onSave(builtContent)` and shows `savedAt` state for 2s
- "Saved ✓" indicator replaces the save button in the top action bar
- State: `savedAt: Date | null`, `isSaving: boolean`

**Removed:**
- Click-to-reveal behavior (`editingSection` state and conditional rendering)
- "Done editing" button
- Explicit "Save changes" button
- `-m-3 p-3 cursor-pointer hover:bg-stone-50 rounded` click wrapper

**Kept:**
- `handleAddSection` / `handleRemoveSection` (small "+" / "×" buttons per section)
- Plain language toggle (unchanged)
- Download PDF button
- Submit for review / Mark as sent workflow buttons
- `handleTransform` and plain language view entirely untouched

**Action bar (bottom of document):**
```
[↓ Download PDF]  [Submit for Review / Mark as Sent]      [Saved ✓ just now]
```

### `app/opportunities/[id]/page.tsx` — quiet save

Currently `handleSaveSOW` calls `fetchData()` after every save, which would refetch the whole opportunity and re-render the panel on every auto-save blur event — jarring and wasteful.

**Change:** Split into two handlers:
- `handleSaveSOW(content)` — silent PATCH only, no refetch (used for auto-save)
- `handleSaveSOWAndRefresh(content)` — PATCH + `fetchData()` (used for "Save & re-generate plain language")

Pass `onSave={handleSaveSOW}` to SOWPanel (the silent version).

## Context References
- `components/workspace/panels/SOWPanel.tsx` — full file, the edit view is lines 464–574
- `components/sows/SOWPDF.tsx` — PDF styles to match (color palette, section number badge, typography)
- `app/opportunities/[id]/page.tsx` — `handleSaveSOW` at line 174

## Database Changes
None.

## API Routes
None. Existing `PATCH /api/sows/[id]` is already used for saves.

## UI Components
- **Modified:** `components/workspace/panels/SOWPanel.tsx` — redesign `edit` view only
- **Modified:** `app/opportunities/[id]/page.tsx` — split `handleSaveSOW` into silent + refresh variants

## Implementation Task List
1. [ ] Update `handleSaveSOW` in parent page — remove `fetchData()` call; add `handleSaveSOWAndRefresh` for explicit save+refresh
2. [ ] Update `SOWPanel` props: pass `onSaveAndRefresh` for the "Save & re-generate plain language" button
3. [ ] Remove `editingSection` state and click-to-reveal logic from SOWPanel
4. [ ] Replace edit view with document page layout + always-visible textarea sections
5. [ ] Add auto-save on blur with `savedAt` / `isSaving` state + "Saved ✓" flash
6. [ ] Auto-resize textareas on mount and content change
7. [ ] Verify plain language view is untouched
8. [ ] Type check: `npx tsc --noEmit`

## Validation Strategy

### Automated
- `npx tsc --noEmit` — must be clean

### Manual User Journey
1. Open any opportunity workspace with an existing SOW → Summary tab
2. Navigate to SOW tab → plain language view renders (unchanged)
3. Click "Edit Sections" toggle → document page layout appears
4. See numbered sections with always-visible textareas (no click required)
5. Click into a section body → subtle ring appears, no form revealed
6. Type changes → click elsewhere → "Saving…" briefly, then "Saved ✓ just now"
7. Reload page → changes persisted (auto-save worked)
8. Click "Download PDF" → PDF streams correctly from saved content
9. "Submit for Review" button still works
10. Switch back to Plain Language → unchanged from before

## Notes
- No rich text editor library needed — plain `<textarea>` elements styled to look like document text is sufficient for this phase
- Auto-resize textarea: set `rows={1}` and expand via `scrollHeight` on `onInput` event
- `savedAt` state drives the "Saved ✓ just now" indicator (shown for 2s post-save, then fades)
- The "Save & re-generate plain language" flow needs a refresh after save to reload the new plain language content — this uses `handleSaveSOWAndRefresh`
- Do NOT change the plain language view — it's working well
