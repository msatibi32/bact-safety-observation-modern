/**
 * Alur web SOC — diagram saja.
 * Run: npm run generate:ppt:flow
 */
import {
  APP_URL,
  C,
  FONT,
  addFooter,
  arrowH,
  arrowV,
  body,
  contentSlide,
  coverSlide,
  createDeck,
  diamond,
  flowNode,
  writeDeck,
} from './ppt-kit.mjs'

const pptx = createDeck({
  title: 'BACT SOC — Alur Web',
  subject: 'Diagram alur aplikasi Safety Observation Card',
})

coverSlide(pptx, {
  title: 'Alur web\nSafety Observation Card',
  subtitle: 'Dari lapangan sampai laporan Closed',
  audience: 'Untuk HSSE, Super Admin, dan pelatih lapangan',
})

{
  const slide = contentSlide(pptx, 'Tiga pihak')
  addFooter(pptx, slide, 2)
  const parties = [
    { title: 'Pelapor', sub: 'Tanpa login\nHP / QR', fill: C.navy },
    { title: 'Sistem', sub: 'Simpan, email,\nantrian', fill: C.slate },
    { title: 'HSE / Super Admin', sub: 'Klasifikasi\nsampai Closed', fill: C.orange },
  ]
  parties.forEach((p, i) => {
    const x = 0.55 + i * 3.1
    flowNode(pptx, slide, { x, y: 1.35, w: 2.8, h: 1.7, title: p.title, sub: p.sub, fill: p.fill })
    if (i < 2) arrowH(pptx, slide, { x: x + 2.84, y: 2.12 })
  })
  body(slide, {
    x: 0.55,
    y: 3.4,
    w: 8.9,
    h: 1.5,
    text: 'Pelapor hanya mengirim kejadian. Sistem menyimpan dan mengirim email. HSE mengklasifikasi, menugaskan PIC, dan menutup. Super Admin mengatur akun dan daftar email — bukan mengganti HSE di lapangan.',
    size: 15,
  })
}

{
  const slide = contentSlide(pptx, 'Alur utama')
  addFooter(pptx, slide, 3)
  const steps = [
    { n: 1, title: 'Buka laman\natau scan QR', sub: 'Tanpa akun' },
    { n: 2, title: 'Isi form', sub: 'Nama, lokasi,\ndeskripsi, foto' },
    { n: 3, title: 'Kirim', sub: 'Open /\nUnder Review' },
    { n: 4, title: 'Email HSE', sub: 'Laporan Baru\natau HiPo' },
    { n: 5, title: 'HSE kerja', sub: 'Klasifikasi\n→ CAPA' },
    { n: 6, title: 'Closed', sub: 'Atau Rejected' },
  ]
  steps.forEach((s, i) => {
    const x = 0.22 + i * 1.62
    flowNode(pptx, slide, { x, y: 1.05, w: 1.42, h: 1.55, n: s.n, title: s.title, sub: s.sub })
    if (i < 5) arrowH(pptx, slide, { x: x + 1.44, y: 1.72 })
  })
  body(slide, {
    x: 0.4,
    y: 2.9,
    w: 9.2,
    h: 2.0,
    text: 'Laporan tidak “selesai” saat dikirim. Status awal Open (atau Under Review jika Stop Work). HSE yang mengubah kategori, risiko, PIC, investigasi, dan CAPA. Excel hanya arsip atau import lama — bukan tempat lapor.',
    size: 15,
  })
}

{
  const slide = contentSlide(pptx, 'Cabang: biasa atau HiPo')
  addFooter(pptx, slide, 4)
  flowNode(pptx, slide, { x: 3.55, y: 0.9, w: 2.9, h: 0.85, title: 'Laporan masuk', sub: 'Sudah tersimpan' })
  arrowV(pptx, slide, { x: 4.9, y: 1.78 })
  diamond(pptx, slide, { x: 3.55, y: 2.08, w: 2.9, h: 1.15, text: 'Stop Work?' })

  arrowH(pptx, slide, { x: 2.95, y: 2.55 })
  flowNode(pptx, slide, {
    x: 0.35,
    y: 2.15,
    w: 2.5,
    h: 1.15,
    title: 'Tidak',
    sub: 'Status Open\nEmail Laporan Baru',
    fill: C.green,
  })

  arrowH(pptx, slide, { x: 6.5, y: 2.55 })
  flowNode(pptx, slide, {
    x: 6.9,
    y: 2.15,
    w: 2.7,
    h: 1.15,
    title: 'Ya — HiPo',
    sub: 'Under Review\nEmail HiPo',
    fill: C.red,
  })

  body(slide, {
    x: 0.4,
    y: 3.55,
    w: 9.2,
    h: 1.4,
    text: 'HiPo juga bisa muncul kemudian: HSE mengisi risiko High atau kategori Near Miss. Investigasi 5W+1H tidak wajib untuk setiap laporan — HSE yang menandai. HiPo yang lewat 24 jam muncul sebagai eskalasi di dashboard.',
    size: 14,
  })
}

{
  const slide = contentSlide(pptx, 'Alur di dashboard HSE')
  addFooter(pptx, slide, 5)
  const steps = [
    { n: 1, title: 'Login', sub: '/admin/login' },
    { n: 2, title: 'Pilih laporan', sub: 'Filter antrian' },
    { n: 3, title: 'Klasifikasi', sub: 'Kategori + risiko' },
    { n: 4, title: 'PIC', sub: 'Departemen' },
    { n: 5, title: 'Tindak lanjut', sub: 'Investigasi / CAPA' },
    { n: 6, title: 'Tutup', sub: 'Closed' },
  ]
  steps.forEach((s, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 0.45 + col * 3.15
    const y = 0.95 + row * 1.85
    flowNode(pptx, slide, { x, y, w: 2.85, h: 1.35, n: s.n, title: s.title, sub: s.sub })
    if (col < 2) arrowH(pptx, slide, { x: x + 2.9, y: y + 0.6 })
  })
  arrowV(pptx, slide, { x: 7.7, y: 2.35 })
}

{
  const slide = contentSlide(pptx, 'Alur email')
  addFooter(pptx, slide, 6)
  const nodes = [
    { n: 1, title: 'Form terkirim', sub: 'Bukan import Excel' },
    { n: 2, title: 'Antrian', sub: 'notification_queue' },
    { n: 3, title: 'Kirim', sub: 'Resend, cadangan Brevo' },
    { n: 4, title: 'Inbox HSE', sub: 'Daftar Notifications' },
  ]
  nodes.forEach((s, i) => {
    const x = 0.35 + i * 2.4
    flowNode(pptx, slide, { x, y: 1.15, w: 2.15, h: 1.45, n: s.n, title: s.title, sub: s.sub })
    if (i < 3) arrowH(pptx, slide, { x: x + 2.18, y: 1.8 })
  })
  body(slide, {
    x: 0.4,
    y: 2.9,
    w: 9.2,
    h: 2.0,
    text: 'Import Excel historis tidak mengirim email. Daftar penerima hanya Super Admin (menu Notifications). HSE Officer tidak mengatur email. Domain pengirim Resend masih perlu diverifikasi agar tidak bergantung cadangan Brevo.',
    size: 15,
  })
}

{
  const slide = contentSlide(pptx, 'Siapa mengerjakan apa')
  addFooter(pptx, slide, 7)
  const lanes = [
    { t: 'Pelapor', d: 'Isi form. Tidak login. Tidak melihat dashboard.' },
    { t: 'HSE Officer', d: 'Dashboard + Analytics. Selesaikan laporan. Tidak ada Users, Notifications, HSSE Log.' },
    { t: 'Viewer', d: 'Lihat dashboard dan Analytics. Tidak mengubah data.' },
    { t: 'Super Admin', d: 'Semua milik HSE, plus Users, Notifications, HSSE Log, KPI, import Excel.' },
  ]
  lanes.forEach((lane, i) => {
    const y = 0.92 + i * 0.95
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.4,
      y,
      w: 2.3,
      h: 0.82,
      fill: { color: i === 3 ? C.orange : C.navy },
      rectRadius: 0.08,
    })
    slide.addText(lane.t, {
      x: 0.5,
      y,
      w: 2.1,
      h: 0.82,
      fontSize: 13,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'mid',
      fontFace: FONT,
    })
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 2.85,
      y,
      w: 6.75,
      h: 0.82,
      fill: { color: C.pale },
      rectRadius: 0.08,
    })
    slide.addText(lane.d, {
      x: 3.05,
      y,
      w: 6.4,
      h: 0.82,
      fontSize: 14,
      color: C.ink,
      valign: 'mid',
      fontFace: FONT,
    })
  })
}

{
  const slide = contentSlide(pptx, 'Alamat live')
  addFooter(pptx, slide, 8)
  flowNode(pptx, slide, {
    x: 0.5,
    y: 1.3,
    w: 4.3,
    h: 1.6,
    title: 'Form pelapor',
    sub: APP_URL,
    fill: C.navy,
  })
  flowNode(pptx, slide, {
    x: 5.2,
    y: 1.3,
    w: 4.3,
    h: 1.6,
    title: 'Admin / HSE',
    sub: `${APP_URL}/admin/login`,
    fill: C.orange,
  })
  body(slide, {
    x: 0.5,
    y: 3.2,
    w: 9.0,
    h: 1.7,
    text: 'Domain kantor (Hostinger) masih pengajuan. Data laporan tetap di Supabase, bukan di Hostinger. PIC adalah nama departemen yang ditugaskan pada laporan — bukan akun login.',
    size: 15,
  })
}

await writeDeck(pptx, 'BACT-SOC-Alur-Web.pptx')
