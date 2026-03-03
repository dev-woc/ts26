import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MARGIN_BUCKETS = [
  { range: '25%+', min: 25, max: 100 },
  { range: '20-25%', min: 20, max: 25 },
  { range: '15-20%', min: 15, max: 20 },
  { range: '10-15%', min: 10, max: 15 },
  { range: '5-10%', min: 5, max: 10 },
  { range: '0-5%', min: 0, max: 5 },
  { range: 'Negative', min: -100, max: 0 },
]

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all opportunities with assessments
    const assessments = await prisma.opportunityAssessment.findMany({
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
          },
        },
      },
    })

    // Initialize buckets
    const bucketMap = new Map<string, {
      range: string
      min: number
      max: number
      count: number
      totalValue: number
      opportunities: Array<{
        id: string
        title: string
        solicitationNumber: string
        profitMarginPercent: number | null
        estimatedValue: number | null
      }>
    }>()

    for (const bucket of MARGIN_BUCKETS) {
      bucketMap.set(bucket.range, {
        ...bucket,
        count: 0,
        totalValue: 0,
        opportunities: [],
      })
    }

    // Process assessments
    let totalMargin = 0
    let marginCount = 0
    let meetsTargetCount = 0

    for (const assessment of assessments) {
      const margin = assessment.profitMarginPercent
      if (margin === null) continue

      marginCount++
      totalMargin += margin

      if (margin >= 10) {
        meetsTargetCount++
      }

      // Find the right bucket
      for (const bucket of MARGIN_BUCKETS) {
        if (margin >= bucket.min && margin < bucket.max) {
          const bucketData = bucketMap.get(bucket.range)!
          bucketData.count++
          bucketData.totalValue += assessment.estimatedValue || 0
          bucketData.opportunities.push({
            id: assessment.opportunity.id,
            title: assessment.opportunity.title,
            solicitationNumber: assessment.opportunity.solicitationNumber,
            profitMarginPercent: margin,
            estimatedValue: assessment.estimatedValue,
          })
          break
        }
      }
    }

    const buckets = MARGIN_BUCKETS.map((b) => bucketMap.get(b.range)!)

    return NextResponse.json({
      buckets,
      averageMargin: marginCount > 0 ? totalMargin / marginCount : 0,
      totalAssessed: marginCount,
      meetsTargetCount,
      meetsTargetPercent: marginCount > 0 ? (meetsTargetCount / marginCount) * 100 : 0,
    })
  } catch (error) {
    console.error('Error fetching margins data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
