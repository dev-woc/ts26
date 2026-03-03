'use client'

import { useState } from 'react'

// Structured section format
interface StructuredSection {
  title: string
  summary: string
  bullets: string[]
  details: string
}

// Legacy flat section format
interface LegacySection {
  title: string
  content: string
}

type Section = StructuredSection | LegacySection

function isStructuredSection(section: Section): section is StructuredSection {
  return 'bullets' in section && Array.isArray((section as any).bullets)
}

interface SOWContent {
  opportunity?: {
    title?: string
    solicitationNumber?: string
    agency?: string
    naicsCode?: string
    [key: string]: any
  }
  header?: {
    title: string
    date: string
    sow_id: string
    prepared_for: string
    prepared_by: string
  }
  project?: {
    title: string
    solicitation_number: string
    agency: string
    naics_code: string
  }
  sections: Section[]
  [key: string]: any
}

interface SOWDocumentEditorProps {
  content: SOWContent
  onSave: (updatedContent: SOWContent) => Promise<void>
  onCancel: () => void
}

export default function SOWDocumentEditor({ content, onSave, onCancel }: SOWDocumentEditorProps) {
  const [editedContent, setEditedContent] = useState<SOWContent>(content)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const isNewFormat = !!editedContent.opportunity
  const opp = editedContent.opportunity

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedContent)
    } finally {
      setSaving(false)
    }
  }

  const updateHeader = (field: string, value: string) => {
    if (editedContent.header) {
      setEditedContent({
        ...editedContent,
        header: { ...editedContent.header, [field]: value },
      })
    }
  }

  const updateProject = (field: string, value: string) => {
    if (editedContent.project) {
      setEditedContent({
        ...editedContent,
        project: { ...editedContent.project, [field]: value },
      })
    }
  }

  const updateOpportunity = (field: string, value: string) => {
    if (editedContent.opportunity) {
      setEditedContent({
        ...editedContent,
        opportunity: { ...editedContent.opportunity, [field]: value },
      })
    }
  }

  const updateSectionTitle = (index: number, value: string) => {
    const newSections = [...editedContent.sections]
    newSections[index] = { ...newSections[index], title: value }
    setEditedContent({ ...editedContent, sections: newSections })
  }

  const updateSectionSummary = (index: number, value: string) => {
    const section = editedContent.sections[index]
    if (isStructuredSection(section)) {
      const newSections = [...editedContent.sections]
      newSections[index] = { ...section, summary: value }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  const updateSectionBullet = (sectionIndex: number, bulletIndex: number, value: string) => {
    const section = editedContent.sections[sectionIndex]
    if (isStructuredSection(section)) {
      const newBullets = [...section.bullets]
      newBullets[bulletIndex] = value
      const newSections = [...editedContent.sections]
      newSections[sectionIndex] = { ...section, bullets: newBullets }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  const addBullet = (sectionIndex: number) => {
    const section = editedContent.sections[sectionIndex]
    if (isStructuredSection(section)) {
      const newSections = [...editedContent.sections]
      newSections[sectionIndex] = { ...section, bullets: [...section.bullets, ''] }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  const removeBullet = (sectionIndex: number, bulletIndex: number) => {
    const section = editedContent.sections[sectionIndex]
    if (isStructuredSection(section) && section.bullets.length > 1) {
      const newBullets = section.bullets.filter((_, i) => i !== bulletIndex)
      const newSections = [...editedContent.sections]
      newSections[sectionIndex] = { ...section, bullets: newBullets }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  const updateSectionDetails = (index: number, value: string) => {
    const section = editedContent.sections[index]
    if (isStructuredSection(section)) {
      const newSections = [...editedContent.sections]
      newSections[index] = { ...section, details: value }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  const updateSectionContent = (index: number, value: string) => {
    const section = editedContent.sections[index]
    if (!isStructuredSection(section)) {
      const newSections = [...editedContent.sections]
      newSections[index] = { ...section, content: value }
      setEditedContent({ ...editedContent, sections: newSections })
    }
  }

  return (
    <div className="relative">
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-300 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Editing: {opp?.solicitationNumber || editedContent.header?.sow_id || 'SOW'}
          </div>
          <div className="text-xs text-gray-500">
            Click any text to edit
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div className="bg-gray-200 h-[calc(100vh-60px)] overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-2xl">
          <div className="p-16 space-y-6" style={{ minHeight: '297mm' }}>

            {isNewFormat && opp ? (
              /* === NEW FORMAT EDITOR === */
              <>
                {/* Opportunity Header */}
                <div className="text-center mb-12 pb-8 border-b-4 border-gray-800">
                  <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateOpportunity('title', e.currentTarget.textContent || '')}
                    className="text-3xl font-bold text-gray-900 mb-6 outline-none focus:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    {opp.title}
                  </h1>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 max-w-2xl mx-auto">
                    <div className="text-left">
                      <span className="font-semibold">Solicitation:</span>{' '}
                      <span className="text-gray-600">{opp.solicitationNumber}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">Agency:</span>{' '}
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateOpportunity('agency', e.currentTarget.textContent || '')}
                        className="outline-none focus:bg-yellow-50 px-1 rounded"
                      >
                        {opp.agency}
                      </span>
                    </div>
                    {opp.naicsCode && (
                      <div className="text-left">
                        <span className="font-semibold">NAICS:</span>{' '}
                        <span className="text-gray-600">{opp.naicsCode}</span>
                      </div>
                    )}
                    {opp.responseDeadline && (
                      <div className="text-left">
                        <span className="font-semibold">Deadline:</span>{' '}
                        <span className="text-gray-600">{opp.responseDeadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Structured Sections */}
                <div className="space-y-8">
                  {editedContent.sections.map((section, index) => (
                    <div key={index} className="group">
                      {/* Title */}
                      <h2
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateSectionTitle(index, e.currentTarget.textContent || '')}
                        onFocus={() => setActiveSection(`title-${index}`)}
                        className={`text-2xl font-bold text-gray-900 mb-2 outline-none focus:bg-blue-50 px-2 py-1 -ml-2 rounded transition-colors ${
                          activeSection === `title-${index}` ? 'ring-2 ring-blue-400' : ''
                        }`}
                      >
                        {section.title}
                      </h2>

                      {isStructuredSection(section) ? (
                        <>
                          {/* Summary */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateSectionSummary(index, e.currentTarget.textContent || '')}
                            onFocus={() => setActiveSection(`summary-${index}`)}
                            className={`text-sm text-gray-500 mb-4 outline-none focus:bg-yellow-50 px-2 py-1 -ml-2 rounded transition-colors italic ${
                              activeSection === `summary-${index}` ? 'ring-2 ring-yellow-400' : ''
                            }`}
                          >
                            {section.summary}
                          </div>

                          {/* Editable Bullet List */}
                          <div className="space-y-2 mb-4 ml-4">
                            {section.bullets.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-2 flex-shrink-0 select-none">&#8226;</span>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => updateSectionBullet(index, bIdx, e.target.value)}
                                  onFocus={() => setActiveSection(`bullet-${index}-${bIdx}`)}
                                  className={`flex-1 text-sm text-gray-700 py-1 px-2 border border-transparent rounded outline-none focus:bg-yellow-50 focus:border-yellow-300 transition-colors ${
                                    activeSection === `bullet-${index}-${bIdx}` ? 'ring-1 ring-yellow-400' : ''
                                  }`}
                                />
                                {section.bullets.length > 1 && (
                                  <button
                                    onClick={() => removeBullet(index, bIdx)}
                                    className="text-gray-300 hover:text-red-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove bullet"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addBullet(index)}
                              className="text-xs text-gray-400 hover:text-gray-600 ml-6 mt-1 flex items-center gap-1"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add bullet
                            </button>
                          </div>

                          {/* Editable Details (collapsible) */}
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                              Edit full text
                            </summary>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => updateSectionDetails(index, e.currentTarget.textContent || '')}
                              onFocus={() => setActiveSection(`details-${index}`)}
                              className={`mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap outline-none focus:bg-yellow-50 px-2 py-2 -ml-2 rounded min-h-[60px] transition-colors border border-dashed border-gray-200 ${
                                activeSection === `details-${index}` ? 'ring-2 ring-yellow-400' : ''
                              }`}
                            >
                              {section.details}
                            </div>
                          </details>
                        </>
                      ) : (
                        /* Legacy section: content-editable text block */
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateSectionContent(index, e.currentTarget.textContent || '')}
                          onFocus={() => setActiveSection(`content-${index}`)}
                          className={`text-gray-700 leading-relaxed whitespace-pre-wrap outline-none focus:bg-yellow-50 px-2 py-2 -ml-2 rounded min-h-[100px] transition-colors ${
                            activeSection === `content-${index}` ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        >
                          {(section as LegacySection).content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* === LEGACY FORMAT EDITOR === */
              <>
                {/* Header - Editable */}
                {editedContent.header && (
                  <div className="text-center mb-12 pb-8 border-b-4 border-gray-800">
                    <h1
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateHeader('title', e.currentTarget.textContent || '')}
                      className="text-4xl font-bold text-gray-900 mb-6 outline-none focus:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      {editedContent.header.title}
                    </h1>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 max-w-2xl mx-auto">
                      <div className="text-left">
                        <span className="font-semibold">Date:</span>{' '}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateHeader('date', e.currentTarget.textContent || '')}
                          className="outline-none focus:bg-yellow-50 px-1 rounded"
                        >
                          {editedContent.header.date}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">SOW ID:</span>{' '}
                        <span className="text-gray-600">{editedContent.header.sow_id}</span>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">Prepared For:</span>{' '}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateHeader('prepared_for', e.currentTarget.textContent || '')}
                          className="outline-none focus:bg-yellow-50 px-1 rounded"
                        >
                          {editedContent.header.prepared_for}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">Prepared By:</span>{' '}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateHeader('prepared_by', e.currentTarget.textContent || '')}
                          className="outline-none focus:bg-yellow-50 px-1 rounded"
                        >
                          {editedContent.header.prepared_by}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Information */}
                {editedContent.project && (
                  <div className="mb-10 pb-6 border-b-2 border-gray-300">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-800">Project:</span>{' '}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateProject('title', e.currentTarget.textContent || '')}
                          className="outline-none focus:bg-yellow-50 px-1 rounded text-gray-700"
                        >
                          {editedContent.project.title}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Solicitation Number:</span>{' '}
                        <span className="text-gray-600">{editedContent.project.solicitation_number}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Government Agency:</span>{' '}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateProject('agency', e.currentTarget.textContent || '')}
                          className="outline-none focus:bg-yellow-50 px-1 rounded text-gray-700"
                        >
                          {editedContent.project.agency}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">NAICS Code:</span>{' '}
                        <span className="text-gray-600">{editedContent.project.naics_code}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy Sections */}
                <div className="space-y-8">
                  {editedContent.sections.map((section, index) => (
                    <div key={index} className="group">
                      <h2
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateSectionTitle(index, e.currentTarget.textContent || '')}
                        onFocus={() => setActiveSection(`title-${index}`)}
                        className={`text-2xl font-bold text-gray-900 mb-4 outline-none focus:bg-blue-50 px-2 py-1 -ml-2 rounded transition-colors ${
                          activeSection === `title-${index}` ? 'ring-2 ring-blue-400' : ''
                        }`}
                      >
                        {section.title}
                      </h2>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateSectionContent(index, e.currentTarget.textContent || '')}
                        onFocus={() => setActiveSection(`content-${index}`)}
                        className={`text-gray-700 leading-relaxed whitespace-pre-wrap outline-none focus:bg-yellow-50 px-2 py-2 -ml-2 rounded min-h-[100px] transition-colors ${
                          activeSection === `content-${index}` ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        {'content' in section ? section.content : (section as StructuredSection).details}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Signature Section */}
            <div className="mt-20 pt-10 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <div className="border-t-2 border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Prime Contractor</p>
                    <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
                  </div>
                </div>
                <div>
                  <div className="border-t-2 border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Subcontractor</p>
                    <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="bg-gray-100 border-t border-gray-300 px-6 py-3 text-center text-sm text-gray-600">
        Tip: Click on any text to edit it. Use the bullet controls to add or remove items. Don't forget to save!
      </div>
    </div>
  )
}
