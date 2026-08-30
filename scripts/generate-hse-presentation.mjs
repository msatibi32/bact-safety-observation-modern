/**
 * Generate HSE presentation PowerPoint — BACT Safety Observation Card
 * Run: npm run generate:ppt
 * Output: supabase/BACT-SOC-Presentasi-HSE.pptx
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PptxGenJS from 'pptxgenjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPath = path.join(root, 'supabase', 'BACT-SOC-Presentasi-HSE.pptx')
const logoOrange = path.join(root, 'public', 'logo', 'BACT Logo_Orange.png')
const logoWhite = path.join(root, 'public', 'logo', 'bact-logo-white.png')
const APP_URL = 'bact-safety-observation-modern.vercel.app'

// ─── Brand palette ───────────────────────────────────────────────────────────
const C = {
  orange: 'F37021',
  orangeDark: 'D95E10',
  dark: '1A1A1A',
  darkAlt: '252525',
  slate: '334155',
  slateLight: '64748B',
  muted: '94A3B8',
  white: 'FFFFFF',
  offWhite: 'F8FAFC',
  blue: '3B82F6',
  indigo: '6366F1',
  amber: 'F59E0B',
  green: '10B981',
  red: 'EF4444',
  redDark: 'DC2626',
  purple: '8B5CF6',
  gray: '64748B',
}

const FONT = 'Segoe UI'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'PT. BACT HSSE'
pptx.title = 'Safety Observation Card — Presentasi HSE'
pptx.company = 'PT. BACT — Batu Ampar Container Terminal'

// ─── Layout helpers ──────────────────────────────────────────────────────────

function accentBar(slide, y = 0.9) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y, w: '100%', h: 0.04, fill: { color: C.orange } })
}

function addFooter(slide, text = 'PT. BACT · Safety Observation Card · 2026') {
  slide.addText(text, {
    x: 0.4,
    y: 5.15,
    w: 9.2,
    h: 0.25,
    fontSize: 8,
    color: C.muted,
    fontFace: FONT,
  })
}

function contentSlide(title, subtitle = '') {
  const slide = pptx.addSlide()
  slide.background = { color: C.offWhite }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: C.dark } })
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 0.3, y: 0.14, w: 1.35, h: 0.52 })
  }
  slide.addText(title, {
    x: 1.85,
    y: 0.18,
    w: 7.8,
    h: 0.42,
    fontSize: 22,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.85,
      y: 0.55,
      w: 7.8,
      h: 0.28,
      fontSize: 11,
      color: C.muted,
      fontFace: FONT,
    })
  }
  accentBar(slide)
  addFooter(slide)
  return slide
}

function sectionDivider(title, subtitle) {
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 2.35, w: '100%', h: 0.06, fill: { color: C.orange } })
  slide.addText(title, {
    x: 0.5,
    y: 1.6,
    w: 9,
    h: 0.75,
    fontSize: 36,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 2.65,
      w: 9,
      h: 0.5,
      fontSize: 16,
      color: C.orange,
      align: 'center',
      fontFace: FONT,
    })
  }
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 4.15, y: 4.2, w: 1.7, h: 0.55 })
  }
  return slide
}

function statCard(slide, { x, y, w, h, value, label, color = C.orange }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
    shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.12, color: C.dark },
  })
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color } })
  slide.addText(String(value), {
    x: x + 0.2,
    y: y + 0.12,
    w: w - 0.3,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color,
    fontFace: FONT,
  })
  slide.addText(label, {
    x: x + 0.2,
    y: y + 0.55,
    w: w - 0.3,
    h: 0.55,
    fontSize: 10,
    color: C.slate,
    fontFace: FONT,
    valign: 'top',
  })
}

function featureBox(slide, { x, y, w, h, title, body, accent = C.orange }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.08,
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.15,
    y: y + 0.15,
    w: 0.35,
    h: 0.35,
    fill: { color: accent },
    rectRadius: 0.06,
  })
  slide.addText(title, {
    x: x + 0.6,
    y: y + 0.12,
    w: w - 0.7,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  slide.addText(body, {
    x: x + 0.15,
    y: y + 0.55,
    w: w - 0.3,
    h: h - 0.65,
    fontSize: 10,
    color: C.slate,
    fontFace: FONT,
    valign: 'top',
  })
}

function flowBox(slide, { x, y, w, h, text, fill = C.orange, color = C.white, fontSize = 10, rounded = true }) {
  slide.addShape(rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: C.dark, width: 0.5 },
    rectRadius: rounded ? 0.08 : 0,
  })
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontSize,
    bold: true,
    color,
    align: 'center',
    valign: 'mid',
    fontFace: FONT,
  })
}

function arrowRight(slide, x, y, w = 0.4) {
  slide.addShape(pptx.ShapeType.rightArrow, {
    x,
    y,
    w,
    h: 0.2,
    fill: { color: C.slateLight },
    line: { color: C.slateLight, width: 0 },
  })
}

function arrowDown(slide, x, y, h = 0.32) {
  slide.addShape(pptx.ShapeType.downArrow, {
    x,
    y,
    w: 0.2,
    h,
    fill: { color: C.slateLight },
    line: { color: C.slateLight, width: 0 },
  })
}

function flowSlide(title, subtitle) {
  return contentSlide(title, subtitle)
}

function bulletList(slide, bullets, opts = {}) {
  const { x = 0.5, y = 1.15, w = 9, h = 3.8, fontSize = 14 } = opts
  slide.addText(
    bullets.map((b) => ({ text: b, options: { bullet: { code: '2022' }, breakLine: true } })),
    { x, y, w, h, fontSize, color: C.slate, fontFace: FONT, valign: 'top', paraSpaceAfter: 6 },
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDES
// ═══════════════════════════════════════════════════════════════════════════════

// 1 — Cover
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.orange } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: '100%', h: 0.08, fill: { color: C.orange } })
  if (fs.existsSync(logoWhite)) {
    slide.addImage({ path: logoWhite, x: 2.8, y: 0.85, w: 4.4, h: 1.35 })
  } else if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 3.2, y: 1.0, w: 3.6, h: 1.1 })
  }
  slide.addText('Safety Observation Card', {
    x: 0.5,
    y: 2.45,
    w: 9,
    h: 0.75,
    fontSize: 38,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Sistem Pelaporan Observasi Keselamatan Kerja', {
    x: 0.5,
    y: 3.25,
    w: 9,
    h: 0.45,
    fontSize: 18,
    color: C.orange,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('PT. BACT — Batu Ampar Container Terminal\nAn ICTSI Group Company', {
    x: 0.5,
    y: 4.05,
    w: 9,
    h: 0.7,
    fontSize: 13,
    color: C.muted,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Presentasi untuk Tim HSE · 2026', {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.35,
    fontSize: 11,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 2 — Section: Konteks
sectionDivider('Konteks & Tujuan', 'Mengapa Safety Observation Card dibuat?')

// 3 — Latar Belakang + Tujuan (two column)
{
  const slide = contentSlide('Latar Belakang & Tujuan', 'Digitalisasi pelaporan keselamatan di area terminal')
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.15,
    w: 4.35,
    h: 3.85,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Latar Belakang', {
    x: 0.6,
    y: 1.3,
    w: 4,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'Pelaporan keselamatan di lapangan perlu cepat — dari HP, tanpa login rumit.',
      'Data harus terpusat agar HSE bisa follow-up, assign PIC, dan menutup laporan.',
      'Mengacu praktik industri migas: ISO 45001, IOGP Life Saving Rules, HiPo management.',
      'Menggantikan formulir manual dengan sistem digital terintegrasi.',
    ],
    { x: 0.6, y: 1.7, w: 4.0, h: 3.1, fontSize: 12 },
  )
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.25,
    y: 1.15,
    w: 4.35,
    h: 3.85,
    fill: { color: C.dark },
    line: { color: C.orange, width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Tujuan Aplikasi', {
    x: 5.45,
    y: 1.3,
    w: 4,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText(
    [
      'Mempermudah pelaporan unsafe act, unsafe condition, near miss, dan observasi positif.',
      'Dokumentasi bukti foto + koordinat GPS lokasi kejadian.',
      'Workflow admin lengkap: triage → investigasi → CAPA → verifikasi → closed.',
      'Dashboard analitik, KPI, scorecard kontraktor, dan peta hotspot.',
      'Notifikasi real-time ke tim HSE (dashboard + email).',
    ].map((b) => ({ text: b, options: { bullet: { code: '2022' }, breakLine: true, color: 'E2E8F0' } })),
    { x: 5.45, y: 1.7, w: 4.0, h: 3.1, fontSize: 12, fontFace: FONT, valign: 'top', paraSpaceAfter: 6 },
  )
}

// 4 — Aktor sistem (role cards)
{
  const slide = contentSlide('Siapa Penggunanya?', 'Aktor sistem & peran masing-masing')
  const actors = [
    { title: 'Pelapor', body: 'Karyawan, kontraktor, visitor — akses form publik tanpa login.', color: C.blue },
    { title: 'HSE Officer', body: 'Review laporan, triage, investigasi, verifikasi penutupan.', color: C.orange },
    { title: 'PIC / Departemen', body: 'Menindaklanjuti laporan yang di-assign ke departemennya.', color: C.amber },
    { title: 'Admin', body: 'Kelola KPI, email notifikasi, akses penuh sistem.', color: C.purple },
    { title: 'Viewer', body: 'Hanya melihat data — read-only, tanpa edit.', color: C.gray },
  ]
  actors.forEach((a, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    featureBox(slide, {
      x: 0.4 + col * 3.15,
      y: 1.15 + row * 1.95,
      w: 2.95,
      h: 1.75,
      title: a.title,
      body: a.body,
      accent: a.color,
    })
  })
}

// 5 — Section: Form
sectionDivider('Form Pelaporan', 'Akses publik dari HP — tanpa login')

// 6 — Form features (grid)
{
  const slide = contentSlide('Form Pelaporan (Publik)', APP_URL)
  const features = [
    { t: 'Data Pelapor', b: 'Nama, departemen, perusahaan — opsi laporan anonim.', c: C.blue },
    { t: 'Lokasi & GPS', b: 'Lokasi kejadian (teks) + tombol ambil GPS otomatis.', c: C.orange },
    { t: 'Kategori', b: 'Unsafe Act, Unsafe Condition, Near Miss, Positive Observation.', c: C.amber },
    { t: 'Tingkat Risiko', b: 'Risiko aktual & potensial: Low / Medium / High.', c: C.red },
    { t: 'Foto Bukti', b: 'Upload satu atau lebih foto bukti kejadian.', c: C.indigo },
    { t: 'Tindakan & Rekomendasi', b: 'Tindakan langsung di lapangan + rekomendasi perbaikan.', c: C.green },
    { t: 'IOGP & Stop Work', b: 'Field Life Saving Rules + checkbox Stop Work.', c: C.purple },
    { t: 'PWA Offline', b: 'Install di HP; laporan offline tersimpan & sync otomatis.', c: C.slate },
  ]
  features.forEach((f, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    featureBox(slide, {
      x: 0.35 + col * 2.35,
      y: 1.1 + row * 1.95,
      w: 2.2,
      h: 1.75,
      title: f.t,
      body: f.b,
      accent: f.c,
    })
  })
}

// 7 — IOGP + HiPo (two column)
{
  const slide = contentSlide('IOGP Life Saving Rules & HiPo', 'Prioritas investigasi & deteksi otomatis')
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.1,
    w: 4.4,
    h: 3.9,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('IOGP Life Saving Rules', {
    x: 0.6,
    y: 1.25,
    w: 4,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: C.indigo,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'IOGP = International Association of Oil & Gas Producers.',
      '9 aturan penyelamat nyawa di industri oil & gas.',
      'Field form mencatat apakah observasi terkait salah satu LSR.',
      'Pilihan: Bypassing Safety, Confined Space, Driving, Hot Work, dll.',
      '"Tidak terkait" = observasi di luar kategori Life Saving Rule.',
      'Manfaat: prioritas investigasi lebih tinggi + mendukung audit migas.',
    ],
    { x: 0.6, y: 1.65, w: 4.0, h: 3.1, fontSize: 11 },
  )
  // HiPo stat cards
  statCard(slide, { x: 5.1, y: 1.1, w: 2.0, h: 1.15, value: 'HiPo', label: 'High Potential — potensi cedera serius/fatal', color: C.red })
  statCard(slide, { x: 7.3, y: 1.1, w: 2.0, h: 1.15, value: '24j', label: 'Deadline eskalasi — banner merah jika terlambat', color: C.redDark })
  statCard(slide, { x: 5.1, y: 2.45, w: 2.0, h: 1.15, value: 'Stop Work', label: 'Pekerjaan di area dihentikan sementara', color: C.amber })
  statCard(slide, { x: 7.3, y: 2.45, w: 2.0, h: 1.15, value: 'Auto', label: 'Deteksi otomatis: risiko High, near miss High, Stop Work', color: C.orange })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.1,
    y: 3.75,
    w: 4.2,
    h: 1.2,
    fill: { color: C.redDark },
    rectRadius: 0.08,
  })
  slide.addText('Laporan HiPo langsung status "Under Review" — bukan Open biasa', {
    x: 5.25,
    y: 3.95,
    w: 3.9,
    h: 0.8,
    fontSize: 12,
    bold: true,
    color: C.white,
    align: 'center',
    valign: 'mid',
    fontFace: FONT,
  })
}

// 8 — Section: Dashboard
sectionDivider('Dashboard HSE', 'Command center untuk tim HSSE')

// 9 — Dashboard (stat cards + bullets)
{
  const slide = contentSlide('Dashboard Admin — Command Center', '/admin (perlu login)')
  statCard(slide, { x: 0.4, y: 1.05, w: 2.15, h: 1.1, value: 'Live', label: 'Traffic & statistik real-time', color: C.orange })
  statCard(slide, { x: 2.7, y: 1.05, w: 2.15, h: 1.1, value: 'HiPo', label: 'Alert & eskalasi 24 jam', color: C.red })
  statCard(slide, { x: 5.0, y: 1.05, w: 2.15, h: 1.1, value: '14d', label: 'Chart tren laporan', color: C.blue })
  statCard(slide, { x: 7.3, y: 1.05, w: 2.15, h: 1.1, value: 'PDF', label: 'Export Notice BACT', color: C.green })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 2.35,
    w: 9.05,
    h: 2.55,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Fitur Utama Dashboard', {
    x: 0.6,
    y: 2.5,
    w: 4,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'Banner notifikasi laporan baru saat login.',
      'Daftar laporan dengan filter status & HiPo.',
      'Detail panel: assign PIC, ubah status workflow, catatan triage.',
      'Tampilan mobile: card list + bottom navigation.',
      'Export PDF per laporan (format Notice of Safety Violation BACT).',
    ],
    { x: 0.6, y: 2.85, w: 8.6, h: 1.9, fontSize: 12 },
  )
}

// 10 — Workflow status (visual pipeline)
{
  const slide = contentSlide('Workflow Status — 6 Tahap', 'Alur penanganan laporan HSE')
  const y = 2.0
  const bw = 1.35
  const bh = 0.75
  const gap = 0.38
  let x = 0.35
  const statuses = [
    { t: 'Open', c: C.blue, desc: 'Baru masuk' },
    { t: 'Under\nReview', c: C.orange, desc: 'Triage HSE' },
    { t: 'In\nProgress', c: C.amber, desc: 'PIC tindak' },
    { t: 'Pending\nVerification', c: C.purple, desc: 'Verifikasi' },
    { t: 'Closed', c: C.green, desc: 'Selesai' },
  ]
  statuses.forEach((s, i) => {
    flowBox(slide, { x, y, w: bw, h: bh, text: s.t, fill: s.c, fontSize: 10 })
    slide.addText(s.desc, {
      x,
      y: y + bh + 0.08,
      w: bw,
      h: 0.3,
      fontSize: 8,
      color: C.slateLight,
      align: 'center',
      fontFace: FONT,
    })
    if (i < statuses.length - 1) arrowRight(slide, x + bw + 0.04, y + bh / 2 - 0.1, 0.32)
    x += bw + gap
  })
  flowBox(slide, { x: 3.5, y: 3.55, w: 1.5, h: 0.55, text: 'Rejected', fill: C.gray, fontSize: 10 })
  slide.addShape(pptx.ShapeType.line, {
    x: 4.25,
    y: y + bh,
    w: 0,
    h: 0.55,
    line: { color: C.gray, width: 1, dashType: 'dash' },
  })
  slide.addText('(dari Under Review jika tidak valid / duplikat)', {
    x: 2.5,
    y: 4.2,
    w: 4,
    h: 0.3,
    fontSize: 9,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 11 — CAPA / Investigasi / Audit
{
  const slide = contentSlide('Investigasi · CAPA · Audit Trail', 'Tab detail laporan untuk penanganan mendalam')
  const tabs = [
    { t: 'Detail', b: 'Info lengkap, foto, assign PIC, ubah status, catatan triage.', c: C.orange },
    { t: 'Investigasi', b: 'Catatan investigasi lapangan + root cause (5 Whys) untuk HiPo/High.', c: C.red },
    { t: 'CAPA', b: 'Corrective & Preventive Action: judul, owner, due date, status.', c: C.purple },
    { t: 'Audit', b: 'Riwayat semua perubahan — siapa, kapan, apa yang diubah.', c: C.indigo },
  ]
  tabs.forEach((tab, i) => {
    featureBox(slide, {
      x: 0.4 + (i % 2) * 4.7,
      y: 1.15 + Math.floor(i / 2) * 1.95,
      w: 4.45,
      h: 1.75,
      title: tab.t,
      body: tab.b,
      accent: tab.c,
    })
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 4.15,
    w: 9.05,
    h: 0.65,
    fill: { color: C.dark },
    rectRadius: 0.08,
  })
  slide.addText('Semua perubahan status tercatat otomatis di Audit Trail', {
    x: 0.6,
    y: 4.28,
    w: 8.7,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: C.orange,
    align: 'center',
    fontFace: FONT,
  })
}

// 12 — Section: Analitik
sectionDivider('Analitik & Operasional', 'Data-driven safety management')

// 13 — Analitik & KPI (stat cards)
{
  const slide = contentSlide('Analitik & KPI', '/admin/ringkasan')
  statCard(slide, { x: 0.4, y: 1.05, w: 2.15, h: 1.05, value: 'Total', label: 'Semua laporan + aktif + closed', color: C.orange })
  statCard(slide, { x: 2.7, y: 1.05, w: 2.15, h: 1.05, value: 'HiPo', label: 'High potential & high risk', color: C.red })
  statCard(slide, { x: 5.0, y: 1.05, w: 2.15, h: 1.05, value: 'Positif', label: 'Observasi positif & rasio', color: C.green })
  statCard(slide, { x: 7.3, y: 1.05, w: 2.15, h: 1.05, value: 'KPI', label: 'Target vs aktual bulan ini', color: C.purple })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 2.3,
    w: 4.4,
    h: 2.6,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Visualisasi Data', {
    x: 0.6,
    y: 2.45,
    w: 4,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'Chart distribusi kategori & tingkat risiko.',
      'Top departemen pelapor.',
      'Scorecard kontraktor (HiPo, open, positif per perusahaan).',
      'Rata-rata hari penutupan laporan.',
    ],
    { x: 0.6, y: 2.8, w: 4.0, h: 2.0, fontSize: 11 },
  )
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.05,
    y: 2.3,
    w: 4.4,
    h: 2.6,
    fill: { color: C.dark },
    line: { color: C.orange, width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Export & Laporan', {
    x: 5.25,
    y: 2.45,
    w: 4,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText(
    [
      'Export CSV semua data laporan.',
      'PDF Notice per laporan (format BACT).',
      'Data siap untuk review manajemen & audit.',
    ].map((b) => ({ text: b, options: { bullet: { code: '2022' }, breakLine: true, color: 'E2E8F0' } })),
    { x: 5.25, y: 2.8, w: 4.0, h: 2.0, fontSize: 11, fontFace: FONT, valign: 'top' },
  )
}

// 14 — Peta + Notifikasi Email (two column, email highlighted)
{
  const slide = contentSlide('Peta Hotspot & Notifikasi Email', 'Visualisasi lokasi + alert otomatis ke tim HSE')
  // Peta
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.1,
    w: 4.4,
    h: 3.85,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Peta Hotspot GPS', {
    x: 0.6,
    y: 1.25,
    w: 4,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: C.blue,
    fontFace: FONT,
  })
  slide.addText('/admin/peta', {
    x: 0.6,
    y: 1.55,
    w: 4,
    h: 0.25,
    fontSize: 10,
    color: C.slateLight,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'Peta interaktif OpenStreetMap dengan pin lokasi laporan.',
      'Hanya laporan dengan GPS aktif saat submit yang muncul.',
      'Klik pin: ringkasan pelapor, kategori, lokasi.',
      'Identifikasi area rawan / hotspot insiden berulang.',
    ],
    { x: 0.6, y: 1.9, w: 4.0, h: 2.8, fontSize: 11 },
  )
  // Email — highlighted
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.05,
    y: 1.1,
    w: 4.4,
    h: 3.85,
    fill: { color: C.green },
    rectRadius: 0.1,
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.2,
    y: 1.25,
    w: 1.6,
    h: 0.4,
    fill: { color: C.white },
    rectRadius: 0.06,
  })
  slide.addText('✓ BERFUNGSI', {
    x: 5.2,
    y: 1.28,
    w: 1.6,
    h: 0.35,
    fontSize: 10,
    bold: true,
    color: C.green,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Notifikasi Email', {
    x: 5.25,
    y: 1.75,
    w: 4,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText('/admin/pengaturan', {
    x: 5.25,
    y: 2.05,
    w: 4,
    h: 0.25,
    fontSize: 10,
    color: 'D1FAE5',
    fontFace: FONT,
  })
  slide.addText(
    [
      'Setiap laporan baru → antrian → email ke tim HSE.',
      'Admin kelola daftar penerima dari dashboard.',
      'HiPo: email prioritas dengan subject khusus.',
      'Tombol "Kirim antrian sekarang" untuk test manual.',
      'Resend API via Supabase Edge Functions.',
    ].map((b) => ({ text: b, options: { bullet: { code: '2022' }, breakLine: true, color: C.white } })),
    { x: 5.25, y: 2.4, w: 4.0, h: 2.4, fontSize: 11, fontFace: FONT, valign: 'top' },
  )
}

// 15 — QR + Roles
{
  const slide = contentSlide('QR Code & Role / Hak Akses', 'Akses cepat lapangan + keamanan berbasis peran')
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4,
    y: 1.1,
    w: 3.8,
    h: 3.85,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('QR Code & Akses Cepat', {
    x: 0.6,
    y: 1.25,
    w: 3.5,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  bulletList(
    slide,
    [
      'Halaman poster QR (/qr) untuk area kerja terminal.',
      'Scan QR → langsung ke form pelaporan.',
      'File QR statis di public/qr untuk print.',
      'npm run generate:qr jika URL berubah.',
    ],
    { x: 0.6, y: 1.7, w: 3.4, h: 3.0, fontSize: 11 },
  )
  // Role table
  slide.addTable(
    [
      [
        { text: 'Role', options: { bold: true, fill: { color: C.orange }, color: C.white } },
        { text: 'Hak Akses', options: { bold: true, fill: { color: C.orange }, color: C.white } },
      ],
      ['admin', 'Akses penuh + kelola email notifikasi & KPI'],
      ['hse', 'Review, edit, investigasi, CAPA, verifikasi'],
      ['pic', 'Lihat & edit laporan di-assign ke departemennya'],
      ['viewer', 'Read-only — tidak bisa ubah data'],
    ],
    {
      x: 4.45,
      y: 1.1,
      w: 5.0,
      fontSize: 11,
      fontFace: FONT,
      border: { type: 'solid', color: 'E2E8F0' },
      align: 'left',
      colW: [1.2, 3.8],
    },
  )
  slide.addText('Role diset di Supabase Auth → User Metadata', {
    x: 4.45,
    y: 4.55,
    w: 5.0,
    h: 0.3,
    fontSize: 9,
    italic: true,
    color: C.slateLight,
    fontFace: FONT,
  })
}

// 16 — Section: Alur Sistem
sectionDivider('Alur Sistem', 'Flow diagram — dari pelapor sampai closed')

// 17 — Flow 1: Overview
{
  const slide = flowSlide('Flow — Gambaran Umum Sistem', 'Dari pelapor sampai laporan ditutup')
  const y = 2.05
  const bw = 1.45
  const bh = 0.7
  const gap = 0.5
  let x = 0.4
  const nodes = [
    { t: 'Pelapor\n(Karyawan /\nKontraktor)', c: C.blue },
    { t: 'Form SOC\n+ Foto + GPS', c: C.orange },
    { t: 'Supabase\nDB + Storage', c: C.indigo },
    { t: 'Notifikasi\nDashboard +\nEmail', c: C.amber },
    { t: 'HSE Review\nAssign PIC', c: C.orange },
    { t: 'Closed\n✓', c: C.green },
  ]
  nodes.forEach((n, i) => {
    flowBox(slide, { x, y, w: bw, h: bh, text: n.t, fill: n.c, fontSize: 9 })
    if (i < nodes.length - 1) arrowRight(slide, x + bw + 0.05, y + bh / 2 - 0.1, 0.38)
    x += bw + gap
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 3.35,
    w: 8.0,
    h: 0.55,
    fill: { color: C.darkAlt },
    rectRadius: 0.06,
  })
  slide.addText('Aktor: Pelapor (publik, tanpa login)  →  Cloud Supabase + Vercel  →  Tim HSE (login admin)', {
    x: 1.2,
    y: 3.45,
    w: 7.6,
    h: 0.35,
    fontSize: 10,
    color: C.muted,
    align: 'center',
    fontFace: FONT,
  })
}

// 18 — Flow 2: Pelapor
{
  const slide = flowSlide('Flow — Alur Pelapor', 'Langkah submit laporan dari lapangan')
  const cx = 4.85
  const bw = 3.4
  const bh = 0.48
  let y = 1.08
  const steps = [
    { t: '1. Buka App / Scan QR Code', c: C.blue },
    { t: '2. Isi Data Pelapor & Perusahaan', c: C.orange },
    { t: '3. Isi Lokasi + Ambil GPS', c: C.orange },
    { t: '4. Pilih Kategori & Tingkat Risiko', c: C.orange },
    { t: '5. Upload Foto Bukti', c: C.orange },
    { t: '6. Sistem Deteksi HiPo Otomatis', c: C.red },
    { t: '7. Submit → Storage + Database', c: C.indigo },
    { t: '8. Notifikasi ke Tim HSE', c: C.amber },
    { t: '9. Konfirmasi Sukses ke Pelapor', c: C.green },
  ]
  steps.forEach((s, i) => {
    flowBox(slide, { x: cx - bw / 2, y, w: bw, h: bh, text: s.t, fill: s.c, fontSize: 9 })
    if (i < steps.length - 1) arrowDown(slide, cx - 0.1, y + bh + 0.02, 0.22)
    y += bh + 0.28
  })
  flowBox(slide, {
    x: 0.45,
    y: 3.5,
    w: 2.0,
    h: 0.65,
    text: 'Offline?\nSimpan lokal',
    fill: C.gray,
    color: C.white,
    fontSize: 9,
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 2.45,
    y: 3.8,
    w: 1.1,
    h: 0,
    line: { color: C.gray, width: 1, dashType: 'dash' },
  })
  slide.addText('Auto-sync saat online', {
    x: 0.45,
    y: 4.25,
    w: 2.0,
    h: 0.25,
    fontSize: 8,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 19 — Flow 3: HSE Admin
{
  const slide = flowSlide('Flow — Alur HSE / Admin', 'Penanganan laporan dari notifikasi sampai closed')
  const y0 = 1.15
  const bw = 1.85
  const bh = 0.55

  flowBox(slide, { x: 0.4, y: y0, w: bw, h: bh, text: 'Terima\nNotifikasi', fill: C.amber, fontSize: 9 })
  arrowRight(slide, 2.3, y0 + 0.18)
  flowBox(slide, { x: 2.75, y: y0, w: bw, h: bh, text: 'Login\nDashboard', fill: C.orange, fontSize: 9 })
  arrowRight(slide, 4.65, y0 + 0.18)
  flowBox(slide, { x: 5.1, y: y0, w: bw, h: bh, text: 'Detail\nLaporan', fill: C.orange, fontSize: 9 })
  arrowRight(slide, 7.0, y0 + 0.18)
  flowBox(slide, { x: 7.45, y: y0, w: 1.7, h: bh, text: 'Triage\nHSE', fill: C.orange, fontSize: 9 })

  arrowDown(slide, 3.7, y0 + bh + 0.04, 0.28)
  flowBox(slide, { x: 2.6, y: y0 + bh + 0.45, w: 2.2, h: 0.5, text: 'HiPo / High Risk?', fill: C.red, fontSize: 9 })
  arrowRight(slide, 4.85, y0 + bh + 0.6)
  flowBox(slide, {
    x: 5.3,
    y: y0 + bh + 0.38,
    w: 2.5,
    h: 0.65,
    text: 'Ya → Investigasi\n+ Root Cause (5 Whys)',
    fill: C.redDark,
    fontSize: 8,
  })

  arrowDown(slide, 3.6, y0 + bh + 1.05, 0.25)
  flowBox(slide, { x: 2.6, y: y0 + bh + 1.4, w: 2.2, h: 0.5, text: 'Assign PIC', fill: C.orange, fontSize: 9 })
  arrowRight(slide, 4.85, y0 + bh + 1.55)
  flowBox(slide, { x: 5.3, y: y0 + bh + 1.4, w: 2.5, h: 0.5, text: 'Buat CAPA', fill: C.purple, fontSize: 9 })

  arrowDown(slide, 3.6, y0 + bh + 1.95, 0.25)
  flowBox(slide, { x: 2.2, y: y0 + bh + 2.3, w: 1.85, h: 0.5, text: 'In Progress', fill: C.amber, fontSize: 9 })
  arrowRight(slide, 4.1, y0 + bh + 2.45)
  flowBox(slide, { x: 4.55, y: y0 + bh + 2.3, w: 2.0, h: 0.5, text: 'Pending\nVerification', fill: C.purple, fontSize: 9 })
  arrowRight(slide, 6.6, y0 + bh + 2.45)
  flowBox(slide, { x: 7.05, y: y0 + bh + 2.3, w: 1.5, h: 0.5, text: 'Closed ✓', fill: C.green, fontSize: 9 })

  slide.addText('Semua perubahan tercatat otomatis di tab Audit Trail', {
    x: 0.5,
    y: 4.85,
    w: 9,
    h: 0.3,
    fontSize: 10,
    italic: true,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 20 — Flow 4: Notifikasi Email
{
  const slide = flowSlide('Flow — Notifikasi Email', 'Otomatis saat ada laporan baru — sudah aktif & berfungsi')
  const y = 2.0
  const bw = 1.65
  const bh = 0.6

  flowBox(slide, { x: 0.35, y, w: bw, h: bh, text: 'Laporan\nBaru Submit', fill: C.orange, fontSize: 9 })
  arrowRight(slide, 2.05, y + 0.2)
  flowBox(slide, { x: 2.5, y, w: bw, h: bh, text: 'Trigger SQL\nnotification_queue', fill: C.indigo, fontSize: 8 })
  arrowRight(slide, 4.2, y + 0.2)
  flowBox(slide, { x: 4.65, y, w: bw, h: bh, text: 'Webhook\nSupabase', fill: C.indigo, fontSize: 9 })
  arrowRight(slide, 6.35, y + 0.2)
  flowBox(slide, { x: 6.8, y, w: bw, h: bh, text: 'Edge Function\n+ Resend', fill: C.amber, fontSize: 9 })

  arrowDown(slide, 1.05, y + bh + 0.04, 0.3)
  flowBox(slide, { x: 0.35, y: y + bh + 0.45, w: bw, h: bh, text: 'Banner\nDashboard', fill: C.blue, fontSize: 9 })

  arrowDown(slide, 5.45, y + bh + 0.04, 0.3)
  flowBox(slide, { x: 4.65, y: y + bh + 0.45, w: bw, h: bh, text: 'Email ke\nDaftar HSE', fill: C.green, fontSize: 9 })

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.5,
    y: 3.55,
    w: 5.0,
    h: 0.7,
    fill: { color: C.green },
    rectRadius: 0.08,
  })
  slide.addText('✓ Email penerima dikelola di Admin → Pengaturan (tanpa ubah kode)', {
    x: 2.65,
    y: 3.68,
    w: 4.7,
    h: 0.45,
    fontSize: 11,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
}

// 21 — Flow 5: Arsitektur
{
  const slide = flowSlide('Flow — Arsitektur Sistem', 'Komponen teknis & alur data')
  const layers = [
    { y: 1.15, label: 'Pengguna', items: ['Pelapor (Browser/HP)', 'Admin HSE (Browser)'], c: C.blue },
    { y: 2.05, label: 'Frontend', items: ['React + Vite + Tailwind', 'Vercel CDN (global)'], c: C.orange },
    { y: 2.95, label: 'Backend', items: ['Supabase PostgreSQL', 'Storage (Foto)', 'Auth', 'Edge Functions'], c: C.indigo },
    { y: 3.85, label: 'Eksternal', items: ['Resend (Email)', 'OpenStreetMap (Peta)'], c: C.green },
  ]
  layers.forEach((layer) => {
    slide.addText(layer.label, {
      x: 0.35,
      y: layer.y + 0.12,
      w: 1.15,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: C.slate,
      align: 'right',
      fontFace: FONT,
    })
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.6,
      y: layer.y,
      w: 7.9,
      h: 0.68,
      fill: { color: layer.c, transparency: 88 },
      line: { color: layer.c, width: 1.5 },
      rectRadius: 0.06,
    })
    slide.addText(layer.items.join('   ·   '), {
      x: 1.75,
      y: layer.y + 0.08,
      w: 7.6,
      h: 0.52,
      fontSize: 10,
      color: C.dark,
      valign: 'mid',
      fontFace: FONT,
    })
    if (layer.y < 3.85) arrowDown(slide, 5.4, layer.y + 0.72, 0.2)
  })
  slide.addText('PWA: vite-plugin-pwa — install di HP, cache offline, auto-sync', {
    x: 0.5,
    y: 4.75,
    w: 9,
    h: 0.3,
    fontSize: 10,
    italic: true,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 22 — URL Table
{
  const slide = contentSlide('Ringkasan URL Aplikasi', 'Akses cepat — ' + APP_URL)
  slide.addTable(
    [
      [
        { text: 'Halaman', options: { bold: true, fill: { color: C.orange }, color: C.white } },
        { text: 'URL', options: { bold: true, fill: { color: C.orange }, color: C.white } },
        { text: 'Akses', options: { bold: true, fill: { color: C.orange }, color: C.white } },
      ],
      ['Form Pelapor', '/', 'Publik'],
      ['QR Poster', '/qr', 'Publik'],
      ['Login Admin', '/admin/login', 'Publik'],
      ['Dashboard', '/admin', 'Admin / HSE / PIC / Viewer'],
      ['Analitik & KPI', '/admin/ringkasan', 'Viewer+'],
      ['Peta GPS', '/admin/peta', 'Viewer+'],
      ['Notifikasi Email', '/admin/pengaturan', 'HSE+'],
    ],
    {
      x: 0.5,
      y: 1.15,
      w: 9,
      fontSize: 12,
      fontFace: FONT,
      border: { type: 'solid', color: 'E2E8F0' },
      align: 'left',
      colW: [2.5, 3.5, 3.0],
    },
  )
}

// 23 — Closing Q&A
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.orange } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.57, w: '100%', h: 0.06, fill: { color: C.orange } })
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 3.85, y: 1.0, w: 2.3, h: 0.75 })
  }
  slide.addText('Terima Kasih', {
    x: 0.5,
    y: 2.1,
    w: 9,
    h: 0.85,
    fontSize: 42,
    bold: true,
    color: C.orange,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Pertanyaan & Diskusi', {
    x: 0.5,
    y: 3.05,
    w: 9,
    h: 0.5,
    fontSize: 22,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Demo live: ' + APP_URL, {
    x: 0.5,
    y: 4.0,
    w: 9,
    h: 0.4,
    fontSize: 13,
    color: C.muted,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('PT. BACT — Batu Ampar Container Terminal · An ICTSI Group Company', {
    x: 0.5,
    y: 4.65,
    w: 9,
    h: 0.35,
    fontSize: 10,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// ─── Write output ────────────────────────────────────────────────────────────
try {
  await pptx.writeFile({ fileName: outPath })
  console.log('Presentasi dibuat:', outPath)
} catch (err) {
  if (err.code === 'EBUSY' || err.code === 'EPERM') {
    const fallback = path.join(root, 'supabase', 'BACT-SOC-Presentasi-HSE-generated.pptx')
    await pptx.writeFile({ fileName: fallback })
    console.warn('File utama sedang dibuka — disimpan ke:', fallback)
    console.warn('Tutup PowerPoint lalu jalankan ulang npm run generate:ppt')
  } else {
    throw err
  }
}
console.log('Total slide:', pptx.slides.length)
