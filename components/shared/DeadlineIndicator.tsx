'use client'

import { differenceInDays, differenceInHours, format } from 'date-fns'

interface DeadlineIndicatorProps {
  deadline: Date | string | null
  size?: 'sm' | 'md' | 'lg'
  showDate?: boolean
}

export default function DeadlineIndicator({
  deadline,
  size = 'md',
  showDate = true,
}: DeadlineIndicatorProps) {
  if (!deadline) return null

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const daysLeft = differenceInDays(deadlineDate, now)
  const hoursLeft = differenceInHours(deadlineDate, now)

  // Determine urgency level
  let urgency: 'expired' | 'critical' | 'warning' | 'caution' | 'safe'
  let bgColor: string
  let textColor: string
  let borderColor: string
  let pulseClass: string = ''

  if (daysLeft < 0) {
    urgency = 'expired'
    bgColor = 'bg-gray-100'
    textColor = 'text-gray-600'
    borderColor = 'border-gray-300'
  } else if (daysLeft <= 3) {
    urgency = 'critical'
    bgColor = 'bg-red-50'
    textColor = 'text-red-700'
    borderColor = 'border-red-400'
    pulseClass = 'animate-pulse'
  } else if (daysLeft <= 7) {
    urgency = 'warning'
    bgColor = 'bg-orange-50'
    textColor = 'text-orange-700'
    borderColor = 'border-orange-400'
  } else if (daysLeft <= 14) {
    urgency = 'caution'
    bgColor = 'bg-yellow-50'
    textColor = 'text-yellow-700'
    borderColor = 'border-yellow-400'
  } else {
    urgency = 'safe'
    bgColor = 'bg-green-50'
    textColor = 'text-green-700'
    borderColor = 'border-green-400'
  }

  // Format countdown text
  let countdownText: string
  if (daysLeft < 0) {
    countdownText = 'EXPIRED'
  } else if (hoursLeft < 24) {
    countdownText = `${hoursLeft}h left`
  } else if (daysLeft === 1) {
    countdownText = '1 day left'
  } else {
    countdownText = `${daysLeft} days left`
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={`
        ${bgColor} ${borderColor} ${sizeClasses[size]} ${pulseClass}
        border-2 rounded-lg flex items-center gap-2 font-semibold
      `}
    >
      {/* Clock icon */}
      <svg
        className={`${iconSizes[size]} ${textColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <div className="flex flex-col">
        <span className={`${textColor} font-bold`}>{countdownText}</span>
        {showDate && (
          <span className={`${textColor} opacity-75 text-xs`}>
            Due: {format(deadlineDate, 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Urgency indicator dot */}
      {urgency === 'critical' && (
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </div>
  )
}
