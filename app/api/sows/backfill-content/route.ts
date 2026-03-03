import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
  try {
    // Check authentication - only admins can run this
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Find all SOWs (we'll filter for missing content in memory)
    const allSows = await prisma.sOW.findMany({
      include: {
        opportunity: true,
      },
    })

    // Filter for SOWs without content
    const sowsWithoutContent = allSows.filter(sow => !sow.content)

    console.log(`Found ${sowsWithoutContent.length} SOWs without content`)

    const updated = []
    const errors = []

    for (const sow of sowsWithoutContent) {
      try {
        // Extract subcontractor info from metadata
        const subcontractorName = (sow.metadata as any)?.subcontractorName || 'Subcontractor'

        // Generate structured content from opportunity data
        const structuredContent = {
          header: {
            title: 'SCOPE OF WORK (SOW)',
            date: new Date(sow.generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            sow_id: `SOW-${sow.id.slice(-8)}`,
            prepared_for: subcontractorName,
            prepared_by: '[Your Company Name]',
          },
          project: {
            title: sow.opportunity.title || 'Untitled',
            solicitation_number: sow.opportunity.solicitationNumber || 'N/A',
            agency: sow.opportunity.agency || 'Various',
            naics_code: sow.opportunity.naicsCode || 'N/A',
          },
          sections: [
            {
              title: '1.0 BACKGROUND & INTRODUCTION',
              content: `This Scope of Work (SOW) is provided by [Your Company Name] to ${subcontractorName} in connection with a proposal we are submitting to ${sow.opportunity.agency || 'the Government Agency'} under Solicitation Number ${sow.opportunity.solicitationNumber || 'N/A'}.`,
            },
            {
              title: '2.0 SCOPE OF SERVICES REQUIRED',
              content: `The Subcontractor shall provide the following services: Professional services as specified in the solicitation. Professional execution of all tasks outlined in the solicitation, compliance with all federal, state, and local regulations, and quality assurance with timely delivery of services.`,
            },
            {
              title: '3.0 PERIOD OF PERFORMANCE',
              content: 'The anticipated period of performance will align with the solicitation requirements.',
            },
            {
              title: '4.0 DELIVERABLES',
              content: 'Completion of all services outlined in Section 2.0, weekly progress reports to the Prime Contractor, and final deliverable submission upon project completion.',
            },
          ],
        }

        // Update the SOW with structured content
        await prisma.sOW.update({
          where: { id: sow.id },
          data: { content: structuredContent },
        })

        updated.push(sow.id)
        console.log(`✓ Updated SOW ${sow.id}`)
      } catch (error) {
        console.error(`✗ Failed to update SOW ${sow.id}:`, error)
        errors.push({
          sowId: sow.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${updated.length} SOWs`,
      stats: {
        total_found: sowsWithoutContent.length,
        updated: updated.length,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error backfilling SOW content:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
