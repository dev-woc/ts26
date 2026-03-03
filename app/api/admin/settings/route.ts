import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check environment variables (don't expose values, just whether they're set)
    const settings = {
      samApiKey: !!process.env.SAM_API_KEY,
      usaSpendingEnabled: true, // USASpending API is public, no key needed
      googlePlacesApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
      emailProvider: process.env.EMAIL_PROVIDER || null,
      blobStorageConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
      databaseConnected: true, // If we got here, DB is working
    }

    // Fetch cron jobs
    const cronJobs = await prisma.cronJob.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      settings,
      cronJobs,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
