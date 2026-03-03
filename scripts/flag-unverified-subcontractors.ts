/**
 * Data cleanup script: Delete all fake/simulated/ThomasNet subcontractor records.
 *
 * Run after migration:
 *   npx tsx scripts/flag-unverified-subcontractors.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all fake/simulated/ThomasNet subcontractor records...')

  const result = await prisma.subcontractor.deleteMany({
    where: {
      source: { in: ['simulated', 'thomasnet', 'legacy_simulated'] },
    },
  })

  console.log(`Deleted ${result.count} fake/simulated records`)

  const remaining = await prisma.subcontractor.count()
  const bySource = await prisma.$queryRaw`
    SELECT source, COUNT(*)::int as count
    FROM subcontractors
    GROUP BY source
  ` as Array<{ source: string; count: number }>

  console.log(`\nRemaining: ${remaining} records`)
  for (const row of bySource) {
    console.log(`  ${row.source}: ${row.count}`)
  }
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
