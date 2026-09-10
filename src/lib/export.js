import { categoryLabel, isUnclassifiedObservation } from './constants'
import { resolveSocNumber } from './socNumber'

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
    'Nomor SOC',
    'Tanggal',
    'Pelapor',
    'ID Karyawan',
    'Departemen',
    'Perusahaan',
    'Lokasi',
    'Kategori',
    'Risiko',
    'HiPo',
    'Stop Work',
    'Status',
    'PIC',
    'Deskripsi',
    'Rekomendasi',
    'Tanggal Tutup',
  ]

  const rows = observations.map((o) => [
    resolveSocNumber(o, observations),
    fmtDateTime(o.tanggal_waktu),
    o.nama_pelapor || '',
    o.employee_id || '',
    o.departemen || '',
    o.nama_perusahaan || '',
    o.lokasi_teks || '',
    categoryLabel(o.kategori),
    isUnclassifiedObservation(o) ? 'Belum diklasifikasi' : o.tingkat_risiko || '',
    o.is_hipo ? 'Ya' : 'Tidak',
    o.stop_work ? 'Ya' : 'Tidak',
    o.status || '',
    o.pic_assigned || '',
    o.deskripsi || '',
    o.rekomendasi || '',
    fmtDate(o.closed_date),
  ])

  return { headers, rows }
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

/** Excel asli (.xls) — kolom terpisah, tidak numpuk jadi 1 sel seperti CSV di Excel Indonesia. */
export function exportObservationsExcel(observations, filename = 'laporan-soc-bact.xls') {
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
 <Worksheet ss:Name="Laporan SOC">
  <Table>
   ${cols}
   ${headerRow}
   ${body}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`

  const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  downloadBlob(blob, filename)
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
