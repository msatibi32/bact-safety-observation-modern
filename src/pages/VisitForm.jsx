import { useState } from 'react'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import SiteFooter from '../components/SiteFooter'
import { CameraIcon } from '../components/Icon'
import { validatePhotoFile } from '../lib/limits'
import { passUrl, submitVisitRequest, uploadEvidenceFiles } from '../lib/passes'

const empty = {
  visitor_name: '',
  company: '',
  phone: '',
  purpose: '',
  visit_start: '',
  visit_end: '',
  declaration_accepted: false,
  safety_induction: false,
}

export default function VisitForm() {
  const [form, setForm] = useState(empty)
  const [ktp, setKtp] = useState(null)
  const [passport, setPassport] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [issued, setIssued] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function takeFile(file, setter) {
    setError('')
    if (!file) {
      setter(null)
      return
    }
    const invalid = validatePhotoFile(file)
    if (invalid) {
      setError(invalid)
      return
    }
    setter(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.declaration_accepted || !form.safety_induction) {
      setError('Deklarasi ISPS dan safety briefing wajib dicentang.')
      return
    }
    if (!ktp && !passport) {
      setError('Unggah foto KTP atau paspor.')
      return
    }
    setSubmitting(true)
    try {
      const [ktpUrl] = ktp ? await uploadEvidenceFiles([ktp]) : []
      const [passportUrl] = passport ? await uploadEvidenceFiles([passport]) : []
      const result = await submitVisitRequest({
        ...form,
        ktp_url: ktpUrl || '',
        passport_url: passportUrl || '',
        declaration_accepted: true,
        safety_induction: true,
      })
      setIssued(result)
    } catch (err) {
      setError(err.message || 'Pengajuan gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  if (issued) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
        <PublicModuleNav />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10">
          <PassCard
            url={passUrl('visit', issued.public_token)}
            pass={{
              ref_no: issued.ref_no,
              phase: 'pending',
              type_label: 'Port Visit',
              name: form.visitor_name,
              company: form.company,
              area: `${form.visit_start} – ${form.visit_end}`,
              lifetime_label: 'Berlaku pada tanggal kunjungan yang disetujui',
              route_to: 'Corporate Communication HSSE',
            }}
          />
          <p className="mt-4 max-w-md text-center text-sm text-slate-500">
            Barcode ini menunggu persetujuan Corporate Communication HSSE. Setelah disetujui, scan menampilkan masa berlaku kunjungan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Port Visit</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Permintaan kunjungan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Diteruskan langsung ke Corporate Communication HSSE. Tanpa login.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Penerima pengajuan: <span className="font-medium text-slate-900">Corporate Communication HSSE</span>
          </div>
          <Field label="Nama" hint="Full name">
            <input required className="input" value={form.visitor_name} onChange={(e) => update('visitor_name', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Perusahaan" hint="Company">
              <input required className="input" value={form.company} onChange={(e) => update('company', e.target.value)} />
            </Field>
            <Field label="Telepon" hint="Phone">
              <input required className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FilePick label="KTP softcopy" hint="Foto KTP" file={ktp} onFile={(f) => takeFile(f, setKtp)} />
            <FilePick label="Paspor softcopy" hint="Wajib untuk pengunjung luar negeri" file={passport} onFile={(f) => takeFile(f, setPassport)} />
          </div>
          <Field label="Tujuan" hint="Purpose of visit">
            <textarea required rows={3} className="input" value={form.purpose} onChange={(e) => update('purpose', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mulai kunjungan" hint="Visit start">
              <input required type="date" className="input" value={form.visit_start} onChange={(e) => update('visit_start', e.target.value)} />
            </Field>
            <Field label="Selesai kunjungan" hint="Visit end">
              <input required type="date" className="input" value={form.visit_end} onChange={(e) => update('visit_end', e.target.value)} />
            </Field>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
            <input type="checkbox" className="mt-1" checked={form.declaration_accepted} onChange={(e) => update('declaration_accepted', e.target.checked)} />
            <span className="text-sm text-slate-800">
              <span className="font-medium">Deklarasi safety & security.</span> Saya wajib menaati aturan safety dan ISPS Code di terminal.
              <span className="mt-1 block text-xs text-slate-500">I will comply with terminal safety rules and the ISPS Code.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-3 py-3">
            <input type="checkbox" className="mt-1" checked={form.safety_induction} onChange={(e) => update('safety_induction', e.target.checked)} />
            <span className="text-sm text-slate-800">
              <span className="font-medium">Safety briefing / induction wajib.</span> Saya akan mengikuti safety briefing sebelum masuk area.
              <span className="mt-1 block text-xs text-slate-500">Safety briefing and induction are mandatory.</span>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengirim…' : 'Ajukan kunjungan'}
          </button>
        </form>
        <SiteFooter />
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-800">{label}</span>
      {hint && <span className="mb-1.5 block text-[11px] text-slate-400">{hint}</span>}
      {children}
    </label>
  )
}

function FilePick({ label, hint, file, onFile }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-800">{label}</span>
      <span className="mb-1.5 block text-[11px] text-slate-400">{hint}</span>
      <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600">
        <CameraIcon className="h-4 w-4 text-brand-600" />
        {file ? file.name : 'Pilih foto'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0] || null)
            e.target.value = ''
          }}
        />
      </span>
    </label>
  )
}
