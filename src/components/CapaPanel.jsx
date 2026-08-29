import { useEffect, useState } from 'react'
import { CapaStatusBadge } from './Badge'
import { CAPA_STATUS_OPTIONS, PIC_OPTIONS } from '../lib/constants'
import { addCapa, getCapaByObservation, updateCapa } from '../lib/store'

const emptyCapa = { title: '', description: '', owner: PIC_OPTIONS[0], due_date: '' }

export default function CapaPanel({ observationId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyCapa)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setItems(await getCapaByObservation(observationId))
    } catch (err) {
      setError(err.message)
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
    setError('')
    try {
      const created = await addCapa(observationId, form)
      setItems((prev) => [...prev, created])
      setForm(emptyCapa)
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(capa, status) {
    try {
      const updated = await updateCapa(capa.id, observationId, { status })
      setItems((prev) => prev.map((c) => (c.id === capa.id ? updated : c)))
    } catch (err) {
      setError(err.message)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Corrective & Preventive Actions — setiap laporan bisa punya banyak tindakan.
      </p>

      {loading && <p className="text-sm text-slate-400">Memuat CAPA…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400">Belum ada CAPA. Tambahkan tindakan korektif di bawah.</p>
      )}

      <ul className="space-y-3">
        {items.map((capa) => {
          const overdue =
            capa.due_date && capa.due_date < today && capa.status !== 'Completed' && capa.status !== 'Verified'
          return (
            <li key={capa.id} className={`rounded-xl border p-3 ${overdue ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{capa.title}</p>
                  <p className="text-xs text-slate-500">PIC: {capa.owner}</p>
                  {capa.due_date && (
                    <p className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-slate-400'}`}>
                      Due: {capa.due_date}{overdue ? ' (terlambat)' : ''}
                    </p>
                  )}
                  {capa.description && <p className="mt-1 text-sm text-slate-600">{capa.description}</p>}
                </div>
                <CapaStatusBadge status={capa.status} />
              </div>
              <select
                value={capa.status}
                onChange={(e) => handleStatusChange(capa, e.target.value)}
                className="input mt-2 text-xs"
              >
                {CAPA_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleAdd} className="space-y-2 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Tambah CAPA</p>
        <input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="input"
          placeholder="Judul tindakan (mis. Pasang guard rail)"
        />
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="input"
          placeholder="Deskripsi tindakan"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
            className="input"
          >
            {PIC_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            className="input"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={adding} className="btn-primary w-full text-sm">
          {adding ? 'Menyimpan…' : 'Tambah CAPA'}
        </button>
      </form>
    </div>
  )
}
