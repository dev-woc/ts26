"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SystemSettings {
  samApiKey: boolean
  usaSpendingEnabled: boolean
  googlePlacesApiKey: boolean
  emailProvider: string | null
  blobStorageConfigured: boolean
  databaseConnected: boolean
}

interface CronJob {
  id: string
  name: string
  lastRunAt: string | null
  lastRunStatus: string | null
  nextRunAt: string | null
  enabled: boolean
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setSettings(data.settings)
      setCronJobs(data.cronJobs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const StatusIndicator = ({ configured }: { configured: boolean }) => (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        configured
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {configured ? 'Configured' : 'Not Configured'}
    </span>
  )

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              View system configuration and integration status
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => { setError(''); fetchSettings(); }}
              className="mt-2 text-sm text-red-600 underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && settings && (
          <div className="space-y-6">
            {/* API Integrations */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">API Integrations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">SAM.gov API</h3>
                    <p className="text-sm text-gray-500">Federal opportunities data source</p>
                  </div>
                  <StatusIndicator configured={settings.samApiKey} />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">USASpending API</h3>
                    <p className="text-sm text-gray-500">Historical contract pricing data</p>
                  </div>
                  <StatusIndicator configured={settings.usaSpendingEnabled} />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Places API</h3>
                    <p className="text-sm text-gray-500">Subcontractor discovery</p>
                  </div>
                  <StatusIndicator configured={settings.googlePlacesApiKey} />
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Infrastructure</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Database</h3>
                    <p className="text-sm text-gray-500">PostgreSQL connection</p>
                  </div>
                  <StatusIndicator configured={settings.databaseConnected} />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Blob Storage</h3>
                    <p className="text-sm text-gray-500">Vercel Blob for document storage</p>
                  </div>
                  <StatusIndicator configured={settings.blobStorageConfigured} />
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Provider</h3>
                    <p className="text-sm text-gray-500">Outbound email service</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {settings.emailProvider || 'Not Configured'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cron Jobs */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Scheduled Jobs</h2>
              </div>
              {cronJobs.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {cronJobs.map((job) => (
                    <div key={job.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{job.name}</h3>
                          <p className="text-sm text-gray-500">
                            Last run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}
                          </p>
                          {job.lastRunStatus && (
                            <p className="text-sm text-gray-500">
                              Status: {job.lastRunStatus}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {job.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No scheduled jobs configured
                </div>
              )}
            </div>

            {/* Environment Info */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Environment</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Environment</dt>
                    <dd className="text-sm text-gray-900">{process.env.NODE_ENV}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="text-sm text-gray-900">1.0.0</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
