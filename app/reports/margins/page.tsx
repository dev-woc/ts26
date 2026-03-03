"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MarginBucket {
  range: string
  min: number
  max: number
  count: number
  totalValue: number
  opportunities: Array<{
    id: string
    title: string
    solicitationNumber: string
    profitMarginPercent: number | null
    estimatedValue: number | null
  }>
}

interface MarginsData {
  buckets: MarginBucket[]
  averageMargin: number
  totalAssessed: number
  meetsTargetCount: number
  meetsTargetPercent: number
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

function getBucketColor(min: number): string {
  if (min >= 25) return 'bg-green-100 border-green-400 text-green-800'
  if (min >= 15) return 'bg-blue-100 border-blue-400 text-blue-800'
  if (min >= 10) return 'bg-yellow-100 border-yellow-400 text-yellow-800'
  if (min >= 5) return 'bg-orange-100 border-orange-400 text-orange-800'
  return 'bg-red-100 border-red-400 text-red-800'
}

export default function MarginsReportPage() {
  const router = useRouter()
  const [data, setData] = useState<MarginsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)

  useEffect(() => {
    fetchMarginsData()
  }, [])

  const fetchMarginsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/margins')
      if (!response.ok) throw new Error('Failed to fetch margins data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Margin Analysis</h1>
            <p className="mt-2 text-sm text-gray-600">
              Profit margin distribution across opportunities
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading margins data...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => { setError(''); fetchMarginsData(); }}
              className="mt-2 text-sm text-red-600 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Average Margin
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.averageMargin.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Assessed Opportunities
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.totalAssessed}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Meets Target (10%+)
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {data.meetsTargetCount}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Target Rate
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.meetsTargetPercent.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Margin Buckets */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Margin Distribution</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {data.buckets.map((bucket) => (
                  <div key={bucket.range}>
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedBucket(
                          expandedBucket === bucket.range ? null : bucket.range
                        )
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getBucketColor(
                              bucket.min
                            )}`}
                          >
                            {bucket.range}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {bucket.count} opportunit{bucket.count === 1 ? 'y' : 'ies'}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-gray-600">
                            {formatCurrency(bucket.totalValue)} total value
                          </span>
                          <svg
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedBucket === bucket.range ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Visual bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              bucket.min >= 10 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{
                              width: `${
                                data.totalAssessed > 0
                                  ? (bucket.count / data.totalAssessed) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded list */}
                    {expandedBucket === bucket.range && bucket.opportunities.length > 0 && (
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wider">
                              <th className="text-left pb-2">Opportunity</th>
                              <th className="text-left pb-2">Solicitation #</th>
                              <th className="text-right pb-2">Margin</th>
                              <th className="text-right pb-2">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bucket.opportunities.map((opp) => (
                              <tr
                                key={opp.id}
                                className="hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/opportunities/${opp.id}`)
                                }}
                              >
                                <td className="py-2 text-sm text-gray-900">
                                  {opp.title}
                                </td>
                                <td className="py-2 text-sm text-gray-500">
                                  {opp.solicitationNumber}
                                </td>
                                <td className="py-2 text-sm text-gray-900 text-right">
                                  {opp.profitMarginPercent !== null
                                    ? `${opp.profitMarginPercent.toFixed(1)}%`
                                    : '-'}
                                </td>
                                <td className="py-2 text-sm text-gray-900 text-right">
                                  {opp.estimatedValue
                                    ? formatCurrency(opp.estimatedValue)
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
