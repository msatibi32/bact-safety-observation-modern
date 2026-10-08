import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { MODULE_SCHEMAS } from '../lib/omniCatalog'
import { useOmniStore } from '../lib/omniStore'

export default function AdminPerforma() {
  const store = useOmniStore()
  const byLocation = countBy(store.incidents, (row) => row.lokasi || 'Tanpa lokasi')
  const byStatus = countBy(store.incidents, (row) => row.status || 'Open')
  const maxLocation = Math.max(1, ...byLocation.map((row) => row.count))
  const moduleRows = Object.entries(MODULE_SCHEMAS)
    .map(([key, schema]) => ({
      key,
      label: schema.label,
      count: store.records.filter((row) => row.module === key).length,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-100">Performa HSE</h1>
        <p className={`text-xs ${store.error ? 'text-amber-300' : 'text-slate-500'}`}>
          {store.error || 'Ringkasan insiden dan isi tiap menu operasional.'}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Insiden per lokasi</h2>
          <div className="mt-3 space-y-2">
            {byLocation.length === 0 && <p className="text-sm text-slate-500">Belum ada insiden.</p>}
            {byLocation.slice(0, 10).map((row) => (
              <div key={row.label} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-xs">
                <span className="truncate text-slate-300">{row.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(row.count / maxLocation) * 100}%` }} />
                </span>
                <span className="text-right text-slate-400">{row.count}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Status penanganan</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {byStatus.length === 0 && <li className="text-slate-500">Belum ada insiden.</li>}
            {byStatus.map((row) => (
              <li key={row.label} className="flex justify-between text-slate-300">
                <span>{row.label}</span>
                <span>
                  {row.count} · {store.incidents.length ? Math.round((row.count / store.incidents.length) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="admin-panel mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Aktivitas per modul</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2 font-medium">Modul</th>
                <th className="px-2 py-2 font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {moduleRows.map((row) => (
                <tr key={row.key} className="border-t border-slate-800">
                  <td className="px-2 py-2">
                    <Link to={`/admin/modul/${row.key}`} className="text-slate-100 hover:text-brand-400">
                      {row.label}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-slate-300">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}

function countBy(rows, pick) {
  const map = new Map()
  rows.forEach((row) => {
    const key = pick(row) || '—'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}
