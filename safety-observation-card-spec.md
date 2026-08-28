# Spec Aplikasi: Safety Observation Card (BACT)

## 1. Tujuan
Mempermudah karyawan BACT melaporkan kejadian buruk / insiden / kondisi tidak aman di lapangan secara cepat, lengkap dengan lokasi kejadian dan foto bukti, supaya:
- Bisa langsung di-follow-up ke PIC/departemen yang tepat.
- Bisa ditarik datanya: jumlah laporan, berapa yang high risk, rekomendasi apa yang muncul, status open vs closed.

Terinspirasi dari alur seperti e-report Police Singapore (lapor → assign PIC → tracking status), tapi diadaptasi untuk observasi keselamatan kerja (mirip Safety Observation Card yang sudah ada, tapi digital dan tanpa PDF).

## 2. Siapa yang pakai
- **Pelapor**: semua karyawan BACT (tidak dibatasi hanya yang sudah terdaftar) — form submit dibuat semudah mungkin, cukup isi form, tanpa perlu login/akun. Data breakdown-nya nanti berdasarkan posisi/departemen yang diisi di form.
- **Admin/HSE Officer**: login untuk melihat dashboard, assign PIC, ubah status, dan menutup laporan (close).

> Catatan: kalau ternyata BACT mau submit form-nya juga dibatasi hanya karyawan terdaftar (pakai login), tinggal tambah step login sebelum form — arsitektur di bawah tetap kepakai.

## 3. Alur utama
1. Karyawan buka aplikasi (bisa lewat QR code di lapangan) → isi Safety Observation Card → submit.
2. Sistem otomatis catat waktu submit, dan (kalau diizinkan browser) lokasi GPS.
3. Laporan masuk ke dashboard admin dengan status **Open**.
4. Admin assign laporan itu ke PIC/departemen terkait buat follow-up.
5. PIC/admin update status jadi **In Progress** → **Closed**, sambil isi tindakan yang sudah dilakukan.
6. Dashboard menampilkan rekap: total laporan, breakdown severity, open vs closed, rekomendasi yang sering muncul, dll.

## 4. Field form pelaporan (draft — sesuaikan dengan form referensi Microsoft Forms kamu)
Saya belum bisa buka link Microsoft Forms yang kamu kirim (situsnya blokir akses otomatis lewat robots.txt). Supaya field-nya persis sama, tolong kirim screenshot tiap halaman/pertanyaan di form itu. Sementara ini draft field standar Safety Observation Card yang saya susun dari requirement yang kamu jelaskan:

- Nama pelapor
- Posisi / departemen pelapor
- Tanggal & waktu kejadian (default: waktu submit)
- Lokasi kejadian — teks (misal: "Area Tangki 3") + koordinat GPS otomatis (kalau user izinkan akses lokasi di HP)
- Kategori observasi: Unsafe Act / Unsafe Condition / Near Miss / Positive Observation (pilihan dropdown, bisa disesuaikan)
- Deskripsi kejadian (teks bebas)
- Tingkat risiko: Low / Medium / High
- Foto bukti (upload 1 atau lebih foto langsung dari kamera HP)
- Tindakan langsung yang sudah diambil (opsional, teks bebas)
- Rekomendasi / saran perbaikan (teks bebas)

## 5. Field tambahan untuk sisi admin
- PIC / departemen yang di-assign untuk follow-up
- Status: Open / In Progress / Closed
- Catatan penutupan (diisi saat status jadi Closed)
- Tanggal follow-up & tanggal closed

## 6. Dashboard & laporan data (kebutuhan analitik)
- Total jumlah laporan (bisa difilter per periode)
- Breakdown jumlah per tingkat risiko (Low/Medium/High)
- Jumlah Open vs Closed
- Breakdown per lokasi/departemen/posisi pelapor
- Daftar rekomendasi yang muncul (bisa dikelompokkan)
- (Nice-to-have) Tren jumlah laporan per minggu/bulan

## 7. Rekomendasi Tech Stack

**Frontend:** React (pakai Vite, lebih ringan dan cepat dibanding Create React App) + Tailwind CSS untuk styling cepat.

**Hosting:** Vercel (free tier) — otomatis build & deploy tiap kali push ke GitHub, gratis untuk kebutuhan seperti ini.

**Database + Backend: Supabase (free tier)** — ini rekomendasi utama saya, alasannya:
- Sudah termasuk **Postgres database** (relasional, cocok buat data laporan yang perlu di-query/rekap — jumlah, breakdown, filter, dll).
- Sudah termasuk **Storage** buat nyimpen foto bukti evidence langsung (gak perlu servis terpisah).
- Sudah termasuk **Auth** buat login admin/HSE officer.
- Ada dashboard bawaan buat lihat/edit data langsung dari browser tanpa nulis kode backend sendiri (mirip Airtable tapi jadi database beneran).
- Free tier-nya cukup generous buat tahap awal/prototype (500MB database, 1GB storage, gratis selamanya selama masih di batas itu).
- Gampang disambungkan ke React lewat library resmi `@supabase/supabase-js`, dan works well di Vercel.

Alternatif yang juga oke kalau nanti Supabase kurang cocok: **Firebase** (Firestore + Storage + Auth, dari Google) — sama-sama gratis, sedikit beda gaya (NoSQL, bukan Postgres). Tapi buat kebutuhan rekap data & filter seperti yang kamu mau, saya lebih saranin Supabase karena Postgres lebih natural buat query "berapa yang high, berapa yang closed", dll.

**Peta lokasi (opsional):** kalau nanti mau nampilin titik lokasi di peta di dashboard, bisa pakai Leaflet + OpenStreetMap (gratis, gak perlu API key) atau Google Maps Embed (gratis dengan batas pemakaian).

## 8. Struktur project awal (yang akan dibuatkan Claude Code)
```
safety-observation-card/
├── src/
│   ├── components/       # komponen UI (form, kartu laporan, tabel dashboard, dll)
│   ├── pages/            # halaman: Form Pelaporan, Login Admin, Dashboard
│   ├── lib/supabase.js   # koneksi ke Supabase
│   └── App.jsx
├── public/
├── .env.local            # simpan SUPABASE_URL & SUPABASE_ANON_KEY (jangan di-commit ke git)
├── package.json
└── vercel.json
```

## 9. Instruksi untuk Claude Code (paste ini di terminal "claude" di Cursor)

```
Saya mau membuat aplikasi web "Safety Observation Card" untuk perusahaan BACT,
pakai React (Vite) + JavaScript, akan di-deploy ke Vercel (free tier), dan
Supabase (free tier) sebagai database + storage foto + auth admin.

Fitur utama:
1. Form pelaporan publik (tanpa login) berisi: nama pelapor, posisi/departemen,
   tanggal & waktu, lokasi kejadian (teks + ambil GPS otomatis dari browser),
   kategori observasi (Unsafe Act/Unsafe Condition/Near Miss/Positive),
   deskripsi kejadian, tingkat risiko (Low/Medium/High), upload foto bukti
   (bisa lebih dari satu), tindakan langsung (opsional), dan rekomendasi.
2. Halaman login admin/HSE officer (pakai Supabase Auth).
3. Dashboard admin: tabel semua laporan, bisa assign PIC/departemen follow-up,
   ubah status (Open/In Progress/Closed), isi catatan penutupan.
4. Halaman ringkasan/analitik: total laporan, breakdown per tingkat risiko,
   jumlah open vs closed, breakdown per departemen/lokasi, daftar rekomendasi.

Tolong mulai dengan:
1. Setup project Vite + React + Tailwind.
2. Buatkan skema tabel Supabase (SQL) untuk tabel "observations" sesuai field
   di atas, plus bucket storage untuk foto.
3. Buat file lib/supabase.js untuk koneksi ke Supabase pakai environment
   variable.
4. Buatkan halaman Form Pelaporan dulu (paling prioritas), termasuk logic
   ambil GPS dan upload foto ke Supabase Storage.
5. Setelah itu baru lanjut ke halaman login admin dan dashboard.

Jelaskan juga langkah yang perlu saya lakukan manual di Supabase (bikin
project, ambil API key) karena itu tidak bisa dilakukan otomatis oleh Claude
Code.
```

## 10. Yang masih perlu dikonfirmasi
- [ ] Screenshot field asli dari form Microsoft Forms referensi, untuk mencocokkan field yang mungkin terlewat.
- [ ] Apakah pelapor harus login juga, atau tetap bebas tanpa login seperti draft ini.
- [ ] Daftar PIC/departemen follow-up apa saja yang perlu ada di dropdown assignment.
