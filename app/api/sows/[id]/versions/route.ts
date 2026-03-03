import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadSOWPDF } from '@/lib/storage'
import { generateSOWFileName, canCreateVersion } from '@/lib/sow-utils'

/**
 * GET /api/sows/[id]/versions
 * Get all versions of a SOW
 */
export async function GET(
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

    const { id } = await params

    // Fetch all versions
    const versions = await prisma.sOWVersion.findMany({
      where: { sowId: id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        versionNumber: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      versions,
    })
  } catch (error) {
    console.error('Error fetching versions:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sows/[id]/versions
 * Create a new version of a SOW
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

    const { id } = await params
    const body = await req.json()
    const { changesSummary, regenerate = false } = body

    if (!changesSummary) {
      return NextResponse.json(
        { error: 'Changes summary is required' },
        { status: 400 }
      )
    }

    // Fetch current SOW
    const currentSow = await prisma.sOW.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            solicitationNumber: true,
            naicsCode: true,
            agency: true,
            description: true,
          },
        },
      },
    })

    if (!currentSow) {
      return NextResponse.json(
        { error: 'SOW not found' },
        { status: 404 }
      )
    }

    // Check if new version can be created
    if (!canCreateVersion(currentSow.status)) {
      return NextResponse.json(
        { error: 'Cannot create version from SUPERSEDED SOW' },
        { status: 400 }
      )
    }

    // Only creator or ADMIN can create versions
    if (
      session.user.role !== 'ADMIN' &&
      currentSow.generatedById !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Only the creator or ADMIN can create versions' },
        { status: 403 }
      )
    }

    const newVersionNumber = currentSow.version + 1

    let newFileUrl = currentSow.fileUrl
    let newFileName = currentSow.fileName
    let newFileSize = currentSow.fileSize

    // If regenerate is true, call Python generator again
    if (regenerate && currentSow.opportunity) {
      // Get subcontractor from metadata
      const subcontractorId = currentSow.metadata
        ? (currentSow.metadata as any).subcontractorId
        : null
      const subcontractor = subcontractorId
        ? await prisma.subcontractor.findUnique({ where: { id: subcontractorId } })
        : null

      // Generate new SOW ID
      const newSowId = `SOW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Call Python generator
      const pythonUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const pythonResponse = await fetch(`${pythonUrl}/api/python/generate_sow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfp_data: {
            title: currentSow.opportunity.title,
            solicitation_number: currentSow.opportunity.solicitationNumber,
            naics_code: currentSow.opportunity.naicsCode || 'N/A',
            agency: currentSow.opportunity.agency || 'Government Agency',
            description: currentSow.opportunity.description || '',
          },
          subcontractor: subcontractor
            ? {
                name: subcontractor.name,
                email: subcontractor.email || undefined,
                phone: subcontractor.phone || undefined,
              }
            : { name: 'Subcontractor' },
          sow_id: newSowId,
        }),
      })

      if (!pythonResponse.ok) {
        throw new Error('PDF regeneration failed')
      }

      const pdfData = await pythonResponse.json()
      const pdfBuffer = Buffer.from(pdfData.pdf_base64, 'base64')

      // Generate new filename
      newFileName = generateSOWFileName(
        currentSow.opportunity.solicitationNumber,
        newVersionNumber
      )

      // Upload to Vercel Blob
      const uploadResult = await uploadSOWPDF(pdfBuffer, newFileName, newSowId)
      newFileUrl = uploadResult.url
      newFileSize = uploadResult.size
    } else {
      // Copy existing file (just increment version in filename)
      newFileName = generateSOWFileName(
        currentSow.opportunity.solicitationNumber,
        newVersionNumber
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create version record for current SOW
      await tx.sOWVersion.create({
        data: {
          sowId: id,
          versionNumber: currentSow.version,
          changesSummary: 'Initial version',
          fileUrl: currentSow.fileUrl!,
          fileName: currentSow.fileName!,
          fileSize: currentSow.fileSize,
          createdById: currentSow.generatedById!,
        },
      })

      // 2. Mark current SOW as SUPERSEDED
      await tx.sOW.update({
        where: { id },
        data: { status: 'SUPERSEDED' },
      })

      // 3. Create new SOW with incremented version
      const newSow = await tx.sOW.create({
        data: {
          opportunityId: currentSow.opportunityId,
          version: newVersionNumber,
          fileUrl: newFileUrl,
          fileName: newFileName,
          fileSize: newFileSize,
          status: 'DRAFT',
          generatedById: session.user.id,
          notes: currentSow.notes,
          metadata: {
            ...(currentSow.metadata as any),
            previousVersion: currentSow.id,
            changesSummary,
          },
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

      // 4. Create version record for new SOW
      await tx.sOWVersion.create({
        data: {
          sowId: newSow.id,
          versionNumber: newVersionNumber,
          changesSummary,
          fileUrl: newFileUrl!,
          fileName: newFileName!,
          fileSize: newFileSize,
          createdById: session.user.id,
        },
      })

      // 5. Create activity for new SOW
      await tx.sOWActivity.create({
        data: {
          sowId: newSow.id,
          type: 'VERSION_CREATED',
          description: `Version ${newVersionNumber} created${regenerate ? ' (regenerated)' : ''}: ${changesSummary}`,
          userId: session.user.id,
          metadata: {
            previousVersion: currentSow.version,
            newVersion: newVersionNumber,
            changesSummary,
            regenerated: regenerate,
          },
        },
      })

      return newSow
    })

    return NextResponse.json({
      success: true,
      sow: result,
      message: `Version ${newVersionNumber} created successfully`,
    })
  } catch (error) {
    console.error('Error creating version:', error)

    // Log error
    try {
      await prisma.systemLog.create({
        data: {
          level: 'ERROR',
          message: 'SOW version creation failed',
          context: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
