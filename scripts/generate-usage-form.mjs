/**
 * Panduan pelapor — cara isi form SOC.
 * Run: npm run generate:ppt:form
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
  title: 'BACT SOC — Panduan isi form',
  subject: 'Cara pelapor mengirim Safety Observation Card',
})

coverSlide(pptx, {
  title: 'Cara isi form\nSafety Observation Card',
  subtitle: 'Untuk orang di lapangan — tanpa akun, tanpa pelatihan IT',
  audience: 'Karyawan BACT, vendor, security, MSB, visitor',
})

{
  const slide = contentSlide(pptx, 'Apa yang kamu kirim')
  addFooter(pptx, slide, 2)
  body(slide, {
    x: 0.4,
    y: 0.88,
    w: 9.2,
    h: 0.55,
    text: 'Ini bukan laporan kecelakaan resmi. Ini observasi: tindakan atau kondisi yang kamu lihat di terminal, supaya HSE bisa menindaklanjuti.',
    size: 15,
  })
  heading(slide, { x: 0.4, y: 1.5, w: 4.4, text: 'Kamu isi' })
  bullets(slide, {
    x: 0.4,
    y: 1.88,
    w: 4.4,
    h: 2.4,
    items: [
      'Perusahaan',
      'Nama dan departemen',
      'Tanggal & waktu kejadian',
      'Lokasi (pilih dari daftar)',
      'Deskripsi apa yang terjadi',
      'Stop Work jika pekerjaan dihentikan',
      'Foto bukti (opsional, disarankan)',
    ],
    size: 14,
  })
  heading(slide, { x: 5.2, y: 1.5, w: 4.4, text: 'Kamu tidak isi' })
  bullets(slide, {
    x: 5.2,
    y: 1.88,
    w: 4.4,
    h: 2.4,
    items: [
      'Kategori (Unsafe Act, dll.)',
      'Tingkat risiko Low / Medium / High',
      'IOGP / Life Saving Rule',
      'Rekomendasi atau CAPA',
      'Nama PIC / investigasi',
      'Login atau kata sandi',
    ],
    size: 14,
  })
  body(slide, {
    x: 0.4,
    y: 4.45,
    w: 9.2,
    h: 0.55,
    text: 'HSE yang mengklasifikasi di dashboard. Laporan baru tampil “Belum diklasifikasi”.',
    size: 14,
    color: C.ink,
  })
}

{
  const slide = contentSlide(pptx, 'Cara buka form')
  addFooter(pptx, slide, 3)
  numberedList(slide, [
    `Buka ${APP_URL} di HP atau komputer. Atau scan QR yang dipasang HSSE.`,
    'Tidak perlu login. Tidak ada akun pelapor.',
    'Form dwibahasa: label Indonesia, penjelasan Inggris di bawahnya.',
    'Kalau diminta cookie: pilih setuju atau kelola. Kebijakan ada di tautan Privacy / Cookies di bawah form.',
  ])
}

{
  const slide = contentSlide(pptx, 'Langkah 1 — siapa pelapor')
  addFooter(pptx, slide, 4)
  heading(slide, { x: 0.4, y: 0.88, w: 9.2, text: 'Nama perusahaan' })
  body(slide, {
    x: 0.4,
    y: 1.22,
    w: 9.2,
    h: 0.7,
    text: 'Pilih PT. BACT jika kamu karyawan BACT. Vendor, kontraktor, security, MSB, atau visitor pilih perusahaan masing-masing, atau “Lainnya” lalu ketik nama.',
    size: 15,
  })
  heading(slide, { x: 0.4, y: 2.0, w: 9.2, text: 'Kalau perusahaan = PT. BACT' })
  numberedList(
    slide,
    [
      'Ketik nama di kolom Nama pelapor. Pilih dari daftar karyawan (bukan Security 2508xxx / MSB).',
      'Departemen dan ID BACT-xxxx terisi otomatis. Jangan diubah.',
      'Jika nama tidak ada di daftar, pilih perusahaan lain atau isi departemen manual setelah nama diketik tanpa memilih daftar.',
    ],
    { y: 2.35, step: 0.62, size: 14 },
  )
}

{
  const slide = contentSlide(pptx, 'Langkah 1 — bukan karyawan BACT')
  addFooter(pptx, slide, 5)
  numberedList(slide, [
    'Isi nama lengkap secara manual.',
    'Isi departemen / jabatan di lapangan, contoh: Security, Driver, Tally.',
    'Tidak ada ID BACT. Itu wajar.',
    'Pastikan perusahaan benar supaya HSE tahu sumber laporan.',
  ])
}

{
  const slide = contentSlide(pptx, 'Langkah 2 — kapan dan di mana')
  addFooter(pptx, slide, 6)
  numberedList(slide, [
    'Tanggal & waktu: waktu kejadian, bukan waktu kamu mengisi. Gunakan pemilih tanggal di form.',
    'Lokasi: pilih dari daftar (CY/A, Gate IN, Jetty, New Building Office, dll.).',
    'Jika lokasi tidak ada, pilih Other lalu ketik lokasi yang jelas (area, stack, atau gedung).',
    'Tidak perlu mengaktifkan GPS. Lokasi diambil dari pilihan kamu.',
  ])
}

{
  const slide = contentSlide(pptx, 'Langkah 3 — deskripsi, Stop Work, foto')
  addFooter(pptx, slide, 7)
  heading(slide, { x: 0.4, y: 0.86, w: 9.2, text: 'Deskripsi' })
  body(slide, {
    x: 0.4,
    y: 1.18,
    w: 9.2,
    h: 0.7,
    text: 'Ceritakan apa yang terlihat, siapa yang terlibat jika relevan, dan mengapa itu tidak aman atau malah praktik baik. Maksimal 4.000 karakter. Jangan tulis data pribadi orang lain yang tidak perlu.',
    size: 14,
  })
  heading(slide, { x: 0.4, y: 1.95, w: 9.2, text: 'Stop Work' })
  body(slide, {
    x: 0.4,
    y: 2.28,
    w: 9.2,
    h: 0.7,
    text: 'Centang hanya jika pekerjaan di area itu sudah dihentikan sementara. Laporan ini menjadi High Potential (HiPo) dan HSE meninjau lebih dulu. Jangan dicentang “sekadar supaya cepat ditangani”.',
    size: 14,
  })
  heading(slide, { x: 0.4, y: 3.05, w: 9.2, text: 'Foto' })
  bullets(slide, {
    x: 0.4,
    y: 3.4,
    w: 9.2,
    h: 1.5,
    items: [
      'Opsional, tapi sangat membantu HSE.',
      'JPG, PNG, WEBP, atau HEIC. Maksimal 8 foto, 10 MB per berkas.',
      'Ambil dari galeri atau kamera HP. Jangan unggah dokumen atau video.',
    ],
    size: 14,
  })
}

{
  const slide = contentSlide(pptx, 'Langkah 4 — kirim')
  addFooter(pptx, slide, 8)
  numberedList(slide, [
    'Cek nama, lokasi, dan deskripsi sekali lagi. Lalu ketuk Kirim Laporan.',
    'Jika berhasil: layar “Laporan terkirim”. HSE akan menindaklanjuti. Kamu tidak menerima nomor tiket di HP.',
    'Jika jaringan putus: laporan tersimpan di perangkat. Buka aplikasi lagi saat sinyal ada — akan terkirim otomatis. Foto tidak ikut antrean offline; kirim ulang dengan foto saat online.',
    'Tombol “Buat laporan lain” untuk kejadian berikutnya.',
  ])
}

{
  const slide = contentSlide(pptx, 'Yang tidak perlu kamu lakukan')
  addFooter(pptx, slide, 9)
  addTable(pptx, slide, [
    [th('Jangan'), th('Alasan')],
    [td('Minta akun dashboard', C.white), td('Dashboard hanya HSE / Super Admin / Viewer.', C.white)],
    [td('Isi kategori atau risiko sendiri', C.zebra), td('Itu tugas HSE setelah laporan masuk.', C.zebra)],
    [td('Lapor lewat Excel', C.white), td('Excel hanya arsip. Lapor lewat form ini.', C.white)],
    [td('Kirim dua kali “supaya sampai”', C.zebra), td('Satu kiriman cukup. Dobel membuat data ganda.', C.zebra)],
    [td('Centang Stop Work tanpa henti kerja', C.white), td('Stop Work = HiPo. Hanya jika pekerjaan benar dihentikan.', C.white)],
  ], { x: 0.4, y: 0.95, w: 9.2, colW: [3.6, 5.6], fontSize: 13, rowH: 0.55 })
}

{
  const slide = contentSlide(pptx, 'Bantuan')
  addFooter(pptx, slide, 10)
  body(slide, {
    x: 0.4,
    y: 1.1,
    w: 9.2,
    h: 3.5,
    text: `Alamat form: ${APP_URL}\n\nJika form gagal kirim, coba jaringan lain lalu kirim ulang. Jika nama BACT tidak muncul di daftar, laporkan ke HSSE / IT agar data karyawan diperbarui.\n\nPrivacy Policy dan Cookie Policy ada di tautan bawah form.`,
    size: 16,
  })
}

await writeDeck(pptx, 'BACT-SOC-Panduan-Form.pptx')
