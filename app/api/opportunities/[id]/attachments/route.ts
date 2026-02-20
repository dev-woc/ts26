import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getOpportunityAttachments, getSamGovUrl, fetchNoticeDescription } from '@/lib/samgov'
import type { RichAttachment } from '@/lib/types/attachment'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: {
        id: true,
        solicitationNumber: true,
        description: true,
        rawData: true,
        parsedAttachments: true,
        attachmentOverrides: {
          select: {
            attachmentId: true,
            originalName: true,
            currentName: true,
            editedAt: true,
            editedBy: { select: { name: true, email: true } },
          },
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // Extract raw SAM.gov attachments
    const rawAttachments = await getOpportunityAttachments(
      opportunity.solicitationNumber,
      opportunity.rawData
    )

    // Build a lookup map of overrides keyed by attachmentId
    const overrideMap = new Map(
      opportunity.attachmentOverrides.map((o) => [o.attachmentId, o])
    )

    // Merge override data into each attachment to produce RichAttachment
    const attachments: RichAttachment[] = rawAttachments.map((att) => {
      const override = overrideMap.get(att.id)
      if (override) {
        return {
          id: att.id,
          originalName: override.originalName,
          currentName: override.currentName,
          isEdited: override.currentName !== override.originalName,
          url: att.url,
          type: att.type,
          size: att.size,
          postedDate: att.postedDate,
          editedAt: override.editedAt.toISOString(),
          editedBy: override.editedBy?.name || override.editedBy?.email || undefined,
        }
      }
      return {
        id: att.id,
        originalName: att.name,
        currentName: att.name,
        isEdited: false,
        url: att.url,
        type: att.type,
        size: att.size,
        postedDate: att.postedDate,
      }
    })

    // If the stored description is a URL, fetch the real description
    let description = opportunity.description || ''
    if (typeof description === 'string' && description.startsWith('http')) {
      const realDesc = await fetchNoticeDescription(description)
      if (realDesc) {
        description = realDesc
        await prisma.opportunity.update({
          where: { id },
          data: { description: realDesc },
        }).catch(() => {})
      }
    }

    const samGovUrl = getSamGovUrl(opportunity.solicitationNumber, opportunity.rawData as any)

    const parsedData = opportunity.parsedAttachments as any
    return NextResponse.json({
      attachments,
      samGovUrl,
      description,
      total: attachments.length,
      hasParsedContent: !!parsedData,
      parsedAttachments: parsedData || null,
    })
  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}
