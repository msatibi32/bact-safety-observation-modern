# BAB SISTEM DAN ALUR KERJA
## Aplikasi Safety Observation Card PT. BACT

---

## 1. Latar Belakang

PT. BACT membutuhkan sistem pelaporan observasi keselamatan kerja yang dapat diakses secara cepat oleh seluruh karyawan, kontraktor, dan pengunjung di lapangan. Sebelumnya, pelaporan dilakukan melalui formulir kertas atau platform eksternal yang tidak terintegrasi dengan proses follow-up internal.

Aplikasi **Safety Observation Card (SOC)** dikembangkan sebagai solusi digital untuk mempermudah pelaporan kondisi tidak aman, tindakan berisiko, near miss, maupun observasi positif di area kerja. Sistem ini dirancang mengacu praktik Health, Safety, Security, and Environment (HSSE) di industri migas, dengan referensi kerangka kerja ISO 45001 dan pedoman IOGP (International Association of Oil & Gas Producers) terkait pelaporan dan penindaklanjutan observasi keselamatan.

---

## 2. Tujuan Sistem

Tujuan utama pengembangan aplikasi Safety Observation Card adalah sebagai berikut:

1. **Mempermudah pelaporan** — Karyawan dapat melaporkan observasi keselamatan melalui perangkat mobile tanpa perlu login atau registrasi akun.
2. **Mendokumentasikan bukti** — Setiap laporan dapat dilengkapi foto bukti dan koordinat GPS lokasi kejadian.
3. **Mempercepat follow-up** — Tim HSE dan admin dapat menugaskan Person In Charge (PIC), memantau status penanganan, dan menutup laporan setelah tindakan selesai.
4. **Menyediakan data analitik** — Dashboard ringkasan menyajikan statistik laporan untuk evaluasi kinerja keselamatan kerja.
5. **Mendukung budaya safety** — Selain pelaporan negatif, sistem juga menerima *Positive Observation* untuk memperkuat perilaku kerja yang aman.

---

## 3. Ruang Lingkup dan Aktor

### 3.1 Aktor Sistem

| Aktor | Peran | Akses |
|-------|-------|-------|
| **Pelapor** | Karyawan, kontraktor, atau visitor yang mengamati kondisi di lapangan | Form pelaporan publik (tanpa login) |
| **Admin / HSE Officer** | Petugas yang meninjau, menugaskan PIC, dan menutup laporan | Dashboard admin (dengan login) |

### 3.2 Ruang Lingkup Fungsional (Versi Saat Ini)

- Form pelaporan observasi keselamatan (publik)
- Upload foto bukti dan pengambilan lokasi GPS
- Autentikasi admin melalui Supabase Auth
- Dashboard daftar laporan dengan filter status
- Penugasan PIC dan perubahan status laporan
- Halaman ringkasan dan analitik dasar
- Hosting aplikasi di Vercel (cloud)

---

## 4. Arsitektur Sistem

### 4.1 Gambaran Umum

Aplikasi Safety Observation Card dibangun menggunakan arsitektur *client-server* berbasis cloud. Pengguna mengakses aplikasi melalui browser pada perangkat desktop maupun mobile. Frontend di-hosting di **Vercel**, sementara data dan layanan pendukung dikelola oleh **Supabase**.

### 4.2 Komponen Teknis

| Lapisan | Teknologi | Fungsi |
|---------|-----------|--------|
| **Frontend** | React 19 + Vite + Tailwind CSS | Antarmuka pengguna (form, dashboard, analitik) |
| **Hosting** | Vercel | Deploy otomatis, CDN global, HTTPS |
| **Database** | Supabase (PostgreSQL) | Penyimpanan data laporan (`observations`) |
| **File Storage** | Supabase Storage | Penyimpanan foto bukti laporan |
| **Autentikasi** | Supabase Auth | Login admin/HSE officer |
| **Routing** | React Router | Navigasi antar halaman |

### 4.3 Struktur Halaman Aplikasi

| URL | Halaman | Akses |
|-----|---------|-------|
| `/` | Form Pelaporan Observasi | Publik |
| `/admin/login` | Login Admin / HSE | Publik |
| `/admin` | Dashboard Daftar Laporan | Admin (terautentikasi) |
| `/admin/ringkasan` | Ringkasan & Analitik | Admin (terautentikasi) |

### 4.4 Model Data Utama

Data laporan disimpan dalam tabel `observations` di Supabase dengan field utama sebagai berikut:

- **Identitas pelapor:** nama, departemen, nama perusahaan
- **Waktu & lokasi:** tanggal/waktu kejadian, lokasi teks, koordinat GPS (latitude, longitude)
- **Detail observasi:** kategori, deskripsi, tingkat risiko (Low / Medium / High)
- **Bukti & tindakan:** URL foto, tindakan langsung, rekomendasi perbaikan
- **Follow-up admin:** PIC yang ditugaskan, status, catatan penutupan, tanggal penutupan
- **Metadata:** waktu pembuatan record (`created_at`)

---

## 5. Alur Kerja Pelapor

Alur kerja pelapor dirancang seminimal mungkin agar tidak menjadi hambatan bagi karyawan di lapangan.

### 5.1 Tahapan Pelaporan

1. **Akses aplikasi** — Pelapor membuka aplikasi melalui link web atau memindai QR code yang dipasang di area kerja.
2. **Pengisian informasi pelapor** — Pelapor mengisi nama lengkap, departemen, dan nama perusahaan (termasuk opsi kontraktor/visitor).
3. **Pengisian lokasi dan waktu** — Pelapor mencatat lokasi kejadian secara teks dan dapat mengambil koordinat GPS secara opsional melalui izin browser.
4. **Pengisian detail observasi** — Pelapor memilih kategori observasi, menuliskan deskripsi kejadian, dan menentukan tingkat risiko.
5. **Pelengkap bukti** — Pelapor dapat mengunggah satu atau lebih foto bukti, mencatat tindakan langsung yang sudah dilakukan, serta memberikan rekomendasi perbaikan.
6. **Submit laporan** — Sistem memvalidasi kelengkapan form, mengunggah foto ke Supabase Storage, dan menyimpan data laporan ke database dengan status awal **Open**.
7. **Konfirmasi** — Pelapor menerima konfirmasi bahwa laporan berhasil terkirim dan akan ditindaklanjuti tim HSE.

### 5.2 Kategori Observasi

| Kategori | Keterangan |
|----------|------------|
| Unsafe Act | Perilaku tidak aman yang diamati di lapangan |
| Unsafe Condition | Kondisi lingkungan atau peralatan yang tidak aman |
| Near Miss | Kejadian hampir celaka tanpa cedera |
| Positive Observation | Perilaku atau kondisi kerja yang aman dan patut diapresiasi |

### 5.3 Tingkat Risiko

| Level | Keterangan |
|-------|------------|
| Low | Risiko rendah, tidak memerlukan tindakan segera |
| Medium | Risiko sedang, perlu ditindaklanjuti dalam waktu wajar |
| High | Risiko tinggi, memerlukan perhatian dan tindakan prioritas |

---

## 6. Alur Kerja Admin / HSE Officer

### 6.1 Autentikasi

Admin atau HSE Officer mengakses halaman `/admin/login`, memasukkan email dan password yang terdaftar di Supabase Auth. Jika kredensial valid, pengguna diarahkan ke dashboard admin. Jika tidak valid, sistem menampilkan pesan kesalahan.

### 6.2 Penanganan Laporan

1. **Melihat daftar laporan** — Dashboard menampilkan seluruh laporan yang masuk dalam bentuk tabel, dilengkapi ringkasan statistik (total laporan, jumlah Open, jumlah risiko High).
2. **Filter status** — Admin dapat memfilter laporan berdasarkan status: Semua, Open, In Progress, atau Closed.
3. **Membuka detail laporan** — Admin memilih satu laporan untuk melihat informasi lengkap: data pelapor, lokasi, deskripsi, foto bukti, tindakan langsung, dan rekomendasi.
4. **Menugaskan PIC** — Admin memilih departemen/PIC yang bertanggung jawab untuk follow-up dari daftar: HSE, Produksi, Maintenance, Logistik, Operasional, atau Umum/GA.
5. **Mengubah status** — Admin memperbarui status laporan sesuai progres penanganan.
6. **Menutup laporan** — Saat status diubah menjadi Closed, admin wajib mengisi catatan penutupan yang menjelaskan tindakan yang telah dilakukan. Sistem mencatat tanggal penutupan (`closed_date`).

### 6.3 Ringkasan dan Analitik

Halaman Ringkasan (`/admin/ringkasan`) menyajikan:

- Total laporan, jumlah Open, Closed, dan High Risk
- Breakdown per tingkat risiko
- Breakdown per departemen pelapor
- Breakdown per perusahaan/kontraktor
- Breakdown per lokasi kejadian
- Daftar rekomendasi yang muncul dari laporan

---

## 7. Siklus Status Laporan

Setiap laporan memiliki siklus status sebagai berikut:

```
[Submit] → Open → In Progress → Closed
                ↘ Closed (langsung)
```

| Status | Deskripsi | Kondisi |
|--------|-----------|---------|
| **Open** | Laporan baru masuk | Otomatis saat pelapor submit; belum ada PIC |
| **In Progress** | Sedang ditindaklanjuti | Admin sudah assign PIC dan follow-up berjalan |
| **Closed** | Selesai ditangani | Tindakan selesai; catatan penutupan diisi; tanggal close tercatat |

---

## 8. Keamanan dan Kontrol Akses

- **Pelapor (publik):** Hanya dapat mengirim laporan baru (INSERT). Tidak dapat membaca atau mengubah data laporan orang lain, sesuai kebijakan Row Level Security (RLS) di Supabase.
- **Admin (terautentikasi):** Dapat membaca seluruh laporan, mengubah status, menugaskan PIC, dan mengisi catatan penutupan.
- **Komunikasi:** Seluruh lalu lintas data menggunakan HTTPS.
- **Kredensial:** API key Supabase disimpan sebagai environment variable di Vercel, tidak di-commit ke repository kode.

---

## 9. Deployment dan Infrastruktur

Aplikasi di-deploy ke **Vercel** dan terhubung ke repository GitHub (`bact-safety-observation-modern`). Setiap perubahan kode yang di-push ke branch utama akan memicu proses build dan deploy otomatis.

Backend menggunakan **Supabase** (free tier) yang menyediakan:

- Database PostgreSQL untuk data laporan
- Object storage untuk foto bukti
- Layanan autentikasi untuk admin

Konfigurasi environment variable (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) diatur di dashboard Vercel agar aplikasi production dapat terhubung ke project Supabase yang sama.

---

## 10. Kesesuaian dengan Standar Industri Migas

Aplikasi Safety Observation Card versi saat ini telah memenuhi fondasi dasar pelaporan observasi keselamatan sesuai praktik industri migas, meliputi:

- Pelaporan tanpa hambatan akses (mobile-friendly, tanpa login)
- Klasifikasi observasi (unsafe act, unsafe condition, near miss, positive)
- Penilaian tingkat risiko
- Dokumentasi bukti visual dan lokasi
- Penugasan PIC dan pelacakan status
- Dashboard analitik dasar

Untuk mencapai standar internasional penuh (ISO 45001, IOGP), rencana pengembangan selanjutnya mencakup:

- Tahap triage dan eskalasi otomatis untuk laporan High / HiPo (High Potential)
- Modul investigasi (root cause analysis / 5 Whys)
- Manajemen CAPA (Corrective and Preventive Action) terpisah
- Verifikasi efektivitas tindakan sebelum penutupan
- Audit trail lengkap
- Notifikasi email untuk eskalasi
- Export laporan PDF/Excel untuk keperluan audit

---

## 11. Kesimpulan

Aplikasi Safety Observation Card PT. BACT merupakan sistem pelaporan observasi keselamatan kerja berbasis web yang menghubungkan pelapor di lapangan dengan tim HSE melalui alur digital terstruktur. Sistem ini terdiri dari dua alur utama: **alur pelapor** (form publik → penyimpanan data) dan **alur admin** (login → penanganan → penutupan laporan).

Dengan arsitektur React + Vercel + Supabase, aplikasi ini dapat diakses dari mana saja, di-deploy dengan mudah, dan dikembangkan secara bertahap menuju standar manajemen keselamatan kerja internasional.

---

*Dokumen ini merupakan bagian dokumentasi teknis aplikasi Safety Observation Card PT. BACT — Versi 1.0*
