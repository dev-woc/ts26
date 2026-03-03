# Frontend Components — On-Demand Context

Load this file when working on UI. Reference ARCHITECTURE.md for patterns.

## Layout
| Component | Path | Purpose |
|---|---|---|
| `AppLayout` | `components/layout/AppLayout.tsx` | Root layout wrapper |
| `Navigation` | `components/layout/Navigation.tsx` | Top nav bar with dropdowns |
| `Breadcrumbs` | `components/layout/Breadcrumbs.tsx` | Page breadcrumb trail |

## Workspace (Main UI)
| Component | Path | Purpose |
|---|---|---|
| `WorkspaceLayout` | `components/workspace/WorkspaceLayout.tsx` | Shell: sidebar nav + progress bar + panel container |
| `DocumentDirectory` | `components/workspace/DocumentDirectory.tsx` | Document tree sidebar |

### Workspace Panels (swap via `activePanel` state in parent)
| Panel | `activePanel` value | Purpose |
|---|---|---|
| `OpportunitySummaryPanel` | `'summary'` | Opportunity details, attachments, inline viewer |
| `ScopeOverviewPanel` | `'scope'` | Products/Services/Docs/Compliance pills |
| `SOWPanel` | `'sow'` | SOW editor with structured sections |
| `SubcontractorPanel` | `'subcontractors'` | Vendor discovery, call workflow, quotes |
| `BidEditorPanel` | `'bid'` | Bid assembly and pricing |
| `EmailDraftPanel` | `'email'` | Email composer with attachment select |

All panels: `'use client'`, typed props interface, no self-fetching (except `OpportunitySummaryPanel` for its own attachment list).

## Progress & Stages
| Component | Path | Purpose |
|---|---|---|
| `WIPProgressTracker` | `components/progress/WIPProgressTracker.tsx` | Full pipeline from Discovery → Submitted |
| `StageIndicator` | `components/progress/StageIndicator.tsx` | Individual stage badge |
| `NextActionCard` | `components/progress/NextActionCard.tsx` | Action items display |

## SOW-Specific
| Component | Path | Purpose |
|---|---|---|
| `SOWCard` | `components/sows/SOWCard.tsx` | SOW list item card |
| `SOWEditor` | `components/sows/SOWEditor.tsx` | SOW section editor |
| `SOWViewer` | `components/sows/SOWViewer.tsx` | Read-only SOW view |
| `SOWStatusBadge` | `components/sows/SOWStatusBadge.tsx` | Status pill |
| `SOWPDF` | `components/sows/SOWPDF.tsx` | `@react-pdf/renderer` template — server-side only |
| `SOWDocumentEditor` | `components/sows/SOWDocumentEditor.tsx` | Document-level editor |

## Assessment & Bids
| Component | Path | Purpose |
|---|---|---|
| `MarginCalculator` | `components/assessment/MarginCalculator.tsx` | Profit margin analysis |
| `BidCard` | `components/bids/BidCard.tsx` | Bid list item |
| `BidDocumentEditor` | `components/bids/BidDocumentEditor.tsx` | Bid document builder |

## Shared / Utilities
| Component | Path | Purpose |
|---|---|---|
| `DeadlineIndicator` | `components/shared/DeadlineIndicator.tsx` | Urgency-colored deadline pill |
| `NextActionBanner` | `components/shared/NextActionBanner.tsx` | Next action prompt bar |
| `QuickBidCreator` | `components/shared/QuickBidCreator.tsx` | Fast bid entry |
| `SubcontractorSuggestions` | `components/shared/SubcontractorSuggestions.tsx` | Vendor suggestion list |
| `OpportunityCard` | `components/opportunities/OpportunityCard.tsx` | Opportunity list card |

## Styling Rules (ALWAYS)
- `stone-*` palette ONLY — never `gray-*`, `slate-*`, `zinc-*`, `neutral-*`
- Primary text: `text-stone-900` | Secondary: `text-stone-600` | Tertiary: `text-stone-400`
- Borders: `border-stone-200` (default) | `border-stone-100` (subtle)
- Backgrounds: `bg-white` (cards) | `bg-stone-50` (page) | `bg-stone-100` (inputs)
- Primary button: `bg-stone-800 text-white hover:bg-stone-700`

## Workspace Parent State Pattern
State lives in `app/opportunities/[id]/page.tsx`. Panels receive typed props.
```typescript
// Parent owns:
opportunity, assessment, activePanel, selectedSubcontractor,
emailTemplateType, emailContext, solicitationAttachments,
emailSelectedAttachments, generatingSOW, discoveringSubcontractors

// Panel receives via props — never fetches its own primary data
```
