import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'

const LOGO_PATH = BRANDING.logoSrc || '/logo/BACT Logo_OG White Text.png'

async function loadLogoDataUrl() {
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = encodeURI(LOGO_PATH)
    })
    const maxPx = 640
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
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function box(doc, x, y, w, h, title, body, fill) {
  const [r, g, b] = fill
  doc.setFillColor(r, g, b)
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, w, h, 2, 2, 'FD')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  const titleLines = doc.splitTextToSize(title, w - 6)
  doc.text(titleLines, x + w / 2, y + 6, { align: 'center' })
  if (body) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.4)
    const bodyLines = doc.splitTextToSize(body, w - 6)
    doc.text(bodyLines, x + w / 2, y + 12, { align: 'center' })
  }
}

function arrowRight(doc, x, y) {
  doc.setFillColor(80, 80, 80)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.6)
  doc.line(x, y, x + 7, y)
  doc.triangle(x + 7, y - 1.3, x + 7, y + 1.3, x + 10, y, 'F')
}

function arrowDown(doc, x, y) {
  doc.setFillColor(80, 80, 80)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.6)
  doc.line(x, y, x, y + 6)
  doc.triangle(x - 1.3, y + 6, x + 1.3, y + 6, x, y + 9, 'F')
}

/** Satu halaman landscape — bisa dikirim WA ke HSE / manajemen. */
export async function buildSocFlowchartPdf() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const logo = await loadLogoDataUrl()
  const pageW = 297
  const margin = 12

  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFillColor(243, 112, 33)
  doc.rect(0, 22, pageW, 1.2, 'F')

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, 4, 38, 14)
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Safety Observation Card — Alur Kerja', 56, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Batu Ampar Container Terminal  ·  HSSE  ·  2026', 56, 16.5)

  const steps1 = [
    { t: '1. Scan QR / buka web', b: 'Tanpa login', c: [59, 130, 246] },
    { t: '2. Isi form pelapor', b: 'Nama, lokasi, foto, Stop Work', c: [99, 102, 241] },
    { t: '3. Kirim laporan', b: 'Status Open, belum diklasifikasi', c: [243, 112, 33] },
    { t: '4. HSE klasifikasi', b: 'Kategori + tingkat risiko', c: [245, 158, 11] },
    { t: '5. Assign PIC', b: 'Departemen follow-up', c: [16, 185, 129] },
  ]
  const y1 = 32
  const w1 = 46
  steps1.forEach((s, i) => {
    const x = margin + i * 55
    box(doc, x, y1, w1, 22, s.t, s.b, s.c)
    if (i < steps1.length - 1) arrowRight(doc, x + w1 + 1.5, y1 + 11)
  })

  arrowDown(doc, pageW / 2, 56)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Cabang setelah klasifikasi', pageW / 2, 70, { align: 'center' })

  box(
    doc,
    18,
    76,
    120,
    42,
    'Kasus biasa / Low–Medium',
    'PDF Notice of Safety Observation → tindakan & CAPA → verifikasi HSE → Closed. Tidak semua SOC wajib investigasi.',
    [51, 65, 85],
  )

  box(
    doc,
    159,
    76,
    120,
    42,
    'HiPo / High / Near Miss / Stop Work',
    'Centang lanjut investigasi → isi 5W+1H di dashboard → PDF Investigation Report → CAPA → verifikasi → Closed.',
    [185, 28, 28],
  )

  const docs = [
    { t: 'PDF SOC (Notice)', b: 'Surat bilingual ke PIC / manajemen', c: [243, 112, 33] },
    { t: 'PDF Investigasi', b: 'Hanya jika ditandai investigasi', c: [180, 83, 9] },
    { t: 'Export Excel', b: 'Rekap laporan — kolom rapi', c: [16, 185, 129] },
    { t: 'Notifikasi email', b: 'Laporan baru & HiPo ke daftar HSE', c: [99, 102, 241] },
  ]
  docs.forEach((s, i) => {
    box(doc, 18 + i * 68, 128, 62, 24, s.t, s.b, s.c)
  })

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(18, 158, 261, 28, 2, 2, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(18, 158, 261, 28, 2, 2, 'S')
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Catatan untuk HSE', 24, 166)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    'Pelapor tidak mengisi kategori/risiko. Klasifikasi hanya di dashboard. Form: bact-safety-observation-modern.vercel.app   ·   Admin: /admin/login',
    24,
    173,
  )
  doc.text(
    'Kategori: Unsafe Act · Unsafe Condition · Near Miss · Positive Observation     Risiko: Low · Medium · High',
    24,
    179,
  )

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text('PT. BACT · Safety Observation Card · dokumen internal HSSE', margin, 204)

  return doc
}

export async function exportSocFlowchartPdf() {
  const doc = await buildSocFlowchartPdf()
  doc.save('BACT-SOC-Flow-Chart.pdf')
}
