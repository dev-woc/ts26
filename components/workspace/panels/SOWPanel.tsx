'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import type { PlainLanguageSection } from '@/lib/openai'

interface SOWSection {
  title: string
  content: string
  summary?: string
  bullets?: string[]
  details?: string
}

interface Attachment {
  id: string
  name: string
  url: string
  type?: string
  size?: number
}

interface PlainLanguageCache {
  generatedAt: string
  sections: PlainLanguageSection[]
}

interface SOWPanelProps {
  sow?: {
    id: string
    version: number
    status: string
    content?: {
      header?: {
        title?: string
        date?: string
      }
      opportunity?: {
        title?: string
        solicitationNumber?: string
        agency?: string
        naicsCode?: string
        responseDeadline?: string
        placeOfPerformance?: string
      }
      scope?: { overview?: string }
      sections?: SOWSection[]
      attachments?: { name: string; url: string }[]
      sourceEnhanced?: boolean
    } | null
    metadata?: Record<string, any> | null
    generatedAt: string | Date
    fileName?: string
    fileUrl?: string
  } | null
  opportunity: {
    id: string
    title: string
    solicitationNumber: string
    agency?: string
    description?: string
    attachments?: Attachment[]
    requirements?: string[]
    deliverables?: string[]
    naicsCode?: string
    periodOfPerformance?: string
  }
  onSave?: (content: any) => Promise<void>
  onGenerate?: () => Promise<void>
  onStatusChange?: (status: string) => Promise<void>
  isGenerating?: boolean
}

// ─── Plain Language Section Card ─────────────────────────────────────────────

function PlainSectionCard({ section }: { section: PlainLanguageSection }) {
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      {/* Section title bar */}
      <div className="px-5 py-3 bg-stone-900 text-white">
        <h3 className="text-xs font-bold tracking-widest uppercase">{section.title}</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Summary */}
        <p className="text-sm text-stone-700 leading-relaxed">{section.summary}</p>

        {/* Action bullets */}
        {section.bullets.length > 0 && (
          <ul className="space-y-2">
            {section.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Critical items — deadlines, dollar amounts, showstoppers */}
        {section.criticalItems.length > 0 && (
          <div className="rounded-lg border border-stone-300 bg-stone-50 divide-y divide-stone-200">
            {section.criticalItems.map((item, i) => (
              <p key={i} className="px-4 py-2.5 text-sm font-medium text-stone-800">
                {item}
              </p>
            ))}
          </div>
        )}

        {/* Why it matters */}
        {section.whyItMatters && (
          <div className="flex items-start gap-2.5 rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
            <svg className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-stone-500 italic leading-relaxed">
              <span className="font-medium not-italic text-stone-600">Why this matters: </span>
              {section.whyItMatters}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Generating skeleton ──────────────────────────────────────────────────────

function TransformingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="border border-stone-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-stone-200 h-9" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-stone-100 rounded w-full" />
            <div className="h-4 bg-stone-100 rounded w-4/5" />
            <div className="h-4 bg-stone-100 rounded w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main SOWPanel ────────────────────────────────────────────────────────────

export default function SOWPanel({
  sow,
  opportunity,
  onGenerate,
  onStatusChange,
  isGenerating,
}: SOWPanelProps) {
  const [isTransforming, setIsTransforming] = useState(false)
  const [transformError, setTransformError] = useState('')
  const [plainCache, setPlainCache] = useState<PlainLanguageCache | null>(
    (sow?.metadata?.plainLanguage as PlainLanguageCache) ?? null
  )

  const hasAutoTriggered = useRef(false)

  // Sync cache when sow prop changes (e.g. after a re-generate)
  useEffect(() => {
    if (sow?.metadata?.plainLanguage) {
      setPlainCache(sow.metadata.plainLanguage as PlainLanguageCache)
    }
  }, [sow?.metadata?.plainLanguage])

  // Auto-generate plain language on first load if SOW exists but cache is empty
  useEffect(() => {
    if (sow && !plainCache && !isTransforming && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true
      handleTransform()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sow?.id])

  const handleTransform = async () => {
    if (!sow) return
    setIsTransforming(true)
    setTransformError('')
    try {
      const res = await fetch(`/api/sows/${sow.id}/transform`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transformation failed')
      setPlainCache(data.plainLanguage)
    } catch (err) {
      setTransformError(err instanceof Error ? err.message : 'Transformation failed')
    } finally {
      setIsTransforming(false)
    }
  }

  // ── No SOW yet ──────────────────────────────────────────────────────────
  if (!sow) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-stone-800 mb-2">No SOW yet</h2>
          <p className="text-sm text-stone-500 mb-4">
            Generate a Statement of Work tailored to this opportunity. The SOW will pull specifications from the solicitation.
          </p>
          {onGenerate && (
            <button
              onClick={() => onGenerate()}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : 'Generate SOW'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── SOW exists ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* ── Header row ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-stone-900">Statement of Work</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Version {sow.version} · {format(new Date(sow.generatedAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                sow.status === 'APPROVED' ? 'bg-stone-800 text-white' :
                sow.status === 'PENDING_REVIEW' ? 'bg-stone-300 text-stone-700' :
                sow.status === 'SENT' ? 'bg-stone-200 text-stone-600' :
                'bg-stone-100 text-stone-500'
              }`}>
                {sow.status.replace(/_/g, ' ').toLowerCase()}
              </span>
              {plainCache && (
                <button
                  onClick={handleTransform}
                  disabled={isTransforming}
                  className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Re-generate
                </button>
              )}
            </div>
          </div>

          {/* Error state */}
          {transformError && (
            <div className="bg-stone-50 border border-stone-300 text-stone-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{transformError}</span>
              <button
                onClick={handleTransform}
                className="text-xs font-medium text-stone-600 underline underline-offset-2 ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Content ── */}
          {isTransforming ? (
            <div>
              <p className="text-xs text-stone-400 mb-4 flex items-center gap-2">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simplifying with AI…
              </p>
              <TransformingSkeleton />
            </div>
          ) : plainCache ? (
            <div className="space-y-4">
              {/* Document meta */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Plain Language Summary</p>
                <p className="text-sm text-stone-600">
                  {sow.content?.opportunity?.solicitationNumber || opportunity.solicitationNumber}
                  {(sow.content?.opportunity?.agency || opportunity.agency) && (
                    <> · {sow.content?.opportunity?.agency || opportunity.agency}</>
                  )}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Simplified {format(new Date(plainCache.generatedAt), 'MMM d, yyyy')}
                </p>
              </div>

              {plainCache.sections.map((section, idx) => (
                <PlainSectionCard key={idx} section={section} />
              ))}
            </div>
          ) : (
            /* SOW exists but transform failed and no cache — show retry */
            <div className="bg-white border border-stone-200 rounded-lg p-8 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-700 mb-1">Generating plain language view</p>
              <p className="text-xs text-stone-400 mb-4">
                AI is rewriting this SOW in clear business language with active voice, plain English, and explanations of why each requirement matters.
              </p>
              <button
                onClick={handleTransform}
                disabled={isTransforming}
                className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                Generate Plain Language Version
              </button>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            {sow.status === 'DRAFT' && onStatusChange && (
              <button
                onClick={() => onStatusChange('PENDING_REVIEW')}
                className="flex-1 px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Submit for review
              </button>
            )}
            {sow.status === 'APPROVED' && onStatusChange && (
              <button
                onClick={() => onStatusChange('SENT')}
                className="flex-1 px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Mark as sent
              </button>
            )}
            {sow.fileUrl && (
              <a
                href={sow.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Download PDF
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
