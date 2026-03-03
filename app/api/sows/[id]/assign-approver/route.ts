import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * POST /api/sows/[id]/assign-approver
 * Assign an approver to a SOW (ADMIN only)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN can assign approvers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { approverId } = body

    if (!approverId) {
      return NextResponse.json(
        { error: 'Approver ID is required' },
        { status: 400 }
      )
    }

    // Verify SOW exists
    const sow = await prisma.sOW.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            title: true,
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

    // Verify approver exists and is a valid user
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!approver) {
      return NextResponse.json(
        { error: 'Approver not found' },
        { status: 404 }
      )
    }

    // Viewers cannot be approvers
    if (approver.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot be assigned as approvers' },
        { status: 400 }
      )
    }

    // Update SOW with new approver
    const updatedSow = await prisma.sOW.update({
      where: { id },
      data: {
        currentApproverId: approverId,
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
        currentApprover: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create activity record
    await prisma.sOWActivity.create({
      data: {
        sowId: id,
        type: 'UPDATED',
        description: `Approver assigned: ${approver.name || approver.email}`,
        userId: session.user.id,
        metadata: {
          approverId,
          approverName: approver.name,
          approverEmail: approver.email,
          previousApproverId: sow.currentApproverId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      sow: updatedSow,
      message: `Approver assigned successfully to ${approver.name || approver.email}`,
    })
  } catch (error) {
    console.error('Error assigning approver:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
