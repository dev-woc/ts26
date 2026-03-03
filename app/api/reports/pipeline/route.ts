import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const STAGES = [
  'DISCOVERY',
  'ASSESSMENT',
  'SOW_CREATION',
  'SOW_REVIEW',
  'BID_ASSEMBLY',
  'READY',
  'SUBMITTED',
]

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all opportunities with their progress and assessment
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        progress: true,
        assessment: true,
      },
    })

    // Group by stage
    const stageMap = new Map<string, {
      count: number
      totalValue: number
      opportunities: Array<{
        id: string
        title: string
        solicitationNumber: string
        estimatedValue: number | null
      }>
    }>()

    // Initialize all stages
    for (const stage of STAGES) {
      stageMap.set(stage, { count: 0, totalValue: 0, opportunities: [] })
    }

    // Process opportunities
    for (const opp of opportunities) {
      const stage = opp.progress?.currentStage || 'DISCOVERY'
      const stageData = stageMap.get(stage)

      if (stageData) {
        stageData.count++
        const value = opp.assessment?.estimatedValue || 0
        stageData.totalValue += value
        stageData.opportunities.push({
          id: opp.id,
          title: opp.title,
          solicitationNumber: opp.solicitationNumber,
          estimatedValue: value,
        })
      }
    }

    // Convert to array
    const stages = STAGES.map((stage) => ({
      stage,
      ...stageMap.get(stage)!,
    }))

    // Calculate totals
    const totalOpportunities = opportunities.length
    const totalPipelineValue = opportunities.reduce(
      (sum, opp) => sum + (opp.assessment?.estimatedValue || 0),
      0
    )

    return NextResponse.json({
      stages,
      totalOpportunities,
      totalPipelineValue,
    })
  } catch (error) {
    console.error('Error fetching pipeline data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
