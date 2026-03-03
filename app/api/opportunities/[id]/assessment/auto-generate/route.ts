import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPricingRecommendation } from '@/lib/usaspending'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if assessment already exists
    const existingAssessment = await prisma.opportunityAssessment.findUnique({
      where: { opportunityId: id },
    })

    if (existingAssessment) {
      return NextResponse.json({ assessment: existingAssessment })
    }

    // Get opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Get pricing recommendation from USASpending
    const pricingAnalysis = await getPricingRecommendation({
      naicsCode: opportunity.naicsCode,
      title: opportunity.title,
      agency: opportunity.agency,
    })

    // Calculate values
    const recommendedPrice = pricingAnalysis.recommendedBidPrice
    const costBasis = recommendedPrice * 0.75 // Estimate 75% cost ratio
    const potentialProfit = recommendedPrice - costBasis
    const profitMarginPercent = ((potentialProfit / recommendedPrice) * 100)
    const meetsMarginTarget = profitMarginPercent >= 10

    // Determine recommendation
    let recommendation = 'NO_GO'
    if (profitMarginPercent >= 20) recommendation = 'GO'
    else if (profitMarginPercent >= 10) recommendation = 'REVIEW'

    // Determine opportunity size and strategic value
    let opportunitySize = 'Small'
    let strategicValue: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
    if (recommendedPrice >= 10000000) {
      opportunitySize = 'Large'
      strategicValue = 'HIGH'
    } else if (recommendedPrice >= 1000000) {
      opportunitySize = 'Medium'
    } else if (recommendedPrice >= 100000) {
      opportunitySize = 'Small'
    } else {
      opportunitySize = 'Micro'
      strategicValue = 'LOW'
    }

    // Determine risk level based on data confidence
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
    if (pricingAnalysis.confidence === 'high' || pricingAnalysis.confidence === 'medium') {
      riskLevel = 'LOW'
    } else if (pricingAnalysis.confidence === 'very_low') {
      riskLevel = 'HIGH'
    }

    // Create assessment
    const assessment = await prisma.opportunityAssessment.create({
      data: {
        opportunityId: id,
        estimatedValue: recommendedPrice,
        estimatedCost: costBasis,
        profitMarginDollar: potentialProfit,
        profitMarginPercent,
        meetsMarginTarget,
        strategicValue,
        riskLevel,
        recommendation,
        notes: `Auto-generated based on ${pricingAnalysis.totalContracts} historical contracts. Confidence: ${pricingAnalysis.confidence}.`,
        assessedById: session.user.id,
      },
      include: {
        assessedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Update progress
    await prisma.opportunityProgress.upsert({
      where: { opportunityId: id },
      create: {
        opportunityId: id,
        currentStage: 'ASSESSMENT',
        completionPct: 25,
      },
      update: {
        currentStage: 'ASSESSMENT',
        completionPct: 25,
      },
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Error auto-generating assessment:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
