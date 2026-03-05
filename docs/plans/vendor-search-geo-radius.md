# Plan: Vendor Search — Geo-Localized Radius UI

## Goal

Surface the search geography explicitly in the Subcontractors panel, give users a configurable radius dropdown (25/50/100/250 miles), and auto-expand if no local results are found — anchored to the opportunity's place of performance city + state.

## Success Criteria

- [ ] "Searching within 50mi of [City, STATE]" label appears above vendor results before search runs
- [ ] Radius dropdown (25 / 50 / 100 / 250 mi) updates the label and re-triggers search on change
- [ ] City is extracted from `opportunity.rawData.placeOfPerformance` and passed to the discover API
- [ ] At 25mi, Google Places query is biased to city; vendor addresses post-filtered by city match
- [ ] At 50mi (default), query biased to city; post-filtered by state (current behavior, now surfaced)
- [ ] At 100mi, query biased to state; post-filtered by state
- [ ] At 250mi, statewide search; no city post-filter
- [ ] If 0 results found at selected radius, UI shows auto-expand suggestion with next tier pre-selected
- [ ] No TypeScript errors (`npx tsc --noEmit`)

## Context References

- **Modified files:**
  - `lib/opportunity-classification.ts` — add `extractCity()` helper
  - `lib/google-places.ts` — accept `city` param; tighten/loosen query based on radius tier
  - `app/api/opportunities/[id]/subcontractors/discover/route.ts` — accept `radiusMiles` body param
  - `components/workspace/panels/SubcontractorPanel.tsx` — radius UI, geography label, auto-expand
  - `app/opportunities/[id]/page.tsx` — pass `placeOfPerformance` city/state to SubcontractorPanel

- **Design decisions from PRD §3.18:**
  - #11: Default 50mi. Dropdown: 25/50/100/250mi. Shows "Searching within 50mi of [City, STATE]".
  - #12: Auto-expand in steps: 50mi → 100mi → 250mi → statewide. UI shows each expansion as it happens.

## Database Changes

None. No schema changes required.

## API Routes

### Modified: `POST /api/opportunities/[id]/subcontractors/discover`

Accept optional `radiusMiles` in the request body (default: 50).

```ts
// Request body
{ radiusMiles?: 25 | 50 | 100 | 250 }

// Response (existing shape, add geography field)
{
  message: string,
  added: number,
  sources: { google: number, sam: number },
  geography: { city: string | null, state: string | null, radiusMiles: number },
  samWarning?: string,
}
```

The route uses `radiusMiles` to control how tightly it filters Google Places results:

| radiusMiles | Google query location | Post-filter |
|-------------|----------------------|-------------|
| 25 | `"City, STATE"` | city name match in address |
| 50 (default) | `"City, STATE"` | state match only (current behavior) |
| 100 | `"STATE, USA"` | state match only |
| 250 | `"STATE, USA"` | state match only |
| national (future) | `"United States"` | no filter |

SAM.gov entity search continues to use `stateCode` at all radii (SAM doesn't provide lat/lng distance filtering).

## UI Components

### Modified: `SubcontractorPanel.tsx`

New local state:
```ts
const [radiusMiles, setRadiusMiles] = useState<25 | 50 | 100 | 250>(50)
const [searchGeography, setSearchGeography] = useState<{ city: string | null, state: string | null } | null>(null)
const [autoExpandSuggested, setAutoExpandSuggested] = useState<number | null>(null)
```

New props:
```ts
interface SubcontractorPanelProps {
  // ... existing props ...
  placeOfPerformance?: { city: string | null, state: string | null } // NEW
}
```

**Header area changes:**
1. Geography label: `"Searching within 50mi of Fort Knox, KY"` (derived from `placeOfPerformance` prop)
2. Radius dropdown (25/50/100/250mi) next to "Find Vendors" button

**After search, if 0 added:**
Show auto-expand banner:
```
No vendors found within 50mi. Expand to 100mi? [Search 100mi]
```

**Auto-expand logic (sequential — triggered automatically, not just suggested):**
Per design decision #12, auto-expand runs in steps. When "Find Vendors" is clicked:
1. Run search at selected radius
2. If 0 new results → auto-run at next tier (50→100→250→statewide)
3. Show UI feedback for each step: `"Expanding to 100mi..."`, `"Expanding to 250mi..."`

### Modified: `app/opportunities/[id]/page.tsx`

Extract city/state from `opportunity.rawData` via `extractPlaceOfPerformance()` (already imported in discover route). Pass `placeOfPerformance` to `SubcontractorPanel`.

## Implementation Task List

1. [ ] **`lib/opportunity-classification.ts`** — add `extractCity()` that parses city from `rawData.placeOfPerformance` (check `city`, `cityCode`, `name` fields in the SAM.gov structure)

2. [ ] **`lib/google-places.ts`** — update `findSubcontractorsForOpportunity` signature to accept `radiusMiles` and `city`; build search location string accordingly; pass `city` to `searchBusinesses` for post-filter when `radiusMiles <= 25`

3. [ ] **`lib/google-places.ts`** — add `addressMatchesCity(address, city)` helper (case-insensitive city name match in formatted address)

4. [ ] **`app/api/opportunities/[id]/subcontractors/discover/route.ts`** — parse `radiusMiles` from request body; pass to `findSubcontractorsForOpportunity`; extract city via `extractCity()`; include `geography` in response

5. [ ] **`components/workspace/panels/SubcontractorPanel.tsx`** — add `placeOfPerformance` prop; add `radiusMiles` state; add radius dropdown; add geography label above vendor list; wire radius to `handleAutoDiscover`; implement auto-expand loop

6. [ ] **`app/opportunities/[id]/page.tsx`** — extract `placeOfPerformance` city/state from `opportunity.rawData` using `extractCity()` + existing `extractStateCode()`; pass as `placeOfPerformance` prop to `SubcontractorPanel`

7. [ ] **Type check:** `npx tsc --noEmit`

## Implementation Notes

### Extracting city from SAM.gov rawData

SAM.gov `placeOfPerformance` structure varies:
```json
// Common shapes — check all:
{ "city": { "name": "Fort Knox", "code": "28900" },
  "state": { "code": "KY", "name": "Kentucky" },
  "country": { "code": "USA" } }
```

`extractCity()` should try: `placeOfPerformance.city.name`, then `placeOfPerformance.cityName`, fallback null.

### Geography label

Derived entirely client-side from the `placeOfPerformance` prop:
- If city + state: `"Searching within {radius}mi of {city}, {state}"`
- If state only: `"Searching within {state} (statewide)"`
- If neither: `"Searching nationally"`

Show this label even before the first search is run (so user knows the default geography).

### Auto-expand sequence

```ts
const RADIUS_TIERS = [25, 50, 100, 250] as const
// Starting from selected radius, try next tiers automatically if 0 results
```

When auto-expanding, show inline status in the button area:
```
Searching... (expanding to 100mi — no results at 50mi)
```

After auto-expand succeeds, update the radius dropdown to reflect the radius that found results.

### `handleAutoDiscover` updated signature

```ts
const handleAutoDiscover = async (radiusOverride?: number) => {
  // POST body includes radiusMiles
  const res = await fetch(`/api/opportunities/${opportunityId}/subcontractors/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radiusMiles: radiusOverride ?? radiusMiles }),
  })
  const data = await res.json()
  if (data.added === 0 && !radiusOverride) {
    // Auto-expand to next tier
    const nextTier = getNextRadiusTier(radiusMiles)
    if (nextTier) {
      setExpandStatus(`Expanding to ${nextTier}mi — no results at ${radiusMiles}mi`)
      await handleAutoDiscover(nextTier)
    }
  }
}
```

## Validation Strategy

### Automated
- Type check: `npx tsc --noEmit`

### Manual User Journey
1. Navigate to any opportunity with a known place of performance (e.g., state + city in rawData)
2. Go to Subcontractors tab
3. Verify geography label shows correctly above vendor results area
4. Verify default radius is 50mi
5. Change radius dropdown to 25mi — label updates
6. Click "Find Vendors" — verify search runs; check server logs for `[Discover]` output showing correct location string
7. If no results found, verify auto-expand banner appears and auto-search fires at next tier
8. Verify final radius dropdown reflects the radius that succeeded
