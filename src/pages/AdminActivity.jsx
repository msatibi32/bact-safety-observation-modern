import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminLayout from '../components/AdminLayout'
import { LivePulse, Sparkline, TradingStatCard } from '../components/admin/TradingStatCard'
import { useUser } from '../components/RequireRole'
import { hseActionTrend, hseDailyCompletion, hseOfficerTracking } from '../lib/analytics'
import { canViewActivityLog } from '../lib/roles'
import { getActivityLogs, getAllAuditLogs } from '../lib/store'

const SCOPES = [
  { id: 'today', label: 'Hari ini' },
  { id: '7d', label: '7 hari' },
  { id: '30d', label: '30 hari' },
  { id: 'all', label: 'Semua' },
]

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgoIso(n) {
  const d = startOfToday()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function mergeLogs(activity, audits) {
  const merged = [
    ...activity.map((l) => ({ ...l, source: 'activity' })),
    ...audits.map((l) => ({
      id: l.id,
      created_at: l.created_at,
      actor_email: l.actor_email,
      actor_role: '',
      action: l.action,
      details: l.details,
      observation_id: l.observation_id,
      source: 'audit',
    })),
  ]
  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const seen = new Set()
  return merged.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)))
}

function inScope(log, scope) {
  if (scope === 'all') return true
  const t = new Date(log.created_at).getTime()
  if (scope === 'today') return t >= startOfToday().getTime()
  if (scope === '7d') return t >= startOfToday().getTime() - 7 * 86400000
  if (scope === '30d') return t >= startOfToday().getTime() - 30 * 86400000
  return true
}

function tooltipStyle() {
  return { background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }
}

export default function AdminActivity() {
  const user = useUser()
  const allowed = canViewActivityLog(user)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scope, setScope] = useState('30d')
  const [selectedOfficer, setSelectedOfficer] = useState('')

  useEffect(() => {
    if (!allowed) {
      setLoading(false)
      return
    }
    setLoading(true)
    const since = scope === 'all' ? null : daysAgoIso(30)
    Promise.all([
      getActivityLogs({ since, limit: 800 }).catch(() => []),
      getAllAuditLogs({ since, limit: 800 }).catch(() => []),
    ])
      .then(([activity, audits]) => setLogs(mergeLogs(activity, audits)))
      .catch((err) => setError(err.message || 'Gagal memuat log.'))
      .finally(() => setLoading(false))
  }, [allowed, scope])

  const scopedLogs = useMemo(() => logs.filter((log) => inScope(log, scope)), [logs, scope])
  const officers = useMemo(() => hseOfficerTracking(scopedLogs, 14), [scopedLogs])
  const daily = useMemo(() => hseDailyCompletion(logs, 14), [logs])
  const trend = useMemo(() => hseActionTrend(daily), [daily])
  const barData = useMemo(
    () =>
      officers.map((o) => ({
        name: o.name,
        email: o.email,
        Ringan: o.ringan,
        Investigasi: o.investigasi,
      })),
    [officers],
  )

  const totals = useMemo(
    () =>
      officers.reduce(
        (acc, o) => ({
          aksi: acc.aksi + o.aksi,
          ringan: acc.ringan + o.ringan,
          investigasi: acc.investigasi + o.investigasi,
          closed: acc.closed + o.closed,
          touched: acc.touched + o.touched,
        }),
        { aksi: 0, ringan: 0, investigasi: 0, closed: 0, touched: 0 },
      ),
    [officers],
  )

  const listLogs = useMemo(() => {
    if (!selectedOfficer) return scopedLogs
    return scopedLogs.filter((log) => log.actor_email === selectedOfficer)
  }, [scopedLogs, selectedOfficer])

  if (!allowed) {
    return (
      <AdminLayout>
        <p className="text-sm text-amber-400">Hanya Super Admin yang dapat melihat activity log HSE.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LivePulse />
          <div>
            <h1 className="text-base font-semibold text-slate-100 md:text-lg">Activity Log HSE</h1>
            <p className="text-xs text-slate-500">
              Tracking HSE yang aktif menyelesaikan SOC — dari kasus ringan sampai investigasi.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setScope(s.id)
                setSelectedOfficer('')
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                scope === s.id ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Memuat…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="-mx-1 mb-5 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-5">
            <TradingStatCard
              label="Aksi HSE"
              value={totals.aksi}
              sparkData={daily.map((d) => d.aksi)}
              delta={trend.pct}
              up={trend.up}
            />
            <TradingStatCard
              label="HSE aktif"
              value={officers.length}
              accent="text-brand-400"
              sparkData={daily.map((d) => d.aksi)}
              up={officers.length > 0}
            />
            <TradingStatCard
              label="SOC disentuh"
              value={totals.touched}
              accent="text-slate-100"
              sparkData={daily.map((d) => d.aksi)}
              up
            />
            <TradingStatCard
              label="Kasus ringan"
              value={totals.ringan}
              accent="text-emerald-400"
              sparkData={daily.map((d) => d.ringan)}
              up
            />
            <TradingStatCard
              label="Investigasi"
              value={totals.investigasi}
              accent="text-amber-400"
              sparkData={daily.map((d) => d.investigasi)}
              up={totals.investigasi > 0}
            />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Volume aksi — 14 hari
              </p>
              <div className="h-48 w-full md:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="hseAksiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f37021" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#f37021" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hseRinganGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="hseInvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle()} labelStyle={{ color: '#94a3b8' }} />
                    <Area
                      type="monotone"
                      dataKey="aksi"
                      name="Semua aksi"
                      stroke="#f37021"
                      strokeWidth={2}
                      fill="url(#hseAksiGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="ringan"
                      name="Ringan"
                      stroke="#34d399"
                      strokeWidth={1.5}
                      fill="url(#hseRinganGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="investigasi"
                      name="Investigasi"
                      stroke="#fbbf24"
                      strokeWidth={1.5}
                      fill="url(#hseInvGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Siapa yang menyelesaikan — ringan vs investigasi
              </p>
              <div className="h-48 w-full md:h-56">
                {barData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">
                    Belum ada jejak HSE di periode ini.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip contentStyle={tooltipStyle()} />
                      <Bar dataKey="Ringan" stackId="hse" fill="#34d399" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Investigasi" stackId="hse" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {officers.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Per HSE — klik kartu untuk filter log
              </p>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none md:grid md:grid-cols-2 xl:grid-cols-3">
                {officers.map((officer) => {
                  const active = selectedOfficer === officer.email
                  return (
                    <button
                      key={officer.email}
                      type="button"
                      onClick={() => setSelectedOfficer(active ? '' : officer.email)}
                      className={`min-w-[220px] rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">{officer.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{officer.email}</p>
                        </div>
                        <span className="font-mono text-lg font-bold text-slate-100">{officer.aksi}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-emerald-400">
                          Ringan {officer.ringan}
                        </span>
                        <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-amber-400">
                          Investigasi {officer.investigasi}
                        </span>
                        <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">
                          SOC {officer.touched}
                        </span>
                      </div>
                      <div className="pointer-events-none mt-2">
                        <Sparkline
                          data={officer.spark}
                          up={officer.aksi > 0}
                          id={`officer-${officer.email}`}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectedOfficer && (
            <p className="mb-3 text-xs text-slate-400">
              Filter: {selectedOfficer}{' '}
              <button
                type="button"
                onClick={() => setSelectedOfficer('')}
                className="text-brand-400 hover:underline"
              >
                tampilkan semua
              </button>
            </p>
          )}

          {listLogs.length === 0 && (
            <p className="text-sm text-slate-500">
              Belum ada aktivitas{scope === 'today' ? ' hari ini' : ' di periode ini'}.
            </p>
          )}

          <ul className="space-y-2">
            {listLogs.map((log) => (
              <li
                key={`${log.source}-${log.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">{log.action}</p>
                  <time className="font-mono text-[10px] text-slate-500">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </time>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {log.actor_email}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </p>
                {log.details && <p className="mt-1 text-xs text-slate-500">{log.details}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminLayout>
  )
}
