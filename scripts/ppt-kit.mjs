import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PptxGenJS from 'pptxgenjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, '..')
export const OUT_DIR = path.join(ROOT, 'supabase')

export const APP_URL = 'bact-safety-observation-modern.vercel.app'
export const ADMIN_PATH = '/admin/login'

export const C = {
  navy: '0F2744',
  orange: 'F37021',
  ink: '1A1A1A',
  slate: '334155',
  muted: '5B6775',
  line: 'C5CDD6',
  zebra: 'F3F5F7',
  card: 'EEF1F4',
  white: 'FFFFFF',
  pale: 'F7F8FA',
  green: '1F7A4D',
  red: 'B42318',
}

export const FONT = 'Calibri'

export const logoWhite =
  [
    path.join(ROOT, 'public', 'logo', 'BACT Logo_OG White Text.png'),
    path.join(ROOT, 'public', 'logo', 'bact-logo-white.png'),
  ].find((p) => fs.existsSync(p)) || null

export function createDeck({ title, subject }) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.defineLayout({ name: 'SOC_16x9', width: 10, height: 5.625 })
  pptx.layout = 'SOC_16x9'
  pptx.author = 'PT. BACT HSSE'
  pptx.title = title
  pptx.company = 'PT. BACT — Batu Ampar Container Terminal'
  pptx.subject = subject || 'Dokumen internal — September 2026'
  return pptx
}

export function addLogo(slide, box) {
  if (logoWhite) slide.addImage({ path: logoWhite, ...box })
}

export function addFooter(pptx, slide, num, total) {
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
    w: 7.2,
    h: 0.18,
    fontSize: 9,
    color: C.muted,
    fontFace: FONT,
  })
  slide.addText(total ? `${num} / ${total}` : String(num), {
    x: 8.5,
    y: 5.4,
    w: 1.12,
    h: 0.18,
    fontSize: 9,
    color: C.muted,
    align: 'right',
    fontFace: FONT,
  })
}

export function coverSlide(pptx, { kicker, title, subtitle, audience }) {
  const slide = pptx.addSlide()
  slide.background = { color: C.navy }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.028,
    fill: { color: C.orange },
  })
  addLogo(slide, { x: 0.55, y: 0.42, w: 2.15, h: 0.75 })
  slide.addText(kicker || 'PT. BACT — Batu Ampar Container Terminal', {
    x: 0.55,
    y: 1.35,
    w: 8.9,
    h: 0.28,
    fontSize: 13,
    color: 'B8C4D4',
    fontFace: FONT,
  })
  slide.addText(title, {
    x: 0.55,
    y: 1.85,
    w: 8.9,
    h: 1.15,
    fontSize: 30,
    bold: true,
    color: C.white,
    fontFace: FONT,
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 3.12,
    w: 1.35,
    h: 0.03,
    fill: { color: C.orange },
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55,
      y: 3.28,
      w: 8.9,
      h: 0.4,
      fontSize: 16,
      color: C.white,
      fontFace: FONT,
    })
  }
  if (audience) {
    slide.addText(audience, {
      x: 0.55,
      y: 3.78,
      w: 8.9,
      h: 0.32,
      fontSize: 14,
      color: 'D6DEE8',
      fontFace: FONT,
    })
  }
  slide.addText('September 2026  ·  Dokumen internal  ·  Aplikasi live', {
    x: 0.55,
    y: 5.05,
    w: 8.9,
    h: 0.24,
    fontSize: 12,
    color: '8A97A8',
    fontFace: FONT,
  })
  return slide
}

export function contentSlide(pptx, title) {
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

export function heading(slide, { x, y, w, text }) {
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
  slide.addShape('rect', {
    x,
    y: y + 0.26,
    w: 0.9,
    h: 0.028,
    fill: { color: C.orange },
  })
}

export function body(slide, { x, y, w, h, text, size = 14, color = C.ink }) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontSize: size,
    color,
    fontFace: FONT,
    valign: 'top',
  })
}

export function bullets(slide, { x, y, w, h, items, size = 14 }) {
  slide.addText(
    items.map((text, i) => ({
      text,
      options: { bullet: true, breakLine: i < items.length - 1 },
    })),
    {
      x,
      y,
      w,
      h,
      fontSize: size,
      color: C.slate,
      fontFace: FONT,
      paraSpaceAfter: 6,
    },
  )
}

export function addTable(pptx, slide, rows, opts) {
  slide.addTable(rows, {
    border: [
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
      { pt: 0.6, color: C.line },
    ],
    fontFace: FONT,
    fontSize: 13,
    color: C.ink,
    valign: 'middle',
    align: 'left',
    ...opts,
  })
}

export const th = (text, extra = {}) => ({
  text,
  options: { fill: { color: C.navy }, color: C.white, bold: true, ...extra },
})
export const td = (text, fill, extra = {}) => ({
  text,
  options: { fill: { color: fill }, color: C.ink, ...extra },
})

export function numberedList(slide, items, { x = 0.4, y = 0.92, w = 9.2, step = 0.72, size = 15 } = {}) {
  items.forEach((text, i) => {
    const yy = y + i * step
    slide.addText(String(i + 1), {
      x,
      y: yy,
      w: 0.38,
      h: 0.42,
      fontSize: 16,
      bold: true,
      color: C.navy,
      fontFace: FONT,
    })
    slide.addText(text, {
      x: x + 0.48,
      y: yy,
      w: w - 0.48,
      h: step - 0.08,
      fontSize: size,
      color: C.ink,
      fontFace: FONT,
      valign: 'top',
    })
  })
}

export function flowNode(pptx, slide, { x, y, w, h, n, title, sub, fill = C.navy }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.08,
  })
  if (n != null) {
    slide.addText(String(n), {
      x,
      y: y + 0.08,
      w,
      h: 0.22,
      fontSize: 10,
      bold: true,
      color: C.orange,
      align: 'center',
      fontFace: FONT,
    })
  }
  slide.addText(title, {
    x: x + 0.08,
    y: y + (n != null ? 0.28 : 0.14),
    w: w - 0.16,
    h: 0.42,
    fontSize: 12,
    bold: true,
    color: C.white,
    align: 'center',
    fontFace: FONT,
  })
  if (sub) {
    slide.addText(sub, {
      x: x + 0.08,
      y: y + h - 0.42,
      w: w - 0.16,
      h: 0.34,
      fontSize: 10,
      color: 'D6DEE8',
      align: 'center',
      fontFace: FONT,
    })
  }
}

export function arrowH(pptx, slide, { x, y }) {
  slide.addShape(pptx.ShapeType.rightArrow, {
    x,
    y,
    w: 0.28,
    h: 0.14,
    fill: { color: C.orange },
  })
}

export function arrowV(pptx, slide, { x, y }) {
  slide.addShape(pptx.ShapeType.downArrow, {
    x,
    y,
    w: 0.16,
    h: 0.26,
    fill: { color: C.orange },
  })
}

export function diamond(pptx, slide, { x, y, w, h, text }) {
  slide.addShape(pptx.ShapeType.diamond, {
    x,
    y,
    w,
    h,
    fill: { color: C.white },
    line: { color: C.navy, pt: 1.5 },
  })
  slide.addText(text, {
    x: x + 0.12,
    y: y + 0.18,
    w: w - 0.24,
    h: h - 0.36,
    fontSize: 11,
    bold: true,
    color: C.navy,
    align: 'center',
    valign: 'mid',
    fontFace: FONT,
  })
}

export async function writeDeck(pptx, fileName) {
  const outPath = path.join(OUT_DIR, fileName)
  try {
    await pptx.writeFile({ fileName: outPath })
    console.log('Presentasi dibuat:', outPath, `(${pptx.slides.length} slide)`)
    const leftover = outPath.replace(/\.pptx$/i, '-generated.pptx')
    if (fs.existsSync(leftover)) {
      fs.unlinkSync(leftover)
      console.log('Dihapus salinan sisa:', leftover)
    }
    return outPath
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      const fallback = outPath.replace(/\.pptx$/i, '-generated.pptx')
      await pptx.writeFile({ fileName: fallback })
      console.warn('File utama sedang dibuka — disimpan ke:', fallback)
      return fallback
    }
    throw err
  }
}
