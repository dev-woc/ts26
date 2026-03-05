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
  confidence: 'high' | 'medium' | 'low' | 'very_low' | 'no_data'
  dataSource: string
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

// No hardcoded fallback pricing — per data sourcing rules, invented numbers are not permitted.
// When no historical data is found, callers must show "Insufficient data — enter manual estimate".

/**
 * Analyze historical contracts and calculate recommended bid price
 */
export function analyzeHistoricalPricing(
  contracts: HistoricalContract[],
  estimatedCost?: number,
  naicsCode?: string | null
): PricingAnalysis {
  if (contracts.length === 0) {
    return {
      averageContractValue: 0,
      medianContractValue: 0,
      minContractValue: 0,
      maxContractValue: 0,
      totalContracts: 0,
      recommendedBidPrice: 0,
      confidence: 'no_data',
      dataSource: 'No historical contracts found on USASpending.gov for this NAICS code and agency',
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
  let confidence: 'high' | 'medium' | 'low' | 'very_low' | 'no_data'
  if (totalContracts >= 20) {
    confidence = 'high'
  } else if (totalContracts >= 10) {
    confidence = 'medium'
  } else if (totalContracts >= 5) {
    confidence = 'low'
  } else {
    confidence = 'very_low'
  }

  const naicsLabel = naicsCode ? ` (NAICS ${naicsCode})` : ''
  const dataSource = `USASpending.gov — ${totalContracts} historical contract${totalContracts !== 1 ? 's' : ''}${naicsLabel}, median $${medianContractValue.toLocaleString()}`

  return {
    averageContractValue,
    medianContractValue,
    minContractValue,
    maxContractValue,
    totalContracts,
    recommendedBidPrice,
    confidence,
    dataSource,
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
