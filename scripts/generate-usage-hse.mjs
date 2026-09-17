/**
 * Panduan HSE Officer — cara pakai dashboard.
 * Run: npm run generate:ppt:hse-guide
 */
import {
  APP_URL,
  C,
  addFooter,
  addTable,
  body,
  bullets,
  contentSlide,
  coverSlide,
  createDeck,
  heading,
  numberedList,
  td,
  th,
  writeDeck,
} from './ppt-kit.mjs'

const pptx = createDeck({
  title: 'BACT SOC — Panduan HSE Officer',
  subject: 'Cara HSE mengerjakan laporan sampai Closed',
})

coverSlide(pptx, {
  title: 'Panduan HSE Officer',
  subtitle: 'Dari antrian laporan sampai Closed, plus Analytics',
  audience: 'Untuk petugas HSE yang login ke Command Center',
})

{
  const slide = contentSlide(pptx, 'Masuk dan menu kamu')
  addFooter(pptx, slide, 2)
  numberedList(slide, [
    `Buka ${APP_URL}/admin/login. Email dan kata sandi dari Super Admin. Bukan akun pelapor.`,
    'Menu kamu: Dashboard dan Analytics. Tidak ada Notifications, Users, atau HSSE Log.',
    'Bahasa admin Inggris. Tema gelap/terang di pojok kanan atas.',
    'Lima gagal login mengunci 10 menit. Jangan bagikan kata sandi.',
  ])
}

{
  const slide = contentSlide(pptx, 'Dashboard — apa yang terlihat')
  addFooter(pptx, slide, 3)
  bullets(slide, {
    x: 0.4,
    y: 0.9,
    w: 9.2,
    h: 4.0,
    items: [
      'Live Traffic: Total, Active, HiPo, Closed.',
      'Grafik volume 14 hari.',
      'Daftar laporan. Filter status, HiPo, dan Belum diklasifikasi.',
      'Kartu laporan: nama, lokasi, risiko, status. HiPo ada lencana merah.',
      'Klik satu kartu untuk membuka detail di panel kanan (HP: layar penuh).',
      'Eskalasi merah: HiPo lewat 24 jam — kerjakan dulu.',
    ],
    size: 15,
  })
}

{
  const slide = contentSlide(pptx, 'Urutan kerja satu laporan')
  addFooter(pptx, slide, 4)
  numberedList(slide, [
    'Buka laporan. Baca deskripsi, foto, Stop Work, perusahaan, dan waktu kejadian.',
    'Isi kategori: Unsafe Act, Unsafe Condition, Near Miss, atau Positive Observation.',
    'Isi tingkat risiko: Low, Medium, atau High. Ini yang mengubah “Belum diklasifikasi”.',
    'Tugaskan PIC = departemen tindak lanjut (bukan akun orang). PIC tidak login.',
    'Ubah status sesuai progres (lihat slide berikutnya). Simpan setiap tahap.',
  ])
}

{
  const slide = contentSlide(pptx, 'Arti status')
  addFooter(pptx, slide, 5)
  addTable(pptx, slide, [
    [th('Status'), th('Dipakai kapan')],
    [td('Open', C.white, { bold: true }), td('Baru masuk, belum dikerjakan.', C.white)],
    [td('Under Review', C.zebra, { bold: true }), td('Stop Work / HiPo, atau sedang ditinjau.', C.zebra)],
    [td('In Progress', C.white, { bold: true }), td('Sudah ada tindakan / CAPA berjalan.', C.white)],
    [td('Pending Verification', C.zebra, { bold: true }), td('Menunggu HSE verifikasi sebelum tutup.', C.zebra)],
    [td('Closed', C.white, { bold: true }), td('Selesai. Tidak menghapus data.', C.white)],
    [td('Rejected', C.zebra, { bold: true }), td('Tidak diproses (duplikat, bukan SOC, dll.).', C.zebra)],
  ], { x: 0.4, y: 0.92, w: 9.2, colW: [2.4, 6.8], fontSize: 14, rowH: 0.52 })
}

{
  const slide = contentSlide(pptx, 'HiPo dan investigasi')
  addFooter(pptx, slide, 6)
  body(slide, {
    x: 0.4,
    y: 0.88,
    w: 9.2,
    h: 0.7,
    text: 'HiPo jika pelapor mencentang Stop Work, atau kamu mengisi High / Near Miss. Bukan setiap laporan wajib investigasi — centang investigasi jika kasusnya perlu.',
    size: 14,
  })
  heading(slide, { x: 0.4, y: 1.65, w: 9.2, text: 'Tab Investigation' })
  bullets(slide, {
    x: 0.4,
    y: 2.0,
    w: 9.2,
    h: 2.8,
    items: [
      '5W+1H: What, Where, When, Why, How.',
      '5 Whys sampai akar masalah.',
      'Root cause dan corrective action.',
      'Nama investigator.',
      'Simpan. Ini jadi bahan PDF Investigation.',
    ],
    size: 15,
  })
}

{
  const slide = contentSlide(pptx, 'CAPA')
  addFooter(pptx, slide, 7)
  numberedList(slide, [
    'Tab Recommendation / CAPA: buat tindakan dengan judul, penanggung jawab (Action By), dan due date.',
    'Status CAPA: Open → In Progress → Completed → Verified.',
    'Kolom Action By dan Due Date di Analytics Top 10 terisi dari PIC atau CAPA ini. Kalau kosong, HSE belum mengisi.',
    'Jangan tutup laporan Closed jika CAPA penting masih Open tanpa alasan.',
  ])
}

{
  const slide = contentSlide(pptx, 'PDF SOC dan PDF Investigation')
  addFooter(pptx, slide, 8)
  numberedList(slide, [
    'Tombol PDF ada di header detail laporan. Jangan langsung unduh buta.',
    'Layar tinjau terbuka. Sunting naskah (temuan, PIC, perihal, checklist) untuk cetakan itu saja.',
    'Kalau sudah benar, unduh PDF. Logo di PDF huruf hitam (bukan logo web putih).',
    'PDF SOC = notice observasi. PDF Investigation = hasil investigasi. Keduanya bisa dipakai rapat atau arsip.',
  ])
}

{
  const slide = contentSlide(pptx, 'Analytics')
  addFooter(pptx, slide, 9)
  bullets(slide, {
    x: 0.4,
    y: 0.9,
    w: 9.2,
    h: 3.8,
    items: [
      'Menu Analytics / ringkasan.',
      'Period volume: Weekly = 7 hari terakhir. Monthly = pilih Januari sampai bulan berjalan.',
      'Export Excel: isi From dan To, lalu unduh. Ini arsip, bukan tempat lapor baru.',
      'Top 10 Case: 10 observasi terbaru dalam kartu (tanggal, lokasi, temuan, risiko). Bukan tabel Excel.',
      'HSE Officer tidak melihat blok HSE performance (KPI) — itu Super Admin.',
      'Import Excel historis juga Super Admin. Jangan unggah file uji di akun HSE.',
    ],
    size: 14,
  })
}

{
  const slide = contentSlide(pptx, 'Yang tidak bisa kamu ubah')
  addFooter(pptx, slide, 10)
  addTable(pptx, slide, [
    [th('Menu / data'), th('Siapa yang boleh')],
    [td('Users — tambah/nonaktif akun', C.white), td('Super Admin', C.white)],
    [td('Notifications — daftar email', C.zebra), td('Super Admin', C.zebra)],
    [td('HSSE Log / activity', C.white), td('Super Admin', C.white)],
    [td('Hapus laporan', C.zebra), td('Super Admin (bukan pekerjaan harian)', C.zebra)],
    [td('KPI / HSE performance', C.white), td('Super Admin', C.white)],
  ], { x: 0.4, y: 0.95, w: 9.2, colW: [4.5, 4.7], fontSize: 14, rowH: 0.55 })
}

{
  const slide = contentSlide(pptx, 'Checklist harian')
  addFooter(pptx, slide, 11)
  numberedList(slide, [
    'Filter Belum diklasifikasi. Kosongkan antrian itu dulu.',
    'Kerjakan HiPo dan eskalasi 24 jam sebelum kasus Low.',
    'Isi PIC departemen setelah klasifikasi.',
    'Tinjau PDF sebelum unduh jika akan diedarkan.',
    'Jangan menutup semua kasus “supaya angka bagus” tanpa CAPA yang relevan.',
  ])
}

await writeDeck(pptx, 'BACT-SOC-Panduan-HSE.pptx')
