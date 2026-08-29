import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'

const LOGO_PATH = '/logo/BACT Logo_Orange.png'
let cachedLogoData = null

async function loadLogoDataUrl() {
  if (cachedLogoData) return cachedLogoData
  try {
    const res = await fetch(LOGO_PATH)
    const blob = await res.blob()
    cachedLogoData = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return cachedLogoData
  } catch {
    return null
  }
}

function docNo(obs) {
  const n = obs.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  const d = new Date(obs.created_at || obs.tanggal_waktu)
  const month = d.toLocaleString('en-US', { month: 'short' })
  return `${n}/SOC/BACT/HSSE/${month}/${d.getFullYear()}`
}

function fmtDateId(d) {
  return new Date(d).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDateEn(d) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function riskLabel(level) {
  if (level === 'High') return 'Tinggi / High'
  if (level === 'Medium') return 'Sedang / Medium'
  return 'Rendah / Low'
}

function buildNarrativeId(obs) {
  const reporter = obs.is_anonymous ? 'Pelapor anonim' : obs.nama_pelapor
  const lines = [
    `Pada ${fmtDateId(obs.tanggal_waktu)}, di lokasi ${obs.lokasi_teks}, telah dilaporkan observasi keselamatan kategori "${obs.kategori}" oleh ${reporter} (${obs.departemen}, ${obs.nama_perusahaan}).`,
    `Tingkat risiko aktual: ${riskLabel(obs.tingkat_risiko)}. Potensi risiko: ${riskLabel(obs.potensi_risiko || obs.tingkat_risiko)}.${obs.is_hipo ? ' Laporan diklasifikasikan sebagai HiPo (High Potential).' : ''}`,
    obs.life_saving_rule && obs.life_saving_rule !== 'Tidak terkait'
      ? `Terkait IOGP Life Saving Rule: ${obs.life_saving_rule}.`
      : '',
    obs.stop_work ? 'Pekerjaan di area tersebut telah dihentikan sementara (Stop Work).' : '',
    '',
    `Deskripsi kejadian: ${obs.deskripsi}`,
  ]
  if (obs.tindakan_langsung) lines.push('', `Tindakan langsung: ${obs.tindakan_langsung}`)
  if (obs.rekomendasi) lines.push('', `Rekomendasi: ${obs.rekomendasi}`)
  return lines.filter(Boolean).join('\n')
}

function buildNarrativeEn(obs) {
  const reporter = obs.is_anonymous ? 'Anonymous reporter' : obs.nama_pelapor
  const lines = [
    `On ${fmtDateEn(obs.tanggal_waktu)}, at ${obs.lokasi_teks}, a safety observation categorized as "${obs.kategori}" was reported by ${reporter} (${obs.departemen}, ${obs.nama_perusahaan}).`,
    `Actual risk level: ${obs.tingkat_risiko}. Potential risk: ${obs.potensi_risiko || obs.tingkat_risiko}.${obs.is_hipo ? ' Classified as HiPo (High Potential).' : ''}`,
    obs.life_saving_rule && obs.life_saving_rule !== 'Tidak terkait'
      ? `Related IOGP Life Saving Rule: ${obs.life_saving_rule}.`
      : '',
    obs.stop_work ? 'Work in the area was temporarily stopped (Stop Work Authority).' : '',
    '',
    `Description: ${obs.deskripsi}`,
  ]
  if (obs.tindakan_langsung) lines.push('', `Immediate action: ${obs.tindakan_langsung}`)
  if (obs.rekomendasi) lines.push('', `Recommendation: ${obs.rekomendasi}`)
  return lines.filter(Boolean).join('\n')
}

function drawBorder(doc, margin = 12) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.rect(margin, margin, 210 - margin * 2, 297 - margin * 2)
}

function drawMetaTable(doc, obs, startY) {
  const margin = 12
  const labelW = 42
  const x0 = margin + 4
  const x1 = x0 + labelW
  const w = 210 - margin * 2 - 8 - labelW
  const rows = [
    ['Kepada / To', `Management ${obs.nama_perusahaan || 'PT. BACT'} / Tim HSSE`],
    ['Document No.', docNo(obs)],
    ['Tanggal / Date', fmtDateEn(obs.created_at || obs.tanggal_waktu)],
    ['Perihal / Subject', `Safety Observation — ${obs.kategori} — ${obs.is_anonymous ? 'Anonim' : obs.nama_pelapor}`],
    ['Status', obs.status || 'Open'],
    ['PIC / Assigned', obs.pic_assigned || '—'],
  ]

  let y = startY
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  for (const [label, value] of rows) {
    const lines = doc.splitTextToSize(String(value), w)
    const h = Math.max(7, lines.length * 4.5 + 2)
    doc.setDrawColor(180, 180, 180)
    doc.rect(x0, y, labelW, h)
    doc.rect(x1, y, w, h)
    doc.setFont('helvetica', 'bold')
    doc.text(label, x0 + 2, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.text(lines, x1 + 2, y + 5)
    y += h
  }
  return y + 4
}

function drawBilingualBody(doc, obs, startY) {
  const margin = 12
  const colW = (210 - margin * 2 - 12) / 2
  const xId = margin + 4
  const xEn = xId + colW + 4
  const maxH = 250 - startY

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Bahasa Indonesia', xId, startY)
  doc.text('English', xEn, startY)

  doc.setFont('helvetica', 'normal')
  const idLines = doc.splitTextToSize(buildNarrativeId(obs), colW)
  const enLines = doc.splitTextToSize(buildNarrativeEn(obs), colW)
  doc.text(idLines, xId, startY + 5)
  doc.text(enLines, xEn, startY + 5)

  let y = startY + 5 + Math.max(idLines.length, enLines.length) * 3.8 + 6

  const followUp = []
  if (obs.triage_notes) followUp.push(`Triage HSE: ${obs.triage_notes}`)
  if (obs.investigation_notes) followUp.push(`Investigasi: ${obs.investigation_notes}`)
  if (obs.root_cause) followUp.push(`Root cause: ${obs.root_cause}`)
  if (obs.catatan_penutupan) followUp.push(`Penutupan: ${obs.catatan_penutupan}`)
  if (obs.lokasi_gps) {
    followUp.push(`GPS: ${obs.lokasi_gps.lat.toFixed(6)}, ${obs.lokasi_gps.lng.toFixed(6)}`)
  }

  if (followUp.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Tindak Lanjut / Follow-up:', margin + 4, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    for (const item of followUp) {
      const lines = doc.splitTextToSize(`• ${item}`, 210 - margin * 2 - 8)
      doc.text(lines, margin + 6, y)
      y += lines.length * 3.8 + 1
      if (y > maxH) break
    }
  }

  return y
}

function drawSignature(doc, obs, y) {
  const margin = 12
  if (y > 240) {
    doc.addPage()
    drawBorder(doc, margin)
    y = margin + 10
  }
  y = Math.max(y, 230)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('Hormat kami / Sincerely,', margin + 4, y)
  doc.text('Tim HSSE / HSSE Team', margin + 4, y + 14)
  doc.text(BRANDING.legalName, margin + 4, y + 20)
  doc.text('Batu Ampar Container Terminal', margin + 4, y + 26)
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(`Dokumen digital SOC · Ref: ${obs.id.slice(0, 8).toUpperCase()}`, margin + 4, 285)
}

export async function exportObservationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 12
  const logo = await loadLogoDataUrl()

  drawBorder(doc, margin)

  if (logo) {
    doc.addImage(logo, 'PNG', margin + 4, margin + 4, 38, 12)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text('BATU AMPAR CONTAINER TERMINAL', margin + 44, margin + 9)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('An ICTSI Group Company', margin + 44, margin + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('NOTICE OF SAFETY OBSERVATION', 105, margin + 22, { align: 'center' })
  doc.setFontSize(10)
  doc.text('LAPORAN OBSERVASI KESELAMATAN', 105, margin + 28, { align: 'center' })

  let y = drawMetaTable(doc, obs, margin + 34)
  y = drawBilingualBody(doc, obs, y)
  drawSignature(doc, obs, y + 8)

  doc.save(`SOC-Notice-${obs.id.slice(0, 8)}.pdf`)
}
