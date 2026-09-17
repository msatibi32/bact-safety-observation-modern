/**
 * Panduan Super Admin.
 * Run: npm run generate:ppt:admin
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
  title: 'BACT SOC — Panduan Super Admin',
  subject: 'Kelola akun, email, dan pengawasan SOC',
})

coverSlide(pptx, {
  title: 'Panduan Super Admin',
  subtitle: 'Akun, notifikasi, log, KPI, dan import — di atas pekerjaan HSE',
  audience: 'Untuk Super Admin / IT / pimpinan HSSE yang punya akses penuh',
})

{
  const slide = contentSlide(pptx, 'Peran kamu')
  addFooter(pptx, slide, 2)
  body(slide, {
    x: 0.4,
    y: 0.88,
    w: 9.2,
    h: 0.7,
    text: 'Super Admin bisa semua yang HSE Officer bisa, plus menu yang HSE tidak lihat. Jangan memakai akun ini untuk kerja lapangan sehari-hari jika sudah ada akun HSE.',
    size: 15,
  })
  addTable(pptx, slide, [
    [th('Menu'), th('HSE Officer'), th('Super Admin')],
    [td('Dashboard + laporan', C.white), td('Ya', C.white), td('Ya', C.white)],
    [td('Analytics + export', C.zebra), td('Ya (tanpa KPI)', C.zebra), td('Ya + HSE performance', C.zebra)],
    [td('Notifications', C.white), td('Tidak', C.white), td('Ya', C.white)],
    [td('Users', C.zebra), td('Tidak', C.zebra), td('Ya', C.zebra)],
    [td('HSSE Log', C.white), td('Tidak', C.white), td('Ya', C.white)],
    [td('Import Excel historis', C.zebra), td('Tidak', C.zebra), td('Ya', C.zebra)],
  ], { x: 0.4, y: 1.65, w: 9.2, colW: [3.2, 2.8, 3.2], fontSize: 13, rowH: 0.42 })
}

{
  const slide = contentSlide(pptx, 'Masuk')
  addFooter(pptx, slide, 3)
  numberedList(slide, [
    `Alamat admin: ${APP_URL}/admin/login`,
    'Gunakan email yang didaftarkan di Users. Bukan form pelapor.',
    'Lima percobaan salah mengunci 10 menit.',
    'Setelah masuk, cek menu Users dan Notifications terlihat. Jika tidak, role akun bukan Super Admin.',
  ])
}

{
  const slide = contentSlide(pptx, 'Users — tambah akun')
  addFooter(pptx, slide, 4)
  numberedList(slide, [
    'Menu Users. Add new user: email kerja, kata sandi sementara minimal 12 karakter, pilih peran.',
    'Peran: Super Admin (penuh), HSE Officer (laporan + Analytics), Viewer (lihat saja).',
    'PIC bukan peran login. Jangan buat akun “PIC Departemen”. PIC diisi per laporan oleh HSE.',
    'Berikan kata sandi sementara lewat saluran internal, minta diganti saat login pertama (Change password di Users).',
    'Disable jika orang pindah tugas. Delete hanya jika akun salah dibuat. Tidak bisa menonaktifkan / menghapus akun sendiri.',
  ], { step: 0.68, size: 14 })
}

{
  const slide = contentSlide(pptx, 'Notifications — email HSE')
  addFooter(pptx, slide, 5)
  numberedList(slide, [
    'Menu Notifications. Ini satu-satunya tempat menambah alamat yang menerima Laporan Baru dan HiPo.',
    'Ketik email, label opsional (contoh “HSE team”), Add email. Status harus Active.',
    'Send test, cek Inbox dan Spam. Kalau tes gagal, cek domain Resend atau cadangan Brevo — bukan salah form pelapor.',
    'Import Excel historis tidak mengirim email. Hanya form live.',
    'HSE Officer tidak bisa mengubah daftar ini, meski mereka yang menerima surat.',
  ], { step: 0.68, size: 14 })
}

{
  const slide = contentSlide(pptx, 'HSSE Log, KPI, import')
  addFooter(pptx, slide, 6)
  heading(slide, { x: 0.4, y: 0.86, w: 9.2, text: 'HSSE Log' })
  body(slide, {
    x: 0.4,
    y: 1.18,
    w: 9.2,
    h: 0.7,
    text: 'Jejak aktivitas staf di dashboard (bukan form pelapor). Untuk audit internal, bukan untuk dihapus harian.',
    size: 14,
  })
  heading(slide, { x: 0.4, y: 1.95, w: 9.2, text: 'HSE performance (Analytics)' })
  body(slide, {
    x: 0.4,
    y: 2.28,
    w: 9.2,
    h: 0.65,
    text: 'Blok KPI di bawah Top 10 Case. Hanya Super Admin. Target bisa diubah di sini, bukan oleh HSE Officer.',
    size: 14,
  })
  heading(slide, { x: 0.4, y: 3.05, w: 9.2, text: 'Import historis' })
  body(slide, {
    x: 0.4,
    y: 3.38,
    w: 9.2,
    h: 1.4,
    text: 'Di bawah Analytics. Preview dulu, lalu import. Data tertandai Imported from HSE Excel — tidak memicu email. Jangan import file tes. Dummy seed terpisah dari import asli.',
    size: 14,
  })
}

{
  const slide = contentSlide(pptx, 'Hapus data — hati-hati')
  addFooter(pptx, slide, 7)
  body(slide, {
    x: 0.4,
    y: 0.95,
    w: 9.2,
    h: 3.8,
    text: 'Setelah kunci database (schema v12), hanya Super Admin yang bisa menghapus laporan lewat API. HSE Officer tidak bisa.\n\nClosed ≠ terhapus. Jangan hapus laporan operasional. Hapus hanya tes dummy yang disepakati.\n\nViewer tidak boleh punya peran Super Admin. Jangan bagikan service role / kunci Supabase.',
    size: 16,
  })
}

{
  const slide = contentSlide(pptx, 'Keamanan yang sudah hidup')
  addFooter(pptx, slide, 8)
  bullets(slide, {
    x: 0.4,
    y: 0.9,
    w: 9.2,
    h: 3.9,
    items: [
      'HTTPS, HSTS, CSP, anti-clickjacking. Bukan klaim ISO 27001 atau SOC 2.',
      'RLS: publik hanya kirim laporan baru. Ubah = HSE/Super Admin. Hapus = Super Admin.',
      'Form: honeypot anti-bot, batas foto, error umum (bukan pesan database).',
      'Password akun baru minimal 12 karakter.',
      'Foto bukti: URL storage masih bisa dibuka jika orang punya tautannya — jangan sebar link foto ke grup publik.',
      'Domain kantor Hostinger masih usulan; data tetap Supabase.',
    ],
    size: 14,
  })
}

{
  const slide = contentSlide(pptx, 'Checklist Super Admin')
  addFooter(pptx, slide, 9)
  numberedList(slide, [
    'Pastikan minimal satu email HSE Active di Notifications, plus tes inbox.',
    'Buat akun HSE Officer terpisah. Jangan semua orang Super Admin.',
    'Viewer untuk manajemen yang hanya melihat angka.',
    'Jangan unggah Excel uji ke import production.',
    'Jika email form tidak sampai: cek Notifications, lalu domain Resend — bukan menyalahkan pelapor.',
  ])
}

await writeDeck(pptx, 'BACT-SOC-Panduan-Super-Admin.pptx')
