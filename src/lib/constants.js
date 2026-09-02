export const KATEGORI_OPTIONS = [
  'Unsafe Act',
  'Unsafe Condition',
  'Near Miss',
  'Positive Observation',
]

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

export const PIC_OPTIONS = [
  'HSE',
  'Produksi',
  'Maintenance',
  'Logistik',
  'Operasional',
  'Umum / GA',
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
  return isUnclassifiedCategory(obs?.kategori) || isUnclassifiedRisk(obs?.tingkat_risiko)
}

export function categoryLabel(kategori) {
  return isUnclassifiedCategory(kategori) ? UNCLASSIFIED_CATEGORY : kategori
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
