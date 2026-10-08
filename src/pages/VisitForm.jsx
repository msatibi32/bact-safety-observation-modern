import { useState } from 'react'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import SiteFooter from '../components/SiteFooter'
import { CameraIcon } from '../components/Icon'
import { validatePhotoFile } from '../lib/limits'
import { passUrl, submitVisitRequest, uploadEvidenceFiles } from '../lib/passes'

const QUESTIONS = [
  {
    id: 'enter',
    prompt: 'Tamu boleh masuk area terminal tanpa mengikuti penjelasan ini?',
    answer: 'no',
    options: [
      { id: 'yes', label: 'Boleh' },
      { id: 'no', label: 'Tidak' },
    ],
  },
  {
    id: 'ppe',
    prompt: 'APD yang diminta di lokasi wajib dipakai?',
    answer: 'yes',
    options: [
      { id: 'yes', label: 'Wajib' },
      { id: 'no', label: 'Tidak wajib' },
    ],
  },
  {
    id: 'stop',
    prompt: 'Jika melihat bahaya, apa yang dilakukan?',
    answer: 'stop',
    options: [
      { id: 'go', label: 'Lanjut masuk' },
      { id: 'stop', label: 'Hentikan dan laporkan' },
    ],
  },
]

const empty = {
  visitor_name: '',
  company: '',
  email: '',
  phone: '',
  purpose: '',
  visit_start: '',
  visit_end: '',
  placement: '',
  job_title: '',
  brings_goods: false,
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
  const [answers, setAnswers] = useState({})
  const [briefingPassed, setBriefingPassed] = useState(false)
  const [quizNote, setQuizNote] = useState('')

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
    if (!briefingPassed) {
      setError('Selesaikan penjelasan keselamatan dan tiga pertanyaannya dulu.')
      return
    }
    if (!form.declaration_accepted) {
      setError('Deklarasi ISPS wajib dicentang.')
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
        briefing_passed: true,
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
          Tamu dan pengantar barang lewat jalur yang sama. Penjelasan dulu, baru registrasi.
        </p>

        {!briefingPassed && (
          <section className="card mt-6 space-y-4 p-6">
            <h2 className="text-base font-semibold text-slate-900">Penjelasan singkat</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Di terminal ini, pakai APD yang diminta di lokasi. Jangan masuk area yang bukan tujuan kunjungan.
              Jika melihat bahaya, hentikan dan laporkan ke petugas. Barang yang diantar mengikuti jalur yang sama.
            </p>
            {QUESTIONS.map((item) => (
              <fieldset key={item.id}>
                <legend className="text-sm font-medium text-slate-800">{item.prompt}</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {item.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: option.id }))}
                      className={`rounded-xl border px-3 py-2 text-sm ${answers[item.id] === option.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            {quizNote && <p className="text-sm text-red-600">{quizNote}</p>}
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                const wrong = QUESTIONS.some((item) => answers[item.id] !== item.answer)
                if (wrong || QUESTIONS.some((item) => !answers[item.id])) {
                  setQuizNote('Jawaban belum sesuai. Baca penjelasan di atas, lalu pilih lagi.')
                  return
                }
                setQuizNote('')
                setBriefingPassed(true)
              }}
            >
              Lanjut ke registrasi
            </button>
          </section>
        )}

        {briefingPassed && (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Penerima pengajuan: <span className="font-medium text-slate-900">Corporate Communication HSSE</span>
          </div>
          <Field label="Nama" hint="Full name">
            <input required className="input" value={form.visitor_name} onChange={(e) => update('visitor_name', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kontraktor / perusahaan" hint="Company">
              <input required className="input" value={form.company} onChange={(e) => update('company', e.target.value)} />
            </Field>
            <Field label="Nomor HP" hint="Phone">
              <input required className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Penempatan" hint="Area yang dituju">
              <input className="input" value={form.placement} onChange={(e) => update('placement', e.target.value)} />
            </Field>
            <Field label="Jabatan" hint="Position">
              <input className="input" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
            <input type="checkbox" className="mt-1" checked={form.brings_goods} onChange={(e) => update('brings_goods', e.target.checked)} />
            <span className="text-sm text-slate-800">Kunjungan ini mengantar barang. Jalurnya sama dengan tamu.</span>
          </label>
          <Field label="Email" hint="Barcode and the approval notice are sent here">
            <input required type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <FilePick label="KTP" hint="Belum wajib. Lampirkan jika ada." file={ktp} onFile={(f) => takeFile(f, setKtp)} />
            <FilePick label="Paspor" hint="Belum wajib." file={passport} onFile={(f) => takeFile(f, setPassport)} />
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Mengirim…' : 'Ajukan kunjungan'}
          </button>
        </form>
        )}
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
