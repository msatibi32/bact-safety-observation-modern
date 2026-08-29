QR CODE PERMANEN — BACT Safety Observation Card
==========================================

File statis (untuk cetak poster tanpa buka browser):
  bact-soc-qr.png   — resolusi tinggi (1024px)
  bact-soc-qr.svg   — vektor (scalable)
  qr-url.txt        — URL yang di-encode

URL target saat ini ada di qr-url.txt

CARA UPDATE QR (jika ganti domain):
  1. Set VITE_PUBLIC_APP_URL di Vercel Environment Variables
  2. Jalankan: npm run generate:qr
  3. Commit & push file baru di folder ini

HALAMAN POSTER (bisa cetak dari browser):
  https://[domain-kamu]/qr

APAKAH PERMANEN?
  Ya — selama URL production tidak berubah.
  URL *.vercel.app stabil selama project Vercel aktif.
  Untuk paling aman jangka panjang: pakai custom domain (mis. soc.bact.co.id).
