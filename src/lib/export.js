import { categoryLabel, isOpenStatus, isUnclassifiedObservation } from './constants'
import { resolveSocNumber } from './socNumber'

export function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultWeeklyRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return { from: toIsoDate(from), to: toIsoDate(to) }
}

export function defaultMonthlyRange() {
  const now = new Date()
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIsoDate(now),
  }
}

export function observationReportDate(obs) {
  return obs?.tanggal_waktu || obs?.created_at || ''
}

export function filterObservationsByRange(observations, from, to) {
  if (!from || !to) return []
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T23:59:59.999`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  const lo = start <= end ? start : end
  const hi = start <= end ? end : start
  return observations.filter((o) => {
    const raw = observationReportDate(o)
    if (!raw) return false
    const d = new Date(raw)
    return !Number.isNaN(d.getTime()) && d >= lo && d <= hi
  })
}

function fmtDateTime(d) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return String(d)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function observationRows(observations) {
  const headers = [
    'SOC No',
    'Date',
    'Reporter',
    'Employee ID',
    'Department',
    'Company',
    'Location',
    'Category',
    'Risk',
    'HiPo',
    'Stop Work',
    'Status',
    'PIC',
    'Description',
    'Recommendation',
    'Close date',
  ]

  const rows = observations.map((o) => [
    resolveSocNumber(o, observations),
    fmtDateTime(o.tanggal_waktu || o.created_at),
    o.nama_pelapor || '',
    o.employee_id || '',
    o.departemen || '',
    o.nama_perusahaan || '',
    o.lokasi_teks || '',
    categoryLabel(o.kategori),
    isUnclassifiedObservation(o) ? 'Unclassified' : o.tingkat_risiko || '',
    o.is_hipo ? 'Yes' : 'No',
    o.stop_work ? 'Yes' : 'No',
    o.status || '',
    o.pic_assigned || '',
    o.deskripsi || '',
    o.rekomendasi || '',
    fmtDate(o.closed_date),
  ])

  return { headers, rows }
}

function periodSummaryRows(observations, { title, from, to }) {
  const hipo = observations.filter((o) => o.is_hipo).length
  const open = observations.filter((o) => isOpenStatus(o.status)).length
  const closed = observations.filter((o) => o.status === 'Closed').length
  const unclassified = observations.filter((o) => isUnclassifiedObservation(o)).length
  return [
    ['Report', title || 'SOC report'],
    ['From', from || ''],
    ['To', to || ''],
    ['Generated', fmtDateTime(new Date())],
    ['Total SOC', String(observations.length)],
    ['HiPo', String(hipo)],
    ['Open / active', String(open)],
    ['Closed', String(closed)],
    ['Unclassified', String(unclassified)],
  ]
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cellXml(value, wrap = false) {
  const text = xmlEscape(value).replace(/\r\n|\n|\r/g, '&#10;')
  const wrapAttr = wrap ? ' ss:StyleID="wrap"' : ''
  return `<Cell${wrapAttr}><Data ss:Type="String">${text}</Data></Cell>`
}

function sheetXml(name, tableInner) {
  return ` <Worksheet ss:Name="${xmlEscape(name)}">
  <Table>
   ${tableInner}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>`
}

function workbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#F37021" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="wrap">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
  </Style>
 </Styles>
${sheets.join('\n')}
</Workbook>`
}

function socListTable(observations) {
  const { headers, rows } = observationRows(observations)
  const colWidths = [42, 22, 28, 16, 22, 22, 22, 24, 18, 10, 12, 16, 18, 56, 40, 16]
  const cols = colWidths.map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w * 5.2}" />`).join('')
  const headerRow = `<Row ss:StyleID="header">${headers.map((h) => cellXml(h)).join('')}</Row>`
  const body = rows
    .map(
      (r) =>
        `<Row>${r
          .map((v, i) => cellXml(v, i === 13 || i === 14))
          .join('')}</Row>`,
    )
    .join('')
  return `${cols}${headerRow}${body}`
}

/** Excel (.xls) — SOC list. Optional period summary sheet for weekly/monthly packs. */
export function exportObservationsExcel(observations, filename = 'bact-soc-report.xls', options = {}) {
  const listSheet = sheetXml('SOC Reports', socListTable(observations))
  const sheets = []
  if (options.from || options.to || options.title) {
    const summaryTable = periodSummaryRows(observations, options)
      .map((r) => `<Row>${cellXml(r[0])}${cellXml(r[1])}</Row>`)
      .join('')
    sheets.push(sheetXml('Summary', `<Column ss:Width="140" /><Column ss:Width="220" />${summaryTable}`))
  }
  sheets.push(listSheet)

  const blob = new Blob(['\uFEFF' + workbookXml(sheets)], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function exportPeriodReportExcel(observations, { from, to, period = 'custom' } = {}) {
  const title = period === 'weekly' ? 'Weekly SOC Report' : period === 'monthly' ? 'Monthly SOC Report' : 'SOC Report'
  const filename = `bact-soc-${period}-${from || 'from'}-to-${to || 'to'}.xls`
  exportObservationsExcel(observations, filename, { title, from, to })
}

export function exportObservationsCsv(observations, filename = 'laporan-soc-bact.csv') {
  const { headers, rows } = observationRows(observations)
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function avgDaysToClose(observations) {
  const closed = observations.filter((o) => o.status === 'Closed' && o.created_at)
  if (!closed.length) return null
  const totalDays = closed.reduce((sum, o) => {
    const start = new Date(o.created_at)
    const end = o.closed_date ? new Date(o.closed_date) : new Date(o.updated_at || o.created_at)
    return sum + (end - start) / (1000 * 60 * 60 * 24)
  }, 0)
  return Math.round(totalDays / closed.length)
}

export function countOverdueCapa(capaList) {
  const today = new Date().toISOString().slice(0, 10)
  return capaList.filter(
    (c) => c.due_date && c.due_date < today && c.status !== 'Completed' && c.status !== 'Verified',
  ).length
}
