import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const naicsCode = searchParams.get('naics')
    const agency = searchParams.get('agency')
    const status = searchParams.get('status') || 'ACTIVE'

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { solicitationNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (naicsCode) {
      where.naicsCode = naicsCode
    }

    if (agency) {
      where.agency = { contains: agency, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.opportunity.count({ where })

    // Get opportunities with pagination
    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: {
        responseDeadline: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            bids: true,
            subcontractors: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      opportunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
