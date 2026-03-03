'use client'

interface NextActionBannerProps {
  action: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  loading?: boolean
  variant?: 'primary' | 'warning' | 'success'
}

export default function NextActionBanner({
  action,
  description,
  actionLabel,
  onAction,
  loading = false,
  variant = 'primary',
}: NextActionBannerProps) {
  const variants = {
    primary: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      ring: 'focus:ring-blue-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-amber-500',
      hover: 'hover:bg-amber-600',
      ring: 'focus:ring-amber-400',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      ring: 'focus:ring-green-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  }

  const config = variants[variant]

  return (
    <div className={`${config.bg} rounded-xl shadow-lg overflow-hidden`}>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Action text */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
              <div className="text-white">{config.icon}</div>
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">
                Your Next Step
              </p>
              <p className="text-white text-lg font-bold truncate">{action}</p>
              {description && (
                <p className="text-white/70 text-sm mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Right side - Action button */}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              disabled={loading}
              className={`
                flex-shrink-0 px-6 py-3 bg-white rounded-lg
                text-gray-900 font-semibold text-sm
                ${config.hover} hover:bg-gray-50
                focus:outline-none focus:ring-2 ${config.ring} focus:ring-offset-2 focus:ring-offset-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                shadow-md hover:shadow-lg
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  Working...
                </span>
              ) : (
                actionLabel
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator bar */}
      <div className="h-1 bg-white/20">
        <div className="h-full bg-white/40 w-0 animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  )
}
