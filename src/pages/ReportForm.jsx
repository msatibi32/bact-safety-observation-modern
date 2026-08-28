import { useState } from 'react'
import { CameraIcon, CheckCircleIcon, PinIcon, ShieldIcon } from '../components/Icon'
import { COMPANY_OPTIONS, DEPARTMENT_OPTIONS, KATEGORI_OPTIONS, RISIKO_OPTIONS } from '../lib/constants'
import { addObservation } from '../lib/store'

const RISK_STYLE = {
  Low: {
    idle: 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/60',
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  Medium: {
    idle: 'border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50/60',
    active: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20',
    dot: 'bg-amber-500',
  },
  High: {
    idle: 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/60',
    active: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20',
    dot: 'bg-red-500',
  },
}

const emptyForm = {
  nama_pelapor: '',
  departemen: DEPARTMENT_OPTIONS[0],
  nama_perusahaan: COMPANY_OPTIONS[0],
  nama_perusahaan_lainnya: '',
  tanggal_waktu: new Date().toISOString().slice(0, 16),
  lokasi_teks: '',
  kategori: KATEGORI_OPTIONS[0],
  deskripsi: '',
  tingkat_risiko: 'Low',
  tindakan_langsung: '',
  rekomendasi: '',
}

export default function ReportForm() {
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState([])
  const [gps, setGps] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | loading | done | error
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleGetGps() {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      await addObservation({
        ...form,
        nama_perusahaan:
          form.nama_perusahaan === 'Lainnya' ? form.nama_perusahaan_lainnya : form.nama_perusahaan,
        lokasi_gps: gps,
        foto: photos.map((p) => p.file),
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || 'Gagal mengirim laporan, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReportAnother() {
    setForm({ ...emptyForm, tanggal_waktu: new Date().toISOString().slice(0, 16) })
    setPhotos([])
    setGps(null)
    setGpsStatus('idle')
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 via-white to-white px-6">
        <div className="card flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircleIcon className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Laporan terkirim</h1>
          <p className="text-sm text-slate-500">
            Terima kasih, laporan observasi keselamatan kamu sudah masuk dan akan ditindaklanjuti tim HSE.
          </p>
          <button onClick={handleReportAnother} className="btn-primary mt-2 w-full">
            Buat laporan lain
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white pb-16">
      <div className="mx-auto max-w-xl px-4 pt-10">
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <ShieldIcon className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            BACT · Safety Observation Card
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Laporkan Observasi</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Kondisi tidak aman, tindakan berisiko, near miss, atau observasi positif — laporkan dalam hitungan menit.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="card space-y-6 p-6">
          <Section title="Informasi Pelapor">
            <Field label="Nama pelapor" required>
              <input
                type="text"
                required
                value={form.nama_pelapor}
                onChange={(e) => update('nama_pelapor', e.target.value)}
                className="input"
                placeholder="Nama lengkap"
              />
            </Field>

            <Field label="Departemen" required>
              <select
                value={form.departemen}
                onChange={(e) => update('departemen', e.target.value)}
                className="input"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nama perusahaan (kontraktor/visitor)" required>
              <select
                value={form.nama_perusahaan}
                onChange={(e) => update('nama_perusahaan', e.target.value)}
                className="input"
              >
                {COMPANY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {form.nama_perusahaan === 'Lainnya' && (
                <input
                  type="text"
                  required
                  value={form.nama_perusahaan_lainnya}
                  onChange={(e) => update('nama_perusahaan_lainnya', e.target.value)}
                  className="input mt-2"
                  placeholder="Tulis nama perusahaan"
                />
              )}
            </Field>
          </Section>

          <Section title="Detail Kejadian">
            <Field label="Tanggal & waktu kejadian" required>
              <input
                type="datetime-local"
                required
                value={form.tanggal_waktu}
                onChange={(e) => update('tanggal_waktu', e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Lokasi kejadian" required>
              <input
                type="text"
                required
                value={form.lokasi_teks}
                onChange={(e) => update('lokasi_teks', e.target.value)}
                className="input"
                placeholder="Contoh: Area Tangki 3"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGetGps}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  <PinIcon className="h-3.5 w-3.5" />
                  Ambil lokasi GPS
                </button>
                {gpsStatus === 'loading' && <span className="text-xs text-slate-400">Mengambil lokasi…</span>}
                {gpsStatus === 'done' && gps && (
                  <span className="text-xs text-emerald-600">
                    {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                  </span>
                )}
                {gpsStatus === 'error' && <span className="text-xs text-red-500">Gagal ambil lokasi</span>}
              </div>
            </Field>

            <Field label="Kategori observasi" required>
              <select
                value={form.kategori}
                onChange={(e) => update('kategori', e.target.value)}
                className="input"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Deskripsi kejadian" required>
              <textarea
                required
                rows={4}
                value={form.deskripsi}
                onChange={(e) => update('deskripsi', e.target.value)}
                className="input"
                placeholder="Ceritakan apa yang terjadi..."
              />
            </Field>

            <Field label="Tingkat risiko" required>
              <div className="grid grid-cols-3 gap-2">
                {RISIKO_OPTIONS.map((opt) => {
                  const style = RISK_STYLE[opt]
                  const active = form.tingkat_risiko === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update('tingkat_risiko', opt)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        active ? style.active : style.idle
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                      {opt}
                    </button>
                  )
                })}
              </div>
            </Field>
          </Section>

          <Section title="Bukti & Tindak Lanjut">
            <Field label="Foto bukti">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center transition hover:border-violet-300 hover:bg-violet-50/60">
                <CameraIcon className="h-6 w-6 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Tap untuk ambil / pilih foto</span>
                <span className="text-xs text-slate-400">Bisa lebih dari satu foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                      <img src={p.preview} alt={`Bukti ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Tindakan langsung yang sudah diambil (opsional)">
              <textarea
                rows={2}
                value={form.tindakan_langsung}
                onChange={(e) => update('tindakan_langsung', e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Rekomendasi / saran perbaikan">
              <textarea
                rows={2}
                value={form.rekomendasi}
                onChange={(e) => update('rekomendasi', e.target.value)}
                className="input"
              />
            </Field>
          </Section>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengirim…' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-600">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
