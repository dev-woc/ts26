import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { transformSOWToPlainLanguage } from '@/lib/openai'

/**
 * POST /api/sows/[id]/transform
 * Transform SOW sections into plain language using GPT-4o.
 * Caches the result in sow.metadata.plainLanguage.
 */
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

    const sow = await prisma.sOW.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            title: true,
            agency: true,
            solicitationNumber: true,
            responseDeadline: true,
          },
        },
      },
    })

    if (!sow) {
      return NextResponse.json({ error: 'SOW not found' }, { status: 404 })
    }

    // Only creator or ADMIN can trigger transform
    if (session.user.role !== 'ADMIN' && sow.generatedById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const content = sow.content as any
    const sections: any[] = content?.sections || []

    if (!sections.length) {
      return NextResponse.json(
        { error: 'SOW has no sections to transform' },
        { status: 400 }
      )
    }

    const plainSections = await transformSOWToPlainLanguage(sections, {
      title: sow.opportunity.title,
      agency: sow.opportunity.agency || '',
      solicitationNumber: sow.opportunity.solicitationNumber,
      deadline: sow.opportunity.responseDeadline
        ? new Date(sow.opportunity.responseDeadline).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : undefined,
    })

    const existingMetadata = (sow.metadata as Record<string, unknown>) ?? {}
    const updatedMetadata = {
      ...existingMetadata,
      plainLanguage: {
        generatedAt: new Date().toISOString(),
        generatedById: session.user.id,
        sections: plainSections,
      },
    }

    await prisma.sOW.update({
      where: { id },
      // JSON.parse/stringify strips class instances → plain InputJsonValue
      data: { metadata: JSON.parse(JSON.stringify(updatedMetadata)) },
    })

    return NextResponse.json({
      success: true,
      plainLanguage: updatedMetadata.plainLanguage,
    })
  } catch (error) {
    console.error('Error transforming SOW to plain language:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
