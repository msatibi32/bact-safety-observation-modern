import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import SignaturePad from '../components/SignaturePad'
import SiteFooter from '../components/SiteFooter'
import { DEPARTMENT_OPTIONS, LOCATION_OPTIONS } from '../lib/constants'
import { ELECTRONIC_DISCLAIMER, listAreaAuthorities, passUrl, submitWorkPermit, WORK_TYPES } from '../lib/passes'
import { useSession } from '../lib/useSession'
import {
  CONTROLS,
  emptyActivity,
  emptyPermitSheet,
  emptyReading,
  HAZARDS,
  PPE_ITEMS,
  PTW_SECTIONS,
  WORK_TYPE_TONES,
  buildPermitDetails,
  validatePermitSheet,
  withSignature,
} from '../lib/ptwForm'

const empty = {
  applicant_name: '',
  company: '',
  email: '',
  phone: '',
  department: '',
  permit_kind: 'work_permit',
  area_authority_email: '',
  area: '',
  description: '',
  start_at: '',
}

export default function PermitForm() {
  const [form, setForm] = useState(empty)
  const [types, setTypes] = useState([])
  const [sheet, setSheet] = useState(emptyPermitSheet)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [issued, setIssued] = useState(null)
  const [honeypot, setHoneypot] = useState('')
  const [authorities, setAuthorities] = useState([])
  const [authorityNote, setAuthorityNote] = useState('')
  const [electronicAck, setElectronicAck] = useState(false)
  const session = useSession()

  useEffect(() => {
    if (!session?.user) return
    const email = session.user.email || ''
    const meta = session.user.user_metadata || {}
    const name = String(meta.full_name || meta.name || '').trim()
    setForm((prev) => ({
      ...prev,
      email,
      applicant_name: prev.applicant_name || name,
    }))
    listAreaAuthorities()
      .then((rows) => setAuthorities(Array.isArray(rows) ? rows : []))
      .catch((err) => setAuthorityNote(err.message || 'Daftar area authority belum bisa dibaca.'))
  }, [session])

  const open = new Set(sheet.open)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function patchSheet(partial) {
    setSheet((prev) => ({ ...prev, ...partial }))
  }

  function toggleOpen(id) {
    const section = PTW_SECTIONS.find((item) => item.id === id)
    if (!section || section.locked) return
    setSheet((prev) => {
      const next = new Set(prev.open)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...prev, open: [...next] }
    })
  }

  function toggleList(field, id) {
    setSheet((prev) => {
      const list = prev[field]
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
      return { ...prev, [field]: next }
    })
  }

  function toggleType(type) {
    const turningOn = !types.includes(type)
    setTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]))
    if (!turningOn) return
    if (type === 'Isolation Energy') {
      setSheet((current) => ({ ...current, open: [...new Set([...current.open, '4', '8'])] }))
    }
    if (type === 'Confine Space') {
      setSheet((current) => ({ ...current, open: [...new Set([...current.open, '5'])] }))
    }
  }

  function patchRow(field, index, key, value) {
    setSheet((prev) => {
      const rows = prev[field].map((row, i) => (i === index ? { ...row, [key]: value } : row))
      return { ...prev, [field]: rows }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (honeypot) return
    if (!types.length) {
      setError('Pilih minimal satu jenis pekerjaan.')
      return
    }
    const nominated = sheet.nominatedPerson.trim() || form.applicant_name.trim()
    const ready = { ...sheet, nominatedPerson: nominated }
    if (!form.area_authority_email) {
      setError('Pilih area authority dari daftar.')
      return
    }
    if (!electronicAck) {
      setError(ELECTRONIC_DISCLAIMER)
      return
    }
    const invalid = validatePermitSheet(ready, types)
    if (invalid) {
      setError(invalid)
      return
    }
    const details = buildPermitDetails(ready)
    const people = (details.people || []).join(', ')
    setSubmitting(true)
    try {
      const issuedPass = await submitWorkPermit({
        ...form,
        work_types: types,
        start_at: new Date(form.start_at).toISOString(),
        persons: people,
        safety_induction: true,
        electronic_ack: true,
        details,
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
              type_label: 'Izin kerja',
              name: form.applicant_name,
              company: form.company,
              area: form.area,
              lifetime_label: 'Durasi dipilih supervisor: 12 jam atau 7 hari',
              route_to: 'HSSE',
            }}
          />
          <p className="mt-4 max-w-md text-center text-sm text-slate-500">
            Barcode juga dikirim ke {form.email}. Hitung mundur jalan setelah HSSE menyetujui. Lembar PDF muncul di halaman barcode setelah disetujui.
          </p>
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat…</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
        <PublicModuleNav />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Izin kerja</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Login dulu untuk mengajukan</h1>
          <p className="mt-3 text-sm text-slate-500">
            Hanya akun yang sudah ikut pelatihan izin kerja. Pekerja yang mengerjakan tidak membuat izinnya sendiri.
          </p>
          <Link to="/admin/login?next=/ptw" className="btn-primary mt-6">
            Masuk
          </Link>
        </div>
      </div>
    )
  }

  const sessionRole = session.user.app_metadata?.role || session.user.user_metadata?.role || ''
  const canApply =
    session.user.app_metadata?.ptw_can_apply === true || sessionRole === 'admin' || sessionRole === 'super_admin'
  if (!canApply) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
        <PublicModuleNav />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Izin kerja</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Akun ini belum boleh mengajukan</h1>
          <p className="mt-3 text-sm text-slate-500">
            {session.user.email} sudah login, tetapi belum ditandai selesai pelatihan. Super Admin mengaktifkan hak ini tanpa menghapus akun.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Permit to Work</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Pengajuan izin kerja</h1>
        <p className="mt-1 text-sm text-slate-500">
          Satu formulir. Durasi 12 jam atau 7 hari dipilih supervisor, bukan pemohon. HSSE yang terakhir boleh mengubahnya.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-6 p-5 sm:p-6">
          <Honeypot value={honeypot} onChange={setHoneypot} />

          <Field label="Area authority" hint="Yang menyetujui lebih dulu. HSSE belum bisa menyetujui sebelum langkah ini.">
            <select
              required
              className="input"
              value={form.area_authority_email}
              onChange={(e) => update('area_authority_email', e.target.value)}
            >
              <option value="">— Pilih dari daftar —</option>
              {authorities.map((person) => (
                <option key={person.email} value={person.email}>
                  {person.name} · {person.email}
                </option>
              ))}
            </select>
            {authorities.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                {authorityNote || 'Belum ada akun area authority. Minta Rano menuliskan siapa yang boleh menyetujui, lalu buatkan akun peran SPV.'}
              </p>
            )}
          </Field>

          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Bagian formulir</legend>
            <p className="mt-1 text-xs text-slate-500">Centang untuk menampilkan isian. Bagian wajib tidak bisa dimatikan.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PTW_SECTIONS.map((section) => {
                const on = open.has(section.id)
                return (
                  <label
                    key={section.id}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                      on ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white'
                    } ${section.locked ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={on}
                      disabled={section.locked}
                      onChange={() => toggleOpen(section.id)}
                    />
                    <span>
                      <span className="block font-medium text-slate-900">
                        {section.no}. {section.titleId}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {section.title}
                        {section.hint ? ` · ${section.hint}` : ''}
                        {section.locked ? ' · wajib' : ''}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <Section n="1" title="Description of work" titleId="Deskripsi pekerjaan">
            <Field label="Nama pemohon" hint="Applicant name / PIC">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email akun" hint="Mengikuti akun yang login. Barcode dikirim ke sini.">
                <input required type="email" readOnly className="input bg-slate-50" value={form.email} />
              </Field>
              <Field label="Departemen" hint="Company / dept">
                <select className="input" value={form.department} onChange={(e) => update('department', e.target.value)}>
                  <option value="">—</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Area kerja" hint="Area of work">
                <select required className="input" value={form.area} onChange={(e) => update('area', e.target.value)}>
                  <option value="">—</option>
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal mulai" hint="Date">
                <input required type="datetime-local" className="input" value={form.start_at} onChange={(e) => update('start_at', e.target.value)} />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-800">Jenis pekerjaan</legend>
              <div className="grid grid-cols-2 gap-2">
                {WORK_TYPES.map((type) => {
                  const on = types.includes(type)
                  return (
                    <label
                      key={type}
                      data-on={on}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ring-0 data-[on=true]:ring-2 ${WORK_TYPE_TONES[type]}`}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggleType(type)} />
                      {type}
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Nomor izin dibuat otomatis, pola yang sama dengan nomor SOC. JSA dan method statement boleh dilampirkan nanti, tidak mengunci formulir ini.
            </p>
            <Field label="Detail pekerjaan" hint="Work detail">
              <textarea required minLength={10} rows={3} className="input" value={form.description} onChange={(e) => update('description', e.target.value)} />
            </Field>
          </Section>

          {open.has('2') && (
            <Section n="2" title="Pre job test" titleId="Tes sebelum bekerja">
              <p className="text-xs text-slate-500">Centang hanya yang sesuai dengan pekerjaan ini. Tidak perlu mengisi semuanya.</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <CheckColumn title="Bahaya teridentifikasi" hint="Hazards identified" items={HAZARDS} selected={sheet.hazards} onToggle={(id) => toggleList('hazards', id)} />
                <CheckColumn title="Tindakan kontrol" hint="Control measures" items={CONTROLS} selected={sheet.controls} onToggle={(id) => toggleList('controls', id)} />
              </div>
              {sheet.hazards.includes('other') && (
                <Field label="Bahaya lainnya" hint="Others">
                  <input className="input" value={sheet.hazardOther} onChange={(e) => patchSheet({ hazardOther: e.target.value })} />
                </Field>
              )}
              {sheet.controls.includes('jsa') && (
                <Field label="Nomor JSA" hint="JSA No.">
                  <input className="input" value={sheet.jsaNo} onChange={(e) => patchSheet({ jsaNo: e.target.value })} />
                </Field>
              )}
              {sheet.controls.includes('other') && (
                <Field label="Kontrol lainnya" hint="Others">
                  <input className="input" value={sheet.controlOther} onChange={(e) => patchSheet({ controlOther: e.target.value })} />
                </Field>
              )}
            </Section>
          )}

          {open.has('3') && (
            <Section n="3" title="Job description" titleId="Deskripsi pekerjaan">
              <div className="space-y-3">
                {sheet.activities.map((row, index) => (
                  <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                    <Mini label="Aktivitas" value={row.activity} onChange={(value) => patchRow('activities', index, 'activity', value)} />
                    <Mini label="Alat / material" value={row.tool} onChange={(value) => patchRow('activities', index, 'tool', value)} />
                    <Mini label="Potensi bahaya" value={row.hazard} onChange={(value) => patchRow('activities', index, 'hazard', value)} />
                    <Mini label="Tindakan pencegahan" value={row.action} onChange={(value) => patchRow('activities', index, 'action', value)} />
                  </div>
                ))}
                {sheet.activities.length < 8 && (
                  <button type="button" onClick={() => patchSheet({ activities: [...sheet.activities, emptyActivity()] })} className="text-sm font-medium text-brand-700">
                    Tambah aktivitas
                  </button>
                )}
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-slate-800">APD wajib</legend>
                <p className="mt-1 text-xs text-slate-500">Jika APD tidak lengkap, pekerjaan tidak boleh dimulai.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PPE_ITEMS.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <input type="checkbox" checked={sheet.ppe.includes(item.id)} onChange={() => toggleList('ppe', item.id)} />
                      {item.label}
                    </label>
                  ))}
                </div>
                <Field label="APD di luar daftar" hint="Isian bebas. Tidak wajib jika APD di daftar sudah dicentang.">
                  <input className="input" value={sheet.ppeOther || ''} onChange={(e) => patchSheet({ ppeOther: e.target.value })} />
                </Field>
              </fieldset>
            </Section>
          )}

          {open.has('4') && (
            <Section n="4" title="Isolation type required" titleId="Isolasi yang dibutuhkan">
              <Field label="No. sertifikat isolasi mekanik" hint="Mechanical isolation certificate">
                <input className="input" value={sheet.mechanicalCert} onChange={(e) => patchSheet({ mechanicalCert: e.target.value })} />
              </Field>
              <Field label="No. sertifikat isolasi listrik" hint="Electrical isolation certificate">
                <input className="input" value={sheet.electricalCert} onChange={(e) => patchSheet({ electricalCert: e.target.value })} />
              </Field>
              <Field label="Lokasi lock out / tag out" hint="Location lock out - tag out">
                <input className="input" value={sheet.lotoLocation} onChange={(e) => patchSheet({ lotoLocation: e.target.value })} />
              </Field>
            </Section>
          )}

          {open.has('5') && (
            <Section n="4" title="Gas testing" titleId="Tes gas">
              <p className="text-xs text-slate-500">Khusus confine space. Untuk pekerjaan lain, bagian ini boleh dikosongkan atau dimatikan di menu.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama gas tester bersertifikat" hint="Certified gas tester">
                  <input className="input" value={sheet.gasTester} onChange={(e) => patchSheet({ gasTester: e.target.value })} />
                </Field>
                <Field label="Jabatan" hint="Position">
                  <input className="input" value={sheet.gasPosition} onChange={(e) => patchSheet({ gasPosition: e.target.value })} />
                </Field>
              </div>
              <Field label="Tanda tangan gas tester" hint="Gambar di kotak. Kosongkan jika bukan confine space.">
                <SignaturePad value={sheet.gasSign} onChange={(data) => patchSheet({ gasSign: data })} />
              </Field>
              {sheet.readings.map((row, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Mini label="Waktu" value={row.time} onChange={(value) => patchRow('readings', index, 'time', value)} type="time" />
                  <Mini label="LEL %" value={row.lel} onChange={(value) => patchRow('readings', index, 'lel', value)} />
                  <Mini label="O2 %" value={row.o2} onChange={(value) => patchRow('readings', index, 'o2', value)} />
                  <Mini label="Toxic ppm" value={row.toxic} onChange={(value) => patchRow('readings', index, 'toxic', value)} />
                </div>
              ))}
              {sheet.readings.length < 4 && (
                <button type="button" onClick={() => patchSheet({ readings: [...sheet.readings, emptyReading()] })} className="text-sm font-medium text-brand-700">
                  Tambah hasil tes
                </button>
              )}
            </Section>
          )}

          <Section n="5" title="Approvals" titleId="Persetujuan">
            <Statement checked={sheet.understand} onChange={(checked) => patchSheet({ understand: checked })}>
              Saya mengerti kondisi yang tertera di izin kerja ini dan akan mengarahkan krew yang bekerja.
            </Statement>
            <Statement checked={sheet.inspected} onChange={(checked) => patchSheet({ inspected: checked })}>
              Saya telah menginspeksi area kerja dan mengizinkan pekerjaan dimulai.
            </Statement>
            <Statement checked={sheet.commence} onChange={(checked) => patchSheet({ commence: checked })}>
              Saya mengetahui kondisi di atas telah sesuai sehingga pekerjaan boleh dimulai.
            </Statement>
            <Field label="Orang yang dinominasikan" hint="Performing authority. Yang tercatat adalah nama akun yang login.">
              <input className="input" value={sheet.nominatedPerson} placeholder={form.applicant_name || 'Nama'} onChange={(e) => patchSheet({ nominatedPerson: e.target.value })} />
            </Field>
            <Statement checked={electronicAck} onChange={setElectronicAck}>
              {ELECTRONIC_DISCLAIMER} Persetujuan nanti tercatat sebagai nama akun dan jam, bukan tanda tangan tempel.
            </Statement>
          </Section>

          {open.has('7') && (
            <Section n="6" title="Person involved" titleId="Personil yang terlibat">
              <div className="space-y-2">
                {sheet.people.map((name, index) => (
                  <div key={index} className="grid grid-cols-[1fr_7rem] gap-2">
                    <Mini label={`Nama ${index + 1}`} value={name} onChange={(value) => {
                      const people = sheet.people.map((item, i) => (i === index ? value : item))
                      patchSheet({ people })
                    }} />
                    <Mini label="Paraf" value={sheet.paraf?.[index] || ''} onChange={(value) => {
                      const paraf = sheet.people.map((_, i) => (i === index ? value : (sheet.paraf?.[i] || '')))
                      patchSheet({ paraf })
                    }} />
                  </div>
                ))}
              </div>
              {sheet.people.length < 15 && (
                <button type="button" onClick={() => patchSheet({ people: [...sheet.people, ''], paraf: [...(sheet.paraf || []), ''] })} className="text-sm font-medium text-brand-700">
                  Tambah personil
                </button>
              )}
            </Section>
          )}

          {open.has('8') && (
            <Section n="7" title="Request for de-isolation" titleId="Permintaan membuka isolasi energi">
              <p className="text-xs text-slate-500">Khusus LOTO. Isi saat isolasi akan dibuka.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Choice on={sheet.deisolationStatus === 'complete'} onClick={() => patchSheet({ deisolationStatus: 'complete' })} title="Selesai" hint="Complete" />
                <Choice on={sheet.deisolationStatus === 'incomplete'} onClick={() => patchSheet({ deisolationStatus: 'incomplete' })} title="Belum selesai" hint="Incomplete" />
              </div>
              <Statement checked={sheet.deisolationAck} onChange={(checked) => patchSheet({ deisolationAck: checked })}>
                Area kerja dalam keadaan bersih dan aman, dan isolasi yang diberikan dalam izin kerja ini boleh atau tidak boleh dibuka sesuai status di atas.
              </Statement>
              <Field label="Area Authority — Engineering" hint="Nama penandatangan">
                <input className="input" value={sheet.deisolationSigner} onChange={(e) => patchSheet({ deisolationSigner: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Mini label="Tanggal" value={sheet.deisolationDate} onChange={(value) => patchSheet({ deisolationDate: value })} />
                <Mini label="Waktu" value={sheet.deisolationTime} onChange={(value) => patchSheet({ deisolationTime: value })} />
              </div>
              <Field label="Tanda tangan engineering" hint="Gambar di kotak jika isolasi akan dibuka.">
                <SignaturePad
                  value={sheet.deisolationSign}
                  onChange={(data) => setSheet((prev) => ({ ...prev, ...withSignature(prev, 'deisolationSign', 'deisolationDate', 'deisolationTime', data) }))}
                />
              </Field>
            </Section>
          )}

          <p className="text-xs text-slate-500">
            Kunjungan pelabuhan bukan permit kerja. Ajukan lewat{' '}
            <Link to="/visit" className="font-medium text-brand-700">form Visit</Link>
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

function Section({ n, title, titleId, children }) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">{n}. {title}</p>
        <h2 className="text-base font-semibold text-slate-900">{titleId}</h2>
      </div>
      {children}
    </section>
  )
}

function CheckColumn({ title, hint, items, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">{title}</legend>
      <p className="mb-2 text-[11px] text-slate-400">{hint}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <label key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm">
            <input type="checkbox" className="mt-1" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            <span>
              <span className="block text-slate-800">{item.labelId}</span>
              <span className="block text-[11px] text-slate-400">{item.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Statement({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-slate-800">{children}</span>
    </label>
  )
}

function Choice({ on, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left ${on ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200'}`}
    >
      <span className="block text-sm font-semibold text-slate-900">{title}</span>
      <span className="block text-[11px] text-slate-400">{hint}</span>
    </button>
  )
}

function Mini({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-500">{label}</span>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
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
