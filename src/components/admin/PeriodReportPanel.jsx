import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { monthlyVolumeCounts, weeklyVolumeCounts } from '../../lib/analytics'
import {
  defaultWeeklyRange,
  exportPeriodReportExcel,
  filterObservationsByRange,
} from '../../lib/export'
import { useChartTheme } from '../../lib/theme'

export default function PeriodReportPanel({ observations }) {
  const chart = useChartTheme()
  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [range, setRange] = useState(defaultWeeklyRange)
  const [message, setMessage] = useState('')

  const weeklyData = useMemo(() => weeklyVolumeCounts(observations), [observations])
  const monthlyData = useMemo(() => monthlyVolumeCounts(observations), [observations])
  const chartData = chartPeriod === 'monthly' ? monthlyData : weeklyData

  const chartTotals = useMemo(
    () =>
      chartData.reduce(
        (acc, d) => ({ reports: acc.reports + d.count, hipo: acc.hipo + d.hipo }),
        { reports: 0, hipo: 0 },
      ),
    [chartData],
  )

  const filtered = useMemo(
    () => filterObservationsByRange(observations, range.from, range.to),
    [observations, range.from, range.to],
  )

  function handleExport() {
    setMessage('')
    if (!range.from || !range.to) {
      setMessage('Choose both From and To dates.')
      return
    }
    if (!filtered.length) {
      setMessage('No reports in this date range.')
      return
    }
    exportPeriodReportExcel(filtered, { from: range.from, to: range.to, period: 'custom' })
  }

  return (
    <>
      <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Period volume</p>
            <p className="text-xs text-slate-500">
              {chartPeriod === 'monthly' ? 'Daily volume — this month' : 'Daily volume — last 7 days'}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">
              <span className="text-slate-200">{chartTotals.reports}</span> reports
              {' · '}
              <span className={chartTotals.hipo > 0 ? 'text-red-400' : 'text-slate-500'}>
                {chartTotals.hipo} HiPo
              </span>
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setChartPeriod('weekly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                chartPeriod === 'weekly' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setChartPeriod('monthly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                chartPeriod === 'monthly' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-44 w-full md:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="periodVolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f37021" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f37021" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="periodHipoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chart.tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: chart.tick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip contentStyle={chart.tooltip} labelStyle={chart.tooltipLabel} />
              <Area
                type="monotone"
                dataKey="count"
                name="Reports"
                stroke="#f37021"
                strokeWidth={2}
                fill="url(#periodVolGrad)"
              />
              <Area
                type="monotone"
                dataKey="hipo"
                name="HiPo"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#periodHipoGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-sm font-semibold text-slate-100">Export Excel</p>
        <p className="mb-3 text-xs text-slate-500">
          Choose a date range, then download the summary + SOC list.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-400">
            From
            <input
              type="date"
              required
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="admin-input mt-1"
            />
          </label>
          <label className="text-xs text-slate-400">
            To
            <input
              type="date"
              required
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="admin-input mt-1"
            />
          </label>
          <p className="pb-2 text-xs text-slate-500">
            {filtered.length} report{filtered.length === 1 ? '' : 's'} in range
          </p>
          <button type="button" onClick={handleExport} className="btn-primary !py-2 text-sm">
            Export Excel
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}
      </div>
    </>
  )
}
