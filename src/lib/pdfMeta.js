import { categoryLabel, isUnclassifiedObservation } from './constants'

/** Perihal PDF: judul kejadian, bukan nama pelapor. */
export function buildPdfSubject(obs) {
  const custom = String(obs?.pdf_subject || '').trim()
  if (custom) return custom

  const loc = String(obs?.lokasi_teks || '').trim()
  const unclassified = isUnclassifiedObservation(obs)
  const cat = unclassified ? '' : categoryLabel(obs?.kategori)

  if (loc && cat) return `Safety Observation – ${loc} (${cat})`
  if (loc) return `Safety Observation – ${loc}`
  if (cat) return `Safety Observation – ${cat}`
  return 'Safety Observation'
}

export function buildPdfReporter() {
  return 'Disembunyikan'
}

export function normalizeActionChecks(count, saved) {
  return Array.from({ length: count }, (_, i) => !Array.isArray(saved) || saved[i] !== false)
}
