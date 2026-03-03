'use client'

import { useState } from 'react'

interface Subcontractor {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  website?: string | null
  service?: string | null
  rating?: number | null
  totalRatings?: number | null
  quotedAmount?: number | null
  isActualQuote?: boolean
  source?: string | null
}

interface SubcontractorSuggestionsProps {
  subcontractors: Subcontractor[]
  opportunityId: string
  onRequestQuote?: (subcontractor: Subcontractor) => void
  onSendDetails?: (subcontractor: Subcontractor) => void
  maxDisplay?: number
}

export default function SubcontractorSuggestions({
  subcontractors,
  opportunityId,
  onRequestQuote,
  onSendDetails,
  maxDisplay = 3,
}: SubcontractorSuggestionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!subcontractors || subcontractors.length === 0) {
    return null
  }

  // Take only the first maxDisplay subcontractors
  const displaySubs = subcontractors.slice(0, maxDisplay)

  const handleRequestQuote = async (sub: Subcontractor) => {
    setLoadingId(sub.id)
    try {
      if (onRequestQuote) {
        await onRequestQuote(sub)
      } else {
        // Default behavior: open email client
        const subject = encodeURIComponent(`Quote Request - Opportunity ${opportunityId}`)
        const body = encodeURIComponent(
          `Hello ${sub.name},\n\nI am requesting a quote for a government contracting opportunity. Please provide your best pricing and availability.\n\nThank you.`
        )
        window.open(`mailto:${sub.email}?subject=${subject}&body=${body}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleSendDetails = async (sub: Subcontractor) => {
    setLoadingId(sub.id)
    try {
      if (onSendDetails) {
        await onSendDetails(sub)
      } else {
        // Default behavior: open email client with details
        const subject = encodeURIComponent(`Opportunity Details - ${opportunityId}`)
        const body = encodeURIComponent(
          `Hello ${sub.name},\n\nPlease find attached the details for this opportunity. Let me know if you're interested in collaborating.\n\nThank you.`
        )
        window.open(`mailto:${sub.email}?subject=${subject}&body=${body}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
            <svg
              className="h-5 w-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Suggested Subcontractors</h3>
            <p className="text-sm text-gray-500">
              {subcontractors.length} found for this opportunity
            </p>
          </div>
        </div>
      </div>

      {/* Subcontractor list */}
      <div className="divide-y divide-gray-100">
        {displaySubs.map((sub) => (
          <div
            key={sub.id}
            className={`p-5 transition-colors ${
              expandedId === sub.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-semibold text-gray-900 truncate">
                    {sub.name}
                  </h4>
                  {sub.rating && (
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {sub.rating.toFixed(1)}
                      {sub.totalRatings && (
                        <span className="text-gray-400">({sub.totalRatings})</span>
                      )}
                    </span>
                  )}
                </div>

                {sub.service && (
                  <p className="text-sm text-gray-600 mb-2">{sub.service}</p>
                )}

                {/* Contact info row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {sub.phone && (
                    <a
                      href={`tel:${sub.phone}`}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {sub.phone}
                    </a>
                  )}
                  {sub.email && (
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {sub.email}
                    </span>
                  )}
                </div>

                {/* Quote status */}
                {sub.quotedAmount && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Quote received: ${sub.quotedAmount.toLocaleString()}
                    {sub.isActualQuote && <span className="text-green-600">(Verified)</span>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {sub.email && !sub.quotedAmount && (
                  <button
                    onClick={() => handleRequestQuote(sub)}
                    disabled={loadingId === sub.id}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {loadingId === sub.id ? 'Sending...' : 'Request Quote'}
                  </button>
                )}
                {sub.email && (
                  <button
                    onClick={() => handleSendDetails(sub)}
                    disabled={loadingId === sub.id}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    Send Details
                  </button>
                )}
                {sub.phone && (
                  <a
                    href={`tel:${sub.phone}`}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap text-center"
                  >
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more link */}
      {subcontractors.length > maxDisplay && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
            View all {subcontractors.length} subcontractors →
          </button>
        </div>
      )}
    </div>
  )
}
