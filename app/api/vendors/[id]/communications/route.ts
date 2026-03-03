import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    const communications = await prisma.vendorCommunication.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      communications,
    })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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
    const { type, subject, content, sowId } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Create communication record
    const communication = await prisma.vendorCommunication.create({
      data: {
        vendorId: id,
        type: type || 'NOTE',
        subject,
        content,
        sentAt: type === 'EMAIL' ? new Date() : null,
        sowId: sowId || null,
      },
    })

    // Update vendor's lastContacted
    await prisma.vendor.update({
      where: { id },
      data: { lastContacted: new Date() },
    })

    // If it's an email type, attempt to send via email service
    if (type === 'EMAIL' && vendor.email) {
      try {
        const { sendEmail } = await import('@/lib/email')
        await sendEmail({
          to: vendor.email,
          subject,
          body: content,
        })
      } catch (emailError) {
        console.warn('Email sending failed (service may not be configured):', emailError)
        // Don't fail the request - communication is still logged
      }
    }

    return NextResponse.json({
      success: true,
      communication,
    })
  } catch (error) {
    console.error('Error creating communication:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
