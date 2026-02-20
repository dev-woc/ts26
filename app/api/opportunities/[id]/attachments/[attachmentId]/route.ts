import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { extractAttachmentsFromRawData } from '@/lib/samgov'
import type { RichAttachment } from '@/lib/types/attachment'

// Characters not allowed in filenames
const INVALID_CHARS = /[/\\:*?"<>|]/

/**
 * Extract the file extension from a filename (including the dot).
 * Returns '' if no extension found.
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) return ''
  return filename.slice(lastDot)
}

/**
 * PATCH /api/opportunities/[id]/attachments/[attachmentId]
 * Body: { currentName: string }
 *
 * Renames an attachment's working name. Validates that:
 * - currentName is non-empty
 * - currentName has no invalid filesystem characters
 * - Extension is unchanged from the original SAM.gov filename
 * - Name is not a duplicate of another attachment in this opportunity
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params

    const session = await auth()
    const userId = session?.user?.id as string | undefined

    const body = await request.json()
    const { currentName } = body as { currentName?: string }

    // --- Validation ---
    if (!currentName || !currentName.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    const trimmedName = currentName.trim()

    if (INVALID_CHARS.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Name contains invalid characters (/ \\ : * ? " < > |)' },
        { status: 400 }
      )
    }

    // Load opportunity to get the raw attachment data
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: {
        rawData: true,
        attachmentOverrides: {
          select: {
            attachmentId: true,
            originalName: true,
            currentName: true,
          },
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Find the original SAM.gov attachment
    const rawAttachments = extractAttachmentsFromRawData(opportunity.rawData)
    const rawAttachment = rawAttachments.find((a) => a.id === attachmentId)

    if (!rawAttachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const originalName = rawAttachment.name
    const originalExt = getExtension(originalName)
    const newExt = getExtension(trimmedName)

    // Extension must stay the same
    if (originalExt.toLowerCase() !== newExt.toLowerCase()) {
      return NextResponse.json(
        {
          error: originalExt
            ? `Extension must remain "${originalExt}"`
            : 'Cannot add an extension to a file that has none',
        },
        { status: 400 }
      )
    }

    // Check for duplicate names within this opportunity
    // (compare against all overrides except this attachment itself,
    //  and against the original names of non-overridden attachments)
    const overrideMap = new Map(
      opportunity.attachmentOverrides.map((o) => [o.attachmentId, o])
    )

    const allCurrentNames = rawAttachments
      .filter((a) => a.id !== attachmentId)
      .map((a) => {
        const override = overrideMap.get(a.id)
        return (override?.currentName ?? a.name).toLowerCase()
      })

    if (allCurrentNames.includes(trimmedName.toLowerCase())) {
      return NextResponse.json(
        { error: 'Name already in use by another attachment' },
        { status: 400 }
      )
    }

    // --- Upsert AttachmentOverride ---
    const existingOverride = await prisma.attachmentOverride.findUnique({
      where: { opportunityId_attachmentId: { opportunityId: id, attachmentId } },
    })

    let override
    if (existingOverride) {
      // Append history entry for previous name, then update
      await prisma.attachmentEditHistory.create({
        data: {
          overrideId: existingOverride.id,
          previousName: existingOverride.currentName,
          newName: trimmedName,
          editedById: userId ?? null,
        },
      })
      override = await prisma.attachmentOverride.update({
        where: { opportunityId_attachmentId: { opportunityId: id, attachmentId } },
        data: {
          currentName: trimmedName,
          editedById: userId ?? null,
        },
        include: { editedBy: { select: { name: true, email: true } } },
      })
    } else {
      override = await prisma.attachmentOverride.create({
        data: {
          opportunityId: id,
          attachmentId,
          originalName,
          currentName: trimmedName,
          editedById: userId ?? null,
        },
        include: { editedBy: { select: { name: true, email: true } } },
      })
      // First rename — record initial history
      await prisma.attachmentEditHistory.create({
        data: {
          overrideId: override.id,
          previousName: originalName,
          newName: trimmedName,
          editedById: userId ?? null,
        },
      })
    }

    const richAttachment: RichAttachment = {
      id: attachmentId,
      originalName,
      currentName: override.currentName,
      isEdited: override.currentName !== originalName,
      url: rawAttachment.url,
      type: rawAttachment.type,
      size: rawAttachment.size,
      postedDate: rawAttachment.postedDate,
      editedAt: override.editedAt.toISOString(),
      editedBy: override.editedBy?.name || override.editedBy?.email || undefined,
    }

    return NextResponse.json({ attachment: richAttachment })
  } catch (error) {
    console.error('Attachment rename error:', error)
    return NextResponse.json(
      { error: 'Failed to rename attachment' },
      { status: 500 }
    )
  }
}
