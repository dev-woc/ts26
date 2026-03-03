/**
 * Purge ALL fake/seeded data from the database.
 * Deletes opportunities, assessments, bids, subcontractors, SOWs, and related records.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function purge() {
  console.log('Purging all fake data...\n')

  // Delete in order to respect foreign key constraints
  const sowActivities = await prisma.sOWActivity.deleteMany({})
  console.log(`  Deleted ${sowActivities.count} SOW activities`)

  const sowVersions = await prisma.sOWVersion.deleteMany({})
  console.log(`  Deleted ${sowVersions.count} SOW versions`)

  const sowApprovals = await prisma.sOWApproval.deleteMany({})
  console.log(`  Deleted ${sowApprovals.count} SOW approvals`)

  const sows = await prisma.sOW.deleteMany({})
  console.log(`  Deleted ${sows.count} SOWs`)

  const bids = await prisma.bid.deleteMany({})
  console.log(`  Deleted ${bids.count} bids`)

  const subcontractors = await prisma.subcontractor.deleteMany({})
  console.log(`  Deleted ${subcontractors.count} subcontractors`)

  const assessments = await prisma.opportunityAssessment.deleteMany({})
  console.log(`  Deleted ${assessments.count} assessments`)

  const progress = await prisma.opportunityProgress.deleteMany({})
  console.log(`  Deleted ${progress.count} progress records`)

  const watches = await prisma.opportunityWatch.deleteMany({})
  console.log(`  Deleted ${watches.count} watches`)

  const opportunities = await prisma.opportunity.deleteMany({})
  console.log(`  Deleted ${opportunities.count} opportunities`)

  const vendors = await prisma.vendor.deleteMany({})
  console.log(`  Deleted ${vendors.count} vendors`)

  const vendorComms = await prisma.vendorCommunication.deleteMany({})
  console.log(`  Deleted ${vendorComms.count} vendor communications`)

  console.log('\nAll fake data purged. Database is clean.')

  // Verify
  const remaining = await prisma.opportunity.count()
  console.log(`\nOpportunities remaining: ${remaining}`)
}

purge()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
