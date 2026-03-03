'use client'

import { useState } from 'react'

interface SOWContent {
  header: {
    title: string
    date: string
    sow_id: string
    prepared_for: string
    prepared_by: string
  }
  project: {
    title: string
    solicitation_number: string
    agency: string
    naics_code: string
  }
  sections: Array<{
    title: string
    content: string
  }>
}

interface SOWEditorProps {
  content: SOWContent
  onSave: (updatedContent: SOWContent) => Promise<void>
  onCancel: () => void
}

export default function SOWEditor({ content, onSave, onCancel }: SOWEditorProps) {
  const [editedContent, setEditedContent] = useState<SOWContent>(content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedContent)
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (index: number, field: 'title' | 'content', value: string) => {
    const newSections = [...editedContent.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setEditedContent({ ...editedContent, sections: newSections })
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 pb-6 border-b-2 border-gray-300">
        <div className="text-center mb-6">
          <input
            type="text"
            value={editedContent.header.title}
            onChange={(e) =>
              setEditedContent({
                ...editedContent,
                header: { ...editedContent.header, title: e.target.value },
              })
            }
            className="text-3xl font-bold text-gray-900 text-center w-full border-b-2 border-transparent focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold w-32">Date:</span>
            <input
              type="text"
              value={editedContent.header.date}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  header: { ...editedContent.header, date: e.target.value },
                })
              }
              className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-32">SOW ID:</span>
            <input
              type="text"
              value={editedContent.header.sow_id}
              readOnly
              className="flex-1 border-b border-gray-200 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-32">Prepared For:</span>
            <input
              type="text"
              value={editedContent.header.prepared_for}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  header: { ...editedContent.header, prepared_for: e.target.value },
                })
              }
              className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-32">Prepared By:</span>
            <input
              type="text"
              value={editedContent.header.prepared_by}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  header: { ...editedContent.header, prepared_by: e.target.value },
                })
              }
              className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold w-40">Project:</span>
            <input
              type="text"
              value={editedContent.project.title}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  project: { ...editedContent.project, title: e.target.value },
                })
              }
              className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-40">Solicitation Number:</span>
            <input
              type="text"
              value={editedContent.project.solicitation_number}
              readOnly
              className="flex-1 border-b border-gray-200 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-40">Government Agency:</span>
            <input
              type="text"
              value={editedContent.project.agency}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  project: { ...editedContent.project, agency: e.target.value },
                })
              }
              className="flex-1 border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <span className="font-semibold w-40">NAICS Code:</span>
            <input
              type="text"
              value={editedContent.project.naics_code}
              readOnly
              className="flex-1 border-b border-gray-200 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 mb-8">
        {editedContent.sections.map((section, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(index, 'title', e.target.value)}
              className="text-xl font-bold text-gray-900 w-full mb-3 border-b-2 border-transparent focus:border-blue-500 outline-none"
            />
            <textarea
              value={section.content}
              onChange={(e) => updateSection(index, 'content', e.target.value)}
              rows={4}
              className="w-full text-gray-700 leading-relaxed border border-gray-300 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-0 bg-white py-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
