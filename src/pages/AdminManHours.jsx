import { useMemo } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useOmniStore } from '../lib/omniStore'

export default function AdminManHours() {
  const store = useOmniStore()
  const summary = useMemo(() => summarize(store.records, store.incidents), [store.records, store.incidents])

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-100">Safety Man Hours</h1>
        <p className={`text-xs ${store.error ? 'text-amber-300' : 'text-slate-500'}`}>
          {store.error || 'Diambil dari catatan Man Power dan insiden kecelakaan kerja.'}
        </p>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total man hours" value={summary.hours} />
        <Stat label="Hari tanpa kecelakaan" value={summary.streak} />
        <Stat label="Entri man power" value={summary.entries} />
        <Stat label="Kecelakaan kerja" value={summary.lti} />
      </div>
      <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Rekap per proyek</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2 font-medium">Proyek</th>
                <th className="px-2 py-2 font-medium">Hari tercatat</th>
                <th className="px-2 py-2 font-medium">Man hours</th>
              </tr>
            </thead>
            <tbody>
              {summary.projects.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2 py-8 text-center text-slate-500">
                    Belum ada catatan Man Power.
                  </td>
                </tr>
              )}
              {summary.projects.map((row) => (
                <tr key={row.name} className="border-t border-slate-800">
                  <td className="px-2 py-2.5 text-slate-100">{row.name}</td>
                  <td className="px-2 py-2.5 text-slate-300">{row.days}</td>
                  <td className="px-2 py-2.5 text-slate-300">{row.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="admin-panel rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function summarize(records, incidents) {
  const manpower = records.filter((row) => row.module === 'manpower')
  const byProject = new Map()
  let hours = 0
  manpower.forEach((row) => {
    const people = Number(row.data?.jumlah_pekerja) || 0
    const jam = Number(row.data?.jam_kerja_per_hari) || 8
    const chunk = people * jam
    hours += chunk
    const name = String(row.data?.lokasi_proyek || 'Tanpa proyek').trim() || 'Tanpa proyek'
    const current = byProject.get(name) || { name, days: 0, hours: 0 }
    current.days += 1
    current.hours += chunk
    byProject.set(name, current)
  })
  const lti = incidents.filter((row) => row.category === 'Kecelakaan Kerja')
  const latest = lti
    .map((row) => row.occurred_at)
    .filter(Boolean)
    .sort()
    .at(-1)
  const streak = latest ? Math.max(0, Math.floor((Date.now() - new Date(latest).getTime()) / 86400000)) : manpower.length ? '—' : 0
  return {
    hours,
    entries: manpower.length,
    lti: lti.length,
    streak: latest ? streak : manpower.length ? 'Belum ada LTI' : 0,
    projects: [...byProject.values()].sort((a, b) => b.hours - a.hours),
  }
}
