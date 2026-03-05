'use client'

import { useState, useMemo } from 'react'
import { complianceGlossary } from '@/lib/data/compliance-glossary'
import type { GlossaryTerm } from '@/lib/data/compliance-glossary'

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

// ── Glossary matching ─────────────────────────────────────────────────────────

// Build a flat list of all terms for matching
const ALL_TERMS: GlossaryTerm[] = complianceGlossary.categories.flatMap(c => c.terms)

// Keyword aliases: pattern → exact term name in glossary
// Order matters: more specific patterns first
const TERM_ALIASES: [RegExp, string][] = [
  // Abbreviations (word-boundary, handles plurals like CDRLs)
  [/\bFATs?\b/i,          'First Article Test (FAT)'],
  [/\bITPs?\b/i,          'Inspection and Test Plan (ITP)'],
  [/\bCDRLs?\b/i,         'Contract Data Requirements List (CDRL)'],
  [/\bDIDs?\b/i,          'Data Item Description (DID)'],
  [/\bQCPs?\b/i,          'Quality Control Plan (QCP)'],
  [/\bQASPs?\b/i,         'Quality Assurance Surveillance Plan (QASP)'],
  [/\bCPARS\b/i,          'Contractor Performance Assessment Reporting System (CPARS)'],
  [/\bWAWF\b/i,           'DD-250 / Wide Area Workflow (WAWF) Acceptance'],
  [/\bDD[-\s]?250\b/i,    'DD-250 / Wide Area Workflow (WAWF) Acceptance'],
  [/\bCUI\b/i,            'Controlled Unclassified Information (CUI)'],
  [/\bFCL\b/i,            'Facility Clearance (FCL)'],
  [/\bOCI\b/i,            'Organizational Conflicts of Interest (OCI)'],
  [/\bFCA\b/i,            'False Claims Act (FCA) Liability'],
  [/\bMSRs?\b/i,          'Monthly Status Report (MSR)'],
  [/\bKOM\b/i,            'Kick-Off Meeting (KOM)'],
  [/\bPMP\b/i,            'Project Management Plan (PMP)'],
  [/\bNCRs?\b/i,          'Nonconformance Report (NCR)'],
  [/\bCoC\b/i,            'Certificate of Conformance (CoC)'],
  [/\bGFP\b/i,            'Contractor Furnished Equipment / Government Furnished Property (GFP) Accountability'],
  [/\bT4D\b/i,            'Termination for Default (T4D)'],
  [/\bT4C\b/i,            'Termination for Convenience (T4C)'],
  [/\bSCA\b/i,            'Wage Determination / Service Contract Act (SCA) Compliance'],
  [/\bCMMC\b/i,           'Cybersecurity Maturity Model Certification (CMMC)'],
  [/\bDD[-\s]?254\b/i,    'DD Form 254 (Contract Security Classification Specification)'],
  [/\bFOB\b/i,            'FAR 52.247-34 — FOB Destination'],
  // Spelled-out forms (catches "Inspection & Test Plans", "Inspection and Test Plan")
  [/inspection\s*[&and]+\s*test\s*plans?/i,            'Inspection and Test Plan (ITP)'],
  [/first\s+article\s+test/i,                          'First Article Test (FAT)'],
  [/certificate\s+of\s+conformance/i,                  'Certificate of Conformance (CoC)'],
  [/certification\s+data\s+(requirements?\s+list|package)/i, 'Contract Data Requirements List (CDRL)'],
  [/quality\s+control\s+plans?/i,                      'Quality Control Plan (QCP)'],
  [/quality\s+assurance\s+surveillance/i,              'Quality Assurance Surveillance Plan (QASP)'],
  [/monthly\s+status\s+report/i,                       'Monthly Status Report (MSR)'],
  [/kick[-\s]?off\s+meeting/i,                         'Kick-Off Meeting (KOM)'],
  [/project\s+management\s+plans?/i,                   'Project Management Plan (PMP)'],
  [/nonconformance\s+report/i,                         'Nonconformance Report (NCR)'],
  [/wide\s+area\s+workflow/i,                          'DD-250 / Wide Area Workflow (WAWF) Acceptance'],
  [/controlled\s+unclassified/i,                       'Controlled Unclassified Information (CUI)'],
  [/facility\s+clearance/i,                            'Facility Clearance (FCL)'],
  [/government[\s-]furnished\s+property/i,             'Contractor Furnished Equipment / Government Furnished Property (GFP) Accountability'],
  [/item\s+unique\s+identif/i,                         'DD-250 / Wide Area Workflow (WAWF) Acceptance'],
  // FAR clause numbers → specific glossary entries
  [/52\.204-10\b/i,       'FAR 52.204-10 — Reporting Executive Compensation'],
  [/52\.204-21\b/i,       'FAR 52.204-21 — Basic Safeguarding of Covered Contractor Information Systems'],
  [/52\.209-6\b/i,        'FAR 52.209-6 — Protecting the Government\'s Interest When Subcontracting'],
  [/52\.219-14\b/i,       'FAR 52.219-14 — Limitations on Subcontracting (Small Business Set-Asides)'],
  [/52\.222-26\b/i,       'FAR 52.222-26 — Equal Opportunity'],
  [/52\.232-33\b/i,       'FAR 52.232-33 — Payment by Electronic Funds Transfer (EFT)'],
  [/52\.246-[24]\b/i,     'FAR 52.246-2 / 52.246-4 — Inspection of Supplies / Inspection of Services'],
  [/52\.247-34\b/i,       'FAR 52.247-34 — FOB Destination'],
  [/252\.204-7012\b/i,    'DFARS 252.204-7012 — Safeguarding Covered Defense Information (CDI) / Cyber Incident Reporting'],
  // Any other FAR/DFARS clause number → inspection entry as fallback (most common)
  [/\b(?:FAR|DFARS?)\s+\d+\.\d/i, 'FAR 52.246-2 / 52.246-4 — Inspection of Supplies / Inspection of Services'],
  // Plain-language phrases
  [/buy\s+american/i,                   'Buy American Act Compliance'],
  [/wage\s+determination/i,             'Wage Determination / Service Contract Act (SCA) Compliance'],
  [/service\s+contract\s+act/i,         'Wage Determination / Service Contract Act (SCA) Compliance'],
  [/limitations?\s+on\s+subcontract/i,  'FAR 52.219-14 — Limitations on Subcontracting (Small Business Set-Asides)'],
  [/false\s+claims/i,                   'False Claims Act (FCA) Liability'],
  [/cure\s+notice/i,                    'Cure Notice'],
  [/show\s+cause/i,                     'Show Cause Notice'],
  [/termination\s+for\s+default/i,      'Termination for Default (T4D)'],
  [/termination\s+for\s+convenience/i,  'Termination for Convenience (T4C)'],
  [/per\s+contract\s+schedule/i,        'Shipping/Delivery Instructions (\'Per Contract\')'],
  [/per\s+contract\b/i,                 'Shipping/Delivery Instructions (\'Per Contract\')'],
  [/final\s+(?:product\s+)?delivery/i,  'Acceptance'],
  [/receiving\s+report/i,               'Receiving Report'],
]

function findGlossaryMatches(text: string): GlossaryTerm[] {
  const found = new Set<GlossaryTerm>()

  for (const [pattern, termName] of TERM_ALIASES) {
    if (pattern.test(text)) {
      const match = ALL_TERMS.find(t => t.term === termName)
      if (match && !found.has(match)) {
        found.add(match)
        if (found.size >= 3) break // cap early
      }
    }
  }

  // Fallback: scan full term core names
  if (found.size < 3) {
    for (const t of ALL_TERMS) {
      if (found.has(t)) continue
      const coreName = t.term.replace(/\s*\([^)]+\)\s*/g, '').replace(/\s*\/.*$/, '').trim()
      if (coreName.length > 10) {
        const escaped = coreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (new RegExp(escaped, 'i').test(text)) {
          found.add(t)
          if (found.size >= 3) break
        }
      }
    }
  }

  return [...found]
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
    t.includes('CRITICAL') || t.includes('SPECIAL EMPHASIS') ||
    t.includes('LEVEL I') || t.includes('ITAR') || t.includes('FIRST ARTICLE')
  )
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
    return defaults.map((d, i) => ({ id: `del-${i}`, text: d.text, tags: d.tags, critical: d.tags.includes('FIRST ARTICLE') }))
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
  const farMatches = description.match(/(?:FAR|DFARS?|AFARS?|VAAR)\s+\d+\.\d+(?:-\d+)?/gi) || []
  const milMatches = description.match(/MIL-(?:STD|DTL|SPEC|I|S|T|C|P|A|E|H|PRF)-[\w-]+/gi) || []
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
  return [...new Set(combined)].slice(0, 8).map((text, i) => ({
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

// Inline term explainer shown when user clicks "?"
function TermExplainer({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  return (
    <div className="mt-3 bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-stone-800">{term.term}</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 flex-shrink-0 mt-0.5">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-stone-600 leading-relaxed">{term.fullExplanation}</p>

      <div>
        <p className="font-semibold text-stone-700 mb-1">What you must do:</p>
        <ul className="space-y-1">
          {term.contractorMustDo.map((action, i) => (
            <li key={i} className="flex items-start gap-1.5 text-stone-600">
              <span className="text-stone-400 mt-0.5 flex-shrink-0">→</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {term.commonMistakes.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded p-2 space-y-1">
          <p className="font-semibold text-amber-800 text-[10px] uppercase tracking-wide">Common mistakes</p>
          {term.commonMistakes.map((m, i) => (
            <p key={i} className="text-amber-800 leading-snug">⚠ {m}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 border-t border-stone-200">
        {term.timing && (
          <span className="text-stone-400">
            <span className="font-medium text-stone-600">Timing:</span> {term.timing}
          </span>
        )}
        {term.farRef && (
          <span className="text-stone-400">
            <span className="font-medium text-stone-600">Reference:</span> {term.farRef}
          </span>
        )}
      </div>
    </div>
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
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null)

  const isLong = item.text.length > 120
  const displayText = isLong && !expanded ? item.text.substring(0, 120) + '…' : item.text

  const glossaryMatches = useMemo(() => findGlossaryMatches(item.text), [item.text])
  const hasGlossary = glossaryMatches.length > 0

  const toggleTerm = (t: GlossaryTerm) => {
    setActiveTerm(prev => prev?.term === t.term ? null : t)
  }

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
            <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs text-stone-400 hover:text-stone-600">
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {item.tags.map(tag => <Tag key={tag} label={tag} />)}
            {/* Glossary "?" buttons — one per matched term */}
            {glossaryMatches.map(t => (
              <button
                key={t.term}
                onClick={() => toggleTerm(t)}
                title={`What is ${t.term}?`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                  activeTerm?.term === t.term
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                }`}
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.term.replace(/\s*\(.*?\)/, '').trim().split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>

          {/* Inline term explanation */}
          {activeTerm && (
            <TermExplainer term={activeTerm} onClose={() => setActiveTerm(null)} />
          )}
        </div>

        {!hasGlossary && (
          <button
            onClick={() => navigator.clipboard.writeText(item.text).catch(() => {})}
            className="flex-shrink-0 p-1 text-stone-300 hover:text-stone-500 transition-colors"
            title="Copy to clipboard"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
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
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{count}</span>
        </div>
        <svg className={`h-4 w-4 text-stone-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <button onClick={() => setShowAll(!showAll)} className="w-full text-xs text-stone-400 hover:text-stone-600 py-1">
              {showAll ? 'Show less ↑' : `Show all ${items.length} ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DeliverableTable({ items }: { items: ScopeItem[] }) {
  const [activeTerm, setActiveTerm] = useState<{ rowId: string; term: GlossaryTerm } | null>(null)

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
          const matches = findGlossaryMatches(item.text)
          const rowKey = item.id

          return (
            <div key={item.id}>
              <div className={`grid grid-cols-12 px-4 py-3 border-b border-stone-100 last:border-0 ${i % 2 === 1 ? 'bg-white' : 'bg-stone-50/30'}`}>
                <div className="col-span-7 pr-4">
                  <p className="text-sm text-stone-800 leading-snug">{item.text.length > 100 ? item.text.substring(0, 100) + '…' : item.text}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 2).map(tag => <Tag key={tag} label={tag} />)}
                    {matches.map(t => (
                      <button
                        key={t.term}
                        onClick={() => setActiveTerm(
                          activeTerm?.rowId === rowKey && activeTerm.term.term === t.term
                            ? null
                            : { rowId: rowKey, term: t }
                        )}
                        title={`What is ${t.term}?`}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                          activeTerm?.rowId === rowKey && activeTerm.term.term === t.term
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                        }`}
                      >
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.term.replace(/\s*\(.*?\)/, '').trim().split(' ').slice(0, 3).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-3">
                  <span className={`text-xs font-medium ${dueSoon ? 'text-amber-700' : 'text-stone-500'}`}>
                    {dueSoon ? '20 days pre-delivery' : 'Per contract'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">Pending</span>
                </div>
              </div>
              {/* Inline explanation — spans full row */}
              {activeTerm?.rowId === rowKey && (
                <div className="px-4 pb-3 bg-white border-b border-stone-100">
                  <TermExplainer term={activeTerm.term} onClose={() => setActiveTerm(null)} />
                </div>
              )}
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
    setNotes(prev => [...prev, {
      id: Date.now().toString(),
      author: authorName.trim() || 'You',
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      text,
    }])
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-sm font-semibold text-stone-800">Team Notes</span>
          {notes.length > 0 && <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{notes.length}</span>}
        </div>
      </div>
      <div className="bg-stone-50/50 p-4 space-y-3">
        {notes.length === 0 && <p className="text-xs text-stone-400 italic text-center py-2">No notes yet. Add a note for your team.</p>}
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
          <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your name"
            className="w-24 px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400" />
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
            placeholder="Add a note for your team…"
            className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400" />
          <button onClick={addNote} disabled={!draft.trim()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors">
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Post-Award Milestone Tracker ──────────────────────────────────────────────

const POST_AWARD_STAGES = [
  { key: 'award',      label: 'Award',             desc: 'Contract awarded — start date confirmed' },
  { key: 'kickoff',   label: 'Kickoff Meeting',    desc: 'Initial meeting with COR / contracting officer' },
  { key: 'mobilize',  label: 'Mobilization',       desc: 'Team on-site, security clearances, equipment staged' },
  { key: 'delivery1', label: '1st Deliverable',    desc: 'First CDRLs or milestone delivery submitted' },
  { key: 'midterm',   label: 'Mid-term Review',    desc: 'Performance review with government customer' },
  { key: 'final',     label: 'Final Delivery',     desc: 'All deliverables accepted' },
  { key: 'closeout',  label: 'Contract Close-out', desc: 'Invoicing complete, documentation archived' },
]

function PostAwardTracker() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setCompleted(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })
  const pct = Math.round((completed.size / POST_AWARD_STAGES.length) * 100)

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-base">🏁</span>
          <span className="text-sm font-semibold text-stone-800">Post-Award Progress</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{pct}%</span>
        </div>
        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-stone-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="bg-stone-50/50">
        {POST_AWARD_STAGES.map((stage, i) => {
          const done = completed.has(stage.key)
          const prevDone = i === 0 || completed.has(POST_AWARD_STAGES[i - 1].key)
          return (
            <div key={stage.key} className={`flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-0 transition-colors ${done ? 'bg-white' : 'bg-stone-50/30'}`}>
              <button onClick={() => toggle(stage.key)}
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  done ? 'border-stone-600 bg-stone-600'
                  : prevDone ? 'border-stone-300 bg-white hover:border-stone-500'
                  : 'border-stone-200 bg-white opacity-50 cursor-not-allowed'
                }`}
                disabled={!prevDone && !done}>
                {done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${done ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{stage.label}</p>
                  <span className="text-xs text-stone-300">Stage {i + 1}</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Field Guide (full searchable glossary) ────────────────────────────────────

function FieldGuide({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return complianceGlossary.categories
    return complianceGlossary.categories.map(cat => ({
      ...cat,
      terms: cat.terms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.shortDef.toLowerCase().includes(q) ||
        t.farRef.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.terms.length > 0)
  }, [query])

  const totalResults = filtered.reduce((n, c) => n + c.terms.length, 0)

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder='Search — "FAT", "CDRL", "cure notice", "FAR 52.246"…'
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400" />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {query && <p className="text-xs text-stone-400">{totalResults} result{totalResults !== 1 ? 's' : ''}</p>}

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <p className="text-xs text-amber-800">{complianceGlossary.disclaimer}</p>
      </div>

      {filtered.map(cat => (
        <div key={cat.id} className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">{cat.label}</p>
            <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
          </div>
          <div className="divide-y divide-stone-100">
            {cat.terms.map(t => {
              const isOpen = openTerm === `${cat.id}-${t.term}`
              return (
                <div key={t.term}>
                  <button onClick={() => setOpenTerm(isOpen ? null : `${cat.id}-${t.term}`)}
                    className="w-full flex items-start justify-between px-4 py-3 bg-white hover:bg-stone-50 transition-colors text-left gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{t.term}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{t.shortDef}</p>
                    </div>
                    <svg className={`h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 bg-stone-50 space-y-3 text-xs">
                      <p className="text-stone-600 leading-relaxed pt-2">{t.fullExplanation}</p>
                      <div>
                        <p className="font-semibold text-stone-700 mb-1.5">What you must do:</p>
                        <ul className="space-y-1">
                          {t.contractorMustDo.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-stone-600">
                              <span className="text-stone-400 mt-0.5 flex-shrink-0">→</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {t.commonMistakes.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded p-2.5 space-y-1">
                          <p className="font-semibold text-amber-800 text-[10px] uppercase tracking-wide mb-1">Common mistakes</p>
                          {t.commonMistakes.map((m, i) => (
                            <p key={i} className="text-amber-800 leading-snug">⚠ {m}</p>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 border-t border-stone-200">
                        {t.timing && <span className="text-stone-400"><span className="font-medium text-stone-600">Timing:</span> {t.timing}</span>}
                        {t.farRef && <span className="text-stone-400"><span className="font-medium text-stone-600">Ref:</span> {t.farRef}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterKey = 'compliance' | 'deliverables' | 'qualifications' | 'evaluation' | 'postAward' | 'fieldGuide'

export default function ScopeOverviewPanel({ opportunity, assessment }: ScopeOverviewPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('compliance')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const structured: StructuredContent | undefined = (opportunity.parsedAttachments as any)?.structured

  const deliverables = useMemo(() => extractDeliverables(structured), [opportunity.id])
  const compliance = useMemo(() => extractCompliance(structured, opportunity.description || ''), [opportunity.id])

  const qualifications: ScopeItem[] = useMemo(() => {
    const raw = structured?.qualifications || []
    if (raw.length === 0) return []
    return raw.slice(0, 8).map((text, i) => ({
      id: `qual-${i}`,
      text: text.length > 200 ? text.substring(0, 200) + '…' : text,
      tags: extractTags(text),
      critical: isCritical(text),
    }))
  }, [opportunity.id])

  const evaluation: ScopeItem[] = useMemo(() => {
    const raw = structured?.evaluation || []
    if (raw.length === 0) return []
    return raw.slice(0, 8).map((text, i) => ({
      id: `eval-${i}`,
      text: text.length > 200 ? text.substring(0, 200) + '…' : text,
      tags: extractTags(text),
      critical: isCritical(text),
    }))
  }, [opportunity.id])

  const criticalCount = [...deliverables, ...compliance].filter(i => i.critical).length

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  const hasParsedData = !!(structured?.compliance?.length || structured?.deliverables?.length)

  const ALL_FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'compliance',     label: '⚖️ Compliance',    count: compliance.length },
    { key: 'deliverables',   label: '📄 Deliverables',  count: deliverables.length },
    { key: 'qualifications', label: '🎓 Qualifications', count: qualifications.length },
    { key: 'evaluation',     label: '📊 Evaluation',    count: evaluation.length },
    { key: 'postAward',      label: '🏁 Post-Award' },
    { key: 'fieldGuide',     label: '📚 Reference' },
  ]
  const FILTERS = ALL_FILTERS.filter(f =>
    f.key === 'compliance' || f.key === 'postAward' || f.key === 'fieldGuide' || (f.count ?? 0) > 0
  )

  return (
    <div className="h-full overflow-y-auto bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 tracking-widest uppercase">Compliance & Post-Award</span>
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  ⚠️ {criticalCount} critical
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hasParsedData && (
                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  Generate SOW to parse compliance data
                </span>
              )}
              {activeFilter !== 'fieldGuide' && (
                <button
                  onClick={() => setActiveFilter('fieldGuide')}
                  className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
                  title="Open the Federal Contracting Reference Guide"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Reference
                </button>
              )}
            </div>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
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
              <span className="text-sm text-stone-500">NAICS <span className="font-medium text-stone-700">{opportunity.naicsCode}</span></span>
            )}
            {opportunity.agency && (
              <span className="text-sm text-stone-500 truncate max-w-xs">{opportunity.agency}</span>
            )}
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                activeFilter === f.key
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-800'
              }`}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={`text-[10px] px-1 rounded-full ${activeFilter === f.key ? 'bg-white/20' : 'bg-stone-100 text-stone-500'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Compliance */}
        {activeFilter === 'compliance' && (
          compliance.length > 0 ? (
            <SectionBlock
              icon="⚖️"
              title="Compliance Requirements"
              count={compliance.length}
              items={compliance}
              accentClass="border-stone-200"
              showCheckboxes
              checkedItems={checkedItems}
              onCheck={handleCheck}
            />
          ) : (
            <EmptyState message="No compliance requirements extracted. Generate the SOW to parse solicitation attachments." />
          )
        )}

        {/* Deliverables */}
        {activeFilter === 'deliverables' && (
          deliverables.length > 0
            ? <DeliverableTable items={deliverables} />
            : <EmptyState message="No deliverables extracted from parsed content." />
        )}

        {/* Qualifications */}
        {activeFilter === 'qualifications' && (
          qualifications.length > 0 ? (
            <SectionBlock
              icon="🎓"
              title="Qualifications & Requirements"
              count={qualifications.length}
              items={qualifications}
              accentClass="border-stone-200"
            />
          ) : (
            <EmptyState message="No qualification requirements extracted." />
          )
        )}

        {/* Evaluation */}
        {activeFilter === 'evaluation' && (
          evaluation.length > 0 ? (
            <SectionBlock
              icon="📊"
              title="Evaluation Criteria"
              count={evaluation.length}
              items={evaluation}
              accentClass="border-stone-200"
            />
          ) : (
            <EmptyState message="No evaluation criteria extracted." />
          )
        )}

        {/* Post-Award */}
        {activeFilter === 'postAward' && (
          <>
            <PostAwardTracker />
            <TeamNotes />
          </>
        )}

        {/* Field Guide / Reference */}
        {activeFilter === 'fieldGuide' && <FieldGuide />}

      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-stone-400">{message}</p>
    </div>
  )
}
