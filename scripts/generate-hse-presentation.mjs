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

await pptx.writeFile({ fileName: outPath })
console.log('Presentasi dibuat:', outPath)
