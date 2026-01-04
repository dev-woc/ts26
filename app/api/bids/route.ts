import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { opportunityId } = body

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      )
    }

    // Check if opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId }
    })

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // Create a basic bid (Phase 3 will add pricing analysis)
    const bid = await prisma.bid.create({
      data: {
        opportunityId,
        userId: session.user.id,
        recommendedPrice: 100000, // Placeholder - Phase 3 will calculate this
        status: 'DRAFT',
        confidence: 'low',
        source: 'manual',
        notes: 'Bid created manually. Pricing analysis pending.',
      }
    })

    return NextResponse.json({
      success: true,
      bid,
    })

  } catch (error) {
    console.error('Error creating bid:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const opportunityId = searchParams.get('opportunityId')
    const status = searchParams.get('status')

    const where: any = {}

    if (opportunityId) {
      where.opportunityId = opportunityId
    }

    if (status) {
      where.status = status
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
            agency: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      bids,
      count: bids.length,
    })

  } catch (error) {
    console.error('Error fetching bids:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
