# Federal Contract Pricing Data APIs

Research conducted March 2026. Reference when extending `lib/usaspending.ts` or adding new data sources.

## 1. USASpending.gov API (primary — already integrated)

**Base URL:** `https://api.usaspending.gov`
**Auth:** None — fully public
**Rate limits:** None documented
**Cost:** Free

### Critical Filter Structure (common mistake)

The `naics_codes` filter must be `{ require: [...] }` — not a bare array:

```json
{
  "filters": {
    "award_type_codes": ["A", "B", "C", "D"],
    "naics_codes": { "require": ["541330"] },
    "time_period": [{ "start_date": "2020-01-01", "end_date": "2025-09-30", "date_type": "action_date" }]
  },
  "fields": ["Award ID", "Award Amount", "Awarding Agency", "Recipient Name", "NAICS Code", "Start Date", "End Date"],
  "limit": 100,
  "sort": "Award Amount",
  "order": "desc"
}
```

`award_type_codes` A/B/C/D = contracts only (excludes grants, loans). Omitting this returns all award types and inflates amounts.

### Why Searches Return Empty (and how to broaden)

1. **Drop agency filter first** — agency name must match USASpending's exact toptier name (often different from SAM.gov)
2. **Use 4-digit parent NAICS** — e.g. `"5413"` instead of `"541330"` to catch all sub-codes
3. **Confirm data exists** — hit `/api/v2/search/spending_by_category/naics/` with just NAICS to verify any spend before running full award search
4. **Expand date range** — 5-year window is good; try 10 if sparse

### Dollar Fields

- `Award Amount` / `Award_Amount` — total obligated amount
- `base_and_all_options_value` — contract ceiling with all options
- `total_obligation` — actual spend to date

---

## 2. SAM.gov Contract Awards API (FPDS-NG replacement)

**Base URL:** `https://api.sam.gov/contract-awards/v1/search`
**Auth:** SAM.gov API key (free, register at SAM.gov)
**Rate limits:** 10 req/day (basic user) → 1,000 req/day (with role/system account)

Replaced FPDS.gov which was decommissioned February 2026. Covers 180+ data points per record.

### Key Parameters

| Param | Example |
|-------|---------|
| `naicsCode` | `541330` or `541330~541519` (tilde-separated) |
| `dollarsObligated` | `[5000,100000]` |
| `approvedDate` | `01/01/2023` (MM/DD/YYYY) |
| `limit` | 1–100 (default 10) |

### Dollar Fields

- `actionObligation` — amount on this action
- `baseDollarsObligated` — base value
- `baseAndAllOptionsValue` — full ceiling

**Not yet integrated** — worth adding as a secondary source when USASpending returns no results. Uses `SAM_GOV_API_KEY` env var (already present).

---

## 3. GSA CALC API (labor rate ceilings)

**Base URL:** `https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/`
**Auth:** None — fully public
**Rate limits:** None documented
**Cost:** Free, updated daily

Provides GSA Schedule ceiling hourly rates by labor category across MAS Schedule, OASIS+, etc. Best for labor-intensive professional services contracts.

### Key Parameters

| Param | Purpose |
|-------|---------|
| `suggest-contains=` | Fuzzy labor category search (recommended) |
| `keyword=` | Wildcard search |

### Response Fields
- `current_price` — ceiling hourly rate
- `next_year_price`, `second_year_price` — option year rates
- Vendor name, contract number, labor category

**Use case:** When NAICS code maps to professional services (541xxx), query by labor category to bound upper-end pricing. Not a direct contract award amount source.

---

## Integration Priority

| Priority | Action |
|----------|--------|
| Done | Fix USASpending filter structure (naics_codes + award_type_codes) |
| Done | Progressive broadening: 6-digit → 4-digit → all agencies |
| Future | Add SAM.gov Contract Awards as secondary source |
| Future | Add GSA CALC for labor-rate-based estimates on services contracts |
