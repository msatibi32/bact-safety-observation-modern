import { KATEGORI_OPTIONS } from './constants'

const IMPORT_TAG = 'Imported from HSE Excel'

function norm(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function headerKey(h) {
  return norm(h).toLowerCase()
}

function looksLikeName(value) {
  const t = norm(value)
  return /[A-Za-z\u00C0-\u024F]{3,}/.test(t) && !/^\d{1,2}\s*[/:.-]/.test(t)
}

function parseLooseDate(value, timeHint = '') {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000))
  }
  const raw = norm(value)
  if (!raw) return null
  const parsed = Date.parse(raw)
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed)
    return applyTimeHint(d, timeHint)
  }
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (!m) return null
  let a = Number(m[1])
  let b = Number(m[2])
  let y = Number(m[3])
  if (y < 100) y += 2000
  // File uses M/D/YY (US Forms). If first part > 12, treat as D/M/YY.
  const month = a > 12 ? b : a
  const day = a > 12 ? a : b
  const hour = m[4] != null ? Number(m[4]) : null
  const minute = m[5] != null ? Number(m[5]) : 0
  const d = new Date(y, month - 1, day, hour ?? 8, minute)
  return Number.isNaN(d.getTime()) ? null : applyTimeHint(d, hour == null ? timeHint : '')
}

function applyTimeHint(date, timeHint) {
  const t = norm(timeHint)
  const m = t.match(/(\d{1,2}):(\d{2})/)
  if (!m) return date
  const next = new Date(date)
  next.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return next
}

function mapCategory(raw) {
  const t = norm(raw).toLowerCase()
  if (!t) return ''
  if (KATEGORI_OPTIONS.includes(raw)) return raw
  if (t.includes('near miss')) return 'Near Miss'
  if (t.includes('unsafe action') || t.includes('unsafe act') || (t.includes('prilaku') && t.includes('tidak aman'))) {
    return 'Unsafe Act'
  }
  if (t.includes('unsafe condition') || (t.includes('kondisi') && t.includes('tidak aman'))) {
    return 'Unsafe Condition'
  }
  if (
    t.includes('safe condition') ||
    t.includes('safe action') ||
    t.includes('kondisi aman') ||
    t.includes('prilaku aman') ||
    t.includes('positive')
  ) {
    return 'Positive Observation'
  }
  return ''
}

function pickDept(row, idx) {
  return (
    cell(row, idx.dept) ||
    cell(row, idx.operation) ||
    cell(row, idx.engineering) ||
    cell(row, idx.hsse) ||
    ''
  )
}

function cell(row, i) {
  if (i == null || i < 0) return ''
  return norm(row[i])
}

function indexHeaders(headers) {
  const idx = {}
  headers.forEach((h, i) => {
    const n = headerKey(h)
    if (!n) return
    if (n === 'id') idx.id = i
    if (n.includes('start time')) idx.start = i
    if (n.includes('observation date') || n.includes('tanggal observasi')) idx.date = i
    if (n.includes('observation time') || n.includes('waktu observasi')) idx.time = i
    if (n.includes('observer name') || n.includes('nama observer')) idx.observer = i
    if (n === 'name' || n.startsWith('name ')) idx.name = i
    if (n.includes('company name') || n.includes('nama perusahaan')) {
      if (idx.company == null) idx.company = i
      else idx.company2 = i
    }
    if (n.includes('departemen') || n.includes('departement') || n.includes('department')) idx.dept = i
    if (n.startsWith('operation')) idx.operation = i
    if (n.startsWith('engineering')) idx.engineering = i
    if (n === 'hsse' || n.startsWith('hsse ')) idx.hsse = i
    if (n.includes('immediate action') || n.includes('tindakan langsung')) idx.action = i
    if (n.includes('lokasi observasi') || n.includes('location observation') || n.includes('location')) {
      if (idx.location == null) idx.location = i
    }
    if (n.includes('vessel') || n.includes('nama kapal')) idx.vessel = i
    if (n.includes('finding') || n.includes('observasi yang ditemukan')) idx.finding = i
    if (n.includes('rekomendasi') || n.includes('recommendation')) idx.reco = i
    if (n.includes('kategori observasi') || n.includes('observation category')) {
      if (idx.category == null) idx.category = i
    }
    if (n.includes('need to follow') || n.includes('perlu ditindak')) idx.followUp = i
    if (n.includes('kategori safety') || n.includes('category safety')) idx.safetyCat = i
  })
  return idx
}

function mapHocRow(row, idx, rowNumber) {
  const start = cell(row, idx.start)
  let timeVal = cell(row, idx.time)
  let name =
    cell(row, idx.observer) ||
    cell(row, idx.name) ||
    ''
  if (!name && looksLikeName(timeVal)) {
    name = timeVal
    timeVal = ''
  }
  if (!name && looksLikeName(start)) name = start

  const dateVal = cell(row, idx.date) || start
  const when = parseLooseDate(dateVal, timeVal || start)
  const location = cell(row, idx.location)
  const vessel = cell(row, idx.vessel)
  const finding = cell(row, idx.finding)
  const reco = cell(row, idx.reco)
  const action = cell(row, idx.action)
  const categoryRaw = cell(row, idx.category)
  const dept = pickDept(row, idx)
  const company = cell(row, idx.company) || cell(row, idx.company2) || (dept ? 'PT. BACT' : '')

  const descParts = []
  if (finding) descParts.push(finding)
  else if (vessel) descParts.push(vessel)
  if (finding && vessel && vessel !== finding) descParts.unshift(vessel)

  const leftovers = []
  if (action) leftovers.push(`Immediate action: ${action}`)
  const followUp = cell(row, idx.followUp)
  if (followUp) leftovers.push(`Follow-up: ${followUp}`)
  const safetyCat = cell(row, idx.safetyCat)
  if (safetyCat && safetyCat.length < 160 && safetyCat !== categoryRaw) {
    leftovers.push(`HSE category note: ${safetyCat}`)
  }

  const deskripsi = descParts.join('\n\n')
  const errors = []
  if (!name) errors.push('Missing reporter name')
  if (!location) errors.push('Missing location')
  if (!deskripsi) errors.push('Missing description / finding')
  if (!when) errors.push('Invalid or missing date')

  return {
    rowNumber,
    ok: errors.length === 0,
    errors,
    record: {
      nama_pelapor: name,
      departemen: dept || 'OPERATIONS',
      nama_perusahaan: company || 'PT. BACT',
      tanggal_waktu: when ? when.toISOString() : '',
      lokasi_teks: location,
      deskripsi,
      kategori: mapCategory(categoryRaw),
      tingkat_risiko: '',
      rekomendasi: reco,
      tindakan_langsung: action,
      stop_work: false,
      is_hipo: false,
      triage_notes: leftovers.length ? `${IMPORT_TAG}. ${leftovers.join(' ')}` : IMPORT_TAG,
    },
    preview: {
      date: when ? when.toISOString().slice(0, 10) : '',
      name,
      location,
      category: mapCategory(categoryRaw) || 'Unclassified',
      description: deskripsi.slice(0, 140),
    },
  }
}

function pickSheet(wb, XLSX) {
  const named = wb.SheetNames.find((n) => n.toLowerCase() === 'hoc')
  if (named) return named
  let best = wb.SheetNames[0]
  let bestScore = -1
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
    if (!rows.length) continue
    const header = rows[0].map((h) => headerKey(h)).join(' ')
    const score =
      rows.length +
      (/observ|tanggal|location|finding|observer/.test(header) ? 1000 : 0) -
      (/dashboard|focus|target|percentage/.test(header) ? 500 : 0)
    if (score > bestScore) {
      bestScore = score
      best = name
    }
  }
  return best
}

export async function parseHistoricalFile(file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheetName = pickSheet(wb, XLSX)
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false })
  if (!rows.length) {
    return { sheetName, mapped: [], ready: [], skipped: [], headers: [] }
  }

  const headers = rows[0]
  const idx = indexHeaders(headers)
  const mapped = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row || row.every((c) => !norm(c))) continue
    mapped.push(mapHocRow(row, idx, i + 1))
  }

  return {
    sheetName,
    headers: headers.map((h) => norm(h)).filter(Boolean),
    mapped,
    ready: mapped.filter((r) => r.ok),
    skipped: mapped.filter((r) => !r.ok),
  }
}

export const HISTORICAL_IMPORT_TAG = IMPORT_TAG

export const HISTORICAL_COLUMN_MAP = [
  ['Observation Date / Start time', 'Date (tanggal_waktu)'],
  ['Observer Name, or Time if it holds a name', 'Reporter (nama_pelapor)'],
  ['Company name (or PT. BACT if department is set)', 'Company (nama_perusahaan)'],
  ['Departemen / Operation / Engineering / HSSE', 'Department'],
  ['Lokasi Observasi / Location', 'Location'],
  ['Finding + vessel title (if not a real vessel)', 'Description'],
  ['Improvement Recommendation', 'Recommendation'],
  ['Immediate Action', 'Immediate action + notes'],
  ['Kategori Observasi (Safe / Unsafe Action / Condition)', 'Category (if mappable)'],
  ['Need to Follow Up, leftover category notes', 'Triage notes (Imported from HSE Excel)'],
]
