/**
 * Backfill real descriptions from SAM.gov for all opportunities
 * whose description field is currently a URL.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SAM_API_KEY = process.env.SAM_GOV_API_KEY || ''

async function fetchDescription(descUrl: string): Promise<string> {
  try {
    const url = new URL(descUrl)
    if (!url.searchParams.has('api_key') && SAM_API_KEY) {
      url.searchParams.set('api_key', SAM_API_KEY)
    }

    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
    if (!res.ok) return ''

    const data = await res.json()
    let html = data.description || ''

    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/?(h[1-6]|div|section|article|header|footer|nav)[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#?\w+;/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } catch {
    return ''
  }
}

async function backfill() {
  const opps = await prisma.opportunity.findMany({
    where: {
      description: { startsWith: 'http' },
    },
    select: { id: true, solicitationNumber: true, description: true },
  })

  console.log(`${opps.length} opportunities need description backfill\n`)

  let updated = 0
  let failed = 0

  for (const opp of opps) {
    const desc = await fetchDescription(opp.description!)
    if (desc && desc.length > 5) {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: { description: desc.substring(0, 10000) },
      })
      updated++
      console.log(`  [${updated}] ${opp.solicitationNumber}: ${desc.substring(0, 80)}...`)
    } else {
      failed++
      console.log(`  SKIP ${opp.solicitationNumber}: no description content`)
    }

    // Rate limit — don't hammer SAM.gov
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nDone: ${updated} updated, ${failed} skipped`)
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
