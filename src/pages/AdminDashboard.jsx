import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { HiPoBadge, RiskBadge, StatusBadge } from '../components/Badge'
import ObservationDetailPanel from '../components/ObservationDetailPanel'
import { isOpenStatus } from '../lib/constants'
import { getObservations, updateObservation } from '../lib/store'

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function AdminDashboard() {
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [filterHiPo, setFilterHiPo] = useState(false)

  async function loadObservations() {
    setLoading(true)
    setError('')
    try {
      setObservations(await getObservations())
    } catch (err) {
      setError(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadObservations()
  }, [])

  const selected = observations.find((o) => o.id === selectedId) || null

  const filtered = useMemo(() => {
    let list = observations
    if (filterStatus !== 'Semua') list = list.filter((o) => o.status === filterStatus)
    if (filterHiPo) list = list.filter((o) => o.is_hipo)
    return list
  }, [observations, filterStatus, filterHiPo])

  const openCount = observations.filter((o) => isOpenStatus(o.status)).length
  const hipoCount = observations.filter((o) => o.is_hipo && isOpenStatus(o.status)).length
  const highCount = observations.filter((o) => o.tingkat_risiko === 'High').length
  const reviewCount = observations.filter((o) => o.status === 'Under Review').length

  async function handleSave(id, patch) {
    const prev = observations.find((o) => o.id === id)
    const updated = await updateObservation(id, patch, prev)
    setObservations((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  return (
    <AdminLayout>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total laporan" value={observations.length} accent="text-slate-900" />
        <MiniStat label="Aktif (belum closed)" value={openCount} accent="text-brand-600" />
        <MiniStat label="HiPo aktif" value={hipoCount} accent="text-red-600" />
        <MiniStat label="Under Review" value={reviewCount} accent="text-purple-600" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Daftar Laporan ({filtered.length})</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filterHiPo}
              onChange={(e) => setFilterHiPo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            HiPo saja
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option>Semua</option>
            <option>Open</option>
            <option>Under Review</option>
            <option>In Progress</option>
            <option>Pending Verification</option>
            <option>Closed</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      {highCount > 0 && (
        <p className="mb-3 text-xs text-amber-700">
          {highCount} laporan dengan risiko High — perlu perhatian prioritas.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="card overflow-hidden xl:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat data…</td>
                  </tr>
                )}
                {!loading && filtered.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedId(obs.id)}
                    className={`cursor-pointer transition hover:bg-brand-50/60 ${
                      selectedId === obs.id ? 'bg-brand-50' : ''
                    } ${obs.is_hipo ? 'border-l-2 border-l-red-500' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {initials(obs.nama_pelapor)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            {obs.nama_pelapor}
                            {obs.is_hipo && <HiPoBadge />}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(obs.tanggal_waktu).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{obs.lokasi_teks}</td>
                    <td className="px-4 py-3 text-slate-600">{obs.kategori}</td>
                    <td className="px-4 py-3"><RiskBadge level={obs.tingkat_risiko} /></td>
                    <td className="px-4 py-3"><StatusBadge status={obs.status} /></td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada laporan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2">
          {selected ? (
            <ObservationDetailPanel key={selected.id} observation={selected} onSave={handleSave} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              Pilih laporan untuk detail, investigasi, CAPA & audit trail.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}
