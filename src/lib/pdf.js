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
const MARGIN = 14
const PAGE_BOTTOM = 280
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

function contentWidth() {
  return 210 - MARGIN * 2
}

function drawPageFrame(doc) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(MARGIN, MARGIN, contentWidth(), 297 - MARGIN * 2)
}

function ensureSpace(doc, y, need) {
  if (y + need > PAGE_BOTTOM) {
    doc.addPage()
    drawPageFrame(doc)
    return MARGIN + 8
  }
  return y
}

/** Header mirip Notice: logo kiri + judul tengah + kotak Document No kanan */
function drawNoticeHeader(doc, logo, title, obs) {
  const top = MARGIN
  const innerX = MARGIN
  const innerW = contentWidth()
  const headerH = 28
  const metaBoxW = 58
  const leftW = innerW - metaBoxW

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.rect(innerX, top, innerW, headerH)
  doc.line(innerX + leftW, top, innerX + leftW, top + headerH)

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', innerX + 3, top + 4, 32, 10)
    } catch {
      /* ignore */
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(0, 0, 0)
  doc.text('BATU AMPAR CONTAINER TERMINAL', innerX + 3, top + 18)

  doc.setFontSize(11)
  const titleLines = doc.splitTextToSize(title, leftW - 10)
  const titleY = top + 12 - ((titleLines.length - 1) * 4) / 2
  doc.text(titleLines, innerX + leftW / 2, titleY, { align: 'center' })

  const soc = resolveSocNumber(obs)
  const boxX = innerX + leftW
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('Document No.', boxX + 2, top + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const docLines = doc.splitTextToSize(soc, metaBoxW - 4)
  doc.text(docLines, boxX + 2, top + 10)

  doc.setFont('helvetica', 'bold')
  doc.text('Effective Date', boxX + 2, top + 18)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDateEn(obs.created_at || obs.tanggal_waktu), boxX + 2, top + 22)

  return top + headerH
}

/** Tabel Kepada / Tanggal / Perihal (gaya Notice) */
function drawRecipientTable(doc, obs, startY) {
  const x0 = MARGIN
  const labelW = 38
  const valueW = contentWidth() - labelW
  const soc = resolveSocNumber(obs)
  const rows = [
    ['Kepada / To', obs.pdf_to || `Management of ${obs.nama_perusahaan || 'PT. BACT'}`],
    ['Tanggal / Date', fmtDateEn(obs.tanggal_waktu || obs.created_at)],
    [
      'Perihal / Subject',
      `Safety Observation – ${obs.is_anonymous ? 'Anonymous' : obs.nama_pelapor || '—'} (${categoryLabel(obs.kategori)})`,
    ],
    ['Nomor SOC', soc],
    ['PIC / Assigned', obs.pdf_pic || obs.pic_assigned || '—'],
  ]

  let y = startY
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)

  for (const [label, value] of rows) {
    const lines = doc.splitTextToSize(String(value), valueW - 4)
    const h = Math.max(7, lines.length * 4 + 3)
    doc.rect(x0, y, labelW, h)
    doc.rect(x0 + labelW, y, valueW, h)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label, x0 + 2, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(lines, x0 + labelW + 2, y + 5)
    y += h
  }
  return y + 5
}

/**
 * Badan bilingual sejajar: kiri ID, kanan EN — tanpa label "Bahasa Indonesia/English"
 * seperti contoh Notice of Safety Violation.
 */
function drawBilingualColumns(doc, obs, startY) {
  const gap = 5
  const colW = (contentWidth() - gap - 4) / 2
  const xId = MARGIN + 2
  const xEn = xId + colW + gap
  const lineH = 3.55
  const id = buildSocNarrativeId(obs)
  const en = buildSocNarrativeEn(obs)

  let y = startY

  const writeSynced = (textId, textEn, { bold = false, size = 8.5 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const linesId = doc.splitTextToSize(textId || '', colW)
    const linesEn = doc.splitTextToSize(textEn || '', colW)
    const rows = Math.max(linesId.length, linesEn.length)
    y = ensureSpace(doc, y, rows * lineH + 3)
    for (let i = 0; i < rows; i++) {
      if (linesId[i]) doc.text(linesId[i], xId, y)
      if (linesEn[i]) doc.text(linesEn[i], xEn, y)
      y += lineH
    }
    y += 3.2
  }

  writeSynced(id.intro, en.intro)
  writeSynced(id.classification, en.classification)

  writeSynced('Tindakan yang telah dilakukan:', 'Actions Taken:', { bold: true, size: 9 })

  const n = Math.max(id.actions.length, en.actions.length)
  for (let i = 0; i < n; i++) {
    const bulletId = id.actions[i] ? `${i + 1}. ${id.actions[i]}` : ''
    const bulletEn = en.actions[i] ? `${i + 1}. ${en.actions[i]}` : ''
    writeSynced(bulletId, bulletEn)
  }

  writeSynced(id.closing, en.closing)
  return y
}

function drawSignature(doc, y) {
  y = ensureSpace(doc, y, 42)
  y = Math.max(y + 4, 238)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('Sincerely,', MARGIN + 2, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.text('Tim HSSE', MARGIN + 2, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Health and Safety Officer', MARGIN + 2, y)
  y += 4.5
  doc.text('PT. Batu Ampar Container Terminal', MARGIN + 2, y)

  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  doc.text(`Tanggal export: ${fmtExportDate()}`, 210 - MARGIN - 2, 287, { align: 'right' })
}

/** PDF SOC — layout Notice of Safety Observation (bilingual sejajar) */
export async function exportObservationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadLogoDataUrl()
  const soc = resolveSocNumber(obs)

  drawPageFrame(doc)
  let y = drawNoticeHeader(doc, logo, 'NOTICE OF SAFETY OBSERVATION', obs)
  y = drawRecipientTable(doc, obs, y)
  y = drawBilingualColumns(doc, obs, y)
  drawSignature(doc, y)

  doc.save(`SOC-${soc}.pdf`)
}

function drawSectionBanner(doc, titleId, titleEn, y) {
  const gap = 5
  const colW = (contentWidth() - gap - 4) / 2
  const xId = MARGIN + 2
  const xEn = xId + colW + gap
  y = ensureSpace(doc, y, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(titleId, xId, y)
  doc.text(titleEn, xEn, y)
  y += 2
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.line(xId, y, xId + colW, y)
  doc.line(xEn, y, xEn + colW, y)
  return y + 5
}

function writeInvPair(doc, textId, textEn, y, { bold = false, size = 8 } = {}) {
  const gap = 5
  const colW = (contentWidth() - gap - 4) / 2
  const xId = MARGIN + 2
  const xEn = xId + colW + gap
  const lineH = 3.5
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  const linesId = doc.splitTextToSize(textId || '', colW)
  const linesEn = doc.splitTextToSize(textEn || '', colW)
  const rows = Math.max(linesId.length, linesEn.length)
  y = ensureSpace(doc, y, rows * lineH + 2)
  for (let i = 0; i < rows; i++) {
    if (linesId[i]) doc.text(linesId[i], xId, y)
    if (linesEn[i]) doc.text(linesEn[i], xEn, y)
    y += lineH
  }
  return y + 2.8
}

/** PDF Investigasi — juga bilingual kiri ID / kanan EN */
export async function exportInvestigationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadLogoDataUrl()
  const soc = resolveSocNumber(obs)
  const n = buildInvestigationNarrative(obs)
  const inv = n.inv
  const idN = buildSocNarrativeId(obs)
  const enN = buildSocNarrativeEn(obs)

  drawPageFrame(doc)
  let y = drawNoticeHeader(doc, logo, 'INVESTIGATION REPORT', obs)
  y = drawRecipientTable(doc, obs, y)

  y = drawSectionBanner(doc, 'A. Ringkasan Investigasi', 'A. Investigation Summary', y)
  y = writeInvPair(doc, n.ringkasanId, n.ringkasanEn, y)
  y = writeInvPair(doc, idN.classification, enN.classification, y)

  y = drawSectionBanner(doc, 'B. Analisis 5W + 1H', 'B. 5W + 1H Analysis', y)
  const w5 = [
    [
      'WHAT',
      inv.what || `Observasi ${categoryLabel(obs.kategori)} di ${obs.lokasi_teks}: ${obs.deskripsi || '—'}`,
      inv.what ||
        `${categoryLabel(obs.kategori)} observation at ${obs.lokasi_teks}: ${obs.deskripsi || '—'}`,
    ],
    [
      'WHERE',
      inv.where || `Lokasi: ${obs.lokasi_teks}. Area operasional Batu Ampar Container Terminal.`,
      inv.where || `Location: ${obs.lokasi_teks}. Batu Ampar Container Terminal operational area.`,
    ],
    [
      'WHEN',
      inv.when || `Dilaporkan pada ${fmtDateEn(obs.tanggal_waktu || obs.created_at)}.`,
      inv.when || `Reported on ${fmtDateEn(obs.tanggal_waktu || obs.created_at)}.`,
    ],
    [
      'WHY',
      inv.why ||
        'Terdapat celah pada deteksi dini, komunikasi risiko, dan/atau kepatuhan terhadap prosedur operasional.',
      inv.why ||
        'Gaps were identified in early detection, risk communication, and/or adherence to operational procedures.',
    ],
    [
      'HOW',
      inv.how ||
        (obs.stop_work
          ? 'Kondisi berkembang hingga memerlukan Stop Work Authority.'
          : 'Kondisi teridentifikasi melalui pelaporan SOC sebelum berkembang menjadi insiden lebih serius.'),
      inv.how ||
        (obs.stop_work
          ? 'The condition escalated to the point where Stop Work Authority was required.'
          : 'The condition was identified through the SOC report before escalating into a more serious incident.'),
    ],
  ]
  for (const [label, tId, tEn] of w5) {
    y = writeInvPair(doc, `${label}: ${tId}`, `${label}: ${tEn}`, y)
  }
  y = writeInvPair(
    doc,
    `Ringkasan: ${n.summary5 || idN.intro}`,
    `Summary: ${n.summary5 || enN.intro}`,
    y,
  )

  y = drawSectionBanner(doc, 'C. Deep Dive — 5 Whys', 'C. Deep Dive — 5 Whys', y)
  const whys = [
    [
      inv.why1 ||
        `Why 1 (Gejala lapangan): Kondisi/tindakan muncul karena ${obs.deskripsi || 'praktik tidak aman di area kerja'}.`,
      inv.why1 ||
        `Why 1 (Field symptom): The condition/act arose because ${obs.deskripsi || 'an unsafe practice was present in the work area'}.`,
    ],
    [
      inv.why2 ||
        'Why 2 (Kegagalan pemeriksaan): Pemeriksaan/pengawasan area belum sepenuhnya menangkap penyimpangan.',
      inv.why2 ||
        'Why 2 (Inspection failure): Area inspection/supervision did not fully capture the deviation.',
    ],
    [
      inv.why3 ||
        'Why 3 (Kegagalan prosedur/individu): Pemahaman atau penerapan SOP di titik kerja masih perlu diperkuat.',
      inv.why3 ||
        'Why 3 (Procedure/individual failure): Understanding or application of SOP at the work point still requires reinforcement.',
    ],
    [
      inv.why4 ||
        'Why 4 (Kegagalan pengawasan & kontrol): Monitoring dan verifikasi lapangan belum konsisten.',
      inv.why4 ||
        'Why 4 (Supervision & control failure): Field monitoring and verification were not consistent.',
    ],
    [
      inv.why5 ||
        'Why 5 (Akar sistemik): Tata kelola risiko operasional masih memiliki celah pada deteksi, eskalasi, dan penegakan standar.',
      inv.why5 ||
        'Why 5 (Systemic root): Operational risk governance still has gaps in detection, escalation, and standard enforcement.',
    ],
  ]
  for (const [tId, tEn] of whys) {
    y = writeInvPair(doc, tId, tEn, y)
  }

  y = drawSectionBanner(doc, 'D. Kesimpulan & Tindak Lanjut', 'D. Conclusion & Follow-up', y)
  y = writeInvPair(
    doc,
    `Root Cause: ${inv.root_cause || obs.root_cause || 'Lemahnya deteksi dini, kepatuhan SOP, dan pengawasan operasional di area terdampak.'}`,
    `Root Cause: ${inv.root_cause || obs.root_cause || 'Weak early detection, SOP compliance, and operational supervision in the affected area.'}`,
    y,
  )
  y = writeInvPair(
    doc,
    `Corrective Action: ${inv.corrective_action || 'Perkuat briefing/safety induction, perketat pengawasan area, pastikan kepatuhan SOP, dan verifikasi efektivitas tindakan.'}`,
    `Corrective Action: ${inv.corrective_action || 'Strengthen briefing/safety induction, tighten area supervision, ensure SOP compliance, and verify action effectiveness.'}`,
    y,
  )
  y = writeInvPair(
    doc,
    `Finding: ${n.finding || obs.deskripsi || '—'}`,
    `Finding: ${n.finding || obs.deskripsi || '—'}`,
    y,
  )
  y = writeInvPair(
    doc,
    `Recommendation: ${n.recommendation || 'Lakukan monitoring berkala dan evaluasi kontrol operasional agar kejadian serupa tidak berulang.'}`,
    `Recommendation: ${n.recommendation || 'Conduct periodic monitoring and evaluate operational controls to prevent recurrence.'}`,
    y,
  )
  y = writeInvPair(doc, `Investigator: ${n.investigator}`, `Investigator: ${n.investigator}`, y)

  y = writeInvPair(doc, 'Tindakan yang telah dilakukan:', 'Actions Taken:', y, { bold: true, size: 9 })
  const maxA = Math.max(idN.actions.length, enN.actions.length)
  for (let i = 0; i < maxA; i++) {
    y = writeInvPair(
      doc,
      idN.actions[i] ? `${i + 1}. ${idN.actions[i]}` : '',
      enN.actions[i] ? `${i + 1}. ${enN.actions[i]}` : '',
      y,
    )
  }

  y = writeInvPair(doc, idN.closing, enN.closing, y)
  drawSignature(doc, y)

  doc.save(`SOC-Investigasi-${soc}.pdf`)
}
