import { Link } from 'react-router-dom'
import BrandHeader from '../components/BrandHeader'
import SiteFooter from '../components/SiteFooter'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <BrandHeader title="Kebijakan cookie" titleEn="Cookie policy" size="sm" />
        <p className="mt-2 text-center text-xs text-slate-400">Berlaku 16 September 2026 · PT. BACT</p>

        <article className="card mt-8 space-y-6 p-5 text-sm leading-relaxed text-slate-700">
          <p>
            Aplikasi SOC memakai cookie dan penyimpanan lokal <strong>yang diperlukan</strong> agar
            layanan berjalan. Tidak ada cookie iklan, tidak ada pixel media sosial, tidak ada Google
            Analytics.
          </p>
          <p className="text-xs text-slate-500">
            Necessary cookies / local storage only. No advertising or third-party tracking cookies.
          </p>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Yang kami simpan di perangkat</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Nama</th>
                    <th className="py-2 pr-3 font-semibold">Jenis</th>
                    <th className="py-2 font-semibold">Fungsi</th>
                  </tr>
                </thead>
                <tbody className="align-top text-slate-700">
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono">soc_cookie_consent</td>
                    <td className="py-2 pr-3">Local storage</td>
                    <td className="py-2">Mencatat bahwa banner cookie sudah disetujui.</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono">soc_theme</td>
                    <td className="py-2 pr-3">Local storage</td>
                    <td className="py-2">Preferensi tema gelap/terang di halaman admin.</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono">Supabase auth</td>
                    <td className="py-2 pr-3">Local storage / cookie sesi</td>
                    <td className="py-2">Sesi login Super Admin / HSE / Viewer.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-mono">Antrian offline</td>
                    <td className="py-2 pr-3">Local storage</td>
                    <td className="py-2">Laporan yang tersimpan saat HP tidak ada sinyal, lalu dikirim otomatis.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-900">Persetujuan</h2>
            <p className="mt-2">
              Banner “Saya mengerti” menyimpan pilihan Anda di perangkat ini. Tanpa itu, form tetap
              bisa diisi; banner hanya menginformasikan penyimpanan yang diperlukan. Anda dapat
              menghapus data situs dari pengaturan browser.
            </p>
          </section>
        </article>

        <p className="mt-6 text-center text-sm">
          <Link to="/privacy" className="font-medium text-brand-600 hover:underline">
            Kebijakan privasi
          </Link>
          {' · '}
          <Link to="/" className="font-medium text-brand-600 hover:underline">
            Form
          </Link>
        </p>
        <SiteFooter />
      </div>
    </div>
  )
}
