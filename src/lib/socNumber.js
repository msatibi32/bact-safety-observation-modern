const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

/** Format: SOC-0001-BACT-HSSE-IX-2026 */
export function formatSocNumber(seq, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const roman = ROMAN_MONTHS[d.getMonth()] || 'I'
  const year = d.getFullYear()
  const n = String(Math.max(1, Number(seq) || 1)).padStart(4, '0')
  return `SOC-${n}-BACT-HSSE-${roman}-${year}`
}

export function monthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Urutan SOC dalam bulan yang sama (berdasarkan created_at, oldest = 1). */
export function resolveSocNumber(obs, allObservations = []) {
  if (obs?.soc_number) return obs.soc_number
  const created = new Date(obs?.created_at || obs?.tanggal_waktu || Date.now())
  const key = monthKey(created)
  const sameMonth = (allObservations.length ? allObservations : [obs])
    .filter((o) => monthKey(o.created_at || o.tanggal_waktu) === key)
    .sort((a, b) => new Date(a.created_at || a.tanggal_waktu) - new Date(b.created_at || b.tanggal_waktu))
  const idx = Math.max(0, sameMonth.findIndex((o) => o.id === obs.id))
  const seq = idx >= 0 ? idx + 1 : sameMonth.length + 1
  return formatSocNumber(seq, created)
}
