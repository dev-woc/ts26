import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractAttachmentsFromRawData } from '@/lib/samgov'

/**
 * GET /api/opportunities/[id]/attachments/[attachmentId]/proxy
 * Proxies SAM.gov attachment downloads server-side to avoid CORS/redirect issues.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: { rawData: true },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const attachments = extractAttachmentsFromRawData(opportunity.rawData)
    const attachment = attachments.find(a => a.id === attachmentId)

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Fetch the file server-side, following redirects
    try {
      const response = await fetch(attachment.url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'USHER/1.0',
          'Accept': '*/*',
        },
      })

      if (!response.ok) {
        // Redirect to original URL as fallback
        return NextResponse.redirect(attachment.url)
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const data = await response.arrayBuffer()

      // Sanitize filename for Content-Disposition header
      const safeFilename = attachment.name.replace(/[^\w.\-\s]/g, '_')

      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${safeFilename}"`,
          'Content-Length': data.byteLength.toString(),
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch (fetchError) {
      console.warn(`Proxy fetch failed for attachment ${attachmentId}, redirecting to original URL`)
      return NextResponse.redirect(attachment.url)
    }
  } catch (error) {
    console.error('Attachment proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy attachment' },
      { status: 500 }
    )
  }
}
