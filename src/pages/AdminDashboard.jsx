import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { RiskBadge, StatusBadge } from '../components/Badge'
import { BuildingIcon, PinIcon } from '../components/Icon'
import { PIC_OPTIONS, STATUS_OPTIONS } from '../lib/constants'
import { getObservations, updateObservation } from '../lib/store'

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function AdminDashboard() {
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('Semua')

  async function loadObservations() {
    setLoading(true)
    setError('')
    try {
      setObservations(await getObservations())
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

  const filtered =
    filterStatus === 'Semua' ? observations : observations.filter((o) => o.status === filterStatus)

  const openCount = observations.filter((o) => o.status === 'Open').length
  const highCount = observations.filter((o) => o.tingkat_risiko === 'High').length

  async function handleSave(id, patch) {
    const updated = await updateObservation(id, patch)
    setObservations((prev) => prev.map((o) => (o.id === id ? updated : o)))
  }

  return (
    <AdminLayout>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <MiniStat label="Total laporan" value={observations.length} accent="text-slate-900" />
        <MiniStat label="Perlu ditindak (Open)" value={openCount} accent="text-violet-600" />
        <MiniStat label="Risiko tinggi" value={highCount} accent="text-red-600" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Daftar Laporan ({filtered.length})</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input w-auto"
        >
          <option>Semua</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card overflow-hidden lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedId(obs.id)}
                    className={`cursor-pointer transition hover:bg-violet-50/60 ${
                      selectedId === obs.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                          {initials(obs.nama_pelapor)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{obs.nama_pelapor}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(obs.tanggal_waktu).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{obs.lokasi_teks}</td>
                    <td className="px-4 py-3 text-slate-600">{obs.kategori}</td>
                    <td className="px-4 py-3">
                      <RiskBadge level={obs.tingkat_risiko} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={obs.status} />
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Belum ada laporan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <DetailPanel key={selected.id} observation={selected} onSave={handleSave} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
              Pilih salah satu laporan untuk lihat detail & follow-up.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function DetailPanel({ observation, onSave }) {
  const [pic, setPic] = useState(observation.pic_assigned || '')
  const [status, setStatus] = useState(observation.status)
  const [catatan, setCatatan] = useState(observation.catatan_penutupan || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(observation.id, { pic_assigned: pic, status, catatan_penutupan: catatan })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">{observation.nama_pelapor}</h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <BuildingIcon className="h-3.5 w-3.5" />
            {observation.departemen}
            {observation.nama_perusahaan ? ` · ${observation.nama_perusahaan}` : ''}
          </div>
        </div>
        <RiskBadge level={observation.tingkat_risiko} />
      </div>

      <dl className="space-y-2.5 text-sm">
        <DetailRow icon={<PinIcon className="h-3.5 w-3.5" />} label="Lokasi" value={observation.lokasi_teks} />
        {observation.lokasi_gps && (
          <DetailRow
            label="Koordinat GPS"
            value={`${observation.lokasi_gps.lat.toFixed(5)}, ${observation.lokasi_gps.lng.toFixed(5)}`}
          />
        )}
        <DetailRow label="Kategori" value={observation.kategori} />
        <DetailRow label="Deskripsi" value={observation.deskripsi} />
        {observation.tindakan_langsung && (
          <DetailRow label="Tindakan langsung" value={observation.tindakan_langsung} />
        )}
        {observation.rekomendasi && <DetailRow label="Rekomendasi" value={observation.rekomendasi} />}
      </dl>

      {observation.foto?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {observation.foto.map((src, i) => (
            <img key={i} src={src} alt={`Bukti ${i + 1}`} className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-700">PIC / Departemen follow-up</span>
          <select value={pic} onChange={(e) => setPic(e.target.value)} className="input">
            <option value="">— Belum di-assign —</option>
            {PIC_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-700">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {status === 'Closed' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Catatan penutupan</span>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="input"
              placeholder="Tindakan yang sudah dilakukan..."
            />
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Menyimpan…' : saved ? 'Tersimpan ✓' : 'Simpan perubahan'}
        </button>
      </form>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  )
}
