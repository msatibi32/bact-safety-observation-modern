import { useEffect, useMemo, useState } from 'react'
import { canApproveHsseStep, canApproveSpvStep } from '../../lib/roles'
import { updateWorkPermitSheet } from '../../lib/passes'
import { editorFromPermit, payloadFromEditor, validatePermitSheet } from '../../lib/ptwForm'
import { buildPtwPdfModel, downloadPtwPdf, ptwPdfBlob } from '../../lib/ptwPdf'
import { useUser } from '../RequireRole'
import PermitEditor from './PermitEditor'
import PtwPdfPreview from './PtwPdfPreview'

export default function PermitReviewModal({ permit, onClose, onSaved }) {
  const user = useUser()
  const canSave = canApproveSpvStep(user) || canApproveHsseStep(user)
  const initial = useMemo(() => editorFromPermit(permit), [permit])
  const [form, setForm] = useState(initial.form)
  const [types, setTypes] = useState(initial.types)
  const [sheet, setSheet] = useState(initial.sheet)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const model = useMemo(
    () => buildPtwPdfModel({
      form,
      types,
      sheet,
      meta: {
        refNo: permit.ref_no,
        status: permit.status,
        approvedBy: permit.approved_by,
        approvedAt: permit.approved_at,
      },
    }),
    [form, types, sheet, permit.ref_no, permit.status, permit.approved_by, permit.approved_at],
  )

  useEffect(() => {
    let cancel = false
    const timer = window.setTimeout(async () => {
      try {
        const blob = await ptwPdfBlob(model)
        if (cancel) return
        setPdfBlob(blob)
        setPreviewError('')
      } catch (err) {
        if (!cancel) setPreviewError(err.message || 'Preview PDF gagal.')
      }
    }, 280)
    return () => {
      cancel = true
      window.clearTimeout(timer)
    }
  }, [model])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  function onForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setNote('')
  }

  function onSheet(partial) {
    setSheet((prev) => ({ ...prev, ...partial }))
    setNote('')
  }

  function onToggleOpen(id) {
    setSheet((prev) => {
      const section = prev.open.includes(id)
      const open = section ? prev.open.filter((item) => item !== id) : [...prev.open, id]
      return { ...prev, open }
    })
  }

  function onToggleList(field, id) {
    setSheet((prev) => {
      const list = prev[field]
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
      return { ...prev, [field]: next }
    })
  }

  function onToggleType(type) {
    const turningOn = !types.includes(type)
    setTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]))
    if (!turningOn) return
    if (type === 'Isolation Energy') onSheet({ open: [...new Set([...sheet.open, '4', '8'])] })
    if (type === 'Confine Space') onSheet({ open: [...new Set([...sheet.open, '5'])] })
  }

  async function save() {
    if (!canSave) return
    setError('')
    setNote('')
    const invalid = validatePermitSheet({ ...sheet, nominatedPerson: sheet.nominatedPerson.trim() || form.applicant_name.trim() }, types)
    if (!types.length) {
      setError('Pilih minimal satu jenis pekerjaan.')
      return
    }
    if (!form.start_at || Number.isNaN(new Date(form.start_at).getTime())) {
      setError('Isi tanggal mulai pekerjaan.')
      return
    }
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    try {
      const saved = await updateWorkPermitSheet(permit.id, payloadFromEditor({ form, types, sheet }))
      const next = saved && typeof saved === 'object' ? { ...permit, ...saved } : permit
      onSaved(next)
      setNote('Perubahan tersimpan.')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan lembar.')
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    setBusy(true)
    setError('')
    try {
      await downloadPtwPdf(model)
    } catch (err) {
      setError(err.message || 'PDF gagal diunduh.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-950/80" role="dialog" aria-modal="true" aria-labelledby="ptw-pdf-title">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <h2 id="ptw-pdf-title" className="text-sm font-semibold text-slate-100">Lembar Work Permit</h2>
          <p className="font-mono text-[10px] text-slate-500">{permit.ref_no} · 1 halaman · FM.HSE.001</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {error && <span className="max-w-xs text-xs text-red-300">{error}</span>}
          {note && <span className="text-xs text-emerald-300">{note}</span>}
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300">
            Tutup
          </button>
          {canSave && (
            <button type="button" onClick={save} disabled={busy} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-100">
              {busy ? '…' : 'Simpan'}
            </button>
          )}
          <button type="button" onClick={download} disabled={busy} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Unduh PDF
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,390px)_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto border-b border-slate-800 bg-slate-950 lg:border-b-0 lg:border-r">
          <PermitEditor
            form={form}
            types={types}
            sheet={sheet}
            onForm={onForm}
            onSheet={onSheet}
            onToggleType={onToggleType}
            onToggleOpen={onToggleOpen}
            onToggleList={onToggleList}
          />
        </div>
        <div className="min-h-[70vh] bg-slate-800 p-3 lg:min-h-0">
          {previewError ? (
            <p className="text-sm text-red-300">{previewError}</p>
          ) : pdfBlob ? (
            <PtwPdfPreview blob={pdfBlob} />
          ) : (
            <p className="text-sm text-slate-400">Menyiapkan preview…</p>
          )}
        </div>
      </div>
      <style>{`
        .paper-input {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid rgb(51 65 85);
          background: rgb(15 23 42);
          color: rgb(241 245 249);
          padding: 0.35rem 0.55rem;
          font-size: 12px;
        }
        .paper-input:focus { outline: 2px solid rgba(243, 112, 33, 0.35); border-color: #f37021; }
      `}</style>
    </div>
  )
}
