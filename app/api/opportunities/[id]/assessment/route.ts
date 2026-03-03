import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/opportunities/[id]/assessment - Get assessment for an opportunity
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const assessment = await prisma.opportunityAssessment.findUnique({
      where: { opportunityId: id },
      include: {
        assessedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/opportunities/[id]/assessment - Create or update assessment
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
    const body = await req.json()

    const {
      estimatedValue,
      estimatedCost,
      strategicValue,
      riskLevel,
      recommendation,
      notes,
    } = body

    // Validate required fields
    if (estimatedValue === undefined || estimatedCost === undefined) {
      return NextResponse.json(
        { error: 'Estimated value and cost are required' },
        { status: 400 }
      )
    }

    // Calculate profit margins
    const profitMarginDollar = estimatedValue - estimatedCost
    const profitMarginPercent = estimatedValue > 0
      ? (profitMarginDollar / estimatedValue) * 100
      : 0

    // Determine if meets margin target (>10%)
    const meetsMarginTarget = profitMarginPercent >= 10

    // Auto-determine recommendation based on margin
    let autoRecommendation = recommendation
    if (!autoRecommendation) {
      if (profitMarginPercent >= 20) {
        autoRecommendation = 'GO'
      } else if (profitMarginPercent >= 10) {
        autoRecommendation = 'REVIEW'
      } else {
        autoRecommendation = 'NO_GO'
      }
    }

    // Check if assessment exists
    const existing = await prisma.opportunityAssessment.findUnique({
      where: { opportunityId: id },
    })

    let assessment
    if (existing) {
      // Update existing assessment
      assessment = await prisma.opportunityAssessment.update({
        where: { opportunityId: id },
        data: {
          estimatedValue,
          estimatedCost,
          profitMarginDollar,
          profitMarginPercent,
          meetsMarginTarget,
          strategicValue: strategicValue || existing.strategicValue,
          riskLevel: riskLevel || existing.riskLevel,
          recommendation: autoRecommendation,
          notes: notes || existing.notes,
          assessedById: session.user.id,
          assessedAt: new Date(),
        },
        include: {
          assessedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    } else {
      // Create new assessment
      assessment = await prisma.opportunityAssessment.create({
        data: {
          opportunityId: id,
          estimatedValue,
          estimatedCost,
          profitMarginDollar,
          profitMarginPercent,
          meetsMarginTarget,
          strategicValue,
          riskLevel,
          recommendation: autoRecommendation,
          notes,
          assessedById: session.user.id,
        },
        include: {
          assessedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Update opportunity progress to ASSESSMENT stage
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
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Error creating/updating assessment:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
