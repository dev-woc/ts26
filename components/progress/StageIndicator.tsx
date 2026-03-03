'use client'

interface StageConfig {
  label: string
  description: string
  icon: string
  color: string
}

interface StageIndicatorProps {
  stage: string
  config: StageConfig
  isActive: boolean
  isCompleted: boolean
  isFuture: boolean
  onClick?: () => void
  clickable?: boolean
}

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
    iconBg: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-700',
    iconBg: 'bg-purple-500',
  },
  indigo: {
    bg: 'bg-indigo-100',
    border: 'border-indigo-500',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-500',
  },
  yellow: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    iconBg: 'bg-yellow-500',
  },
  orange: {
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    text: 'text-orange-700',
    iconBg: 'bg-orange-500',
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    iconBg: 'bg-green-500',
  },
  gray: {
    bg: 'bg-gray-100',
    border: 'border-gray-500',
    text: 'text-gray-700',
    iconBg: 'bg-gray-500',
  },
}

export default function StageIndicator({
  stage,
  config,
  isActive,
  isCompleted,
  isFuture,
  onClick,
  clickable,
}: StageIndicatorProps) {
  const colors = COLOR_CLASSES[config.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`
        relative p-3 rounded-lg border-2 transition-all
        ${isActive ? `${colors.bg} ${colors.border} shadow-md scale-105` : ''}
        ${isCompleted ? 'bg-green-50 border-green-500' : ''}
        ${isFuture ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
        ${clickable && !isActive ? 'cursor-pointer hover:shadow-md hover:scale-102' : ''}
        ${!isActive && !isCompleted && !isFuture ? 'border-gray-300' : ''}
      `}
    >
      {/* Icon */}
      <div className="flex justify-center mb-2">
        <div
          className={`
          w-10 h-10 rounded-full flex items-center justify-center text-white text-xl
          ${isActive ? colors.iconBg : ''}
          ${isCompleted ? 'bg-green-500' : ''}
          ${isFuture ? 'bg-gray-300' : ''}
        `}
        >
          {isCompleted ? '✓' : config.icon}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p
          className={`text-xs font-semibold mb-1 ${
            isActive ? colors.text : isCompleted ? 'text-green-700' : 'text-gray-600'
          }`}
        >
          {config.label}
        </p>
        <p className="text-[10px] text-gray-500 leading-tight">
          {config.description}
        </p>
      </div>

      {/* Active indicator pulse */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.iconBg} opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${colors.iconBg}`}
            ></span>
          </span>
        </div>
      )}
    </div>
  )
}
