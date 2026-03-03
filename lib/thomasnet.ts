/**
 * ThomasNet Vendor Search Client
 *
 * ThomasNet integration has been deprecated in favor of SAM.gov Entity API
 * for verified subcontractor data. These functions are retained as stubs
 * for backwards compatibility but return empty results.
 */

export interface ThomasNetVendor {
  id: string
  name: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  capabilities: string[]
  certifications?: string[]
  employeeCount?: string
  yearEstablished?: string
  relevanceScore?: number
}

export interface ThomasNetSearchParams {
  query: string
  naicsCode?: string
  state?: string
  maxResults?: number
}

export async function searchThomasNet(_params: ThomasNetSearchParams): Promise<ThomasNetVendor[]> {
  console.warn('ThomasNet search is deprecated. Use SAM.gov Entity API via lib/samgov.ts instead.')
  return []
}

export async function getVendorDetails(_vendorId: string): Promise<ThomasNetVendor | null> {
  return null
}

export async function findVendorsForOpportunity(_opportunity: {
  naicsCode?: string
  state?: string
  title?: string
  description?: string
}): Promise<ThomasNetVendor[]> {
  console.warn('ThomasNet vendor search is deprecated. Use SAM.gov Entity API instead.')
  return []
}
