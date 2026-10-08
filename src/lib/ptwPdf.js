import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'
import { CONTROLS, HAZARDS, PPE_ITEMS, buildPermitDetails, editorFromPermit } from './ptwForm'

const LOGO_PATH = BRANDING.logoPdfSrc || '/logo/BACT Logo_OG Black Text.png'
const FALLBACK_LOGO_RATIO = 3.26
const WORK_ORDER = ['Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy']
const TYPE_COLOR = {
  'Hot Work': [176, 28, 36],
  'Cold Work': [16, 122, 64],
  'Confine Space': [194, 96, 16],
  'Isolation Energy': [26, 78, 176],
}

// Fixed bands. The sum is 287mm and starts at y=5, so the sheet ends at 292 on A4.
const BAND = {
  header: 16,
  area: 8,
  s1: 22,
  s2: 61,
  s3: 37,
  ppe: 7.5,
  s4: 13,
  gas: 25.5,
  s5: 39,
  people: 29,
  deiso: 19.5,
  foot: 9.5,
}

const X = 5
const W = 200

let cachedLogo = null

async function loadLogo() {
  if (cachedLogo) return cachedLogo
  if (typeof Image === 'undefined') return { data: null, ratio: FALLBACK_LOGO_RATIO }
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = encodeURI(LOGO_PATH)
    })
    const ratio = img.naturalWidth / img.naturalHeight || FALLBACK_LOGO_RATIO
    const maxPx = 640
    let width = img.naturalWidth
    let height = img.naturalHeight
    if (width > maxPx) {
      height = Math.round((height * maxPx) / width)
      width = maxPx
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    cachedLogo = { data: canvas.toDataURL('image/png'), ratio }
    return cachedLogo
  } catch {
    return { data: null, ratio: FALLBACK_LOGO_RATIO }
  }
}

function jakartaParts(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return { date: '', time: '' }
  return {
    date: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  }
}

function permitYear(refNo, startAt) {
  const match = String(refNo || '').match(/(20\d{2})/)
  if (match) return match[1]
  const date = new Date(startAt)
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(date)
  }
  return String(new Date().getFullYear())
}

export function buildPtwPdfModel({ form, types, sheet, meta = {} }) {
  const nominated = String(sheet.nominatedPerson || '').trim() || String(form.applicant_name || '').trim()
  const details = buildPermitDetails({ ...sheet, nominatedPerson: nominated })
  return {
    refNo: meta.refNo || '',
    kind: form.permit_kind,
    duration: meta.duration || '',
    area: form.area || '',
    workTypes: WORK_ORDER.filter((type) => (types || []).includes(type)),
    name: form.applicant_name || '',
    phone: form.phone || '',
    company: form.company || '',
    department: form.department || '',
    description: form.description || '',
    startAt: form.start_at || '',
    details,
    status: meta.status || '',
    approvedBy: meta.approvedBy || '',
    approvedAt: meta.approvedAt || '',
  }
}

export function publicPassPdfModel(pass) {
  const sheet = pass?.sheet
  if (!sheet || pass.kind !== 'ptw' || pass.status !== 'Approved') return null
  const edited = editorFromPermit({
    applicant_name: pass.name,
    company: pass.company,
    phone: sheet.phone,
    department: sheet.department,
    permit_kind: sheet.permit_kind,
    area: pass.area,
    description: sheet.description,
    start_at: sheet.start_at,
    work_types: sheet.work_types,
    details: sheet.details,
    status: pass.status,
    approved_by: pass.approved_by,
    approved_at: sheet.approved_at,
  })
  return buildPtwPdfModel({
    form: edited.form,
    types: edited.types,
    sheet: edited.sheet,
    meta: {
      refNo: pass.ref_no,
      status: pass.status,
      approvedBy: pass.approved_by,
      approvedAt: sheet.approved_at,
      duration: sheet.duration_choice || '',
    },
  })
}

function stroke(doc) {
  doc.setDrawColor(0)
  doc.setLineWidth(0.22)
}

function oneLine(doc, text, maxWidth) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  if (doc.getTextWidth(raw) <= maxWidth) return raw
  let out = raw
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > maxWidth) out = out.slice(0, -1)
  return `${out}...`
}

function writeLines(doc, lines, x, y, size, maxBottom) {
  doc.setFontSize(size)
  const step = size * 0.36
  let cursor = y
  for (const line of lines) {
    if (cursor + 0.4 > maxBottom) break
    doc.text(line, x, cursor)
    cursor += step
  }
}

function titleBar(doc, x, y, w, text) {
  doc.setFillColor(238, 238, 238)
  doc.rect(x, y, w, 3.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.2)
  doc.setTextColor(0)
  doc.text(text, x + 1.1, y + 2.55)
  return y + 3.8
}

function drawSign(doc, dataUrl, x, y, w, h) {
  const raw = String(dataUrl || '')
  const format = raw.startsWith('data:image/png') ? 'PNG' : raw.startsWith('data:image/jpeg') ? 'JPEG' : ''
  if (!format) return
  try {
    doc.addImage(raw, format, x, y, w, h)
  } catch {
    // A bad image must not stop the rest of the sheet.
  }
}

function drawBox(doc, x, y, size, on) {
  stroke(doc)
  doc.rect(x, y, size, size)
  if (!on) return
  doc.setLineWidth(0.32)
  doc.line(x + 0.4, y + size * 0.55, x + size * 0.38, y + size - 0.35)
  doc.line(x + size * 0.38, y + size - 0.35, x + size - 0.35, y + 0.4)
}

function bandRect(doc, y, h) {
  stroke(doc)
  doc.rect(X, y, W, h)
}

function drawHeader(doc, logo, model, y) {
  const h = BAND.header
  const leftW = 46
  const rightW = 42
  stroke(doc)
  doc.rect(X, y, W, h)
  doc.line(X + leftW, y, X + leftW, y + h)
  doc.line(X + W - rightW, y, X + W - rightW, y + h)

  if (logo?.data) {
    const maxW = 40
    const maxH = 12
    let logoW = maxW
    let logoH = logoW / (logo.ratio || FALLBACK_LOGO_RATIO)
    if (logoH > maxH) {
      logoH = maxH
      logoW = logoH * (logo.ratio || FALLBACK_LOGO_RATIO)
    }
    try {
      doc.addImage(logo.data, 'PNG', X + (leftW - logoW) / 2, y + (h - logoH) / 2, logoW, logoH)
    } catch {
      // Logo is optional. The sheet still prints.
    }
  }

  const midX = X + leftW + 2
  const midW = W - leftW - rightW - 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text('WORK PERMIT', midX + midW / 2, y + 4.3, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  const life = model.duration === '7d'
    ? 'Valid 7 days after HSSE approval / Berlaku 7 hari setelah disetujui HSSE'
    : model.duration === '12h'
      ? 'Valid 12 hours after HSSE approval / Berlaku 12 jam setelah disetujui HSSE'
      : model.kind === 'job_permit'
        ? 'Valid 14 days after HSSE approval / Berlaku 14 hari setelah disetujui HSSE'
        : 'Valid for a 12 hourly basis or 1 shift / Berlaku 12 jam atau 1 shift'
  doc.text(oneLine(doc, life, midW), midX + midW / 2, y + 7.1, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.7)
  doc.setTextColor(40)
  const note = doc.splitTextToSize(
    'In the event of an installation alarm, stop work, leave the work site safe, and proceed to your muster station. On stand down do not restart work until instructed by the Area Authority. Jika alarm berbunyi, hentikan pekerjaan, amankan area, dan berkumpul di titik kumpul.',
    midW,
  ).slice(0, 3)
  writeLines(doc, note, midX, y + 10, 4.7, y + h - 0.6)

  const rx = X + W - rightW
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text('PTW No:', rx + 2, y + 4.2)
  doc.setFontSize(8)
  doc.text(oneLine(doc, model.refNo || '—', rightW - 4), rx + 2, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.text(`/PTW/BACT/HSSE/${permitYear(model.refNo, model.startAt)}`, rx + 2, y + 11.6)
  doc.setFontSize(4.6)
  doc.setTextColor(60)
  doc.text('FM.HSE.001 / 01', rx + 2, y + 14.2)
  return y + h
}

function drawArea(doc, model, y) {
  const h = BAND.area
  bandRect(doc, y, h)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.4)
  doc.setTextColor(0)
  doc.text('Area of Work / Area Pekerjaan', X + 1.4, y + 3.1)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(oneLine(doc, model.area || '—', 62), X + 1.4, y + 6.4)

  const typesX = X + 70
  const slot = (W - 70) / WORK_ORDER.length
  WORK_ORDER.forEach((type, index) => {
    const color = TYPE_COLOR[type]
    const cx = typesX + index * slot
    drawBox(doc, cx, y + 2.6, 2.8, model.workTypes.includes(type))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...color)
    doc.text(type, cx + 3.6, y + 4.8)
  })
  doc.setTextColor(0)
  return y + h
}

function drawSection1(doc, model, y) {
  const h = BAND.s1
  const stamp = jakartaParts(model.startAt)
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '1. DESCRIPTION OF WORK / DESKRIPSI PEKERJAAN')
  const leftW = 88
  doc.line(X + leftW, body, X + leftW, y + h)
  const rows = [
    ['Date', stamp.date],
    ['Time', stamp.time],
    ['Nama PIC', model.name],
    ['Phone', model.phone],
    ['Company / Dept', [model.company, model.department, model.details.work_order ? `WO ${model.details.work_order}` : ''].filter(Boolean).join(' · ')],
  ]
  const rowH = (y + h - body) / rows.length
  rows.forEach((row, index) => {
    const fy = body + index * rowH
    if (index > 0) doc.line(X, fy, X + leftW, fy)
    const baseline = fy + rowH * 0.68
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(4.8)
    doc.setTextColor(90)
    doc.text(row[0], X + 1.3, baseline)
    const labelW = doc.getTextWidth(row[0]) + 1.6
    doc.setFontSize(6)
    doc.setTextColor(0)
    doc.text(oneLine(doc, row[1] || '—', leftW - labelW - 2.2), X + 1.3 + labelW, baseline)
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.6)
  doc.setTextColor(80)
  doc.text('Work Detail / Detail Pekerjaan', X + leftW + 1.4, body + 2.2)
  doc.setFontSize(6.3)
  doc.setTextColor(0)
  const lines = doc.splitTextToSize(String(model.description || '—'), W - leftW - 3)
  const maxLines = 6
  const shown = lines.slice(0, maxLines)
  if (lines.length > maxLines) shown[maxLines - 1] = oneLine(doc, `${shown[maxLines - 1]}...`, W - leftW - 3)
  writeLines(doc, shown, X + leftW + 1.4, body + 5, 6.3, y + h - 0.8)
  return y + h
}

function paintChecks(doc, items, selected, extras, x, y, w, h) {
  const rows = Math.ceil(items.length / 2)
  const rowH = h / rows
  const colW = w / 2
  items.forEach((item, index) => {
    const col = Math.floor(index / rows)
    const row = index % rows
    const cx = x + col * colW
    const cy = y + row * rowH
    drawBox(doc, cx + 0.7, cy + 0.7, 2.2, selected.has(item.id))
    const maxW = colW - 4.4
    const extra = extras[item.id]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(4.8)
    doc.setTextColor(15)
    doc.text(oneLine(doc, item.label, maxW), cx + 3.6, cy + 2.15)
    doc.setTextColor(75)
    doc.setFontSize(4.6)
    doc.text(oneLine(doc, extra ? `${item.labelId}: ${extra}` : item.labelId, maxW), cx + 3.6, cy + 4.05)
  })
  doc.setTextColor(0)
}

function drawSection2(doc, model, y) {
  const h = BAND.s2
  const hazards = new Set(model.details.hazards || [])
  const controls = new Set(model.details.controls || [])
  bandRect(doc, y, h)
  let cursor = titleBar(doc, X, y, W, '2. PRE JOB TEST / TES SEBELUM BEKERJA')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(4.6)
  doc.setTextColor(70)
  doc.text('Place a tick in the appropriate boxes / Beri tanda pada kotak yang sesuai', X + 1.2, cursor + 2.3)
  cursor += 3.2
  const headH = 3.2
  doc.setFillColor(248, 248, 248)
  doc.rect(X, cursor, W, headH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  doc.setTextColor(0)
  doc.text('Hazards Identified / Identifikasi Bahaya', X + 1.2, cursor + 2.15)
  doc.text('Control Measures / Tindakan Kontrol', X + W / 2 + 1.2, cursor + 2.15)
  doc.line(X + W / 2, cursor, X + W / 2, y + h)
  cursor += headH
  const bodyH = y + h - cursor
  paintChecks(doc, HAZARDS, hazards, { other: model.details.hazard_other || '' }, X, cursor, W / 2, bodyH)
  paintChecks(
    doc,
    CONTROLS,
    controls,
    { jsa: model.details.jsa_no || '', other: model.details.control_other || '' },
    X + W / 2,
    cursor,
    W / 2,
    bodyH,
  )
  return y + h
}

function drawSection3(doc, model, y) {
  const h = BAND.s3
  const activities = model.details.activities || []
  const count = Math.max(4, Math.min(8, activities.length))
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '3. JOB DESCRIPTION / DESKRIPSI PEKERJAAN')
  const cols = [8, 58, 44, 44, 46]
  const heads = ['No', 'Activities / Aktivitas', 'Tool / Alat', 'Hazard / Bahaya', 'Action / Tindakan']
  const headH = 4.2
  let cx = X
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(4.7)
  doc.setTextColor(0)
  heads.forEach((label, index) => {
    doc.line(cx, body, cx, y + h)
    doc.text(label, cx + 1, body + 2.6)
    cx += cols[index]
  })
  doc.line(X, body + headH, X + W, body + headH)
  const rowH = (y + h - body - headH) / count
  for (let i = 0; i < count; i += 1) {
    const ry = body + headH + i * rowH
    if (i > 0) doc.line(X, ry, X + W, ry)
    const row = activities[i] || {}
    const values = [String(i + 1), row.activity || '', row.tool || '', row.hazard || '', row.action || '']
    let vx = X
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(rowH < 4.2 ? 4.6 : 5.4)
    values.forEach((value, index) => {
      doc.text(oneLine(doc, value, cols[index] - 1.6), vx + 1, ry + Math.min(rowH - 0.8, 3.2))
      vx += cols[index]
    })
  }
  return y + h
}

function drawPpe(doc, model, y) {
  const h = BAND.ppe
  const selected = new Set(model.details.ppe || [])
  bandRect(doc, y, h)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  doc.setTextColor(0)
  doc.text('PPE / APD', X + 1.2, y + 2.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.3)
  doc.setTextColor(70)
  doc.text('If PPE is not complete, work shall not start.', X + 16, y + 2.5)
  const slot = (W - 2) / PPE_ITEMS.length
  PPE_ITEMS.forEach((item, index) => {
    const cx = X + 1.2 + index * slot
    drawBox(doc, cx, y + 3.8, 2.3, selected.has(item.id))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(0)
    doc.text(item.label, cx + 3, y + 5.6)
  })
  return y + h
}

function drawIsolation(doc, model, y) {
  const h = BAND.s4
  const iso = model.details.isolation || {}
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '4. ISOLATION TYPE REQUIRED / ISOLASI YANG DIBUTUHKAN (Jika diperlukan)')
  const rowH = (y + h - body) / 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.2)
  doc.setTextColor(0)
  doc.text(`Mechanical Isolation Certificate No:  ${iso.mechanical_cert || '........................'}`, X + 1.4, body + rowH * 0.65)
  doc.text(`Electrical Isolation Certificate No:  ${iso.electrical_cert || '........................'}`, X + W / 2 + 1, body + rowH * 0.65)
  doc.line(X, body + rowH, X + W, body + rowH)
  doc.text(`Location Lock out - Tag out:  ${iso.loto_location || '................................................................'}`, X + 1.4, body + rowH + rowH * 0.65)
  return y + h
}

function drawGas(doc, model, y) {
  const h = BAND.gas
  const gas = model.details.gas || {}
  const readings = Array.from({ length: 4 }, (_, index) => gas.readings?.[index] || {})
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '4. GAS TESTING / TES GAS (Khusus Confine Space)')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.2)
  doc.setTextColor(0)
  doc.text(`Certified Gas Tester:  ${gas.tester_name || '____________________'}`, X + 1.4, body + 3.2)
  doc.text(`Position:  ${gas.position || '______________'}`, X + 92, body + 3.2)
  if (gas.sign_image) {
    doc.text('Signature:', X + 142, body + 3.2)
    drawSign(doc, gas.sign_image, X + 158, body + 0.6, 28, 5.2)
  } else {
    doc.text(`Signature:  ${gas.signature || '______________'}`, X + 142, body + 3.2)
  }
  const tableY = body + 4.4
  const cols = [40, 53, 53, 54]
  const heads = ['TIME', 'LEL %', 'O2 %', 'Toxic ppm']
  const rowH = (y + h - tableY) / 5
  let hx = X
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  heads.forEach((label, index) => {
    doc.line(hx, tableY, hx, y + h)
    doc.text(label, hx + 1.2, tableY + 2.5)
    hx += cols[index]
  })
  doc.line(X, tableY + rowH, X + W, tableY + rowH)
  readings.forEach((row, index) => {
    const ry = tableY + rowH * (index + 1)
    doc.line(X, ry, X + W, ry)
    const values = [row.time || '', row.lel || '', row.o2 || '', row.toxic || '']
    let vx = X
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    values.forEach((value, col) => {
      if (value) doc.text(oneLine(doc, value, cols[col] - 2), vx + 1.2, ry + rowH * 0.68)
      vx += cols[col]
    })
  })
  return y + h
}

const STATEMENTS = [
  {
    key: 'understand',
    en: 'I understand the conditions on this permit and will brief the crew accordingly.',
    id: 'Saya mengerti kondisi izin ini dan akan mengarahkan krew yang bekerja.',
  },
  {
    key: 'inspected',
    en: 'I have inspected the work site and will allow the work to commence.',
    id: 'Saya telah menginspeksi area kerja dan mengizinkan pekerjaan dimulai.',
  },
  {
    key: 'commence',
    en: 'Work may commence provided all the above conditions have been met.',
    id: 'Pekerjaan boleh dimulai dengan semua kondisi di atas terpenuhi.',
  },
]

function drawApprovals(doc, model, y) {
  const h = BAND.s5
  const approvals = model.details.approvals || {}
  const approved = jakartaParts(model.approvedAt)
  const hsseName = approvals.hsse_name || (model.status === 'Approved' ? model.approvedBy : '')
  const hsseDate = approvals.hsse_date || (model.status === 'Approved' ? approved.date : '')
  const hsseTime = approvals.hsse_time || (model.status === 'Approved' ? approved.time : '')
  const signs = [
    ['Nominated Person / Orang yang dinominasikan', approvals.nominated_person, approvals.nominated_date, approvals.nominated_time, approvals.nominated_sign],
    ['Area Authority (HoD/MoD/Spv)', approvals.area_authority, approvals.area_date, approvals.area_time, approvals.area_sign],
    ['Permit Controller HSSE', hsseName, hsseDate, hsseTime, approvals.hsse_sign],
  ]
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '5. APPROVALS / PERSETUJUAN')
  const split = X + 118
  doc.line(split, body, split, y + h)
  const blockH = (y + h - body) / 3
  STATEMENTS.forEach((item, index) => {
    const by = body + index * blockH
    if (index > 0) doc.line(X, by, split, by)
    drawBox(doc, X + 1.4, by + 1.3, 2.4, Boolean(approvals[item.key]))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.setTextColor(0)
    const en = doc.splitTextToSize(item.en, split - X - 7).slice(0, 2)
    writeLines(doc, en, X + 5, by + 2.6, 5, by + blockH - 3.2)
    doc.setTextColor(70)
    doc.setFontSize(4.6)
    const id = doc.splitTextToSize(item.id, split - X - 7).slice(0, 2)
    writeLines(doc, id, X + 5, by + blockH - 3.4, 4.6, by + blockH - 0.5)
  })
  signs.forEach((slot, index) => {
    const by = body + index * blockH
    if (index > 0) doc.line(split, by, X + W, by)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(4.8)
    doc.setTextColor(0)
    doc.text(slot[0], split + 1.4, by + 2.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(oneLine(doc, slot[1] || '', 48), split + 1.4, by + 6)
    drawSign(doc, slot[4], split + 52, by + 3.1, 28, 5.4)
    doc.setFontSize(5)
    doc.setTextColor(40)
    doc.text(`Date: ${slot[2] || '__________'}`, split + 1.4, by + blockH - 1.5)
    doc.text(`Time: ${slot[3] || '______'}`, split + 38, by + blockH - 1.5)
  })
  doc.setTextColor(0)
  return y + h
}

function drawPeople(doc, model, y) {
  const h = BAND.people
  const names = Array.from({ length: 15 }, (_, index) => model.details.people?.[index] || '')
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '6. PERSON INVOLVED / PERSONIL YANG TERLIBAT')
  const colW = W / 3
  const headH = 3.6
  const rowH = (y + h - body - headH) / 5
  for (let col = 0; col < 3; col += 1) {
    const cx = X + col * colW
    doc.line(cx, body, cx, y + h)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(4.6)
    doc.setTextColor(0)
    doc.text('No', cx + 1, body + 2.4)
    doc.text('Nama / Name', cx + 7, body + 2.4)
    doc.text('Paraf', cx + colW - 12, body + 2.4)
    for (let row = 0; row < 5; row += 1) {
      const ry = body + headH + row * rowH
      doc.line(cx, ry, cx + colW, ry)
      const number = col * 5 + row + 1
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.text(String(number), cx + 1.2, ry + rowH * 0.68)
      doc.text(oneLine(doc, names[number - 1], colW - 22), cx + 7, ry + rowH * 0.68)
      doc.rect(cx + colW - 13, ry + 0.6, 10, Math.max(2.2, rowH - 1.3))
      const paraf = model.details.paraf?.[number - 1] || ''
      if (paraf) {
        doc.setFontSize(5)
        doc.text(oneLine(doc, paraf, 9), cx + colW - 12.4, ry + rowH * 0.68)
      }
    }
  }
  doc.line(X, body + headH, X + W, body + headH)
  return y + h
}

function drawDeisolation(doc, model, y) {
  const h = BAND.deiso
  const item = model.details.deisolation || {}
  const complete = item.status === 'complete'
  const incomplete = item.status === 'incomplete'
  bandRect(doc, y, h)
  const body = titleBar(doc, X, y, W, '7. REQUEST FOR DE-ISOLATION / PERMINTAAN MEMBUKA ISOLASI ENERGI (Khusus LOTO)')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(0)
  const copy = doc.splitTextToSize(
    'I have checked that the work is complete / incomplete. The worksite is clean and safe, and the isolation applied for this permit may / may not be removed. Area kerja bersih dan aman, dan isolasi boleh atau tidak boleh dibuka sesuai status di bawah.',
    W - 3,
  ).slice(0, 2)
  writeLines(doc, copy, X + 1.4, body + 2.8, 5, body + 7.2)
  drawBox(doc, X + 1.4, body + 8.2, 2.4, complete)
  doc.setFontSize(6)
  doc.text('Complete / Selesai', X + 4.6, body + 10.1)
  drawBox(doc, X + 42, body + 8.2, 2.4, incomplete)
  doc.text('Incomplete / Belum selesai', X + 45.2, body + 10.1)
  doc.setFontSize(5.2)
  doc.text(`Signature (Area Authority - Engineering):  ${item.signer || '____________________'}`, X + 1.4, body + 13.6)
  drawSign(doc, item.sign_image, X + 98, body + 11.2, 26, 4.6)
  doc.text(`Date: ${item.date || '__________'}`, X + 130, body + 13.6)
  doc.text(`Time: ${item.time || '______'}`, X + 165, body + 13.6)
  return y + h
}

function drawFooter(doc, y) {
  const h = BAND.foot
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.8)
  doc.setTextColor(0)
  doc.text('09. PERMIT DISTRIBUTION', X + 1, y + 2.6)
  doc.text('Copy 1 White - Worksite / Area Kerja', X + 42, y + 2.6)
  doc.text('Copy 2 Pink - Area Authority (Head/MoD/Spv)', X + 92, y + 2.6)
  doc.text('Copy 3 Blue - Permit Controller HSSE', X + 155, y + 2.6)
  doc.setFontSize(4.6)
  doc.setTextColor(50)
  doc.text('Retain the original for 3 (three) months.', X + 1, y + 6.2)
  doc.text('FM.HSE.001 / 01 / 10-04-2026 Work Permit', X + W, y + 6.2, { align: 'right' })
  doc.setTextColor(0)
  return y + h
}

async function renderPtwPdf(model) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const logo = await loadLogo()
  let y = 5
  y = drawHeader(doc, logo, model, y)
  y = drawArea(doc, model, y)
  y = drawSection1(doc, model, y)
  y = drawSection2(doc, model, y)
  y = drawSection3(doc, model, y)
  y = drawPpe(doc, model, y)
  y = drawIsolation(doc, model, y)
  y = drawGas(doc, model, y)
  y = drawApprovals(doc, model, y)
  y = drawPeople(doc, model, y)
  y = drawDeisolation(doc, model, y)
  drawFooter(doc, y)
  doc.setProperties({
    title: `Work Permit ${model.refNo || ''}`.trim(),
    subject: 'FM.HSE.001 Work Permit',
    author: 'PT. BACT HSSE',
  })
  return doc
}

export async function ptwPdfBlob(model) {
  const doc = await renderPtwPdf(model)
  return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
}

export async function downloadPtwPdf(model) {
  const doc = await renderPtwPdf(model)
  const safe = String(model.refNo || 'PTW').replace(/[^\w.-]+/g, '-')
  doc.save(`${safe}.pdf`)
}
