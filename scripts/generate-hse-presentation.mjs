/**
 * Presentasi HSE — BACT Safety Observation Card — 5 slide
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
pptx.title = 'Safety Observation Card — Briefing HSSE'
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
    h: 0.28,
    fontSize: 14,
    bold: true,
    color: C.navy,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y: y + 0.28,
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
  slide.addText('Safety Observation Card', {
    x: 0.55,
    y: 2.05,
    w: 8.8,
    h: 0.55,
    fontSize: 32,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addText('Briefing alur kerja pelaporan HSSE', {
    x: 0.55,
    y: 2.65,
    w: 8.8,
    h: 0.32,
    fontSize: 16,
    color: C.white,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 3.15,
    w: 1.35,
    h: 0.03,
    fill: { color: C.orange },
  })
  slide.addText('Disampaikan kepada: HSSE dan Manajemen', {
    x: 0.55,
    y: 3.45,
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

// 2 — Form pelapor (latar singkat + isi / tidak + autocomplete + HiPo)
{
  const slide = contentSlide('Form pelapor')
  addFooter(slide, 2)
  slide.addText(
    'Excel diganti aplikasi: pelapor kirim kejadian tanpa login; HSE yang mengklasifikasi. Laporan baru tampil Belum diklasifikasi.',
    {
      x: 0.4,
      y: 0.84,
      w: 9.2,
      h: 0.42,
      fontSize: 14,
      color: C.ink,
      fontFace: FONT,
    },
  )
  heading(slide, { x: 0.4, y: 1.3, w: 4.4, text: 'Diisi di lapangan' })
  slide.addText(
    [
      { text: 'Perusahaan, nama, departemen', options: { bullet: true, breakLine: true } },
      { text: 'Tanggal kejadian', options: { bullet: true, breakLine: true } },
      { text: 'Lokasi dan titik GPS', options: { bullet: true, breakLine: true } },
      { text: 'Deskripsi, Stop Work, foto', options: { bullet: true } },
    ],
    {
      x: 0.4,
      y: 1.7,
      w: 4.4,
      h: 1.55,
      fontSize: 15,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 5,
    },
  )
  heading(slide, { x: 5.2, y: 1.3, w: 4.4, text: 'Tidak ada di form' })
  slide.addText(
    [
      { text: 'Laporan anonim', options: { bullet: true, breakLine: true } },
      { text: 'Kategori dan tingkat / potensi risiko', options: { bullet: true, breakLine: true } },
      { text: 'IOGP', options: { bullet: true, breakLine: true } },
      { text: 'Tindakan langsung dan rekomendasi', options: { bullet: true } },
    ],
    {
      x: 5.2,
      y: 1.7,
      w: 4.4,
      h: 1.55,
      fontSize: 15,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 5,
    },
  )
  slide.addText(
    'PT. BACT: pilih nama dari daftar HR — departemen dan ID terisi otomatis. Vendor, security, dan MSB mengisi nama manual. Label form Indonesia dan Inggris; antarmuka admin berbahasa Inggris.',
    {
      x: 0.4,
      y: 3.4,
      w: 9.2,
      h: 0.7,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addText(
    'HiPo: Stop Work dari pelapor, atau risiko High / Near Miss setelah klasifikasi HSE. Bukan setiap laporan wajib investigasi.',
    {
      x: 0.4,
      y: 4.2,
      w: 9.2,
      h: 0.7,
      fontSize: 15,
      color: C.ink,
      fontFace: FONT,
    },
  )
}

// 3 — Alur kerja
{
  const slide = contentSlide('Alur kerja')
  addFooter(slide, 3)
  const steps = ['Scan QR / buka laman', 'Isi form', 'Kirim (Open)', 'Dashboard HSE', 'Klasifikasi dan PIC', 'CAPA → Closed']
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: 1.14,
    w: 8.6,
    h: 0.018,
    fill: { color: C.line },
  })
  steps.forEach((label, i) => {
    const x = 0.38 + i * 1.55
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.52,
      y: 0.98,
      w: 0.34,
      h: 0.34,
      fill: { color: C.navy },
    })
    slide.addText(String(i + 1), {
      x: x + 0.52,
      y: 0.98,
      w: 0.34,
      h: 0.34,
      fontSize: 12,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'mid',
      fontFace: FONT,
    })
    slide.addText(label, {
      x,
      y: 1.4,
      w: 1.5,
      h: 0.52,
      fontSize: 12,
      color: C.ink,
      align: 'center',
      fontFace: FONT,
    })
  })

  heading(slide, { x: 0.4, y: 2.05, w: 4.4, text: 'Kasus biasa' })
  slide.addText(
    'Risiko Low–Medium: PDF Notice, tindakan dan CAPA, verifikasi HSE, kemudian Closed.',
    {
      x: 0.4,
      y: 2.44,
      w: 4.4,
      h: 0.78,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
  heading(slide, { x: 5.2, y: 2.05, w: 4.4, text: 'HiPo' })
  slide.addText(
    'Stop Work, High, atau Near Miss: HSE menandai lanjut investigasi, 5W+1H, PDF Investigasi, CAPA, kemudian Closed.',
    {
      x: 5.2,
      y: 2.44,
      w: 4.4,
      h: 0.78,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addText(
    'Status: Open → tinjauan / progres → Closed, atau Rejected. Klasifikasi dulu, baru PIC departemen ditugaskan. PIC adalah penugasan, bukan akun masuk. Jika sinyal terputus, laporan tersimpan di perangkat lalu terkirim saat jaringan kembali.',
    {
      x: 0.4,
      y: 3.4,
      w: 9.2,
      h: 1.45,
      fontSize: 14,
      color: C.ink,
      fontFace: FONT,
    },
  )
}

// 4 — Peran, analitik, keamanan
{
  const slide = contentSlide('Peran, analitik, dan keamanan')
  addFooter(slide, 4)
  heading(slide, { x: 0.4, y: 0.78, w: 4.4, text: 'Peran masuk' })
  addTable(
    slide,
    [
      [th('Peran'), th('Akses')],
      [
        td('Super Admin', C.white, { bold: true }),
        td('Dashboard, Analytics, Notifications, Users, Log HSE. Ubah laporan dan kelola akun.', C.white),
      ],
      [
        td('HSE Officer', C.zebra, { bold: true }),
        td('Klasifikasi, investigasi, PDF, email. Tidak mengelola pengguna.', C.zebra),
      ],
      [
        td('Viewer', C.white, { bold: true }),
        td('Dashboard dan Analytics. Hanya melihat — tidak mengubah data.', C.white),
      ],
    ],
    { x: 0.4, y: 1.06, w: 9.2, colW: [2.05, 7.15], fontSize: 13, rowH: 0.34 },
  )
  slide.addText(
    'PIC adalah penugasan departemen, bukan peran login. Analitik: grafik Weekly/Monthly, export–import Excel, PDF Notice/Investigasi, email Resend.',
    {
      x: 0.4,
      y: 2.46,
      w: 9.2,
      h: 0.3,
      fontSize: 13,
      color: C.ink,
      fontFace: FONT,
    },
  )
  heading(slide, { x: 0.4, y: 2.76, w: 9.2, text: 'Kontrol keamanan' })
  addTable(
    slide,
    [
      [th('Kontrol'), th('Penerapan')],
      [
        td('HTTPS / TLS', C.white, { bold: true }),
        td('Vercel + HSTS. SSL Hostinger jika usulan domain sudah live.', C.white),
      ],
      [
        td('Header keamanan', C.zebra, { bold: true }),
        td('CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.', C.zebra),
      ],
      [
        td('Admin', C.white, { bold: true }),
        td('Supabase Auth, kata sandi di-hash. Super Admin / HSE Officer / Viewer.', C.white),
      ],
      [
        td('Data dan foto', C.zebra, { bold: true }),
        td('RLS: publik hanya kirim. Ubah/klasifikasi HSE + Super Admin. Foto evidence-photos, JPG/PNG/WEBP/HEIC, maks. 10 MB.', C.zebra),
      ],
      [
        td('Kunci dan batas', C.white, { bold: true }),
        td('Anon key di klien; service role hanya Edge Function. 5 gagal / 2 menit di halaman login. Insert publik ~20/menit.', C.white),
      ],
    ],
    { x: 0.4, y: 3.06, w: 9.2, colW: [2.2, 7.0], fontSize: 13, rowH: 0.34 },
  )
}

// 5 — Langkah yang diminta
{
  const slide = contentSlide('Langkah yang diminta')
  addFooter(slide, 5)
  const steps = [
    'Daftarkan alamat email HSE di Notifications dan pastikan status Aktif.',
    'Kosongkan antrian Belum diklasifikasi. PIC ditugaskan setelah klasifikasi; tidak perlu login PIC.',
    'Super Admin menambah pengguna HSE atau Viewer melalui Users (email, kata sandi sementara, peran).',
    'Bagikan QR ke lapangan. Excel dipakai sebagai arsip atau hasil export, bukan tempat pelaporan.',
  ]
  steps.forEach((text, i) => {
    const y = 0.95 + i * 0.78
    slide.addText(String(i + 1), {
      x: 0.4,
      y,
      w: 0.42,
      h: 0.42,
      fontSize: 18,
      bold: true,
      color: C.navy,
      fontFace: FONT,
    })
    slide.addText(text, {
      x: 0.95,
      y,
      w: 8.55,
      h: 0.7,
      fontSize: 16,
      color: C.ink,
      fontFace: FONT,
      valign: 'top',
    })
  })
  slide.addText(`${APP_URL}     Admin: /admin/login`, {
    x: 0.4,
    y: 4.85,
    w: 9.2,
    h: 0.28,
    fontSize: 13,
    color: C.muted,
    fontFace: FONT,
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
    const fallback = path.join(root, 'supabase', 'BACT-SOC-Presentasi-HSE-generated.pptx')
    await pptx.writeFile({ fileName: fallback })
    console.warn('File utama sedang dibuka — disimpan ke:', fallback)
  } else {
    throw err
  }
}
console.log('Total slide:', pptx.slides.length)
