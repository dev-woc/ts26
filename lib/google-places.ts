/**
 * Google Places API client for subcontractor discovery
 * Port from Python: proposal-machine/src/google_places_client.py
 */

interface PlaceSearchResult {
  name: string
  address: string
  placeId: string
  types: string[]
  rating: number | null
  totalRatings: number | null
}

interface PlaceDetails {
  phone?: string
  website?: string
  businessStatus?: string
}

interface Subcontractor extends PlaceSearchResult, PlaceDetails {
  service?: string
  location?: string
}

// NAICS code to service type mapping for search queries
const NAICS_SERVICE_MAP: Record<string, string[]> = {
  '236220': ['Commercial Construction', 'General Contractor'],
  '237310': ['Highway Construction', 'Road Construction'],
  '238210': ['Electrical Contractor', 'Electrician'],
  '238220': ['Plumbing Contractor', 'HVAC Contractor'],
  '238910': ['Site Preparation Contractor'],
  '334511': ['Radar Systems', 'Navigation Equipment'],
  '334519': ['Measuring Instruments', 'Testing Equipment'],
  '336411': ['Aircraft Manufacturing', 'Aerospace Contractor'],
  '511210': ['Software Publisher', 'Software Development Company'],
  '517311': ['Telecommunications', 'Network Services Provider'],
  '518210': ['Data Processing', 'Cloud Services'],
  '541310': ['Architectural Services', 'Architecture Firm'],
  '541330': ['Engineering Services', 'Civil Engineering', 'Structural Engineering'],
  '541380': ['Testing Laboratory', 'Inspection Services'],
  '541511': ['Custom Software Development', 'Application Development'],
  '541512': ['Computer Systems Design', 'IT Consulting', 'Software Development'],
  '541513': ['Computer Facilities Management', 'IT Infrastructure'],
  '541519': ['IT Services', 'Technology Consulting'],
  '541611': ['Management Consulting', 'Business Consulting'],
  '541612': ['Human Resources Consulting', 'HR Services'],
  '541614': ['Logistics Consulting', 'Supply Chain Consulting'],
  '541620': ['Environmental Consulting', 'Environmental Services'],
  '541690': ['Scientific Consulting', 'Technical Consulting'],
  '541715': ['Research and Development', 'R&D Services'],
  '541990': ['Professional Services', 'Consulting Services'],
  '561210': ['Facilities Support Services', 'Building Maintenance'],
  '561320': ['Temporary Staffing Agency', 'Staffing Services'],
  '561612': ['Security Guard Services', 'Security Services'],
  '561720': ['Janitorial Services', 'Cleaning Services'],
  '562910': ['Remediation Services', 'Environmental Cleanup'],
  '611430': ['Professional Training', 'Training Services'],
  '621999': ['Health Services', 'Medical Services'],
  '811219': ['Electronics Repair', 'Equipment Maintenance'],
}

// Keywords from opportunity titles mapped to relevant search terms
const TITLE_KEYWORD_MAP: Record<string, string[]> = {
  'cybersecurity': ['Cybersecurity Services', 'Information Security'],
  'security': ['Security Services', 'Security Consultant'],
  'construction': ['Construction Contractor', 'General Contractor'],
  'maintenance': ['Maintenance Services', 'Facility Maintenance'],
  'repair': ['Equipment Repair', 'Maintenance Services'],
  'training': ['Training Services', 'Professional Training'],
  'medical': ['Medical Services', 'Healthcare Services'],
  'health': ['Healthcare Services', 'Medical Supplies'],
  'software': ['Software Development', 'IT Services'],
  'network': ['Network Services', 'Telecommunications'],
  'cloud': ['Cloud Services', 'IT Infrastructure'],
  'data': ['Data Services', 'IT Consulting'],
  'logistics': ['Logistics Services', 'Supply Chain'],
  'transport': ['Transportation Services', 'Freight Services'],
  'cleaning': ['Janitorial Services', 'Cleaning Services'],
  'environmental': ['Environmental Services', 'Environmental Consulting'],
  'engineering': ['Engineering Services', 'Engineering Firm'],
  'consulting': ['Consulting Firm', 'Management Consulting'],
  'staffing': ['Staffing Agency', 'Temporary Staffing'],
  'electrical': ['Electrical Contractor', 'Electrician'],
  'plumbing': ['Plumbing Contractor', 'Plumber'],
  'hvac': ['HVAC Contractor', 'HVAC Services'],
  'telecom': ['Telecommunications', 'Network Services'],
  'research': ['Research Services', 'R&D Firm'],
  'laboratory': ['Testing Laboratory', 'Lab Services'],
  'inspection': ['Inspection Services', 'Quality Assurance'],
  'architecture': ['Architectural Services', 'Architecture Firm'],
  'survey': ['Surveying Services', 'Land Surveyor'],
  'remediation': ['Environmental Remediation', 'Cleanup Services'],
}

// Approximate bounding boxes for US states: [south, west, north, east]
const STATE_BOUNDS: Record<string, [number, number, number, number]> = {
  AL: [30.14, -88.47, 35.01, -84.89], AK: [54.68, -179.15, 71.54, -129.99],
  AZ: [31.33, -114.82, 37.00, -109.04], AR: [33.00, -94.62, 36.50, -89.64],
  CA: [32.53, -124.41, 42.01, -114.13], CO: [36.99, -109.06, 41.00, -102.04],
  CT: [40.95, -73.73, 42.05, -71.79], DE: [38.45, -75.79, 39.84, -75.05],
  FL: [24.52, -87.63, 31.00, -80.03], GA: [30.36, -85.61, 35.00, -80.84],
  HI: [18.86, -160.25, 22.24, -154.81], ID: [41.99, -117.24, 49.00, -111.04],
  IL: [36.97, -91.51, 42.51, -87.02], IN: [37.77, -88.10, 41.76, -84.78],
  IA: [40.38, -96.64, 43.50, -90.14], KS: [36.99, -102.05, 40.00, -94.59],
  KY: [36.50, -89.57, 39.15, -81.96], LA: [28.93, -94.04, 33.02, -89.00],
  ME: [43.06, -71.08, 47.46, -66.95], MD: [37.91, -79.49, 39.72, -75.05],
  MA: [41.24, -73.51, 42.89, -69.93], MI: [41.70, -90.42, 48.31, -82.41],
  MN: [43.50, -97.24, 49.38, -89.49], MS: [30.17, -91.65, 35.00, -88.10],
  MO: [35.99, -95.77, 40.61, -89.10], MT: [44.36, -116.05, 49.00, -104.04],
  NE: [40.00, -104.05, 43.00, -95.31], NV: [35.00, -120.00, 42.00, -114.04],
  NH: [42.70, -72.56, 45.31, -70.61], NJ: [38.93, -75.57, 41.36, -73.89],
  NM: [31.33, -109.05, 37.00, -103.00], NY: [40.50, -79.76, 45.02, -71.86],
  NC: [33.84, -84.32, 36.59, -75.46], ND: [45.94, -104.05, 49.00, -96.55],
  OH: [38.40, -84.82, 42.33, -80.52], OK: [33.62, -103.00, 37.00, -94.43],
  OR: [41.99, -124.57, 46.24, -116.46], PA: [39.72, -80.52, 42.27, -74.69],
  RI: [41.15, -71.86, 42.02, -71.12], SC: [32.04, -83.35, 35.22, -78.55],
  SD: [42.48, -104.06, 45.95, -96.44], TN: [34.98, -90.31, 36.68, -81.65],
  TX: [25.84, -106.65, 36.50, -93.51], UT: [36.99, -114.05, 42.00, -109.04],
  VT: [42.73, -73.44, 45.02, -71.50], VA: [36.54, -83.68, 39.46, -75.24],
  WA: [45.54, -124.73, 49.00, -116.92], WV: [37.20, -82.64, 40.64, -77.72],
  WI: [42.49, -92.89, 47.08, -86.25], WY: [40.99, -111.06, 45.01, -104.05],
  DC: [38.79, -77.12, 38.99, -76.91],
}

export async function searchBusinesses(
  query: string,
  location: string = 'United States',
  maxResults: number = 5,
  stateCode?: string | null
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey || apiKey.includes('your_actual') || apiKey.includes('your_google')) {
    console.warn('GOOGLE_PLACES_API_KEY not configured properly. Key present:', !!apiKey, 'Key length:', apiKey?.length || 0)
    return []
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    // Include location in the query text for relevance ranking
    url.searchParams.set('query', `${query} ${location}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('type', 'establishment')

    // Add locationbias rectangle to constrain results to the state/region
    if (stateCode && STATE_BOUNDS[stateCode.toUpperCase()]) {
      const [south, west, north, east] = STATE_BOUNDS[stateCode.toUpperCase()]
      url.searchParams.set('locationbias', `rectangle:${south},${west}|${north},${east}`)
    }

    console.log(`[Google Places] Searching for: "${query}" in "${location}"${stateCode ? ` (state: ${stateCode})` : ''} (API key: ${apiKey.substring(0, 8)}...)`)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.status !== 'OK') {
      console.error(`[Google Places] API error: ${data.status}`, data.error_message || '')
      if (data.status === 'REQUEST_DENIED') {
        console.error('[Google Places] Check if Places API is enabled and API key is valid')
      }
      return []
    }

    const businesses: PlaceSearchResult[] = data.results
      .slice(0, maxResults)
      .map((place: any) => ({
        name: place.name || '',
        address: place.formatted_address || '',
        placeId: place.place_id || '',
        types: place.types || [],
        rating: place.rating || null,
        totalRatings: place.user_ratings_total || null,
      }))

    console.log(`[Google Places] Found ${businesses.length} businesses for "${query}"`)
    return businesses
  } catch (error) {
    console.error('[Google Places] Search failed:', error)
    return []
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return {}
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('fields', 'formatted_phone_number,website,business_status')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.result) {
      const result = data.result
      const details: PlaceDetails = {}

      if (result.formatted_phone_number) {
        details.phone = result.formatted_phone_number
      }
      if (result.website) {
        details.website = result.website
      }
      if (result.business_status) {
        details.businessStatus = result.business_status
      }

      return details
    }

    return {}
  } catch (error) {
    console.error('Place details API failed:', error)
    return {}
  }
}

export async function findSubcontractorsForOpportunity(opportunity: {
  naicsCode?: string | null
  /** Full place of performance string e.g. "Anchorage, Alaska, USA" */
  placeOfPerformance?: string | null
  /** 2-letter state code for geographic bounding box bias e.g. "AK" */
  stateCode?: string | null
  title?: string
}): Promise<Subcontractor[]> {
  const { naicsCode, placeOfPerformance, stateCode, title } = opportunity

  // Build search queries — prioritize NAICS, then title keywords
  let searchQueries: string[] = []

  // 1. NAICS-based queries
  if (naicsCode && NAICS_SERVICE_MAP[naicsCode]) {
    searchQueries.push(...NAICS_SERVICE_MAP[naicsCode])
  }

  // 2. Title keyword-based queries
  if (title) {
    const titleLower = title.toLowerCase()
    for (const [keyword, queries] of Object.entries(TITLE_KEYWORD_MAP)) {
      if (titleLower.includes(keyword)) {
        for (const q of queries) {
          if (!searchQueries.includes(q)) {
            searchQueries.push(q)
          }
        }
      }
    }
  }

  // 3. Fallback: generic NAICS or title-based search
  if (searchQueries.length === 0) {
    if (naicsCode) {
      searchQueries = [`NAICS ${naicsCode} contractor`]
    } else if (title) {
      // Use first few meaningful words from title
      const words = title.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(' ')
      searchQueries = [`${words} contractor`]
    } else {
      searchQueries = ['government contractor']
    }
  }

  // Use the full place of performance for the text query (most specific), fall back to state, then US
  const location = placeOfPerformance || (stateCode ? `${stateCode}, USA` : 'United States')
  const allSubcontractors: Subcontractor[] = []
  const seenNames = new Set<string>()
  const seenPlaceIds = new Set<string>()

  // Search up to 3 queries, 5 results each, to get good coverage
  for (const query of searchQueries.slice(0, 3)) {
    // Pass stateCode so searchBusinesses can add a locationbias bounding box
    const businesses = await searchBusinesses(query, location, 5, stateCode)

    for (const business of businesses) {
      // Deduplicate by name AND placeId
      const nameLower = business.name.toLowerCase()
      if (seenNames.has(nameLower)) continue
      if (business.placeId && seenPlaceIds.has(business.placeId)) continue

      seenNames.add(nameLower)
      if (business.placeId) seenPlaceIds.add(business.placeId)

      // Get detailed information
      const details = await getPlaceDetails(business.placeId)

      allSubcontractors.push({
        ...business,
        ...details,
        service: query,
        location: placeOfPerformance || (stateCode ? `${stateCode}, USA` : 'USA'),
      })
    }
  }

  return allSubcontractors
}

export interface GoogleMapsEnrichment {
  googleRating: number | null
  googleTotalReviews: number | null
  googleBusinessStatus: string | null
  googleBusinessHours: Record<string, string>[] | null
  website: string | null
  phone: string | null
  placeId: string | null
}

/**
 * Enrich a business with Google Maps data by searching by name + state.
 * Called AFTER SAM.gov discovery to add operational data to verified entities.
 */
export async function enrichWithGoogleMaps(
  businessName: string,
  state?: string | null
): Promise<GoogleMapsEnrichment | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || apiKey.includes('your_actual') || apiKey.includes('your_google')) {
    return null
  }

  try {
    const location = state ? `${state}, USA` : 'United States'
    const results = await searchBusinesses(businessName, location, 1)

    if (results.length === 0) return null

    const match = results[0]

    // Get detailed info including hours
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    detailsUrl.searchParams.set('place_id', match.placeId)
    detailsUrl.searchParams.set('key', apiKey)
    detailsUrl.searchParams.set(
      'fields',
      'formatted_phone_number,website,business_status,opening_hours,rating,user_ratings_total'
    )

    const detailsRes = await fetch(detailsUrl.toString())
    const detailsData = await detailsRes.json()

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return {
        googleRating: match.rating,
        googleTotalReviews: match.totalRatings,
        googleBusinessStatus: null,
        googleBusinessHours: null,
        website: null,
        phone: null,
        placeId: match.placeId,
      }
    }

    const r = detailsData.result
    return {
      googleRating: r.rating ?? match.rating,
      googleTotalReviews: r.user_ratings_total ?? match.totalRatings,
      googleBusinessStatus: r.business_status || null,
      googleBusinessHours: r.opening_hours?.weekday_text
        ? r.opening_hours.weekday_text.map((text: string) => {
            const [day, ...hours] = text.split(': ')
            return { day, hours: hours.join(': ') }
          })
        : null,
      website: r.website || null,
      phone: r.formatted_phone_number || null,
      placeId: match.placeId,
    }
  } catch (error) {
    console.error('Google Maps enrichment failed for', businessName, error)
    return null
  }
}
