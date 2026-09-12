/**
 * Pengajuan Hosting, Domain, dan upgrade SOC (Excel → aplikasi)
 * Run: npm run generate:ppt:hosting
 * Output: supabase/BACT-SOC-Pengajuan-Hosting-Domain.pptx
 *
 * Harga publik dicek 12 September 2026.
 * Hostinger Unlimited: keranjang 48 bulan (promo Sept 2026) + halaman harga Hostinger.
 * Supabase: supabase.com/pricing · Resend: resend.com/pricing
 * Kurs perencanaan: Rp17.600 / USD (pasar ± Rp17.585–17.609, 11–12 Sept 2026).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PptxGenJS from 'pptxgenjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPath = path.join(root, 'supabase', 'BACT-SOC-Pengajuan-Hosting-Domain.pptx')
const logoWhite =
  [
    path.join(root, 'public', 'logo', 'BACT Logo_OG White Text.png'),
    path.join(root, 'public', 'logo', 'bact-logo-white.png'),
  ].find((p) => fs.existsSync(p)) || null

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
pptx.title = 'Pengajuan Hosting, Domain & Upgrade Safety Observation Card'
pptx.company = 'PT. BACT — Batu Ampar Container Terminal'

function addLogo(slide, { x, y, w, h }) {
  if (logoWhite) slide.addImage({ path: logoWhite, x, y, w, h })
}

function addFooter(slide) {
  slide.addText('PT. BACT · Pengajuan Hosting & Domain SOC · September 2026', {
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
    w: w - 0.62,
    h: 0.32,
    fontSize: 12,
    bold: true,
    color: C.dark,
    fontFace: FONT,
  })
  slide.addText(body, {
    x: x + 0.14,
    y: y + 0.48,
    w: w - 0.28,
    h: h - 0.58,
    fontSize: 11,
    color: C.slate,
    fontFace: FONT,
    valign: 'top',
  })
}

function addTable(slide, rows, { x, y, w, colW, fontSize = 11, rowH = 0.32 }) {
  slide.addTable(rows, {
    x,
    y,
    w,
    colW,
    border: [
      { pt: 0.5, color: 'E2E8F0' },
      { pt: 0.5, color: 'E2E8F0' },
      { pt: 0.5, color: 'E2E8F0' },
      { pt: 0.5, color: 'E2E8F0' },
    ],
    fontFace: FONT,
    fontSize,
    color: C.slate,
    valign: 'middle',
    align: 'left',
    rowH,
  })
}

const th = (text, extra = {}) => ({
  text,
  options: { fill: { color: C.dark }, color: C.white, bold: true, align: 'center', ...extra },
})
const td = (text, extra = {}) => ({ text, options: extra })

// 1 — Cover
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: '100%', fill: { color: C.orange } })
  addLogo(slide, { x: 0.55, y: 0.35, w: 2.1, h: 0.82 })
  slide.addText('PENGAJUAN INTERNAL', {
    x: 0.55,
    y: 1.45,
    w: 8.8,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText('Hosting, Domain & Upgrade\nSafety Observation Card', {
    x: 0.55,
    y: 1.8,
    w: 8.8,
    h: 1.45,
    fontSize: 30,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText(
    'Tiga tagihan terpisah: Hostinger (web + domain + mailbox terima) · Supabase (database) · Resend (kirim email).\nBukan satu paket all-in. Angka publik 12 September 2026.',
    {
      x: 0.55,
      y: 3.4,
      w: 8.6,
      h: 0.7,
      fontSize: 14,
      color: 'CBD5E1',
      fontFace: FONT,
    },
  )
  slide.addText('PT. BACT  ·  HSSE / IT  ·  September 2026', {
    x: 0.55,
    y: 4.85,
    w: 8,
    h: 0.28,
    fontSize: 12,
    color: C.muted,
    fontFace: FONT,
  })
}

// 2 — Ringkasan usulan
{
  const slide = contentSlide('Ringkasan usulan', 'Yang diminta dari manajemen, dalam satu halaman')
  const items = [
    {
      t: '1. Upgrade cara kerja HSE',
      b: 'SOC saat ini masih Excel — lambat, sulit di lapangan, sulit dilacak. Aplikasi SOC BACT sudah hidup sebagai pengganti.',
      c: C.orange,
    },
    {
      t: '2. Domain & hosting resmi',
      b: 'Hostinger Unlimited: website, domain, SSL, backup file, dan mailbox untuk menerima email. Bukan tempat database laporan.',
      c: C.blue,
    },
    {
      t: '3. Bayar Hostinger sekarang',
      b: 'Keranjang 48 bulan: Rp38.900/bln + pajak Rp205.392 = Rp2.072.592. Domain & mailbox terima gratis tahun pertama.',
      c: C.green,
    },
    {
      t: '4. Database & kirim email terpisah',
      b: 'Supabase (data, login, foto) dan Resend (notifikasi keluar) tetap dipakai. Sekarang Free. Pro hanya jika volume naik.',
      c: C.purple,
    },
  ]
  items.forEach((it, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    featureBox(slide, {
      x: 0.35 + col * 4.7,
      y: 1.15 + row * 1.85,
      w: 4.5,
      h: 1.7,
      title: it.t,
      body: it.b,
      accent: it.c,
    })
  })
}

// 3 — Tiga tagihan
{
  const slide = contentSlide('Tiga tagihan, bukan satu', 'Ini yang paling sering disalahpahami — Hostinger tidak termasuk database')
  const bills = [
    {
      t: 'Hostinger',
      b: 'Website + domain + SSL + backup file + mailbox untuk BACA / TERIMA email (contoh hse@domain). Tidak menyimpan laporan SOC, login HSE, atau foto bukti.',
      c: C.orange,
    },
    {
      t: 'Supabase',
      b: 'Database, Auth (login admin), dan storage foto. Invoice terpisah. Sekarang Free ($0). Pro dari $25/bln kalau nanti butuh backup harian / kapasitas lebih besar.',
      c: C.green,
    },
    {
      t: 'Resend',
      b: 'Kirim notifikasi transaksional (laporan baru, HiPo). Tetap Resend — SMTP Hostinger tidak dipakai untuk kirim. Sekarang Free ($0). Pro dari $20/bln.',
      c: C.indigo,
    },
  ]
  bills.forEach((b, i) => {
    featureBox(slide, {
      x: 0.32 + i * 3.15,
      y: 1.15,
      w: 3.02,
      h: 2.55,
      title: b.t,
      body: b.b,
      accent: b.c,
    })
  })
  slide.addText(
    'Mailbox Hostinger = kotak masuk perusahaan. Resend = mesin pengirim otomatis. Jangan campur: kita tidak pindah kirim notifikasi ke SMTP Hostinger.',
    {
      x: 0.4,
      y: 3.9,
      w: 9.2,
      h: 0.85,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 4 — Excel tertinggal
{
  const slide = contentSlide('Kondisi sekarang: SOC masih Excel', 'Alasan pengajuan ini lebih dari sekadar beli hosting')
  const pains = [
    { t: 'Lambat di lapangan', b: 'Isi kertas/Excel di office, bukan dari HP saat kejadian. Data sering telat atau tidak lengkap.' },
    { t: 'File tercecer', b: 'Banyak versi, copy di WhatsApp, sulit tahu mana yang terbaru. Mudah hilang saat ganti PIC/HSE.' },
    { t: 'Sulit ditindaklanjuti', b: 'Tidak ada antrian klasifikasi, status Open → Closed, investigasi, atau PDF Notice resmi.' },
    { t: 'Analitik manual', b: 'Rekap HiPo, lokasi, kontraktor, tren bulanan diketik ulang. Rawan salah hitung.' },
    { t: 'Akses tidak terkontrol', b: 'Siapa saja yang pegang file bisa ubah/hapus. Tidak ada jejak siapa mengubah apa.' },
    { t: 'Backup lemah', b: 'Mengandalkan laptop orang. Tidak ada SSL, domain resmi, atau recovery terpusat.' },
  ]
  pains.forEach((p, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    featureBox(slide, {
      x: 0.32 + col * 3.15,
      y: 1.15 + row * 1.85,
      w: 3.02,
      h: 1.7,
      title: p.t,
      body: p.b,
      accent: i < 3 ? C.red : C.amber,
    })
  })
}

// 5 — Excel vs aplikasi
{
  const slide = contentSlide('Excel vs aplikasi SOC BACT', 'Upgrade masa depan untuk tim HSSE — bukan ganti alat saja')
  addTable(
    slide,
    [
      [th('Aspek'), th('Excel (sekarang)'), th('Aplikasi SOC')],
      [td('Cara lapor'), td('Isi file / kertas, lalu kirim'), td('HP/QR, tanpa login, label ID + English')],
      [td('Identitas pelapor'), td('Ketik manual, sering tidak lengkap'), td('Nama BACT autocomplete + ID otomatis')],
      [td('Bukti'), td('Foto di chat, terpisah dari data'), td('Foto + lokasi tersimpan satu laporan')],
      [td('Klasifikasi HSE'), td('Campur di kolom Excel'), td('HSE isi kategori & risiko di dashboard')],
      [td('Follow-up'), td('Sulit dilacak sampai closed'), td('Status, investigasi, CAPA, PDF Notice')],
      [td('Analitik'), td('Pivot manual, lambat'), td('Weekly / Monthly report, import Excel, grafik')],
      [td('Keamanan akses'), td('File bisa di-forward siapa saja'), td('Role Super Admin / HSE / Viewer')],
      [td('Jejak perubahan'), td('Hampir tidak ada'), td('Audit log siapa mengubah laporan')],
    ],
    { x: 0.32, y: 1.08, w: 9.36, colW: [2.1, 3.63, 3.63], fontSize: 10, rowH: 0.38 },
  )
}

// 6 — Aplikasi sudah ada
{
  const slide = contentSlide('Aplikasi sudah dibangun', 'Bukan konsep — sudah live di web')
  const boxes = [
    { t: 'Form pelapor', b: 'Label bilingual. Perusahaan, nama, departemen, tanggal, lokasi, deskripsi, Stop Work, foto. Tanpa login.', c: C.orange },
    { t: 'Command Center', b: 'UI English, dark/light. Antrian, klasifikasi HSE, investigasi, PDF Notice, notifikasi Resend.', c: C.blue },
    { t: 'Analitik & log', b: 'Weekly/Monthly report (From–To), import Excel/CSV historis, export, Log HSE Super Admin.', c: C.green },
    { t: 'Role akun', b: 'Super Admin, HSE Officer, Viewer. PIC = assign di laporan, bukan role login.', c: C.purple },
  ]
  boxes.forEach((b, i) => {
    featureBox(slide, {
      x: 0.32 + i * 2.4,
      y: 1.15,
      w: 2.28,
      h: 2.35,
      title: b.t,
      body: b.b,
      accent: b.c,
    })
  })
  slide.addText(
    'Live sekarang: bact-safety-observation-modern.vercel.app  ·  Admin: /admin/login\nPengajuan ini supaya alamatnya resmi (domain BACT), file web di Hostinger, database tetap Supabase, kirim email tetap Resend.',
    {
      x: 0.4,
      y: 3.7,
      w: 9.2,
      h: 0.85,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 7 — Kenapa hosting + domain
{
  const slide = contentSlide('Mengapa perlu hosting & domain resmi', 'Uji coba boleh di subdomain. Operasional HSE butuh alamat perusahaan.')
  const why = [
    { t: 'Kredibel di lapangan', b: 'QR dan surat Notice lebih dipercaya jika domain-nya BACT, bukan alamat uji coba Vercel.' },
    { t: 'Mailbox untuk menerima', b: 'Paket termasuk mailbox (gratis 1 tahun) — kotak masuk HSE/IT. Bukan untuk kirim notifikasi otomatis.' },
    { t: 'Backup file & SSL', b: 'HTTPS otomatis + backup harian file website. Kalau laptop rusak, file web tidak ikut hilang.' },
    { t: 'Kontrol IT', b: 'Panel hosting, perpanjang domain, dan akses akun ada di tangan perusahaan.' },
  ]
  why.forEach((w, i) => {
    featureBox(slide, {
      x: 0.32 + (i % 2) * 4.7,
      y: 1.15 + Math.floor(i / 2) * 1.85,
      w: 4.5,
      h: 1.7,
      title: w.t,
      body: w.b,
      accent: C.blue,
    })
  })
}

// 8 — Paket Hostinger
{
  const slide = contentSlide(
    'Paket usulan: Hostinger Unlimited',
    'Harga halaman resmi + keranjang 48 bulan (promo September 2026)',
  )
  const specs = [
    { t: 'Rp38.900 / bulan', b: 'Promo (normal Rp129.900/bln). Kunci 48 bulan. Hosting saja Rp1.867.200.' },
    { t: '48 bulan + pajak', b: 'Pajak keranjang Rp205.392. Total bayar sekarang Rp2.072.592.' },
    { t: 'Domain gratis 1 th', b: '.com / .net / .org, dll. Tahun berikutnya berbayar (lihat slide domain).' },
    { t: '50 GB NVMe', b: 'Untuk file website SOC + beberapa situs internal. Bukan database laporan.' },
    { t: 'Backup harian', b: 'Restore file web dari panel. Masuk promo keranjang (nilai normal ± Rp771 rb).' },
    { t: 'SSL + mailbox terima', b: 'SSL otomatis. Mailbox unlimited per website, gratis 1 tahun — untuk baca email.' },
  ]
  specs.forEach((s, i) => {
    featureBox(slide, {
      x: 0.32 + (i % 3) * 3.15,
      y: 1.12 + Math.floor(i / 3) * 1.85,
      w: 3.02,
      h: 1.72,
      title: s.t,
      body: s.b,
      accent: i === 0 ? C.orange : C.green,
    })
  })
}

// 9 — Kelebihan Hostinger
{
  const slide = contentSlide('Kelebihan Hostinger', 'Mengapa paket ini masuk akal untuk SOC BACT')
  const plus = [
    { t: 'Harga promo jelas', b: 'Checkout Rp2.072.592 untuk 4 tahun hosting (sudah pajak). Mudah diajukan di budget tahunan.' },
    { t: 'Panel modern (hPanel)', b: 'Lebih sederhana dari cPanel klasik. Cocok dikelola IT + HSE tanpa jadi sysadmin penuh.' },
    { t: 'Dukungan Node.js', b: 'Bukan hanya WordPress. Frontend SOC modern bisa di-deploy di paket ini.' },
    { t: 'SSL & CDN', b: 'Sertifikat HTTPS otomatis, CDN, prioritas support 24/7 di paket Unlimited.' },
    { t: 'Keamanan bawaan', b: 'WAF, filter DDoS, malware scanner, nameserver Cloudflare, ISO 27001 di sisi Hostinger.' },
    { t: 'Garansi 30 hari', b: 'Bisa dibatalkan di awal jika tidak cocok. Perpanjangan hosting setelah 48 bulan: Rp121.900/bln.' },
  ]
  plus.forEach((p, i) => {
    featureBox(slide, {
      x: 0.32 + (i % 3) * 3.15,
      y: 1.12 + Math.floor(i / 3) * 1.85,
      w: 3.02,
      h: 1.72,
      title: p.t,
      body: p.b,
      accent: C.green,
    })
  })
}

// 10 — Keterbatasan
{
  const slide = contentSlide('Keterbatasan Hostinger (perlu jujur)', 'Supaya keputusan tidak hanya lihat harga promo')
  const cons = [
    {
      t: 'Shared hosting',
      b: 'Server dipakai bersama website lain. Cukup untuk SOC internal, tapi bukan VPS terisolasi kelas bank.',
      c: C.amber,
    },
    {
      t: 'Ikat 48 bulan',
      b: 'Harga murah karena bayar di muka. Batal di tengah residual bisa tidak semurah hitungan bulanan.',
      c: C.amber,
    },
    {
      t: 'Bukan cPanel',
      b: 'Pakai hPanel. Teknisi yang hanya terbiasa cPanel perlu waktu singkat beradaptasi.',
      c: C.blue,
    },
    {
      t: 'Domain & mailbox tahun ke-2',
      b: 'Gratis hanya tahun pertama. Domain .com ± Rp419.800/th. Mailbox terima dianggarkan terpisah.',
      c: C.orange,
    },
    {
      t: 'Database BUKAN di sini',
      b: 'Laporan, login, foto tetap di Supabase. Hostinger = web + domain + mailbox terima + SSL + backup file.',
      c: C.purple,
    },
    {
      t: 'Bukan mesin kirim email',
      b: 'Notifikasi otomatis tetap Resend. SMTP Hostinger tidak jadi rencana pengiriman.',
      c: C.red,
    },
  ]
  cons.forEach((p, i) => {
    featureBox(slide, {
      x: 0.32 + (i % 3) * 3.15,
      y: 1.12 + Math.floor(i / 3) * 1.85,
      w: 3.02,
      h: 1.72,
      title: p.t,
      body: p.b,
      accent: p.c,
    })
  })
}

// 11 — vs cPanel
{
  const slide = contentSlide('Hostinger vs hosting cPanel tradisional', 'cPanel = panel klasik (Niagahoster, Rumahweb, dsb). Hostinger = hPanel sendiri.')
  addTable(
    slide,
    [
      [th('Aspek'), th('Hostinger Unlimited (hPanel)'), th('Hosting cPanel biasa')],
      [td('Panel'), td('hPanel — modern, lebih simpel'), td('cPanel — familiar teknisi lama')],
      [td('Harga 4 tahun'), td('± Rp2,07 juta (promo + pajak)'), td('Sering Rp50–150 rb/bln = Rp2,4–7,2 jt')],
      [td('Domain'), td('Gratis 1 tahun di paket'), td('Sering dibeli terpisah')],
      [td('Mailbox terima'), td('Unlimited/website, gratis 1 th'), td('Ada, kuota tergantung paket')],
      [td('SSL / backup file'), td('SSL otomatis + backup harian'), td('Tergantung paket; kadang add-on')],
      [td('Database aplikasi'), td('Tidak termasuk — pakai Supabase'), td('MySQL lokal; tetap bukan arsitektur SOC')],
      [td('Kirim notifikasi'), td('Tidak — tetap Resend'), td('SMTP hosting; deliverability sering lemah')],
      [td('Kelemahan'), td('Shared, ikat promo, bukan cPanel'), td('Lebih mahal, UI ramai, kualitas beda-beda')],
    ],
    { x: 0.28, y: 1.08, w: 9.44, colW: [1.85, 3.8, 3.79], fontSize: 10, rowH: 0.42 },
  )
}

// 12 — Biaya Hostinger
{
  const slide = contentSlide(
    'Tagihan 1 — Hostinger (checkout 48 bulan)',
    'Angka keranjang Unlimited Sept 2026. Tidak termasuk Supabase / Resend.',
  )
  addTable(
    slide,
    [
      [th('Pos biaya'), th('Periode'), th('Nominal'), th('Keterangan')],
      [td('Paket Unlimited'), td('48 bulan'), td('Rp 1.867.200'), td('Rp38.900/bln promo (normal Rp129.900)')],
      [td('Backup harian'), td('48 bulan'), td('Rp 0'), td('Termasuk promo (nilai ± 771 rb)')],
      [td('Domain'), td('Tahun 1'), td('Rp 0'), td('Gratis di paket')],
      [td('Mailbox terima'), td('Tahun 1'), td('Rp 0'), td('Gratis 1 tahun — untuk baca email')],
      [td('Pajak'), td('Saat bayar'), td('Rp 205.392'), td('Dari keranjang Hostinger')],
      [
        td('TOTAL BAYAR SEKARANG', { bold: true, color: C.dark }),
        td('48 bulan', { bold: true }),
        td('Rp 2.072.592', { bold: true, color: C.orange }),
        td('Efektif ± Rp43.180 / bulan'),
      ],
    ],
    { x: 0.28, y: 1.05, w: 9.44, colW: [2.4, 1.55, 2.15, 3.34], fontSize: 11, rowH: 0.36 },
  )
  slide.addText(
    'Sumber: keranjang Hostinger Unlimited 48 bulan (Sept 2026) + hostinger.com/id/harga (12 Sept 2026).\nPerpanjangan hosting setelah 48 bulan: Rp121.900/bln (bukan Rp21.900 — itu tarif email). Domain .com tahun 2+: Rp419.800/th (tutorial harga domain Hostinger).',
    {
      x: 0.35,
      y: 3.75,
      w: 9.3,
      h: 1.15,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 13 — Supabase
{
  const slide = contentSlide(
    'Tagihan 2 — Supabase (database, login, foto)',
    'supabase.com/pricing · dicek 12 September 2026 · kurs rencana Rp17.600/USD',
  )
  addTable(
    slide,
    [
      [th('Paket'), th('Harga'), th('Yang didapat'), th('Untuk SOC BACT')],
      [
        td('Free (sekarang)'),
        td('$0 / bln\n≈ Rp 0'),
        td('500 MB DB · 1 GB foto · 50.000 MAU · 2 project'),
        td('Cukup untuk operasional awal. Project Free pause setelah 1 minggu tidak aktif.'),
      ],
      [
        td('Pro (nanti)'),
        td('$25 / bln\n≈ Rp 440.000'),
        td('8 GB disk · 100 GB storage · backup 7 hari · tidak pause'),
        td('Naik jika foto/data penuh, atau butuh backup harian & dukungan email.'),
      ],
    ],
    { x: 0.28, y: 1.08, w: 9.44, colW: [1.9, 1.7, 3.0, 2.84], fontSize: 11, rowH: 0.85 },
  )
  slide.addText(
    'Pro $25 biasanya sudah termasuk 1 project Micro ($10 credit compute). Pajak/VAT bisa ditambah oleh Supabase sesuai alamat billing.\nHostinger tidak menggantikan slide ini. Pindah database ke MySQL Hostinger = kerja ulang besar, tidak diusulkan.',
    {
      x: 0.35,
      y: 3.95,
      w: 9.3,
      h: 0.95,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 14 — Resend
{
  const slide = contentSlide(
    'Tagihan 3 — Resend (kirim notifikasi)',
    'resend.com/pricing · dicek 12 September 2026 · mailbox Hostinger TIDAK menggantikan ini',
  )
  addTable(
    slide,
    [
      [th('Paket'), th('Harga'), th('Kuota kirim'), th('Untuk SOC BACT')],
      [
        td('Free (sekarang)'),
        td('$0 / bln\n≈ Rp 0'),
        td('3.000 email/bln · max 100/hari · 3 domain'),
        td('Cukup: laporan baru + HiPo ke beberapa email HSE.'),
      ],
      [
        td('Pro (nanti)'),
        td('$20 / bln\n≈ Rp 352.000'),
        td('50.000 email/bln · tanpa batas harian · 10 domain'),
        td('Naik jika volume harian tembus 100 atau butuh SLA lebih longgar.'),
      ],
    ],
    { x: 0.28, y: 1.08, w: 9.44, colW: [1.9, 1.7, 3.0, 2.84], fontSize: 11, rowH: 0.85 },
  )
  slide.addText(
    'Rencana tetap: Resend mengirim, Hostinger mailbox menerima. SMTP Hostinger / email hosting bukan mesin notifikasi aplikasi.\nPro $35/bln = 100.000 email — jauh di atas kebutuhan SOC internal. Tidak dianggarkan sekarang.',
    {
      x: 0.35,
      y: 3.95,
      w: 9.3,
      h: 0.95,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 15 — Estimasi 4 tahun
{
  const slide = contentSlide(
    'Estimasi 4 tahun / per tahun',
    'Skenario A = tetap Free di Supabase & Resend (rekomendasi sekarang). Angka dibulatkan.',
  )
  addTable(
    slide,
    [
      [th('Pos'), th('Tahun 1'), th('Tahun 2'), th('Tahun 3'), th('Tahun 4'), th('4 tahun')],
      [
        td('Hostinger hosting+pajak'),
        td('Rp 2.072.592'),
        td('Rp 0'),
        td('Rp 0'),
        td('Rp 0'),
        td('Rp 2.072.592'),
      ],
      [td('Domain .com'), td('Rp 0'), td('Rp 419.800'), td('Rp 419.800'), td('Rp 419.800'), td('Rp 1.259.400')],
      [
        td('Mailbox terima (1 akun)*'),
        td('Rp 0'),
        td('Rp 166.800'),
        td('Rp 166.800'),
        td('Rp 166.800'),
        td('Rp 500.400'),
      ],
      [td('Supabase Free'), td('Rp 0'), td('Rp 0'), td('Rp 0'), td('Rp 0'), td('Rp 0')],
      [td('Resend Free'), td('Rp 0'), td('Rp 0'), td('Rp 0'), td('Rp 0'), td('Rp 0')],
      [
        td('TOTAL skenario A', { bold: true, color: C.dark }),
        td('Rp 2.072.592', { bold: true }),
        td('Rp 586.600', { bold: true }),
        td('Rp 586.600', { bold: true }),
        td('Rp 586.600', { bold: true }),
        td('Rp 3.832.392', { bold: true, color: C.orange }),
      ],
    ],
    { x: 0.2, y: 1.02, w: 9.6, colW: [2.15, 1.49, 1.49, 1.49, 1.49, 1.49], fontSize: 10, rowH: 0.34 },
  )
  slide.addText(
    '*Mailbox tahun 2–4: 1 akun Hostinger Email Starter, tarif perpanjang publik Rp13.900/bln × 12. Opsional jika mailbox perusahaan sudah ada di tempat lain.\nKalau suatu hari naik Pro: Supabase ≈ Rp440 rb/bln (Rp5,28 jt/th) + Resend ≈ Rp352 rb/bln (Rp4,22 jt/th). Itu tagihan terpisah, bukan Hostinger.\nSumber: hostinger.com/id/harga · /harga/email-hosting · tutorial domain Hostinger · supabase.com/pricing · resend.com/pricing · 12 Sept 2026.',
    {
      x: 0.28,
      y: 3.72,
      w: 9.44,
      h: 1.2,
      fontSize: 11,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 16 — Keamanan aplikasi
{
  const slide = contentSlide('Keamanan aplikasi SOC', 'Yang sudah ada di sistem kita — bukan hanya andalkan hosting')
  const secs = [
    { t: 'Pintu terpisah', b: 'Form pelapor publik hanya kirim laporan baru. Dashboard HSE wajib login. Pelapor tidak bisa edit data HSE.' },
    { t: 'Role berjenjang', b: 'Viewer lihat saja. HSE klasifikasi & investigasi. Super Admin kelola akun + Log HSE. PIC = assign laporan, bukan login.' },
    { t: 'Autentikasi', b: 'Login email + password (Supabase Auth). Sesi terproteksi. Akun bisa dinonaktifkan tanpa hapus jejak.' },
    { t: 'Aturan database', b: 'Row Level Security: insert laporan untuk publik; baca/ubah hanya akun login. Foto di storage terpisah.' },
    { t: 'Jejak audit', b: 'Perubahan status, PIC, klasifikasi tercatat. Berguna untuk investigasi internal dan ISO/audit eksternal.' },
    { t: 'HTTPS & data', b: 'Semua akses lewat SSL. Data tidak disimpan di laptop HSE sebagai “master file” Excel.' },
  ]
  secs.forEach((s, i) => {
    featureBox(slide, {
      x: 0.32 + (i % 3) * 3.15,
      y: 1.12 + Math.floor(i / 3) * 1.85,
      w: 3.02,
      h: 1.72,
      title: s.t,
      body: s.b,
      accent: C.blue,
    })
  })
}

// 17 — Keamanan Hostinger
{
  const slide = contentSlide('Keamanan Hostinger — apakah aman?', 'Jawaban singkat: ya, aman untuk aplikasi HSE internal jika disiplin akun')
  addTable(
    slide,
    [
      [th('Lapisan'), th('Yang didapat'), th('Catatan')],
      [td('SSL / HTTPS'), td('Sertifikat otomatis, data terenkripsi di transit'), td('Wajib untuk form & login')],
      [td('Firewall & DDoS'), td('WAF + filter lalu lintas bermusuhan'), td('Standar hosting modern')],
      [td('Malware scanner'), td('Scan file otomatis (Monarx)'), td('Fokus file web, bukan isi database')],
      [td('Backup file'), td('Harian + restore dari panel'), td('Pulihkan jika salah deploy / rusak')],
      [td('Sertifikasi'), td('Hostinger ISO/IEC 27001:2022'), td('Tata kelola keamanan penyedia')],
      [td('Akun panel'), td('Bisa 2FA di Hostinger'), td('Wajib diaktifkan IT/admin')],
    ],
    { x: 0.28, y: 1.08, w: 9.44, colW: [2.1, 4.2, 3.14], fontSize: 11, rowH: 0.38 },
  )
  slide.addText(
    'Bukan “aman mutlak” (tidak ada hosting shared yang 100%). Cukup aman untuk SOC: data operasional HSE, bukan data kartu kredit nasabah.\nSyarat: password kuat, 2FA panel, jangan share Super Admin, review user nonaktif, dan jangan taruh banyak website liar di akun yang sama.',
    {
      x: 0.35,
      y: 3.55,
      w: 9.3,
      h: 1.15,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 18 — Rekomendasi
{
  const slide = contentSlide('Rekomendasi', 'Usulan keputusan untuk manajemen')
  const recs = [
    {
      t: 'Setujui upgrade SOC',
      b: 'Jadikan aplikasi sebagai sistem resmi HSE. Excel hanya arsip/export. Tim lapangan lapor lewat QR/HP.',
      c: C.orange,
    },
    {
      t: 'Setujui Hostinger Unlimited 48 bln',
      b: 'Bayar sekarang Rp2.072.592 untuk web + domain + SSL + backup file + mailbox terima tahun 1.',
      c: C.green,
    },
    {
      t: 'Tetap Free dulu di cloud data',
      b: 'Supabase + Resend $0 selama kuota cukup. Siapkan Pro hanya jika kapasitas/volume naik (angka di slide 13–15).',
      c: C.blue,
    },
    {
      t: 'IT + HSE kelola akses',
      b: '2FA Hostinger. Super Admin terbatas. HSE harian = HSE Officer. Viewer untuk manajemen yang hanya pantau.',
      c: C.purple,
    },
  ]
  recs.forEach((r, i) => {
    featureBox(slide, {
      x: 0.35 + (i % 2) * 4.7,
      y: 1.15 + Math.floor(i / 2) * 1.85,
      w: 4.5,
      h: 1.7,
      title: r.t,
      body: r.b,
      accent: r.c,
    })
  })
}

// 19 — Closing
{
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: '100%', fill: { color: C.orange } })
  addLogo(slide, { x: 0.55, y: 0.4, w: 2.1, h: 0.82 })
  slide.addText('Keputusan yang diminta', {
    x: 0.55,
    y: 1.4,
    w: 8.8,
    h: 0.45,
    fontSize: 26,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText(
    '1. Menyetujui aplikasi SOC sebagai pengganti Excel untuk pelaporan HSE.\n2. Menyetujui Hostinger Unlimited 48 bulan + domain sebesar Rp2.072.592\n    (web, SSL, backup file, mailbox terima tahun 1 — sudah termasuk pajak).\n3. Mencatat bahwa database (Supabase) dan kirim email (Resend) tagihan terpisah;\n    sekarang Free, bukan bagian invoice Hostinger.\n4. Menugaskan IT/HSSE mengaktifkan 2FA, SSL, dan role Super Admin / HSE / Viewer.',
    {
      x: 0.55,
      y: 1.95,
      w: 8.8,
      h: 2.15,
      fontSize: 15,
      color: 'E2E8F0',
      fontFace: FONT,
    },
  )
  slide.addText('Skenario A 4 tahun ≈ Rp3,83 juta  ·  vs  risiko laporan hilang, telat, dan tidak teraudit di Excel.', {
    x: 0.55,
    y: 4.25,
    w: 8.8,
    h: 0.35,
    fontSize: 13,
    color: C.orange,
    fontFace: FONT,
  })
  slide.addText('PT. BACT  ·  Batu Ampar Container Terminal  ·  HSSE / IT  ·  2026', {
    x: 0.55,
    y: 4.85,
    w: 8.5,
    h: 0.28,
    fontSize: 12,
    color: C.muted,
    fontFace: FONT,
  })
}

try {
  await pptx.writeFile({ fileName: outPath })
  console.log('Presentasi dibuat:', outPath)
} catch (err) {
  const fallback = path.join(root, 'supabase', 'BACT-SOC-Pengajuan-Hosting-Domain-generated.pptx')
  await pptx.writeFile({ fileName: fallback })
  console.log('File utama terkunci. Disimpan ke:', fallback)
}
console.log('Total slide:', pptx.slides.length)
