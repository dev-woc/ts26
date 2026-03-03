import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BidStatus } from '@prisma/client'

interface BidCardProps {
  bid: {
    id: string
    recommendedPrice: number
    costBasis: number | null
    grossMargin: number | null
    profitabilityRating: string | null
    opportunitySize: string | null
    confidence: string | null
    source: string | null
    status: BidStatus
    createdAt: Date
    notes: string | null
    opportunity: {
      id: string
      title: string
      solicitationNumber: string
      agency: string | null
    }
    user?: {
      name: string | null
    } | null
  }
}

function BidStatusBadge({ status }: { status: BidStatus }) {
  const styles: Record<BidStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-purple-100 text-purple-800',
    AWARDED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const labels: Record<BidStatus, string> = {
    DRAFT: 'Draft',
    REVIEWED: 'Reviewed',
    SUBMITTED: 'Submitted',
    AWARDED: 'Awarded',
    REJECTED: 'Rejected',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null

  const config: Record<string, { label: string; className: string }> = {
    usaspending_api: {
      label: 'Historical Data',
      className: 'bg-green-100 text-green-800',
    },
    subcontractor_quotes: {
      label: 'Quotes Received',
      className: 'bg-blue-100 text-blue-800',
    },
    cost_based: {
      label: 'Cost Based',
      className: 'bg-indigo-100 text-indigo-800',
    },
    industry_average: {
      label: 'Industry Avg',
      className: 'bg-yellow-100 text-yellow-800',
    },
    default_fallback: {
      label: 'Estimated',
      className: 'bg-yellow-100 text-yellow-800',
    },
  }

  const { label, className } = config[source] || {
    label: source,
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  if (!confidence) return null

  const config: Record<string, { label: string; className: string }> = {
    high: {
      label: 'High Confidence',
      className: 'bg-green-100 text-green-800',
    },
    medium: {
      label: 'Medium Confidence',
      className: 'bg-blue-100 text-blue-800',
    },
    low: {
      label: 'Low Confidence',
      className: 'bg-yellow-100 text-yellow-800',
    },
    very_low: {
      label: 'Very Low Confidence',
      className: 'bg-red-100 text-red-800',
    },
  }

  const { label, className } = config[confidence] || {
    label: confidence,
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  )
}

function ProfitabilityBadge({ rating }: { rating: string | null }) {
  if (!rating) return null

  const config: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-800',
    Good: 'bg-blue-100 text-blue-800',
    Moderate: 'bg-yellow-100 text-yellow-800',
    Marginal: 'bg-orange-100 text-orange-800',
    Low: 'bg-red-100 text-red-800',
  }

  const className = config[rating] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {rating}
    </span>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BidCard({ bid }: BidCardProps) {
  return (
    <Link href={`/bids/${bid.id}`}>
      <div className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {bid.opportunity.title}
            </h3>
            <p className="text-sm text-gray-500">
              {bid.opportunity.solicitationNumber}
              {bid.opportunity.agency && ` • ${bid.opportunity.agency}`}
            </p>
          </div>
          <BidStatusBadge status={bid.status} />
        </div>

        {/* Pricing Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Recommended Price</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(bid.recommendedPrice)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Margin</p>
              <p className="text-lg font-semibold text-gray-900">
                {bid.grossMargin !== null ? `${bid.grossMargin.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <ProfitabilityBadge rating={bid.profitabilityRating} />
          <ConfidenceBadge confidence={bid.confidence} />
          <SourceBadge source={bid.source} />
          {bid.opportunitySize && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              {bid.opportunitySize}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
          <span>
            Created {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
          </span>
          {bid.user?.name && (
            <span>
              by {bid.user.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
