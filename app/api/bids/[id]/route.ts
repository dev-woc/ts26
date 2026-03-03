import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/bids/[id] - Get a single bid
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

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
            agency: true,
            department: true,
            naicsCode: true,
            postedDate: true,
            responseDeadline: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    return NextResponse.json({ bid })
  } catch (error) {
    console.error('Error fetching bid:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/bids/[id] - Update a bid
export async function PATCH(
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

    const { status, recommendedPrice, costBasis, notes, content } = body

    // Verify bid exists
    const existingBid = await prisma.bid.findUnique({
      where: { id },
    })

    if (!existingBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (status) {
      const validStatuses = ['DRAFT', 'REVIEWED', 'SUBMITTED', 'AWARDED', 'REJECTED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set submittedAt timestamp when status becomes SUBMITTED
      if (status === 'SUBMITTED' && existingBid.status !== 'SUBMITTED') {
        updateData.submittedAt = new Date()
      }
    }

    if (recommendedPrice !== undefined) {
      updateData.recommendedPrice = recommendedPrice
      const cost = costBasis ?? existingBid.costBasis
      if (cost && recommendedPrice > 0) {
        const profit = recommendedPrice - cost
        const margin = (profit / recommendedPrice) * 100
        updateData.potentialProfit = profit
        updateData.grossMargin = parseFloat(margin.toFixed(2))
      }
    }

    if (costBasis !== undefined) {
      updateData.costBasis = costBasis
      const price = recommendedPrice ?? existingBid.recommendedPrice
      if (price && price > 0) {
        const profit = price - costBasis
        const margin = (profit / price) * 100
        updateData.potentialProfit = profit
        updateData.grossMargin = parseFloat(margin.toFixed(2))
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (content !== undefined) {
      updateData.content = content
    }

    const updatedBid = await prisma.bid.update({
      where: { id },
      data: updateData,
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
            agency: true,
          },
        },
      },
    })

    // If bid was submitted, update opportunity progress
    if (status === 'SUBMITTED') {
      await prisma.opportunityProgress.upsert({
        where: { opportunityId: existingBid.opportunityId },
        update: { currentStage: 'SUBMITTED', completionPct: 100 },
        create: {
          opportunityId: existingBid.opportunityId,
          currentStage: 'SUBMITTED',
          completionPct: 100,
        },
      })
    }

    return NextResponse.json({ success: true, bid: updatedBid })
  } catch (error) {
    console.error('Error updating bid:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/bids/[id] - Delete a bid
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const bid = await prisma.bid.findUnique({
      where: { id },
    })

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // Don't allow deleting submitted bids
    if (bid.status === 'SUBMITTED' || bid.status === 'AWARDED') {
      return NextResponse.json(
        { error: 'Cannot delete a submitted or awarded bid' },
        { status: 400 }
      )
    }

    await prisma.bid.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bid:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
