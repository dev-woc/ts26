'use client'

import { useState, useEffect } from 'react'

interface Assessment {
  id?: string
  estimatedValue: number | null
  estimatedCost: number | null
  profitMarginDollar?: number | null
  profitMarginPercent?: number | null
  meetsMarginTarget?: boolean
  strategicValue?: 'HIGH' | 'MEDIUM' | 'LOW' | null
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | null
  recommendation?: string | null
  notes?: string | null
  assessedBy?: {
    name: string
    email: string
  }
  assessedAt?: string
}

interface MarginCalculatorProps {
  opportunityId: string
  existingAssessment?: Assessment | null
  onSave: (assessment: Assessment) => Promise<void>
}

export default function MarginCalculator({
  opportunityId,
  existingAssessment,
  onSave,
}: MarginCalculatorProps) {
  const [estimatedValue, setEstimatedValue] = useState<string>(
    existingAssessment?.estimatedValue?.toString() || ''
  )
  const [estimatedCost, setEstimatedCost] = useState<string>(
    existingAssessment?.estimatedCost?.toString() || ''
  )
  const [strategicValue, setStrategicValue] = useState<string>(
    existingAssessment?.strategicValue || 'MEDIUM'
  )
  const [riskLevel, setRiskLevel] = useState<string>(
    existingAssessment?.riskLevel || 'MEDIUM'
  )
  const [notes, setNotes] = useState(existingAssessment?.notes || '')
  const [saving, setSaving] = useState(false)

  // Calculate margins
  const value = parseFloat(estimatedValue) || 0
  const cost = parseFloat(estimatedCost) || 0
  const profitDollar = value - cost
  const profitPercent = value > 0 ? (profitDollar / value) * 100 : 0

  const getMarginColor = () => {
    if (profitPercent >= 20) return 'text-green-600'
    if (profitPercent >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginBg = () => {
    if (profitPercent >= 20) return 'bg-green-50 border-green-200'
    if (profitPercent >= 10) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getRecommendation = () => {
    if (profitPercent >= 20) return { text: 'GO', color: 'text-green-700', bg: 'bg-green-100' }
    if (profitPercent >= 10) return { text: 'REVIEW', color: 'text-yellow-700', bg: 'bg-yellow-100' }
    return { text: 'NO GO', color: 'text-red-700', bg: 'bg-red-100' }
  }

  const handleSave = async () => {
    if (!estimatedValue || !estimatedCost) {
      alert('Please enter both estimated value and cost')
      return
    }

    setSaving(true)
    try {
      await onSave({
        estimatedValue: parseFloat(estimatedValue),
        estimatedCost: parseFloat(estimatedCost),
        strategicValue: strategicValue as any,
        riskLevel: riskLevel as any,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }

  const recommendation = getRecommendation()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Margin Assessment</h3>
        <p className="text-sm text-purple-100 mt-1">
          Calculate profit margins to determine if this opportunity is worth pursuing
        </p>
      </div>

      <div className="p-6">
        {/* Calculator Inputs */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estimated Contract Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total contract value or estimate from SAM.gov
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estimated Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your estimated cost to complete the work
            </p>
          </div>
        </div>

        {/* Calculated Results */}
        {(value > 0 || cost > 0) && (
          <div className={`rounded-lg border-2 p-6 mb-6 ${getMarginBg()}`}>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  PROFIT MARGIN ($)
                </div>
                <div className={`text-3xl font-bold ${getMarginColor()}`}>
                  ${profitDollar.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  PROFIT MARGIN (%)
                </div>
                <div className={`text-3xl font-bold ${getMarginColor()}`}>
                  {profitPercent.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  RECOMMENDATION
                </div>
                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${recommendation.bg} ${recommendation.color}`}
                >
                  {recommendation.text}
                </div>
              </div>
            </div>

            {/* Margin Guide */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Good: ≥20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Review: 10-20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Low: &lt;10%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Factors */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Strategic Value
            </label>
            <select
              value={strategicValue}
              onChange={(e) => setStrategicValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="HIGH">High - Key opportunity</option>
              <option value="MEDIUM">Medium - Standard opportunity</option>
              <option value="LOW">Low - Limited strategic value</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Risk Level
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="LOW">Low - Confident we can deliver</option>
              <option value="MEDIUM">Medium - Some concerns</option>
              <option value="HIGH">High - Significant challenges</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Assessment Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any notes about this assessment..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !estimatedValue || !estimatedCost}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {existingAssessment ? 'Update Assessment' : 'Save Assessment'}
            </>
          )}
        </button>

        {/* Existing Assessment Info */}
        {existingAssessment?.assessedAt && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last assessed {new Date(existingAssessment.assessedAt).toLocaleString()}
              {existingAssessment.assessedBy && ` by ${existingAssessment.assessedBy.name}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
