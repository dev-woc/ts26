import OpenAI from 'openai'

// Singleton client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai

export interface SOWSection {
  title: string
  summary: string
  bullets: string[]
  details: string
}

interface SOWGenerationInput {
  title: string
  solicitationNumber: string
  agency: string
  naicsCode?: string | null
  setAside?: string | null
  responseDeadline: string
  postedDate?: string | null
  placeOfPerformance: string
  pointOfContact?: string | null
  description?: string | null
  parsedScope?: string[]
  parsedDeliverables?: string[]
  parsedCompliance?: string[]
  parsedPeriodOfPerformance?: string[]
  subcontractorName?: string | null
}

/**
 * Use OpenAI to generate professional SOW section copy.
 * Returns sections 1–6 with summary, bullets, and full details.
 */
export async function generateSOWSections(input: SOWGenerationInput): Promise<SOWSection[]> {
  const {
    title,
    solicitationNumber,
    agency,
    naicsCode,
    setAside,
    responseDeadline,
    postedDate,
    placeOfPerformance,
    pointOfContact,
    description,
    parsedScope,
    parsedDeliverables,
    parsedCompliance,
    parsedPeriodOfPerformance,
    subcontractorName,
  } = input

  const hasParsed = !!(
    (parsedScope && parsedScope.length > 0) ||
    (parsedDeliverables && parsedDeliverables.length > 0) ||
    (parsedCompliance && parsedCompliance.length > 0)
  )

  const contextBlock = [
    `Solicitation Number: ${solicitationNumber}`,
    `Title: ${title}`,
    `Issuing Agency: ${agency}`,
    naicsCode ? `NAICS Code: ${naicsCode}` : null,
    setAside ? `Set-Aside: ${setAside}` : null,
    `Response Deadline: ${responseDeadline}`,
    postedDate ? `Posted: ${postedDate}` : null,
    `Place of Performance: ${placeOfPerformance}`,
    pointOfContact ? `Point of Contact: ${pointOfContact}` : null,
    subcontractorName ? `Subcontractor: ${subcontractorName}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const parsedBlock = hasParsed
    ? `\n\nPARSED SOLICITATION CONTENT:\n` +
      (parsedScope?.length ? `Scope:\n${parsedScope.slice(0, 5).join('\n')}\n` : '') +
      (parsedDeliverables?.length ? `Deliverables:\n${parsedDeliverables.slice(0, 5).join('\n')}\n` : '') +
      (parsedCompliance?.length ? `Compliance:\n${parsedCompliance.slice(0, 5).join('\n')}\n` : '') +
      (parsedPeriodOfPerformance?.length ? `Period of Performance:\n${parsedPeriodOfPerformance.slice(0, 3).join('\n')}\n` : '')
    : description
    ? `\n\nSOLICITATION DESCRIPTION:\n${description.slice(0, 3000)}`
    : ''

  const prompt = `You are writing a professional federal government Statement of Work (SOW) for a prime contractor to send to a subcontractor.

OPPORTUNITY DETAILS:
${contextBlock}${parsedBlock}

Generate exactly 6 SOW sections in JSON format. Each section must have:
- "title": section heading (e.g. "1.0 BACKGROUND & PURPOSE")
- "summary": one concise sentence describing the section (max 120 chars)
- "bullets": array of 3–6 specific, actionable bullet points
- "details": 2–4 professional paragraphs of full section text

Sections to generate:
1. 1.0 BACKGROUND & PURPOSE — context, why this SOW exists, what the solicitation is for
2. 2.0 SCOPE OF SERVICES — exactly what the subcontractor must provide, drawn from the solicitation
3. 3.0 PLACE OF PERFORMANCE — where work is performed, any site-specific requirements
4. 4.0 PERIOD OF PERFORMANCE — timeline, key dates, response deadline
5. 5.0 DELIVERABLES — specific outputs the subcontractor must deliver
6. 6.0 COMPLIANCE REQUIREMENTS — regulatory, FAR, quality, and certification requirements

Write in formal, professional government contracting language. Be specific to this solicitation — do not use generic filler text. Reference the actual solicitation number and agency throughout.

Return ONLY a valid JSON array of 6 section objects. No markdown, no explanation.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(raw)
    // Handle both { sections: [...] } and bare [...]
    const sections: SOWSection[] = Array.isArray(parsed) ? parsed : (parsed.sections || [])

    if (!sections.length) {
      throw new Error('OpenAI returned empty sections')
    }

    return sections
  } catch {
    throw new Error(`Failed to parse OpenAI SOW response: ${raw.slice(0, 200)}`)
  }
}

// ─── Plain Language Transformation ────────────────────────────────────────────

export interface PlainLanguageSection {
  title: string           // Business-friendly ALL CAPS heading
  summary: string         // 1-2 sentence plain English overview
  bullets: string[]       // Active-voice action items
  whyItMatters: string    // Context explaining why the requirement exists
  criticalItems: string[] // Deadlines, dollar amounts, hard requirements
}

/**
 * Transform formal government SOW sections into plain business language.
 * Implements AI-01 through AI-10 requirements.
 */
export async function transformSOWToPlainLanguage(
  sections: Array<{
    title: string
    summary?: string
    bullets?: string[]
    details?: string
    content?: string
  }>,
  context: {
    title: string
    agency: string
    solicitationNumber: string
    deadline?: string
  }
): Promise<PlainLanguageSection[]> {
  const sectionTexts = sections
    .map((s, i) => {
      const parts: string[] = [`SECTION ${i + 1}: ${s.title}`]
      if (s.summary) parts.push(s.summary)
      if (s.bullets?.length) parts.push(s.bullets.join('\n'))
      if (s.details) parts.push(s.details)
      if (!s.summary && !s.bullets?.length && !s.details && s.content) parts.push(s.content)
      return parts.join('\n')
    })
    .join('\n\n---\n\n')

  const prompt = `You are simplifying a federal government Statement of Work for a small business owner who is not familiar with government contracting jargon.

PROJECT: ${context.title}
AGENCY: ${context.agency}
SOLICITATION: ${context.solicitationNumber}${context.deadline ? `\nRESPONSE DEADLINE: ${context.deadline}` : ''}

ORIGINAL SOW SECTIONS:
${sectionTexts}

Transform each section into plain business language. Return a JSON object with key "sections" containing an array of ${sections.length} objects, each with:

- "title": Short business-friendly name in ALL CAPS (e.g. "WHAT YOU'RE PROVIDING", "KEY DEADLINES", "RULES TO FOLLOW", "WHERE THE WORK HAPPENS")
- "summary": 1-2 sentences in plain English. No acronyms without explanation. No passive voice.
- "bullets": Array of 3-6 specific action items in active voice. Start each with "You must", "Provide", "Deliver", "Ensure", "Submit", "Coordinate", etc. Be concrete.
- "whyItMatters": 1-2 sentences explaining WHY this requirement exists — the purpose behind it. Help the reader understand, not just comply.
- "criticalItems": Array of strings for any deadlines, dollar amounts, penalties, or hard requirements. Format as "⏰ [Date] — [what's due]" or "⚠️ [requirement or penalty]". Empty array if none.

Transformation rules:
1. Translate every acronym on first use: write "FAR (Federal Acquisition Regulation)" then just "FAR" after
2. Rewrite passive voice: "supplies must be delivered by" → "you must deliver supplies by"
3. Break any sentence over 25 words into shorter sentences
4. Preserve ALL factual requirements — do not omit, soften, or change any requirement
5. Professional but conversational tone — like a knowledgeable colleague explaining it
6. If the section mentions specific part numbers, NSNs, or spec numbers, keep them exactly

Return ONLY valid JSON. No markdown fences, no extra text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(raw)
    const result: PlainLanguageSection[] = Array.isArray(parsed)
      ? parsed
      : parsed.sections || []
    if (!result.length) throw new Error('Empty transformation result')
    return result
  } catch {
    throw new Error(`Failed to parse plain language response: ${raw.slice(0, 200)}`)
  }
}

// ─── Opportunity Brief ────────────────────────────────────────────────────────

export interface OpportunityBrief {
  whatTheyAreBuying: string
  extendedOverview?: string
  endUser?: string
  placeOfPerformance: {
    location: string
    siteType: 'on-site' | 'remote' | 'hybrid' | 'unknown'
    travelRequired: boolean
  }
  whoQualifies: {
    setAside?: string
    licenses?: string[]
    clearances?: string[]
    certifications?: string[]
  }
  keyDeliverables: Array<{
    item: string
    frequency?: string
  }>
  periodOfPerformance: {
    basePeriod: string
    optionYears?: number
  }
  estimatedValue?: string
  contractType?: string
  headsUp: Array<{
    type: 'bonding' | 'clearance' | 'setaside' | 'timeline' | 'onsite' | 'other'
    message: string
  }>
  generatedAt: string
}

interface BriefGenerationInput {
  title: string
  agency: string
  solicitationNumber: string
  naicsCode?: string | null
  setAside?: string | null
  description?: string | null
  rawData?: Record<string, unknown> | null
  parsedAttachments?: {
    structured?: {
      scope?: string[]
      deliverables?: string[]
      compliance?: string[]
      periodOfPerformance?: string[]
      placeOfPerformance?: string
    }
  } | null
}

/**
 * Generate an Opportunity Brief — plain-language summary answering what, where, who qualifies,
 * deliverables, and any gotchas. Cached to opportunity.opportunityBrief.
 */
export async function generateOpportunityBrief(input: BriefGenerationInput): Promise<OpportunityBrief> {
  const {
    title,
    agency,
    solicitationNumber,
    naicsCode,
    setAside,
    description,
    rawData,
    parsedAttachments,
  } = input

  const structured = parsedAttachments?.structured

  const contextBlock = [
    `Title: ${title}`,
    `Agency: ${agency}`,
    `Solicitation Number: ${solicitationNumber}`,
    naicsCode ? `NAICS Code: ${naicsCode}` : null,
    setAside ? `Set-Aside: ${setAside}` : null,
    rawData?.placeOfPerformance ? `Place of Performance: ${JSON.stringify(rawData.placeOfPerformance)}` : null,
    rawData?.contractType ? `Contract Type: ${rawData.contractType}` : null,
    rawData?.awardAmount ? `Estimated Value: ${rawData.awardAmount}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const parsedBlock = structured
    ? '\n\nPARSED SOLICITATION CONTENT:\n' +
      (structured.scope?.length ? `Scope:\n${structured.scope.slice(0, 6).join('\n')}\n` : '') +
      (structured.deliverables?.length ? `Deliverables:\n${structured.deliverables.slice(0, 6).join('\n')}\n` : '') +
      (structured.compliance?.length ? `Compliance:\n${structured.compliance.slice(0, 6).join('\n')}\n` : '') +
      (structured.periodOfPerformance?.length ? `Period of Performance:\n${structured.periodOfPerformance.slice(0, 4).join('\n')}\n` : '') +
      (structured.placeOfPerformance ? `Place of Performance Detail: ${structured.placeOfPerformance}\n` : '')
    : description
    ? `\n\nSOLICITATION DESCRIPTION:\n${description.slice(0, 4000)}`
    : ''

  const prompt = `You are briefing a small business contractor on a federal solicitation before they search for subcontractors. Write a plain-language brief that answers the key questions they need answered.

OPPORTUNITY DATA:
${contextBlock}${parsedBlock}

Return a JSON object matching this exact structure:
{
  "whatTheyAreBuying": "2–3 plain-English sentences. What is the government buying? Who is the end user? What is the core work?",
  "extendedOverview": "4–7 paragraphs of plain-language narrative. Cover: (1) the full scope and nature of the work, (2) operational context and why the agency needs this, (3) what day-to-day performance looks like, (4) key technical or specialized requirements, (5) notable risks or complexities a small business should understand, (6) how success will be measured. Write for a non-government project manager who is deciding whether to pursue this bid.",
  "endUser": "Who benefits from or uses the delivered services/products (e.g. 'Army personnel at Fort Knox'). Omit if unclear.",
  "placeOfPerformance": {
    "location": "City, State (or 'Multiple locations' or 'TBD')",
    "siteType": "on-site | remote | hybrid | unknown",
    "travelRequired": true or false
  },
  "whoQualifies": {
    "setAside": "Set-aside type if applicable (e.g. 'SDVOSB', '8(a)', 'HUBZone') or null",
    "licenses": ["Any required trade or professional licenses. Empty array if none."],
    "clearances": ["Any required security clearances, e.g. 'Secret', 'Top Secret'. Empty array if none."],
    "certifications": ["Any required certifications, e.g. 'ISO 9001', 'CMMC Level 2'. Empty array if none."]
  },
  "keyDeliverables": [
    { "item": "Plain-language deliverable description", "frequency": "Monthly / Per incident / Annually / One-time (or omit if not stated)" }
  ],
  "periodOfPerformance": {
    "basePeriod": "Plain description, e.g. '12 months' or 'Base year: Oct 2026 – Sep 2027'",
    "optionYears": 4 (number of option years, or omit if none)
  },
  "estimatedValue": "Dollar amount if stated, e.g. '$2.4M/year (stated)' or 'Not stated'",
  "contractType": "FFP / T&M / CPFF / IDIQ / etc. or null if not stated",
  "headsUp": [
    {
      "type": "bonding | clearance | setaside | timeline | onsite | other",
      "message": "Plain-language warning, e.g. 'Performance bond required — may disqualify smaller subs'"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Heads Up rules — include an entry for each that applies:
- type "bonding": if bonding or insurance >$100K is mentioned
- type "clearance": if any security clearance (Secret, Top Secret, DD-254) is required
- type "setaside": if a set-aside restricts who can participate (list the restriction)
- type "timeline": if response deadline is within 30 days OR if base period is unusually short (<6 months)
- type "onsite": if work requires mandatory on-site presence (not remote-eligible)
- type "other": any other unusual requirement that would affect subcontractor eligibility

Keep all language plain and direct. No FAR clause numbers in plain text unless critical to understand. No jargon without explanation.

Return ONLY valid JSON. No markdown, no extra text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 3500,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(raw) as OpportunityBrief
    if (!parsed.whatTheyAreBuying) throw new Error('Missing required brief fields')
    return parsed
  } catch {
    throw new Error(`Failed to parse brief response: ${raw.slice(0, 200)}`)
  }
}

// ─── Attachment Analysis ──────────────────────────────────────────────────────

/** Known government form patterns — checked against filename before calling LLM */
const FORM_PATTERNS: Array<{ pattern: RegExp; formType: string }> = [
  { pattern: /SF[-_]?1449/i, formType: 'SF-1449' },
  { pattern: /SF[-_]?33\b/i, formType: 'SF-33' },
  { pattern: /SF[-_]?26\b/i, formType: 'SF-26' },
  { pattern: /SF[-_]?30\b/i, formType: 'SF-30' },
  { pattern: /DD[-_]?1155/i, formType: 'DD-1155' },
  { pattern: /DD[-_]?254/i, formType: 'DD-254' },
  { pattern: /OF[-_]?347/i, formType: 'OF-347' },
  { pattern: /wage.?determination|WD[-_\s]\d/i, formType: 'Wage Determination' },
  { pattern: /davis.?bacon/i, formType: 'Wage Determination' },
]

export interface AttachmentInput {
  id: string
  originalName: string
  textContent?: string
}

export interface AttachmentAnalysis {
  id: string
  suggestedName: string | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  isForm: boolean
  formType: string | null
}

/**
 * Detect known government form by filename pattern (no LLM needed).
 */
function detectFormByFilename(filename: string): { isForm: boolean; formType: string | null } {
  for (const { pattern, formType } of FORM_PATTERNS) {
    if (pattern.test(filename)) return { isForm: true, formType }
  }
  return { isForm: false, formType: null }
}

/**
 * Batch-analyze attachments with GPT-4o to suggest human-readable names
 * and detect government forms. Falls back to filename-only detection if OpenAI fails.
 */
export async function analyzeAttachments(
  attachments: AttachmentInput[]
): Promise<AttachmentAnalysis[]> {
  if (!attachments.length) return []

  // Pre-screen with filename patterns first
  const filenameResults = attachments.map((att) => ({
    id: att.id,
    ...detectFormByFilename(att.originalName),
  }))

  // Build prompt
  const attachmentList = attachments
    .map(
      (att, i) =>
        `${i + 1}. ID: "${att.id}"\n   Filename: "${att.originalName}"${
          att.textContent ? `\n   Content excerpt: "${att.textContent.slice(0, 400)}"` : ''
        }`
    )
    .join('\n\n')

  const prompt = `You are analyzing federal government solicitation attachments. For each attachment, suggest a human-readable name and detect if it is a standard government form.

ATTACHMENTS:
${attachmentList}

For each attachment, return a JSON object with:
- "id": the attachment ID (exact match, do not change)
- "suggestedName": A clear, descriptive filename in Title Case (e.g. "Statement of Work.pdf", "SF-1449 Solicitation Form.pdf", "Wage Determination WD-2024-0001.pdf"). Keep the original file extension. Return null if the original name is already clear.
- "confidence": "HIGH" (confident in the suggested name), "MEDIUM" (reasonable guess), or "LOW" (uncertain)
- "isForm": true if this is a standard government form (SF-1449, SF-33, SF-26, SF-30, DD-1155, DD-254, OF-347, wage determination, etc.), false otherwise
- "formType": the form identifier if isForm is true (e.g. "SF-1449"), null otherwise

Rules:
- Do NOT change file extensions
- If the filename is already descriptive (e.g. "Statement_of_Work_v2.pdf"), return suggestedName: null
- For forms, always include the form number in the suggestedName
- Return a JSON object with key "results" containing an array of ${attachments.length} objects

Return ONLY valid JSON. No markdown, no extra text.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)
    const results: AttachmentAnalysis[] = Array.isArray(parsed)
      ? parsed
      : parsed.results || []

    // Merge with filename detection: filename patterns take precedence for isForm/formType
    return results.map((r) => {
      const filenameMatch = filenameResults.find((f) => f.id === r.id)
      return {
        id: r.id,
        suggestedName: r.suggestedName ?? null,
        confidence: r.confidence ?? 'LOW',
        isForm: filenameMatch?.isForm || r.isForm || false,
        formType: filenameMatch?.formType || r.formType || null,
      }
    })
  } catch {
    // Fallback: return filename-only results with no suggested names
    return attachments.map((att) => {
      const filenameMatch = filenameResults.find((f) => f.id === att.id)!
      return {
        id: att.id,
        suggestedName: null,
        confidence: 'LOW' as const,
        isForm: filenameMatch.isForm,
        formType: filenameMatch.formType,
      }
    })
  }
}

/**
 * Generate a concise AI synopsis for an opportunity description.
 */
export async function generateOpportunitySynopsis(
  title: string,
  description: string,
  agency: string,
  naicsCode?: string | null
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Summarize this federal government solicitation in 2–3 concise sentences for a contractor reviewing it. Focus on what work is required, who needs it, and any key requirements. Be specific, not generic.

Title: ${title}
Agency: ${agency}
${naicsCode ? `NAICS: ${naicsCode}` : ''}
Description:
${description.slice(0, 4000)}

Return only the summary text, no labels or formatting.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 200,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}
