/**
 * USASpending API Integration
 * Fetches historical contract data to inform competitive bid pricing
 */

const USASPENDING_API_BASE = 'https://api.usaspending.gov/api/v2'

export interface HistoricalContract {
  award_id: string
  award_amount: number
  awarding_agency_name: string
  recipient_name: string
  description: string
  period_of_performance_start_date: string
  period_of_performance_current_end_date: string
  naics_code: string
  naics_description: string
}

export interface USASpendingSearchParams {
  naicsCode?: string
  keywords?: string
  agencyName?: string
  limit?: number
}

export interface PricingAnalysis {
  averageContractValue: number
  medianContractValue: number
  minContractValue: number
  maxContractValue: number
  totalContracts: number
  recommendedBidPrice: number
  confidence: 'high' | 'medium' | 'low' | 'very_low'
  historicalContracts: HistoricalContract[]
}

/**
 * Search for historical contracts using USASpending API
 */
export async function searchHistoricalContracts(
  params: USASpendingSearchParams
): Promise<HistoricalContract[]> {
  try {
    const { naicsCode, keywords, agencyName, limit = 50 } = params

    // Build search filters
    const filters: any = {
      time_period: [
        {
          start_date: '2020-01-01', // Last 4 years of data
          end_date: new Date().toISOString().split('T')[0],
        },
      ],
    }

    if (naicsCode) {
      filters.naics_codes = [naicsCode]
    }

    if (keywords) {
      filters.keywords = [keywords]
    }

    if (agencyName) {
      filters.agencies = [{ name: agencyName, tier: 'toptier' }]
    }

    const requestBody = {
      filters,
      fields: [
        'Award ID',
        'Award Amount',
        'Awarding Agency',
        'Recipient Name',
        'Description',
        'Start Date',
        'End Date',
        'NAICS Code',
        'NAICS Description',
      ],
      page: 1,
      limit,
      sort: 'Award Amount',
      order: 'desc',
    }

    const response = await fetch(`${USASPENDING_API_BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('USASpending API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()

    // Transform the response to our format
    const contracts: HistoricalContract[] = (data.results || []).map((result: any) => ({
      award_id: result.Award_ID || result['Award ID'] || 'N/A',
      award_amount: parseFloat(result.Award_Amount || result['Award Amount'] || 0),
      awarding_agency_name: result.Awarding_Agency || result['Awarding Agency'] || 'N/A',
      recipient_name: result.Recipient_Name || result['Recipient Name'] || 'N/A',
      description: result.Description || 'N/A',
      period_of_performance_start_date: result.Start_Date || result['Start Date'] || '',
      period_of_performance_current_end_date: result.End_Date || result['End Date'] || '',
      naics_code: result.NAICS_Code || result['NAICS Code'] || '',
      naics_description: result.NAICS_Description || result['NAICS Description'] || '',
    }))

    return contracts
  } catch (error) {
    console.error('Error fetching USASpending data:', error)
    return []
  }
}

/**
 * NAICS-based industry pricing estimates for fallback when no historical data
 */
const NAICS_PRICING: Record<string, { min: number; max: number; avg: number }> = {
  '541512': { min: 150000, max: 2500000, avg: 750000 },   // Computer Systems Design
  '541519': { min: 200000, max: 3000000, avg: 950000 },   // Other Computer Services
  '541330': { min: 75000, max: 500000, avg: 200000 },     // Engineering Services
  '541715': { min: 250000, max: 5000000, avg: 1200000 },  // R&D Physical Sciences
  '541611': { min: 100000, max: 1500000, avg: 450000 },   // Management Consulting
  '561210': { min: 25000, max: 150000, avg: 65000 },      // Janitorial Services
  '238220': { min: 500000, max: 8000000, avg: 2200000 },  // Plumbing/HVAC/Solar
  '811219': { min: 50000, max: 800000, avg: 285000 },     // Equipment Repair
  '611430': { min: 80000, max: 600000, avg: 220000 },     // Professional Development Training
  '236220': { min: 1000000, max: 20000000, avg: 5500000 },// Commercial Construction
  '517312': { min: 100000, max: 2000000, avg: 600000 },   // Wireless Telecom
  '562910': { min: 75000, max: 1200000, avg: 350000 },    // Environmental Remediation
  '621610': { min: 60000, max: 400000, avg: 175000 },     // Home Health Care
}

function getNaicsFallbackPrice(naicsCode?: string | null): number {
  if (naicsCode && NAICS_PRICING[naicsCode]) {
    const { min, max, avg } = NAICS_PRICING[naicsCode]
    // Return a value between avg and max, with some variation
    const range = max - min
    const seed = naicsCode.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    const variation = ((seed * 7) % 100) / 100 // deterministic 0-1 based on NAICS
    return Math.round(min + range * (0.3 + variation * 0.4))
  }
  // Generic fallback with variation based on current time seed
  const bases = [85000, 125000, 210000, 340000, 475000, 620000, 780000]
  const idx = Math.floor(Math.random() * bases.length)
  return bases[idx]
}

/**
 * Analyze historical contracts and calculate recommended bid price
 */
export function analyzeHistoricalPricing(
  contracts: HistoricalContract[],
  estimatedCost?: number,
  naicsCode?: string | null
): PricingAnalysis {
  if (contracts.length === 0) {
    const fallbackPrice = estimatedCost
      ? estimatedCost * 1.15
      : getNaicsFallbackPrice(naicsCode)
    return {
      averageContractValue: 0,
      medianContractValue: 0,
      minContractValue: 0,
      maxContractValue: 0,
      totalContracts: 0,
      recommendedBidPrice: fallbackPrice,
      confidence: 'very_low',
      historicalContracts: [],
    }
  }

  // Filter out zero or negative values
  const validContracts = contracts.filter((c) => c.award_amount > 0)
  const amounts = validContracts.map((c) => c.award_amount).sort((a, b) => a - b)

  const totalContracts = validContracts.length
  const averageContractValue = amounts.reduce((sum, val) => sum + val, 0) / totalContracts
  const medianContractValue = amounts[Math.floor(totalContracts / 2)] || 0
  const minContractValue = amounts[0] || 0
  const maxContractValue = amounts[totalContracts - 1] || 0

  // Calculate recommended bid price
  // Strategy: Use median for better resistance to outliers, adjusted by market position
  let recommendedBidPrice = medianContractValue

  // If we have cost data, ensure we maintain healthy margin
  if (estimatedCost && estimatedCost > 0) {
    const costBasedPrice = estimatedCost * 1.20 // 20% markup minimum
    recommendedBidPrice = Math.max(recommendedBidPrice, costBasedPrice)
  }

  // Determine confidence level based on data availability
  let confidence: 'high' | 'medium' | 'low' | 'very_low'
  if (totalContracts >= 20) {
    confidence = 'high'
  } else if (totalContracts >= 10) {
    confidence = 'medium'
  } else if (totalContracts >= 5) {
    confidence = 'low'
  } else {
    confidence = 'very_low'
  }

  return {
    averageContractValue,
    medianContractValue,
    minContractValue,
    maxContractValue,
    totalContracts,
    recommendedBidPrice,
    confidence,
    historicalContracts: validContracts.slice(0, 10), // Top 10 for reference
  }
}

/**
 * Get pricing recommendation for an opportunity
 */
export async function getPricingRecommendation(
  opportunity: {
    naicsCode?: string | null
    title: string
    agency?: string | null
  },
  estimatedCost?: number
): Promise<PricingAnalysis> {
  const searchParams: USASpendingSearchParams = {
    limit: 100,
  }

  // Prioritize NAICS code for more accurate results
  if (opportunity.naicsCode) {
    searchParams.naicsCode = opportunity.naicsCode
  }

  // Use agency if available
  if (opportunity.agency) {
    searchParams.agencyName = opportunity.agency
  }

  // Extract keywords from title (simple approach)
  if (opportunity.title) {
    const words = opportunity.title
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 4) // Get meaningful words
      .slice(0, 3) // Use top 3 words
      .join(' ')

    if (words) {
      searchParams.keywords = words
    }
  }

  const contracts = await searchHistoricalContracts(searchParams)
  return analyzeHistoricalPricing(contracts, estimatedCost, opportunity.naicsCode)
}
