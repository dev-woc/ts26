"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OpportunityCard from '@/components/opportunities/OpportunityCard'

export default function OpportunitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [naicsFilter, setNaicsFilter] = useState(searchParams.get('naics') || '')
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get('agency') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ACTIVE')

  useEffect(() => {
    fetchOpportunities()
  }, [searchParams])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (naicsFilter) params.set('naics', naicsFilter)
      if (agencyFilter) params.set('agency', agencyFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', searchParams.get('page') || '1')

      const response = await fetch(`/api/opportunities?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch opportunities')
      }

      const data = await response.json()

      setOpportunities(data.opportunities)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters()
  }

  const updateFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (naicsFilter) params.set('naics', naicsFilter)
    if (agencyFilter) params.set('agency', agencyFilter)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', '1')

    router.push(`/opportunities?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/opportunities?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and track government contracting opportunities
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="Search by title, solicitation number, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NAICS Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., 334519"
                  value={naicsFilter}
                  onChange={(e) => setNaicsFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency
                </label>
                <input
                  type="text"
                  placeholder="e.g., Defense"
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="AWARDED">Awarded</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No opportunities found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {opportunities.length} of {pagination.total} opportunities
              </p>
            </div>

            {/* Opportunities Grid */}
            <div className="grid gap-6">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
