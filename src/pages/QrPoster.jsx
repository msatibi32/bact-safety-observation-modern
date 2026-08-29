import { useMemo } from 'react'
import QRCode from 'react-qr-code'
import BrandLogo from '../components/BrandLogo'
import { BRANDING } from '../lib/branding'

export default function QrPoster() {
  const reportUrl = useMemo(() => BRANDING.publicUrl, [])

  return (
    <div className="qr-poster min-h-screen bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .qr-poster { min-height: auto; }
          .poster-card { box-shadow: none !important; border: 2px solid #e2e8f0 !important; }
        }
      `}</style>

      <div className="no-print border-b border-slate-200 bg-brand-50 px-4 py-3 text-center text-sm text-slate-600">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary mr-3 text-sm"
        >
          Cetak / Save PDF
        </button>
        URL QR: <strong className="text-brand-600">{reportUrl}</strong>
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-10">
        <div className="poster-card w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <BrandLogo size="lg" className="mx-auto mb-4" />

          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {BRANDING.appName}
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">
            Laporkan Observasi Keselamatan
          </h1>
          <p className="mt-1 text-sm text-slate-500">{BRANDING.fullName}</p>

          <div className="mx-auto my-8 inline-block rounded-2xl border-4 border-brand-500 bg-white p-4">
            <QRCode
              value={reportUrl}
              size={220}
              level="H"
              fgColor={BRANDING.colors.black}
              bgColor="#ffffff"
            />
          </div>

          <p className="text-lg font-semibold text-slate-900">Scan QR Code</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Unsafe act · Unsafe condition · Near miss · Observasi positif
          </p>
          <p className="mt-4 break-all text-xs text-slate-400">{reportUrl}</p>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            {BRANDING.subsidiary}
          </div>
        </div>

        <p className="no-print mt-6 max-w-md text-center text-xs text-slate-500">
          QR ini permanen selama URL di atas tidak berubah. Tempel poster di area kerja.
          Untuk domain kustom, set <code>VITE_PUBLIC_APP_URL</code> di Vercel lalu jalankan{' '}
          <code>npm run generate:qr</code>.
        </p>
      </div>
    </div>
  )
}
