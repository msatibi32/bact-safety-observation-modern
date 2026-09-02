import { useEffect, useState } from 'react'
import BrandHeader from '../components/BrandHeader'
import EmployeeNameField from '../components/EmployeeNameField'
import { CameraIcon, CheckCircleIcon, PinIcon } from '../components/Icon'
import { COMPANY_OPTIONS, DEPARTMENT_OPTIONS } from '../lib/constants'
import { isBactCompany } from '../lib/employees'
import { addObservation } from '../lib/store'
import { flushOfflineQueue, isOnline, saveOfflineReport } from '../lib/offlineQueue'

const emptyForm = {
  nama_pelapor: '',
  departemen: '',
  employee_id: '',
  nama_perusahaan: COMPANY_OPTIONS[0],
  nama_perusahaan_lainnya: '',
  tanggal_waktu: new Date().toISOString().slice(0, 16),
  lokasi_teks: '',
  deskripsi: '',
  stop_work: false,
}

export default function ReportForm() {
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState([])
  const [gps, setGps] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | loading | done | error
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [offlineQueued, setOfflineQueued] = useState(false)

  const bactEmployee = isBactCompany(form.nama_perusahaan)

  useEffect(() => {
    function sync() {
      flushOfflineQueue(addObservation).catch(() => {})
    }
    sync()
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCompanyChange(value) {
    setForm((prev) => ({
      ...prev,
      nama_perusahaan: value,
      nama_pelapor: '',
      employee_id: '',
      departemen: '',
      nama_perusahaan_lainnya: value === 'Lainnya' ? prev.nama_perusahaan_lainnya : '',
    }))
  }

  function handleSelectEmployee(emp) {
    setForm((prev) => ({
      ...prev,
      nama_pelapor: emp.name,
      departemen: emp.departemen,
      employee_id: emp.id,
    }))
  }

  function handleChangeEmployeeName(value) {
    setForm((prev) => ({
      ...prev,
      nama_pelapor: value,
      employee_id: '',
    }))
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
      const payload = {
        ...form,
        nama_perusahaan:
          form.nama_perusahaan === 'Lainnya' ? form.nama_perusahaan_lainnya : form.nama_perusahaan,
        lokasi_gps: gps,
        foto: photos.map((p) => p.file),
        is_anonymous: false,
        is_hipo: form.stop_work,
      }

      if (!isOnline()) {
        saveOfflineReport({ ...payload, foto: [] })
        setOfflineQueued(true)
        setSubmitted(true)
        return
      }

      await addObservation(payload)
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
    setOfflineQueued(false)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 via-white to-white px-6">
        <div className="card flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircleIcon className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Laporan terkirim</h1>
          <p className="text-sm text-slate-500">
            {offlineQueued
              ? 'Laporan disimpan offline. Akan terkirim otomatis saat koneksi kembali (buka app lagi).'
              : 'Terima kasih, laporan observasi keselamatan kamu sudah masuk dan akan ditindaklanjuti tim HSE.'}
          </p>
          <button onClick={handleReportAnother} className="btn-primary mt-2 w-full">
            Buat laporan lain
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white pb-16">
      <div className="mx-auto max-w-xl px-4 pt-10">
        <BrandHeader
          className="mb-6"
          title="Laporkan Observasi"
          subtitle="Laporkan kondisi atau tindakan tidak aman di lapangan dalam hitungan menit."
        />

        <form onSubmit={handleSubmit} className="card space-y-6 p-6">
          <Section title="Informasi Pelapor">
            <Field label="Nama perusahaan" required>
              <select
                value={form.nama_perusahaan}
                onChange={(e) => handleCompanyChange(e.target.value)}
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

            <Field
              label="Nama pelapor"
              required
              hint={
                bactEmployee
                  ? 'Ketik nama, lalu pilih dari daftar karyawan BACT. Departemen dan ID terisi otomatis.'
                  : 'Isi nama lengkap secara manual (vendor / kontraktor / visitor).'
              }
            >
              {bactEmployee ? (
                <EmployeeNameField
                  name={form.nama_pelapor}
                  employeeId={form.employee_id}
                  onSelectEmployee={handleSelectEmployee}
                  onChangeName={handleChangeEmployeeName}
                />
              ) : (
                <input
                  type="text"
                  required
                  value={form.nama_pelapor}
                  onChange={(e) => update('nama_pelapor', e.target.value)}
                  className="input"
                  placeholder="Nama lengkap"
                />
              )}
            </Field>

            <Field label="Departemen" required>
              {bactEmployee && form.employee_id ? (
                <input type="text" readOnly value={form.departemen} className="input bg-slate-50 text-slate-700" />
              ) : bactEmployee ? (
                <select
                  required
                  value={form.departemen}
                  onChange={(e) => update('departemen', e.target.value)}
                  className="input"
                >
                  <option value="" disabled>
                    Pilih departemen
                  </option>
                  {DEPARTMENT_OPTIONS.filter((opt) => opt !== 'CONTRACTOR/ TEMPORARY WORKER/ VISITOR').map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={form.departemen}
                  onChange={(e) => update('departemen', e.target.value)}
                  className="input"
                  placeholder="Contoh: Security, Driver, Tally"
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
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

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={form.stop_work}
                onChange={(e) => update('stop_work', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-900">Stop Work / pekerjaan dihentikan</span>
                <p className="text-xs text-slate-500">Centang jika pekerjaan di area tersebut sudah dihentikan sementara.</p>
              </div>
            </label>

            {form.stop_work && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <strong>High Potential (HiPo)</strong> — laporan ini akan diprioritaskan dan ditinjau HSE segera.
              </div>
            )}
          </Section>

          <Section title="Bukti">
            <Field label="Foto bukti">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/60">
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
      <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
