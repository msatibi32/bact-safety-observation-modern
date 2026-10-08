import { useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useUser } from '../components/RequireRole'
import { useOmniStore } from '../lib/omniStore'
import { canEditObservations } from '../lib/roles'

const EMPTY = {
  name: '',
  category: 'Near Miss',
  severity: 'Low',
  description: '',
  lokasi: '',
  status: 'Open',
  occurred_at: '',
  pic: '',
  root_cause: '',
  corrective_action: '',
}

const SEVERITY = {
  Low: 'bg-emerald-500/15 text-emerald-300',
  Medium: 'bg-amber-500/15 text-amber-200',
  High: 'bg-orange-500/15 text-orange-200',
  Critical: 'bg-red-500/15 text-red-300',
}

export default function AdminIncidents() {
  const user = useUser()
  const canEdit = canEditObservations(user)
  const store = useOmniStore()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.incidents.filter((row) => {
      if (!q) return true
      return `${row.name} ${row.lokasi} ${row.category}`.toLowerCase().includes(q)
    })
  }, [query, store.incidents])

  function openCreate() {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setEditing(null)
    setForm({ ...EMPTY, occurred_at: now.toISOString().slice(0, 16) })
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    const ok = await store.saveIncident(editing, form)
    if (ok) setForm(null)
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Insiden</h1>
          <p className={`text-xs ${store.error ? 'text-amber-300' : 'text-slate-500'}`}>
            {store.error || `${store.incidents.length} laporan. Modul ini terpisah dari kartu SOC. Tersimpan di database.`}
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
            Lapor insiden
          </button>
        )}
      </div>

      <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama insiden atau lokasi..."
          className="admin-input mb-3 max-w-sm"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2 font-medium">Kejadian</th>
                <th className="px-2 py-2 font-medium">Lokasi</th>
                <th className="px-2 py-2 font-medium">Waktu</th>
                <th className="px-2 py-2 font-medium">Severity</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                    Belum ada insiden tercatat.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className="px-2 py-2.5">
                    <p className="font-medium text-slate-100">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.category}</p>
                  </td>
                  <td className="px-2 py-2.5 text-slate-300">{row.lokasi || '—'}</td>
                  <td className="px-2 py-2.5 text-slate-400">{row.occurred_at ? row.occurred_at.replace('T', ' ') : '—'}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${SEVERITY[row.severity] || ''}`}>{row.severity}</span>
                  </td>
                  <td className="px-2 py-2.5 text-slate-300">{row.status}</td>
                  <td className="px-2 py-2.5 text-xs">
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-slate-300"
                          onClick={() => {
                            setEditing(row.id)
                            setForm({ ...EMPTY, ...row })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-red-400"
                          onClick={() => {
                            if (window.confirm(`Hapus "${row.name}"?`)) store.deleteIncident(row.id)
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={handleSave} className="admin-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">{editing ? 'Edit insiden' : 'Lapor insiden'}</h2>
              <button type="button" onClick={() => setForm(null)} className="text-sm text-slate-400">
                Tutup
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Nama insiden">
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Kategori kejadian">
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="admin-input">
                    {['Near Miss', 'Kecelakaan Kerja', 'Kerusakan Alat', 'Kondisi Tidak Aman'].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tingkat keparahan">
                  <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })} className="admin-input">
                    {['Low', 'Medium', 'High', 'Critical'].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Deskripsi kejadian">
                <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="admin-input" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Lokasi / proyek">
                  <input value={form.lokasi} onChange={(event) => setForm({ ...form, lokasi: event.target.value })} className="admin-input" />
                </Field>
                <Field label="Status investigasi">
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="admin-input">
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Waktu kejadian">
                  <input type="datetime-local" value={form.occurred_at} onChange={(event) => setForm({ ...form, occurred_at: event.target.value })} className="admin-input" />
                </Field>
                <Field label="Petugas investigasi (PIC)">
                  <input value={form.pic} onChange={(event) => setForm({ ...form, pic: event.target.value })} className="admin-input" />
                </Field>
              </div>
              <Field label="Analisis akar penyebab">
                <textarea rows={2} value={form.root_cause} onChange={(event) => setForm({ ...form, root_cause: event.target.value })} className="admin-input" />
              </Field>
              <Field label="Tindakan perbaikan segera">
                <textarea rows={2} value={form.corrective_action} onChange={(event) => setForm({ ...form, corrective_action: event.target.value })} className="admin-input" />
              </Field>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">
              Simpan
            </button>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      {children}
    </label>
  )
}
