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
  slide.addText('Form bilingual  ·  Klasifikasi HSE  ·  Weekly/Monthly report  ·  Theme  ·  Super Admin / HSE / Viewer', {
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

// 2 — Flow Chart alur baru (untuk di-share)
{
  const slide = contentSlide('Flow Chart alur baru', 'Dari scan QR sampai Closed — siap dibagikan ke HSE')
  const steps = [
    { t: '1. Scan QR\n/ buka web', c: C.blue },
    { t: '2. Isi form\npelapor', c: C.indigo },
    { t: '3. Kirim\nlaporan', c: C.orange },
    { t: '4. HSE\nklasifikasi', c: C.amber },
    { t: '5. Assign\nPIC', c: C.green },
  ]
  steps.forEach((s, i) => {
    const x = 0.32 + i * 1.94
    flowBox(slide, { x, y: 1.12, w: 1.72, h: 0.82, text: s.t, fill: s.c, fontSize: 11 })
    if (i < steps.length - 1) arrowRight(slide, x + 1.74, 1.45, 0.18)
  })

  slide.addText('Cabang setelah klasifikasi', {
    x: 0.35,
    y: 2.08,
    w: 9.3,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: C.slate,
    fontFace: FONT,
  })

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.32,
    y: 2.4,
    w: 4.55,
    h: 1.35,
    fill: { color: C.slate },
    rectRadius: 0.08,
  })
  slide.addText('Kasus biasa / Low–Medium', {
    x: 0.48,
    y: 2.48,
    w: 4.25,
    h: 0.28,
    fontSize: 13,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText('PDF Notice → tindakan & CAPA → verifikasi HSE → Closed.\nTidak semua SOC wajib investigasi.', {
    x: 0.48,
    y: 2.78,
    w: 4.25,
    h: 0.82,
    fontSize: 12,
    color: 'E2E8F0',
    fontFace: FONT,
  })

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.13,
    y: 2.4,
    w: 4.55,
    h: 1.35,
    fill: { color: C.red },
    rectRadius: 0.08,
  })
  slide.addText('HiPo / High / Near Miss / Stop Work', {
    x: 5.29,
    y: 2.48,
    w: 4.25,
    h: 0.28,
    fontSize: 13,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText('Centang lanjut investigasi → 5W+1H → PDF Investigasi → CAPA → Closed.', {
    x: 5.29,
    y: 2.78,
    w: 4.25,
    h: 0.82,
    fontSize: 12,
    color: 'E2E8F0',
    fontFace: FONT,
  })

  const docs = [
    { t: 'PDF SOC (Notice)', b: 'Surat bilingual ke PIC / manajemen', c: C.orange },
    { t: 'PDF Investigasi', b: 'Hanya jika ditandai investigasi', c: C.amber },
    { t: 'Export Excel', b: 'Rekap laporan, kolom rapi', c: C.green },
    { t: 'Notifikasi email', b: 'Laporan baru & HiPo ke HSE', c: C.indigo },
  ]
  docs.forEach((d, i) => {
    featureBox(slide, {
      x: 0.32 + i * 2.4,
      y: 3.9,
      w: 2.28,
      h: 1.05,
      title: d.t,
      body: d.b,
      accent: d.c,
    })
  })
}

// 3 — Latar
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
      { text: 'Form bilingual ID + EN: identitas, lokasi, cerita, foto.', options: { bullet: true, breakLine: true } },
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
    { t: 'HSE Officer', b: 'Klasifikasi kategori/risiko, investigasi, CAPA, email Resend.', c: C.orange },
    { t: 'Super Admin', b: 'Semua menu HSE + kelola akun, Log HSE, pantau performa.', c: C.purple },
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
  slide.addText(
    'Login admin hanya 3 role: Super Admin, HSE Officer, Viewer. PIC = assign departemen di laporan, bukan akun login.',
    {
      x: 0.4,
      y: 3.7,
      w: 9.2,
      h: 0.4,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addText(
    'Pelapor tidak mengisi kategori, risiko, IOGP, atau laporan anonim. Viewer hanya lihat. Lookup: 173 karyawan BACT.',
    {
      x: 0.4,
      y: 4.2,
      w: 9.2,
      h: 0.45,
      fontSize: 12,
      color: C.slateLight,
      fontFace: FONT,
    },
  )
}

// 4 — Form
{
  const slide = contentSlide('Form lapangan (tanpa login)', `${APP_URL}  ·  bilingual Indonesia + English`)
  const items = [
    { t: 'Bilingual ID + EN', b: 'Label Indonesia utama, ada terjemahan Inggris di bawahnya.', c: C.blue },
    { t: 'Nama & ID BACT', b: 'Ketik nama, pilih opsi. Departemen + ID BACT-xxxx terisi.', c: C.orange },
    { t: 'Lokasi kejadian', b: 'Pilih dari daftar area terminal (Workshop, CY, Gate, dll).', c: C.amber },
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
    { t: 'Live Traffic', b: 'Admin English. Kartu total, aktif, HiPo, closed + grafik 14 hari. Tema gelap/terang.', c: C.orange },
    { t: 'Unclassified', b: 'Filter antrian laporan yang menunggu HSE isi kategori/risiko.', c: C.amber },
    { t: 'Report detail', b: 'Kategori, risiko, perihal PDF, centang tindakan, assign PIC (departemen), status, foto.', c: C.blue },
    { t: 'Analytics', b: 'Weekly & Monthly Report: pilih tanggal dari–sampai, export Excel. Import Excel/CSV lama.', c: C.indigo },
    { t: 'HSE Log', b: 'Grafik tracking siapa yang aktif menyelesaikan SOC (ringan–investigasi). Super Admin.', c: C.green },
    { t: 'Users', b: 'Super Admin / HSE Officer / Viewer. Tambah akun, aktifkan/nonaktifkan, ganti password.', c: C.purple },
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

// 9 — Fungsi tiap menu (bahasa awam)
{
  const slide = contentSlide('Fungsi tiap menu', 'Penjelasan singkat untuk orang yang baru pakai')
  const items = [
    { t: 'Dashboard', b: 'Daftar 10 laporan per halaman. Klik nama: klasifikasi, perihal, PDF Notice. Tema gelap/terang.', c: C.orange },
    { t: 'Analytics', b: 'Weekly/Monthly Report (filter tanggal) + import Excel/CSV data lama HSE + flowchart.', c: C.indigo },
    { t: 'HSE Log', b: 'Grafik: HSE mana yang aktif, kasus ringan vs investigasi. Super Admin.', c: C.amber },
    { t: 'Users', b: 'Super Admin: tambah user, pilih Super Admin / HSE / Viewer, aktifkan, ganti password.', c: C.red },
    { t: 'Notifications', b: 'Daftar email Resend — kabar otomatis laporan baru atau HiPo.', c: C.blue },
    { t: 'Reporter form', b: 'HP tanpa login, bilingual ID+EN. Nama, lokasi, cerita, foto, lalu kirim.', c: C.green },
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

// 10 — Cara email notifikasi (awam)
{
  const slide = contentSlide('Cara masukin email notifikasi', 'Supaya HSE dapat kabar otomatis — tanpa setting server')
  const steps = [
    { n: '1', t: 'Login admin', b: `${APP_URL}/admin/login` },
    { n: '2', t: 'Buka menu Notifikasi', b: 'Di atas, klik Notifikasi.' },
    { n: '3', t: 'Ketik email', b: 'Contoh: hse@bact.co.id' },
    { n: '4', t: 'Klik Tambah email', b: 'Email masuk ke daftar.' },
    { n: '5', t: 'Cek status Aktif', b: 'Kalau Nonaktif, klik Aktifkan.' },
    { n: '6', t: 'Kirim tes (opsional)', b: 'Cek Inbox dan folder Spam.' },
  ]
  steps.forEach((s, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 0.35 + col * 3.15
    const y = 1.15 + row * 1.7
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 3.0,
      h: 1.52,
      fill: { color: C.white },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    })
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.14,
      y: y + 0.18,
      w: 0.38,
      h: 0.38,
      fill: { color: C.orange },
    })
    slide.addText(s.n, {
      x: x + 0.14,
      y: y + 0.2,
      w: 0.38,
      h: 0.34,
      fontSize: 14,
      bold: true,
      color: C.white,
      align: 'center',
      fontFace: FONT,
    })
    slide.addText(s.t, {
      x: x + 0.62,
      y: y + 0.18,
      w: 2.2,
      h: 0.38,
      fontSize: 14,
      bold: true,
      color: C.dark,
      fontFace: FONT,
    })
    slide.addText(s.b, {
      x: x + 0.16,
      y: y + 0.7,
      w: 2.68,
      h: 0.65,
      fontSize: 12,
      color: C.slate,
      fontFace: FONT,
    })
  })
}

// 11 — Role & tambah user
{
  const slide = contentSlide('Role & akses login admin', 'Menu Pengguna hanya muncul untuk Super Admin')
  const roles = [
    {
      t: 'Super Admin',
      b: 'Semua menu: Dashboard, Analitik, Log HSE, Notifikasi, Pengguna. Ubah laporan + kelola akun.',
      c: C.red,
    },
    {
      t: 'HSE Officer',
      b: 'Dashboard, Analitik, Notifikasi. Klasifikasi, investigasi, PDF, email. Tidak kelola user.',
      c: C.orange,
    },
    {
      t: 'Viewer',
      b: 'Dashboard & Analitik. Lihat saja — tidak bisa ubah laporan, PDF, atau pengaturan.',
      c: C.slateLight,
    },
  ]
  roles.forEach((r, i) => {
    featureBox(slide, {
      x: 0.35 + i * 3.15,
      y: 1.12,
      w: 3.02,
      h: 1.7,
      title: r.t,
      body: r.b,
      accent: r.c,
    })
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.32,
    y: 3.0,
    w: 9.36,
    h: 1.9,
    fill: { color: C.dark },
    rectRadius: 0.08,
  })
  slide.addText('Cara Super Admin menambah user', {
    x: 0.5,
    y: 3.12,
    w: 9,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText(
    '1. Login Super Admin  →  2. Menu Pengguna  →  3. Isi email + password sementara + role\n4. Tambah pengguna  →  5. Beri akun itu ke orangnya (/admin/login)\nAktifkan / Nonaktifkan kapan saja. Nonaktif = tidak bisa login. Ganti password dari daftar.\nAssign PIC di laporan = pilih departemen follow-up, bukan role login.',
    {
      x: 0.5,
      y: 3.46,
      w: 9,
      h: 1.3,
      fontSize: 12,
      color: C.white,
      fontFace: FONT,
    },
  )
}

// 12 — PDF Notice & Investigasi
{
  const slide = contentSlide('PDF Notice & Investigasi', 'Diunduh dari detail laporan di dashboard')
  const boxes = [
    { t: 'Judul 1 baris', b: 'NOTICE OF SAFETY OBSERVATION atau INVESTIGATION REPORT di samping logo.', c: C.orange },
    { t: 'Perihal / Subject', b: 'Isi di detail laporan. Jangan taruh nama pelapor di perihal.', c: C.blue },
    { t: 'Pelapor / Reported by', b: 'Nama pelapor tampil di baris sendiri, terpisah dari perihal.', c: C.indigo },
    { t: 'Document No.', b: 'Kolom kanan: nomor SOC (2 baris) + Effective Date. Tidak numpuk.', c: C.amber },
    { t: 'Centang tindakan', b: 'Di detail laporan, centang aksi yang sudah dikerjakan. Muncul kotak centang di PDF.', c: C.green },
    { t: 'Kapan investigasi', b: 'Hanya jika HSE centang lanjut investigasi (HiPo / High / Near Miss).', c: C.red },
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

// 13 — Log HSE tracking
{
  const slide = contentSlide('Log HSE — tracking siapa yang aktif', 'Menu Log HSE  ·  Super Admin  ·  /admin/aktivitas')
  const boxes = [
    { t: 'Kartu trading', b: 'Aksi HSE, HSE aktif, SOC disentuh, kasus ringan, investigasi + sparkline.', c: C.orange },
    { t: 'Grafik 14 hari', b: 'Volume aksi harian: semua aksi, ringan (hijau), investigasi (kuning).', c: C.green },
    { t: 'Siapa yang close', b: 'Bar per orang: kasus ringan vs investigasi. Klik kartu HSE untuk filter log.', c: C.amber },
    { t: 'Kasus ringan', b: 'Klasifikasi, close tanpa investigasi, follow-up / CAPA.', c: C.blue },
    { t: 'Investigasi', b: 'Jejak 5W+1H, root cause, PDF investigasi. Dihitung terpisah.', c: C.red },
    { t: 'Filter periode', b: 'Hari ini / 7 hari / 30 hari / semua. Daftar aktivitas tetap di bawah grafik.', c: C.purple },
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

// 14 — Closing
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
