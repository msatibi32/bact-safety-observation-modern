import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'
import { categoryLabel, isUnclassifiedObservation } from './constants'
import { buildSummary5W1H, parseInvestigationData } from './investigation'
import { resolveSocNumber } from './socNumber'

const LOGO_PATH = BRANDING.logoPdfSrc || '/logo/BACT Logo_OG Black Text.png'
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

function fmtExportDate() {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function riskLabel(level) {
  if (level === 'High') return 'Tinggi / High'
  if (level === 'Medium') return 'Sedang / Medium'
  if (level === 'Low') return 'Rendah / Low'
  return 'Belum diklasifikasi / Unclassified'
}

function buildNarrativeId(obs) {
  const reporter = obs.is_anonymous ? 'Pelapor anonim' : obs.nama_pelapor
  const unclassified = isUnclassifiedObservation(obs)
  const lines = [
    `Pada ${fmtDateId(obs.tanggal_waktu)}, di lokasi ${obs.lokasi_teks}, telah dilaporkan observasi keselamatan oleh ${reporter} (${obs.departemen}, ${obs.nama_perusahaan}).`,
    unclassified
      ? 'Kategori dan tingkat risiko belum diklasifikasi oleh HSE.'
      : `Kategori: ${obs.kategori}. Tingkat risiko aktual: ${riskLabel(obs.tingkat_risiko)}.${obs.is_hipo ? ' Laporan diklasifikasikan sebagai HiPo (High Potential).' : ''}`,
    obs.stop_work ? 'Pekerjaan di area tersebut telah dihentikan sementara (Stop Work).' : '',
    '',
    `Deskripsi kejadian: ${obs.deskripsi}`,
  ]
  if (obs.finding_observation) lines.push('', `Finding: ${obs.finding_observation}`)
  if (obs.rekomendasi) lines.push('', `Rekomendasi: ${obs.rekomendasi}`)
  return lines.filter((l) => l !== undefined).join('\n')
}

function buildNarrativeEn(obs) {
  const reporter = obs.is_anonymous ? 'Anonymous reporter' : obs.nama_pelapor
  const unclassified = isUnclassifiedObservation(obs)
  const lines = [
    `On ${fmtDateEn(obs.tanggal_waktu)}, at ${obs.lokasi_teks}, a safety observation was reported by ${reporter} (${obs.departemen}, ${obs.nama_perusahaan}).`,
    unclassified
      ? 'Category and risk level have not yet been classified by HSE.'
      : `Category: ${obs.kategori}. Actual risk level: ${obs.tingkat_risiko}.${obs.is_hipo ? ' Classified as HiPo (High Potential).' : ''}`,
    obs.stop_work ? 'Work in the area was temporarily stopped (Stop Work Authority).' : '',
    '',
    `Description: ${obs.deskripsi}`,
  ]
  if (obs.finding_observation) lines.push('', `Finding: ${obs.finding_observation}`)
  if (obs.rekomendasi) lines.push('', `Recommendation: ${obs.rekomendasi}`)
  return lines.filter((l) => l !== undefined).join('\n')
}

function drawBorder(doc, margin = 12) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.rect(margin, margin, 210 - margin * 2, 297 - margin * 2)
}

function drawHeader(doc, logo, margin = 12) {
  if (logo) {
    doc.addImage(logo, 'PNG', margin + 4, margin + 4, 38, 12)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('BATU AMPAR CONTAINER TERMINAL', margin + 44, margin + 11)
}

function drawMetaTable(doc, obs, startY) {
  const margin = 12
  const labelW = 42
  const x0 = margin + 4
  const x1 = x0 + labelW
  const w = 210 - margin * 2 - 8 - labelW
  const soc = resolveSocNumber(obs)
  const rows = [
    ['Kepada / To', obs.pdf_to || '—'],
    ['Nomor SOC', soc],
    ['Tanggal / Date', fmtDateEn(obs.created_at || obs.tanggal_waktu)],
    [
      'Perihal / Subject',
      `Safety Observation — ${categoryLabel(obs.kategori)} — ${obs.is_anonymous ? 'Anonim' : obs.nama_pelapor}`,
    ],
    ['Status', obs.status || 'Open'],
    ['PIC / Assigned', obs.pdf_pic || '—'],
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
  if (obs.pic_assigned) followUp.push(`Departemen follow-up: ${obs.pic_assigned}`)
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
    }
  }

  return y
}

function drawClosingAndSignature(doc, y) {
  const margin = 12
  if (y > 220) {
    doc.addPage()
    drawBorder(doc, margin)
    y = margin + 10
  }

  const closing = BRANDING.pdfClosingLine || ''
  if (closing) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(closing, 210 - margin * 2 - 8)
    doc.text(lines, margin + 4, y)
    y += lines.length * 3.8 + 10
  }

  y = Math.max(y, 230)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('Hormat kami / Sincerely,', margin + 4, y)
  doc.text('Tim HSSE / HSSE Team', margin + 4, y + 14)
  doc.text('Batu Ampar Container Terminal', margin + 4, y + 20)

  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.text(`Tanggal export: ${fmtExportDate()}`, 210 - margin - 4, 285, { align: 'right' })
}

/** Report 1 — PDF SOC harian (Notice of Safety Observation) */
export async function exportObservationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 12
  const logo = await loadLogoDataUrl()
  const soc = resolveSocNumber(obs)

  drawBorder(doc, margin)
  drawHeader(doc, logo, margin)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(0, 0, 0)
  doc.text('NOTICE OF SAFETY OBSERVATION', 105, margin + 22, { align: 'center' })
  doc.setFontSize(10)
  doc.text('LAPORAN OBSERVASI KESELAMATAN', 105, margin + 28, { align: 'center' })

  let y = drawMetaTable(doc, obs, margin + 34)
  y = drawBilingualBody(doc, obs, y)
  drawClosingAndSignature(doc, y + 8)

  doc.save(`SOC-${soc}.pdf`)
}

function ensureSpace(doc, y, need, margin = 12) {
  if (y + need > 280) {
    doc.addPage()
    drawBorder(doc, margin)
    return margin + 10
  }
  return y
}

function drawSectionTitle(doc, title, y, margin = 12) {
  y = ensureSpace(doc, y, 10, margin)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(title, margin + 4, y)
  return y + 6
}

function drawLabeledBlock(doc, label, text, y, margin = 12) {
  if (!text) return y
  y = ensureSpace(doc, y, 14, margin)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(label, margin + 4, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(String(text), 210 - margin * 2 - 8)
  for (let i = 0; i < lines.length; i++) {
    y = ensureSpace(doc, y, 5, margin)
    doc.text(lines[i], margin + 4, y)
    y += 3.8
  }
  return y + 3
}

/** Report 2 — PDF hasil investigasi mendalam */
export async function exportInvestigationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 12
  const logo = await loadLogoDataUrl()
  const soc = resolveSocNumber(obs)
  const inv = parseInvestigationData(obs)

  drawBorder(doc, margin)
  drawHeader(doc, logo, margin)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('INVESTIGATION REPORT', 105, margin + 22, { align: 'center' })
  doc.setFontSize(10)
  doc.text('LAPORAN HASIL INVESTIGASI SOC', 105, margin + 28, { align: 'center' })

  let y = drawMetaTable(doc, obs, margin + 34)

  y = drawSectionTitle(doc, 'Ringkasan kejadian', y)
  y = drawLabeledBlock(doc, 'Lokasi', obs.lokasi_teks, y)
  y = drawLabeledBlock(doc, 'Deskripsi', obs.deskripsi, y)
  y = drawLabeledBlock(doc, 'Stop Work', obs.stop_work ? 'Ya' : 'Tidak', y)

  y = drawSectionTitle(doc, '1. Analisis 5W + 1H', y + 2)
  y = drawLabeledBlock(doc, 'WHAT', inv.what, y)
  y = drawLabeledBlock(doc, 'WHERE', inv.where, y)
  y = drawLabeledBlock(doc, 'WHEN', inv.when, y)
  y = drawLabeledBlock(doc, 'WHY', inv.why, y)
  y = drawLabeledBlock(doc, 'HOW', inv.how, y)
  y = drawLabeledBlock(doc, 'Ringkasan', inv.summary_5w1h || buildSummary5W1H(inv), y)

  y = drawSectionTitle(doc, '2. Deep Dive — 5 Whys', y + 2)
  y = drawLabeledBlock(doc, 'Why 1', inv.why1, y)
  y = drawLabeledBlock(doc, 'Why 2', inv.why2, y)
  y = drawLabeledBlock(doc, 'Why 3', inv.why3, y)
  y = drawLabeledBlock(doc, 'Why 4', inv.why4, y)
  y = drawLabeledBlock(doc, 'Why 5', inv.why5, y)

  y = drawSectionTitle(doc, '3. Kesimpulan', y + 2)
  y = drawLabeledBlock(doc, 'Root Cause', inv.root_cause || obs.root_cause, y)
  y = drawLabeledBlock(doc, 'Corrective Action', inv.corrective_action, y)
  y = drawLabeledBlock(doc, 'Investigator', inv.investigator_name || obs.investigator_name, y)
  y = drawLabeledBlock(doc, 'Finding Observation', obs.finding_observation, y)
  y = drawLabeledBlock(doc, 'Recommendation', obs.rekomendasi, y)

  drawClosingAndSignature(doc, y + 6)
  doc.save(`SOC-Investigasi-${soc}.pdf`)
}
