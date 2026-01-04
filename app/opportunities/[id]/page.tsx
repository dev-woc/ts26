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
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null)

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

  const handleViewBid = (bid: any) => {
    // Create a printable bid summary
    const bidWindow = window.open('', '_blank')
    if (bidWindow) {
      bidWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bid #${bid.id.substring(0, 8)} - ${opportunity.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #1f2937; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .header { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { margin-left: 10px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; background: #e5e7eb; }
            .notes { background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin-top: 20px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>Bid Proposal</h1>

          <div class="header">
            <div class="section">
              <span class="label">Bid ID:</span>
              <span class="value">${bid.id}</span>
            </div>
            <div class="section">
              <span class="label">Opportunity:</span>
              <span class="value">${opportunity.title}</span>
            </div>
            <div class="section">
              <span class="label">Solicitation Number:</span>
              <span class="value">${opportunity.solicitationNumber}</span>
            </div>
            <div class="section">
              <span class="label">Agency:</span>
              <span class="value">${opportunity.agency || 'N/A'}</span>
            </div>
            <div class="section">
              <span class="label">Created:</span>
              <span class="value">${new Date(bid.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <h2>Pricing Information</h2>
          <div class="section">
            <span class="label">Recommended Price:</span>
            <span class="value" style="font-size: 24px; color: #2563eb; font-weight: bold;">
              $${bid.recommendedPrice?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div class="section">
            <span class="label">Cost Basis:</span>
            <span class="value">$${bid.costBasis?.toLocaleString() || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Potential Profit:</span>
            <span class="value">$${bid.potentialProfit?.toLocaleString() || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Gross Margin:</span>
            <span class="value">${bid.grossMargin || 'N/A'}%</span>
          </div>

          <h2>Analysis</h2>
          <div class="section">
            <span class="label">Profitability Rating:</span>
            <span class="value">${bid.profitabilityRating || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Opportunity Size:</span>
            <span class="value">${bid.opportunitySize || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Confidence Level:</span>
            <span class="value">${bid.confidence || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Data Source:</span>
            <span class="value">${bid.source || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Status:</span>
            <span class="status">${bid.status}</span>
          </div>

          ${bid.notes ? `
          <div class="notes">
            <strong>Notes:</strong><br/>
            ${bid.notes}
          </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            Generated by USHER Bid Management System on ${new Date().toLocaleString()}
          </div>

          <script>
            window.onload = function() {
              // Auto-print when ready
              // Uncomment the next line to enable auto-print
              // window.print();
            }
          </script>
        </body>
        </html>
      `)
      bidWindow.document.close()
    }
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
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            ${bid.recommendedPrice?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {bid.grossMargin ? `Margin: ${bid.grossMargin}% • ` : ''}
                            {bid.profitabilityRating || 'No rating'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created: {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {bid.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewBid(bid)}
                        className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
                      >
                        📄 View Bid Details
                      </button>
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
