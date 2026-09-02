import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const csv = readFileSync(join(root, 'scripts/karyawan-raw.csv'), 'utf8')

function mapDepartemen(jabatan) {
  const j = jabatan.toLowerCase()
  if (/\bit\b|application support/.test(j)) return 'IT'
  if (/health and safety|\bhse\b|security/.test(j)) return 'HSSE'
  if (/procurement/.test(j)) return 'PROCUREMENT'
  if (/financ|billing|accounting|tax and treasury/.test(j)) return 'FINANCE'
  if (/hrga|hr superintendent|hr admin|talent acquisition|general affair/.test(j)) return 'HRGA'
  if (/customer service|key account|commercial|corporate communication|insurance/.test(j)) return 'COMMERCIAL'
  if (/\bceo\b|\bcfo\b|\bcoo\b|director|general counsel|bod admin|executive assistant/.test(j)) {
    return 'MANAGEMENT'
  }
  if (/engineer|mechanic|electrician|welder|lube man|storeman|facilit|rigger|warehouse/.test(j)) {
    return 'ENGINEERING'
  }
  return 'OPERATIONS'
}

function parseJabatan(raw) {
  const text = String(raw || '').trim()
  const match = text.match(/^(\d{4})\s*-\s*(.+)$/)
  if (match) return { number: match[1], jabatan: match[2].trim() }
  return { number: '', jabatan: text }
}

const rows = []
for (const line of csv.split(/\r?\n/)) {
  const match = line.match(/^"([^"]+)","([^"]+)","([^"]+)"$/)
  if (!match) continue
  const [, name, company, jabatanRaw] = match
  const { number, jabatan } = parseJabatan(jabatanRaw)
  rows.push({ name, company, number, jabatan, jabatanRaw })
}

const bact = rows
  .filter((r) => r.company === 'BACT')
  .map((r) => ({
    id: r.number ? `BACT-${r.number}` : `BACT-${r.name}`,
    name: r.name,
    departemen: mapDepartemen(r.jabatan),
    jabatan: r.jabatan,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'id'))

const other = rows.filter((r) => r.company !== 'BACT')

const body = bact
  .map((e) => `  ${JSON.stringify(e)},`)
  .join('\n')

const file = `/**
 * Daftar karyawan BACT untuk autocomplete form pelapor.
 * Digenerate dari scripts/karyawan-raw.csv — ${bact.length} karyawan BACT.
 */
export const BACT_EMPLOYEES = [
${body}
]
`

writeFileSync(join(root, 'src/data/employees.js'), file)

const ids = new Set(bact.map((e) => e.id))
console.log(JSON.stringify({
  totalBaris: rows.length,
  karyawanBact: bact.length,
  securityAtauVendor: other.length,
  vendor: other.map((r) => `${r.name} (${r.company} / ${r.jabatanRaw})`),
  idDuplikat: bact.length - ids.size,
  byDepartemen: bact.reduce((acc, e) => {
    acc[e.departemen] = (acc[e.departemen] || 0) + 1
    return acc
  }, {}),
}, null, 2))
