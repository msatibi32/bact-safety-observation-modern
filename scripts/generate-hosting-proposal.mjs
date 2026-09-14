/**
 * Pengajuan Hosting, Domain, dan upgrade SOC — 5 slide
 * Run: npm run generate:ppt:hosting
 * Output: supabase/BACT-SOC-Pengajuan-Hosting-Domain.pptx
 *
 * Harga publik dicek 12 September 2026.
 * Usulan Hostinger Unlimited: keranjang checkout 48 bulan (4 tahun).
 * Promo Rp38.900/bln (harga coret Rp121.900/bln).
 * Paket Unlimited 48 bln: Rp1.867.200.
 * Cadangan berkas, domain, WHOIS: Rp0.
 * Pajak Rp205.392 · TOTAL bayar sekarang Rp2.072.592.
 * Domain + kotak surat: gratis tahun pertama.
 * Setelah 48 bulan: perpanjang hosting Rp121.900/bln.
 * Supabase: Free; Pro USD 25/bulan.
 * Resend: tetap dipakai. Free 3.000/bulan; Pro USD 20/bulan.
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
  navy: '0F2744',
  orange: 'F37021',
  ink: '1A1A1A',
  slate: '334155',
  muted: '5B6775',
  line: 'C5CDD6',
  zebra: 'F3F5F7',
  white: 'FFFFFF',
}

const FONT = 'Calibri'
const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'PT. BACT HSSE'
pptx.title = 'Pengajuan Hosting, Domain, dan Upgrade Safety Observation Card'
pptx.company = 'PT. BACT — Batu Ampar Container Terminal'
pptx.subject = 'Dokumen internal — September 2026'

function addLogo(slide, box) {
  if (logoWhite) slide.addImage({ path: logoWhite, ...box })
}

function addFooter(slide, num) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 5.38,
    w: '100%',
    h: 0.01,
    fill: { color: C.line },
  })
  slide.addText('RAHASIA  ·  HSSE  ·  September 2026', {
    x: 0.38,
    y: 5.4,
    w: 7.4,
    h: 0.18,
    fontSize: 9,
    color: C.muted,
    fontFace: FONT,
  })
  slide.addText(String(num), {
    x: 8.85,
    y: 5.4,
    w: 0.75,
    h: 0.18,
    fontSize: 9,
    color: C.muted,
    align: 'right',
    fontFace: FONT,
  })
}

function contentSlide(title) {
  const slide = pptx.addSlide()
  slide.background = { color: C.white }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.7,
    fill: { color: C.navy },
  })
  addLogo(slide, { x: 0.28, y: 0.12, w: 1.32, h: 0.46 })
  slide.addText(title, {
    x: 1.72,
    y: 0.16,
    w: 7.95,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.7,
    w: '100%',
    h: 0.028,
    fill: { color: C.orange },
  })
  return slide
}

function heading(slide, { x, y, w, text }) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.26,
    fontSize: 14,
    bold: true,
    color: C.navy,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y: y + 0.26,
    w: 0.9,
    h: 0.028,
    fill: { color: C.orange },
  })
}

function addTable(slide, rows, { x, y, w, colW, fontSize = 13, rowH = 0.38 }) {
  slide.addTable(rows, {
    x,
    y,
    w,
    colW,
    border: [
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
    ],
    fontFace: FONT,
    fontSize,
    color: C.ink,
    valign: 'middle',
    align: 'left',
    rowH,
  })
}

const th = (text, extra = {}) => ({
  text,
  options: { fill: { color: C.navy }, color: C.white, bold: true, ...extra },
})
const td = (text, fill, extra = {}) => ({
  text,
  options: { fill: { color: fill }, color: C.ink, ...extra },
})

// 1 — Cover
{
  const slide = pptx.addSlide()
  slide.background = { color: C.navy }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.028,
    fill: { color: C.orange },
  })
  addLogo(slide, { x: 0.55, y: 0.45, w: 2.15, h: 0.75 })
  slide.addText('PT. BACT — Batu Ampar Container Terminal', {
    x: 0.55,
    y: 1.4,
    w: 8.8,
    h: 0.28,
    fontSize: 13,
    color: 'B8C4D4',
    fontFace: FONT,
  })
  slide.addText('Pengajuan Hosting, Domain,\ndan Upgrade Safety Observation Card', {
    x: 0.55,
    y: 1.9,
    w: 8.9,
    h: 1.15,
    fontSize: 28,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 3.2,
    w: 1.35,
    h: 0.03,
    fill: { color: C.orange },
  })
  slide.addText('Disampaikan kepada: Manajemen, HSSE, dan IT', {
    x: 0.55,
    y: 3.5,
    w: 8.8,
    h: 0.28,
    fontSize: 14,
    color: 'D6DEE8',
    fontFace: FONT,
  })
  slide.addText('September 2026  ·  Dokumen internal', {
    x: 0.55,
    y: 4.95,
    w: 8.8,
    h: 0.26,
    fontSize: 12,
    color: '8A97A8',
    fontFace: FONT,
  })
}

// 2 — Maksud + kenapa bukan Excel
{
  const slide = contentSlide('Maksud pengajuan')
  addFooter(slide, 2)
  slide.addText(
    'Diminta persetujuan memindahkan pelaporan SOC dari Excel ke aplikasi, serta menyediakan alamat resmi (hosting dan domain).',
    {
      x: 0.4,
      y: 0.88,
      w: 9.2,
      h: 0.5,
      fontSize: 15,
      color: C.ink,
      fontFace: FONT,
    },
  )
  addTable(
    slide,
    [
      [th('Aspek'), th('Excel (saat ini)'), th('Usulan: aplikasi SOC')],
      [
        td('Cara lapor', C.white, { bold: true }),
        td('Berkas atau kertas; sering tertunda', C.white),
        td('HP atau QR, tanpa login', C.white),
      ],
      [
        td('Data dan status', C.zebra, { bold: true }),
        td('Banyak versi file; sulit sampai closed', C.zebra),
        td('Satu antrian; status tercatat sampai Closed', C.zebra),
      ],
      [
        td('Klasifikasi', C.white, { bold: true }),
        td('Dicampur pelapor; hasil tidak seragam', C.white),
        td('HSE mengisi kategori dan risiko di dashboard', C.white),
      ],
      [
        td('Identitas dan akses', C.zebra, { bold: true }),
        td('Ketik manual; berkas mudah diteruskan', C.zebra),
        td('Nama BACT dari daftar HR; peran masuk terbatas', C.zebra),
      ],
    ],
    { x: 0.4, y: 1.46, w: 9.2, colW: [1.85, 3.5, 3.85], fontSize: 13, rowH: 0.5 },
  )
  slide.addText(
    'Aplikasi sudah diuji. Pengajuan ini untuk alamat resmi: situs di Hostinger; data laporan di Supabase; pengiriman notifikasi tetap Resend.',
    {
      x: 0.4,
      y: 4.5,
      w: 9.2,
      h: 0.55,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
}

// 3 — Tiga layanan terpisah + pembagian keamanan
{
  const slide = contentSlide('Tiga layanan terpisah')
  addFooter(slide, 3)
  slide.addText('Hostinger, Supabase, dan Resend bukan satu paket. Fungsi masing-masing berbeda.', {
    x: 0.4,
    y: 0.8,
    w: 9.2,
    h: 0.28,
    fontSize: 14,
    color: C.ink,
    fontFace: FONT,
  })
  addTable(
    slide,
    [
      [th('Layanan'), th('Fungsi'), th('Biaya saat ini')],
      [
        td('Hostinger', C.white, { bold: true }),
        td('Situs, domain, SSL, cadangan berkas, kotak surat untuk baca email. Bukan basis data SOC.', C.white),
        td('Checkout 48 bulan Rp2.072.592', C.white),
      ],
      [
        td('Supabase', C.zebra, { bold: true }),
        td('Basis data, autentikasi admin, RLS, penyimpanan foto. Bukan Hostinger.', C.zebra),
        td('Free; Pro USD 25/bulan jika kapasitas tidak cukup', C.zebra),
      ],
      [
        td('Resend', C.white, { bold: true }),
        td('Mengirim notifikasi (laporan baru, HiPo). Tetap Resend.', C.white),
        td('Free 3.000/bulan; Pro USD 20/bulan jika volume naik', C.white),
      ],
    ],
    { x: 0.4, y: 1.12, w: 9.2, colW: [1.7, 4.7, 2.8], fontSize: 12, rowH: 0.46 },
  )
  heading(slide, { x: 0.4, y: 3.04, w: 9.2, text: 'Pembagian keamanan' })
  addTable(
    slide,
    [
      [th('Yang melindungi aplikasi (live)'), th('Yang dicakup Hostinger (usulan)')],
      [
        td('HTTPS/TLS + HSTS; header CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.', C.white),
        td('SSL pada domain. Live hari ini masih Vercel + Supabase + Resend.', C.white),
      ],
      [
        td('Supabase Auth (kata sandi hash), RLS, foto maks. 10 MB. Anon key di klien; service role hanya Edge Function.', C.zebra),
        td('2FA pada panel. Kotak surat untuk baca email — bukan basis data SOC.', C.zebra),
      ],
      [
        td('5 gagal / 2 menit di halaman login. Insert publik ~20/menit.', C.white),
        td('Hostinger tidak mengunci akun SOC dan tidak menyimpan laporan.', C.white),
      ],
    ],
    { x: 0.4, y: 3.36, w: 9.2, colW: [5.05, 4.15], fontSize: 12, rowH: 0.44 },
  )
}

// 4 — Rincian biaya Hostinger (cart only)
{
  const slide = contentSlide('Rincian biaya Hostinger 48 bulan')
  addFooter(slide, 4)
  addTable(
    slide,
    [
      [th('Uraian (keranjang Unlimited)'), th('Jumlah', { align: 'right' })],
      [
        td('Paket Unlimited 48 bulan  ·  promo Rp38.900/bln (coret Rp121.900)', C.white),
        td('Rp 1.867.200', C.white, { align: 'right' }),
      ],
      [td('Cadangan berkas', C.zebra), td('Rp 0', C.zebra, { align: 'right' })],
      [td('Domain', C.white), td('Rp 0', C.white, { align: 'right' })],
      [td('WHOIS', C.zebra), td('Rp 0', C.zebra, { align: 'right' })],
      [td('Pajak', C.white), td('Rp 205.392', C.white, { align: 'right' })],
      [
        td('Jumlah dibayar sekarang', C.zebra, { bold: true }),
        td('Rp 2.072.592', C.zebra, { bold: true, align: 'right' }),
      ],
    ],
    { x: 0.4, y: 0.92, w: 9.2, colW: [6.7, 2.5], fontSize: 14, rowH: 0.42 },
  )
  slide.addText(
    'Domain dan kotak surat gratis pada tahun pertama.\nSetelah 48 bulan, perpanjangan hosting Rp121.900/bulan.\nSupabase dan Resend saat ini Rp0 (bukan tagihan Hostinger).',
    {
      x: 0.4,
      y: 4.1,
      w: 9.2,
      h: 0.95,
      fontSize: 14,
      color: C.ink,
      fontFace: FONT,
    },
  )
}

// 5 — Keputusan yang diminta (+ banding singkat vs cPanel)
{
  const slide = contentSlide('Keputusan yang diminta')
  addFooter(slide, 5)
  addTable(
    slide,
    [
      [th('Aspek'), th('Hostinger Unlimited'), th('Hosting cPanel biasa')],
      [
        td('4 tahun', C.white, { bold: true }),
        td('Rp2.072.592 (promo + pajak, keranjang 48 bulan)', C.white),
        td('Umumnya Rp2,4–7,2 juta', C.white),
      ],
      [
        td('Paket', C.zebra, { bold: true }),
        td('Domain + kotak surat tahun 1, SSL, cadangan berkas', C.zebra),
        td('Sering terpisah / tergantung paket', C.zebra),
      ],
      [
        td('Catatan', C.white, { bold: true }),
        td('Bukan cPanel; data SOC tetap Supabase + Resend', C.white),
        td('Panel dikenal teknisi lama; bukan arsitektur SOC', C.white),
      ],
    ],
    { x: 0.4, y: 0.86, w: 9.2, colW: [1.45, 4.15, 3.6], fontSize: 12, rowH: 0.4 },
  )
  const items = [
    'Setujui aplikasi SOC sebagai pengganti Excel untuk pelaporan HSE.',
    'Setujui Hostinger Unlimited 48 bulan Rp2.072.592 (situs, SSL, cadangan berkas, kotak surat tahun pertama; sudah termasuk pajak).',
    'Catat Supabase dan Resend sebagai tagihan terpisah. Saat ini Free; Pro hanya jika volume atau kapasitas naik.',
    'Tugaskan IT / HSSE: 2FA pada panel Hostinger, serta pembagian peran Super Admin, HSE Officer, dan Viewer. Data laporan tetap di Supabase.',
  ]
  items.forEach((text, i) => {
    const y = 2.62 + i * 0.58
    slide.addText(String(i + 1) + '.', {
      x: 0.4,
      y,
      w: 0.38,
      h: 0.5,
      fontSize: 15,
      bold: true,
      color: C.navy,
      fontFace: FONT,
    })
    slide.addText(text, {
      x: 0.82,
      y,
      w: 8.78,
      h: 0.54,
      fontSize: 14,
      color: C.ink,
      fontFace: FONT,
    })
  })
}

function cleanupGenerated(official) {
  const leftover = official.replace(/\.pptx$/i, '-generated.pptx')
  if (fs.existsSync(leftover)) {
    fs.unlinkSync(leftover)
    console.log('Dihapus salinan sisa:', leftover)
  }
}

try {
  await pptx.writeFile({ fileName: outPath })
  console.log('Presentasi dibuat:', outPath)
  cleanupGenerated(outPath)
} catch (err) {
  if (err.code === 'EBUSY' || err.code === 'EPERM') {
    const fallback = path.join(root, 'supabase', 'BACT-SOC-Pengajuan-Hosting-Domain-generated.pptx')
    await pptx.writeFile({ fileName: fallback })
    console.warn('File utama sedang dibuka — disimpan ke:', fallback)
  } else {
    throw err
  }
}
console.log('Total slide:', pptx.slides.length)
