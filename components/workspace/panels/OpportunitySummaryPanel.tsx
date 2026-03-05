'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, differenceInDays } from 'date-fns'
import type { RichAttachment } from '@/lib/types/attachment'
import type { OpportunityBrief } from '@/lib/openai'
import OpportunityBriefCard from './OpportunityBriefCard'
import FormFillModal from './FormFillModal'

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
  brief?: OpportunityBrief | null
  isGeneratingBrief?: boolean
  onGenerateBrief?: () => void
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
  brief = null,
  isGeneratingBrief = false,
  onGenerateBrief,
}: OpportunitySummaryPanelProps) {
  const [attachments, setAttachments] = useState<RichAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [samGovUrl, setSamGovUrl] = useState('')
  const [hasParsedContent, setHasParsedContent] = useState(false)
  const [parsedSummary, setParsedSummary] = useState<{ parsedCount: number; totalAttachments: number; sections: string[] } | null>(null)
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false)
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set())
  const [viewingAttachment, setViewingAttachment] = useState<RichAttachment | null>(null)

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Form fill modal
  const [fillingAttachment, setFillingAttachment] = useState<RichAttachment | null>(null)

  // Solicitation description expansion
  const [showSolicitation, setShowSolicitation] = useState(false)

  const closeViewer = useCallback(() => setViewingAttachment(null), [])

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null
  const postedDate = opportunity.postedDate ? new Date(opportunity.postedDate) : null

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

  // Auto-analyze attachments when they load (if any lack formData)
  useEffect(() => {
    if (!attachments.length || isAnalyzing) return
    const needsAnalysis = attachments.some((att) => att.formData === null || att.formData === undefined)
    if (!needsAnalysis) return

    const runAnalysis = async () => {
      setIsAnalyzing(true)
      try {
        const res = await fetch(`/api/opportunities/${opportunity.id}/attachments/analyze`, {
          method: 'POST',
        })
        if (res.ok) {
          // Re-fetch attachments to get updated formData
          const attRes = await fetch(`/api/opportunities/${opportunity.id}/attachments`)
          if (attRes.ok) {
            const data = await attRes.json()
            setAttachments(data.attachments || [])
          }
        }
      } catch {
        // Silent fail — analysis is best-effort
      } finally {
        setIsAnalyzing(false)
      }
    }

    runAnalysis()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments.length > 0, opportunity.id])

  // Apply AI suggested name via the existing rename flow
  const applySuggestedName = useCallback(async (att: RichAttachment) => {
    const suggested = att.formData?.aiSuggestedName
    if (!suggested) return

    setSaving(true)
    try {
      const res = await fetch(
        `/api/opportunities/${opportunity.id}/attachments/${att.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentName: suggested }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === att.id ? { ...data.attachment, formData: att.formData } : a))
        )
      }
    } catch {
      // Ignore
    } finally {
      setSaving(false)
    }
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
      {/* OPPORTUNITY BRIEF */}
      <div className="p-6 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto">
          <OpportunityBriefCard
            brief={brief}
            isGenerating={isGeneratingBrief}
            onGenerate={onGenerateBrief ?? (() => {})}
            opportunityTitle={opportunity.title}
            agency={opportunity.agency}
          />
        </div>
      </div>

      {/* FIRST FOLD — quick actions only */}
      <div className="px-6 py-4 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onProceed}
            className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded hover:bg-stone-700 transition-colors inline-flex items-center gap-2"
          >
            <span>{nextStep || workflowState.action}</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* BELOW FOLD */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Overview — AI narrative + full solicitation description */}
          <div className="p-5 bg-white border border-stone-200 rounded-lg space-y-4">
            <h2 className="text-sm font-semibold text-stone-800">Overview</h2>

            {brief?.extendedOverview ? (
              /* Extended AI narrative — richer multi-paragraph version */
              <div className="space-y-3">
                {brief.extendedOverview.split(/\n+/).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-stone-700 leading-relaxed">{para}</p>
                ))}
              </div>
            ) : brief?.whatTheyAreBuying ? (
              /* Fallback: short summary from older brief */
              <p className="text-sm text-stone-700 leading-relaxed">{brief.whatTheyAreBuying}</p>
            ) : null}

            {brief && !brief.extendedOverview && (
              <p className="text-xs text-stone-400 italic">Regenerate the brief to get a full narrative overview.</p>
            )}

            {/* Full solicitation description — collapsible */}
            {realDescription && (
              <div className={brief?.whatTheyAreBuying ? 'pt-3 border-t border-stone-100' : ''}>
                <button
                  onClick={() => setShowSolicitation((v) => !v)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex-1">
                    {brief?.whatTheyAreBuying ? 'From Solicitation' : 'Description'}
                  </p>
                  <svg
                    className={`h-3.5 w-3.5 text-stone-400 transition-transform flex-shrink-0 ${showSolicitation ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSolicitation && (
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap mt-2">
                    {realDescription}
                  </p>
                )}
              </div>
            )}

            {!brief?.whatTheyAreBuying && !realDescription && (
              <p className="text-sm text-stone-400 italic">No description available.</p>
            )}
          </div>

          {/* SAM.gov Attachments */}
          <div className="p-5 bg-white border border-stone-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Solicitation Documents
              </h2>
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 text-xs text-stone-400">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing attachments…
                </span>
              )}
            </div>

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
                    onUseSuggestion={() => applySuggestedName(att)}
                    onFillForm={() => setFillingAttachment(att)}
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

            {/* Parsed content indicator */}
            {attachments.length > 0 && hasParsedContent && parsedSummary && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <svg className="h-3.5 w-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-stone-500">
                    {parsedSummary.parsedCount} of {parsedSummary.totalAttachments} parsed
                  </span>
                  {parsedSummary.sections.map((section) => (
                    <span key={section} className="px-1.5 py-0.5 text-[10px] bg-stone-100 text-stone-500 rounded">
                      {section}
                    </span>
                  ))}
                </div>
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

          {/* Contract Lifecycle & Action Plan */}
          <ContractLifecycle brief={brief} opportunity={opportunity} />
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

      {/* Form fill modal */}
      {fillingAttachment && (
        <FormFillModal
          opportunityId={opportunity.id}
          attachmentId={fillingAttachment.id}
          attachmentName={fillingAttachment.currentName}
          proxyUrl={`/api/opportunities/${opportunity.id}/attachments/${fillingAttachment.id}/proxy`}
          existingFields={fillingAttachment.formData?.fields ?? null}
          onClose={() => setFillingAttachment(null)}
          onSaved={(savedFields) => {
            setAttachments((prev) =>
              prev.map((a) =>
                a.id === fillingAttachment.id
                  ? { ...a, formData: a.formData ? { ...a.formData, fields: savedFields, filledAt: new Date().toISOString() } : null }
                  : a
              )
            )
          }}
        />
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
  onUseSuggestion: () => void
  onFillForm: () => void
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
  onUseSuggestion,
  onFillForm,
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-stone-700 truncate font-medium">
                {attachment.currentName}
              </p>
              {/* FORM badge */}
              {attachment.formData?.isForm && (
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-stone-700 text-white rounded"
                  title={attachment.formData.formType ?? 'Government Form'}
                >
                  {attachment.formData.formType ?? 'FORM'}
                </span>
              )}
            </div>
          )}

          {/* AI suggested name row — only when no manual rename and suggestion exists */}
          {!isEditing && !attachment.isEdited && attachment.formData?.aiSuggestedName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-stone-400 italic truncate flex-1 min-w-0">
                Suggested: {attachment.formData.aiSuggestedName}
              </span>
              {attachment.formData.aiConfidence === 'MEDIUM' && (
                <span className="flex-shrink-0 px-1 py-0.5 text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-200 rounded" title="Medium confidence">?</span>
              )}
              {attachment.formData.aiConfidence === 'LOW' && (
                <span className="flex-shrink-0 px-1 py-0.5 text-[9px] font-medium bg-red-50 text-red-500 border border-red-200 rounded" title="Low confidence">?</span>
              )}
              <button
                onClick={onUseSuggestion}
                disabled={saving}
                className="flex-shrink-0 text-[10px] font-medium text-stone-500 hover:text-stone-700 underline underline-offset-2 disabled:opacity-40 transition-colors"
              >
                Use suggestion
              </button>
            </div>
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
              {attachment.formData?.filledAt && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-stone-100 text-stone-600 rounded">
                  filled
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
            {/* Fill Form button — only for detected forms */}
            {attachment.formData?.isForm && (
              <button
                onClick={onFillForm}
                className="px-2 py-1 text-[10px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors flex-shrink-0"
                title={`Fill ${attachment.formData.formType ?? 'form'}`}
              >
                Fill Form
              </button>
            )}
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

// ─── Contract Lifecycle & Action Plan ────────────────────────────────────────

interface LifecyclePhase {
  phase: string
  timeframe: string
  actions: string[]
  overdeliver?: string[]
}

function buildLifecycle(
  brief: import('@/lib/openai').OpportunityBrief | null,
  opportunity: { contractType?: string; setAside?: string; agency?: string }
): LifecyclePhase[] {
  const hasDeliverables = (brief?.keyDeliverables?.length ?? 0) > 0
  const hasClearance = (brief?.whoQualifies?.clearances?.length ?? 0) > 0
  const isOnsite = brief?.placeOfPerformance?.siteType === 'on-site' || brief?.placeOfPerformance?.siteType === 'hybrid'
  const hasOptions = (brief?.periodOfPerformance?.optionYears ?? 0) > 0

  return [
    {
      phase: 'Pre-Award',
      timeframe: 'Now through proposal submission',
      actions: [
        'Read every page of the solicitation — especially Section C (scope), Section F (delivery), Section H (special requirements), and Section L/M (how you\'ll be evaluated)',
        'Identify all FAR and DFARS clauses in Section I — each one is a legal obligation you\'re agreeing to',
        'Verify your SAM.gov registration is active and all certifications are current',
        'Confirm your NAICS code and any size standard eligibility',
        ...(hasClearance ? ['Begin facility clearance (FCL) process early — it can take 6–18 months'] : []),
        'Get at minimum two subcontractor quotes — include their past performance info in your proposal',
        'Price your bid using historical comparable data, not gut feel',
      ],
      overdeliver: [
        'Submit your proposal 24–48 hours early — last-minute uploads fail more than you think',
        'Include a one-page executive summary that mirrors the government\'s evaluation criteria',
        'Volunteer relevant past performance proactively, even if not explicitly required',
      ],
    },
    {
      phase: 'Award & Kickoff',
      timeframe: 'Days 1–30 after award',
      actions: [
        'Review the awarded contract in full — compare it to your proposal to catch any modifications',
        'Register in Wide Area Workflow (WAWF) before your first delivery — you cannot invoice without it',
        'Schedule the Kickoff Meeting (KOM) with your Contracting Officer (CO) and COR within 14 days',
        'Confirm your key personnel are in place and notify the CO immediately if there are any changes',
        ...(isOnsite ? ['Arrange site access, badges, and security processing for all on-site personnel'] : []),
        'Set up your reporting cadence — monthly status reports, financial reports, CDRL due dates',
        'Establish your Quality Control Plan (QCP) and submit it if required',
        ...(hasClearance ? ['Confirm all cleared personnel are listed on the DD-254 and verify current clearances'] : []),
      ],
      overdeliver: [
        'Send a one-page "Contract Start Memo" to your COR outlining your team, communication plan, and first 30-day milestones',
        'Set up a shared document folder with the government team before the KOM',
        'Ask your COR how they prefer to receive status updates — some want email, some want formal reports only',
      ],
    },
    {
      phase: 'Performance',
      timeframe: `Contract period${hasOptions ? ' + option years' : ''}`,
      actions: [
        'Submit all CDRLs and data items on or before their due dates — late deliverables trigger cure notices',
        'File monthly status reports (MSRs) even if nothing changed — silence looks like a problem',
        ...(hasDeliverables ? ['Submit Inspection & Test Plans (ITPs) at least 20 days before delivery'] : []),
        'Document everything — government witnesses, inspection results, approvals — in writing',
        'Track spending against the funded amount and notify your CO immediately if you\'re approaching the ceiling',
        'Respond to any government RFIs or data calls within the requested timeframe',
        'Keep subcontractor performance records — you\'ll need them for CPARS and future bids',
      ],
      overdeliver: [
        'Send a brief monthly "good news" note to your COR highlighting wins, not just status',
        'Proactively flag potential issues before they become problems — COs reward transparency',
        'Propose process improvements or cost-saving ideas in writing — it helps your CPARS rating',
        'Document lessons learned mid-contract, not just at the end',
      ],
    },
    ...(hasOptions ? [{
      phase: 'Option Year Renewal',
      timeframe: '60–90 days before each option period',
      actions: [
        'Confirm with your CO whether the option will be exercised — do not assume',
        'Review your pricing for the option period against current market rates',
        'Update subcontractor agreements and get renewed quotes if needed',
        'Verify SAM.gov registration remains active — options cannot be exercised if you\'ve lapsed',
        'Request a performance discussion with your COR before option exercise to surface any concerns',
      ],
      overdeliver: [
        'Prepare a one-page "Year in Review" summarizing accomplishments — share it with your CO at the right moment',
        'Propose value-added improvements or efficiencies for the option period',
      ],
    }] : []),
    {
      phase: 'Closeout',
      timeframe: 'Final 30–60 days of performance',
      actions: [
        'Submit all final deliverables and obtain written acceptance from the government',
        'File your final invoice through WAWF promptly after final acceptance',
        'Return all Government Furnished Property (GFP) and get receipts',
        'Respond to your CPARS evaluation within the 14-day contractor comment window — this is your permanent record',
        'Archive all contract documentation for at least 3 years (or longer per your contract terms)',
        'Collect past performance documentation for future proposals',
      ],
      overdeliver: [
        'Ask your COR for a written letter of commendation — it supplements CPARS',
        'Send a concise transition memo if another contractor is taking over',
        'Request a debrief even if the closeout was smooth — you learn something every time',
      ],
    },
  ]
}

function ContractLifecycle({
  brief,
  opportunity,
}: {
  brief: import('@/lib/openai').OpportunityBrief | null
  opportunity: { contractType?: string; setAside?: string; agency?: string }
}) {
  const [openPhase, setOpenPhase] = useState<string | null>(null)
  const [showOverdeliver, setShowOverdeliver] = useState<Record<string, boolean>>({})

  const phases = buildLifecycle(brief, opportunity)

  return (
    <div className="p-5 bg-white border border-stone-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-800">Contract Lifecycle & Action Plan</h2>
        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded">{phases.length} phases</span>
      </div>
      <p className="text-xs text-stone-500">
        What to expect and do from now through contract closeout — including how to overdeliver on every phase.
      </p>

      <div className="space-y-2">
        {phases.map((phase, i) => {
          const isOpen = openPhase === phase.phase
          const showOD = showOverdeliver[phase.phase]
          return (
            <div key={phase.phase} className="border border-stone-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.phase)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-stone-50 transition-colors text-left"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{phase.phase}</p>
                  <p className="text-xs text-stone-400">{phase.timeframe}</p>
                </div>
                <svg className={`h-4 w-4 text-stone-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 bg-stone-50/50 space-y-3">
                  <div className="pt-3 space-y-1.5">
                    {phase.actions.map((action, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <svg className="h-3.5 w-3.5 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <p className="text-sm text-stone-700 leading-snug">{action}</p>
                      </div>
                    ))}
                  </div>

                  {phase.overdeliver && phase.overdeliver.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowOverdeliver(prev => ({ ...prev, [phase.phase]: !showOD }))}
                        className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {showOD ? 'Hide' : 'Show'} ways to overdeliver
                      </button>
                      {showOD && (
                        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1.5">
                          {phase.overdeliver.map((tip, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className="text-amber-500 flex-shrink-0 mt-0.5 text-xs">⚡</span>
                              <p className="text-xs text-amber-900 leading-snug">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

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

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} bytes`
}
