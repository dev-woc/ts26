'use client'

import { useState, useMemo } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface StructuredContent {
  scope: string[]
  deliverables: string[]
  compliance: string[]
  qualifications: string[]
  periodOfPerformance: string[]
  evaluation: string[]
}

interface ScopeItem {
  id: string
  text: string
  tags: string[]
  critical?: boolean
  expanded?: boolean
}

interface TeamNote {
  id: string
  author: string
  date: string
  text: string
}

interface ScopeOverviewPanelProps {
  opportunity: {
    id: string
    title: string
    solicitationNumber: string
    agency?: string
    naicsCode?: string
    description?: string
    responseDeadline?: string | Date
    postedDate?: string | Date
    estimatedContractValue?: number
    state?: string
    setAside?: string
    rawData?: any
    parsedAttachments?: { structured?: StructuredContent } | any
  }
  assessment?: {
    estimatedValue?: number
    estimatedCost?: number
    profitMarginPercent?: number
  } | null
}

// ── Tag colors ────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, string> = {
  'CRITICAL': 'bg-amber-100 text-amber-800 border-amber-200',
  'CRITICAL PATH': 'bg-amber-100 text-amber-800 border-amber-200',
  'FIRST ARTICLE': 'bg-amber-100 text-amber-800 border-amber-200',
  'INSPECTION REQUIRED': 'bg-amber-100 text-amber-800 border-amber-200',
  'GOVERNMENT WITNESS': 'bg-amber-50 text-amber-700 border-amber-200',
  'REQUIRED': 'bg-stone-800 text-white border-stone-800',
  'MILITARY GRADE': 'bg-stone-700 text-white border-stone-700',
  'ITAR': 'bg-red-100 text-red-800 border-red-200',
  'BUY AMERICAN': 'bg-stone-100 text-stone-700 border-stone-300',
  'QUALITY ASSURANCE': 'bg-stone-100 text-stone-700 border-stone-300',
  'OPTIONAL': 'bg-stone-50 text-stone-500 border-stone-200',
  'CUI': 'bg-red-50 text-red-700 border-red-200',
  'FAR': 'bg-stone-100 text-stone-600 border-stone-200',
  'DFARS': 'bg-stone-100 text-stone-600 border-stone-200',
  'MIL-SPEC': 'bg-stone-100 text-stone-600 border-stone-200',
  'DEFAULT': 'bg-stone-100 text-stone-600 border-stone-200',
}

function tagStyle(tag: string): string {
  return TAG_STYLES[tag.toUpperCase()] || TAG_STYLES.DEFAULT
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTags(text: string): string[] {
  const tags: string[] = []
  const t = text.toUpperCase()
  if (t.includes('FIRST ARTICLE') || t.includes('FAT')) tags.push('FIRST ARTICLE')
  if (t.includes('CRITICAL') || t.includes('SPECIAL EMPHASIS') || t.includes('LEVEL I')) tags.push('CRITICAL')
  if (t.includes('INSPECT')) tags.push('INSPECTION REQUIRED')
  if (t.includes('ITAR') || t.includes('EXPORT CONTROL')) tags.push('ITAR')
  if (t.includes('BUY AMERICAN') || t.includes('BALANCE OF PAYMENTS')) tags.push('BUY AMERICAN')
  if (t.includes('QUALITY') || t.includes('QC') || t.includes('ISO')) tags.push('QUALITY ASSURANCE')
  if (/\bFAR\s+\d/.test(t) || /FAR\s+52\./.test(t)) tags.push('FAR')
  if (/\bDFARS\b/.test(t)) tags.push('DFARS')
  if (/\bMIL-/.test(t)) tags.push('MIL-SPEC')
  if (t.includes('CUI') || t.includes('CONTROLLED UNCLASSIFIED')) tags.push('CUI')
  if (t.includes('OPTIONAL') || t.includes('OPTION LINE')) tags.push('OPTIONAL')
  return [...new Set(tags)].slice(0, 4)
}

function isCritical(text: string): boolean {
  const t = text.toUpperCase()
  return (
    t.includes('CRITICAL') ||
    t.includes('SPECIAL EMPHASIS') ||
    t.includes('LEVEL I') ||
    t.includes('ITAR') ||
    t.includes('FIRST ARTICLE')
  )
}

function extractProducts(opportunity: ScopeOverviewPanelProps['opportunity']): ScopeItem[] {
  const items: ScopeItem[] = []
  // Title is always the primary product
  items.push({
    id: 'product-0',
    text: opportunity.title,
    tags: extractTags(opportunity.title),
    critical: isCritical(opportunity.title),
  })

  // Try to extract additional items from raw description
  const desc = opportunity.description || ''
  const lines = desc.split(/[\n;|]/).map(l => l.trim()).filter(l => l.length > 15 && l.length < 300)
  const productKeywords = /\b(part|nsn|connector|plug|receptacle|assembly|unit|item|supply|material)\b/i

  let count = 1
  for (const line of lines) {
    if (productKeywords.test(line) && !items.some(i => i.text === line)) {
      items.push({
        id: `product-${count++}`,
        text: line,
        tags: extractTags(line),
        critical: isCritical(line),
      })
      if (count > 3) break
    }
  }

  return items
}

function extractServices(structured: StructuredContent | undefined, description: string): ScopeItem[] {
  const raw = structured?.scope || []
  const serviceKeywords = /\b(inspect|test|coordinat|install|deliver|perform|provide|certif|verif|witness|monitor)\b/i
  const desc = description || ''

  const candidates = raw.length > 0
    ? raw
    : desc.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 20)

  return candidates
    .filter(s => serviceKeywords.test(s))
    .slice(0, 6)
    .map((text, i) => ({
      id: `service-${i}`,
      text: text.length > 200 ? text.substring(0, 200) + '…' : text,
      tags: extractTags(text),
      critical: isCritical(text),
    }))
}

function extractDeliverables(structured: StructuredContent | undefined): ScopeItem[] {
  const raw = structured?.deliverables || []

  const defaults = [
    { text: 'Certification Data Package (CDRLs)', tags: ['REQUIRED'] },
    { text: 'Inspection & Test Plans — submit 20 days pre-delivery', tags: ['REQUIRED'] },
    { text: 'First Article Test (FAT) Report', tags: ['FIRST ARTICLE', 'REQUIRED'] },
    { text: 'Final product delivery per contract schedule', tags: ['REQUIRED'] },
  ]

  if (raw.length === 0) {
    return defaults.map((d, i) => ({
      id: `del-${i}`,
      text: d.text,
      tags: d.tags,
      critical: d.tags.includes('FIRST ARTICLE'),
    }))
  }

  return raw.slice(0, 6).map((text, i) => ({
    id: `del-${i}`,
    text: text.length > 200 ? text.substring(0, 200) + '…' : text,
    tags: extractTags(text),
    critical: isCritical(text),
  }))
}

function extractCompliance(structured: StructuredContent | undefined, description: string): ScopeItem[] {
  const raw = structured?.compliance || []
  const desc = description || ''

  // Also pull FAR references from description
  const farMatches = desc.match(/(?:FAR|DFARS?|AFARS?|VAAR)\s+\d+\.\d+(?:-\d+)?/gi) || []
  const milMatches = desc.match(/MIL-(?:STD|DTL|SPEC|I|S|T|C|P|A|E|H|PRF)-[\w-]+/gi) || []

  const combined = [
    ...raw,
    ...farMatches.map(f => `${f} — Federal Acquisition Regulation clause applies`),
    ...milMatches.map(m => `${m} — Military specification requirement`),
  ]

  if (combined.length === 0) {
    return [
      { id: 'comp-0', text: 'All applicable FAR clauses as listed in solicitation', tags: ['FAR'], critical: false },
      { id: 'comp-1', text: 'Buy American Act — domestic sourcing requirements apply', tags: ['BUY AMERICAN'], critical: false },
      { id: 'comp-2', text: 'Item Unique Identification (IUID) — part marking required', tags: ['REQUIRED'], critical: false },
    ]
  }

  return [...new Set(combined)]
    .slice(0, 8)
    .map((text, i) => ({
      id: `comp-${i}`,
      text: text.length > 200 ? text.substring(0, 200) + '…' : text,
      tags: extractTags(text),
      critical: isCritical(text),
    }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Tag({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${tagStyle(label)}`}>
      {label}
    </span>
  )
}

function ScopeCard({
  item,
  showCheckbox,
  checked,
  onCheck,
}: {
  item: ScopeItem
  showCheckbox?: boolean
  checked?: boolean
  onCheck?: (id: string, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = item.text.length > 120
  const displayText = isLong && !expanded ? item.text.substring(0, 120) + '…' : item.text

  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      item.critical
        ? 'border-l-2 border-l-amber-400 border-t-stone-200 border-r-stone-200 border-b-stone-200 bg-amber-50/30'
        : 'border-stone-200 bg-white hover:bg-stone-50'
    }`}>
      <div className="flex items-start gap-2">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onCheck?.(item.id, e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800 leading-snug">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs text-stone-400 hover:text-stone-600"
            >
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map(tag => <Tag key={tag} label={tag} />)}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(item.text).catch(() => {})
          }}
          className="flex-shrink-0 p-1 text-stone-300 hover:text-stone-500 transition-colors"
          title="Copy to clipboard"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SectionBlock({
  icon,
  title,
  count,
  items,
  accentClass,
  showCheckboxes,
  checkedItems,
  onCheck,
}: {
  icon: string
  title: string
  count: number
  items: ScopeItem[]
  accentClass: string
  showCheckboxes?: boolean
  checkedItems?: Set<string>
  onCheck?: (id: string, checked: boolean) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const visibleItems = showAll ? items : items.slice(0, 3)

  return (
    <div className={`rounded-xl border ${accentClass} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-stone-800">{title}</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2 bg-stone-50/50">
          {visibleItems.map(item => (
            <ScopeCard
              key={item.id}
              item={item}
              showCheckbox={showCheckboxes}
              checked={checkedItems?.has(item.id)}
              onCheck={onCheck}
            />
          ))}
          {items.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs text-stone-400 hover:text-stone-600 py-1"
            >
              {showAll ? `Show less ↑` : `Show all ${items.length} ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DeliverableTable({ items }: { items: ScopeItem[] }) {
  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <span className="text-sm font-semibold text-stone-800">Documentation & Deliverables</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
        </div>
      </div>
      <div className="bg-stone-50/50">
        <div className="grid grid-cols-12 px-4 py-2 border-b border-stone-200 bg-stone-100">
          <span className="col-span-7 text-xs font-semibold text-stone-500 uppercase tracking-wide">Deliverable</span>
          <span className="col-span-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Due</span>
          <span className="col-span-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</span>
        </div>
        {items.map((item, i) => {
          const dueSoon = item.text.toLowerCase().includes('20 days') || item.text.toLowerCase().includes('pre-delivery')
          return (
            <div
              key={item.id}
              className={`grid grid-cols-12 px-4 py-3 border-b border-stone-100 last:border-0 ${
                i % 2 === 1 ? 'bg-white' : 'bg-stone-50/30'
              }`}
            >
              <div className="col-span-7 pr-4">
                <p className="text-sm text-stone-800 leading-snug">{item.text.length > 100 ? item.text.substring(0, 100) + '…' : item.text}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 2).map(tag => <Tag key={tag} label={tag} />)}
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <span className={`text-xs font-medium ${dueSoon ? 'text-amber-700' : 'text-stone-500'}`}>
                  {dueSoon ? '20 days pre-delivery' : 'Per contract'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                  Pending
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TeamNotes() {
  const [notes, setNotes] = useState<TeamNote[]>([])
  const [draft, setDraft] = useState('')
  const [authorName, setAuthorName] = useState('')

  const addNote = () => {
    const text = draft.trim()
    if (!text) return
    setNotes(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        author: authorName.trim() || 'You',
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        text,
      },
    ])
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-sm font-semibold text-stone-800">Team Notes</span>
          {notes.length > 0 && (
            <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{notes.length}</span>
          )}
        </div>
      </div>
      <div className="bg-stone-50/50 p-4 space-y-3">
        {notes.length === 0 && (
          <p className="text-xs text-stone-400 italic text-center py-2">No notes yet. Add a note for your team.</p>
        )}
        {notes.map(note => (
          <div key={note.id} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-stone-600">
              {note.author[0]?.toUpperCase()}
            </div>
            <div className="flex-1 bg-white rounded-lg border border-stone-200 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-stone-700">{note.author}</span>
                <span className="text-xs text-stone-400">{note.date}</span>
              </div>
              <p className="text-sm text-stone-700">{note.text}</p>
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <input
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Your name"
            className="w-24 px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          />
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
            placeholder="Add a note for your team…"
            className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={addNote}
            disabled={!draft.trim()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'products' | 'services' | 'documentation' | 'compliance'

export default function ScopeOverviewPanel({ opportunity, assessment }: ScopeOverviewPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const structured: StructuredContent | undefined = (opportunity.parsedAttachments as any)?.structured

  // Derived scope data
  const products = useMemo(() => extractProducts(opportunity), [opportunity.id])
  const services = useMemo(() => extractServices(structured, opportunity.description || ''), [opportunity.id])
  const deliverables = useMemo(() => extractDeliverables(structured), [opportunity.id])
  const compliance = useMemo(() => extractCompliance(structured, opportunity.description || ''), [opportunity.id])

  const criticalCount = [...products, ...services, ...deliverables, ...compliance].filter(i => i.critical).length

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const estimatedValue = assessment?.estimatedValue || opportunity.estimatedContractValue

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'products', label: '📦 Products' },
    { key: 'services', label: '🔧 Services' },
    { key: 'documentation', label: '📄 Documentation' },
    { key: 'compliance', label: '⚖️ Compliance' },
  ]

  const showProducts = activeFilter === 'all' || activeFilter === 'products'
  const showServices = activeFilter === 'all' || activeFilter === 'services'
  const showDocumentation = activeFilter === 'all' || activeFilter === 'documentation'
  const showCompliance = activeFilter === 'all' || activeFilter === 'compliance'

  return (
    <div className="h-full overflow-y-auto bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-stone-500 tracking-widest uppercase">Scope Overview</span>
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  ⚠️ {criticalCount} critical item{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-mono">
              DRAFT
            </span>
          </div>

          {/* Identifiers row */}
          <div className="px-4 py-3 border-b border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              onClick={() => navigator.clipboard.writeText(opportunity.solicitationNumber).catch(() => {})}
              className="flex items-center gap-1.5 text-sm font-semibold text-stone-800 hover:text-stone-600 group"
            >
              {opportunity.solicitationNumber}
              <svg className="h-3 w-3 text-stone-300 group-hover:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {opportunity.naicsCode && (
              <span className="text-sm text-stone-500">NAICS: <span className="font-medium text-stone-700">{opportunity.naicsCode}</span></span>
            )}
            {opportunity.agency && (
              <span className="text-sm text-stone-500 truncate max-w-xs">
                {opportunity.agency.split('.').pop()?.trim() || opportunity.agency}
              </span>
            )}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 divide-x divide-stone-100">
            <div className="px-4 py-3">
              <p className="text-xs text-stone-400 mb-0.5">Product</p>
              <p className="text-sm font-semibold text-stone-800 truncate" title={opportunity.title}>
                {opportunity.title}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-stone-400 mb-0.5">Est. Value</p>
              <p className="text-sm font-semibold text-stone-800">
                {estimatedValue
                  ? `$${(estimatedValue / 1000).toFixed(0)}K`
                  : '—'}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-stone-400 mb-0.5">Response Due</p>
              <p className={`text-sm font-semibold ${daysLeft !== null && daysLeft <= 7 ? 'text-amber-700' : 'text-stone-800'}`}>
                {deadline
                  ? deadline.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-stone-400 mb-0.5">Days Left</p>
              <p className={`text-sm font-semibold ${
                daysLeft === null ? 'text-stone-400' :
                daysLeft <= 7 ? 'text-amber-700' :
                daysLeft <= 14 ? 'text-stone-600' :
                'text-stone-800'
              }`}>
                {daysLeft !== null ? `${daysLeft}d` : '—'}
                {daysLeft !== null && daysLeft <= 7 && ' ⚠️'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                activeFilter === f.key
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
          {checkedItems.size > 0 && (
            <span className="ml-auto text-xs text-stone-500 self-center">
              {checkedItems.size} item{checkedItems.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {/* Section blocks */}
        {showProducts && (
          <SectionBlock
            icon="📦"
            title="Products"
            count={products.length}
            items={products}
            accentClass="border-stone-200"
            showCheckboxes
            checkedItems={checkedItems}
            onCheck={handleCheck}
          />
        )}

        {showServices && services.length > 0 && (
          <SectionBlock
            icon="🔧"
            title="Services"
            count={services.length}
            items={services}
            accentClass="border-stone-200"
            showCheckboxes
            checkedItems={checkedItems}
            onCheck={handleCheck}
          />
        )}

        {showDocumentation && (
          <DeliverableTable items={deliverables} />
        )}

        {showCompliance && compliance.length > 0 && (
          <SectionBlock
            icon="⚖️"
            title="Compliance"
            count={compliance.length}
            items={compliance}
            accentClass="border-stone-200"
          />
        )}

        {/* Team notes — always shown at bottom */}
        {activeFilter === 'all' && <TeamNotes />}

      </div>
    </div>
  )
}
