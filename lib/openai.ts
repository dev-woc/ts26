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
