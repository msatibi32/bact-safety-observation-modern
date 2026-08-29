# Outline Presentasi PPT
## Safety Observation Card — PT. BACT Batu Ampar Container Terminal

> Copy tiap slide ke PowerPoint. Lampirkan screenshot dari app & diagram dari `docs/workflow-diagrams.html`.

---

## Slide 1 — Judul
**Safety Observation Card**
Aplikasi Pelaporan Observasi Keselamatan Kerja

PT. BACT — Batu Ampar Container Terminal

[Nama presenter] · [Tanggal]

---

## Slide 2 — Latar Belakang
- Pelaporan keselamatan di lapangan masih manual / tidak terintegrasi
- Butuh sistem cepat dari HP (tanpa login rumit)
- Perlu tracking follow-up ke PIC & rekap data untuk HSE

---

## Slide 3 — Tujuan Aplikasi
- Mempermudah pelaporan unsafe act, unsafe condition, near miss, observasi positif
- Dokumentasi bukti foto + lokasi GPS
- Dashboard admin untuk assign PIC & tutup laporan
- Analitik dasar untuk evaluasi kinerja safety

---

## Slide 4 — Siapa Penggunanya?
| Aktor | Peran |
|-------|-------|
| Pelapor | Karyawan, kontraktor, visitor — form publik |
| Admin / HSE | Review, assign PIC, update status, analitik |

---

## Slide 5 — Demo: Form Pelapor
[Screenshot halaman form `/`]

- Isi data pelapor & perusahaan
- Lokasi + GPS
- Kategori, risiko, foto, rekomendasi
- Submit → status **Open**

---

## Slide 6 — Demo: Dashboard Admin
[Screenshot `/admin`]

- Login HSE
- Daftar laporan + filter status
- Detail laporan & foto bukti
- Assign PIC · ubah status · catatan penutupan

---

## Slide 7 — Demo: Ringkasan Analitik
[Screenshot `/admin/ringkasan`]

- Total / Open / Closed / High Risk
- Breakdown risiko, departemen, perusahaan, lokasi
- Daftar rekomendasi

---

## Slide 8 — Alur Kerja (Diagram)
[Gambar dari workflow-diagrams.html — Diagram 1 Overview]

Pelapor → Supabase → Admin follow-up → Closed

---

## Slide 9 — Alur Pelapor (Detail)
[Gambar Diagram 2]

Form → validasi → upload foto → simpan database → konfirmasi sukses

---

## Slide 10 — Alur Admin (Detail)
[Gambar Diagram 3]

Login → dashboard → pilih laporan → assign PIC → update status → closed

---

## Slide 11 — Status Laporan
[Gambar Diagram 4]

**Open** → **In Progress** → **Closed**

Catatan penutupan wajib saat Closed

---

## Slide 12 — Arsitektur Teknis
[Gambar Diagram 5]

- Frontend: React + Vite + Tailwind
- Hosting: Vercel
- Backend: Supabase (DB + Storage + Auth)

---

## Slide 13 — Dua Versi Aplikasi
| Versi | Repo / Deploy | Status |
|-------|---------------|--------|
| Classic | aplikasi-pertama | Tetap dipakai, tidak diubah |
| **Modern** | safety-observation-card | **Dikembangkan ke versi lengkap** |

---

## Slide 14 — Roadmap (Standar Migas)
[Gambar Diagram 6 — workflow target]

- Triage & eskalasi HiPo
- Investigasi (5 Whys)
- CAPA terpisah
- Verifikasi HSE sebelum close
- Export PDF/Excel · notifikasi email

---

## Slide 15 — Kesimpulan
- Fondasi digital SOC sudah jalan (form + admin + analitik)
- Mendukung budaya safety di area terminal BACT
- Pengembangan berikutnya menuju standar ISO 45001 / IOGP

---

## Slide 16 — Q&A
Terima kasih

Kontak / demo live: [URL Vercel modern app]
