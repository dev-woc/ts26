# API Endpoints — On-Demand Context

Load this file when building or modifying API routes. All routes use Next.js Route Handlers in `app/api/`.

## Conventions
- Return `NextResponse.json({ data, error })`
- Use `import { prisma } from '@/lib/db'` for all DB access
- Validate with Zod where needed
- Auth check: `import { auth } from '@/lib/auth'; const session = await auth()`

## Opportunities
```
GET/POST   /api/opportunities                                # List/create
GET/PUT    /api/opportunities/[id]                           # Detail/update
POST       /api/opportunities/fetch                          # Fetch from SAM.gov
GET/PUT    /api/opportunities/[id]/progress                  # Stage tracking
GET/POST   /api/opportunities/[id]/assessment                # Go/no-go analysis
POST       /api/opportunities/[id]/assessment/auto-generate  # AI assessment

GET        /api/opportunities/[id]/attachments               # List (RichAttachment[])
PATCH      /api/opportunities/[id]/attachments/[attId]       # Rename attachment
GET        /api/opportunities/[id]/attachments/[attId]/proxy # Proxy (CORS fix)
POST       /api/opportunities/[id]/parse-attachments         # Parse PDF/DOCX

GET/POST   /api/opportunities/[id]/subcontractors            # List/add
PUT/DELETE /api/opportunities/[id]/subcontractors/[subId]    # Update/remove
POST       /api/opportunities/[id]/subcontractors/discover   # Auto-discover
POST       /api/opportunities/[id]/subcontractors/deduplicate # Merge dupes
```

## SOWs
```
GET/POST   /api/sows                     # List/generate (POST auto-parses attachments + calls GPT-4o)
GET/PUT    /api/sows/[id]                # Detail/update
GET        /api/sows/[id]/download       # Stream PDF (react-pdf, server-side)
POST       /api/sows/[id]/approve        # Approval action
POST       /api/sows/[id]/assign-approver
POST       /api/sows/[id]/send           # Email to vendor
POST       /api/sows/[id]/accept         # Vendor acceptance
GET/POST   /api/sows/[id]/versions       # Version history
POST       /api/sows/backfill-content    # Migrate legacy SOWs
```

## Bids
```
GET/POST   /api/bids           # List/create
GET/PUT    /api/bids/[id]      # Detail/update
POST       /api/bids/[id]/document  # Generate bid document
```

## Reports / Analytics
```
GET  /api/reports/margins      # Margin analysis report
GET  /api/reports/pipeline     # Pipeline report
GET  /api/reports/win-rate     # Win rate stats
```

## Admin
```
GET/POST   /api/admin/users    # User management
GET        /api/admin/logs     # System logs
GET/PUT    /api/admin/settings # App settings
```

## Auth
```
POST  /api/auth/register       # User registration
[...] /api/auth/[...nextauth]  # NextAuth handlers
```

## Vendors (CRM)
```
GET/POST   /api/vendors        # CRM vendor list/create
GET/PUT    /api/vendors/[id]   # CRM vendor detail
GET/POST   /api/vendors/[id]/communications  # Comm log
```

## Key Libraries Used in Routes
```typescript
import { prisma } from '@/lib/db'           // DB (always)
import { auth } from '@/lib/auth'            // Session
import { NextResponse } from 'next/server'   // Response
import { z } from 'zod'                      // Validation
import { generateSOWSections } from '@/lib/openai'  // AI
import { parseAllAttachments } from '@/lib/attachment-parser'
import { searchSAMGov } from '@/lib/samgov'
```
