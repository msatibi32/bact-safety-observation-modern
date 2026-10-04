/**
 * Timeline HSSE — 3 slide, latar putih, aksen oranye.
 * Run: npm run generate:ppt:timeline
 * Output: supabase/BACT-SOC-Timeline-Revisi.pptx
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PptxGenJS from 'pptxgenjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPath = path.join(root, 'supabase', 'BACT-SOC-Timeline-Revisi.pptx')
const logoBlack =
  [
    path.join(root, 'public', 'logo', 'BACT Logo_OG Black Text.png'),
    path.join(root, 'public', 'logo', 'web-black.png'),
  ].find((p) => fs.existsSync(p)) || null
const excelShot = path.join(root, 'supabase', 'ppt-assets', 'laporan-excel.png')
const dashShot = path.join(root, 'supabase', 'ppt-assets', 'dashboard-web.png')

const C = {
  orange: 'F37021',
  ink: '1A1A1A',
  slate: '334155',
  muted: '64748B',
  line: 'E6E8EC',
  card: 'F7F8FA',
  white: 'FFFFFF',
}

const FONT = 'Calibri'
const pptx = new PptxGenJS()
pptx.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 })
pptx.layout = 'WIDE_16x9'
pptx.author = 'PT. BACT HSSE'
pptx.title = 'HSSE Digital — Timeline SOC, PTW, dan Visit'
pptx.company = 'PT. BACT — Batu Ampar Container Terminal'
pptx.subject = 'Diskusi September–Oktober 2026 · target launch awal 2027'

function addLogo(slide) {
  if (logoBlack) {
    slide.addImage({ path: logoBlack, x: 0.55, y: 0.32, w: 1.85, h: 0.62 })
  }
}

function addFooter(slide, num) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 7.12,
    w: 12.2,
    h: 0.01,
    fill: { color: C.line },
  })
  slide.addText('PT. BACT  ·  Batu Ampar Container Terminal  ·  HSSE  ·  Dokumen internal', {
    x: 0.55,
    y: 7.18,
    w: 10.2,
    h: 0.22,
    fontSize: 11,
    color: C.muted,
    fontFace: FONT,
  })
  slide.addText(String(num), {
    x: 11.5,
    y: 7.18,
    w: 1.25,
    h: 0.22,
    fontSize: 11,
    color: C.muted,
    align: 'right',
    fontFace: FONT,
  })
}

function kicker(slide, text) {
  slide.addText(text, {
    x: 7.4,
    y: 0.46,
    w: 5.35,
    h: 0.32,
    fontSize: 12,
    color: C.orange,
    align: 'right',
    bold: true,
    fontFace: FONT,
  })
}

// 1 — Program dan timeline
{
  const slide = pptx.addSlide()
  slide.background = { color: C.white }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: C.orange },
  })
  addLogo(slide)
  kicker(slide, 'PROGRAM DIGITAL HSSE')
  addFooter(slide, 1)

  slide.addText('Satu dashboard. Tiga modul.', {
    x: 0.55,
    y: 1.15,
    w: 12.2,
    h: 0.48,
    fontSize: 32,
    bold: true,
    color: C.ink,
    fontFace: FONT,
  })
  slide.addText('Safety Observation Card, Permit to Work, dan Port Visit — digabung, lalu dipisah di header.', {
    x: 0.55,
    y: 1.66,
    w: 11.5,
    h: 0.32,
    fontSize: 15,
    color: C.slate,
    fontFace: FONT,
  })

  const projects = [
    {
      t: 'SOC',
      s: 'Safety Observation Card',
      b: 'Form pelapor tanpa login. HSSE mengklasifikasi risiko, lalu departemen follow-up menutup laporan lewat tautan.',
    },
    {
      t: 'PTW',
      s: 'Permit to Work',
      b: 'Safety induction wajib. Job Permit berlaku 14 hari. E-Permit to Work berlaku 12 jam. Barcode setelah pengajuan.',
    },
    {
      t: 'VISIT',
      s: 'Port Visit',
      b: 'Form online ke Corporate Communication HSSE. KTP, paspor, tujuan, deklarasi ISPS, dan safety briefing wajib.',
    },
  ]
  projects.forEach((p, i) => {
    const x = 0.55 + i * 4.2
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.2,
      w: 3.95,
      h: 2.05,
      fill: { color: C.card },
      rectRadius: 0.08,
    })
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 2.2,
      w: 0.08,
      h: 2.05,
      fill: { color: C.orange },
    })
    slide.addText(p.t, {
      x: x + 0.28,
      y: 2.34,
      w: 3.45,
      h: 0.28,
      fontSize: 13,
      bold: true,
      color: C.orange,
      fontFace: FONT,
    })
    slide.addText(p.s, {
      x: x + 0.28,
      y: 2.62,
      w: 3.45,
      h: 0.32,
      fontSize: 16,
      bold: true,
      color: C.ink,
      fontFace: FONT,
    })
    slide.addText(p.b, {
      x: x + 0.28,
      y: 3.02,
      w: 3.45,
      h: 1.05,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    })
  })

  slide.addText('Timeline — mulai sampai launch', {
    x: 0.55,
    y: 4.5,
    w: 8,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: C.ink,
    fontFace: FONT,
  })

  const marks = [
    { d: '29 Agu 2026', t: 'Mulai SOC' },
    { d: '6 Sep 2026', t: 'Diskusi Nagoya' },
    { d: '3 Okt 2026', t: 'Diskusi KDA' },
    { d: 'Okt–Nov 2026', t: 'PTW dan Visit' },
    { d: 'Des 2026', t: 'Testing, H−1 bulan' },
    { d: 'Awal 2027', t: 'Launch' },
  ]
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: 5.28,
    w: 11.9,
    h: 0.015,
    fill: { color: 'F0D3C0' },
  })
  marks.forEach((m, i) => {
    const x = 0.55 + i * 2.1
    const last = i === marks.length - 1
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.78,
      y: 5.2,
      w: 0.18,
      h: 0.18,
      fill: { color: last ? C.orange : C.white },
      line: { color: C.orange, pt: 1.5 },
    })
    slide.addText(m.d, {
      x,
      y: 5.48,
      w: 2.0,
      h: 0.24,
      fontSize: 11,
      bold: true,
      align: 'center',
      color: C.orange,
      fontFace: FONT,
    })
    slide.addText(m.t, {
      x,
      y: 5.72,
      w: 2.0,
      h: 0.48,
      fontSize: 12,
      align: 'center',
      color: C.ink,
      fontFace: FONT,
    })
  })
  slide.addText('Testing dimulai satu bulan sebelum hari H. Target operasional: awal 2027.', {
    x: 0.55,
    y: 6.35,
    w: 12,
    h: 0.28,
    fontSize: 13,
    color: C.slate,
    fontFace: FONT,
  })
}

// 2 — Dua diskusi
{
  const slide = pptx.addSlide()
  slide.background = { color: C.white }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: C.orange },
  })
  addLogo(slide)
  kicker(slide, 'CATATAN DISKUSI')
  addFooter(slide, 2)

  slide.addText('Dua pertemuan di luar kantor', {
    x: 0.55,
    y: 1.12,
    w: 12,
    h: 0.42,
    fontSize: 30,
    bold: true,
    color: C.ink,
    fontFace: FONT,
  })

  const meetings = [
    {
      when: '6 September 2026',
      where: 'Spice Cafe, Nagoya, Batam',
      note: 'Sesi kerja membahas bentuk SOC yang bisa dipakai di lapangan.',
      talked: [
        'Form pelapor terlalu panjang untuk diisi di area kerja.',
        'Kategori, tingkat risiko, dan IOGP tidak diisi pelapor.',
        'Nama karyawan PT. BACT perlu terisi otomatis.',
        'Lokasi kejadian cukup daftar area, tanpa GPS.',
      ],
      changed: [
        'Form ringkas, tanpa login.',
        'Klasifikasi risiko dipindah ke dashboard HSSE.',
        'Lookup karyawan BACT dan lokasi dropdown.',
      ],
    },
    {
      when: '3 Oktober 2026, malam',
      where: 'CW Coffee KDA, Batam',
      note: 'Di luar jam kerja. Biaya pertemuan ditanggung sendiri.',
      talked: [
        'Follow-up SOC tanpa investigasi: departemen yang ditunjuk HSSE yang mengerjakan dan menutup.',
        'Permit to Work: induction wajib, Job Permit 14 hari, E-Permit 12 jam.',
        'Port Visit langsung ke Corporate Communication HSSE.',
        'SOC, PTW, dan Visit digabung dalam satu dashboard.',
      ],
      changed: [
        'Tautan follow-up tanpa login; HSSE tidak menutup manual.',
        'Form PTW dan Visit plus barcode masa berlaku.',
        'Header dashboard: SOC, PTW, Visit.',
      ],
    },
  ]

  meetings.forEach((m, i) => {
    const x = 0.55 + i * 6.4
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.7,
      w: 6.15,
      h: 5.15,
      fill: { color: C.card },
      rectRadius: 0.08,
    })
    slide.addText(m.when, {
      x: x + 0.28,
      y: 1.86,
      w: 5.6,
      h: 0.28,
      fontSize: 13,
      bold: true,
      color: C.orange,
      fontFace: FONT,
    })
    slide.addText(m.where, {
      x: x + 0.28,
      y: 2.14,
      w: 5.6,
      h: 0.3,
      fontSize: 16,
      bold: true,
      color: C.ink,
      fontFace: FONT,
    })
    slide.addText(m.note, {
      x: x + 0.28,
      y: 2.48,
      w: 5.6,
      h: 0.42,
      fontSize: 13,
      color: C.slate,
      fontFace: FONT,
    })
    slide.addText('Yang dibahas', {
      x: x + 0.28,
      y: 2.98,
      w: 5.6,
      h: 0.24,
      fontSize: 12,
      bold: true,
      color: C.ink,
      fontFace: FONT,
    })
    slide.addText(m.talked.map((t) => ({ text: t, options: { bullet: false, breakLine: true } })), {
      x: x + 0.28,
      y: 3.24,
      w: 5.6,
      h: 1.55,
      fontSize: 12,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 4,
    })
    slide.addText('Perubahannya', {
      x: x + 0.28,
      y: 4.85,
      w: 5.6,
      h: 0.24,
      fontSize: 12,
      bold: true,
      color: C.ink,
      fontFace: FONT,
    })
    slide.addText(m.changed.map((t) => ({ text: t, options: { bullet: false, breakLine: true } })), {
      x: x + 0.28,
      y: 5.12,
      w: 5.6,
      h: 1.45,
      fontSize: 12,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 4,
    })
  })
}

// 3 — Output
{
  const slide = pptx.addSlide()
  slide.background = { color: C.white }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: C.orange },
  })
  addLogo(slide)
  kicker(slide, 'OUTPUT')
  addFooter(slide, 3)

  slide.addText('Dari laporan manual ke dashboard web', {
    x: 0.55,
    y: 1.12,
    w: 12,
    h: 0.42,
    fontSize: 30,
    bold: true,
    color: C.ink,
    fontFace: FONT,
  })
  slide.addText('Sumber yang sama. Cara kerjanya yang berubah: Excel diedarkan manual, web langsung masuk antrian HSSE.', {
    x: 0.55,
    y: 1.58,
    w: 12,
    h: 0.3,
    fontSize: 14,
    color: C.slate,
    fontFace: FONT,
  })

  const panels = [
    { x: 0.55, title: 'Sebelum — Excel manual', file: excelShot, caption: 'SAFETY OBSERVATION CARD.xlsx' },
    { x: 6.9, title: 'Sesudah — dashboard web', file: dashShot, caption: 'bact-safety-observation-modern.vercel.app' },
  ]
  panels.forEach((p) => {
    slide.addText(p.title, {
      x: p.x,
      y: 2.05,
      w: 5.85,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: C.ink,
      fontFace: FONT,
    })
    if (fs.existsSync(p.file)) {
      slide.addImage({
        path: p.file,
        x: p.x,
        y: 2.42,
        w: 5.85,
        h: 3.35,
        sizing: { type: 'contain', x: p.x, y: 2.42, w: 5.85, h: 3.35 },
      })
    } else {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: p.x,
        y: 2.42,
        w: 5.85,
        h: 3.35,
        fill: { color: C.card },
        rectRadius: 0.06,
      })
      slide.addText('Cuplikan belum disisipkan', {
        x: p.x + 0.3,
        y: 3.8,
        w: 5.25,
        h: 0.3,
        fontSize: 14,
        align: 'center',
        color: C.muted,
        fontFace: FONT,
      })
    }
    slide.addText(p.caption, {
      x: p.x,
      y: 5.86,
      w: 5.85,
      h: 0.24,
      fontSize: 12,
      color: C.muted,
      fontFace: FONT,
    })
  })

  slide.addText('Target: testing Desember 2026 (satu bulan sebelum hari H), launch awal 2027.', {
    x: 0.55,
    y: 6.28,
    w: 12.2,
    h: 0.28,
    fontSize: 14,
    color: C.ink,
    fontFace: FONT,
  })
}

pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`Wrote ${outPath}`)
})
