import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { NEGATIVE_CATEGORIES, isOpenStatus } from '../lib/constants'
import { avgDaysToClose, countOverdueCapa, exportObservationsCsv } from '../lib/export'
import { getAllCapa, getObservations } from '../lib/store'

const RISK_BAR = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-red-500',
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getObservations(), getAllCapa().catch(() => [])])
      .then(([obs, capa]) => {
        setObservations(obs)
        setCapaList(capa)
      })
      .catch((err) => setError(err.message || 'Gagal memuat data.'))
      .finally(() => setLoading(false))
  }, [])

  const total = observations.length
  const closed = observations.filter((o) => o.status === 'Closed').length
  const open = observations.filter((o) => isOpenStatus(o.status)).length
  const hipo = observations.filter((o) => o.is_hipo).length
  const highRisk = observations.filter((o) => o.tingkat_risiko === 'High').length
  const positive = observations.filter((o) => o.kategori === 'Positive Observation').length
  const negative = observations.filter((o) => NEGATIVE_CATEGORIES.includes(o.kategori)).length
  const avgClose = avgDaysToClose(observations)
  const overdueCapa = countOverdueCapa(capaList)

  const byRisiko = useMemo(() => countBy(observations, 'tingkat_risiko'), [observations])
  const byStatus = useMemo(() => countBy(observations, 'status'), [observations])
  const byKategori = useMemo(() => countBy(observations, 'kategori'), [observations])
  const byDepartemen = useMemo(() => countBy(observations, 'departemen'), [observations])
  const byPerusahaan = useMemo(() => countBy(observations, 'nama_perusahaan'), [observations])
  const byLokasi = useMemo(() => countBy(observations, 'lokasi_teks'), [observations])
  const byLsr = useMemo(() => countBy(observations.filter((o) => o.life_saving_rule !== 'Tidak terkait'), 'life_saving_rule'), [observations])

  const rekomendasiList = useMemo(
    () =>
      observations
        .filter((o) => o.rekomendasi?.trim())
        .map((o) => ({ id: o.id, teks: o.rekomendasi, lokasi: o.lokasi_teks })),
    [observations],
  )

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Ringkasan & Analitik HSE</h1>
        <button
          type="button"
          onClick={() => exportObservationsCsv(observations)}
          disabled={!observations.length}
          className="btn-primary text-sm"
        >
          Export CSV
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Memuat data…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total" value={total} accent="text-slate-900" chip="bg-slate-100" />
            <StatCard label="Aktif" value={open} accent="text-brand-600" chip="bg-brand-100" />
            <StatCard label="Closed" value={closed} accent="text-slate-500" chip="bg-slate-100" />
            <StatCard label="HiPo" value={hipo} accent="text-red-600" chip="bg-red-100" />
            <StatCard label="High Risk" value={highRisk} accent="text-red-600" chip="bg-red-100" />
            <StatCard label="Positif" value={positive} accent="text-emerald-600" chip="bg-emerald-100" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500">Leading: rasio positif</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {total ? Math.round((positive / total) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400">{positive} positif / {negative} negatif</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500">Lagging: rata-rata hari tutup</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{avgClose ?? '—'}</p>
              <p className="text-xs text-slate-400">hari (laporan closed)</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500">CAPA terlambat</p>
              <p className={`mt-1 text-2xl font-bold ${overdueCapa > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {overdueCapa}
              </p>
              <p className="text-xs text-slate-400">melewati due date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BreakdownCard title="Status Workflow" data={byStatus} total={total} />
            <BreakdownCard title="Kategori Observasi" data={byKategori} total={total} />
            <BreakdownCard title="Tingkat Risiko" data={byRisiko} total={total} colorMap={RISK_BAR} />
            <BreakdownCard title="Life Saving Rules" data={byLsr} total={total || 1} />
            <BreakdownCard title="Departemen Pelapor" data={byDepartemen} total={total} />
            <BreakdownCard title="Perusahaan / Kontraktor" data={byPerusahaan} total={total} />
            <BreakdownCard title="Lokasi Kejadian" data={byLokasi} total={total} />

            <div className="card p-4 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Rekomendasi dari Lapangan</h2>
              {rekomendasiList.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada rekomendasi.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {rekomendasiList.map((r) => (
                    <li key={r.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-sm text-slate-700">{r.teks}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{r.lokasi}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function StatCard({ label, value, accent = 'text-slate-900', chip }) {
  return (
    <div className="card p-4">
      <span className={`inline-block rounded-lg ${chip} px-2 py-1 text-xs font-medium text-slate-500`}>{label}</span>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function BreakdownCard({ title, data, total, colorMap }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada data.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map(([label, count]) => (
            <li key={label} className="text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-slate-600">{label}</span>
                <span className="shrink-0 font-medium text-slate-900">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${colorMap?.[label] ?? 'bg-gradient-to-r from-brand-500 to-brand-600'}`}
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
