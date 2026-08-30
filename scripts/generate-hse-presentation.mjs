/**
 * Presentasi HSE ringkas — BACT Safety Observation Card
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

const C = {
  orange: 'F37021',
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
  purple: '8B5CF6',
}

const FONT = 'Segoe UI'
const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'PT. BACT HSSE'
pptx.title = 'Safety Observation Card — Alur Kerja HSE'
pptx.company = 'PT. BACT — Batu Ampar Container Terminal'

function addFooter(slide) {
  slide.addText('PT. BACT · Safety Observation Card · 2026', {
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
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.88, fill: { color: C.dark } })
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 0.3, y: 0.16, w: 1.3, h: 0.5 })
  }
  slide.addText(title, {
    x: 1.8,
    y: 0.14,
    w: 7.8,
    h: 0.38,
    fontSize: 20,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.8,
      y: 0.5,
      w: 7.8,
      h: 0.28,
      fontSize: 11,
      color: C.muted,
      fontFace: FONT,
    })
  }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.88, w: '100%', h: 0.035, fill: { color: C.orange } })
  addFooter(slide)
  return slide
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
    x: x + 0.12,
    y: y + 0.14,
    w: 0.28,
    h: 0.28,
    fill: { color: accent },
    rectRadius: 0.05,
  })
  slide.addText(title, {
    x: x + 0.5,
    y: y + 0.1,
    w: w - 0.6,
    h: 0.32,
    fontSize: 11,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  slide.addText(body, {
    x: x + 0.12,
    y: y + 0.48,
    w: w - 0.24,
    h: h - 0.58,
    fontSize: 10,
    color: C.slate,
    fontFace: FONT,
    valign: 'top',
  })
}

function flowBox(slide, { x, y, w, h, text, fill = C.orange, fontSize = 10 }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.07,
  })
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontSize,
    bold: true,
    color: C.white,
    align: 'center',
    valign: 'mid',
    fontFace: FONT,
  })
}

function arrowRight(slide, x, y, w = 0.32) {
  slide.addShape(pptx.ShapeType.rightArrow, {
    x,
    y,
    w,
    h: 0.16,
    fill: { color: C.slateLight },
  })
}

function arrowDown(slide, x, y, h = 0.26) {
  slide.addShape(pptx.ShapeType.downArrow, {
    x,
    y,
    w: 0.16,
    h,
    fill: { color: C.slateLight },
  })
}

// 1 — Cover
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.orange } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: '100%', h: 0.08, fill: { color: C.orange } })
  if (fs.existsSync(logoWhite)) {
    slide.addImage({ path: logoWhite, x: 3.1, y: 0.7, w: 3.8, h: 1.15 })
  } else if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 3.4, y: 0.75, w: 3.2, h: 1.0 })
  }
  slide.addText('Safety Observation Card', {
    x: 0.5,
    y: 2.15,
    w: 9,
    h: 0.65,
    fontSize: 34,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Alur Kerja Pelaporan & Tindak Lanjut HSE', {
    x: 0.5,
    y: 2.85,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: C.orange,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('PT. BACT — Batu Ampar Container Terminal  ·  An ICTSI Group Company', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.35,
    fontSize: 12,
    color: C.muted,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('10 slide  ·  Form publik · Dashboard HSE · Notifikasi email · CAPA', {
    x: 0.5,
    y: 4.55,
    w: 9,
    h: 0.3,
    fontSize: 11,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 2 — Latar & tujuan
{
  const slide = contentSlide('Mengapa & untuk apa', 'Digitalisasi observasi keselamatan di area terminal')
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.35,
    y: 1.12,
    w: 4.5,
    h: 3.85,
    fill: { color: C.white },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  })
  slide.addText('Masalah lama', {
    x: 0.55,
    y: 1.25,
    w: 4.1,
    h: 0.32,
    fontSize: 13,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText(
    [
      { text: 'Pelaporan kertas / chat tidak terpusat.', options: { bullet: true, breakLine: true } },
      { text: 'Follow-up PIC sulit dilacak sampai closed.', options: { bullet: true, breakLine: true } },
      { text: 'Tidak ada bukti foto, GPS, atau jejak audit.', options: { bullet: true, breakLine: true } },
      { text: 'HiPo / Near Miss terlambat diketahui HSE.', options: { bullet: true, breakLine: true } },
    ],
    { x: 0.55, y: 1.65, w: 4.1, h: 3.1, fontSize: 13, color: C.slate, fontFace: FONT, paraSpaceAfter: 8 },
  )

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15,
    y: 1.12,
    w: 4.5,
    h: 3.85,
    fill: { color: C.dark },
    rectRadius: 0.1,
  })
  slide.addText('Yang diselesaikan aplikasi', {
    x: 5.35,
    y: 1.25,
    w: 4.1,
    h: 0.32,
    fontSize: 13,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText(
    [
      { text: 'Lapor dari HP, tanpa login, lewat QR.', options: { bullet: true, breakLine: true } },
      { text: 'Foto + GPS + kategori + risiko tersimpan.', options: { bullet: true, breakLine: true } },
      { text: 'HSE dapat email otomatis ke daftar penerima.', options: { bullet: true, breakLine: true } },
      { text: 'Workflow: Open → investigasi → CAPA → Closed.', options: { bullet: true, breakLine: true } },
    ],
    { x: 5.35, y: 1.65, w: 4.1, h: 3.1, fontSize: 13, color: 'E2E8F0', fontFace: FONT, paraSpaceAfter: 8 },
  )
}

// 3 — Pengguna
{
  const slide = contentSlide('Siapa yang memakai', 'Satu aplikasi, dua pintu: publik & login HSE')
  const actors = [
    { t: 'Pelapor', b: 'Karyawan, kontraktor, visitor. Isi form publik — tanpa akun.', c: C.blue },
    { t: 'HSE Officer', b: 'Review, triage, investigasi, verifikasi, kelola email notifikasi.', c: C.orange },
    { t: 'PIC / Dept', b: 'Tindak lanjut laporan yang di-assign ke departemennya.', c: C.amber },
    { t: 'Admin', b: 'Akses penuh: KPI, penerima email, seluruh laporan.', c: C.purple },
  ]
  actors.forEach((a, i) => {
    featureBox(slide, {
      x: 0.35 + (i % 4) * 2.35,
      y: 1.2,
      w: 2.2,
      h: 2.15,
      title: a.t,
      body: a.b,
      accent: a.c,
    })
  })
  slide.addText('ISO 45001  ·  IOGP Life Saving Rules  ·  HiPo otomatis jika Near Miss / High / Stop Work / LSR', {
    x: 0.4,
    y: 3.6,
    w: 9.2,
    h: 0.4,
    fontSize: 12,
    color: C.slate,
    fontFace: FONT,
  })
  slide.addText('Kategori: Unsafe Act · Unsafe Condition · Near Miss · Positive Observation', {
    x: 0.4,
    y: 4.05,
    w: 9.2,
    h: 0.35,
    fontSize: 12,
    color: C.slateLight,
    fontFace: FONT,
  })
}

// 4 — Form
{
  const slide = contentSlide('Form lapangan (tanpa login)', APP_URL)
  const items = [
    { t: 'Identitas', b: 'Nama, departemen, perusahaan. Opsi laporan anonim.', c: C.blue },
    { t: 'Lokasi + GPS', b: 'Teks lokasi + tombol ambil koordinat HP.', c: C.orange },
    { t: 'Kategori & risiko', b: '4 kategori · Low / Medium / High · potensi risiko.', c: C.amber },
    { t: 'Foto bukti', b: 'Beberapa foto, tersimpan di Storage.', c: C.indigo },
    { t: 'IOGP & Stop Work', b: 'Life Saving Rules + checkbox stop kerja.', c: C.red },
    { t: 'Offline (PWA)', b: 'Bisa di-install. Offline tersimpan, sync otomatis.', c: C.green },
  ]
  items.forEach((f, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    featureBox(slide, {
      x: 0.35 + col * 3.15,
      y: 1.15 + row * 1.85,
      w: 3.0,
      h: 1.7,
      title: f.t,
      body: f.b,
      accent: f.c,
    })
  })
}

// 5 — Flow pelapor
{
  const slide = contentSlide('Alur pelapor', 'Dari scan QR sampai HSE mendapat email')
  const steps = [
    { t: 'Scan QR\n/ buka web', c: C.blue },
    { t: 'Isi form\n+ foto + GPS', c: C.orange },
    { t: 'HiPo?\nDeteksi otomatis', c: C.red },
    { t: 'Simpan DB\n+ Storage', c: C.indigo },
    { t: 'Antrian\nnotifikasi', c: C.amber },
    { t: 'Email HSE\n+ banner admin', c: C.green },
  ]
  steps.forEach((s, i) => {
    const x = 0.3 + i * 1.6
    flowBox(slide, { x, y: 1.7, w: 1.4, h: 0.95, text: s.t, fill: s.c, fontSize: 11 })
    if (i < steps.length - 1) arrowRight(slide, x + 1.42, 2.08, 0.16)
  })
  slide.addText(
    'Kalau HP offline: laporan disimpan di perangkat, terkirim sendiri saat sinyal kembali. Pelapor tidak perlu akun.',
    {
      x: 0.4,
      y: 3.0,
      w: 9.2,
      h: 0.55,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.35,
    y: 3.7,
    w: 9.3,
    h: 1.15,
    fill: { color: C.dark },
    rectRadius: 0.08,
  })
  slide.addText(
    'Hasil untuk HSE: laporan masuk dashboard + email ke semua alamat Aktif di menu Notifikasi.\nHiPo (Near Miss / High / Stop Work / LSR) ditandai merah dan punya deadline eskalasi 24 jam.',
    {
      x: 0.55,
      y: 3.88,
      w: 8.9,
      h: 0.85,
      fontSize: 13,
      color: C.white,
      fontFace: FONT,
    },
  )
}

// 6 — Dashboard
{
  const slide = contentSlide('Dashboard HSE (Command Center)', '/admin  ·  login email & password')
  const boxes = [
    { t: 'Live Traffic', b: 'Kartu total, aktif, HiPo, closed + grafik 14 hari.', c: C.orange },
    { t: 'Daftar laporan', b: 'Filter status / HiPo. Klik baris → panel detail.', c: C.blue },
    { t: 'Tujuan email', b: 'Lihat & tambah penerima langsung dari dashboard.', c: C.green },
    { t: 'Analitik', b: 'KPI vs target, scorecard kontraktor, tren.', c: C.indigo },
    { t: 'Peta', b: 'Pin GPS hotspot area rawan di terminal.', c: C.amber },
    { t: 'Notifikasi', b: 'Kelola email, kirim tes, riwayat terkirim/gagal.', c: C.purple },
  ]
  boxes.forEach((b, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    featureBox(slide, {
      x: 0.35 + col * 3.15,
      y: 1.15 + row * 1.85,
      w: 3.0,
      h: 1.7,
      title: b.t,
      body: b.b,
      accent: b.c,
    })
  })
}

// 7 — Status + HSE flow
{
  const slide = contentSlide('Alur tindak lanjut HSE', '6 status · investigasi · CAPA · audit')
  const statuses = [
    { t: 'Open', c: C.blue },
    { t: 'Under\nReview', c: C.orange },
    { t: 'In\nProgress', c: C.amber },
    { t: 'Pending\nVerify', c: C.purple },
    { t: 'Closed', c: C.green },
    { t: 'Rejected', c: C.slateLight },
  ]
  statuses.forEach((s, i) => {
    const x = 0.3 + i * 1.6
    flowBox(slide, { x, y: 1.15, w: 1.4, h: 0.7, text: s.t, fill: s.c, fontSize: 11 })
    if (i < statuses.length - 1) arrowRight(slide, x + 1.42, 1.42, 0.16)
  })

  const row2 = [
    { t: '1. Email / banner', b: 'HSE tahu ada laporan baru tanpa buka app terus-menerus.', c: C.amber },
    { t: '2. Triage', b: 'Baca detail, foto, risiko. HiPo masuk investigasi.', c: C.orange },
    { t: '3. Assign PIC', b: 'Tunjuk departemen penanggung jawab.', c: C.blue },
    { t: '4. CAPA', b: 'Tindakan korektif: owner, due date, status.', c: C.purple },
    { t: '5. Verifikasi', b: 'HSE cek tindakan efektif, lalu Closed. Audit tercatat.', c: C.green },
  ]
  row2.forEach((s, i) => {
    featureBox(slide, {
      x: 0.28 + i * 1.9,
      y: 2.15,
      w: 1.8,
      h: 2.65,
      title: s.t,
      body: s.b,
      accent: s.c,
    })
  })
}

// 8 — Email flow (baru / Brevo)
{
  const slide = contentSlide('Alur notifikasi email (sudah jalan)', 'Daftar penerima dikelola di dashboard — tanpa ubah kode')
  const nodes = [
    { t: 'Submit\nlaporan', c: C.orange },
    { t: 'Trigger SQL\nqueue', c: C.indigo },
    { t: 'Edge Function\nprocess-notif', c: C.blue },
    { t: 'Brevo\nkirim email', c: C.green },
    { t: 'Semua email\nAktif di daftar', c: C.amber },
  ]
  nodes.forEach((n, i) => {
    const x = 0.35 + i * 1.9
    flowBox(slide, { x, y: 1.25, w: 1.7, h: 0.9, text: n.t, fill: n.c, fontSize: 11 })
    if (i < nodes.length - 1) arrowRight(slide, x + 1.72, 1.62, 0.16)
  })

  slide.addText('Cara HSE menambah penerima', {
    x: 0.4,
    y: 2.4,
    w: 9,
    h: 0.32,
    fontSize: 13,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  const how = [
    { n: '1', t: 'Login admin', d: 'Buka /admin/login' },
    { n: '2', t: 'Dashboard', d: 'Kartu Tujuan email' },
    { n: '3', t: 'Tambah alamat', d: 'Ketik → Tambah email' },
    { n: '4', t: 'Pastikan Aktif', d: 'Laporan baru + HiPo' },
    { n: '5', t: 'Opsional tes', d: 'Menu Notifikasi → Kirim tes' },
  ]
  how.forEach((h, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.35 + i * 1.9,
      y: 2.8,
      w: 1.8,
      h: 1.55,
      fill: { color: C.white },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    })
    slide.addText(h.n, {
      x: 0.45 + i * 1.9,
      y: 2.9,
      w: 1.6,
      h: 0.32,
      fontSize: 16,
      bold: true,
      color: C.orange,
      fontFace: FONT,
    })
    slide.addText(h.t, {
      x: 0.45 + i * 1.9,
      y: 3.25,
      w: 1.6,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: C.dark,
      fontFace: FONT,
    })
    slide.addText(h.d, {
      x: 0.45 + i * 1.9,
      y: 3.6,
      w: 1.6,
      h: 0.55,
      fontSize: 11,
      color: C.slate,
      fontFace: FONT,
    })
  })
  slide.addText('Pengirim: Gmail terverifikasi di Brevo. Penerima: semua alamat Aktif (Gmail / kantor).', {
    x: 0.4,
    y: 4.5,
    w: 9.2,
    h: 0.35,
    fontSize: 12,
    color: C.slateLight,
    fontFace: FONT,
  })
}

// 9 — Arsitektur + URL
{
  const slide = contentSlide('Arsitektur & tautan', 'Yang perlu diingat operasional harian')
  const layers = [
    { l: 'Akses', v: 'Pelapor: browser / QR   ·   HSE: login dashboard', c: C.blue },
    { l: 'Aplikasi', v: 'React + Vite  ·  hosting Vercel  ·  PWA offline', c: C.orange },
    { l: 'Data', v: 'Supabase: PostgreSQL, Auth, Storage foto, Edge Function', c: C.indigo },
    { l: 'Email', v: 'Brevo (kirim ke banyak alamat)  ·  daftar penerima di dashboard', c: C.green },
  ]
  layers.forEach((row, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.35,
      y: 1.12 + i * 0.62,
      w: 9.3,
      h: 0.55,
      fill: { color: C.white },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.06,
    })
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.45,
      y: 1.22 + i * 0.62,
      w: 1.35,
      h: 0.35,
      fill: { color: row.c },
      rectRadius: 0.05,
    })
    slide.addText(row.l, {
      x: 0.45,
      y: 1.22 + i * 0.62,
      w: 1.35,
      h: 0.35,
      fontSize: 10,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'mid',
      fontFace: FONT,
    })
    slide.addText(row.v, {
      x: 1.95,
      y: 1.2 + i * 0.62,
      w: 7.5,
      h: 0.4,
      fontSize: 13,
      color: C.dark,
      valign: 'mid',
      fontFace: FONT,
    })
  })
  slide.addText(
    `Form  ${APP_URL}\nAdmin  ${APP_URL}/admin/login\nQR poster  ${APP_URL}/qr`,
    {
      x: 0.4,
      y: 3.7,
      w: 9.2,
      h: 1.15,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 10 — Closing
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.orange } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: '100%', h: 0.08, fill: { color: C.orange } })
  slide.addText('Satu alur, dari lapangan sampai closed', {
    x: 0.5,
    y: 1.35,
    w: 9,
    h: 0.7,
    fontSize: 26,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText(
    'Lapor (QR)  →  data + foto  →  email HSE  →  PIC & CAPA  →  verifikasi  →  Closed',
    {
      x: 0.5,
      y: 2.2,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: C.orange,
      align: 'center',
      fontFace: FONT,
    },
  )
  slide.addText(
    'Tambah penerima email kapan saja di dashboard.\nTidak perlu ubah kode, tidak perlu beli domain.',
    {
      x: 0.5,
      y: 3.0,
      w: 9,
      h: 0.7,
      fontSize: 14,
      color: C.muted,
      align: 'center',
      fontFace: FONT,
    },
  )
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 4.15, y: 4.05, w: 1.7, h: 0.55 })
  }
  slide.addText('PT. BACT — Batu Ampar Container Terminal', {
    x: 0.5,
    y: 4.75,
    w: 9,
    h: 0.3,
    fontSize: 11,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

try {
  await pptx.writeFile({ fileName: outPath })
  console.log('Presentasi dibuat:', outPath)
} catch (err) {
  if (err.code === 'EBUSY' || err.code === 'EPERM') {
    const fallback = path.join(root, 'supabase', 'BACT-SOC-Presentasi-HSE-generated.pptx')
    await pptx.writeFile({ fileName: fallback })
    console.warn('File utama sedang dibuka — disimpan ke:', fallback)
  } else {
    throw err
  }
}
console.log('Total slide:', pptx.slides.length)
