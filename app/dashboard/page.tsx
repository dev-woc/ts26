"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    activeOpportunities: 0,
    totalBids: 0,
    totalSubcontractors: 0,
  })
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      // Fetch recent opportunities
      const response = await fetch('/api/opportunities?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentOpportunities(data.opportunities || [])
        setStats(prev => ({
          ...prev,
          totalOpportunities: data.pagination?.total || 0,
          activeOpportunities: data.opportunities?.length || 0,
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {session?.user?.name || 'User'}!
              </p>
            </div>
            <Link
              href="/opportunities"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View All Opportunities
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOpportunities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Opportunities</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeOpportunities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bids</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBids}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subcontractors</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSubcontractors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Opportunities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Opportunities</h2>
          </div>
          <div className="p-6">
            {recentOpportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No opportunities yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Opportunities will appear here once they are fetched from SAM.gov
                </p>
                {session?.user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {/* TODO: Trigger fetch */}}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Fetch Opportunities
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentOpportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 hover:text-blue-600">
                          {opp.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {opp.solicitationNumber} • {opp.agency}
                        </p>
                      </div>
                      {opp.responseDeadline && (
                        <span className="text-sm text-gray-600">
                          {Math.ceil((new Date(opp.responseDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/opportunities"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Browse Opportunities</h3>
            <p className="text-sm text-gray-600">
              Search and filter government contracting opportunities
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow opacity-50 cursor-not-allowed">
            <h3 className="font-semibold text-gray-900 mb-2">Create Bid</h3>
            <p className="text-sm text-gray-600">
              Generate automated pricing and proposals (Coming soon)
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow opacity-50 cursor-not-allowed">
            <h3 className="font-semibold text-gray-900 mb-2">Find Subcontractors</h3>
            <p className="text-sm text-gray-600">
              Discover qualified subcontractors via Google Places (Coming soon)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
