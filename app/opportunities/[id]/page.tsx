'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'
import DocumentDirectory from '@/components/workspace/DocumentDirectory'
import OpportunitySummaryPanel from '@/components/workspace/panels/OpportunitySummaryPanel'
import BidEditorPanel from '@/components/workspace/panels/BidEditorPanel'
import SubcontractorPanel from '@/components/workspace/panels/SubcontractorPanel'
import SOWPanel from '@/components/workspace/panels/SOWPanel'
import EmailDraftPanel from '@/components/workspace/panels/EmailDraftPanel'
import ScopeOverviewPanel from '@/components/workspace/panels/ScopeOverviewPanel'
import type { RichAttachment } from '@/lib/types/attachment'

export default function OpportunityWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePanel, setActivePanel] = useState('summary')
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<any>(null)
  const [emailContext, setEmailContext] = useState<{ sowSynopsis?: string }>({})
  const [emailTemplateType, setEmailTemplateType] = useState<'quote_request' | 'sow_delivery' | 'follow_up' | 'custom'>('quote_request')
  const [generatingSOW, setGeneratingSOW] = useState(false)
  const [discoveringSubcontractors, setDiscoveringSubcontractors] = useState(false)
  const [solicitationAttachments, setSolicitationAttachments] = useState<RichAttachment[]>([])
  const [emailSelectedAttachments, setEmailSelectedAttachments] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [oppRes, assessRes] = await Promise.all([
        fetch(`/api/opportunities/${params.id}`),
        fetch(`/api/opportunities/${params.id}/assessment`),
      ])

      if (oppRes.ok) {
        const oppData = await oppRes.json()
        setOpportunity(oppData.opportunity)
      }
      if (assessRes.ok) {
        const assessData = await assessRes.json()
        setAssessment(assessData.assessment)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch solicitation attachments for SOW panel and email panel
  useEffect(() => {
    if (!opportunity?.id) return
    fetch(`/api/opportunities/${opportunity.id}/attachments`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.attachments) {
          const atts: RichAttachment[] = data.attachments
          setSolicitationAttachments(atts)
          // Initialize email selection to all attachments (default all selected)
          setEmailSelectedAttachments(prev => {
            // Only initialize if not yet set
            if (prev.size === 0) return new Set(atts.map((a) => a.id))
            return prev
          })
        }
      })
      .catch(() => {})
  }, [opportunity?.id])

  const handleCreateBid = async () => {
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      })
      if (res.ok) {
        await fetchData()
        setActivePanel('bid')
      }
    } catch (err) {
      console.error('Failed to create bid:', err)
    }
  }

  const handleGenerateSOW = async (selectedAttachments?: string[]) => {
    try {
      setGeneratingSOW(true)
      const res = await fetch('/api/sows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opportunity.id, selectedAttachments }),
      })
      if (res.ok) {
        await fetchData()
        setActivePanel('sow')
      }
    } catch (err) {
      console.error('Failed to generate SOW:', err)
    } finally {
      setGeneratingSOW(false)
    }
  }

  // Discover subcontractors for this opportunity
  const handleDiscoverSubcontractors = async () => {
    try {
      setDiscoveringSubcontractors(true)
      const res = await fetch(`/api/opportunities/${opportunity.id}/subcontractors/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        await fetchData()
        setActivePanel('subcontractors')
      }
    } catch (err) {
      console.error('Failed to discover subcontractors:', err)
    } finally {
      setDiscoveringSubcontractors(false)
    }
  }

  const handleSaveBid = async (amount: number) => {
    const bid = opportunity?.bids?.[0]
    if (!bid) return

    await fetch(`/api/bids/${bid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendedPrice: amount }),
    })
    await fetchData()
  }

  const handleBidStatusChange = async (status: string) => {
    const bid = opportunity?.bids?.[0]
    if (!bid) return

    await fetch(`/api/bids/${bid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchData()
  }

  const handleSaveSOW = async (content: any) => {
    const sow = opportunity?.sows?.[0]
    if (!sow) return

    await fetch(`/api/sows/${sow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    await fetchData()
  }

  const handleSOWStatusChange = async (status: string) => {
    const sow = opportunity?.sows?.[0]
    if (!sow) return

    await fetch(`/api/sows/${sow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchData()
  }

  // Generate SOW synopsis for emails - must be before early returns to maintain hooks order
  const currentSOW = opportunity?.sows?.[0]
  const sowSynopsis = useMemo(() => {
    if (!currentSOW?.content) return undefined
    const content = currentSOW.content
    const bullets: string[] = []

    // Extract key info from SOW content
    if (content.opportunity?.title) {
      bullets.push(`Project: ${content.opportunity.title}`)
    }
    if (content.scope?.overview) {
      bullets.push(`Scope: ${content.scope.overview.substring(0, 150)}${content.scope.overview.length > 150 ? '...' : ''}`)
    }
    if (content.deliverables && Array.isArray(content.deliverables)) {
      const deliverableList = content.deliverables.slice(0, 3).map((d: any) => d.title || d).join(', ')
      bullets.push(`Key deliverables: ${deliverableList}`)
    }
    if (content.period_of_performance) {
      bullets.push(`Timeline: ${content.period_of_performance}`)
    }

    return bullets.length > 0 ? bullets.join('\n• ') : undefined
  }, [currentSOW])

  if (loading) {
    return (
      <div className="h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-stone-600"></div>
          <p className="mt-3 text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">{error || 'Not found'}</p>
          <button
            onClick={() => router.push('/opportunities')}
            className="px-4 py-2 text-sm text-stone-600 bg-white border border-stone-300 rounded hover:bg-stone-50"
          >
            Back to opportunities
          </button>
        </div>
      </div>
    )
  }

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null
  const currentBid = opportunity.bids?.[0]
  const hasSubcontractors = (opportunity.subcontractors?.length || 0) > 0
  const hasQuotedSubcontractors = opportunity.subcontractors?.some((s: any) => s.quotedAmount != null)

  // Workflow order: SOW → Subcontractors → Bid (bid is LAST)
  const getWorkflowState = () => {
    if (!currentSOW) return { step: 1, action: 'Generate SOW', panel: 'sow' as const }
    if (!hasSubcontractors) return { step: 2, action: 'Find Subcontractors', panel: 'subcontractors' as const }
    if (!currentBid) return { step: 3, action: 'Create Bid', panel: 'bid' as const }
    return { step: 4, action: 'Review & Submit', panel: 'bid' as const }
  }
  const workflowState = getWorkflowState()

  // Handle proceed action - navigate to the next workflow step
  const handleProceed = async () => {
    const state = getWorkflowState()
    if (state.step === 1) {
      await handleGenerateSOW()
    } else if (state.step === 2) {
      await handleDiscoverSubcontractors()
    } else if (state.step === 3) {
      await handleCreateBid()
    } else {
      setActivePanel('bid')
    }
  }

  // Build document list for sidebar
  const documents: any[] = []
  if (opportunity.bids) {
    opportunity.bids.forEach((bid: any) => {
      documents.push({
        id: bid.id,
        type: 'bid',
        title: `Bid - $${bid.recommendedPrice?.toLocaleString() || '0'}`,
        status: bid.status,
        updatedAt: bid.updatedAt,
      })
    })
  }
  if (opportunity.sows) {
    opportunity.sows.forEach((sow: any) => {
      documents.push({
        id: sow.id,
        type: 'sow',
        title: `SOW v${sow.version}`,
        status: sow.status,
        updatedAt: sow.updatedAt || sow.generatedAt,
      })
    })
  }

  // Determine next action (Workflow: SOW → Subs → Bid)
  let nextAction = workflowState.action
  if (currentBid?.status === 'DRAFT') {
    nextAction = 'Review bid'
  } else if (currentBid?.status === 'REVIEWED') {
    nextAction = 'Submit bid'
  }

  // Progress tracking (workflow order: SOW → Subs → Bid)
  const progress = {
    sowCreated: !!currentSOW,
    subcontractorsFound: hasSubcontractors,
    quotesReceived: hasQuotedSubcontractors,
    bidCreated: !!currentBid,
    bidSubmitted: currentBid?.status === 'SUBMITTED',
  }

  // Build panels
  const panels = [
    {
      id: 'summary',
      label: 'Summary',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      content: (
        <OpportunitySummaryPanel
          opportunity={opportunity}
          assessment={assessment}
          hasBid={!!currentBid}
          hasSOW={!!currentSOW}
          hasSubcontractors={hasSubcontractors}
          onCreateBid={handleCreateBid}
          onSeeBid={() => setActivePanel('bid')}
          onGenerateSOW={handleGenerateSOW}
          onSeeSOW={() => setActivePanel('sow')}
          isGeneratingSOW={generatingSOW}
          onFindSubcontractors={handleDiscoverSubcontractors}
          onSeeSubcontractors={() => setActivePanel('subcontractors')}
          onProceed={handleProceed}
          nextStep={workflowState.action}
        />
      ),
    },
    {
      id: 'scope',
      label: 'Scope',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      content: (
        <ScopeOverviewPanel
          opportunity={opportunity}
          assessment={assessment}
        />
      ),
    },
    {
      id: 'sow',
      label: 'SOW',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      content: (
        <SOWPanel
          sow={currentSOW}
          opportunity={{ ...opportunity, attachments: solicitationAttachments }}
          onGenerate={handleGenerateSOW}
          isGenerating={generatingSOW}
          onSave={handleSaveSOW}
          onStatusChange={handleSOWStatusChange}
        />
      ),
    },
    {
      id: 'subcontractors',
      label: 'Subcontractors',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: (
        <SubcontractorPanel
          subcontractors={opportunity.subcontractors || []}
          opportunityId={opportunity.id}
          naicsCode={opportunity.naicsCode}
          state={opportunity.state}
          parsedRequirements={opportunity.parsedAttachments?.structured}
          opportunityInfo={{ naicsCode: opportunity.naicsCode, state: opportunity.state, setAside: opportunity.setAside }}
          onRequestQuote={(sub) => {
            setSelectedSubcontractor(sub)
            setEmailTemplateType('quote_request')
            setActivePanel('email')
          }}
          onSendDetails={(sub) => {
            setSelectedSubcontractor(sub)
            setEmailTemplateType('sow_delivery')
            setActivePanel('email')
          }}
          onSubcontractorsUpdated={fetchData}
        />
      ),
    },
    {
      id: 'email',
      label: 'Email',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <EmailDraftPanel
          recipientName={selectedSubcontractor?.contactName || selectedSubcontractor?.name}
          recipientEmail={selectedSubcontractor?.email || ''}
          opportunityTitle={opportunity.title}
          solicitationNumber={opportunity.solicitationNumber}
          bidAmount={currentBid?.recommendedPrice}
          sowSynopsis={sowSynopsis}
          deadline={deadline}
          agency={opportunity.agency}
          templateType={emailTemplateType}
          availableAttachments={solicitationAttachments}
          sowFileName={currentSOW?.fileName}
          opportunityId={opportunity.id}
          selectedAttachmentIds={emailSelectedAttachments}
          onSelectionChange={setEmailSelectedAttachments}
        />
      ),
    },
  ]

  // Add bid panel if bid exists
  if (currentBid) {
    panels.splice(1, 0, {
      id: 'bid',
      label: 'Bid',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <BidEditorPanel
          bid={currentBid}
          opportunity={opportunity}
          onSave={handleSaveBid}
          onStatusChange={handleBidStatusChange}
        />
      ),
    })
  }

  return (
    <WorkspaceLayout
      panels={panels}
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      progress={progress}
      nextAction={nextAction}
      headerContent={
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.push('/opportunities')}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-medium text-stone-800 truncate">
                {opportunity.title}
              </h1>
              <p className="text-xs text-stone-400">{opportunity.solicitationNumber}</p>
            </div>
          </div>

          {/* Right: Deadline */}
          <div className="flex items-center gap-4">
            {deadline && daysLeft !== null && (
              <div className={`px-3 py-1.5 rounded text-sm font-medium ${
                daysLeft <= 3 ? 'bg-stone-800 text-white' :
                daysLeft <= 7 ? 'bg-stone-200 text-stone-700' :
                'bg-stone-100 text-stone-600'
              }`}>
                {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
              </div>
            )}
          </div>
        </div>
      }
      sidebarContent={
        <DocumentDirectory
          documents={documents}
          activeDocumentId={activePanel === 'bid' ? currentBid?.id : activePanel === 'sow' ? currentSOW?.id : undefined}
          onSelectDocument={(doc) => {
            if (doc.type === 'bid') setActivePanel('bid')
            else if (doc.type === 'sow') setActivePanel('sow')
          }}
          onCreateNew={(type) => {
            if (type === 'bid') handleCreateBid()
            else if (type === 'sow') handleGenerateSOW()
          }}
        />
      }
    />
  )
}
