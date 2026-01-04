"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creatingBid, setCreatingBid] = useState(false)

  useEffect(() => {
    fetchOpportunity()
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/opportunities/${params.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity')
      }

      const data = await response.json()
      setOpportunity(data.opportunity)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBid = async () => {
    setCreatingBid(true)
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create bid')
      }

      const data = await response.json()

      // Refresh the opportunity to show the new bid
      await fetchOpportunity()

      alert('Bid created successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create bid')
    } finally {
      setCreatingBid(false)
    }
  }

  const handleFindSubcontractors = () => {
    alert('Subcontractor discovery coming in Phase 3!')
  }

  const handleGenerateSOW = () => {
    alert('SOW generation coming in Phase 4!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading opportunity...</p>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Opportunity not found'}</p>
          <button
            onClick={() => router.push('/opportunities')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    )
  }

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/opportunities')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Opportunities
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{opportunity.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{opportunity.solicitationNumber}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none text-gray-700">
                {opportunity.description || 'No description available'}
              </div>
            </div>

            {/* Bids */}
            {opportunity.bids && opportunity.bids.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Bids ({opportunity.bids.length})
                </h2>
                <div className="space-y-4">
                  {opportunity.bids.map((bid: any) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            ${bid.recommendedPrice?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Margin: {bid.grossMargin}% • {bid.profitabilityRating}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subcontractors */}
            {opportunity.subcontractors && opportunity.subcontractors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Subcontractors ({opportunity.subcontractors.length})
                </h2>
                <div className="space-y-4">
                  {opportunity.subcontractors.map((sub: any) => (
                    <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{sub.name}</h3>
                      {sub.phone && (
                        <p className="text-sm text-gray-600 mt-1">📞 {sub.phone}</p>
                      )}
                      {sub.email && (
                        <p className="text-sm text-gray-600">📧 {sub.email}</p>
                      )}
                      {sub.sowUrl && (
                        <a
                          href={sub.sowUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                        >
                          Download SOW →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Details</h2>
              <div className="space-y-4">
                {opportunity.agency && (
                  <div>
                    <p className="text-sm text-gray-500">Agency</p>
                    <p className="font-medium text-gray-900">{opportunity.agency}</p>
                  </div>
                )}

                {opportunity.naicsCode && (
                  <div>
                    <p className="text-sm text-gray-500">NAICS Code</p>
                    <p className="font-medium text-gray-900">{opportunity.naicsCode}</p>
                  </div>
                )}

                {opportunity.state && (
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium text-gray-900">{opportunity.state}</p>
                  </div>
                )}

                {opportunity.postedDate && (
                  <div>
                    <p className="text-sm text-gray-500">Posted Date</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(opportunity.postedDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}

                {deadline && (
                  <div>
                    <p className="text-sm text-gray-500">Response Deadline</p>
                    <p className="font-medium text-gray-900">
                      {format(deadline, 'MMM dd, yyyy')}
                    </p>
                    {daysUntilDeadline !== null && (
                      <p className={`text-sm mt-1 ${
                        daysUntilDeadline < 7 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : 'Expired'}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mt-1">
                    {opportunity.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleCreateBid}
                  disabled={creatingBid}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingBid ? 'Creating...' : 'Create Bid'}
                </button>
                <button
                  onClick={handleFindSubcontractors}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Find Subcontractors
                </button>
                <button
                  onClick={handleGenerateSOW}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Generate SOW
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
