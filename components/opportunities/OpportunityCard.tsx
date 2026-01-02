import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface OpportunityCardProps {
  opportunity: {
    id: string
    solicitationNumber: string
    title: string
    description?: string | null
    agency?: string | null
    naicsCode?: string | null
    responseDeadline?: Date | null
    postedDate?: Date | null
    status: string
    _count?: {
      bids: number
      subcontractors: number
    }
  }
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const getDeadlineColor = (days: number | null) => {
    if (!days) return 'text-gray-500'
    if (days < 7) return 'text-red-600'
    if (days < 14) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      AWARDED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Link href={`/opportunities/${opportunity.id}`}>
      <div className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
              {opportunity.title}
            </h3>
            <p className="text-sm text-gray-500">
              {opportunity.solicitationNumber}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
              opportunity.status
            )}`}
          >
            {opportunity.status}
          </span>
        </div>

        {/* Description */}
        {opportunity.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {opportunity.description}
          </p>
        )}

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {opportunity.agency && (
            <div>
              <span className="text-gray-500">Agency:</span>
              <span className="ml-2 text-gray-900">{opportunity.agency}</span>
            </div>
          )}
          {opportunity.naicsCode && (
            <div>
              <span className="text-gray-500">NAICS:</span>
              <span className="ml-2 text-gray-900">{opportunity.naicsCode}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex gap-4 text-sm">
            {opportunity._count && opportunity._count.bids > 0 && (
              <span className="text-gray-600">
                💰 {opportunity._count.bids} {opportunity._count.bids === 1 ? 'Bid' : 'Bids'}
              </span>
            )}
            {opportunity._count && opportunity._count.subcontractors > 0 && (
              <span className="text-gray-600">
                👥 {opportunity._count.subcontractors}{' '}
                {opportunity._count.subcontractors === 1 ? 'Subcontractor' : 'Subcontractors'}
              </span>
            )}
          </div>

          {deadline && (
            <div className={`text-sm font-semibold ${getDeadlineColor(daysUntilDeadline)}`}>
              {daysUntilDeadline !== null && daysUntilDeadline > 0
                ? `${daysUntilDeadline} days left`
                : daysUntilDeadline === 0
                ? 'Due today'
                : 'Expired'}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
