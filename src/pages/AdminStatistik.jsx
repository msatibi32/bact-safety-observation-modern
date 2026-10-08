import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useOmniStore } from '../lib/omniStore'

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function AdminStatistik() {
  const store = useOmniStore()
  const total = store.incidents.length
  const bySeverity = SEVERITIES.map((label) => ({
    label,
    count: store.incidents.filter((row) => row.severity === label).length,
  }))
  const max = Math.max(1, ...bySeverity.map((row) => row.count))

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Statistik KPI</h1>
          <p className={`text-xs ${store.error ? 'text-amber-300' : 'text-slate-500'}`}>
            {store.error || 'Sebaran severity dari modul Insiden.'}
          </p>
        </div>
        <Link to="/admin/ringkasan" className="text-sm text-brand-400">
          Analitik SOC
        </Link>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {bySeverity.map((row) => (
          <div key={row.label} className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">{row.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{row.count}</p>
          </div>
        ))}
      </div>
      <section className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Perbandingan severity</h2>
        <p className="mb-3 text-xs text-slate-500">{total} insiden tercatat</p>
        <div className="space-y-2">
          {bySeverity.map((row) => (
            <div key={row.label} className="grid grid-cols-[5rem_1fr_2rem] items-center gap-2 text-xs">
              <span className="text-slate-300">{row.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-slate-800">
                <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="text-right text-slate-400">{row.count}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  )
}
