import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all bids
    const bids = await prisma.bid.findMany({
      select: {
        id: true,
        status: true,
        source: true,
        opportunitySize: true,
        recommendedPrice: true,
        createdAt: true,
        submittedAt: true,
      },
    })

    // Summary calculations
    const totalBids = bids.length
    const submittedBids = bids.filter(
      (b) => b.status === 'SUBMITTED' || b.status === 'AWARDED' || b.status === 'REJECTED'
    ).length
    const awardedBids = bids.filter((b) => b.status === 'AWARDED').length
    const rejectedBids = bids.filter((b) => b.status === 'REJECTED').length
    const pendingBids = bids.filter(
      (b) => b.status === 'DRAFT' || b.status === 'REVIEWED'
    ).length

    const winRate = submittedBids > 0 ? (awardedBids / submittedBids) * 100 : 0

    // Group by quarter
    const quarterMap = new Map<string, {
      submitted: number
      awarded: number
      rejected: number
    }>()

    for (const bid of bids) {
      if (!['SUBMITTED', 'AWARDED', 'REJECTED'].includes(bid.status)) continue

      const date = bid.submittedAt || bid.createdAt
      const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`

      if (!quarterMap.has(quarter)) {
        quarterMap.set(quarter, { submitted: 0, awarded: 0, rejected: 0 })
      }

      const q = quarterMap.get(quarter)!
      q.submitted++
      if (bid.status === 'AWARDED') q.awarded++
      if (bid.status === 'REJECTED') q.rejected++
    }

    const byQuarter = Array.from(quarterMap.entries())
      .map(([quarter, data]) => ({
        quarter,
        ...data,
        winRate: data.submitted > 0 ? (data.awarded / data.submitted) * 100 : 0,
      }))
      .sort((a, b) => {
        // Sort by year then quarter
        const [qa, ya] = a.quarter.replace('Q', '').split(' ')
        const [qb, yb] = b.quarter.replace('Q', '').split(' ')
        return Number(ya) - Number(yb) || Number(qa) - Number(qb)
      })

    // Group by size
    const sizeMap = new Map<string, {
      submitted: number
      awarded: number
      rejected: number
      totalValue: number
    }>()

    for (const bid of bids) {
      if (!['SUBMITTED', 'AWARDED', 'REJECTED'].includes(bid.status)) continue

      const size = bid.opportunitySize || 'Unknown'

      if (!sizeMap.has(size)) {
        sizeMap.set(size, { submitted: 0, awarded: 0, rejected: 0, totalValue: 0 })
      }

      const s = sizeMap.get(size)!
      s.submitted++
      s.totalValue += bid.recommendedPrice
      if (bid.status === 'AWARDED') s.awarded++
      if (bid.status === 'REJECTED') s.rejected++
    }

    const sizeOrder = ['Large', 'Medium', 'Small', 'Micro', 'Unknown']
    const bySize = Array.from(sizeMap.entries())
      .map(([size, data]) => ({
        size,
        ...data,
        winRate: data.submitted > 0 ? (data.awarded / data.submitted) * 100 : 0,
      }))
      .sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size))

    // Group by source
    const sourceMap = new Map<string, {
      submitted: number
      awarded: number
    }>()

    for (const bid of bids) {
      if (!['SUBMITTED', 'AWARDED', 'REJECTED'].includes(bid.status)) continue

      const source = bid.source || 'unknown'

      if (!sourceMap.has(source)) {
        sourceMap.set(source, { submitted: 0, awarded: 0 })
      }

      const src = sourceMap.get(source)!
      src.submitted++
      if (bid.status === 'AWARDED') src.awarded++
    }

    const bySource = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        ...data,
        winRate: data.submitted > 0 ? (data.awarded / data.submitted) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)

    return NextResponse.json({
      summary: {
        totalBids,
        submittedBids,
        awardedBids,
        rejectedBids,
        pendingBids,
        winRate,
      },
      byQuarter,
      bySize,
      bySource,
    })
  } catch (error) {
    console.error('Error fetching win rate data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
