export const PTW_SECTIONS = [
  { id: '1', no: '1', title: 'Description of work', titleId: 'Deskripsi pekerjaan', locked: true },
  { id: '2', no: '2', title: 'Pre job test', titleId: 'Tes sebelum bekerja', locked: false },
  { id: '3', no: '3', title: 'Job description', titleId: 'Aktivitas dan APD', locked: false },
  { id: '4', no: '4', title: 'Isolation type required', titleId: 'Isolasi yang dibutuhkan', hint: 'Jika diperlukan', locked: false },
  { id: '5', no: '5', title: 'Gas testing', titleId: 'Tes gas', hint: 'Khusus confine space', locked: false },
  { id: '6', no: '6', title: 'Approvals', titleId: 'Persetujuan', locked: true },
  { id: '7', no: '7', title: 'Person involved', titleId: 'Personil yang terlibat', locked: false },
  { id: '8', no: '8', title: 'Request for de-isolation', titleId: 'Membuka isolasi energi', hint: 'Khusus LOTO', locked: false },
]

export const DEFAULT_OPEN_SECTIONS = ['1', '2', '3', '5', '6']

export const WORK_TYPE_TONES = {
  'Hot Work': 'border-red-300 text-red-700 data-[on=true]:bg-red-50 data-[on=true]:ring-red-400',
  'Cold Work': 'border-emerald-300 text-emerald-700 data-[on=true]:bg-emerald-50 data-[on=true]:ring-emerald-500',
  'Confine Space': 'border-orange-300 text-orange-700 data-[on=true]:bg-orange-50 data-[on=true]:ring-orange-400',
  'Isolation Energy': 'border-blue-300 text-blue-700 data-[on=true]:bg-blue-50 data-[on=true]:ring-blue-500',
}

export const HAZARDS = [
  { id: 'toxic', label: 'Toxic/corrosive materials', labelId: 'Bahan bersifat racun/korosif' },
  { id: 'flammable', label: 'Flammable materials/liquids', labelId: 'Bahan cair / mudah terbakar' },
  { id: 'asbestos', label: 'Asbestos based material', labelId: 'Bahan mengandung asbes' },
  { id: 'lifting', label: 'Lifting/manual handling', labelId: 'Pengangkatan / penanganan manual' },
  { id: 'weld', label: 'Weld/Burn/Grind', labelId: 'Las / bakar / gerinda' },
  { id: 'slips', label: 'Slips/trips/bumps/crush points', labelId: 'Terpeleset / terjatuh / terantuk / terhimpit' },
  { id: 'electrical', label: 'Live electrics', labelId: 'Arus listrik' },
  { id: 'moving', label: 'Moving parts', labelId: 'Bagian bergerak' },
  { id: 'height', label: 'Working at height/over water', labelId: 'Bekerja di ketinggian' },
  { id: 'noise', label: 'High noise levels', labelId: 'Daerah bising' },
  { id: 'access', label: 'Restricted access/egress', labelId: 'Akses terbatas' },
  { id: 'radiation', label: 'Radiation/contacting energy', labelId: 'Radiasi / kontak energi' },
  { id: 'simops', label: 'Simultaneous operations', labelId: 'Operasi bersamaan' },
  { id: 'other', label: 'Others', labelId: 'Lainnya' },
]

export const CONTROLS = [
  { id: 'cover', label: 'Remove from or cover', labelId: 'Hilangkan dari area atau lindungi' },
  { id: 'ppe', label: 'Use of correct PPE', labelId: 'Gunakan APD yang benar' },
  { id: 'isolation', label: 'Isolation', labelId: 'Isolasi' },
  { id: 'position', label: 'Ensure proper position', labelId: 'Yakinkan posisi yang benar' },
  { id: 'gas_monitor', label: 'Continuous gas monitoring', labelId: 'Monitor gas terus menerus' },
  { id: 'fire_watch', label: 'Fire watcher and equipment', labelId: 'Pengawas api dan perlengkapan' },
  { id: 'tannoy', label: 'Make tannoy announcement', labelId: 'Buat pengumuman' },
  { id: 'lighting', label: 'Temporary lighting', labelId: 'Lampu sementara' },
  { id: 'scaffold', label: 'Scaffolding / life vest / harness', labelId: 'Scaffolding / life vest / harness' },
  { id: 'hearing', label: 'Hearing protection', labelId: 'Pelindung pendengaran' },
  { id: 'barrier', label: 'Barrier off area', labelId: 'Barikade area' },
  { id: 'procedure', label: 'Refer to company procedure', labelId: 'Mengacu ke prosedur' },
  { id: 'jsa', label: 'JSA No.', labelId: 'Nomor JSA' },
  { id: 'other', label: 'Others', labelId: 'Lainnya' },
]

export const PPE_ITEMS = [
  { id: 'helm', label: 'Helm' },
  { id: 'shoes', label: 'Sepatu safety' },
  { id: 'vest', label: 'Rompi / baju reflektif' },
  { id: 'glasses', label: 'Kaca mata' },
  { id: 'gloves', label: 'Sarung tangan' },
  { id: 'mask', label: 'Masker' },
]

export function emptyActivity() {
  return { activity: '', tool: '', hazard: '', action: '' }
}

export function emptyReading() {
  return { time: '', lel: '', o2: '', toxic: '' }
}

export function emptyPermitSheet() {
  return {
    open: [...DEFAULT_OPEN_SECTIONS],
    hazards: [],
    hazardOther: '',
    controls: [],
    jsaNo: '',
    controlOther: '',
    ppe: [],
    activities: [emptyActivity()],
    mechanicalCert: '',
    electricalCert: '',
    lotoLocation: '',
    gasTester: '',
    gasPosition: '',
    gasSignature: '',
    readings: [emptyReading()],
    understand: false,
    inspected: false,
    commence: false,
    nominatedPerson: '',
    areaAuthority: '',
    nominatedDate: '',
    nominatedTime: '',
    areaDate: '',
    areaTime: '',
    hsseName: '',
    hsseDate: '',
    hsseTime: '',
    people: ['', '', ''],
    deisolationStatus: '',
    deisolationAck: false,
    deisolationSigner: '',
    deisolationDate: '',
    deisolationTime: '',
  }
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max)
}

function picked(ids, catalog) {
  const allowed = new Set(catalog.map((item) => item.id))
  return [...new Set(ids.filter((id) => allowed.has(id)))]
}

export function labelFor(catalog, id) {
  const item = catalog.find((entry) => entry.id === id)
  return item?.labelId || item?.label || id
}

export function buildPermitDetails(sheet) {
  const open = new Set(sheet.open)
  open.add('1')
  open.add('6')
  const details = { sections: PTW_SECTIONS.map((section) => section.id).filter((id) => open.has(id)) }

  if (open.has('2')) {
    details.hazards = picked(sheet.hazards, HAZARDS)
    details.controls = picked(sheet.controls, CONTROLS)
    if (details.hazards.includes('other')) details.hazard_other = clip(sheet.hazardOther, 200)
    if (details.controls.includes('jsa')) details.jsa_no = clip(sheet.jsaNo, 40)
    if (details.controls.includes('other')) details.control_other = clip(sheet.controlOther, 200)
  }

  if (open.has('3')) {
    details.ppe = picked(sheet.ppe, PPE_ITEMS)
    details.activities = sheet.activities
      .map((row) => ({
        activity: clip(row.activity, 200),
        tool: clip(row.tool, 160),
        hazard: clip(row.hazard, 200),
        action: clip(row.action, 200),
      }))
      .filter((row) => row.activity || row.tool || row.hazard || row.action)
      .slice(0, 8)
  }

  if (open.has('4')) {
    details.isolation = {
      mechanical_cert: clip(sheet.mechanicalCert, 80),
      electrical_cert: clip(sheet.electricalCert, 80),
      loto_location: clip(sheet.lotoLocation, 160),
    }
  }

  if (open.has('5')) {
    details.gas = {
      tester_name: clip(sheet.gasTester, 120),
      position: clip(sheet.gasPosition, 80),
      signature: clip(sheet.gasSignature, 120),
      readings: sheet.readings
        .map((row) => ({
          time: clip(row.time, 8),
          lel: clip(row.lel, 12),
          o2: clip(row.o2, 12),
          toxic: clip(row.toxic, 12),
        }))
        .filter((row) => row.time || row.lel || row.o2 || row.toxic)
        .slice(0, 4),
    }
  }

  details.approvals = {
    understand: Boolean(sheet.understand),
    inspected: Boolean(sheet.inspected),
    commence: Boolean(sheet.commence),
    nominated_person: clip(sheet.nominatedPerson, 120),
    area_authority: clip(sheet.areaAuthority, 120),
    nominated_date: clip(sheet.nominatedDate, 20),
    nominated_time: clip(sheet.nominatedTime, 8),
    area_date: clip(sheet.areaDate, 20),
    area_time: clip(sheet.areaTime, 8),
    hsse_name: clip(sheet.hsseName, 120),
    hsse_date: clip(sheet.hsseDate, 20),
    hsse_time: clip(sheet.hsseTime, 8),
  }

  if (open.has('7')) {
    details.people = sheet.people.map((name) => clip(name, 80)).filter(Boolean).slice(0, 15)
  }

  if (open.has('8')) {
    details.deisolation = {
      status: sheet.deisolationStatus === 'incomplete' ? 'incomplete' : sheet.deisolationStatus === 'complete' ? 'complete' : '',
      acknowledged: Boolean(sheet.deisolationAck),
      signer: clip(sheet.deisolationSigner, 120),
      date: clip(sheet.deisolationDate, 20),
      time: clip(sheet.deisolationTime, 8),
    }
  }

  return details
}

export function validatePermitSheet(sheet, workTypes) {
  const details = buildPermitDetails(sheet)
  const open = new Set(details.sections)
  if (!details.approvals.understand || !details.approvals.inspected || !details.approvals.commence) {
    return 'Tiga pernyataan persetujuan wajib dicentang.'
  }
  if (!details.approvals.nominated_person) {
    return 'Isi nama orang yang dinominasikan.'
  }
  if (open.has('2') && details.hazards.length === 0 && details.controls.length === 0) {
    return 'Centang minimal satu bahaya atau tindakan kontrol pada tes sebelum bekerja.'
  }
  if (open.has('3')) {
    if (!details.activities.length) return 'Isi minimal satu aktivitas pekerjaan.'
    if (!details.ppe.length) return 'Centang APD yang wajib dipakai.'
  }
  if (open.has('4')) {
    const iso = details.isolation
    if (!iso.mechanical_cert && !iso.electrical_cert && !iso.loto_location) {
      return 'Isi nomor sertifikat isolasi atau lokasi lock out, atau matikan bagian isolasi.'
    }
  }
  if (open.has('5') && workTypes.includes('Confine Space') && !details.gas.tester_name) {
    return 'Confine space wajib mengisi nama gas tester.'
  }
  if (open.has('7') && !details.people.length) {
    return 'Isi minimal satu nama personil, atau matikan bagian personil.'
  }
  if (open.has('8')) {
    if (!details.deisolation.status) return 'Pilih pekerjaan selesai atau belum selesai.'
    if (!details.deisolation.acknowledged) return 'Centang pernyataan pembukaan isolasi.'
  }
  return ''
}

function asText(value) {
  return String(value || '')
}

function asIds(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

export function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function editorFromPermit(row) {
  const details = row?.details && typeof row.details === 'object' ? row.details : {}
  const sheet = emptyPermitSheet()
  const sections = new Set(Array.isArray(details.sections) ? details.sections : sheet.open)
  if (details.isolation) sections.add('4')
  if (details.gas) sections.add('5')
  if (Array.isArray(details.people) && details.people.length) sections.add('7')
  if (details.deisolation) sections.add('8')
  sections.add('1')
  sections.add('6')

  const approvals = details.approvals || {}
  const gas = details.gas || {}
  const isolation = details.isolation || {}
  const deisolation = details.deisolation || {}
  const activities = Array.isArray(details.activities) && details.activities.length
    ? details.activities.map((item) => ({
        activity: asText(item?.activity),
        tool: asText(item?.tool),
        hazard: asText(item?.hazard),
        action: asText(item?.action),
      }))
    : [emptyActivity()]
  const readings = Array.isArray(gas.readings) && gas.readings.length
    ? gas.readings.map((item) => ({
        time: asText(item?.time),
        lel: asText(item?.lel),
        o2: asText(item?.o2),
        toxic: asText(item?.toxic),
      }))
    : [emptyReading()]

  return {
    form: {
      applicant_name: asText(row?.applicant_name),
      company: asText(row?.company),
      email: asText(row?.applicant_email),
      phone: asText(row?.phone),
      department: asText(row?.department),
      permit_kind: row?.permit_kind === 'job_permit' ? 'job_permit' : 'e_permit',
      area: asText(row?.area),
      description: asText(row?.description),
      start_at: toDatetimeLocal(row?.start_at),
    },
    types: Object.keys(WORK_TYPE_TONES).filter((type) => (row?.work_types || []).includes(type)),
    sheet: {
      ...sheet,
      open: PTW_SECTIONS.map((section) => section.id).filter((id) => sections.has(id)),
      hazards: asIds(details.hazards),
      hazardOther: asText(details.hazard_other),
      controls: asIds(details.controls),
      jsaNo: asText(details.jsa_no),
      controlOther: asText(details.control_other),
      ppe: asIds(details.ppe),
      activities,
      mechanicalCert: asText(isolation.mechanical_cert),
      electricalCert: asText(isolation.electrical_cert),
      lotoLocation: asText(isolation.loto_location),
      gasTester: asText(gas.tester_name),
      gasPosition: asText(gas.position),
      gasSignature: asText(gas.signature),
      readings,
      understand: Boolean(approvals.understand),
      inspected: Boolean(approvals.inspected),
      commence: Boolean(approvals.commence),
      nominatedPerson: asText(approvals.nominated_person || row?.applicant_name),
      areaAuthority: asText(approvals.area_authority),
      nominatedDate: asText(approvals.nominated_date),
      nominatedTime: asText(approvals.nominated_time),
      areaDate: asText(approvals.area_date),
      areaTime: asText(approvals.area_time),
      hsseName: asText(approvals.hsse_name || (row?.status === 'Approved' ? row?.approved_by : '')),
      hsseDate: asText(approvals.hsse_date),
      hsseTime: asText(approvals.hsse_time),
      people: Array.isArray(details.people) && details.people.length ? details.people.map(asText) : ['', '', ''],
      deisolationStatus: deisolation.status === 'complete' || deisolation.status === 'incomplete' ? deisolation.status : '',
      deisolationAck: Boolean(deisolation.acknowledged),
      deisolationSigner: asText(deisolation.signer),
      deisolationDate: asText(deisolation.date),
      deisolationTime: asText(deisolation.time),
    },
  }
}

export function payloadFromEditor({ form, types, sheet }) {
  const nominated = String(sheet.nominatedPerson || '').trim() || String(form.applicant_name || '').trim()
  const ready = { ...sheet, nominatedPerson: nominated }
  const details = buildPermitDetails(ready)
  return {
    applicant_name: form.applicant_name,
    company: form.company,
    email: form.email,
    phone: form.phone,
    department: form.department,
    permit_kind: form.permit_kind,
    area: form.area,
    description: form.description,
    start_at: new Date(form.start_at).toISOString(),
    work_types: Object.keys(WORK_TYPE_TONES).filter((type) => types.includes(type)),
    persons: (details.people || []).join(', '),
    details,
  }
}
