'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FormFillModalProps {
  opportunityId: string
  attachmentId: string
  attachmentName: string
  proxyUrl: string
  existingFields: Record<string, string> | null
  onClose: () => void
  onSaved: (fields: Record<string, string>) => void
}

interface FieldOverlay {
  name: string
  type: 'text' | 'checkbox' | 'radio'
  rect: { x: number; y: number; width: number; height: number }
  value: string
  checked?: boolean
}

export default function FormFillModal({
  opportunityId,
  attachmentId,
  attachmentName,
  proxyUrl,
  existingFields,
  onClose,
  onSaved,
}: FormFillModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fields, setFields] = useState<Record<string, string>>(existingFields ?? {})
  const [overlays, setOverlays] = useState<FieldOverlay[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfDocRef, setPdfDocRef] = useState<any>(null)
  const [scale, setScale] = useState(1)

  // Load PDF.js dynamically
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        setError(null)

        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist')

        // Set worker — use CDN worker matching installed version
        const version = pdfjsLib.version
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

        // Fetch PDF via proxy
        const response = await fetch(proxyUrl)
        if (!response.ok) throw new Error('Failed to fetch PDF')
        const arrayBuffer = await response.arrayBuffer()

        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        if (cancelled) return

        setPdfDocRef(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
      } catch (err) {
        if (!cancelled) {
          console.error('PDF load error:', err)
          setError('Failed to load PDF. The document may not be viewable in this viewer.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [proxyUrl])

  // Render current page whenever pdfDoc or page number changes
  useEffect(() => {
    if (!pdfDocRef || !canvasRef.current) return
    let cancelled = false

    async function renderPage() {
      try {
        const page = await pdfDocRef.getPage(currentPage)
        if (cancelled) return

        const container = containerRef.current
        const containerWidth = container?.clientWidth ?? 800
        const viewport = page.getViewport({ scale: 1 })
        const computedScale = (containerWidth - 32) / viewport.width
        const scaledViewport = page.getViewport({ scale: computedScale })

        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        setScale(computedScale)

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        if (cancelled) return

        // Extract AcroForm annotations
        const annotations = await page.getAnnotations()
        if (cancelled) return

        const newOverlays: FieldOverlay[] = annotations
          .filter((ann: any) => ann.subtype === 'Widget' && ann.fieldName)
          .map((ann: any) => {
            // PDF origin is bottom-left; canvas is top-left
            const [x1, y1, x2, y2] = ann.rect
            const canvasX = x1 * computedScale
            const canvasY = scaledViewport.height - y2 * computedScale
            const width = (x2 - x1) * computedScale
            const height = (y2 - y1) * computedScale

            const fieldType =
              ann.checkBox || ann.radioButton
                ? ann.radioButton
                  ? 'radio'
                  : 'checkbox'
                : 'text'

            return {
              name: ann.fieldName,
              type: fieldType,
              rect: { x: canvasX, y: canvasY, width, height },
              value: fields[ann.fieldName] ?? (ann.fieldValue as string) ?? '',
            }
          })

        setOverlays(newOverlays)
      } catch (err) {
        if (!cancelled) {
          console.error('Page render error:', err)
        }
      }
    }

    renderPage()
    return () => { cancelled = true }
  }, [pdfDocRef, currentPage, fields])

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/opportunities/${opportunityId}/attachments/${attachmentId}/form-data`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      onSaved(fields)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save form data')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col m-6 rounded-xl overflow-hidden bg-white shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-stone-800 truncate">{attachmentName}</p>
            <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-stone-700 text-white rounded">
              FILL FORM
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 rounded"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-stone-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 rounded"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium text-white bg-stone-800 rounded hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4" ref={containerRef}>
          {loading && (
            <div className="flex items-center justify-center h-64 text-stone-400 text-sm gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading PDF…
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm text-stone-500">{error}</p>
              <p className="text-xs text-stone-400">You can still fill fields manually below.</p>
            </div>
          )}

          {!loading && !error && (
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="block shadow-md rounded" />

              {/* AcroForm field overlays */}
              {overlays.map((overlay, i) => (
                <div
                  key={`${overlay.name}-${i}`}
                  className="absolute"
                  style={{
                    left: overlay.rect.x,
                    top: overlay.rect.y,
                    width: overlay.rect.width,
                    height: overlay.rect.height,
                  }}
                >
                  {overlay.type === 'checkbox' || overlay.type === 'radio' ? (
                    <input
                      type={overlay.type}
                      checked={fields[overlay.name] === 'On' || fields[overlay.name] === 'true'}
                      onChange={(e) => handleFieldChange(overlay.name, e.target.checked ? 'On' : 'Off')}
                      className="w-full h-full cursor-pointer accent-stone-700"
                      title={overlay.name}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fields[overlay.name] ?? ''}
                      onChange={(e) => handleFieldChange(overlay.name, e.target.value)}
                      className="w-full h-full px-1 text-xs bg-blue-50/70 border border-blue-300 focus:bg-white focus:border-blue-500 outline-none rounded-none"
                      title={overlay.name}
                      style={{ fontSize: Math.max(9, overlay.rect.height * 0.55) }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Manual field entry fallback when no annotations found */}
          {!loading && !error && overlays.length === 0 && Object.keys(fields).length === 0 && (
            <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg">
              <p className="text-xs text-stone-500">
                No fillable fields detected on this page. This PDF may use non-standard form encoding.
                You can still view and download the document.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
