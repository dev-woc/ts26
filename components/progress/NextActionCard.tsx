'use client'

interface NextAction {
  id: string
  description: string
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
}

interface NextActionCardProps {
  action: NextAction
  onComplete?: (actionId: string) => void
}

export default function NextActionCard({ action, onComplete }: NextActionCardProps) {
  const priorityConfig = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
      icon: '🔴',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
      icon: '🟡',
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      icon: '🔵',
    },
  }

  const config = priorityConfig[action.priority]

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-3 flex items-start justify-between gap-3`}
    >
      <div className="flex items-start gap-3 flex-1">
        <span className="text-lg mt-0.5">{config.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{action.description}</p>
          {action.assignedTo && (
            <p className="text-xs text-gray-600 mt-1">
              Assigned to: <span className="font-semibold">{action.assignedTo}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-semibold rounded ${config.badge}`}>
          {action.priority}
        </span>
        {onComplete && (
          <button
            onClick={() => onComplete(action.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Mark as complete"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
