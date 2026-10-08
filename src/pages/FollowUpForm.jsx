import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PublicModuleNav from '../components/PublicModuleNav'
import { CameraIcon, CheckCircleIcon } from '../components/Icon'
import { validatePhotoFile } from '../lib/limits'
import { formatJakarta, getFollowUpForm, submitFollowUp, uploadEvidenceFiles } from '../lib/passes'

function todayJakarta() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
}

export default function FollowUpForm() {
  const { token } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deadline, setDeadline] = useState('')
  const [actionPlan, setActionPlan] = useState('')
  const [status, setStatus] = useState('On Progress')
  const [overdueReason, setOverdueReason] = useState('')
  const [files, setFiles] = useState([])
  const [existing, setExisting] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getFollowUpForm(token)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError('Tautan follow-up tidak ditemukan.')
          return
        }
        setRecord(data)
        setDeadline(data.deadline || '')
        setActionPlan(data.action_plan || '')
        setStatus(data.followup_status === 'Closed' ? 'Closed' : 'On Progress')
        setOverdueReason(data.overdue_reason || '')
        setExisting(Array.isArray(data.evidence) ? data.evidence : [])
        if (data.closed) setDone(true)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Tidak dapat membuka formulir.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const overdue = Boolean(deadline) && deadline < todayJakarta()

  function addFiles(list) {
    setError('')
    const next = [...files]
    for (const file of list) {
      if (next.length >= 4) break
      const invalid = validatePhotoFile(file)
      if (invalid) {
        setError(invalid)
        continue
      }
      next.push(file)
    }
    setFiles(next)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (actionPlan.trim().length < 10) {
      setError('Action plan wajib diisi. Tuliskan tindak lanjut yang direncanakan.')
      return
    }
    if (overdue && !overdueReason.trim()) {
      setError('Lewat deadline. Isi alasannya.')
      return
    }
    if (status === 'Closed' && existing.length + files.length < 1) {
      setError('Lampirkan foto bukti sebelum status diubah menjadi selesai.')
      return
    }
    setSubmitting(true)
    try {
      const uploaded = files.length ? await uploadEvidenceFiles(files) : []
      await submitFollowUp({
        token,
        deadline,
        action_plan: actionPlan.trim(),
        followup_status: status,
        overdue_reason: overdueReason.trim(),
        evidence: [...existing, ...uploaded],
      })
      setDone(true)
      setRecord((prev) => ({ ...prev, closed: status === 'Closed', followup_status: status }))
    } catch (err) {
      setError(err.message || 'Gagal menyimpan follow-up.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Permintaan CAPA</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Tindakan korektif dan preventif</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tanpa login. Isi tenggat sendiri, status, keterangan, dan foto. Tautan yang sama bisa dibuka lagi sampai pekerjaan selesai. Nama pelapor tidak ditampilkan.
        </p>

        {loading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}
        {!loading && error && !record && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {record && done && (
          <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {record.closed || status === 'Closed' ? 'Laporan ditutup' : 'Tindak lanjut tersimpan'}
            </h2>
            <p className="text-sm text-slate-500">
              {status === 'Closed'
                ? 'HSSE dapat melihat status Closed tanpa menutup laporan secara manual.'
                : 'Status masih On Progress. Buka tautan yang sama saat pekerjaan selesai untuk menutupnya.'}
            </p>
          </div>
        )}

        {record && !done && (
          <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
              <p className="font-mono text-xs text-brand-700">{record.soc_number}</p>
              <p className="mt-1 font-medium">{record.location}</p>
              <p className="mt-1 text-slate-600">{record.description}</p>
              {record.suggestion && (
                <p className="mt-2 text-slate-600">
                  <span className="font-medium">Saran pelapor: </span>
                  {record.suggestion}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {record.category} · risiko {record.risk_level} · {record.department || 'Departemen'} ·{' '}
                {formatJakarta(record.incident_at)}
              </p>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-800">Deadline penyelesaian</span>
              <input required type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-800">Status dan action plan</span>
              <span className="mb-1.5 block text-[11px] text-slate-400">Wajib. Tuliskan tindak lanjut yang direncanakan.</span>
              <select className="input mb-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="On Progress">On Progress</option>
                <option value="Closed">Closed / selesai</option>
              </select>
              <textarea required rows={4} className="input" value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} />
            </label>

            {overdue && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-red-700">Lewat deadline — alasannya</span>
                <textarea required rows={2} className="input" value={overdueReason} onChange={(e) => setOverdueReason(e.target.value)} />
              </label>
            )}

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-800">Bukti foto</span>
              <span className="mb-2 block text-[11px] text-slate-400">
                Wajib saat status diubah menjadi selesai. JPG, PNG, atau WEBP.
              </span>
              {existing.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                  {existing.map((src) => (
                    <img key={src} src={src} alt="" className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600">
                <CameraIcon className="h-4 w-4 text-brand-600" />
                {files.length ? `${files.length} foto baru` : 'Tambah foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files || []))
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Menyimpan…' : status === 'Closed' ? 'Tutup laporan' : 'Simpan On Progress'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
