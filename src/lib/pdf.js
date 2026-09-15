import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'
import {
  buildInvestigationNarrative,
  buildSocNarrativeEn,
  buildSocNarrativeId,
} from './pdfNarrative'
import { buildPdfReporter, buildPdfSubject, normalizeActionChecks } from './pdfMeta'
import { resolveSocNumber } from './socNumber'

const LOGO_PATH = BRANDING.logoPdfSrc || '/logo/BACT Logo_OG Black Text.png'
const MARGIN = 16
const PAGE_BOTTOM = 280
const FALLBACK_LOGO_RATIO = 3.26

let cachedLogo = null
let pdfCtx = { title: '', soc: '' }

async function loadLogo() {
  if (cachedLogo) return cachedLogo
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = encodeURI(LOGO_PATH)
    })
    const ratio = img.naturalWidth / img.naturalHeight || FALLBACK_LOGO_RATIO
    const maxPx = 720
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxPx) {
      h = Math.round((h * maxPx) / w)
      w = maxPx
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    cachedLogo = { data: canvas.toDataURL('image/png'), ratio }
    return cachedLogo
  } catch {
    return { data: null, ratio: FALLBACK_LOGO_RATIO }
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

function lineHeightMm(doc) {
  return doc.getFontSize() * doc.getLineHeightFactor() * 0.352777778
}

function bilingualCols() {
  const gap = 7
  const colW = (contentWidth() - gap) / 2
  const xId = MARGIN
  const xEn = xId + colW + gap
  return { gap, colW, xId, xEn }
}

function drawJustified(doc, text, x, y, maxWidth) {
  const value = String(text || '')
  if (!value) return
  const lines = doc.splitTextToSize(value, maxWidth)
  if (lines.length <= 1) {
    doc.text(value, x, y)
    return
  }
  try {
    doc.text(value, x, y, { align: 'justify', maxWidth })
  } catch {
    doc.text(lines, x, y)
  }
}

function drawCheckBox(doc, x, yBaseline, checked) {
  const size = 3.1
  const top = yBaseline - 2.45
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.32)
  doc.rect(x, top, size, size)
  if (checked) {
    doc.setLineWidth(0.48)
    doc.line(x + 0.5, top + 1.65, x + 1.2, top + 2.45)
    doc.line(x + 1.2, top + 2.45, x + 2.6, top + 0.5)
  }
}

function ensureSpace(doc, y, need) {
  if (y + need <= PAGE_BOTTOM) return y
  doc.addPage()
  drawContinuationBar(doc)
  return MARGIN + 14
}

function drawContinuationBar(doc) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, MARGIN, MARGIN + contentWidth(), MARGIN)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(pdfCtx.title || 'NOTICE', MARGIN, MARGIN + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(pdfCtx.soc || '', MARGIN + contentWidth(), MARGIN + 5, { align: 'right' })
}

/**
 * Kop surat: logo kiri + judul 1 baris di kanan,
 * lalu tabel 3 kolom (label | isi | Document No rapi).
 */
function drawLetterhead(doc, logo, title, header) {
  const x0 = MARGIN
  const tableW = contentWidth()
  const headerH = 20
  const top = MARGIN

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.rect(x0, top, tableW, headerH)

  let logoW = 0
  let logoH = 0
  if (logo?.data) {
    const maxW = 52
    const maxH = 15
    logoW = maxW
    logoH = logoW / (logo.ratio || FALLBACK_LOGO_RATIO)
    if (logoH > maxH) {
      logoH = maxH
      logoW = logoH * (logo.ratio || FALLBACK_LOGO_RATIO)
    }
    try {
      doc.addImage(logo.data, 'PNG', x0 + 3, top + (headerH - logoH) / 2, logoW, logoH)
    } catch {
      logoW = 0
    }
  }

  const titleX = x0 + (logoW ? logoW + 6 : 4)
  const titleW = tableW - (titleX - x0) - 3
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  let size = 12
  doc.setFontSize(size)
  while (size > 8.5 && doc.getTextWidth(title) > titleW) {
    size -= 0.3
    doc.setFontSize(size)
  }
  doc.text(title, titleX, top + headerH / 2 + 1.2)

  return drawRecipientTable(doc, header, top + headerH)
}

function socNumberLines(soc) {
  const text = String(soc || '')
  const match = text.match(/^(SOC-\d+-BACT)-(.*)$/i)
  if (match) return [match[1], match[2]]
  return [text]
}

function drawRecipientTable(doc, header, startY) {
  const x0 = MARGIN
  const tableW = contentWidth()
  const labelW = 42
  const metaW = 54
  const valueW = tableW - labelW - metaW
  const soc = header?.documentNo || ''
  const metaX = x0 + labelW + valueW

  const rows = [
    ['Kepada / To', header?.to || ''],
    ['Tanggal / Date', header?.date || ''],
    ['Perihal / Subject', header?.subject || ''],
    ['Pelapor / Reported by', header?.reporter || ''],
    ['PIC / Assigned', header?.pic || ''],
  ]

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const heights = rows.map(([label, value]) => {
    const labelLines = doc.splitTextToSize(label, labelW - 4)
    const valueLines = doc.splitTextToSize(String(value), valueW - 4)
    return Math.max(7.4, Math.max(labelLines.length, valueLines.length) * 3.6 + 3.4)
  })
  const totalH = heights.reduce((a, b) => a + b, 0)
  const metaSplit = startY + totalH / 2

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.rect(x0, startY, tableW, totalH)
  doc.line(x0 + labelW, startY, x0 + labelW, startY + totalH)
  doc.line(metaX, startY, metaX, startY + totalH)
  doc.line(metaX, metaSplit, x0 + tableW, metaSplit)

  let y = startY
  rows.forEach(([label, value], i) => {
    const h = heights[i]
    if (i > 0) doc.line(x0, y, metaX, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label, x0 + 2, y + 5.2)
    doc.setFont('helvetica', 'normal')
    doc.text(doc.splitTextToSize(String(value), valueW - 4), x0 + labelW + 2, y + 5.2)
    y += h
  })

  const pad = 2.4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('Document No.', metaX + pad, startY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  socNumberLines(soc).forEach((line, i) => {
    doc.text(line, metaX + pad, startY + 9.2 + i * 3.6)
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('Effective Date', metaX + pad, metaSplit + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(String(header?.effectiveDate || ''), metaX + pad, metaSplit + 9.4)

  return startY + totalH + 6
}

function drawBilingualBlock(doc, textId, textEn, y, opts = {}) {
  const { bold = false, size = 8.6, checkbox = null, gapAfter = 3.8 } = opts
  const { colW, xId, xEn } = bilingualCols()
  const indent = checkbox != null ? 5.2 : 0
  const textW = colW - indent

  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setLineHeightFactor(1.2)
  doc.setTextColor(0, 0, 0)

  const linesId = doc.splitTextToSize(textId || '', textW)
  const linesEn = doc.splitTextToSize(textEn || '', textW)
  const rows = Math.max(linesId.length, linesEn.length, textId || textEn ? 1 : 0)
  if (!rows) return y

  const lh = lineHeightMm(doc)
  y = ensureSpace(doc, y, rows * lh + gapAfter)

  if (checkbox != null) {
    if (textId) drawCheckBox(doc, xId, y, checkbox)
    if (textEn) drawCheckBox(doc, xEn, y, checkbox)
  }

  drawJustified(doc, textId, xId + indent, y, textW)
  drawJustified(doc, textEn, xEn + indent, y, textW)
  return y + rows * lh + gapAfter
}

function drawSignature(doc, y, signature = {}) {
  const blockH = 28
  y = ensureSpace(doc, y, blockH)
  y += 1.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(signature.sincerely || 'Sincerely,', MARGIN, y)
  y += 13
  doc.setFont('helvetica', 'bold')
  doc.text(signature.org || 'HSSE', MARGIN, y)
  y += 4.6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(signature.role || 'Health and Safety Officer', MARGIN, y)
  y += 4.2
  doc.text(signature.company || 'Batu Ampar Container Terminal', MARGIN, y)

  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.text(`Tanggal export: ${fmtExportDate()}`, MARGIN + contentWidth(), 287, { align: 'right' })
}

function drawDraftBlocks(doc, blocks, startY) {
  let y = startY
  for (const block of blocks || []) {
    if (block.type === 'banner') {
      y = drawSectionBanner(doc, block.id, block.en, y)
      continue
    }
    if (block.type === 'heading') {
      y = drawBilingualBlock(doc, block.id, block.en, y, {
        bold: true,
        size: 9,
        gapAfter: block.gapAfter ?? 2.6,
      })
      continue
    }
    if (block.type === 'action') {
      y = drawBilingualBlock(doc, block.id, block.en, y, {
        checkbox: Boolean(block.checked),
        gapAfter: block.gapAfter ?? 2.2,
      })
      continue
    }
    y = drawBilingualBlock(doc, block.id, block.en, y, {
      gapAfter: block.gapAfter ?? 3.8,
    })
  }
  return y
}

const DEFAULT_SIGNATURE = {
  sincerely: 'Sincerely,',
  org: 'HSSE',
  role: 'Health and Safety Officer',
  company: 'Batu Ampar Container Terminal',
}

function blockPara(id, en, gapAfter) {
  return { type: 'para', id, en, gapAfter }
}

function blockHeading(id, en, gapAfter = 2.6) {
  return { type: 'heading', id, en, gapAfter }
}

function blockAction(id, en, checked, gapAfter) {
  return { type: 'action', id, en, checked, gapAfter }
}

function blockBanner(id, en) {
  return { type: 'banner', id, en }
}

export function buildPdfHeader(obs) {
  const soc = resolveSocNumber(obs)
  return {
    to: obs.pdf_to || `Management of ${obs.nama_perusahaan || 'PT. BACT'}`,
    date: fmtDateEn(obs.tanggal_waktu || obs.created_at),
    subject: buildPdfSubject(obs),
    reporter: buildPdfReporter(obs),
    pic: obs.pdf_pic || obs.pic_assigned || '—',
    documentNo: soc,
    effectiveDate: fmtDateEn(obs.created_at || obs.tanggal_waktu),
  }
}

/** Structured copy of the SOC notice — same fields jsPDF draws. */
export function buildSocDraft(obs) {
  const soc = resolveSocNumber(obs)
  const id = buildSocNarrativeId(obs)
  const en = buildSocNarrativeEn(obs)
  const flags = normalizeActionChecks(Math.max(id.actions.length, en.actions.length), obs.pdf_action_checks)
  const n = Math.max(id.actions.length, en.actions.length)
  const blocks = [
    blockPara(id.intro, en.intro, 3.4),
    blockPara(id.context, en.context, 3.4),
    blockPara(id.classification, en.classification, 4),
    blockHeading('Tindakan yang telah dilakukan:', 'Actions Taken:'),
  ]
  for (let i = 0; i < n; i++) {
    blocks.push(blockAction(id.actions[i] || '', en.actions[i] || '', flags[i], 2.2))
  }
  blocks.push(blockPara(id.followUp, en.followUp, 3.4))
  blocks.push(blockPara(id.closing, en.closing, 5))
  return {
    kind: 'soc',
    title: 'NOTICE OF SAFETY OBSERVATION',
    soc,
    header: buildPdfHeader(obs),
    blocks,
    signature: { ...DEFAULT_SIGNATURE },
  }
}

/** Structured copy of the investigation report — same fields jsPDF draws. */
export function buildInvestigationDraft(obs) {
  const soc = resolveSocNumber(obs)
  const n = buildInvestigationNarrative(obs)
  const inv = n.inv
  const fb = n.fb
  const idN = buildSocNarrativeId(obs)
  const enN = buildSocNarrativeEn(obs)
  const flags = normalizeActionChecks(Math.max(idN.actions.length, enN.actions.length), obs.pdf_action_checks)
  const blocks = [
    blockBanner('A. Ringkasan kejadian', 'A. Incident summary'),
    blockPara(n.ringkasanId, n.ringkasanEn),
    blockPara(n.purposeId, n.purposeEn),
    blockPara(idN.classification, enN.classification),
    blockPara(idN.context, enN.context),
    blockBanner('B. Fakta kejadian', 'B. Factual findings'),
    blockPara(inv.what || fb.natureId, inv.what || fb.natureEn),
    blockPara(inv.where || fb.locationId, inv.where || fb.locationEn),
    blockPara(inv.when || fb.timeId, inv.when || fb.timeEn),
    blockPara(inv.why || fb.factorsId, inv.why || fb.factorsEn),
    blockPara(inv.how || fb.sequenceId, inv.how || fb.sequenceEn),
  ]
  if (n.summary5) blocks.push(blockPara(n.summary5, n.summary5))
  blocks.push(
    blockBanner('C. Analisis penyebab', 'C. Cause analysis'),
    blockPara(inv.why1 || fb.cause1Id, inv.why1 || fb.cause1En),
    blockPara(inv.why2 || fb.cause2Id, inv.why2 || fb.cause2En),
    blockPara(inv.why3 || fb.cause3Id, inv.why3 || fb.cause3En),
    blockPara(inv.why4 || fb.cause4Id, inv.why4 || fb.cause4En),
    blockPara(inv.why5 || fb.cause5Id, inv.why5 || fb.cause5En),
    blockBanner('D. Kesimpulan & tindakan', 'D. Conclusion & actions'),
    blockPara(
      `Akar masalah: ${inv.root_cause || obs.root_cause || fb.rootId}`,
      `Root cause: ${inv.root_cause || obs.root_cause || fb.rootEn}`,
    ),
    blockPara(
      `Tindakan korektif: ${inv.corrective_action || fb.caId}`,
      `Corrective action: ${inv.corrective_action || fb.caEn}`,
    ),
    blockPara(`Temuan: ${n.finding || obs.deskripsi || '—'}`, `Finding: ${n.finding || obs.deskripsi || '—'}`),
    blockPara(
      `Rekomendasi: ${n.recommendation || fb.recId}`,
      `Recommendation: ${n.recommendation || fb.recEn}`,
    ),
    blockPara(`Petugas investigasi: ${n.investigator}`, `Investigating officer: ${n.investigator}`),
    blockHeading('Tindakan yang telah dilakukan:', 'Actions Taken:'),
  )
  const maxA = Math.max(idN.actions.length, enN.actions.length)
  for (let i = 0; i < maxA; i++) {
    blocks.push(blockAction(idN.actions[i] || '', enN.actions[i] || '', flags[i], 2.8))
  }
  blocks.push(blockPara(idN.followUp, enN.followUp))
  blocks.push(blockPara(idN.closing, enN.closing, 6))
  return {
    kind: 'investigation',
    title: 'INVESTIGATION REPORT',
    soc,
    header: buildPdfHeader(obs),
    blocks,
    signature: { ...DEFAULT_SIGNATURE },
  }
}

async function renderPdfFromDraft(draft) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadLogo()
  const soc = draft.soc || draft.header?.documentNo || ''
  pdfCtx = { title: draft.title || 'NOTICE', soc: draft.header?.documentNo || soc }

  let y = drawLetterhead(doc, logo, draft.title || 'NOTICE', draft.header || {})
  y = drawDraftBlocks(doc, draft.blocks, y)
  drawSignature(doc, y, draft.signature)
  return { doc, soc }
}

function drawSectionBanner(doc, titleId, titleEn, y) {
  const { colW, xId, xEn } = bilingualCols()
  y = ensureSpace(doc, y, 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(titleId, xId, y)
  doc.text(titleEn, xEn, y)
  y += 2
  doc.setDrawColor(160, 160, 160)
  doc.setLineWidth(0.2)
  doc.line(xId, y, xId + colW, y)
  doc.line(xEn, y, xEn + colW, y)
  return y + 5
}

/** PDF SOC — layout Notice of Safety Observation (bilingual, justify) */
export async function buildObservationPdf(obs, draft) {
  return renderPdfFromDraft(draft || buildSocDraft(obs))
}

export async function exportObservationPdf(obs, draft) {
  const { doc, soc } = await buildObservationPdf(obs, draft)
  doc.save(`SOC-${soc}.pdf`)
}

/** PDF Investigasi — bilingual; tanpa label metodologi 5W+1H / 5 Whys */
export async function buildInvestigationPdf(obs, draft) {
  return renderPdfFromDraft(draft || buildInvestigationDraft(obs))
}

export async function exportInvestigationPdf(obs, draft) {
  const { doc, soc } = await buildInvestigationPdf(obs, draft)
  doc.save(`SOC-Investigasi-${soc}.pdf`)
}
