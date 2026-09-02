/**
 * Presentasi HSE — BACT Safety Observation Card (alur terbaru)
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
const logoWhite =
  [
    path.join(root, 'public', 'logo', 'BACT Logo_OG White Text.png'),
    path.join(root, 'public', 'logo', 'bact-logo-white.png'),
  ].find((p) => fs.existsSync(p)) || null
const APP_URL = 'bact-safety-observation-modern.vercel.app'

const C = {
  orange: 'F37021',
  dark: '1A1A1A',
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

function addLogo(slide, { x, y, w, h }) {
  if (logoWhite) slide.addImage({ path: logoWhite, x, y, w, h })
}

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
  addLogo(slide, { x: 0.28, y: 0.14, w: 1.45, h: 0.58 })
  slide.addText(title, {
    x: 1.85,
    y: 0.14,
    w: 7.7,
    h: 0.38,
    fontSize: 20,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.85,
      y: 0.5,
      w: 7.7,
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

// 1 — Cover
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.orange } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: '100%', h: 0.08, fill: { color: C.orange } })
  addLogo(slide, { x: 3.05, y: 0.65, w: 3.9, h: 1.2 })
  slide.addText('Safety Observation Card', {
    x: 0.5,
    y: 2.1,
    w: 9,
    h: 0.6,
    fontSize: 34,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Alur Kerja Pelaporan & Tindak Lanjut HSE', {
    x: 0.5,
    y: 2.75,
    w: 9,
    h: 0.38,
    fontSize: 16,
    color: C.orange,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('PT. BACT — Batu Ampar Container Terminal  ·  An ICTSI Group Company', {
    x: 0.5,
    y: 3.35,
    w: 9,
    h: 0.32,
    fontSize: 12,
    color: C.muted,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText('Form ringkas  ·  Lookup karyawan BACT  ·  Klasifikasi oleh HSE  ·  Notifikasi email', {
    x: 0.5,
    y: 4.55,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: C.slateLight,
    align: 'center',
    fontFace: FONT,
  })
}

// 2 — Latar
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
      { text: 'Form lapangan terlalu panjang, orang malas lapor.', options: { bullet: true, breakLine: true } },
      { text: 'Kategori & risiko diisi pelapor — hasilnya tidak konsisten.', options: { bullet: true, breakLine: true } },
      { text: 'Follow-up PIC sulit dilacak sampai closed.', options: { bullet: true, breakLine: true } },
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
      { text: 'Form pendek: identitas, lokasi, cerita, foto.', options: { bullet: true, breakLine: true } },
      { text: 'Nama karyawan BACT terisi dari data HR.', options: { bullet: true, breakLine: true } },
      { text: 'HSE yang tentukan kategori & risiko di dashboard.', options: { bullet: true, breakLine: true } },
    ],
    { x: 5.35, y: 1.65, w: 4.1, h: 3.1, fontSize: 13, color: 'E2E8F0', fontFace: FONT, paraSpaceAfter: 8 },
  )
}

// 3 — Pengguna
{
  const slide = contentSlide('Siapa yang memakai', 'Satu aplikasi, dua pintu: publik & login HSE')
  const actors = [
    { t: 'Pelapor BACT', b: 'Ketik nama → pilih dari daftar. Departemen & ID otomatis.', c: C.blue },
    { t: 'Vendor / visitor', b: 'Pilih perusahaan, isi nama & departemen manual.', c: C.indigo },
    { t: 'HSE Officer', b: 'Klasifikasi kategori/risiko, investigasi, CAPA, email.', c: C.orange },
    { t: 'PIC / Admin', b: 'Tindak lanjut laporan yang di-assign. Admin akses penuh.', c: C.purple },
  ]
  actors.forEach((a, i) => {
    featureBox(slide, {
      x: 0.35 + i * 2.35,
      y: 1.2,
      w: 2.2,
      h: 2.35,
      title: a.t,
      body: a.b,
      accent: a.c,
    })
  })
  slide.addText('Pelapor tidak mengisi kategori, risiko, atau IOGP. Itu wewenang HSE setelah laporan masuk.', {
    x: 0.4,
    y: 3.8,
    w: 9.2,
    h: 0.45,
    fontSize: 13,
    color: C.slate,
    fontFace: FONT,
  })
  slide.addText('Lookup otomatis: 173 karyawan BACT. Security / vendor tetap input manual.', {
    x: 0.4,
    y: 4.3,
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
    { t: 'Perusahaan dulu', b: 'PT. BACT → lookup nama. Vendor → isi manual.', c: C.blue },
    { t: 'Nama & ID BACT', b: 'Ketik nama, pilih opsi. Departemen + ID BACT-xxxx terisi.', c: C.orange },
    { t: 'Lokasi + GPS', b: 'Tulis lokasi + tombol ambil koordinat HP.', c: C.amber },
    { t: 'Deskripsi + foto', b: 'Ceritakan kejadian. Bisa beberapa foto bukti.', c: C.indigo },
    { t: 'Stop Work', b: 'Centang jika pekerjaan sudah dihentikan. Jadi HiPo.', c: C.red },
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

// 5 — Alur pelapor
{
  const slide = contentSlide('Alur pelapor', 'Dari scan QR sampai HSE mendapat email')
  const steps = [
    { t: 'Scan QR\n/ buka web', c: C.blue },
    { t: 'Pilih\nperusahaan', c: C.indigo },
    { t: 'Isi nama\n+ lokasi + foto', c: C.orange },
    { t: 'Kirim\nlaporan', c: C.amber },
    { t: 'Simpan DB\nstatus Open', c: C.purple },
    { t: 'Email HSE\n+ banner admin', c: C.green },
  ]
  steps.forEach((s, i) => {
    const x = 0.3 + i * 1.6
    flowBox(slide, { x, y: 1.55, w: 1.4, h: 0.95, text: s.t, fill: s.c, fontSize: 11 })
    if (i < steps.length - 1) arrowRight(slide, x + 1.42, 1.93, 0.16)
  })
  slide.addText(
    'Laporan masuk sebagai Belum diklasifikasi. Pelapor tidak diminta pilih kategori atau risiko.',
    {
      x: 0.4,
      y: 2.75,
      w: 9.2,
      h: 0.4,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.35,
    y: 3.3,
    w: 9.3,
    h: 1.55,
    fill: { color: C.dark },
    rectRadius: 0.08,
  })
  slide.addText(
    'Kalau HP offline: laporan disimpan di perangkat, terkirim sendiri saat sinyal kembali.\nKaryawan BACT: pilih nama dari daftar HR. Vendor: isi nama sendiri.\nHSE dapat email + laporan muncul di dashboard untuk diklasifikasi.',
    {
      x: 0.55,
      y: 3.48,
      w: 8.9,
      h: 1.25,
      fontSize: 13,
      color: C.white,
      fontFace: FONT,
    },
  )
}

// 6 — Klasifikasi HSE
{
  const slide = contentSlide('Klasifikasi oleh HSE', 'Kategori & risiko ditentukan di dashboard, bukan di form')
  const steps = [
    { t: 'Laporan\nmasuk', c: C.slateLight },
    { t: 'Belum\ndiklasifikasi', c: C.amber },
    { t: 'HSE buka\ndetail', c: C.blue },
    { t: 'Isi kategori\n& risiko', c: C.orange },
    { t: 'HiPo jika High\n/ Near Miss', c: C.red },
    { t: 'Lanjut\ninvestigasi', c: C.green },
  ]
  steps.forEach((s, i) => {
    const x = 0.3 + i * 1.6
    flowBox(slide, { x, y: 1.25, w: 1.4, h: 0.9, text: s.t, fill: s.c, fontSize: 11 })
    if (i < steps.length - 1) arrowRight(slide, x + 1.42, 1.6, 0.16)
  })

  const cats = [
    { t: 'Kategori', b: 'Unsafe Act · Unsafe Condition · Near Miss · Positive Observation', c: C.blue },
    { t: 'Risiko', b: 'Low · Medium · High — diisi HSE setelah baca deskripsi & foto.', c: C.orange },
    { t: 'HiPo otomatis', b: 'Stop Work (dari pelapor), atau High / Near Miss (dari HSE).', c: C.red },
  ]
  cats.forEach((c, i) => {
    featureBox(slide, {
      x: 0.35 + i * 3.15,
      y: 2.45,
      w: 3.0,
      h: 2.3,
      title: c.t,
      body: c.b,
      accent: c.c,
    })
  })
}

// 7 — Dashboard
{
  const slide = contentSlide('Dashboard HSE (Command Center)', '/admin  ·  login email & password')
  const boxes = [
    { t: 'Live Traffic', b: 'Kartu total, aktif, HiPo, closed + grafik 14 hari.', c: C.orange },
    { t: 'Belum diklasifikasi', b: 'Filter antrian laporan yang menunggu HSE isi kategori/risiko.', c: C.amber },
    { t: 'Detail laporan', b: 'Dropdown kategori & risiko, PIC, status, foto, ID karyawan.', c: C.blue },
    { t: 'Analitik', b: 'KPI vs target. High/positif hanya dari yang sudah diklasifikasi.', c: C.indigo },
    { t: 'Peta', b: 'Pin GPS hotspot area rawan di terminal.', c: C.green },
    { t: 'Notifikasi', b: 'Kelola email penerima, kirim tes, riwayat terkirim/gagal.', c: C.purple },
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

// 8 — Status + HSE flow
{
  const slide = contentSlide('Alur tindak lanjut HSE', 'Klasifikasi dulu, baru investigasi · CAPA · closed')
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
    { t: '1. Klasifikasi', b: 'HSE isi kategori & risiko. Jangan biarkan “Belum diklasifikasi”.', c: C.amber },
    { t: '2. Triage', b: 'Baca deskripsi & foto. HiPo masuk investigasi.', c: C.orange },
    { t: '3. Assign PIC', b: 'Tunjuk departemen penanggung jawab.', c: C.blue },
    { t: '4. CAPA', b: 'Tindakan korektif: owner, due date, status.', c: C.purple },
    { t: '5. Verifikasi', b: 'HSE cek tindakan efektif, lalu Closed. Export PDF notice.', c: C.green },
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

// 9 — Email + tautan
{
  const slide = contentSlide('Notifikasi & tautan', 'Email dikelola di dashboard — tanpa ubah kode')
  const nodes = [
    { t: 'Submit\nlaporan', c: C.orange },
    { t: 'Antrian\nnotifikasi', c: C.indigo },
    { t: 'Edge Function', c: C.blue },
    { t: 'Brevo\nkirim email', c: C.green },
    { t: 'Email Aktif\ndi daftar', c: C.amber },
  ]
  nodes.forEach((n, i) => {
    const x = 0.35 + i * 1.9
    flowBox(slide, { x, y: 1.15, w: 1.7, h: 0.85, text: n.t, fill: n.c, fontSize: 11 })
    if (i < nodes.length - 1) arrowRight(slide, x + 1.72, 1.48, 0.16)
  })
  slide.addText(
    `Form     ${APP_URL}\nAdmin    ${APP_URL}/admin/login\nQR       ${APP_URL}/qr`,
    {
      x: 0.4,
      y: 2.25,
      w: 9.2,
      h: 1.15,
      fontSize: 14,
      color: C.dark,
      fontFace: FONT,
    },
  )
  slide.addText(
    'Tambah penerima: Login admin → Notifikasi → ketik email → Tambah. Pastikan status Aktif.\nPengirim lewat Brevo. Penerima: Gmail / email kantor yang terdaftar.',
    {
      x: 0.4,
      y: 3.55,
      w: 9.2,
      h: 1.2,
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
    y: 1.15,
    w: 9,
    h: 0.65,
    fontSize: 26,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  slide.addText(
    'QR  →  form ringkas  →  email HSE  →  klasifikasi  →  PIC & CAPA  →  Closed',
    {
      x: 0.5,
      y: 1.95,
      w: 9,
      h: 0.45,
      fontSize: 14,
      color: C.orange,
      align: 'center',
      fontFace: FONT,
    },
  )
  slide.addText(
    'Pelapor hanya cerita + foto.\nHSE yang menentukan kategori dan risiko.',
    {
      x: 0.5,
      y: 2.6,
      w: 9,
      h: 0.7,
      fontSize: 15,
      color: C.muted,
      align: 'center',
      fontFace: FONT,
    },
  )
  addLogo(slide, { x: 3.55, y: 3.55, w: 2.9, h: 0.9 })
  slide.addText('PT. BACT — Batu Ampar Container Terminal', {
    x: 0.5,
    y: 4.7,
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
