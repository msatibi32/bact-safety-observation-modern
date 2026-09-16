import { Link } from 'react-router-dom'
import { BRANDING } from '../lib/branding'

export default function SiteFooter({ tone = 'light' }) {
  const muted = tone === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
  const bar = tone === 'dark' ? 'border-slate-800' : 'border-slate-200'

  return (
    <footer className={`mt-10 border-t ${bar} px-4 py-6 text-center text-xs`}>
      <p className={tone === 'dark' ? 'text-slate-500' : 'text-slate-500'}>
        © {new Date().getFullYear()} {BRANDING.legalName} — {BRANDING.fullName}
      </p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link to="/privacy" className={muted}>
          Kebijakan privasi
        </Link>
        <span className={tone === 'dark' ? 'text-slate-700' : 'text-slate-300'}>·</span>
        <Link to="/cookies" className={muted}>
          Cookies
        </Link>
      </p>
    </footer>
  )
}
