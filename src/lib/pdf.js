import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'
import { categoryLabel } from './constants'
import {
  buildInvestigationNarrative,
  buildSocNarrativeEn,
  buildSocNarrativeId,
} from './pdfNarrative'
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

function fmtDateEn(d) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtExportDate() {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
    ['Kepada / To', obs.pdf_to || `Management ${obs.nama_perusahaan || 'PT. BACT'} / Tim HSSE`],
    ['Nomor SOC', soc],
    ['Tanggal / Date', fmtDateEn(obs.created_at || obs.tanggal_waktu)],
    [
      'Perihal / Subject',
      `Safety Observation — ${categoryLabel(obs.kategori)} — ${obs.is_anonymous ? 'Anonim' : obs.nama_pelapor}`,
    ],
    ['Status', obs.status || 'Open'],
    ['PIC / Assigned', obs.pdf_pic || obs.pic_assigned || '—'],
  ]

  let y = startY
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

function ensureSpace(doc, y, need, margin = 12) {
  if (y + need > 278) {
    doc.addPage()
    drawBorder(doc, margin)
    return margin + 10
  }
  return y
}

function drawWrapped(doc, text, x, y, maxW, lineH = 3.6) {
  const lines = doc.splitTextToSize(String(text || ''), maxW)
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH + 1)
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

function drawBilingualNoticeBody(doc, obs, startY) {
  const margin = 12
  const gap = 4
  const colW = (210 - margin * 2 - 8 - gap) / 2
  const xId = margin + 4
  const xEn = xId + colW + gap
  const id = buildSocNarrativeId(obs)
  const en = buildSocNarrativeEn(obs)

  let y = startY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Bahasa Indonesia', xId, y)
  doc.text('English', xEn, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  // Track both columns independently then sync
  let yId = y
  let yEn = y

  const writePair = (textId, textEn) => {
    const start = Math.max(yId, yEn)
    yId = start
    yEn = start
    const beforeId = yId
    const beforeEn = yEn
    // measure by writing to temp - just write sequentially with sync after each block
    const linesId = doc.splitTextToSize(textId, colW)
    const linesEn = doc.splitTextToSize(textEn, colW)
    const blockH = Math.max(linesId.length, linesEn.length) * 3.6 + 4
    yId = ensureSpace(doc, start, blockH)
    yEn = yId
    doc.text(linesId, xId, yId)
    doc.text(linesEn, xEn, yEn)
    const next = yId + Math.max(linesId.length, linesEn.length) * 3.6 + 4
    yId = next
    yEn = next
    void beforeId
    void beforeEn
  }

  writePair(id.intro, en.intro)
  writePair(id.classification, en.classification)

  y = Math.max(yId, yEn)
  y = ensureSpace(doc, y, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Tindakan yang telah dilakukan:', xId, y)
  doc.text('Actions Taken:', xEn, y)
  y += 5
  doc.setFont('helvetica', 'normal')

  const maxActions = Math.max(id.actions.length, en.actions.length)
  for (let i = 0; i < maxActions; i++) {
    const aId = id.actions[i] ? `${i + 1}. ${id.actions[i]}` : ''
    const aEn = en.actions[i] ? `${i + 1}. ${en.actions[i]}` : ''
    const linesId = doc.splitTextToSize(aId, colW)
    const linesEn = doc.splitTextToSize(aEn, colW)
    const h = Math.max(linesId.length, linesEn.length) * 3.6 + 2
    y = ensureSpace(doc, y, h)
    if (aId) doc.text(linesId, xId, y)
    if (aEn) doc.text(linesEn, xEn, y)
    y += h
  }

  y += 2
  yId = y
  yEn = y
  writePair(id.closing, en.closing)
  return Math.max(yId, yEn)
}

function drawClosingAndSignature(doc, y) {
  const margin = 12
  y = ensureSpace(doc, y, 40)
  y = Math.max(y, 235)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('Hormat kami / Sincerely,', margin + 4, y)
  doc.text('Tim HSSE / HSSE Team', margin + 4, y + 16)
  doc.text('Health and Safety Officer', margin + 4, y + 22)
  doc.text('Batu Ampar Container Terminal', margin + 4, y + 28)

  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.text(`Tanggal export: ${fmtExportDate()}`, 210 - margin - 4, 285, { align: 'right' })
}

/** Report 1 — PDF SOC (gaya Notice padat bilingual) */
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
  y = drawBilingualNoticeBody(doc, obs, y)
  drawClosingAndSignature(doc, y + 6)

  doc.save(`SOC-${soc}.pdf`)
}

function drawSectionTitle(doc, title, y, margin = 12) {
  y = ensureSpace(doc, y, 10, margin)
  doc.setDrawColor(243, 112, 33)
  doc.setLineWidth(0.6)
  doc.line(margin + 4, y + 1.5, margin + 8, y + 1.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(title, margin + 10, y + 2)
  return y + 8
}

function drawLabeledBlock(doc, label, text, y, margin = 12) {
  if (!text) return y
  y = ensureSpace(doc, y, 12, margin)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40, 40, 40)
  doc.text(label, margin + 4, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  y = drawWrapped(doc, text, margin + 4, y, 210 - margin * 2 - 8, 3.7)
  return y + 3
}

/** Report 2 — PDF investigasi mendalam (isi penuh) */
export async function exportInvestigationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 12
  const logo = await loadLogoDataUrl()
  const soc = resolveSocNumber(obs)
  const n = buildInvestigationNarrative(obs)
  const inv = n.inv

  drawBorder(doc, margin)
  drawHeader(doc, logo, margin)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('INVESTIGATION REPORT', 105, margin + 22, { align: 'center' })
  doc.setFontSize(10)
  doc.text('LAPORAN HASIL INVESTIGASI SOC', 105, margin + 28, { align: 'center' })

  let y = drawMetaTable(doc, obs, margin + 34)

  y = drawSectionTitle(doc, 'A. Ringkasan Investigasi / Investigation Summary', y)
  y = drawLabeledBlock(doc, 'Bahasa Indonesia', n.ringkasanId, y)
  y = drawLabeledBlock(doc, 'English', n.ringkasanEn, y)
  y = drawLabeledBlock(
    doc,
    'Klasifikasi',
    `${categoryLabel(obs.kategori)} · Risiko ${obs.tingkat_risiko || '—'} · HiPo: ${obs.is_hipo ? 'Ya' : 'Tidak'} · Stop Work: ${obs.stop_work ? 'Ya' : 'Tidak'}`,
    y,
  )

  y = drawSectionTitle(doc, 'B. Analisis Root Cause — 5W + 1H (Deep Dive)', y)
  y = drawLabeledBlock(
    doc,
    'WHAT (Apa insiden/potensi bahaya utama?)',
    inv.what ||
      `Observasi ${categoryLabel(obs.kategori)} di ${obs.lokasi_teks}: ${obs.deskripsi || '—'}`,
    y,
  )
  y = drawLabeledBlock(
    doc,
    'WHERE (Lokasi spesifik & kerentanan area)',
    inv.where ||
      `Lokasi: ${obs.lokasi_teks || '—'}. Area operasional Batu Ampar Container Terminal dengan paparan aktivitas bongkar muat / pergerakan alat.`,
    y,
  )
  y = drawLabeledBlock(
    doc,
    'WHEN (Waktu kejadian & pengawasan terakhir)',
    inv.when ||
      `Kejadian dilaporkan pada ${fmtDateEn(obs.tanggal_waktu || obs.created_at)}. Interval pengawasan terakhir perlu diverifikasi terhadap jadwal patrol HSSE dan pengawas area.`,
    y,
  )
  y = drawLabeledBlock(
    doc,
    'WHY (Mengapa bahaya muncul tanpa terdeteksi)',
    inv.why ||
      'Indikasi adanya celah pada deteksi dini, komunikasi risiko, dan/atau kepatuhan terhadap prosedur operasional standar di lokasi.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'HOW (Bagaimana bahaya berkembang hingga eskalasi / Stop Work)',
    inv.how ||
      (obs.stop_work
        ? 'Kondisi berkembang hingga memerlukan Stop Work Authority agar pekerjaan tidak berlanjut dalam kondisi tidak aman.'
        : 'Kondisi teridentifikasi melalui pelaporan SOC sebelum sempat berkembang menjadi insiden lebih serius.'),
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Ringkasan 5W+1H (kalimat hasil)',
    n.summary5 ||
      `Observasi di ${obs.lokasi_teks} terkait ${obs.deskripsi || 'kondisi/tindakan tidak aman'} telah dianalisis melalui pendekatan 5W+1H untuk memetakan fakta dan titik kegagalan pengendalian.`,
    y,
  )

  y = drawSectionTitle(doc, 'C. Deep Dive Analysis — 5 Whys', y)
  y = drawLabeledBlock(
    doc,
    'Why 1 (Gejala Lapangan)',
    inv.why1 ||
      `Mengapa kondisi/tindakan tersebut muncul di lapangan? Karena ${obs.deskripsi || 'praktik atau kondisi tidak aman teridentifikasi di area kerja'}.`,
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Why 2 (Kegagalan Pemeriksaan)',
    inv.why2 ||
      'Mengapa kondisi berisiko masih dapat berlangsung? Karena pemeriksaan pra-operasional / pengawasan area belum sepenuhnya menangkap penyimpangan tersebut.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Why 3 (Kegagalan Prosedur / Individu)',
    inv.why3 ||
      'Mengapa prosedur atau perilaku individu tidak mencegah kejadian sejak awal? Karena pemahaman, disiplin, atau penerapan SOP di titik kerja masih perlu diperkuat.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Why 4 (Kegagalan Pengawasan & Kontrol)',
    inv.why4 ||
      'Mengapa pengawasan dan kontrol manajemen/mitra belum memadai? Karena frekuensi monitoring, verifikasi lapangan, atau standar kelayakan pihak terkait belum konsisten.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Why 5 (Akar Masalah Sistemik)',
    inv.why5 ||
      'Mengapa sistem pengendalian risiko belum efektif secara menyeluruh? Karena tata kelola risiko operasional masih memiliki celah pada deteksi, eskalasi, dan penegakan standar keselamatan.',
    y,
  )

  y = drawSectionTitle(doc, 'D. Kesimpulan & Tindak Lanjut', y)
  y = drawLabeledBlock(
    doc,
    'Root Cause (Akar Masalah Utama)',
    inv.root_cause ||
      obs.root_cause ||
      'Akar masalah mengarah pada lemahnya kombinasi deteksi dini, kepatuhan SOP, dan pengawasan operasional di area terdampak.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Corrective Action',
    inv.corrective_action ||
      'Perkuat briefing/safety induction, perketat pengawasan area, pastikan kepatuhan SOP, dan verifikasi efektivitas tindakan sebelum area dinyatakan aman kembali.',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Finding Observation',
    n.finding || obs.deskripsi || '—',
    y,
  )
  y = drawLabeledBlock(
    doc,
    'Recommendation',
    n.recommendation ||
      'Lakukan monitoring berkala, refreshment safety awareness, dan evaluasi kontrol operasional agar kejadian serupa tidak berulang.',
    y,
  )
  y = drawLabeledBlock(doc, 'Investigator', n.investigator, y)

  const idClose = buildSocNarrativeId(obs).closing
  const enClose = buildSocNarrativeEn(obs).closing
  y = drawLabeledBlock(doc, 'Penutup (ID)', idClose, y)
  y = drawLabeledBlock(doc, 'Closing (EN)', enClose, y)

  drawClosingAndSignature(doc, y + 4)
  doc.save(`SOC-Investigasi-${soc}.pdf`)
}
