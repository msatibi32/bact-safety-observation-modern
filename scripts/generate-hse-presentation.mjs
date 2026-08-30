/**
 * Generate HSE presentation PowerPoint
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
const outPathAlt = path.join(root, 'supabase', 'BACT-SOC-Presentasi-HSE-flow.pptx')
const logoOrange = path.join(root, 'public', 'logo', 'BACT Logo_Orange.png')
const logoWhiteBg = path.join(root, 'public', 'logo', 'bact-logo.png')

const ORANGE = 'F37021'
const DARK = '1A1A1A'
const SLATE = '334155'
const WHITE = 'FFFFFF'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'PT. BACT HSSE'
pptx.title = 'Safety Observation Card — Presentasi HSE'

function addHeader(slide, title, subtitle = '') {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: DARK } })
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 0.3, y: 0.12, w: 1.4, h: 0.55 })
  }
  slide.addText(title, {
    x: 2.0,
    y: 0.15,
    w: 7.5,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: ORANGE,
    fontFace: 'Arial',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 2.0,
      y: 0.55,
      w: 7.5,
      h: 0.3,
      fontSize: 11,
      color: 'CBD5E1',
      fontFace: 'Arial',
    })
  }
}

function bulletSlide(title, subtitle, bullets, note = '') {
  const slide = pptx.addSlide()
  addHeader(slide, title, subtitle)
  slide.addText(bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), {
    x: 0.5,
    y: 1.15,
    w: 9,
    h: 4.2,
    fontSize: 15,
    color: SLATE,
    fontFace: 'Arial',
    valign: 'top',
  })
  if (note) {
    slide.addText(note, {
      x: 0.5,
      y: 5.0,
      w: 9,
      h: 0.4,
      fontSize: 10,
      italic: true,
      color: '64748B',
    })
  }
  return slide
}

/** Kotak flowchart */
function flowBox(slide, { x, y, w, h, text, fill = ORANGE, color = WHITE, fontSize = 11, rounded = true }) {
  slide.addShape(rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: DARK, width: 0.75 },
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
    fontFace: 'Arial',
  })
}

/** Panah horizontal → */
function arrowRight(slide, x, y, w = 0.45) {
  slide.addShape(pptx.ShapeType.rightArrow, {
    x,
    y,
    w,
    h: 0.22,
    fill: { color: '64748B' },
    line: { color: '64748B', width: 0 },
  })
}

/** Panah vertikal ↓ */
function arrowDown(slide, x, y, h = 0.35) {
  slide.addShape(pptx.ShapeType.downArrow, {
    x,
    y,
    w: 0.22,
    h,
    fill: { color: '64748B' },
    line: { color: '64748B', width: 0 },
  })
}

function flowSlide(title, subtitle) {
  const slide = pptx.addSlide()
  addHeader(slide, title, subtitle)
  return slide
}

// ─── Slide 1: Cover ─────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()
  slide.background = { color: DARK }
  if (fs.existsSync(logoWhiteBg)) {
    slide.addImage({ path: logoWhiteBg, x: 3.2, y: 1.0, w: 3.6, h: 1.2 })
  } else if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 3.5, y: 1.2, w: 3.0, h: 0.9 })
  }
  slide.addText('Safety Observation Card', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: WHITE,
    align: 'center',
    fontFace: 'Arial',
  })
  slide.addText('Sistem Pelaporan Observasi Keselamatan Kerja', {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: ORANGE,
    align: 'center',
  })
  slide.addText('PT. BACT — Batu Ampar Container Terminal\nAn ICTSI Group Company', {
    x: 0.5,
    y: 4.0,
    w: 9,
    h: 0.8,
    fontSize: 14,
    color: '94A3B8',
    align: 'center',
  })
  slide.addText('Presentasi untuk Tim HSE · 2026', {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.4,
    fontSize: 12,
    color: '64748B',
    align: 'center',
  })
}

bulletSlide(
  'Latar Belakang',
  'Mengapa aplikasi ini dibuat?',
  [
    'Pelaporan keselamatan di lapangan perlu cepat — dari HP, tanpa login rumit.',
    'Data harus terpusat agar HSE bisa follow-up, assign PIC, dan menutup laporan.',
    'Mengacu praktik industri migas: ISO 45001, IOGP Life Saving Rules, HiPo management.',
    'Menggantikan formulir manual dengan sistem digital terintegrasi.',
  ],
)

bulletSlide(
  'Tujuan Aplikasi',
  'Apa yang ingin dicapai?',
  [
    'Mempermudah pelaporan unsafe act, unsafe condition, near miss, dan observasi positif.',
    'Dokumentasi bukti foto + koordinat GPS lokasi kejadian.',
    'Workflow admin lengkap: triage → investigasi → CAPA → verifikasi → closed.',
    'Dashboard analitik, KPI, scorecard kontraktor, dan peta hotspot.',
    'Notifikasi real-time ke tim HSE (dashboard + email).',
  ],
)

bulletSlide(
  'Siapa Penggunanya?',
  'Aktor sistem',
  [
    'Pelapor — karyawan, kontraktor, visitor: akses form publik tanpa login.',
    'HSE Officer — review laporan, triage, investigasi, verifikasi penutupan.',
    'PIC / Departemen — menindaklanjuti laporan yang di-assign ke departemennya.',
    'Admin — kelola KPI, email notifikasi, akses penuh.',
    'Viewer — hanya melihat data (read-only).',
  ],
)

bulletSlide(
  'Form Pelaporan (Publik)',
  'URL: bact-safety-observation-modern.vercel.app',
  [
    'Data pelapor: nama, departemen, perusahaan — opsi laporan anonim.',
    'Lokasi kejadian (teks) + tombol ambil GPS otomatis.',
    'Kategori: Unsafe Act, Unsafe Condition, Near Miss, Positive Observation.',
    'Tingkat risiko aktual & potensi risiko (Low / Medium / High).',
    'Upload foto bukti (bisa lebih dari satu).',
    'Tindakan langsung & rekomendasi perbaikan.',
    'PWA: bisa di-install di HP, laporan offline tersimpan & sync otomatis.',
  ],
)

bulletSlide(
  'IOGP Life Saving Rules',
  'Fungsi field ini di form — pertanyaan HSE',
  [
    'IOGP = International Association of Oil & Gas Producers.',
    'Life Saving Rules = 9 aturan penyelamat nyawa di industri oil & gas.',
    'Field di form mencatat apakah observasi terkait salah satu aturan IOGP.',
    'Pilihan: Bypassing Safety Controls, Confined Space, Driving, Hot Work, dll.',
    '"Tidak terkait" = observasi tidak masuk kategori Life Saving Rule.',
    'Manfaat: prioritas investigasi lebih tinggi jika melanggar LSR + mendukung audit migas.',
  ],
  'Contoh: pekerja tanpa APD masuk confined space → pilih "Confined Space".',
)

bulletSlide(
  'HiPo & Stop Work',
  'Deteksi otomatis laporan berisiko tinggi',
  [
    'HiPo (High Potential) = kejadian berpotensi cedera serius atau fatal.',
    'Sistem otomatis menandai HiPo jika: risiko High, near miss High, atau Stop Work.',
    'Laporan HiPo langsung status "Under Review" (bukan Open biasa).',
    'Deadline eskalasi 24 jam — banner merah di dashboard jika terlambat.',
    'Stop Work = pekerjaan di area dihentikan sementara (checkbox di form).',
  ],
)

bulletSlide(
  'Dashboard Admin — Command Center',
  'URL: /admin (perlu login)',
  [
    'Live Traffic: statistik total, aktif, HiPo, closed + chart 14 hari.',
    'Banner notifikasi laporan baru saat login.',
    'Daftar laporan dengan filter status & HiPo.',
    'Detail panel: assign PIC, ubah status workflow, catatan triage.',
    'Tampilan mobile: card list + bottom navigation.',
    'Export PDF per laporan (format Notice BACT).',
  ],
)

bulletSlide(
  'Workflow Status (6 Tahap)',
  'Alur penanganan laporan HSE',
  [
    'Open — laporan baru masuk.',
    'Under Review — HSE melakukan triage & penilaian awal.',
    'In Progress — PIC menindaklanjuti tindakan perbaikan.',
    'Pending Verification — menunggu verifikasi efektivitas oleh HSE.',
    'Closed — laporan selesai ditangani.',
    'Rejected — laporan tidak valid / duplikat.',
  ],
)

// ─── FLOW DIAGRAM 1: Overview Sistem ─────────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Gambaran Umum Sistem', 'Dari pelapor sampai laporan ditutup')
  const y = 2.0
  const bw = 1.55
  const bh = 0.65
  const gap = 0.55
  let x = 0.45

  const nodes = [
    { t: 'Pelapor\n(Karyawan /\nKontraktor)', c: '3B82F6' },
    { t: 'Form SOC\n+ Foto + GPS', c: ORANGE },
    { t: 'Supabase\nDB + Storage', c: '6366F1' },
    { t: 'Notifikasi\nDashboard +\nEmail', c: 'F59E0B' },
    { t: 'HSE Review\nAssign PIC', c: ORANGE },
    { t: 'Closed\n✓ Selesai', c: '10B981' },
  ]

  nodes.forEach((n, i) => {
    flowBox(slide, { x, y, w: bw, h: bh, text: n.t, fill: n.c, fontSize: 9 })
    if (i < nodes.length - 1) arrowRight(slide, x + bw + 0.05, y + bh / 2 - 0.11, 0.4)
    x += bw + gap
  })

  slide.addText('Aktor: Pelapor (publik, tanpa login)  →  Sistem cloud  →  Tim HSE (login admin)', {
    x: 0.5,
    y: 3.1,
    w: 9,
    h: 0.35,
    fontSize: 10,
    color: '64748B',
    align: 'center',
  })
}

// ─── FLOW DIAGRAM 2: Alur Pelapor ────────────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Alur Pelapor', 'Langkah-langkah submit laporan dari lapangan')
  const cx = 4.75
  const bw = 3.2
  const bh = 0.55
  let y = 1.25
  const steps = [
    { t: '1. Buka App / Scan QR Code', c: '3B82F6' },
    { t: '2. Isi Data Pelapor & Perusahaan', c: ORANGE },
    { t: '3. Isi Lokasi + Ambil GPS', c: ORANGE },
    { t: '4. Pilih Kategori & Tingkat Risiko', c: ORANGE },
    { t: '5. Upload Foto Bukti', c: ORANGE },
    { t: '6. Sistem Deteksi HiPo Otomatis', c: 'EF4444' },
    { t: '7. Submit → Upload Storage + Simpan DB', c: '6366F1' },
    { t: '8. Notifikasi ke Tim HSE', c: 'F59E0B' },
    { t: '9. Konfirmasi Sukses ke Pelapor', c: '10B981' },
  ]

  steps.forEach((s, i) => {
    flowBox(slide, { x: cx - bw / 2, y, w: bw, h: bh, text: s.t, fill: s.c, fontSize: 10 })
    if (i < steps.length - 1) arrowDown(slide, cx - 0.11, y + bh + 0.02, 0.28)
    y += bh + 0.38
  })

  // Branch offline
  flowBox(slide, {
    x: 0.5,
    y: 3.8,
    w: 2.2,
    h: 0.7,
    text: 'Offline?\nSimpan lokal\ndulu',
    fill: '94A3B8',
    color: DARK,
    fontSize: 9,
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 2.7,
    y: 4.1,
    w: 1.3,
    h: 0,
    line: { color: '94A3B8', width: 1, dashType: 'dash' },
  })
  slide.addText('Auto-sync saat online', {
    x: 0.5,
    y: 4.65,
    w: 2.2,
    h: 0.3,
    fontSize: 8,
    color: '64748B',
    align: 'center',
  })
}

// ─── FLOW DIAGRAM 3: Alur HSE Admin ──────────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Alur HSE / Admin', 'Penanganan laporan dari notifikasi sampai closed')
  const y0 = 1.3
  const bw = 2.0
  const bh = 0.6

  // Row 1
  flowBox(slide, { x: 0.5, y: y0, w: bw, h: bh, text: 'Terima\nNotifikasi', fill: 'F59E0B', fontSize: 10 })
  arrowRight(slide, 2.55, y0 + 0.2)
  flowBox(slide, { x: 3.05, y: y0, w: bw, h: bh, text: 'Login\nDashboard', fill: ORANGE, fontSize: 10 })
  arrowRight(slide, 5.1, y0 + 0.2)
  flowBox(slide, { x: 5.6, y: y0, w: bw, h: bh, text: 'Buka Detail\nLaporan', fill: ORANGE, fontSize: 10 })
  arrowRight(slide, 7.65, y0 + 0.2)
  flowBox(slide, { x: 8.15, y: y0, w: 1.5, h: bh, text: 'Triage\nHSE', fill: ORANGE, fontSize: 10 })

  arrowDown(slide, 4.0, y0 + bh + 0.05, 0.35)

  // Row 2 - decision HiPo
  flowBox(slide, { x: 2.8, y: y0 + bh + 0.55, w: 2.4, h: 0.55, text: 'HiPo / High Risk?', fill: 'EF4444', fontSize: 10 })
  arrowRight(slide, 5.25, y0 + bh + 0.72)
  flowBox(slide, {
    x: 5.75,
    y: y0 + bh + 0.45,
    w: 2.6,
    h: 0.75,
    text: 'Ya → Investigasi\n+ Root Cause (5 Whys)',
    fill: 'DC2626',
    fontSize: 9,
  })

  arrowDown(slide, 3.9, y0 + bh + 1.15, 0.3)
  flowBox(slide, { x: 2.8, y: y0 + bh + 1.55, w: 2.4, h: 0.55, text: 'Assign PIC', fill: ORANGE, fontSize: 10 })
  arrowRight(slide, 5.25, y0 + bh + 1.72)
  flowBox(slide, { x: 5.75, y: y0 + bh + 1.55, w: 2.6, h: 0.55, text: 'Buat CAPA\n(jika perlu)', fill: '8B5CF6', fontSize: 10 })

  arrowDown(slide, 3.9, y0 + bh + 2.15, 0.3)
  flowBox(slide, { x: 2.5, y: y0 + bh + 2.55, w: 2.0, h: 0.55, text: 'In Progress\n(PIC tindak)', fill: ORANGE, fontSize: 10 })
  arrowRight(slide, 4.55, y0 + bh + 2.72)
  flowBox(slide, { x: 5.05, y: y0 + bh + 2.55, w: 2.2, h: 0.55, text: 'Pending\nVerification', fill: 'F59E0B', fontSize: 10 })
  arrowRight(slide, 7.3, y0 + bh + 2.72)
  flowBox(slide, { x: 7.8, y: y0 + bh + 2.55, w: 1.6, h: 0.55, text: 'Closed\n✓', fill: '10B981', fontSize: 10 })

  slide.addText('Semua perubahan tercatat otomatis di tab Audit Trail', {
    x: 0.5,
    y: 5.05,
    w: 9,
    h: 0.3,
    fontSize: 10,
    italic: true,
    color: '64748B',
    align: 'center',
  })
}

// ─── FLOW DIAGRAM 4: Status Workflow ────────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Status Workflow', '6 tahap penanganan laporan HSE')
  const y = 2.35
  const bw = 1.35
  const bh = 0.7
  const gap = 0.38
  let x = 0.35

  const statuses = [
    { t: 'Open', c: '3B82F6' },
    { t: 'Under\nReview', c: ORANGE },
    { t: 'In\nProgress', c: 'F59E0B' },
    { t: 'Pending\nVerification', c: '8B5CF6' },
    { t: 'Closed', c: '10B981' },
  ]

  statuses.forEach((s, i) => {
    flowBox(slide, { x, y, w: bw, h: bh, text: s.t, fill: s.c, fontSize: 10 })
    if (i < statuses.length - 1) arrowRight(slide, x + bw + 0.04, y + bh / 2 - 0.11, 0.32)
    x += bw + gap
  })

  // Rejected branch
  flowBox(slide, { x: 3.5, y: 3.55, w: 1.5, h: 0.55, text: 'Rejected', fill: '64748B', fontSize: 10 })
  slide.addShape(pptx.ShapeType.line, {
    x: 4.25,
    y: y + bh,
    w: 0,
    h: 0.55,
    line: { color: '64748B', width: 1, dashType: 'dash' },
  })
  slide.addText('(dari Under Review jika tidak valid)', {
    x: 2.8,
    y: 4.2,
    w: 3.5,
    h: 0.3,
    fontSize: 8,
    color: '64748B',
    align: 'center',
  })

  // Legend
  const legends = [
    { c: '3B82F6', l: 'Baru masuk' },
    { c: ORANGE, l: 'HSE aktif' },
    { c: 'F59E0B', l: 'PIC tindak' },
    { c: '8B5CF6', l: 'Verifikasi' },
    { c: '10B981', l: 'Selesai' },
  ]
  legends.forEach((lg, i) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0.5 + i * 1.85, y: 4.55, w: 0.25, h: 0.2, fill: { color: lg.c } })
    slide.addText(lg.l, { x: 0.8 + i * 1.85, y: 4.52, w: 1.5, h: 0.25, fontSize: 8, color: SLATE })
  })
}

// ─── FLOW DIAGRAM 5: Notifikasi & Email ──────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Notifikasi Email', 'Otomatis saat ada laporan baru')
  const y = 2.1
  const bw = 1.7
  const bh = 0.65

  flowBox(slide, { x: 0.4, y, w: bw, h: bh, text: 'Laporan\nBaru Submit', fill: ORANGE, fontSize: 10 })
  arrowRight(slide, 2.15, y + 0.22)
  flowBox(slide, { x: 2.65, y, w: bw, h: bh, text: 'Trigger SQL\nnotification_queue', fill: '6366F1', fontSize: 9 })
  arrowRight(slide, 4.4, y + 0.22)
  flowBox(slide, { x: 4.9, y, w: bw, h: bh, text: 'Webhook\nSupabase', fill: '6366F1', fontSize: 10 })
  arrowRight(slide, 6.65, y + 0.22)
  flowBox(slide, { x: 7.15, y, w: bw, h: bh, text: 'Edge Function\n+ Resend', fill: 'F59E0B', fontSize: 10 })

  arrowDown(slide, 1.15, y + bh + 0.05, 0.35)
  flowBox(slide, { x: 0.4, y: y + bh + 0.55, w: bw, h: bh, text: 'Banner\nDashboard Admin', fill: '3B82F6', fontSize: 10 })

  arrowDown(slide, 5.55, y + bh + 0.05, 0.35)
  flowBox(slide, { x: 4.9, y: y + bh + 0.55, w: bw, h: bh, text: 'Email ke\nDaftar HSE', fill: '10B981', fontSize: 10 })

  slide.addText('Email penerima dikelola di Admin → Notifikasi (tanpa ubah kode)', {
    x: 0.5,
    y: 4.0,
    w: 9,
    h: 0.35,
    fontSize: 10,
    color: '64748B',
    align: 'center',
  })
}

// ─── FLOW DIAGRAM 6: Arsitektur ────────────────────────────────────────────
{
  const slide = flowSlide('Flow Diagram — Arsitektur Sistem', 'Komponen teknis & alur data')
  // Layers
  const layers = [
    { y: 1.2, label: 'Pengguna', items: ['Pelapor (Browser/HP)', 'Admin HSE (Browser)'], c: '3B82F6' },
    { y: 2.15, label: 'Frontend', items: ['React + Vite + Tailwind', 'Vercel CDN'], c: ORANGE },
    { y: 3.1, label: 'Backend', items: ['Supabase PostgreSQL', 'Storage (Foto)', 'Auth', 'Edge Functions'], c: '6366F1' },
    { y: 4.05, label: 'Eksternal', items: ['Resend (Email)', 'OpenStreetMap (Peta)'], c: '10B981' },
  ]

  layers.forEach((layer) => {
    slide.addText(layer.label, {
      x: 0.4,
      y: layer.y + 0.15,
      w: 1.2,
      h: 0.4,
      fontSize: 9,
      bold: true,
      color: SLATE,
      align: 'right',
    })
    slide.addShape(pptx.ShapeType.rect, {
      x: 1.7,
      y: layer.y,
      w: 7.8,
      h: 0.75,
      fill: { color: layer.c, transparency: 85 },
      line: { color: layer.c, width: 1 },
    })
    slide.addText(layer.items.join('   ·   '), {
      x: 1.85,
      y: layer.y + 0.1,
      w: 7.5,
      h: 0.55,
      fontSize: 10,
      color: DARK,
      valign: 'mid',
    })
    if (layer.y < 4.05) arrowDown(slide, 5.45, layer.y + 0.78, 0.22)
  })
}

bulletSlide(
  'Tab Detail Laporan',
  'Investigasi · CAPA · Audit',
  [
    'Detail — info lengkap, foto, assign PIC, ubah status, catatan triage.',
    'Investigasi — catatan investigasi lapangan + root cause (5 Whys) untuk HiPo/High.',
    'CAPA — Corrective & Preventive Action: judul, owner, due date, status.',
    'Audit — riwayat semua perubahan (siapa, kapan, apa yang diubah).',
    'Semua perubahan status tercatat otomatis di audit trail.',
  ],
)

bulletSlide(
  'Analitik & KPI',
  'URL: /admin/ringkasan',
  [
    'Statistik: total, aktif, closed, HiPo, high risk, positif.',
    'Chart distribusi kategori & tingkat risiko.',
    'Top departemen & scorecard kontraktor (HiPo, open, positif per perusahaan).',
    'KPI target vs aktual bulan ini (jumlah laporan, rasio positif, avg. hari tutup).',
    'Export CSV semua data laporan.',
  ],
)

bulletSlide(
  'Peta Hotspot GPS',
  'URL: /admin/peta',
  [
    'Peta interaktif (OpenStreetMap) menampilkan pin lokasi laporan.',
    'Hanya laporan yang mengaktifkan GPS saat submit yang muncul.',
    'Klik pin untuk lihat ringkasan: pelapor, kategori, lokasi.',
    'Berguna untuk identifikasi area rawan / hotspot insiden berulang.',
  ],
)

bulletSlide(
  'Notifikasi Email',
  'URL: /admin/pengaturan',
  [
    'Setiap laporan baru → antrian notifikasi → email ke tim HSE.',
    'Admin bisa tambah/hapus email penerima dari dashboard (tanpa ubah kode).',
    'HiPo mendapat email prioritas dengan subject khusus.',
    'Tombol "Kirim antrian sekarang" untuk test manual.',
    'Menggunakan Resend (gratis 100 email/hari untuk testing).',
  ],
)

bulletSlide(
  'QR Code & Akses Cepat',
  'URL: /qr',
  [
    'Halaman poster QR code untuk dipasang di area kerja terminal.',
    'Scan QR → langsung ke form pelaporan (tanpa ketik URL).',
    'File QR statis tersedia di public/qr untuk print.',
    'Jalankan npm run generate:qr untuk regenerate jika URL berubah.',
  ],
)

bulletSlide(
  'Role & Hak Akses',
  'Keamanan berbasis peran',
  [
    'admin — akses penuh + kelola email notifikasi & KPI.',
    'hse — review, edit laporan, investigasi, CAPA, verifikasi.',
    'pic — hanya lihat & edit laporan yang di-assign ke departemennya.',
    'viewer — read-only, tidak bisa ubah data.',
    'Role diset di Supabase Auth → User Metadata.',
  ],
)

// Alur kerja — detail teks (pelengkap diagram)
bulletSlide(
  'Alur Kerja Pelapor',
  'Dari lapangan sampai terkirim',
  [
    '1. Buka app / scan QR → form pelaporan.',
    '2. Isi data + foto + GPS (opsional).',
    '3. Sistem deteksi HiPo otomatis.',
    '4. Submit → foto upload ke Storage, data ke database.',
    '5. Trigger notifikasi → dashboard HSE + antrian email.',
    '6. Konfirmasi sukses ke pelapor.',
    'Offline: laporan tersimpan lokal, terkirim saat online kembali.',
  ],
)

bulletSlide(
  'Alur Kerja HSE',
  'Dari notifikasi sampai closed',
  [
    '1. Terima notifikasi (dashboard / email).',
    '2. Buka laporan → triage & assign PIC.',
    '3. HiPo/High → wajib investigasi + root cause.',
    '4. Buat CAPA jika perlu tindakan korektif.',
    '5. PIC tindaklanjuti → status In Progress.',
    '6. HSE verifikasi efektivitas → Pending Verification.',
    '7. Closed + catatan penutupan. Semua tercatat di Audit.',
  ],
)

bulletSlide(
  'Arsitektur Teknis',
  'Komponen sistem',
  [
    'Frontend: React + Vite + Tailwind — hosting Vercel (CDN global).',
    'Database: Supabase PostgreSQL — tabel observations, capa, audit, KPI.',
    'Storage: Supabase — foto bukti laporan.',
    'Auth: Supabase Auth — login admin/HSE.',
    'Email: Resend API via Supabase Edge Functions.',
    'PWA: vite-plugin-pwa — install di HP, cache offline.',
  ],
)

// Flow diagram slide as table
{
  const slide = pptx.addSlide()
  addHeader(slide, 'Ringkasan URL Aplikasi', 'Akses cepat')
  slide.addTable(
    [
      [
        { text: 'Halaman', options: { bold: true, fill: { color: ORANGE }, color: WHITE } },
        { text: 'URL', options: { bold: true, fill: { color: ORANGE }, color: WHITE } },
        { text: 'Akses', options: { bold: true, fill: { color: ORANGE }, color: WHITE } },
      ],
      ['Form Pelapor', '/', 'Publik'],
      ['QR Poster', '/qr', 'Publik'],
      ['Login Admin', '/admin/login', 'Publik'],
      ['Dashboard', '/admin', 'Admin/HSE'],
      ['Analitik', '/admin/ringkasan', 'Admin/HSE'],
      ['Peta GPS', '/admin/peta', 'Admin/HSE'],
      ['Notifikasi Email', '/admin/pengaturan', 'Admin'],
    ],
    { x: 0.5, y: 1.2, w: 9, fontSize: 12, border: { type: 'solid', color: 'CBD5E1' }, align: 'left' },
  )
}

// Closing
{
  const slide = pptx.addSlide()
  slide.background = { color: DARK }
  if (fs.existsSync(logoOrange)) {
    slide.addImage({ path: logoOrange, x: 4.0, y: 1.5, w: 2.5, h: 0.8 })
  }
  slide.addText('Terima Kasih', {
    x: 0.5,
    y: 2.8,
    w: 9,
    h: 0.8,
    fontSize: 40,
    bold: true,
    color: ORANGE,
    align: 'center',
  })
  slide.addText('Pertanyaan & diskusi', {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: WHITE,
    align: 'center',
  })
  slide.addText('Demo live: bact-safety-observation-modern.vercel.app', {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.4,
    fontSize: 12,
    color: '94A3B8',
    align: 'center',
  })
}

try {
  await pptx.writeFile({ fileName: outPath })
  console.log('Presentasi dibuat:', outPath)
} catch (err) {
  if (err.code === 'EBUSY') {
    await pptx.writeFile({ fileName: outPathAlt })
    console.log('File utama sedang dibuka — disimpan ke:', outPathAlt)
  } else {
    throw err
  }
}
