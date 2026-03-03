'use client'

import { useState, useEffect } from 'react'

interface BidContent {
  header?: {
    title?: string
    date?: string
    bid_id?: string
    prepared_for?: string
    prepared_by?: string
  }
  opportunity?: {
    title?: string
    solicitation_number?: string
    agency?: string
    naics_code?: string
  }
  pricing?: {
    recommended_price?: number
    cost_basis?: number
    gross_margin?: number
    confidence?: string
    source?: string
  }
  sections?: Array<{ title: string; content: string }>
  subcontractor_estimates?: Array<{
    name: string
    service: string
    estimated_cost: number
    is_actual_quote: boolean
  }>
}

interface QuickBidCreatorProps {
  opportunityId: string
  opportunityTitle: string
  solicitationNumber: string
  agency: string
  naicsCode?: string
  recommendedPrice: number
  costBasis: number
  grossMargin: number
  confidence: string
  source: string
  subcontractors?: Array<{
    name: string
    service?: string
    quotedAmount?: number
    isActualQuote?: boolean
  }>
  existingContent?: BidContent
  onSave: (bidAmount: number, content: BidContent) => Promise<void>
  onCancel: () => void
}

export default function QuickBidCreator({
  opportunityId,
  opportunityTitle,
  solicitationNumber,
  agency,
  naicsCode,
  recommendedPrice,
  costBasis,
  grossMargin,
  confidence,
  source,
  subcontractors = [],
  existingContent,
  onSave,
  onCancel,
}: QuickBidCreatorProps) {
  const [bidAmount, setBidAmount] = useState<string>(recommendedPrice.toString())
  const [saving, setSaving] = useState(false)
  const [customMargin, setCustomMargin] = useState<number>(grossMargin)

  // Calculate margin when bid amount changes
  useEffect(() => {
    const amount = parseFloat(bidAmount) || 0
    if (amount > 0 && costBasis > 0) {
      const margin = ((amount - costBasis) / amount) * 100
      setCustomMargin(parseFloat(margin.toFixed(1)))
    }
  }, [bidAmount, costBasis])

  const handleSubmit = async () => {
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid bid amount')
      return
    }

    setSaving(true)
    try {
      const content: BidContent = {
        header: {
          title: `Bid Proposal - ${opportunityTitle}`,
          date: new Date().toISOString().split('T')[0],
          bid_id: `BID-${Date.now()}`,
          prepared_for: agency,
          prepared_by: 'Your Company Name',
        },
        opportunity: {
          title: opportunityTitle,
          solicitation_number: solicitationNumber,
          agency: agency,
          naics_code: naicsCode,
        },
        pricing: {
          recommended_price: amount,
          cost_basis: costBasis,
          gross_margin: customMargin,
          confidence: confidence,
          source: source,
        },
        sections: existingContent?.sections || [
          {
            title: 'Executive Summary',
            content:
              'Our team brings extensive experience and proven capabilities to deliver exceptional results for this opportunity.',
          },
          {
            title: 'Technical Approach',
            content:
              'We propose a comprehensive methodology that ensures quality deliverables within the specified timeline.',
          },
          {
            title: 'Past Performance',
            content:
              'We have successfully completed similar projects demonstrating our reliability and expertise.',
          },
        ],
        subcontractor_estimates: subcontractors.map((sub) => ({
          name: sub.name,
          service: sub.service || 'General Support',
          estimated_cost: sub.quotedAmount || 0,
          is_actual_quote: sub.isActualQuote || false,
        })),
      }

      await onSave(amount, content)
    } catch (err) {
      console.error('Error saving bid:', err)
      alert('Failed to save bid')
    } finally {
      setSaving(false)
    }
  }

  // Determine margin health
  const marginHealth =
    customMargin >= 25
      ? { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
      : customMargin >= 20
      ? { label: 'Good', color: 'text-green-600', bg: 'bg-green-50' }
      : customMargin >= 15
      ? { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' }
      : customMargin >= 10
      ? { label: 'Low', color: 'text-orange-600', bg: 'bg-orange-50' }
      : { label: 'Marginal', color: 'text-red-600', bg: 'bg-red-50' }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-lg font-bold text-white">Quick Bid Creator</h3>
        <p className="text-blue-100 text-sm">
          Enter your bid amount - everything else is auto-filled
        </p>
      </div>

      <div className="p-6">
        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input section */}
          <div className="space-y-6">
            {/* Your bid amount - THE ONLY MANUAL INPUT */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
              <label className="block text-sm font-bold text-blue-900 mb-2">
                YOUR BID AMOUNT
                <span className="ml-2 text-xs font-normal text-blue-600">
                  (Only field you need to fill)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => {
                    // Allow only numbers and decimal
                    const val = e.target.value.replace(/[^0-9.]/g, '')
                    setBidAmount(val)
                  }}
                  className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-gray-900 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-sm text-blue-700">
                Recommended: ${recommendedPrice.toLocaleString()} based on {source.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Quick adjustment buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Adjustments</p>
              <div className="flex flex-wrap gap-2">
                {[-10, -5, 0, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      const adjusted = recommendedPrice * (1 + pct / 100)
                      setBidAmount(Math.round(adjusted).toString())
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pct === 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pct === 0 ? 'Recommended' : pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time margin indicator */}
            <div className={`${marginHealth.bg} rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Your Margin</span>
                <span className={`text-lg font-bold ${marginHealth.color}`}>
                  {customMargin.toFixed(1)}% - {marginHealth.label}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    customMargin >= 20
                      ? 'bg-green-500'
                      : customMargin >= 15
                      ? 'bg-yellow-500'
                      : customMargin >= 10
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(customMargin * 2, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
                <span>30%</span>
                <span>50%+</span>
              </div>
            </div>
          </div>

          {/* Right: Preview section */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              AUTO-FILLED (No action needed)
            </h4>

            <div className="space-y-4 text-sm">
              {/* Opportunity info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">OPPORTUNITY</p>
                <p className="font-medium text-gray-900 line-clamp-2">{opportunityTitle}</p>
                <p className="text-gray-500 text-xs mt-1">{solicitationNumber}</p>
              </div>

              {/* Agency */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">AGENCY</p>
                <p className="font-medium text-gray-900">{agency}</p>
              </div>

              {/* Cost basis */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">ESTIMATED COST BASIS</p>
                <p className="font-medium text-gray-900">
                  ${costBasis.toLocaleString()}
                </p>
              </div>

              {/* Subcontractors */}
              {subcontractors.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">SUBCONTRACTOR ESTIMATES</p>
                  <ul className="space-y-1">
                    {subcontractors.slice(0, 3).map((sub, i) => (
                      <li key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600">{sub.name}</span>
                        <span className="font-medium">
                          {sub.quotedAmount
                            ? `$${sub.quotedAmount.toLocaleString()}`
                            : 'Pending'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data source badge */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">PRICING DATA SOURCE</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {source === 'usaspending_api'
                    ? 'Historical Data'
                    : source === 'subcontractor_quotes'
                    ? 'Quotes Received'
                    : source === 'cost_based'
                    ? 'Cost Based'
                    : 'Estimated'}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  Confidence: {confidence}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !bidAmount || parseFloat(bidAmount) <= 0}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Bid
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
