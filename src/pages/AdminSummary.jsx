import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LivePulse, TradingStatCard } from '../components/admin/TradingStatCard'
import AdminLayout from '../components/AdminLayout'
import { useUser } from '../components/RequireRole'
import { NEGATIVE_CATEGORIES, categoryLabel, isOpenStatus, isUnclassifiedObservation } from '../lib/constants'
import {
  contractorScorecard,
  departmentStats,
  hsePerformanceFromAudits,
  investigationCount,
  monthlyReportCount,
  monthlyTrend,
  sparklineValues,
  topLocations,
  trendDelta,
} from '../lib/analytics'
import ImportHistoricalPanel from '../components/admin/ImportHistoricalPanel'
import PeriodReportPanel from '../components/admin/PeriodReportPanel'
import { avgDaysToClose, countOverdueCapa } from '../lib/export'
import { exportSocFlowchartPdf } from '../lib/pdfFlowchart'
import { canViewHsePerformance } from '../lib/roles'
import { getAllAuditLogs, getAllCapa, getKpiTargets, getObservations } from '../lib/store'
import { useChartTheme } from '../lib/theme'

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
  const user = useUser()
  const chart = useChartTheme()
  const showHsePerf = canViewHsePerformance(user)
  const [observations, setObservations] = useState([])
  const [capaList, setCapaList] = useState([])
  const [kpiTargets, setKpiTargets] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadAll() {
    setLoading(true)
    setError('')
    return Promise.all([
      getObservations(),
      getAllCapa().catch(() => []),
      getKpiTargets(),
      showHsePerf ? getAllAuditLogs({ limit: 500 }).catch(() => []) : Promise.resolve([]),
    ])
      .then(([obs, capa, kpi, audits]) => {
        setObservations(obs)
        setCapaList(capa)
        setKpiTargets(kpi || [])
        setAuditLogs(audits || [])
      })
      .catch((err) => setError(err.message || 'Failed to load data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
  }, [showHsePerf])

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
  const invCount = investigationCount(observations)
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
          tingkat_risiko: isUnclassifiedObservation(o) ? 'Unclassified' : o.tingkat_risiko,
        })),
        'tingkat_risiko',
      ).map(([name, value]) => ({ name, value })),
    [observations],
  )
  const deptStats = useMemo(() => departmentStats(observations).slice(0, 8), [observations])
  const locations = useMemo(() => topLocations(observations, 6), [observations])
  const months = useMemo(() => monthlyTrend(observations), [observations])
  const topMonth = useMemo(() => [...months].sort((a, b) => b.count - a.count)[0], [months])
  const contractors = useMemo(() => contractorScorecard(observations).slice(0, 8), [observations])
  const hsePerf = useMemo(
    () => (showHsePerf ? hsePerformanceFromAudits(observations, auditLogs) : []),
    [showHsePerf, observations, auditLogs],
  )

  const topKategori = byKategori[0]
  const topRisiko = byRisiko.find((r) => r.name !== 'Unclassified') || byRisiko[0]

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
          <h1 className="text-base font-semibold text-slate-100 md:text-lg">HSE Analytics</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportSocFlowchartPdf()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-brand-500 hover:text-brand-400"
          >
            Download Flowchart
          </button>
        </div>
      </div>

      <PeriodReportPanel observations={observations} />

      {loading && <p className="text-sm text-slate-500">Loading data…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="-mx-1 mb-5 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-7">
            <TradingStatCard label="Total" value={total} sparkData={spark} delta={trend.pct} up={trend.up} />
            <TradingStatCard label="Active / Open" value={open} accent="text-brand-400" sparkData={spark} up />
            <TradingStatCard label="Closed" value={closed} accent="text-emerald-400" sparkData={spark} up />
            <TradingStatCard label="HiPo" value={hipo} accent="text-red-400" sparkData={spark} up={false} />
            <TradingStatCard label="High" value={highRisk} accent="text-red-400" sparkData={spark} up={false} />
            <TradingStatCard label="Positive" value={positive} accent="text-emerald-400" sparkData={spark} up />
            <TradingStatCard label="Investigation" value={invCount} accent="text-amber-400" sparkData={spark} up />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Top category"
              value={topKategori?.name || '—'}
              sub={topKategori ? `${topKategori.value} reports` : ''}
              accent="text-slate-100"
            />
            <KpiTile
              label="Top risk"
              value={topRisiko?.name || '—'}
              sub={topRisiko ? `${topRisiko.value} reports` : ''}
              accent="text-slate-100"
            />
            <KpiTile
              label="Peak SOC month"
              value={topMonth?.label || '—'}
              sub={topMonth ? `${topMonth.count} SOC` : ''}
              accent="text-brand-400"
            />
            <KpiTile
              label="Investigation follow-up"
              value={String(invCount)}
              sub={`of ${total} SOC`}
              accent="text-amber-400"
            />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile
              label="Positive ratio"
              value={`${classified.length ? Math.round((positive / classified.length) * 100) : 0}%`}
              sub={`${positive} positive / ${negative} negative`}
              accent="text-emerald-400"
            />
            <KpiTile label="Avg. close" value={avgClose ?? '—'} sub="days" accent="text-slate-100" />
            <KpiTile
              label="CAPA overdue"
              value={overdueCapa}
              sub="overdue"
              accent={overdueCapa > 0 ? 'text-red-400' : 'text-emerald-400'}
            />
          </div>

          {kpiTargets.length > 0 && (
            <ChartPanel title="KPI target vs actual (this month)" className="mb-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kpiTargets
                  .filter((t) => t.metric !== 'hipo_response_hours')
                  .map((target) => {
                    const actual = kpiActuals[target.metric]
                    const isLowerBetter = target.metric === 'avg_close_days'
                    const ok =
                      actual != null &&
                      (isLowerBetter ? actual <= target.target_value : actual >= target.target_value)
                    return (
                      <div key={target.metric} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                          {target.label}
                        </p>
                        <p className="mt-1 font-mono text-lg font-bold text-slate-100">
                          {actual ?? '—'}
                          <span className="text-sm font-normal text-slate-500"> / {target.target_value}</span>
                        </p>
                        <p
                          className={`mt-1 text-xs ${ok ? 'text-emerald-400' : actual != null ? 'text-amber-400' : 'text-slate-600'}`}
                        >
                          {actual == null ? 'No data yet' : ok ? 'On target' : 'Below target'}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </ChartPanel>
          )}

          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Department — total / open / close">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-3">Department</th>
                      <th className="pb-2 pr-3 text-right">Total</th>
                      <th className="pb-2 pr-3 text-right">Open</th>
                      <th className="pb-2 text-right">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptStats.map((d) => (
                      <tr key={d.name} className="border-b border-slate-800/50">
                        <td className="py-2 pr-3 text-slate-300">{d.name}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{d.total}</td>
                        <td className="py-2 pr-3 text-right font-mono text-amber-400">{d.open}</td>
                        <td className="py-2 text-right font-mono text-emerald-400">{d.closed}</td>
                      </tr>
                    ))}
                    {deptStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 text-slate-500">
                          No data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartPanel>

            <ChartPanel title="Top SOC locations">
              <ul className="space-y-3">
                {locations.map((loc) => (
                  <li key={loc.name}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span className="truncate text-slate-400">{loc.name}</span>
                      <span className="shrink-0 font-mono font-medium text-slate-200">{loc.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                        style={{ width: `${total ? (loc.value / total) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
                {locations.length === 0 && <p className="text-sm text-slate-500">No data yet</p>}
              </ul>
            </ChartPanel>
          </div>

          {months.length > 0 && (
            <ChartPanel title="SOC trend by month" className="mb-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months}>
                    <XAxis dataKey="label" tick={{ fill: chart.tickMuted, fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: chart.tick, fontSize: 10 }} axisLine={false} />
                    <Tooltip contentStyle={chart.tooltip} />
                    <Bar dataKey="count" name="SOC" fill="#f37021" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="investigation" name="Investigation" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}

          {showHsePerf && (
            <ChartPanel title="HSE performance (Super Admin)" className="mb-5">
              <p className="mb-3 text-xs text-slate-500">
                HSE account activity from the audit trail — reports touched, closed, and investigated.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-3">Account</th>
                      <th className="pb-2 pr-3 text-right">Actions</th>
                      <th className="pb-2 pr-3 text-right">Reports</th>
                      <th className="pb-2 pr-3 text-right">Closed*</th>
                      <th className="pb-2 text-right">Investigation*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hsePerf.map((row) => (
                      <tr key={row.email} className="border-b border-slate-800/50">
                        <td className="py-2 pr-3 text-slate-300">{row.email}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{row.changes}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{row.touchedReports}</td>
                        <td className="py-2 pr-3 text-right font-mono text-emerald-400">{row.closed}</td>
                        <td className="py-2 text-right font-mono text-amber-400">{row.investigations}</td>
                      </tr>
                    ))}
                    {hsePerf.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-3 text-slate-500">
                          No HSE activity yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-slate-600">* Counted from status-change / audit text.</p>
            </ChartPanel>
          )}

          {contractors.length > 0 && (
            <ChartPanel title="Contractor scorecard" className="mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-3">Company</th>
                      <th className="pb-2 pr-3 text-right">Total</th>
                      <th className="pb-2 pr-3 text-right">HiPo</th>
                      <th className="pb-2 pr-3 text-right">Active</th>
                      <th className="pb-2 text-right">Positive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c) => (
                      <tr key={c.name} className="border-b border-slate-800/50">
                        <td className="py-2 pr-3 text-slate-300">{c.name}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{c.total}</td>
                        <td className={`py-2 pr-3 text-right font-mono ${c.hipo > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {c.hipo}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-amber-400">{c.open}</td>
                        <td className="py-2 text-right font-mono text-emerald-400">{c.positive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartPanel>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Category distribution">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byKategori}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {byKategori.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chart.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel title="Risk level">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRisiko} layout="vertical">
                    <XAxis type="number" tick={{ fill: chart.tick, fontSize: 10 }} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: chart.tickMuted, fontSize: 11 }} axisLine={false} width={48} />
                    <Tooltip contentStyle={chart.tooltip} />
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
          </div>
        </>
      )}

      {!loading && <ImportHistoricalPanel onImported={loadAll} />}
    </AdminLayout>
  )
}

function KpiTile({ label, value, sub, accent }) {
  return (
    <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-xs text-slate-600">{sub}</p>
    </div>
  )
}

function ChartPanel({ title, children, className = '' }) {
  return (
    <div className={`admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  )
}
