import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database...')

  const oppCount = await prisma.opportunity.count()
  const userCount = await prisma.user.count()

  console.log(`\n📊 Database Status:`)
  console.log(`   Users: ${userCount}`)
  console.log(`   Opportunities: ${oppCount}`)

  if (oppCount > 0) {
    const recent = await prisma.opportunity.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        solicitationNumber: true,
        agency: true,
        responseDeadline: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`\n📋 Recent Opportunities:`)
    recent.forEach((opp, i) => {
      console.log(`   ${i+1}. ${opp.title.substring(0, 60)}...`)
      console.log(`      ${opp.solicitationNumber} | ${opp.agency}`)
    })
  } else {
    console.log(`\n⚠️  No opportunities found in database.`)
    console.log(`\nTo add sample data:`)
    console.log(`   1. Get a SAM.gov API key from https://sam.gov/`)
    console.log(`   2. Add it to .env.local as SAM_API_KEY`)
    console.log(`   3. Call the /api/opportunities/fetch endpoint`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
