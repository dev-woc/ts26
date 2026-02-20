'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { RichAttachment } from '@/lib/types/attachment'

interface EmailDraftPanelProps {
  recipientName?: string
  recipientEmail?: string
  opportunityTitle: string
  solicitationNumber: string
  bidAmount?: number
  sowSynopsis?: string
  deadline?: Date | null
  agency?: string
  templateType?: 'quote_request' | 'sow_delivery' | 'follow_up' | 'custom'
  onSend?: (email: { to: string; subject: string; body: string }) => Promise<void>
  availableAttachments?: RichAttachment[]
  sowFileName?: string
  opportunityId?: string
  /** IDs of pre-selected attachments (parent-controlled, survives panel switching) */
  selectedAttachmentIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  quote_request: {
    subject: 'Quote Request - {{solicitation}}',
    body: `Hello {{name}},

I am reaching out regarding an opportunity we are pursuing:

──────────────────────────────
QUICK OVERVIEW
──────────────────────────────
• Project: {{title}}
• Solicitation: {{solicitation}}
• Agency: {{agency}}
• Deadline: {{deadline}}

{{synopsis}}
──────────────────────────────

We would appreciate a quote for your services as part of our bid.

Please include in your response:
✓ Scope of work you can provide
✓ Pricing estimate
✓ Estimated timeline
✓ Availability confirmation

Please respond by {{response_needed}} if possible.

Thank you,
[Your Name]`,
  },
  sow_delivery: {
    subject: 'Statement of Work - {{solicitation}}',
    body: `Hello {{name}},

Please find attached the Statement of Work for your review:

──────────────────────────────
PROJECT SNAPSHOT
──────────────────────────────
• Project: {{title}}
• Solicitation: {{solicitation}}
• Agency: {{agency}}
• Deadline: {{deadline}}

{{synopsis}}
──────────────────────────────

NEXT STEPS:
1. Review the attached SOW
2. Confirm your availability
3. Provide pricing for your scope

Please respond by {{response_needed}}.

Thank you,
[Your Name]`,
  },
  follow_up: {
    subject: 'Following Up - {{solicitation}}',
    body: `Hello {{name}},

I wanted to follow up on my previous message regarding:

• Project: {{title}}
• Solicitation: {{solicitation}}

Our deadline is approaching ({{deadline}}). Please let me know your availability.

Thank you,
[Your Name]`,
  },
  custom: {
    subject: '',
    body: '',
  },
}

export default function EmailDraftPanel({
  recipientName = '',
  recipientEmail = '',
  opportunityTitle,
  solicitationNumber,
  bidAmount,
  sowSynopsis,
  deadline,
  agency,
  templateType = 'quote_request',
  onSend,
  availableAttachments,
  sowFileName,
  opportunityId,
  selectedAttachmentIds,
  onSelectionChange,
}: EmailDraftPanelProps) {
  const [to, setTo] = useState(recipientEmail)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(templateType)

  // Local attachment selection state — used when parent doesn't control it
  const [localSelected, setLocalSelected] = useState<Set<string>>(() =>
    new Set(availableAttachments?.map((a) => a.id) ?? [])
  )

  // Resolved selected set: prefer parent-controlled, fall back to local
  const selectedAttachments = selectedAttachmentIds ?? localSelected
  const setSelectedAttachments = (next: Set<string>) => {
    if (onSelectionChange) {
      onSelectionChange(next)
    } else {
      setLocalSelected(next)
    }
  }

  const responseNeeded = deadline
    ? format(new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000), 'EEEE, MMMM d')
    : 'end of week'

  useEffect(() => {
    setSelectedTemplate(templateType)
  }, [templateType])

  useEffect(() => {
    setTo(recipientEmail)
  }, [recipientEmail])

  useEffect(() => {
    const template = TEMPLATES[selectedTemplate]
    if (!template) return

    const formattedSynopsis = sowSynopsis
      ? `KEY DELIVERABLES:\n• ${sowSynopsis}`
      : '(SOW synopsis will appear here once generated)'

    const replacements: Record<string, string> = {
      '{{name}}': recipientName || '[Recipient Name]',
      '{{title}}': opportunityTitle,
      '{{solicitation}}': solicitationNumber,
      '{{amount}}': bidAmount ? `$${bidAmount.toLocaleString()}` : '[Amount]',
      '{{agency}}': agency || '[Agency]',
      '{{deadline}}': deadline ? format(deadline, 'MMMM d, yyyy') : '[Deadline]',
      '{{response_needed}}': responseNeeded,
      '{{synopsis}}': formattedSynopsis,
    }

    let newSubject = template.subject
    let newBody = template.body

    Object.entries(replacements).forEach(([key, value]) => {
      newSubject = newSubject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
      newBody = newBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    })

    setSubject(newSubject)
    setBody(newBody)
  }, [selectedTemplate, recipientName, opportunityTitle, solicitationNumber, bidAmount, sowSynopsis, deadline, agency, responseNeeded])

  const handleSend = async () => {
    if (!to || !subject || !body) return
    if (!onSend) {
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoUrl)
      return
    }

    setSending(true)
    try {
      await onSend({ to, subject, body })
    } finally {
      setSending(false)
    }
  }

  const hasAttachmentSection = !!(sowFileName || (availableAttachments && availableAttachments.length > 0))
  const totalAttachments = availableAttachments?.length ?? 0
  const selectedCount = selectedAttachments.size

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-stone-900">Email Draft</h1>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as any)}
            className="text-sm text-stone-600 bg-stone-100 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-stone-300"
          >
            <option value="quote_request">Quote Request</option>
            <option value="sow_delivery">SOW Delivery</option>
            <option value="follow_up">Follow Up</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* SOW Synopsis Preview */}
        {sowSynopsis && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              SOW Synopsis (included in email)
            </h3>
            <div className="text-sm text-stone-700 space-y-1">
              {sowSynopsis.split('\n• ').map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400">•</span>
                  <span>{line.replace(/^• /, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email form */}
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3">
            <span className="text-xs text-stone-400 w-12">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-sm text-stone-800 bg-transparent border-0 outline-none placeholder-stone-300"
            />
          </div>
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3">
            <span className="text-xs text-stone-400 w-12">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="flex-1 text-sm text-stone-800 bg-transparent border-0 outline-none placeholder-stone-300"
            />
          </div>
          <div className="p-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Email content..."
              className="w-full text-sm text-stone-800 bg-transparent border-0 outline-none resize-none placeholder-stone-300 leading-relaxed"
            />
          </div>
        </div>

        {/* Attachment Picker */}
        {hasAttachmentSection && (
          <div className="p-4 bg-white border border-stone-200 rounded-lg">
            {/* Header row with select all + count */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Attachments
              </h3>
              <div className="flex items-center gap-3">
                {totalAttachments > 0 && (
                  <>
                    <span className="text-xs text-stone-400">
                      {selectedCount} of {totalAttachments} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedAttachments(new Set(availableAttachments!.map((a) => a.id)))
                        }
                        className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedAttachments(new Set())}
                        className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
                      >
                        Deselect All
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* SOW — always-on, locked */}
              {sowFileName && (
                <div
                  className="flex items-center gap-2.5"
                  title="SOW is always included in this email"
                >
                  {/* Locked checkbox visual */}
                  <div className="w-4 h-4 rounded border border-stone-300 bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3 w-3 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <svg className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-stone-700 truncate">{sowFileName}</span>
                    <span className="text-[10px] text-stone-400 font-medium">SOW</span>
                    {/* Lock icon */}
                    <svg
                      className="h-3 w-3 text-stone-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="SOW is always included"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Solicitation attachments */}
              {availableAttachments?.map((att) => (
                <label key={att.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedAttachments.has(att.id)}
                    onChange={(e) => {
                      const next = new Set(selectedAttachments)
                      if (e.target.checked) next.add(att.id)
                      else next.delete(att.id)
                      setSelectedAttachments(next)
                    }}
                    className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-300"
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <svg className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-sm text-stone-700 truncate">{att.currentName}</span>
                    {att.size && (
                      <span className="text-[10px] text-stone-400">{(att.size / 1024).toFixed(0)}KB</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {(sowFileName || selectedCount > 0) && (
              <p className="mt-2.5 text-[11px] text-stone-400">
                Attach selected documents manually if using mail client.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
          <button
            onClick={() => {
              const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              window.open(mailtoUrl)
            }}
            className="px-4 py-3 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Open in Mail
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center">
          Emails are not saved automatically. Use &quot;Open in Mail&quot; to use your default email client.
        </p>
      </div>
    </div>
  )
}
