import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * POST /api/sows/[id]/accept
 * Mark SOW as accepted by subcontractor
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication (optional for token-based access)
    const session = await auth()

    // TODO: Add token-based authentication for subcontractors
    // For now, allow both authenticated and unauthenticated access
    // In production, verify token matches the SOW's sentToEmail

    const { id } = await params

    // Fetch SOW
    const sow = await prisma.sOW.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            title: true,
            solicitationNumber: true,
          },
        },
      },
    })

    if (!sow) {
      return NextResponse.json(
        { error: 'SOW not found' },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (sow.status === 'ACCEPTED') {
      return NextResponse.json({
        success: true,
        message: 'SOW was already accepted',
        sow,
      })
    }

    // Check if SOW has been sent
    if (sow.status !== 'SENT' && sow.status !== 'VIEWED') {
      return NextResponse.json(
        { error: 'SOW has not been sent yet' },
        { status: 400 }
      )
    }

    // Update SOW status to ACCEPTED
    const updatedSow = await prisma.sOW.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create activity record
    await prisma.sOWActivity.create({
      data: {
        sowId: id,
        type: 'ACCEPTED',
        description: `SOW accepted by ${sow.sentToEmail || 'subcontractor'}`,
        userId: session?.user?.id || null,
        metadata: {
          acceptedBy: session?.user?.email || sow.sentToEmail || 'unknown',
          acceptedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      sow: updatedSow,
      message: 'SOW accepted successfully',
    })
  } catch (error) {
    console.error('Error accepting SOW:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
