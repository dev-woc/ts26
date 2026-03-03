import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding sample opportunities with varied data...')

  // Get the first admin user for assessment references
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!adminUser) {
    console.error('No admin user found. Run create-user.ts first.')
    process.exit(1)
  }

  // Sample opportunities with realistic, varied pricing data
  const sampleOpportunities = [
    {
      solicitationNumber: 'W912DY-24-R-0001',
      title: 'IT Infrastructure Modernization Services',
      description: 'The Department of Defense seeks qualified contractors to provide comprehensive IT infrastructure modernization services including cloud migration, network security enhancements, and legacy system upgrades.',
      naicsCode: '541512',
      agency: 'Department of Defense',
      department: 'U.S. Army Corps of Engineers',
      state: 'VA',
      postedDate: new Date('2024-01-15'),
      responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Combined Synopsis/Solicitation',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Virginia'
      },
      pricing: {
        estimatedValue: 1250000,
        estimatedCost: 875000,
        recommendedPrice: 1250000,
        costBasis: 875000,
        grossMargin: 30.0,
        confidence: 'high' as const,
        source: 'usaspending_api',
        profitabilityRating: 'Good',
        opportunitySize: 'Medium',
        strategicValue: 'HIGH' as const,
        riskLevel: 'MEDIUM' as const,
        historicalContracts: 24,
      },
    },
    {
      solicitationNumber: 'GS-00F-0001M',
      title: 'Cybersecurity Assessment and Remediation Services',
      description: 'GSA requires cybersecurity assessment and remediation services for multiple federal facilities. Services include vulnerability assessments, penetration testing, and implementation of security controls.',
      naicsCode: '541519',
      agency: 'General Services Administration',
      department: 'PBS - Region 11',
      state: 'CA',
      postedDate: new Date('2024-01-18'),
      responseDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: '8(a) Set-Aside',
        placeOfPerformance: 'California'
      },
      pricing: {
        estimatedValue: 2100000,
        estimatedCost: 1575000,
        recommendedPrice: 2100000,
        costBasis: 1575000,
        grossMargin: 25.0,
        confidence: 'medium' as const,
        source: 'usaspending_api',
        profitabilityRating: 'Good',
        opportunitySize: 'Medium',
        strategicValue: 'HIGH' as const,
        riskLevel: 'LOW' as const,
        historicalContracts: 15,
      },
    },
    {
      solicitationNumber: 'VA-24-00-SOL-12345',
      title: 'Medical Equipment Maintenance and Repair',
      description: 'Department of Veterans Affairs seeks contractors for ongoing maintenance and repair services of medical diagnostic equipment at VA medical centers nationwide.',
      naicsCode: '811219',
      agency: 'Department of Veterans Affairs',
      department: 'Veterans Health Administration',
      state: 'TX',
      postedDate: new Date('2024-01-20'),
      responseDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Indefinite Delivery Contract',
        setAside: 'Service-Disabled Veteran-Owned Small Business',
        placeOfPerformance: 'Texas'
      },
      pricing: {
        estimatedValue: 385000,
        estimatedCost: 308000,
        recommendedPrice: 385000,
        costBasis: 308000,
        grossMargin: 20.0,
        confidence: 'low' as const,
        source: 'cost_based',
        profitabilityRating: 'Moderate',
        opportunitySize: 'Small',
        strategicValue: 'MEDIUM' as const,
        riskLevel: 'LOW' as const,
        historicalContracts: 4,
      },
    },
    {
      solicitationNumber: 'DOE-24-SOLAR-789',
      title: 'Solar Panel Installation for Federal Buildings',
      description: 'Department of Energy seeks qualified contractors to design and install solar panel systems on federal buildings as part of the clean energy initiative.',
      naicsCode: '238220',
      agency: 'Department of Energy',
      department: 'Office of Energy Efficiency',
      state: 'AZ',
      postedDate: new Date('2024-01-22'),
      responseDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Arizona'
      },
      pricing: {
        estimatedValue: 4750000,
        estimatedCost: 3800000,
        recommendedPrice: 4750000,
        costBasis: 3800000,
        grossMargin: 20.0,
        confidence: 'medium' as const,
        source: 'usaspending_api',
        profitabilityRating: 'Moderate',
        opportunitySize: 'Large',
        strategicValue: 'HIGH' as const,
        riskLevel: 'MEDIUM' as const,
        historicalContracts: 11,
      },
    },
    {
      solicitationNumber: 'NASA-24-JPL-456',
      title: 'Advanced Materials Research and Testing',
      description: 'NASA Jet Propulsion Laboratory requires advanced materials research and testing services for next-generation spacecraft components. Includes composite materials analysis and thermal testing.',
      naicsCode: '541715',
      agency: 'National Aeronautics and Space Administration',
      department: 'Jet Propulsion Laboratory',
      state: 'CA',
      postedDate: new Date('2024-01-10'),
      responseDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Unrestricted',
        placeOfPerformance: 'California'
      },
      pricing: {
        estimatedValue: 3200000,
        estimatedCost: 2240000,
        recommendedPrice: 3200000,
        costBasis: 2240000,
        grossMargin: 30.0,
        confidence: 'high' as const,
        source: 'usaspending_api',
        profitabilityRating: 'Good',
        opportunitySize: 'Medium',
        strategicValue: 'HIGH' as const,
        riskLevel: 'HIGH' as const,
        historicalContracts: 31,
      },
    },
    {
      solicitationNumber: 'DHS-24-FEMA-321',
      title: 'Emergency Response Training Program Development',
      description: 'FEMA seeks contractors to develop and deliver comprehensive emergency response training programs for federal, state, and local emergency management personnel.',
      naicsCode: '611430',
      agency: 'Department of Homeland Security',
      department: 'FEMA',
      state: 'MD',
      postedDate: new Date('2024-01-25'),
      responseDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Maryland'
      },
      pricing: {
        estimatedValue: 275000,
        estimatedCost: 192500,
        recommendedPrice: 275000,
        costBasis: 192500,
        grossMargin: 30.0,
        confidence: 'low' as const,
        source: 'industry_average',
        profitabilityRating: 'Good',
        opportunitySize: 'Small',
        strategicValue: 'MEDIUM' as const,
        riskLevel: 'LOW' as const,
        historicalContracts: 3,
      },
    },
  ]

  for (const opp of sampleOpportunities) {
    const { pricing, ...oppData } = opp

    // Upsert opportunity
    const opportunity = await prisma.opportunity.upsert({
      where: { solicitationNumber: oppData.solicitationNumber },
      update: {},
      create: oppData,
    })

    // Delete existing assessments and bids for this opportunity
    await prisma.opportunityAssessment.deleteMany({
      where: { opportunityId: opportunity.id },
    })
    await prisma.bid.deleteMany({
      where: { opportunityId: opportunity.id },
    })

    // Calculate margins
    const profitMarginDollar = pricing.estimatedValue - pricing.estimatedCost
    const profitMarginPercent =
      pricing.estimatedValue > 0
        ? (profitMarginDollar / pricing.estimatedValue) * 100
        : 0

    // Create assessment
    await prisma.opportunityAssessment.create({
      data: {
        opportunityId: opportunity.id,
        estimatedValue: pricing.estimatedValue,
        estimatedCost: pricing.estimatedCost,
        profitMarginDollar,
        profitMarginPercent,
        meetsMarginTarget: profitMarginPercent >= 10,
        strategicValue: pricing.strategicValue,
        riskLevel: pricing.riskLevel,
        recommendation: profitMarginPercent >= 20 ? 'GO' : profitMarginPercent >= 10 ? 'REVIEW' : 'NO_GO',
        notes: `Based on ${pricing.historicalContracts} historical contracts. Confidence: ${pricing.confidence}.`,
        assessedById: adminUser.id,
      },
    })

    // Create bid
    const bidGrossMargin = pricing.recommendedPrice > 0
      ? ((pricing.recommendedPrice - pricing.costBasis) / pricing.recommendedPrice) * 100
      : 0

    await prisma.bid.create({
      data: {
        opportunityId: opportunity.id,
        userId: adminUser.id,
        recommendedPrice: pricing.recommendedPrice,
        costBasis: pricing.costBasis,
        potentialProfit: pricing.recommendedPrice - pricing.costBasis,
        grossMargin: parseFloat(bidGrossMargin.toFixed(2)),
        profitabilityRating: pricing.profitabilityRating,
        opportunitySize: pricing.opportunitySize,
        confidence: pricing.confidence,
        source: pricing.source,
        historicalData: {
          totalContracts: pricing.historicalContracts,
          averageValue: pricing.estimatedValue * 0.9,
          medianValue: pricing.estimatedValue * 0.85,
          minValue: pricing.estimatedValue * 0.4,
          maxValue: pricing.estimatedValue * 1.8,
        },
        notes: `Pricing based on ${pricing.historicalContracts} historical contracts. Confidence: ${pricing.confidence}.`,
        status: 'DRAFT',
      },
    })

    console.log(
      `  ${oppData.title.substring(0, 45).padEnd(45)} | Value: $${pricing.estimatedValue.toLocaleString().padStart(12)} | Margin: ${profitMarginPercent.toFixed(1)}% | ${pricing.confidence}`
    )
  }

  console.log(`\nSeeded ${sampleOpportunities.length} opportunities with assessments and bids`)

  const count = await prisma.opportunity.count()
  console.log(`Total opportunities in database: ${count}`)
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
