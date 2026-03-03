import { SOWStatus } from '@prisma/client'
import { getStatusBadgeColor, getStatusLabel } from '@/lib/sow-utils'

interface SOWStatusBadgeProps {
  status: SOWStatus
  className?: string
}

export default function SOWStatusBadge({ status, className = '' }: SOWStatusBadgeProps) {
  const colorClass = getStatusBadgeColor(status)
  const label = getStatusLabel(status)

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}
