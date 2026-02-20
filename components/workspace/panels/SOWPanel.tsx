'use client'

import { useState, useEffect } from 'react'
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

// ─── Main SOWPanel ────────────────────────────────────────────────────────────

export default function SOWPanel({
  sow,
  opportunity,
  onSave,
  onGenerate,
  onStatusChange,
  isGenerating,
}: SOWPanelProps) {
  // ── Build sections from opportunity data when no SOW ──────────────────────
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
      sections.push({
        title: '2. Requirements',
        content: 'List specific requirements from the solicitation.',
      })
    }

    if (opportunity.deliverables && opportunity.deliverables.length > 0) {
      sections.push({
        title: '3. Deliverables',
        content: opportunity.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n'),
      })
    } else {
      sections.push({
        title: '3. Deliverables',
        content: 'Specify deliverables expected from the subcontractor.',
      })
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

  const convertStructuredSections = (rawSections: any[]): SOWSection[] => {
    return rawSections.map((s: any) => {
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

  // ── View mode state ───────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'original' | 'plain'>('original')
  const [isTransforming, setIsTransforming] = useState(false)
  const [transformError, setTransformError] = useState('')
  const [plainCache, setPlainCache] = useState<PlainLanguageCache | null>(
    (sow?.metadata?.plainLanguage as PlainLanguageCache) ?? null
  )

  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState<number | null>(null)
  const [showAttachments, setShowAttachments] = useState(false)

  const getAttachmentProxyUrl = (att: Attachment) =>
    `/api/opportunities/${opportunity.id}/attachments/${att.id}/proxy`

  useEffect(() => {
    if (sow?.content?.sections) {
      setSections(convertStructuredSections(sow.content.sections))
    }
    // Sync plain language cache when sow metadata changes
    if (sow?.metadata?.plainLanguage) {
      setPlainCache(sow.metadata.plainLanguage as PlainLanguageCache)
    }
  }, [sow])

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({
        header: {
          title: `SOW - ${opportunity.title}`,
          date: new Date().toISOString().split('T')[0],
        },
        sections,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = () => {
    const newIndex = sections.length
    setSections([...sections, { title: `${newIndex + 1}. New Section`, content: '' }])
    setEditingSection(newIndex)
  }

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
    setEditingSection(null)
  }

  const handleTransform = async () => {
    if (!sow) return
    setIsTransforming(true)
    setTransformError('')
    try {
      const res = await fetch(`/api/sows/${sow.id}/transform`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transformation failed')
      setPlainCache(data.plainLanguage)
      setViewMode('plain')
    } catch (err) {
      setTransformError(err instanceof Error ? err.message : 'Transformation failed')
    } finally {
      setIsTransforming(false)
    }
  }

  // ── No SOW yet ──────────────────────────────────────────────────────────
  if (!sow) {
    return (
      <div className="h-full flex flex-col">
        {opportunity.attachments && opportunity.attachments.length > 0 && (
          <div className="flex-shrink-0 p-4 bg-stone-50 border-b border-stone-200">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {opportunity.attachments.length} solicitation attachments
              <svg className={`h-4 w-4 transition-transform ${showAttachments ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAttachments && (
              <div className="mt-3 space-y-2">
                {opportunity.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={getAttachmentProxyUrl(att)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-white rounded border border-stone-200 hover:bg-stone-50 transition-colors"
                  >
                    <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="flex-1 text-sm text-stone-700 truncate">{att.name}</span>
                    <svg className="h-3 w-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-6">
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
      </div>
    )
  }

  // ── SOW exists ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Attachments panel */}
      {opportunity.attachments && opportunity.attachments.length > 0 && (
        <div className="flex-shrink-0 p-4 bg-stone-50 border-b border-stone-200">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            View {opportunity.attachments.length} solicitation attachments
            <svg className={`h-4 w-4 transition-transform ${showAttachments ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAttachments && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {opportunity.attachments.map((att) => (
                <a
                  key={att.id}
                  href={getAttachmentProxyUrl(att)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  <svg className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1 text-sm text-stone-700 truncate">{att.name}</span>
                  <svg className="h-3 w-3 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

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

          {/* ── View toggle ── */}
          <div className="flex items-center justify-between bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('original')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'original'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Government Original
            </button>
            <button
              onClick={() => {
                if (!plainCache && !isTransforming) {
                  handleTransform()
                } else {
                  setViewMode('plain')
                }
              }}
              disabled={isTransforming}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'plain'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isTransforming ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Simplifying…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  {plainCache ? 'Plain Language' : 'Simplify with AI'}
                </>
              )}
            </button>
          </div>

          {/* Transform error */}
          {transformError && (
            <div className="bg-stone-50 border border-stone-300 text-stone-700 text-sm px-4 py-3 rounded-lg">
              {transformError}
            </div>
          )}

          {/* ── Plain language info bar ── */}
          {viewMode === 'plain' && plainCache && (
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>
                Plain language · simplified{' '}
                {format(new Date(plainCache.generatedAt), 'MMM d, yyyy')}
              </span>
              <button
                onClick={handleTransform}
                disabled={isTransforming}
                className="text-stone-400 hover:text-stone-600 underline underline-offset-2 disabled:opacity-50"
              >
                Re-generate
              </button>
            </div>
          )}

          {/* ── PLAIN LANGUAGE VIEW ── */}
          {viewMode === 'plain' && plainCache ? (
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
              </div>

              {plainCache.sections.map((section, idx) => (
                <PlainSectionCard key={idx} section={section} />
              ))}

              <p className="text-xs text-stone-400 text-center pb-2">
                This plain language view is for quick understanding only. Refer to Government Original for exact contract language.
              </p>
            </div>
          ) : viewMode === 'plain' && !plainCache ? (
            /* Plain mode selected but no cache yet — generate prompt */
            <div className="bg-white border border-stone-200 rounded-lg p-8 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-700 mb-1">Plain language not yet generated</p>
              <p className="text-xs text-stone-400 mb-4">
                AI will rewrite this SOW in clear business language with active voice, plain English, and explanations of why each requirement matters.
              </p>
              <button
                onClick={handleTransform}
                disabled={isTransforming}
                className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isTransforming ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simplifying with AI…
                  </>
                ) : 'Generate Plain Language Version'}
              </button>
            </div>
          ) : (
            /* ── ORIGINAL VIEW ── */
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              {/* Document header */}
              <div className="p-6 border-b border-stone-100 text-center">
                <h2 className="text-xl font-semibold text-stone-900">
                  {sow.content?.header?.title || `Statement of Work`}
                </h2>
                <p className="text-sm text-stone-500 mt-2">
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
                {sow.content?.sourceEnhanced && (
                  <p className="text-xs text-stone-500 mt-2 flex items-center justify-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Generated from parsed solicitation documents
                  </p>
                )}
              </div>

              {/* Sections */}
              <div className="divide-y divide-stone-100">
                {sections.map((section, idx) => (
                  <div key={idx} className="p-6">
                    {editingSection === idx ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                          className="w-full text-sm font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded px-3 py-2 focus:ring-2 focus:ring-stone-300 focus:border-stone-300"
                        />
                        <textarea
                          value={section.content}
                          onChange={(e) => handleSectionChange(idx, 'content', e.target.value)}
                          rows={6}
                          className="w-full text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded px-3 py-2 focus:ring-2 focus:ring-stone-300 focus:border-stone-300 resize-none"
                          placeholder="Section content..."
                        />
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleRemoveSection(idx)}
                            className="text-xs text-stone-400 hover:text-stone-700"
                          >
                            Remove section
                          </button>
                          <button
                            onClick={() => setEditingSection(null)}
                            className="text-xs text-stone-500 hover:text-stone-700"
                          >
                            Done editing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingSection(idx)}
                        className="cursor-pointer hover:bg-stone-50 -m-3 p-3 rounded transition-colors"
                      >
                        <h3 className="text-sm font-medium text-stone-800 mb-2">{section.title}</h3>
                        {section.summary && (
                          <p className="text-xs text-stone-500 mb-2 italic">{section.summary}</p>
                        )}
                        {section.bullets && section.bullets.length > 0 ? (
                          <ul className="space-y-1 mb-2">
                            {section.bullets.map((bullet, bi) => (
                              <li key={bi} className="text-sm text-stone-600 flex items-start gap-2">
                                <span className="text-stone-400 mt-0.5 flex-shrink-0">-</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {section.details ? (
                          <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                            {section.details}
                          </p>
                        ) : !section.bullets?.length ? (
                          <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                            {section.content || 'Click to edit...'}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add section */}
              <div className="p-4 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={handleAddSection}
                  className="w-full py-2 text-xs text-stone-500 hover:text-stone-700 flex items-center justify-center gap-1"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add section
                </button>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3">
            {onSave && viewMode === 'original' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            )}
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
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
