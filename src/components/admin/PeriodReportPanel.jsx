import { useMemo, useState } from 'react'
import {
  defaultMonthlyRange,
  defaultWeeklyRange,
  exportPeriodReportExcel,
  filterObservationsByRange,
} from '../../lib/export'

export default function PeriodReportPanel({ observations }) {
  const [period, setPeriod] = useState('weekly')
  const [range, setRange] = useState(defaultWeeklyRange)
  const [message, setMessage] = useState('')

  const filtered = useMemo(
    () => filterObservationsByRange(observations, range.from, range.to),
    [observations, range.from, range.to],
  )

  function applyPeriod(next) {
    setPeriod(next)
    setMessage('')
    setRange(next === 'monthly' ? defaultMonthlyRange() : defaultWeeklyRange())
  }

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
    exportPeriodReportExcel(filtered, { from: range.from, to: range.to, period })
  }

  return (
    <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-100">Period reports</p>
          <p className="text-xs text-slate-500">
            Filter by observation date, then export Excel (summary + SOC list).
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => applyPeriod('weekly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              period === 'weekly' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Weekly report
          </button>
          <button
            type="button"
            onClick={() => applyPeriod('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              period === 'monthly' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Monthly report
          </button>
        </div>
      </div>
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
  )
}
