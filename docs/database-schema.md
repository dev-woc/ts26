# Database Schema — On-Demand Context

Load when building migrations or writing Prisma queries. Full schema at `prisma/schema.prisma`.

## Key Models & Relations

```
User ──┬── OpportunityWatch ──── Opportunity
       ├── Bid ──────────────── Opportunity
       ├── SOW (generator) ──── Opportunity
       ├── SOW (approver)
       ├── SOWApproval
       └── OpportunityAssessment

Opportunity ──┬── Subcontractor (per-opp vendors)
              ├── SOW (versioned)
              ├── Bid (pricing)
              ├── OpportunityProgress (stage)
              ├── OpportunityAssessment (go/no-go)
              └── AttachmentOverride[] (rename tracking)

Vendor ─── VendorCommunication (CRM)
```

## Opportunity (core entity)
```prisma
model Opportunity {
  id                 String            // cuid
  solicitationNumber String            @unique
  title              String
  description        String?           @db.Text
  naicsCode          String?
  agency             String?
  department         String?
  state              String?
  postedDate         DateTime?
  responseDeadline   DateTime?
  status             OpportunityStatus @default(ACTIVE)  // ACTIVE|EXPIRED|AWARDED|CANCELLED
  rawData            Json?             // Full SAM.gov response
  parsedAttachments  Json?             // Cached parsed attachment text
  // indexes: solicitationNumber, responseDeadline, status, naicsCode
}
```

## OpportunityProgress (stage tracking)
```prisma
model OpportunityProgress {
  currentStage  Stage    // DISCOVERY|ASSESSMENT|SOW_CREATION|SOW_REVIEW|BID_ASSEMBLY|READY|SUBMITTED
  completionPct Int
  blockers      Json?    // [{ id, description, severity }]
  nextActions   Json?    // [{ id, description, priority, assignedTo }]
}
```

## OpportunityAssessment (go/no-go)
```prisma
model OpportunityAssessment {
  estimatedValue      Float?
  estimatedCost       Float?
  profitMarginDollar  Float?
  profitMarginPercent Float?
  meetsMarginTarget   Boolean
  strategicValue      StrategicValue?  // HIGH|MEDIUM|LOW
  riskLevel           RiskLevel?       // HIGH|MEDIUM|LOW
  recommendation      String?          // "GO"|"NO_GO"|"REVIEW"
  // indexes: recommendation, meetsMarginTarget
}
```

## SOW (statement of work)
```prisma
model SOW {
  status        SOWStatus   // DRAFT|PENDING_REVIEW|APPROVED|REJECTED|SENT|VIEWED|ACCEPTED|SUPERSEDED
  content       Json?       // { sections: [{ id, title, summary?, bullets?, details?, content }] }
  fileUrl       String?     // Vercel Blob (legacy, PDFs now streamed on-demand)
  version       Int
  generatedById String?
  // indexes: opportunityId, status
}
```

## Subcontractor (per-opportunity vendor)
```prisma
model Subcontractor {
  callCompleted   Boolean    // Has the call been completed?
  quotedAmount    Float?     // Received quote
  isActualQuote   Boolean    // vs intelligent estimate
  verificationStatus String  // "verified"|"unverified"|"user_verified"
  source          String?    // "sam_gov"|"google_places"|"manual"
  // indexes: opportunityId, verificationStatus
}
```

## AttachmentOverride (rename tracking)
```prisma
model AttachmentOverride {
  opportunityId String
  attachmentId  String   // SAM.gov attachment ID e.g. "resource-0"
  originalName  String   // From SAM.gov — immutable
  currentName   String   // User-edited
  // @@unique([opportunityId, attachmentId])
}
```

## Common Queries

```typescript
// Opportunities with all relations
const opp = await prisma.opportunity.findUnique({
  where: { id },
  include: {
    sows: true,
    bids: true,
    progress: true,
    assessment: true,
    subcontractors: true,
  }
})

// Opportunities filtered by margin (for Phase 6)
const opps = await prisma.opportunity.findMany({
  where: {
    status: 'ACTIVE',
    assessment: {
      profitMarginPercent: { gte: minMargin },
      recommendation: { in: ['GO', 'REVIEW'] }
    }
  },
  include: { assessment: true, progress: true }
})

// Update progress stage
await prisma.opportunityProgress.upsert({
  where: { opportunityId: id },
  update: { currentStage: 'SOW_CREATION', completionPct: 40 },
  create: { opportunityId: id, currentStage: 'SOW_CREATION', completionPct: 40 }
})
```

## Migration Commands
```bash
npx prisma migrate dev --name <migration-name>  # Create + apply migration
npx prisma generate                              # Regenerate client after schema change
npx prisma studio                               # Browse DB
npx prisma db push                              # Push schema without migration (dev only)
```
