'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
    metadata?: Record<string, unknown> | null
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
  onSave?: (content: unknown) => Promise<void>
  onSaveAndRefresh?: (content: unknown) => Promise<void>
  onGenerate?: () => Promise<void>
  onStatusChange?: (status: string) => Promise<void>
  isGenerating?: boolean
}

// ─── Plain Language Section Card ─────────────────────────────────────────────

function PlainSectionCard({ section }: { section: PlainLanguageSection }) {
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 bg-stone-900 text-white">
        <h3 className="text-xs font-bold tracking-widest uppercase">{section.title}</h3>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-stone-700 leading-relaxed">{section.summary}</p>

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

        {section.criticalItems.length > 0 && (
          <div className="rounded-lg border border-stone-300 bg-stone-50 divide-y divide-stone-200">
            {section.criticalItems.map((item, i) => (
              <p key={i} className="px-4 py-2.5 text-sm font-medium text-stone-800">
                {item}
              </p>
            ))}
          </div>
        )}

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

// ─── Auto-resize textarea ─────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// ─── Main SOWPanel ────────────────────────────────────────────────────────────

export default function SOWPanel({
  sow,
  opportunity,
  onSave,
  onSaveAndRefresh,
  onGenerate,
  onStatusChange,
  isGenerating,
}: SOWPanelProps) {
  const buildDefaultSections = (): SOWSection[] => {
    const sections: SOWSection[] = []
    sections.push({
      title: '1. Scope of Work',
      content: opportunity.description || 'Define the scope of work based on the solicitation requirements.',
    })
    if (opportunity.requirements && opportunity.requirements.length > 0) {
      sections.push({
        title: '2. Requirements',
        content: opportunity.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n'),
      })
    } else {
      sections.push({ title: '2. Requirements', content: 'List specific requirements from the solicitation.' })
    }
    if (opportunity.deliverables && opportunity.deliverables.length > 0) {
      sections.push({
        title: '3. Deliverables',
        content: opportunity.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n'),
      })
    } else {
      sections.push({ title: '3. Deliverables', content: 'Specify deliverables expected from the subcontractor.' })
    }
    sections.push({
      title: '4. Timeline & Schedule',
      content: opportunity.periodOfPerformance
        ? `Period of Performance: ${opportunity.periodOfPerformance}\n\nKey milestones to be determined.`
        : 'Specify project timeline and key milestones.',
    })
    sections.push({
      title: '5. Terms & Conditions',
      content: 'Standard terms and conditions apply. Payment terms: Net 30 upon delivery acceptance.',
    })
    return sections
  }

  const convertStructuredSections = (rawSections: SOWSection[]): SOWSection[] => {
    return rawSections.map((s) => {
      if (s.content && typeof s.content === 'string') {
        return { title: s.title, content: s.content, summary: s.summary, bullets: s.bullets, details: s.details }
      }
      const parts: string[] = []
      if (s.summary) parts.push(s.summary)
      if (s.bullets && s.bullets.length > 0) {
        parts.push('')
        parts.push(...s.bullets.map((b: string) => `- ${b}`))
      }
      if (s.details) {
        parts.push('')
        parts.push(s.details)
      }
      return {
        title: s.title,
        content: parts.join('\n').trim() || s.details || s.summary || '',
        summary: s.summary,
        bullets: s.bullets,
        details: s.details,
      }
    })
  }

  const [sections, setSections] = useState<SOWSection[]>(
    sow?.content?.sections ? convertStructuredSections(sow.content.sections) : buildDefaultSections()
  )

  const [isTransforming, setIsTransforming] = useState(false)
  const [showPlainLanguage, setShowPlainLanguage] = useState(false)
  const [transformError, setTransformError] = useState('')
  const [plainCache, setPlainCache] = useState<PlainLanguageCache | null>(
    (sow?.metadata?.plainLanguage as PlainLanguageCache) ?? null
  )

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAtTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasAutoTriggered = useRef(false)

  useEffect(() => {
    if (sow?.content?.sections) {
      setSections(convertStructuredSections(sow.content.sections))
    }
    if (sow?.metadata?.plainLanguage) {
      setPlainCache(sow.metadata.plainLanguage as PlainLanguageCache)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sow])

  // Auto-generate plain language on first load if SOW exists but no cache yet
  useEffect(() => {
    if (sow && !plainCache && !isTransforming && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true
      handleTransform()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sow?.id])

  // Show plain language section when cache becomes available
  useEffect(() => {
    if (plainCache) setShowPlainLanguage(true)
  }, [plainCache])

  const buildContent = useCallback((currentSections: SOWSection[]) => ({
    header: {
      title: `SOW - ${opportunity.title}`,
      date: new Date().toISOString().split('T')[0],
    },
    sections: currentSections,
  }), [opportunity.title])

  // Debounced auto-save on blur
  const handleBlurSave = useCallback((currentSections: SOWSection[]) => {
    if (!onSave) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await onSave(buildContent(currentSections))
        setSavedAt(new Date())
        if (savedAtTimerRef.current) clearTimeout(savedAtTimerRef.current)
        savedAtTimerRef.current = setTimeout(() => setSavedAt(null), 3000)
      } finally {
        setIsSaving(false)
      }
    }, 400)
  }, [onSave, buildContent])

  const handleTransform = async () => {
    if (!sow) return
    setIsTransforming(true)
    setTransformError('')
    try {
      const res = await fetch(`/api/sows/${sow.id}/transform`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transformation failed')
      setPlainCache(data.plainLanguage)
      setShowPlainLanguage(true)
    } catch (err) {
      setTransformError(err instanceof Error ? err.message : 'Transformation failed')
    } finally {
      setIsTransforming(false)
    }
  }

  const handleSectionTitleChange = (index: number, value: string) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], title: value }
    setSections(updated)
  }

  const handleSectionContentChange = (index: number, value: string) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], content: value }
    setSections(updated)
  }

  const handleAddSection = () => {
    const newSections = [...sections, { title: `${sections.length + 1}. New Section`, content: '' }]
    setSections(newSections)
  }

  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index)
    setSections(newSections)
    handleBlurSave(newSections)
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
            </div>
          </div>

          {/* Transform error */}
          {transformError && (
            <div className="bg-stone-50 border border-stone-300 text-stone-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{transformError}</span>
              <button onClick={handleTransform} className="text-xs font-medium underline underline-offset-2 ml-4">
                Retry
              </button>
            </div>
          )}

          {/* ── DOCUMENT — always visible, always editable ── */}
          <div className="bg-stone-50 rounded-lg">
            {/* Auto-save indicator */}
            <div className="flex items-center justify-end h-6 mb-2 px-1">
              {isSaving && (
                <span className="flex items-center gap-1.5 text-xs text-stone-400">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </span>
              )}
              {!isSaving && savedAt && (
                <span className="text-xs text-stone-400">
                  Saved ✓ {format(savedAt, 'h:mm a')}
                </span>
              )}
            </div>

            {/* Document page card */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {/* Document header */}
              <div className="px-10 pt-10 pb-6 border-b border-stone-200 text-center">
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2">
                  Statement of Work
                </p>
                <h2 className="text-lg font-semibold text-stone-900 mb-1">
                  {sow.content?.opportunity?.title || opportunity.title}
                </h2>
                <p className="text-sm text-stone-500">
                  {sow.content?.opportunity?.solicitationNumber || opportunity.solicitationNumber}
                </p>
                <p className="text-sm text-stone-400">
                  {sow.content?.opportunity?.agency || opportunity.agency}
                </p>
                {(sow.content?.opportunity?.naicsCode || opportunity.naicsCode) && (
                  <p className="text-xs text-stone-400 mt-1">
                    NAICS: {sow.content?.opportunity?.naicsCode || opportunity.naicsCode}
                  </p>
                )}
              </div>

              {/* Sections — always editable inline */}
              <div className="divide-y divide-stone-100">
                {sections.map((section, idx) => (
                  <div key={idx} className="px-10 py-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-stone-900 text-white text-xs font-bold rounded flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={section.title.replace(/^\d+\.\s*/, '')}
                        onChange={(e) => handleSectionTitleChange(idx, `${idx + 1}. ${e.target.value}`)}
                        onBlur={() => handleBlurSave(sections)}
                        placeholder="Section title"
                        className="flex-1 text-sm font-semibold text-stone-800 bg-transparent border-none outline-none focus:ring-1 focus:ring-stone-200 rounded px-1 -mx-1"
                      />
                      <button
                        onClick={() => handleRemoveSection(idx)}
                        className="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
                        title="Remove section"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="border-b border-stone-100 mb-4" />

                    {section.summary && (
                      <p className="text-xs text-stone-400 italic mb-3 leading-relaxed">
                        {section.summary}
                      </p>
                    )}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {section.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs text-stone-500">
                            <span className="mt-1 h-1 w-1 rounded-full bg-stone-300 flex-shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <textarea
                      ref={(el) => { if (el) autoResize(el) }}
                      value={section.details || section.content}
                      onChange={(e) => {
                        handleSectionContentChange(idx, e.target.value)
                        autoResize(e.target)
                      }}
                      onBlur={() => handleBlurSave(sections)}
                      onInput={(e) => autoResize(e.currentTarget)}
                      placeholder="Section body text…"
                      rows={3}
                      className="w-full text-sm text-stone-700 leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-1 focus:ring-stone-200 rounded px-1 -mx-1"
                    />
                  </div>
                ))}
              </div>

              {/* Add section */}
              <div className="px-10 py-4 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={handleAddSection}
                  className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add section
                </button>
              </div>
            </div>
          </div>

          {/* ── Plain Language — collapsible section below document ── */}
          <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setShowPlainLanguage(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Plain Language Breakdown
                {plainCache && (
                  <span className="text-xs text-stone-400 font-normal">
                    · {format(new Date(plainCache.generatedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </span>
              <svg
                className={`h-4 w-4 text-stone-400 transition-transform ${showPlainLanguage ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPlainLanguage && (
              <div className="border-t border-stone-100 p-4 space-y-4">
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
                  <>
                    <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                      <span>AI-simplified for plain English readability</span>
                      <button
                        onClick={handleTransform}
                        disabled={isTransforming}
                        className="text-stone-400 hover:text-stone-600 underline underline-offset-2 disabled:opacity-50"
                      >
                        Re-generate
                      </button>
                    </div>
                    {plainCache.sections.map((section, idx) => (
                      <PlainSectionCard key={idx} section={section} />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-stone-600 mb-1">Plain language not yet generated</p>
                    <p className="text-xs text-stone-400 mb-4">
                      AI rewrites this SOW in clear business language — active voice, plain English, why each requirement matters.
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
              </div>
            )}
          </div>

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
            <a
              href={`/api/sows/${sow.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
