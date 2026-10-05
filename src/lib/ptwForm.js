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
    readings: [emptyReading()],
    understand: false,
    inspected: false,
    commence: false,
    nominatedPerson: '',
    areaAuthority: '',
    people: ['', '', ''],
    deisolationStatus: '',
    deisolationAck: false,
    deisolationSigner: '',
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
  }

  if (open.has('7')) {
    details.people = sheet.people.map((name) => clip(name, 80)).filter(Boolean).slice(0, 15)
  }

  if (open.has('8')) {
    details.deisolation = {
      status: sheet.deisolationStatus === 'incomplete' ? 'incomplete' : sheet.deisolationStatus === 'complete' ? 'complete' : '',
      acknowledged: Boolean(sheet.deisolationAck),
      signer: clip(sheet.deisolationSigner, 120),
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
