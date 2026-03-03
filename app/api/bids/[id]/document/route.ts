import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/bids/[id]/document - Get bid document content
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
          include: {
            subcontractors: true,
          },
        },
        user: {
          select: { name: true },
        },
      },
    })

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // If content already exists, return it
    if (bid.content) {
      return NextResponse.json({
        success: true,
        content: bid.content,
      })
    }

    // Generate default content from bid data
    const defaultContent = {
      header: {
        title: 'BID PROPOSAL',
        date: new Date().toLocaleDateString(),
        bid_id: `BID-${bid.id.substring(0, 8).toUpperCase()}`,
        prepared_for: bid.opportunity.agency || 'Government Agency',
        prepared_by: bid.user?.name || session.user.name || 'USHER Team',
      },
      opportunity: {
        title: bid.opportunity.title,
        solicitation_number: bid.opportunity.solicitationNumber,
        agency: bid.opportunity.agency || '',
        naics_code: bid.opportunity.naicsCode || '',
      },
      pricing: {
        recommended_price: bid.recommendedPrice,
        cost_basis: bid.costBasis || bid.recommendedPrice * 0.75,
        gross_margin: bid.grossMargin || 25,
        confidence: bid.confidence || 'medium',
        source: bid.source || 'default_fallback',
      },
      sections: [
        {
          title: 'Executive Summary',
          content:
            'This proposal outlines our comprehensive approach to fulfilling the requirements specified in the solicitation. Our team brings extensive experience and proven capabilities to deliver exceptional results within budget and schedule constraints.',
        },
        {
          title: 'Technical Approach',
          content:
            'Our technical approach leverages industry best practices and innovative solutions tailored to meet the specific requirements of this contract. We will employ a phased implementation strategy to ensure quality deliverables and minimize risk.',
        },
        {
          title: 'Management Approach',
          content:
            'Our management team will implement robust project controls, regular status reporting, and proactive risk management to ensure successful contract execution. We maintain clear communication channels and escalation procedures.',
        },
        {
          title: 'Past Performance',
          content:
            'Our organization has a demonstrated track record of successfully delivering similar projects for government clients. We have consistently met or exceeded performance standards while maintaining strong customer relationships.',
        },
        {
          title: 'Quality Assurance',
          content:
            'We maintain a comprehensive quality management system that ensures all deliverables meet or exceed specified requirements. Our QA processes include regular reviews, testing protocols, and continuous improvement initiatives.',
        },
      ],
      subcontractor_estimates: bid.opportunity.subcontractors.map((sub) => ({
        name: sub.name,
        service: sub.service || 'General Services',
        estimated_cost: 0, // Will be updated from quotes
        is_actual_quote: false,
      })),
    }

    return NextResponse.json({
      success: true,
      content: defaultContent,
    })
  } catch (error) {
    console.error('Error fetching bid document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/bids/[id]/document - Update bid document content
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
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const bid = await prisma.bid.update({
      where: { id },
      data: {
        content,
      },
    })

    return NextResponse.json({
      success: true,
      bid,
    })
  } catch (error) {
    console.error('Error updating bid document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
