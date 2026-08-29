CARA UPLOAD LOGO PT. BACT
=========================

1. Siapkan file logo (format PNG atau SVG, latar transparan disarankan).

2. Simpan di folder ini dengan nama:
   - bact-logo.png   (logo utama di header app)
   - favicon.png     (ikon kecil di tab browser, opsional, ~32x32 atau 64x64 px)

3. Kalau pakai SVG, ubah di src/lib/branding.js:
   logoSrc: '/logo/bact-logo.svg'

4. Jalankan ulang dev server (npm run dev) lalu refresh browser.

5. Setelah yakin tampilannya benar, commit & push ke GitHub — Vercel otomatis deploy.

Tips:
- Logo horizontal (lebar) paling cocok untuk header.
- Ukuran disarankan: lebar 400–800 px, tinggi proporsional.
- Jangan rename file tanpa update branding.js.
