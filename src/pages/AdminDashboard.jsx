import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ActivityFeed from '../components/admin/ActivityFeed'
import AdminNotifications from '../components/admin/AdminNotifications'
import NotificationRecipientsPanel from '../components/admin/NotificationRecipientsPanel'
import ReportCard from '../components/admin/ReportCard'
import { LivePulse, TradingStatCard } from '../components/admin/TradingStatCard'
import AdminLayout from '../components/AdminLayout'
import { RiskBadge, StatusBadge, HiPoBadge } from '../components/Badge'
import ObservationDetailPanel from '../components/ObservationDetailPanel'
import { dailyReportCounts, overdueEscalations, sparklineValues, trendDelta } from '../lib/analytics'
import { isOpenStatus } from '../lib/constants'
import { filterObservationsForRole } from '../lib/roles'
import { useUser } from '../components/RequireRole'
import { getObservations, getPendingNotifications, updateObservation } from '../lib/store'

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

export default function AdminDashboard() {
  const user = useUser()
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [filterHiPo, setFilterHiPo] = useState(false)
  const [notifications, setNotifications] = useState([])

  async function loadObservations() {
    setLoading(true)
    setError('')
    try {
      const [obs, queue] = await Promise.all([getObservations(), getPendingNotifications()])
      setObservations(obs)
      setNotifications(queue)
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
  const trend = useMemo(() => trendDelta(observations), [observations])
  const chartData = useMemo(() => dailyReportCounts(observations, 14), [observations])
  const spark = useMemo(() => sparklineValues(observations, 7), [observations])

  const roleFiltered = useMemo(
    () => filterObservationsForRole(observations, user),
    [observations, user],
  )

  const filtered = useMemo(() => {
    let list = roleFiltered
    if (filterStatus !== 'Semua') list = list.filter((o) => o.status === filterStatus)
    if (filterHiPo) list = list.filter((o) => o.is_hipo)
    return list
  }, [roleFiltered, filterStatus, filterHiPo])

  const escalations = useMemo(() => overdueEscalations(roleFiltered), [roleFiltered])

  const recentFeed = useMemo(
    () => [...observations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [observations],
  )

  const openCount = observations.filter((o) => isOpenStatus(o.status)).length
  const hipoCount = observations.filter((o) => o.is_hipo && isOpenStatus(o.status)).length
  const highCount = observations.filter((o) => o.tingkat_risiko === 'High').length
  const closedCount = observations.filter((o) => o.status === 'Closed').length

  async function handleSave(id, patch) {
    const prev = observations.find((o) => o.id === id)
    const updated = await updateObservation(id, patch, prev)
    setObservations((p) => p.map((o) => (o.id === id ? updated : o)))
  }

  return (
    <AdminLayout>
      {/* Trading header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LivePulse />
          <h1 className="text-base font-semibold text-slate-100 md:text-lg">Live Traffic</h1>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <AdminNotifications
        observations={roleFiltered}
        queueItems={notifications}
        onSelect={setSelectedId}
      />

      <div className="mb-5">
        <NotificationRecipientsPanel variant="compact" />
      </div>

      {escalations.length > 0 && (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-red-300">
            Eskalasi: {escalations.length} HiPo melewati deadline 24 jam
          </p>
          <p className="mt-1 text-xs text-red-400/80">Segera tindak lanjuti atau eskalasi ke supervisor.</p>
        </div>
      )}

      <div className="-mx-1 mb-5 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible">
        <TradingStatCard label="Total" value={observations.length} sparkData={spark} delta={trend.pct} up={trend.up} />
        <TradingStatCard label="Aktif" value={openCount} accent="text-brand-400" sparkData={spark} up={openCount > 0} />
        <TradingStatCard label="HiPo" value={hipoCount} accent="text-red-400" up={false} sparkData={spark} />
        <TradingStatCard label="Closed" value={closedCount} accent="text-emerald-400" up sparkData={spark} />
      </div>

      {/* Main chart */}
      <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Volume Laporan — 14 Hari</p>
        <div className="h-44 w-full md:h-52">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Memuat chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f37021" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f37021" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hipoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="count" name="Laporan" stroke="#f37021" strokeWidth={2} fill="url(#volGrad)" />
                <Area type="monotone" dataKey="hipo" name="HiPo" stroke="#ef4444" strokeWidth={1.5} fill="url(#hipoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Aktivitas Terbaru</p>
          <ActivityFeed items={recentFeed} onSelect={setSelectedId} />
        </div>

        <div className="admin-panel hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 lg:block">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Filter Laporan</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filterStatus === 'Semua'} onClick={() => setFilterStatus('Semua')}>Semua</FilterChip>
            <FilterChip active={filterHiPo} onClick={() => setFilterHiPo((v) => !v)}>HiPo</FilterChip>
            {['Open', 'Under Review', 'In Progress', 'Closed'].map((s) => (
              <FilterChip key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)}>{s}</FilterChip>
            ))}
          </div>
          {highCount > 0 && (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {highCount} laporan risiko High membutuhkan perhatian segera.
            </p>
          )}
        </div>
      </div>

      {/* Mobile filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-input flex-1 text-sm">
          <option>Semua</option>
          <option>Open</option>
          <option>Under Review</option>
          <option>In Progress</option>
          <option>Pending Verification</option>
          <option>Closed</option>
          <option>Rejected</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-400">
          <input type="checkbox" checked={filterHiPo} onChange={(e) => setFilterHiPo(e.target.checked)} className="rounded" />
          HiPo
        </label>
      </div>

      <p className="mb-3 text-sm font-medium text-slate-300">
        Daftar Laporan <span className="font-mono text-brand-400">({filtered.length})</span>
      </p>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {loading && <p className="text-center text-sm text-slate-500">Memuat…</p>}
        {!loading && filtered.map((obs) => (
          <ReportCard key={obs.id} obs={obs} selected={selectedId === obs.id} onClick={() => setSelectedId(obs.id)} />
        ))}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Belum ada laporan.</p>
        )}
      </div>

      {/* Desktop: table + side panel */}
      <div className="hidden gap-4 md:grid md:grid-cols-5">
        <div className="admin-panel col-span-3 overflow-hidden rounded-2xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {!loading && filtered.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedId(obs.id)}
                    className={`cursor-pointer transition hover:bg-slate-800/50 ${
                      selectedId === obs.id ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs text-brand-400">
                          {initials(obs.nama_pelapor)}
                        </span>
                        <div>
                          <div className="flex items-center gap-1 font-medium text-slate-200">
                            {obs.nama_pelapor}
                            {obs.is_hipo && <HiPoBadge />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{obs.lokasi_teks}</td>
                    <td className="px-4 py-3 text-slate-400">{obs.kategori}</td>
                    <td className="px-4 py-3"><RiskBadge level={obs.tingkat_risiko} /></td>
                    <td className="px-4 py-3"><StatusBadge status={obs.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-2">
          {selected ? (
            <ObservationDetailPanel observation={selected} onSave={handleSave} />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
              Pilih laporan untuk detail & follow-up.
            </div>
          )}
        </div>
      </div>

      {/* Mobile fullscreen detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 md:hidden">
          <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200"
            >
              ← Kembali
            </button>
            <span className="truncate text-sm font-semibold text-slate-100">{selected.nama_pelapor}</span>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ObservationDetailPanel observation={selected} onSave={handleSave} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
