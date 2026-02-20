/**
 * scripts/migrate-attachments.ts
 *
 * Pre-flight validation and migration utility for AttachmentOverride data.
 *
 * Usage:
 *   npx tsx scripts/migrate-attachments.ts --dry-run   # validates, no writes
 *   npx tsx scripts/migrate-attachments.ts             # applies migration
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const isDryRun = process.argv.includes('--dry-run')

async function main() {
  const startedAt = new Date()
  console.log(`\n━━━ USHER Attachment Migration ━━━`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no writes)' : 'LIVE'}`)
  console.log(`Started: ${startedAt.toISOString()}\n`)

  // ── 1. Count opportunities with attachments ──────────────────────────────
  const allOpportunities = await prisma.opportunity.findMany({
    select: { id: true, solicitationNumber: true, rawData: true },
  })

  let opportunitiesWithAttachments = 0
  let totalAttachmentCount = 0

  for (const opp of allOpportunities) {
    const rawData = opp.rawData as any
    const resourceLinks: unknown[] = rawData?.resourceLinks ?? []
    const count = Array.isArray(resourceLinks) ? resourceLinks.length : 0
    if (count > 0) {
      opportunitiesWithAttachments++
      totalAttachmentCount += count
    }
  }

  console.log(`Opportunities total:               ${allOpportunities.length}`)
  console.log(`Opportunities with attachments:    ${opportunitiesWithAttachments}`)
  console.log(`Total SAM.gov attachments (approx):${totalAttachmentCount}`)

  // ── 2. Count existing overrides ──────────────────────────────────────────
  const existingOverrideCount = await prisma.attachmentOverride.count()
  const existingHistoryCount = await prisma.attachmentEditHistory.count()

  console.log(`\nExisting AttachmentOverride rows:  ${existingOverrideCount}`)
  console.log(`Existing AttachmentEditHistory rows:${existingHistoryCount}`)

  // ── 3. Schema drift detection ────────────────────────────────────────────
  // Verify that override data still references valid opportunity IDs
  const overrides = await prisma.attachmentOverride.findMany({
    select: { id: true, opportunityId: true, attachmentId: true, currentName: true, originalName: true },
  })

  const opportunityIds = new Set(allOpportunities.map((o) => o.id))
  const orphanedOverrides = overrides.filter((o) => !opportunityIds.has(o.opportunityId))

  // Detect overrides where currentName === originalName (no actual rename took place)
  const noOpRenames = overrides.filter((o) => o.currentName === o.originalName)

  console.log(`\nSchema drift checks:`)
  console.log(`  Orphaned overrides (opp deleted): ${orphanedOverrides.length}`)
  console.log(`  No-op renames (name unchanged):   ${noOpRenames.length}`)

  if (orphanedOverrides.length > 0) {
    console.warn(`\n⚠ WARNING: ${orphanedOverrides.length} override(s) reference deleted opportunities.`)
    orphanedOverrides.forEach((o) => {
      console.warn(`    override ${o.id} → opportunityId ${o.opportunityId} (missing)`)
    })
  }

  // ── 4. Apply migration (remove orphaned overrides) ───────────────────────
  if (!isDryRun && orphanedOverrides.length > 0) {
    const ids = orphanedOverrides.map((o) => o.id)
    await prisma.attachmentEditHistory.deleteMany({ where: { overrideId: { in: ids } } })
    await prisma.attachmentOverride.deleteMany({ where: { id: { in: ids } } })
    console.log(`\n✓ Deleted ${orphanedOverrides.length} orphaned override(s).`)
  } else if (isDryRun && orphanedOverrides.length > 0) {
    console.log(`\n  (dry-run) Would delete ${orphanedOverrides.length} orphaned override(s).`)
  }

  // ── 5. Log migration run to SystemLog ────────────────────────────────────
  const summary = {
    mode: isDryRun ? 'dry_run' : 'live',
    opportunitiesTotal: allOpportunities.length,
    opportunitiesWithAttachments,
    totalAttachmentCount,
    existingOverrides: existingOverrideCount,
    existingHistory: existingHistoryCount,
    orphanedOverrides: orphanedOverrides.length,
    noOpRenames: noOpRenames.length,
    ranAt: startedAt.toISOString(),
  }

  if (!isDryRun) {
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Attachment migration script executed',
        context: summary,
      },
    })
    console.log(`\n✓ Migration run logged to SystemLog.`)
  }

  // ── 6. Final summary ─────────────────────────────────────────────────────
  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()

  console.log(`\n━━━ Summary ━━━`)
  console.log(JSON.stringify(summary, null, 2))
  console.log(`\nCompleted in ${durationMs}ms`)
  if (isDryRun) {
    console.log(`\nThis was a dry run — no data was written.`)
    console.log(`Run without --dry-run to apply changes.`)
  }
}

main()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
