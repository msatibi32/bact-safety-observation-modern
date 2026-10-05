import { useState } from 'react'
import { Link } from 'react-router-dom'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import SiteFooter from '../components/SiteFooter'
import { DEPARTMENT_OPTIONS, LOCATION_OPTIONS } from '../lib/constants'
import { passUrl, PERMIT_KINDS, submitWorkPermit, WORK_TYPES } from '../lib/passes'

const empty = {
  applicant_name: '',
  company: '',
  email: '',
  phone: '',
  department: '',
  permit_kind: 'job_permit',
  area: '',
  description: '',
  start_at: '',
  persons: '',
  safety_induction: false,
}

export default function PermitForm() {
  const [form, setForm] = useState(empty)
  const [types, setTypes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [issued, setIssued] = useState(null)
  const [honeypot, setHoneypot] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleType(type) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (honeypot) return
    if (!form.safety_induction) {
      setError('Safety induction wajib dicentang. / Safety induction is required.')
      return
    }
    if (!types.length) {
      setError('Pilih minimal satu jenis pekerjaan. / Choose at least one work type.')
      return
    }
    setSubmitting(true)
    try {
      const issuedPass = await submitWorkPermit({
        ...form,
        work_types: types,
        start_at: new Date(form.start_at).toISOString(),
        safety_induction: true,
      })
      setIssued(issuedPass)
    } catch (err) {
      setError(err.message || 'Pengajuan gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  if (issued) {
    const url = passUrl('ptw', issued.public_token)
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
        <PublicModuleNav />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10">
          <PassCard
            url={url}
            pass={{
              ref_no: issued.ref_no,
              phase: 'pending',
              type_label: PERMIT_KINDS.find((k) => k.id === form.permit_kind)?.title || 'Permit to Work',
              name: form.applicant_name,
              company: form.company,
              area: form.area,
              lifetime_label: PERMIT_KINDS.find((k) => k.id === form.permit_kind)?.life,
              route_to: 'HSSE',
            }}
          />
          <p className="mt-4 max-w-md text-center text-sm text-slate-500">
            Simpan barcode ini. Status berubah menjadi disetujui setelah HSSE menyetujui pengajuan, lengkap dengan batas waktunya.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Permit to Work</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Pengajuan izin kerja</h1>
        <p className="mt-1 text-sm text-slate-500">Work permit request. No login required.</p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
          <Honeypot value={honeypot} onChange={setHoneypot} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">Jenis permit</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMIT_KINDS.map((kind) => {
                const active = form.permit_kind === kind.id
                return (
                  <button
                    key={kind.id}
                    type="button"
                    onClick={() => update('permit_kind', kind.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">{kind.title}</span>
                    <span className="mt-0.5 block text-xs text-brand-700">{kind.life}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{kind.lifeEn}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Field label="Nama pemohon" hint="Applicant name">
            <input required className="input" value={form.applicant_name} onChange={(e) => update('applicant_name', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Perusahaan" hint="Company">
              <input required className="input" value={form.company} onChange={(e) => update('company', e.target.value)} />
            </Field>
            <Field label="Telepon" hint="Phone">
              <input required className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </Field>
          </div>
          <Field label="Email" hint="Barcode and the approval notice are sent here">
            <input required type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Departemen" hint="Department">
              <select className="input" value={form.department} onChange={(e) => update('department', e.target.value)}>
                <option value="">—</option>
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </Field>
            <Field label="Area kerja" hint="Work area">
              <select required className="input" value={form.area} onChange={(e) => update('area', e.target.value)}>
                <option value="">—</option>
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-800">Jenis pekerjaan</legend>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={types.includes(type)} onChange={() => toggleType(type)} />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Deskripsi pekerjaan" hint="Work description">
            <textarea required rows={4} className="input" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>
          <Field label="Rencana mulai" hint="Planned start">
            <input required type="datetime-local" className="input" value={form.start_at} onChange={(e) => update('start_at', e.target.value)} />
          </Field>
          <Field label="Personel terlibat" hint="People involved — optional">
            <textarea rows={2} className="input" value={form.persons} onChange={(e) => update('persons', e.target.value)} />
          </Field>

          <label className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-3 py-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.safety_induction}
              onChange={(e) => update('safety_induction', e.target.checked)}
            />
            <span className="text-sm text-slate-800">
              <span className="font-medium">Safety induction wajib.</span> Saya sudah mengikuti atau akan mengikuti safety induction sebelum pekerjaan dimulai.
              <span className="mt-1 block text-xs text-slate-500">Safety induction is mandatory before work starts.</span>
            </span>
          </label>

          <p className="text-xs text-slate-500">
            Kunjungan pelabuhan bukan permit kerja. Ajukan lewat{' '}
            <Link to="/visit" className="font-medium text-brand-700">
              form Visit
            </Link>
            , langsung ke Corporate Communication HSSE.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengirim…' : 'Ajukan permit'}
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

function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
