import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding sample opportunities...')

  // Sample opportunities data
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
      responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Combined Synopsis/Solicitation',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Virginia'
      }
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
      responseDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: '8(a) Set-Aside',
        placeOfPerformance: 'California'
      }
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
      responseDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Indefinite Delivery Contract',
        setAside: 'Service-Disabled Veteran-Owned Small Business',
        placeOfPerformance: 'Texas'
      }
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
      responseDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Arizona'
      }
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
      responseDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Unrestricted',
        placeOfPerformance: 'California'
      }
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
      responseDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
      status: 'ACTIVE' as const,
      rawData: {
        type: 'Request for Proposal',
        setAside: 'Total Small Business Set-Aside',
        placeOfPerformance: 'Maryland'
      }
    }
  ]

  // Create opportunities
  for (const opp of sampleOpportunities) {
    await prisma.opportunity.upsert({
      where: { solicitationNumber: opp.solicitationNumber },
      update: {},
      create: opp
    })
  }

  console.log(`✅ Created ${sampleOpportunities.length} sample opportunities`)

  // Check final count
  const count = await prisma.opportunity.count()
  console.log(`📊 Total opportunities in database: ${count}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
