import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import SOWStatusBadge from './SOWStatusBadge'
import { SOWStatus } from '@prisma/client'

interface SOWCardProps {
  sow: {
    id: string
    version: number
    status: SOWStatus
    generatedAt: Date
    fileName: string | null
    opportunity: {
      id: string
      title: string
      solicitationNumber: string
    }
    generatedBy?: {
      name: string | null
    } | null
    currentApprover?: {
      name: string | null
    } | null
    _count?: {
      approvals: number
      versions: number
    }
  }
}

export default function SOWCard({ sow }: SOWCardProps) {
  return (
    <Link href={`/sows/${sow.id}`}>
      <div className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {sow.opportunity.title}
            </h3>
            <p className="text-sm text-gray-500">
              {sow.opportunity.solicitationNumber} • Version {sow.version}
            </p>
          </div>
          <SOWStatusBadge status={sow.status} />
        </div>

        <div className="space-y-2">
          {sow.fileName && (
            <p className="text-sm text-gray-600 truncate">
              📄 {sow.fileName}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Generated {formatDistanceToNow(new Date(sow.generatedAt), { addSuffix: true })}
            </span>
            {sow.generatedBy?.name && (
              <span>
                by {sow.generatedBy.name}
              </span>
            )}
          </div>

          {sow.currentApprover?.name && (
            <p className="text-sm text-gray-600">
              👤 Assigned to: {sow.currentApprover.name}
            </p>
          )}
        </div>

        {sow._count && (sow._count.approvals > 0 || sow._count.versions > 0) && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
            {sow._count.approvals > 0 && (
              <span>
                {sow._count.approvals} approval{sow._count.approvals !== 1 ? 's' : ''}
              </span>
            )}
            {sow._count.versions > 0 && (
              <span>
                {sow._count.versions} version{sow._count.versions !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
