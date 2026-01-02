import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can trigger fetches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { limit = 50, naics_code, posted_days_ago = 60 } = body

    // Call Python serverless function
    const pythonUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const pythonResponse = await fetch(`${pythonUrl}/api/python/fetch_opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit,
        posted_days_ago,
        min_deadline_days: 14,
        naics_code,
      }),
    })

    if (!pythonResponse.ok) {
      throw new Error('Failed to fetch opportunities from Python function')
    }

    const data = await pythonResponse.json()

    if (data.status !== 'success') {
      throw new Error(data.error || 'Unknown error from Python function')
    }

    // Save opportunities to database
    const savedOpportunities = []
    const errors = []

    for (const opp of data.opportunities) {
      try {
        // Parse dates
        let postedDate = null
        let responseDeadline = null

        if (opp.postedDate) {
          try {
            postedDate = new Date(opp.postedDate)
          } catch (e) {
            console.warn(`Could not parse posted date: ${opp.postedDate}`)
          }
        }

        if (opp.responseDeadLine) {
          try {
            responseDeadline = new Date(opp.responseDeadLine)
          } catch (e) {
            console.warn(`Could not parse response deadline: ${opp.responseDeadLine}`)
          }
        }

        // Upsert opportunity (update if exists, create if not)
        const saved = await prisma.opportunity.upsert({
          where: {
            solicitationNumber: opp.solicitationNumber || `unknown-${Date.now()}`,
          },
          update: {
            title: opp.title || 'Untitled',
            description: opp.description,
            naicsCode: opp.naicsCode,
            agency: opp.organizationName || opp.department,
            department: opp.department,
            state: opp.placeOfPerformance?.state?.name,
            postedDate,
            responseDeadline,
            lastFetched: new Date(),
            status: responseDeadline && responseDeadline < new Date() ? 'EXPIRED' : 'ACTIVE',
            rawData: opp,
          },
          create: {
            solicitationNumber: opp.solicitationNumber || `unknown-${Date.now()}`,
            title: opp.title || 'Untitled',
            description: opp.description,
            naicsCode: opp.naicsCode,
            agency: opp.organizationName || opp.department,
            department: opp.department,
            state: opp.placeOfPerformance?.state?.name,
            postedDate,
            responseDeadline,
            lastFetched: new Date(),
            status: 'ACTIVE',
            rawData: opp,
          },
        })

        savedOpportunities.push(saved)
      } catch (error) {
        errors.push({
          solicitation: opp.solicitationNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Log the fetch operation
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `Fetched ${data.count} opportunities from SAM.gov`,
        context: {
          user_id: session.user.id,
          saved_count: savedOpportunities.length,
          error_count: errors.length,
          search_params: data.search_params,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved opportunities`,
      stats: {
        total_fetched: data.total_fetched,
        filtered_count: data.filtered_count,
        saved_to_db: savedOpportunities.length,
        errors: errors.length,
      },
      opportunities: savedOpportunities,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Error fetching opportunities:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
