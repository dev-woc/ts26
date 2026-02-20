'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, differenceInDays } from 'date-fns'
import type { RichAttachment } from '@/lib/types/attachment'

interface OpportunitySummaryPanelProps {
  opportunity: {
    id: string
    title: string
    solicitationNumber: string
    agency?: string
    department?: string
    naicsCode?: string
    naicsDescription?: string
    state?: string
    placeOfPerformance?: string
    description?: string
    postedDate?: string | Date
    responseDeadline?: string | Date
    status: string
    setAside?: string
    contractType?: string
    estimatedContractValue?: number
    sourceUrl?: string
    rawData?: any
    requirements?: string[]
    deliverables?: string[]
    periodOfPerformance?: string
    pointOfContact?: {
      name?: string
      email?: string
      phone?: string
    }
  }
  assessment?: {
    estimatedValue: number
    estimatedCost: number
    profitMarginPercent: number
    profitMarginDollar: number
    recommendation: string
    strategicValue?: string
    riskLevel?: string
    confidence?: string
    dataSource?: string
  } | null
  hasBid?: boolean
  hasSOW?: boolean
  hasSubcontractors?: boolean
  onGenerateSOW?: (selectedAttachments?: string[]) => void
  onSeeSOW?: () => void
  isGeneratingSOW?: boolean
  onFindSubcontractors?: () => void
  onSeeSubcontractors?: () => void
  onCreateBid?: () => void
  onSeeBid?: () => void
  onProceed?: () => void
  nextStep?: string
}

export default function OpportunitySummaryPanel({
  opportunity,
  assessment,
  hasBid,
  hasSOW,
  hasSubcontractors,
  onGenerateSOW,
  onSeeSOW,
  isGeneratingSOW,
  onFindSubcontractors,
  onSeeSubcontractors,
  onCreateBid,
  onSeeBid,
  onProceed,
  nextStep,
}: OpportunitySummaryPanelProps) {
  const [attachments, setAttachments] = useState<RichAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [samGovUrl, setSamGovUrl] = useState('')
  const [hasParsedContent, setHasParsedContent] = useState(false)
  const [parsedSummary, setParsedSummary] = useState<{ parsedCount: number; totalAttachments: number; sections: string[] } | null>(null)
  const [parsing, setParsing] = useState(false)
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false)
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set())
  const [viewingAttachment, setViewingAttachment] = useState<RichAttachment | null>(null)

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const closeViewer = useCallback(() => setViewingAttachment(null), [])

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null
  const postedDate = opportunity.postedDate ? new Date(opportunity.postedDate) : null

  const talkingPoints = generateTalkingPoints(opportunity, assessment)
  const [realDescription, setRealDescription] = useState(opportunity.description || '')

  // Fetch attachments on mount
  useEffect(() => {
    const fetchAttachments = async () => {
      setLoadingAttachments(true)
      try {
        const res = await fetch(`/api/opportunities/${opportunity.id}/attachments`)
        if (res.ok) {
          const data = await res.json()
          setAttachments(data.attachments || [])
          setSamGovUrl(data.samGovUrl || '')
          setHasParsedContent(!!data.hasParsedContent)
          if (data.hasParsedContent && data.parsedAttachments) {
            const pa = data.parsedAttachments
            const sections: string[] = []
            if (pa.structured?.scope?.length) sections.push('Scope')
            if (pa.structured?.deliverables?.length) sections.push('Deliverables')
            if (pa.structured?.compliance?.length) sections.push('Compliance')
            if (pa.structured?.periodOfPerformance?.length) sections.push('Period of Performance')
            if (pa.structured?.qualifications?.length) sections.push('Qualifications')
            if (pa.structured?.evaluation?.length) sections.push('Evaluation Criteria')
            setParsedSummary({
              parsedCount: pa.parsedCount || 0,
              totalAttachments: pa.totalAttachments || 0,
              sections,
            })
          }
          if (data.description && data.description.length > 10) {
            setRealDescription(data.description)
          }
        }
      } catch (error) {
        console.error('Failed to fetch attachments:', error)
      } finally {
        setLoadingAttachments(false)
      }
    }
    fetchAttachments()
  }, [opportunity.id])

  // Start editing an attachment name
  const startEditing = useCallback((att: RichAttachment) => {
    const ext = getExtension(att.currentName)
    const base = ext ? att.currentName.slice(0, -ext.length) : att.currentName
    setEditingId(att.id)
    setEditingValue(base)
    setEditError(null)
  }, [])

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingValue('')
    setEditError(null)
  }, [])

  // Save rename via PATCH
  const saveRename = useCallback(async (att: RichAttachment) => {
    const ext = getExtension(att.currentName)
    const newName = editingValue.trim() + ext

    if (!editingValue.trim()) {
      setEditError('Name cannot be empty')
      return
    }

    if (/[/\\:*?"<>|]/.test(editingValue)) {
      setEditError('Invalid characters: / \\ : * ? " < > |')
      return
    }

    // Check for local duplicate (quick client-side check)
    const duplicate = attachments.some(
      (a) => a.id !== att.id && a.currentName.toLowerCase() === newName.toLowerCase()
    )
    if (duplicate) {
      setEditError('Name already in use')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(
        `/api/opportunities/${opportunity.id}/attachments/${att.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentName: newName }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || 'Failed to save')
        return
      }
      // Update local state with the returned rich attachment
      setAttachments((prev) =>
        prev.map((a) => (a.id === att.id ? (data.attachment as RichAttachment) : a))
      )
      setEditingId(null)
      setEditingValue('')
      setEditError(null)
    } catch {
      setEditError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }, [editingValue, attachments, opportunity.id])

  const workflowState = getWorkflowState(hasSOW, hasSubcontractors, hasBid)

  return (
    <div className="h-full overflow-auto">
      {/* FIRST FOLD */}
      <div className="p-6 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-stone-900 leading-tight">
                {opportunity.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-stone-500">
                <span>{opportunity.solicitationNumber}</span>
                {opportunity.agency && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span>{opportunity.agency}</span>
                  </>
                )}
              </div>
            </div>
            {deadline && daysLeft !== null && (
              <div className={`flex-shrink-0 px-4 py-2 rounded-lg text-center ${
                daysLeft <= 7 ? 'bg-stone-800 text-white' :
                daysLeft <= 14 ? 'bg-stone-300 text-stone-800' :
                'bg-stone-100 text-stone-700'
              }`}>
                <p className="text-2xl font-bold">{daysLeft <= 0 ? '!' : daysLeft}</p>
                <p className="text-xs">{daysLeft <= 0 ? 'Expired' : 'days left'}</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          {assessment && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-stone-50 rounded-lg text-center">
                <p className="text-xs text-stone-400">Value</p>
                <p className="text-lg font-semibold text-stone-800">
                  ${formatCurrency(assessment.estimatedValue)}
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg text-center">
                <p className="text-xs text-stone-400">Cost</p>
                <p className="text-lg font-semibold text-stone-800">
                  ${formatCurrency(assessment.estimatedCost)}
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg text-center">
                <p className="text-xs text-stone-400">Margin</p>
                <p className={`text-lg font-semibold ${
                  assessment.profitMarginPercent >= 20 ? 'text-stone-800' : 'text-stone-500'
                }`}>
                  {assessment.profitMarginPercent.toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg text-center">
                <p className="text-xs text-stone-400">Profit</p>
                <p className="text-lg font-semibold text-stone-800">
                  ${formatCurrency(assessment.profitMarginDollar)}
                </p>
              </div>
            </div>
          )}

          {/* Proceed */}
          <button
            onClick={onProceed}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded hover:bg-stone-200 transition-colors inline-flex items-center gap-2"
          >
            <span>{nextStep || workflowState.action}</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Workflow progress */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <WorkflowStep label="SOW" completed={hasSOW} active={!hasSOW} />
            <div className="w-8 h-px bg-stone-200" />
            <WorkflowStep label="Subs" completed={hasSubcontractors} active={hasSOW && !hasSubcontractors} />
            <div className="w-8 h-px bg-stone-200" />
            <WorkflowStep label="Bid" completed={hasBid} active={hasSOW && hasSubcontractors && !hasBid} />
          </div>
        </div>
      </div>

      {/* BELOW FOLD */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3">
            {hasSOW ? (
              <button
                onClick={onSeeSOW}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See SOW
              </button>
            ) : (
              <button
                onClick={() => {
                  if (attachments.length > 0) {
                    setSelectedAttachments(new Set(attachments.map(a => a.id)))
                    setShowAttachmentPicker(true)
                  } else {
                    onGenerateSOW?.()
                  }
                }}
                disabled={isGeneratingSOW}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingSOW ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating SOW…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Generate SOW
                  </>
                )}
              </button>
            )}
            {hasSubcontractors ? (
              <button
                onClick={onSeeSubcontractors}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See Subcontractors
              </button>
            ) : (
              <button
                onClick={onFindSubcontractors}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Subcontractors
              </button>
            )}
            {hasBid ? (
              <button
                onClick={onSeeBid}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See Bid
              </button>
            ) : (
              <button
                onClick={onCreateBid}
                disabled={!hasSOW || !hasSubcontractors}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                title={!hasSOW ? 'Generate SOW first' : !hasSubcontractors ? 'Find subcontractors first' : 'Create bid'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Bid
              </button>
            )}
          </div>

          {/* Talking Points */}
          <div className="p-5 bg-white border border-stone-200 rounded-lg">
            <h2 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Talking Points
            </h2>
            <div className="space-y-3">
              {talkingPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-stone-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DetailCard label="Agency" value={opportunity.agency} />
            <DetailCard label="Department" value={opportunity.department} />
            <DetailCard label="NAICS Code" value={opportunity.naicsCode} subValue={opportunity.naicsDescription} />
            <DetailCard label="Location" value={opportunity.placeOfPerformance || opportunity.state} />
            <DetailCard label="Set-Aside" value={formatSetAside(opportunity.setAside)} />
            <DetailCard label="Contract Type" value={opportunity.contractType} />
            <DetailCard
              label="Posted"
              value={postedDate ? format(postedDate, 'MMM d, yyyy') : undefined}
            />
            <DetailCard
              label="Due"
              value={deadline ? format(deadline, 'MMM d, yyyy h:mm a') : undefined}
              highlight={daysLeft !== null && daysLeft <= 14}
            />
          </div>

          {/* Scope Overview */}
          <div className="p-5 bg-white border border-stone-200 rounded-lg">
            <h2 className="text-sm font-semibold text-stone-800 mb-3">Scope Overview</h2>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
              {realDescription || 'No description provided.'}
            </p>
          </div>

          {/* SAM.gov Attachments */}
          <div className="p-5 bg-white border border-stone-200 rounded-lg">
            <h2 className="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Solicitation Documents
            </h2>

            {loadingAttachments ? (
              <div className="py-4 text-center text-stone-400 text-sm">
                Loading attachments...
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <AttachmentRow
                    key={att.id}
                    attachment={att}
                    opportunityId={opportunity.id}
                    isEditing={editingId === att.id}
                    editingValue={editingValue}
                    editError={editingId === att.id ? editError : null}
                    saving={saving}
                    onView={() => setViewingAttachment(att)}
                    onStartEdit={() => startEditing(att)}
                    onEditChange={(val) => {
                      setEditingValue(val)
                      setEditError(null)
                    }}
                    onSave={() => saveRename(att)}
                    onCancel={cancelEditing}
                  />
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-stone-500 mb-3">No attachments found in database</p>
                {samGovUrl && (
                  <a
                    href={samGovUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    View on SAM.gov
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Parse Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                {hasParsedContent && parsedSummary ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-stone-700">
                        {parsedSummary.parsedCount} of {parsedSummary.totalAttachments} attachments parsed
                      </span>
                    </div>
                    {parsedSummary.sections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parsedSummary.sections.map((section) => (
                          <span
                            key={section}
                            className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setParsing(true)
                      try {
                        const res = await fetch(`/api/opportunities/${opportunity.id}/parse-attachments`, {
                          method: 'POST',
                        })
                        if (res.ok) {
                          const data = await res.json()
                          setHasParsedContent(true)
                          const sections: string[] = []
                          if (data.structured?.scope?.length) sections.push('Scope')
                          if (data.structured?.deliverables?.length) sections.push('Deliverables')
                          if (data.structured?.compliance?.length) sections.push('Compliance')
                          if (data.structured?.periodOfPerformance?.length) sections.push('Period of Performance')
                          if (data.structured?.qualifications?.length) sections.push('Qualifications')
                          if (data.structured?.evaluation?.length) sections.push('Evaluation Criteria')
                          setParsedSummary({
                            parsedCount: data.parsedCount || 0,
                            totalAttachments: data.totalAttachments || 0,
                            sections,
                          })
                        }
                      } catch (error) {
                        console.error('Failed to parse attachments:', error)
                      } finally {
                        setParsing(false)
                      }
                    }}
                    disabled={parsing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-50 transition-colors"
                  >
                    {parsing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Parsing documents...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Parse Attachment Content
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {samGovUrl && attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <a
                  href={samGovUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
                >
                  View full solicitation on SAM.gov →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachment Selection Modal for SOW generation */}
      {showAttachmentPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200">
              <h3 className="text-sm font-semibold text-stone-900">Select Attachments for SOW</h3>
              <p className="text-xs text-stone-500 mt-1">Choose which documents to include in the SOW</p>
            </div>
            <div className="px-5 py-3 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {attachments.map((att) => (
                  <label
                    key={att.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttachments.has(att.id)}
                      onChange={(e) => {
                        const next = new Set(selectedAttachments)
                        if (e.target.checked) next.add(att.id)
                        else next.delete(att.id)
                        setSelectedAttachments(next)
                      }}
                      className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">{att.currentName}</p>
                      {att.size && (
                        <p className="text-xs text-stone-400">{formatFileSize(att.size)}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-stone-200 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAttachments(new Set(attachments.map(a => a.id)))}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedAttachments(new Set())}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  Select None
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAttachmentPicker(false)}
                  className="px-3 py-1.5 text-sm text-stone-600 bg-white border border-stone-300 rounded hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAttachmentPicker(false)
                    onGenerateSOW?.(Array.from(selectedAttachments))
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-stone-800 rounded hover:bg-stone-700"
                >
                  Generate SOW ({selectedAttachments.size} attachment{selectedAttachments.size !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline attachment viewer modal */}
      {viewingAttachment && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-stone-900/80 backdrop-blur-sm"
          onClick={closeViewer}
        >
          <div
            className="flex flex-col flex-1 m-6 rounded-xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-stone-800 truncate">{viewingAttachment.currentName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <a
                  href={`/api/opportunities/${opportunity.id}/attachments/${viewingAttachment.id}/proxy`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={closeViewer}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <iframe
              src={`/api/opportunities/${opportunity.id}/attachments/${viewingAttachment.id}/proxy`}
              className="flex-1 w-full border-0"
              title={viewingAttachment.currentName}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AttachmentRow ────────────────────────────────────────────────────────────

interface AttachmentRowProps {
  attachment: RichAttachment
  opportunityId: string
  isEditing: boolean
  editingValue: string
  editError: string | null
  saving: boolean
  onView: () => void
  onStartEdit: () => void
  onEditChange: (val: string) => void
  onSave: () => void
  onCancel: () => void
}

function AttachmentRow({
  attachment,
  opportunityId,
  isEditing,
  editingValue,
  editError,
  saving,
  onView,
  onStartEdit,
  onEditChange,
  onSave,
  onCancel,
}: AttachmentRowProps) {
  const ext = getExtension(attachment.currentName)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50 overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        {/* File icon */}
        <svg className="h-5 w-5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>

        {/* Name area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={editingValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-1 text-sm text-stone-800 bg-white border rounded px-2 py-0.5 outline-none focus:ring-1 ${
                  editError
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-stone-300 focus:ring-stone-300'
                }`}
                disabled={saving}
              />
              {ext && (
                <span className="text-sm text-stone-400 flex-shrink-0">{ext}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-700 truncate font-medium">
              {attachment.currentName}
            </p>
          )}

          {/* Metadata row */}
          {!isEditing && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {attachment.isEdited && attachment.originalName !== attachment.currentName && (
                <span className="text-xs text-stone-400 truncate">
                  Original: {attachment.originalName}
                </span>
              )}
              {attachment.size && (
                <span className="text-xs text-stone-400">{formatFileSize(attachment.size)}</span>
              )}
              {attachment.postedDate && (
                <span className="text-xs text-stone-400">
                  Added {format(new Date(attachment.postedDate), 'MMM d yyyy')}
                </span>
              )}
              <span className="text-xs text-stone-400">SAM.gov</span>
              {attachment.isEdited && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded"
                  title={
                    attachment.editedBy && attachment.editedAt
                      ? `Renamed by ${attachment.editedBy} on ${format(new Date(attachment.editedAt), 'MMM d, yyyy h:mm a')}`
                      : attachment.editedAt
                      ? `Renamed on ${format(new Date(attachment.editedAt), 'MMM d, yyyy h:mm a')}`
                      : 'Renamed'
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  edited
                </span>
              )}
            </div>
          )}

          {/* Validation error */}
          {isEditing && editError && (
            <p className="text-xs text-red-500 mt-0.5">{editError}</p>
          )}
        </div>

        {/* Actions */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onSave}
              disabled={saving || !editingValue.trim()}
              className="px-2.5 py-1 text-xs font-medium text-white bg-stone-700 rounded hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="px-2.5 py-1 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* View */}
            <button
              onClick={onView}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
              title="View"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            {/* Download */}
            <a
              href={`/api/opportunities/${opportunityId}/attachments/${attachment.id}/proxy`}
              download
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
              title="Download"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
            {/* Rename */}
            <button
              onClick={onStartEdit}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
              title="Rename"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function WorkflowStep({ label, completed, active }: { label: string; completed?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
        completed ? 'bg-stone-600 text-white' :
        active ? 'bg-stone-300 text-stone-700' :
        'bg-stone-100 text-stone-400'
      }`}>
        {completed ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span>{label[0]}</span>
        )}
      </div>
      <span className={`text-xs ${completed ? 'text-stone-700' : active ? 'text-stone-600' : 'text-stone-400'}`}>
        {label}
      </span>
    </div>
  )
}

function DetailCard({
  label,
  value,
  subValue,
  highlight
}: {
  label: string
  value?: string | null
  subValue?: string | null
  highlight?: boolean
}) {
  return (
    <div className={`p-3 bg-white border rounded-lg ${highlight ? 'border-stone-400' : 'border-stone-200'}`}>
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-stone-900' : 'text-stone-700'}`}>
        {value || '—'}
      </p>
      {subValue && (
        <p className="text-xs text-stone-400 mt-0.5 truncate">{subValue}</p>
      )}
    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) return ''
  return filename.slice(lastDot)
}

function getWorkflowState(hasSOW?: boolean, hasSubcontractors?: boolean, hasBid?: boolean) {
  if (!hasSOW) return { step: 1, action: 'Generate SOW', panel: 'sow' }
  if (!hasSubcontractors) return { step: 2, action: 'Find Subcontractors', panel: 'subcontractors' }
  if (!hasBid) return { step: 3, action: 'Create Bid', panel: 'bid' }
  return { step: 4, action: 'Review & Submit', panel: 'bid' }
}

function generateTalkingPoints(opportunity: any, assessment: any): string[] {
  const points: string[] = []

  if (assessment) {
    points.push(
      `This is a $${formatCurrency(assessment.estimatedValue)} opportunity with projected ${assessment.profitMarginPercent.toFixed(0)}% margin ($${formatCurrency(assessment.profitMarginDollar)} profit).`
    )
  } else if (opportunity.estimatedContractValue) {
    points.push(
      `Estimated contract value: $${formatCurrency(opportunity.estimatedContractValue)}.`
    )
  }

  if (opportunity.responseDeadline) {
    const daysLeft = differenceInDays(new Date(opportunity.responseDeadline), new Date())
    if (daysLeft <= 14) {
      points.push(`Deadline in ${daysLeft} days - prioritize this opportunity.`)
    } else {
      points.push(`Response deadline: ${format(new Date(opportunity.responseDeadline), 'MMMM d, yyyy')}.`)
    }
  }

  if (opportunity.setAside) {
    points.push(`Set-aside: ${formatSetAside(opportunity.setAside)} - limited competition pool.`)
  }

  if (opportunity.agency) {
    points.push(`Contracting agency: ${opportunity.agency}${opportunity.department ? ` (${opportunity.department})` : ''}.`)
  }

  if (opportunity.naicsCode) {
    points.push(`NAICS ${opportunity.naicsCode}${opportunity.naicsDescription ? `: ${opportunity.naicsDescription}` : ''}.`)
  }

  if (opportunity.placeOfPerformance || opportunity.state) {
    points.push(`Place of performance: ${opportunity.placeOfPerformance || opportunity.state}.`)
  }

  return points.length > 0 ? points : ['Review the solicitation details to identify key talking points.']
}

function formatSetAside(setAside?: string): string {
  if (!setAside) return 'Full & Open'
  const mapping: Record<string, string> = {
    'SBA': 'Small Business',
    'SDVOSB': 'Service-Disabled Veteran-Owned',
    'WOSB': 'Women-Owned',
    '8A': '8(a) Program',
    'HUBZONE': 'HUBZone',
  }
  return mapping[setAside] || setAside.replace(/_/g, ' ')
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toLocaleString()
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} bytes`
}
