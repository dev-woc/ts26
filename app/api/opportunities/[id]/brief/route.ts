import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateOpportunityBrief } from '@/lib/openai'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        agency: true,
        solicitationNumber: true,
        naicsCode: true,
        description: true,
        rawData: true,
        parsedAttachments: true,
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Extract set-aside from rawData if present
    const rawData = opportunity.rawData as Record<string, unknown> | null
    const setAside = (rawData?.typeOfSetAside as string) || (rawData?.setAside as string) || null

    const brief = await generateOpportunityBrief({
      title: opportunity.title,
      agency: opportunity.agency || 'Unknown Agency',
      solicitationNumber: opportunity.solicitationNumber,
      naicsCode: opportunity.naicsCode,
      setAside,
      description: opportunity.description,
      rawData,
      parsedAttachments: opportunity.parsedAttachments as {
        structured?: {
          scope?: string[]
          deliverables?: string[]
          compliance?: string[]
          periodOfPerformance?: string[]
          placeOfPerformance?: string
        }
      } | null,
    })

    // Cache brief on the opportunity
    await prisma.opportunity.update({
      where: { id },
      data: { opportunityBrief: brief as object },
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('Brief generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brief' },
      { status: 500 }
    )
  }
}
