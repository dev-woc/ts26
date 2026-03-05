import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

/**
 * PATCH /api/opportunities/[id]/attachments/[attachmentId]/form-data
 * Body: { fields: Record<string, string> }
 *
 * Saves AcroForm field values for a detected government form attachment.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, attachmentId } = await params
    const body = await request.json()
    const { fields } = body as { fields?: Record<string, string> }

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'fields must be an object' }, { status: 400 })
    }

    const record = await prisma.attachmentFormData.upsert({
      where: { opportunityId_attachmentId: { opportunityId: id, attachmentId } },
      create: {
        opportunityId: id,
        attachmentId,
        fields,
        filledAt: new Date(),
        filledById: session.user.id,
      },
      update: {
        fields,
        filledAt: new Date(),
        filledById: session.user.id,
      },
    })

    return NextResponse.json({
      formData: {
        aiSuggestedName: record.aiSuggestedName,
        aiConfidence: record.aiConfidence,
        isForm: record.isForm,
        formType: record.formType,
        fields: record.fields as Record<string, string> | null,
        filledAt: record.filledAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Form data save error:', error)
    return NextResponse.json({ error: 'Failed to save form data' }, { status: 500 })
  }
}
