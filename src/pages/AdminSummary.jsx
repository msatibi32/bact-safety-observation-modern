import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LivePulse, TradingStatCard } from '../components/admin/TradingStatCard'
import AdminLayout from '../components/AdminLayout'
import { NEGATIVE_CATEGORIES, categoryLabel, isOpenStatus, isUnclassifiedObservation } from '../lib/constants'
import { contractorScorecard, monthlyReportCount, sparklineValues, trendDelta } from '../lib/analytics'
import { avgDaysToClose, countOverdueCapa, exportObservationsCsv } from '../lib/export'
import { getAllCapa, getKpiTargets, getObservations } from '../lib/store'

const PIE_COLORS = ['#f37021', '#34d399', '#fbbf24', '#ef4444', '#818cf8', '#94a3b8']

function countBy(list, key) {
  const counts = {}
  for (const item of list) {
    const value = item[key] || '—'
    counts[value] = (counts[value] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export default function AdminSummary() {
  const [observations, setObservations] = useState([])
  const [capaList, setCapaList] = useState([])
  const [kpiTargets, setKpiTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getObservations(), getAllCapa().catch(() => []), getKpiTargets()])
      .then(([obs, capa, kpi]) => {
        setObservations(obs)
        setCapaList(capa)
        setKpiTargets(kpi || [])
      })
      .catch((err) => setError(err.message || 'Gagal memuat data.'))
      .finally(() => setLoading(false))
  }, [])

  const total = observations.length
  const closed = observations.filter((o) => o.status === 'Closed').length
  const open = observations.filter((o) => isOpenStatus(o.status)).length
  const classified = observations.filter((o) => !isUnclassifiedObservation(o))
  const hipo = observations.filter((o) => o.is_hipo).length
  const highRisk = classified.filter((o) => o.tingkat_risiko === 'High').length
  const positive = classified.filter((o) => o.kategori === 'Positive Observation').length
  const negative = classified.filter((o) => NEGATIVE_CATEGORIES.includes(o.kategori)).length
  const avgClose = avgDaysToClose(observations)
  const overdueCapa = countOverdueCapa(capaList)
  const trend = useMemo(() => trendDelta(observations), [observations])
  const spark = useMemo(() => sparklineValues(observations, 7), [observations])

  const byKategori = useMemo(
    () =>
      countBy(
        observations.map((o) => ({ ...o, kategori: categoryLabel(o.kategori) })),
        'kategori',
      ).map(([name, value]) => ({ name, value })),
    [observations],
  )
  const byRisiko = useMemo(
    () =>
      countBy(
        observations.map((o) => ({
          tingkat_risiko: isUnclassifiedObservation(o) ? 'Belum diklasifikasi' : o.tingkat_risiko,
        })),
        'tingkat_risiko',
      ).map(([name, value]) => ({ name, value })),
    [observations],
  )
  const byDepartemen = useMemo(() => countBy(observations, 'departemen').slice(0, 6), [observations])
  const contractors = useMemo(() => contractorScorecard(observations).slice(0, 8), [observations])

  const kpiActuals = useMemo(() => {
    const monthly = monthlyReportCount(observations)
    const posRatio = classified.length ? Math.round((positive / classified.length) * 100) : 0
    const avgDays = avgClose ? parseFloat(avgClose) : null
    return {
      monthly_reports: monthly,
      positive_ratio: posRatio,
      avg_close_days: avgDays,
    }
  }, [observations, classified.length, positive, avgClose])

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LivePulse />
          <h1 className="text-base font-semibold text-slate-100 md:text-lg">Analitik HSE</h1>
        </div>
        <button
          type="button"
          onClick={() => exportObservationsCsv(observations)}
          disabled={!observations.length}
          className="btn-primary text-sm"
        >
          Export CSV
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Memuat data…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="-mx-1 mb-5 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-6">
            <TradingStatCard label="Total" value={total} sparkData={spark} delta={trend.pct} up={trend.up} />
            <TradingStatCard label="Aktif" value={open} accent="text-brand-400" sparkData={spark} up />
            <TradingStatCard label="Closed" value={closed} accent="text-emerald-400" sparkData={spark} up />
            <TradingStatCard label="HiPo" value={hipo} accent="text-red-400" sparkData={spark} up={false} />
            <TradingStatCard label="High" value={highRisk} accent="text-red-400" sparkData={spark} up={false} />
            <TradingStatCard label="Positif" value={positive} accent="text-emerald-400" sparkData={spark} up />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile label="Rasio Positif" value={`${classified.length ? Math.round((positive / classified.length) * 100) : 0}%`} sub={`${positive} positif / ${negative} negatif (sudah diklasifikasi)`} accent="text-emerald-400" />
            <KpiTile label="Avg. Tutup" value={avgClose ?? '—'} sub="hari" accent="text-slate-100" />
            <KpiTile label="CAPA Overdue" value={overdueCapa} sub="terlambat" accent={overdueCapa > 0 ? 'text-red-400' : 'text-emerald-400'} />
          </div>

          {kpiTargets.length > 0 && (
            <ChartPanel title="Target KPI vs Aktual (Bulan Ini)" className="mb-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kpiTargets
                  .filter((t) => t.metric !== 'hipo_response_hours')
                  .map((target) => {
                    const actual = kpiActuals[target.metric]
                    const isLowerBetter = target.metric === 'avg_close_days'
                    const ok = actual != null && (isLowerBetter ? actual <= target.target_value : actual >= target.target_value)
                    return (
                      <div key={target.metric} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{target.label}</p>
                        <p className="mt-1 font-mono text-lg font-bold text-slate-100">
                          {actual ?? '—'}
                          <span className="text-sm font-normal text-slate-500"> / {target.target_value}</span>
                        </p>
                        <p className={`mt-1 text-xs ${ok ? 'text-emerald-400' : actual != null ? 'text-amber-400' : 'text-slate-600'}`}>
                          {actual == null ? 'Belum ada data' : ok ? 'On target' : 'Di bawah target'}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </ChartPanel>
          )}

          {contractors.length > 0 && (
            <ChartPanel title="Scorecard Kontraktor" className="mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-3">Perusahaan</th>
                      <th className="pb-2 pr-3 text-right">Total</th>
                      <th className="pb-2 pr-3 text-right">HiPo</th>
                      <th className="pb-2 pr-3 text-right">Aktif</th>
                      <th className="pb-2 text-right">Positif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c) => (
                      <tr key={c.name} className="border-b border-slate-800/50">
                        <td className="py-2 pr-3 text-slate-300">{c.name}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{c.total}</td>
                        <td className={`py-2 pr-3 text-right font-mono ${c.hipo > 0 ? 'text-red-400' : 'text-slate-500'}`}>{c.hipo}</td>
                        <td className="py-2 pr-3 text-right font-mono text-amber-400">{c.open}</td>
                        <td className="py-2 text-right font-mono text-emerald-400">{c.positive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartPanel>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Distribusi Kategori">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byKategori} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {byKategori.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel title="Tingkat Risiko">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRisiko} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={48} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {byRisiko.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === 'High'
                              ? '#ef4444'
                              : entry.name === 'Medium'
                                ? '#fbbf24'
                                : entry.name === 'Low'
                                  ? '#34d399'
                                  : '#64748b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel title="Top Departemen" className="lg:col-span-2">
              <ul className="space-y-3">
                {byDepartemen.map(([label, count]) => (
                  <li key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate text-slate-400">{label}</span>
                      <span className="font-mono font-medium text-slate-200">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                        style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </ChartPanel>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function KpiTile({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-xs text-slate-600">{sub}</p>
    </div>
  )
}

function ChartPanel({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}
