import { useEffect, useState } from 'react'
import { CapaStatusBadge } from './Badge'
import { CAPA_STATUS_OPTIONS, DEPARTMENT_OPTIONS } from '../lib/constants'
import { addCapa, getCapaByObservation, updateCapa } from '../lib/store'

const emptyCapa = { title: '', description: '', owner: 'HSSE', due_date: '' }

/**
 * Tab Rekomendasi: Finding Observation + Recommendation + CAPA (departemen).
 */
export default function RecommendationPanel({
  observationId,
  finding,
  recommendation,
  onFindingChange,
  onRecommendationChange,
  onSaveText,
  saving,
  saved,
  canEdit,
  error,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyCapa)
  const [adding, setAdding] = useState(false)
  const [capaError, setCapaError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setItems(await getCapaByObservation(observationId))
    } catch (err) {
      setCapaError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [observationId])

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    setCapaError('')
    try {
      const created = await addCapa(observationId, form)
      setItems((prev) => [...prev, created])
      setForm(emptyCapa)
    } catch (err) {
      setCapaError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(capa, status) {
    try {
      const updated = await updateCapa(capa.id, observationId, { status })
      setItems((prev) => prev.map((c) => (c.id === capa.id ? updated : c)))
    } catch (err) {
      setCapaError(err.message)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5">
      <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-60">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Finding Observation</span>
          <textarea
            rows={3}
            value={finding}
            onChange={(e) => onFindingChange(e.target.value)}
            className="admin-input"
            placeholder="Temuan observasi yang dikonfirmasi HSE…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Recommendation</span>
          <textarea
            rows={3}
            value={recommendation}
            onChange={(e) => onRecommendationChange(e.target.value)}
            className="admin-input"
            placeholder="Rekomendasi tindak lanjut…"
          />
        </label>
        {(error || capaError) && <p className="text-sm text-red-400">{error || capaError}</p>}
        <button type="button" disabled={saving || !canEdit} onClick={onSaveText} className="btn-primary w-full">
          {saving ? 'Menyimpan…' : saved ? 'Tersimpan ✓' : 'Simpan finding & rekomendasi'}
        </button>
      </fieldset>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-100">CAPA</h3>
        <p className="mb-3 text-xs text-slate-500">Corrective & Preventive Actions — PIC = departemen.</p>

        {loading && <p className="text-sm text-slate-400">Memuat CAPA…</p>}
        {!loading && items.length === 0 && (
          <p className="mb-3 text-sm text-slate-400">Belum ada CAPA.</p>
        )}

        <ul className="mb-4 space-y-3">
          {items.map((capa) => {
            const overdue =
              capa.due_date && capa.due_date < today && capa.status !== 'Completed' && capa.status !== 'Verified'
            return (
              <li
                key={capa.id}
                className={`rounded-xl border p-3 ${overdue ? 'border-red-500/30 bg-red-500/10' : 'border-slate-700 bg-slate-800/50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">{capa.title}</p>
                    <p className="text-xs text-slate-500">Departemen: {capa.owner}</p>
                    {capa.due_date && (
                      <p className={`text-xs ${overdue ? 'font-medium text-red-400' : 'text-slate-400'}`}>
                        Due: {capa.due_date}
                        {overdue ? ' (terlambat)' : ''}
                      </p>
                    )}
                    {capa.description && <p className="mt-1 text-xs text-slate-400">{capa.description}</p>}
                  </div>
                  <CapaStatusBadge status={capa.status} />
                </div>
                <select
                  value={capa.status}
                  onChange={(e) => handleStatusChange(capa, e.target.value)}
                  className="admin-input mt-2 text-xs"
                  disabled={!canEdit}
                >
                  {CAPA_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>

        {canEdit && (
          <form onSubmit={handleAdd} className="space-y-2 rounded-xl border border-dashed border-slate-700 p-3">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="admin-input"
              placeholder="Judul CAPA"
            />
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="admin-input"
              placeholder="Deskripsi"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="admin-input"
              >
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="admin-input"
              />
            </div>
            <button type="submit" disabled={adding} className="btn-primary w-full text-sm">
              {adding ? 'Menambah…' : 'Tambah CAPA'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
