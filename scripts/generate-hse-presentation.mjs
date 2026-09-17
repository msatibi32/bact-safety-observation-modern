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
  card: 'EEF1F4',
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
  slide.addText('Briefing alur kerja, peran, dan analitik HSSE', {
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
  slide.addText('September 2026  ·  Dokumen internal  ·  Aplikasi live', {
    x: 0.55,
    y: 4.95,
    w: 8.8,
    h: 0.26,
    fontSize: 12,
    color: '8A97A8',
    fontFace: FONT,
  })
}

// 2 — Form pelapor
{
  const slide = contentSlide('Form pelapor')
  addFooter(slide, 2)
  slide.addText(
    'Tanpa login. Pelapor kirim kejadian dari HP atau QR; HSE yang mengklasifikasi. Laporan baru tampil Belum diklasifikasi.',
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
  heading(slide, { x: 0.4, y: 1.28, w: 4.4, text: 'Diisi di lapangan' })
  slide.addText(
    [
      { text: 'Perusahaan, nama, departemen', options: { bullet: true, breakLine: true } },
      { text: 'Tanggal kejadian', options: { bullet: true, breakLine: true } },
      { text: 'Lokasi dari daftar (Other jika perlu)', options: { bullet: true, breakLine: true } },
      { text: 'Deskripsi, Stop Work, foto', options: { bullet: true } },
    ],
    {
      x: 0.4,
      y: 1.66,
      w: 4.4,
      h: 1.5,
      fontSize: 15,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 5,
    },
  )
  heading(slide, { x: 5.2, y: 1.28, w: 4.4, text: 'Tidak ada di form' })
  slide.addText(
    [
      { text: 'Laporan anonim', options: { bullet: true, breakLine: true } },
      { text: 'Kategori dan tingkat / potensi risiko', options: { bullet: true, breakLine: true } },
      { text: 'IOGP', options: { bullet: true, breakLine: true } },
      { text: 'Tindakan langsung dan rekomendasi', options: { bullet: true } },
    ],
    {
      x: 5.2,
      y: 1.66,
      w: 4.4,
      h: 1.5,
      fontSize: 15,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 5,
    },
  )
  slide.addText(
    'PT. BACT: pilih nama dari daftar HR — departemen dan ID terisi otomatis. Vendor, security, dan MSB mengisi nama manual. Label form Indonesia + Inggris; antarmuka admin berbahasa Inggris.',
    {
      x: 0.4,
      y: 3.32,
      w: 9.2,
      h: 0.68,
      fontSize: 14,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addText(
    'HiPo: Stop Work dari pelapor, atau risiko High / Near Miss setelah klasifikasi HSE. Bukan setiap laporan wajib investigasi.',
    {
      x: 0.4,
      y: 4.08,
      w: 9.2,
      h: 0.62,
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

  heading(slide, { x: 0.4, y: 2.0, w: 4.4, text: 'Kasus biasa' })
  slide.addText(
    'Risiko Low–Medium: tinjau PDF SOC di layar lalu unduh, tindakan dan CAPA, verifikasi HSE, kemudian Closed.',
    {
      x: 0.4,
      y: 2.36,
      w: 4.4,
      h: 0.72,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
  heading(slide, { x: 5.2, y: 2.0, w: 4.4, text: 'HiPo' })
  slide.addText(
    'Stop Work, High, atau Near Miss: HSE menandai investigasi, 5W+1H, tinjau PDF Investigation, CAPA, kemudian Closed.',
    {
      x: 5.2,
      y: 2.36,
      w: 4.4,
      h: 0.72,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    },
  )
  slide.addText(
    'HSE Officer mengerjakan laporan satu per satu: Detail → Investigation → Recommendation. Status Open → tinjauan / progres → Closed, atau Rejected. Klasifikasi dulu, baru PIC departemen ditugaskan — PIC adalah penugasan, bukan akun masuk. PDF memakai logo huruf hitam. Jika sinyal terputus, laporan tersimpan di perangkat lalu terkirim saat jaringan kembali.',
    {
      x: 0.4,
      y: 3.18,
      w: 9.2,
      h: 1.72,
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
  heading(slide, { x: 0.38, y: 0.76, w: 4.5, text: 'Peran masuk' })
  addTable(
    slide,
    [
      [th('Peran'), th('Akses')],
      [
        td('Super Admin', C.white, { bold: true }),
        td(
          'Penuh: Users, Notifications, HSSE Log, performa HSE, import historis. Ubah laporan dan kelola akun.',
          C.white,
        ),
      ],
      [
        td('HSE Officer', C.zebra, { bold: true }),
        td(
          'Selesaikan laporan satu per satu sampai Investigation. Analytics Weekly/Monthly + export Excel. Tidak ada Notifications, Users, HSSE Log.',
          C.zebra,
        ),
      ],
      [
        td('Viewer', C.white, { bold: true }),
        td('Dashboard dan Analytics. Hanya melihat — tidak mengubah data.', C.white),
      ],
    ],
    { x: 0.38, y: 1.04, w: 4.55, colW: [1.42, 3.13], fontSize: 11, rowH: 0.46 },
  )
  slide.addText('PIC = penugasan tindak lanjut, bukan peran login.', {
    x: 0.38,
    y: 2.96,
    w: 4.55,
    h: 0.28,
    fontSize: 12,
    color: C.ink,
    fontFace: FONT,
  })

  heading(slide, { x: 5.1, y: 0.76, w: 4.5, text: 'Analitik dan PDF' })
  slide.addText(
    [
      { text: 'Period volume: Weekly / Monthly.', options: { bullet: true, breakLine: true } },
      {
        text: 'Monthly: January → bulan berjalan; default bulan ini.',
        options: { bullet: true, breakLine: true },
      },
      { text: 'Export Excel: rentang tanggal From–To.', options: { bullet: true, breakLine: true } },
      {
        text: 'Top 10 Case: kartu ranked (bukan tabel Excel) di atas HSE performance (KPI Super Admin).',
        options: { bullet: true, breakLine: true },
      },
      { text: 'Import historis di bawah Analytics (Super Admin).', options: { bullet: true, breakLine: true } },
      {
        text: 'PDF SOC dan PDF Investigation (logo huruf hitam). Tinjau naskah di layar sebelum unduh; suntingan hanya untuk cetakan itu.',
        options: { bullet: true },
      },
    ],
    {
      x: 5.1,
      y: 1.08,
      w: 4.5,
      h: 2.16,
      fontSize: 12,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 3,
    },
  )

  slide.addText(
    'Top 10 di web: kartu bernomor, temuan sebagai judul, chip tanggal/lokasi/perusahaan, lencana risiko. Action By dan Due Date hanya tampil jika PIC atau CAPA sudah diisi.',
    {
      x: 0.38,
      y: 3.28,
      w: 9.24,
      h: 0.48,
      fontSize: 12,
      color: C.ink,
      fontFace: FONT,
    },
  )

  heading(slide, { x: 0.38, y: 3.78, w: 9.2, text: 'Kontrol keamanan' })
  addTable(
    slide,
    [
      [th('Kontrol'), th('Penerapan')],
      [
        td('HTTPS / header', C.white, { bold: true }),
        td(
          'Vercel + HSTS. CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
          C.white,
        ),
      ],
      [
        td('Admin dan data', C.zebra, { bold: true }),
        td(
          'Supabase Auth, 3 peran, RLS. Publik hanya kirim. Foto JPG/PNG/WEBP/HEIC, maks. 10 MB. Anon key di klien; service role hanya Edge Function.',
          C.zebra,
        ),
      ],
      [
        td('Batas', C.white, { bold: true }),
        td('5 gagal / 10 menit di login. Password akun min. 12. RLS: publik kirim; hapus Super Admin. Insert ~8/menit. Bukan klaim ISO atau SOC 2.', C.white),
      ],
    ],
    { x: 0.38, y: 4.06, w: 9.24, colW: [1.7, 7.54], fontSize: 11, rowH: 0.32 },
  )
}

// 5 — Langkah yang diminta
{
  const slide = contentSlide('Langkah yang diminta')
  addFooter(slide, 5)
  const steps = [
    'Super Admin: daftarkan alamat email HSE di Notifications dan pastikan status Aktif.',
    'Kosongkan antrian Belum diklasifikasi — satu laporan sampai Investigation selesai. PIC ditugaskan setelah klasifikasi; tidak perlu login PIC.',
    'Super Admin menambah pengguna HSE atau Viewer melalui Users (email, kata sandi sementara, peran).',
    'Bagikan QR ke lapangan. Excel dipakai sebagai arsip, hasil export, atau import historis — bukan tempat pelaporan.',
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
      fontSize: 15,
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
