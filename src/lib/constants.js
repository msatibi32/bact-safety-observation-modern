/** Nilai disimpan di database. Label yang dilihat pelapor ada di OBSERVATION_TYPES. */
export const KATEGORI_OPTIONS = [
  'Positive Observation',
  'Unsafe Act',
  'Unsafe Condition',
  'Near Miss',
  'Suggestion',
]

export const OBSERVATION_TYPES = [
  {
    value: 'Positive Observation',
    label: 'Tindakan aman',
    labelEn: 'Safe action',
    hint: 'Untuk apresiasi. Foto orang yang bekerja aman boleh dilampirkan.',
    hintEn: 'For appreciation. A photo of someone working safely may be attached.',
  },
  {
    value: 'Unsafe Act',
    label: 'Tindakan tidak aman',
    labelEn: 'Unsafe action',
    hint: 'Perilaku yang perlu ditegur di tempat. Tetap tercatat.',
    hintEn: 'Behaviour to correct on the spot. It is still recorded.',
  },
  {
    value: 'Unsafe Condition',
    label: 'Kondisi tidak aman',
    labelEn: 'Unsafe condition',
    hint: 'HSE akan menunjuk kepala departemen untuk menindaklanjuti.',
    hintEn: 'HSE will assign a department head to follow up.',
  },
  {
    value: 'Near Miss',
    label: 'Near miss',
    labelEn: 'Near miss',
    hint: 'Hampir celaka. HSE yang memutuskan apakah perlu tindak lanjut.',
    hintEn: 'A near miss. HSE decides whether it needs follow-up.',
  },
  {
    value: 'Suggestion',
    label: 'Saran',
    labelEn: 'Suggestion',
    hint: 'Ide dari yang melihat pekerjaan. Tidak otomatis jadi tugas departemen.',
    hintEn: 'An idea from the person who saw the job. It does not automatically become a task.',
  },
]

const CATEGORY_LABELS = {
  'Positive Observation': 'Tindakan aman',
  'Unsafe Act': 'Tindakan tidak aman',
  'Unsafe Condition': 'Kondisi tidak aman',
  'Near Miss': 'Near miss',
  Suggestion: 'Saran',
}

export const RISIKO_OPTIONS = ['Low', 'Medium', 'High']

export const STATUS_OPTIONS = [
  'Open',
  'Under Review',
  'In Progress',
  'Pending Verification',
  'Closed',
  'Rejected',
]

export const CAPA_STATUS_OPTIONS = ['Open', 'In Progress', 'Completed', 'Verified']

// IOGP Life Saving Rules (disederhanakan)
export const LIFE_SAVING_RULES = [
  'Tidak terkait',
  'Bypassing Safety Controls',
  'Confined Space',
  'Driving',
  'Energy Isolation',
  'Hot Work',
  'Line of Fire',
  'Safe Mechanical Lifting',
  'Work Authorization',
  'Working at Height',
]

export const DEPARTMENT_OPTIONS = [
  'MANAGEMENT',
  'OPERATIONS',
  'HSSE',
  'ENGINEERING',
  'PROCUREMENT',
  'FINANCE',
  'HRGA',
  'COMMERCIAL',
  'CONTRACTOR/ TEMPORARY WORKER/ VISITOR',
  'IT',
]

/** Lokasi kejadian — dropdown form pelapor */
export const LOCATION_OPTIONS = [
  'CY/A1',
  'CY/A2',
  'CY/A3',
  'CY/A',
  'CY/B',
  'CY/C',
  'CY/D',
  'CY/E',
  'CY/F',
  'CY/G',
  'CY/H',
  'CY/I',
  'CY/J',
  'CY/00',
  'CY/DY',
  'Gate IN',
  'Gate Out',
  'BACT Office',
  'Workshop',
  'ETT Charging',
  'Power House',
  'Pump House',
  'TPFT',
  'Jetty',
  'Container Rest Area',
  'New Building Office',
  'HSSE Office',
  'Parking Area Truck Internal',
  'Parking Area Employee',
  'Other',
]

/** Follow-up departemen = sama opsi form pelaporan */
export const PIC_OPTIONS = DEPARTMENT_OPTIONS

export const COMPANY_OPTIONS = [
  'PT. BACT',
  'PT. PUB (Security)',
  'PT. BKS (Driver, CS, Etc)',
  'PT. MSB (Tally, CS)',
  'PT. SNEPAC (ETT)',
  'PT. ESQARADA (Truck)',
  'PT. KSB/SITC (Trusck)',
  'KTKBM',
  'PT. BKJ (Mooring etc)',
  'Lainnya',
]

export const NEGATIVE_CATEGORIES = ['Unsafe Act', 'Unsafe Condition', 'Near Miss']

export const UNCLASSIFIED_CATEGORY = 'Belum diklasifikasi'
export const UNCLASSIFIED_RISK = 'Unclassified'

export function isUnclassifiedCategory(kategori) {
  return !kategori || kategori === UNCLASSIFIED_CATEGORY || kategori === 'Observasi'
}

export function isUnclassifiedRisk(level) {
  return !level || level === UNCLASSIFIED_RISK
}

export function isUnclassifiedObservation(obs) {
  return (
    isUnclassifiedCategory(obs?.kategori) ||
    isUnclassifiedRisk(obs?.tingkat_risiko) ||
    obs?.life_saving_rule === UNCLASSIFIED_CATEGORY
  )
}

export function categoryLabel(kategori) {
  if (isUnclassifiedCategory(kategori)) return 'Unclassified'
  return CATEGORY_LABELS[kategori] || kategori
}

/** none = tidak dikirim sebagai CAPA. optional = HSE boleh kirim. required = wajib CAPA. */
export function capaMode(kategori) {
  if (kategori === 'Unsafe Condition') return 'required'
  if (kategori === 'Near Miss') return 'optional'
  return 'none'
}

export function capaModeNote(kategori) {
  if (kategori === 'Positive Observation') {
    return 'Tindakan aman dicatat untuk apresiasi. Tidak membuat CAPA dan tidak dikirim ke departemen.'
  }
  if (kategori === 'Unsafe Act') {
    return 'Tindakan tidak aman dicatat supaya perilaku yang paling sering terlihat. Teguran dilakukan di tempat. Tidak otomatis menjadi CAPA.'
  }
  if (kategori === 'Suggestion') {
    return 'Saran menempel di kartu. Tidak otomatis menjadi tugas departemen.'
  }
  if (kategori === 'Unsafe Condition') {
    return 'Kondisi tidak aman wajib menjadi permintaan CAPA ke satu kepala departemen. Bukan ke HSSE.'
  }
  if (kategori === 'Near Miss') {
    return 'Near miss boleh menjadi CAPA. HSSE yang memutuskan apakah permintaan dikirim.'
  }
  return 'Konfirmasi jenis pengamatan dulu, baru tentukan apakah kartu ini perlu CAPA.'
}

export function computeIsHiPo({ kategori, tingkat_risiko, potensi_risiko, stop_work }) {
  return (
    tingkat_risiko === 'High' ||
    potensi_risiko === 'High' ||
    kategori === 'Near Miss' ||
    stop_work === true
  )
}

export function isOpenStatus(status) {
  return status !== 'Closed' && status !== 'Rejected'
}
