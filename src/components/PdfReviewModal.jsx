import { useEffect, useRef, useState } from 'react'
import { BRANDING } from '../lib/branding'
import {
  buildInvestigationDraft,
  buildSocDraft,
  exportInvestigationPdf,
  exportObservationPdf,
} from '../lib/pdf'

function PaperText({ initial, onChange, className }) {
  const ref = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (ref.current) ref.current.innerText = initial || ''
    // Seed once so typing does not reset the caret on parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
  }, [])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={`outline-none ring-0 empty:min-h-[1em] focus:bg-amber-50/80 ${className || ''}`}
      onInput={(e) => onChangeRef.current(e.currentTarget.innerText)}
    />
  )
}

function CheckMark({ checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="mt-[0.15em] inline-flex h-[0.85em] w-[0.85em] shrink-0 items-center justify-center border-[1.2px] border-black bg-white text-[9px] leading-none"
    >
      {checked ? '✓' : ''}
    </button>
  )
}

export default function PdfReviewModal({ kind, observation, onClose, canDownload = true }) {
  const [draft, setDraft] = useState(() =>
    kind === 'inv' ? buildInvestigationDraft(observation) : buildSocDraft(observation),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  function patchHeader(key, value) {
    setDraft((prev) => ({ ...prev, header: { ...prev.header, [key]: value } }))
  }

  function patchBlock(index, patch) {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)),
    }))
  }

  function patchSignature(key, value) {
    setDraft((prev) => ({ ...prev, signature: { ...prev.signature, [key]: value } }))
  }

  async function handleDownload() {
    if (!canDownload) return
    setBusy(true)
    setError('')
    try {
      if (kind === 'inv') await exportInvestigationPdf(observation, draft)
      else await exportObservationPdf(observation, draft)
    } catch {
      setError('PDF export failed.')
    } finally {
      setBusy(false)
    }
  }

  const headerFields = [
    ['to', 'Kepada / To'],
    ['date', 'Tanggal / Date'],
    ['subject', 'Perihal / Subject'],
    ['reporter', 'Pelapor / Reported by'],
    ['pic', 'PIC / Assigned'],
  ]

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-slate-950/80 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-review-title"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <h2 id="pdf-review-title" className="text-sm font-semibold text-slate-100">
            Review
          </h2>
          <p className="font-mono text-[10px] text-slate-500">{draft.header?.documentNo || draft.soc}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Edit text on the page. Changes apply to this print only and are not saved to the report.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-400"
          >
            Cancel
          </button>
          {canDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {busy ? '…' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <article
          className="mx-auto w-full max-w-[210mm] bg-white text-black shadow-2xl"
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            padding: '16mm',
            minHeight: '297mm',
          }}
        >
          <header className="border border-black">
            <div className="flex h-[20mm] items-center gap-3 px-2">
              <img
                src={encodeURI(BRANDING.logoPdfSrc)}
                alt={BRANDING.logoAlt}
                className="max-h-[15mm] w-auto max-w-[52mm] object-contain"
              />
              <PaperText
                initial={draft.title}
                onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
                className="flex-1 text-[12pt] font-bold leading-tight"
              />
            </div>
          </header>

          <div className="flex border border-t-0 border-black text-[8pt] leading-snug">
            <div className="min-w-0 flex-1">
              {headerFields.map(([key, label]) => (
                <div key={key} className="flex border-b border-black last:border-b-0">
                  <div className="w-[28%] max-w-[42mm] shrink-0 border-r border-black px-1.5 py-1.5 font-bold">
                    {label}
                  </div>
                  <div className="min-w-0 flex-1 px-1.5 py-1.5">
                    <PaperText
                      initial={draft.header[key] || ''}
                      onChange={(value) => patchHeader(key, value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex w-[28%] max-w-[54mm] shrink-0 flex-col border-l border-black">
              <div className="flex-1 border-b border-black px-1.5 py-1.5">
                <p className="text-[7.5pt] font-bold">Document No.</p>
                <PaperText
                  initial={draft.header.documentNo || ''}
                  onChange={(value) => patchHeader('documentNo', value)}
                  className="text-[7.2pt] leading-tight"
                />
              </div>
              <div className="flex-1 px-1.5 py-1.5">
                <p className="text-[7.5pt] font-bold">Effective Date</p>
                <PaperText
                  initial={draft.header.effectiveDate || ''}
                  onChange={(value) => patchHeader('effectiveDate', value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-[6mm] space-y-[3mm]">
            {draft.blocks.map((block, index) => {
              if (block.type === 'banner') {
                return (
                  <div key={`banner-${index}`} className="grid grid-cols-2 gap-[7mm] pt-1">
                    <PaperText
                      initial={block.id}
                      onChange={(value) => patchBlock(index, { id: value })}
                      className="border-b border-neutral-400 pb-1 text-[9pt] font-bold"
                    />
                    <PaperText
                      initial={block.en}
                      onChange={(value) => patchBlock(index, { en: value })}
                      className="border-b border-neutral-400 pb-1 text-[9pt] font-bold"
                    />
                  </div>
                )
              }

              const isHeading = block.type === 'heading'
              const isAction = block.type === 'action'

              return (
                <div key={`block-${index}`} className="grid grid-cols-2 gap-[7mm]">
                  <div className={`flex gap-1.5 ${isHeading ? 'text-[9pt] font-bold' : 'text-[8.6pt]'}`}>
                    {isAction && (
                      <CheckMark
                        checked={Boolean(block.checked)}
                        onToggle={() => patchBlock(index, { checked: !block.checked })}
                      />
                    )}
                    <PaperText
                      initial={block.id}
                      onChange={(value) => patchBlock(index, { id: value })}
                      className="min-w-0 flex-1 text-justify leading-[1.2]"
                    />
                  </div>
                  <div className={`flex gap-1.5 ${isHeading ? 'text-[9pt] font-bold' : 'text-[8.6pt]'}`}>
                    {isAction && (
                      <CheckMark
                        checked={Boolean(block.checked)}
                        onToggle={() => patchBlock(index, { checked: !block.checked })}
                      />
                    )}
                    <PaperText
                      initial={block.en}
                      onChange={(value) => patchBlock(index, { en: value })}
                      className="min-w-0 flex-1 text-justify leading-[1.2]"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <footer className="mt-8 space-y-1 text-[9pt]">
            <PaperText
              initial={draft.signature.sincerely}
              onChange={(value) => patchSignature('sincerely', value)}
            />
            <div className="h-10" />
            <PaperText
              initial={draft.signature.org}
              onChange={(value) => patchSignature('org', value)}
              className="font-bold"
            />
            <PaperText
              initial={draft.signature.role}
              onChange={(value) => patchSignature('role', value)}
              className="text-[8.5pt]"
            />
            <PaperText
              initial={draft.signature.company}
              onChange={(value) => patchSignature('company', value)}
              className="text-[8.5pt]"
            />
          </footer>
        </article>
      </div>
    </div>
  )
}
