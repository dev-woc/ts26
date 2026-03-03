import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all assessments
    const assessments = await prisma.opportunityAssessment.findMany({
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
          },
        },
        assessedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        assessedAt: 'desc',
      },
    })

    // Calculate statistics
    const totalAssessments = assessments.length
    const goCount = assessments.filter((a) => a.recommendation === 'GO').length
    const reviewCount = assessments.filter((a) => a.recommendation === 'REVIEW').length
    const noGoCount = assessments.filter((a) => a.recommendation === 'NO_GO').length

    // Calculate average profit margin (only for assessments with valid data)
    const validMargins = assessments
      .filter((a) => a.profitMarginPercent !== null)
      .map((a) => a.profitMarginPercent as number)

    const avgProfitMargin = validMargins.length > 0
      ? validMargins.reduce((sum, margin) => sum + margin, 0) / validMargins.length
      : 0

    // Calculate total potential value and profit
    const totalEstimatedValue = assessments
      .filter((a) => a.estimatedValue !== null)
      .reduce((sum, a) => sum + (a.estimatedValue as number), 0)

    const totalEstimatedProfit = assessments
      .filter((a) => a.profitMarginDollar !== null)
      .reduce((sum, a) => sum + (a.profitMarginDollar as number), 0)

    // Get assessments that meet margin target
    const meetsTargetCount = assessments.filter((a) => a.meetsMarginTarget).length

    // Recent assessments (last 5)
    const recentAssessments = assessments.slice(0, 5).map((a) => ({
      id: a.id,
      opportunityId: a.opportunityId,
      opportunityTitle: a.opportunity.title,
      solicitationNumber: a.opportunity.solicitationNumber,
      estimatedValue: a.estimatedValue,
      estimatedCost: a.estimatedCost,
      profitMarginPercent: a.profitMarginPercent,
      profitMarginDollar: a.profitMarginDollar,
      recommendation: a.recommendation,
      strategicValue: a.strategicValue,
      riskLevel: a.riskLevel,
      assessedAt: a.assessedAt,
      assessedBy: a.assessedBy.name,
    }))

    return NextResponse.json({
      stats: {
        totalAssessments,
        goCount,
        reviewCount,
        noGoCount,
        avgProfitMargin,
        totalEstimatedValue,
        totalEstimatedProfit,
        meetsTargetCount,
      },
      recentAssessments,
    })
  } catch (error) {
    console.error('Error fetching assessment stats:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
