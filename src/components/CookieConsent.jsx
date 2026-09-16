import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { acceptCookieConsent, getCookieConsent } from '../lib/cookieConsent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !getCookieConsent())
  const location = useLocation()
  const adminPad = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login'

  if (!visible) return null

  function accept() {
    acceptCookieConsent()
    setVisible(false)
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[80] px-3 ${
        adminPad
          ? 'pb-[max(5.5rem,calc(4.75rem+env(safe-area-inset-bottom)))]'
          : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Cookies & penyimpanan lokal</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Situs ini memakai cookie dan penyimpanan lokal yang diperlukan agar form, login admin, dan
            preferensi tampilan berjalan. Tidak ada iklan atau pelacak pihak ketiga.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Necessary cookies and local storage only — no ads.{' '}
            <Link to="/cookies" className="font-medium text-brand-600 underline-offset-2 hover:underline">
              Kebijakan cookie
            </Link>
            {' · '}
            <Link to="/privacy" className="font-medium text-brand-600 underline-offset-2 hover:underline">
              Privasi
            </Link>
          </p>
        </div>
        <button type="button" onClick={accept} className="btn-primary shrink-0 px-4 py-2.5 text-sm">
          Saya mengerti
        </button>
      </div>
    </div>
  )
}
