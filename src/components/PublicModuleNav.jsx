import { Link, NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const ITEMS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/lapor', label: 'SOC' },
  { to: '/ptw', label: 'PTW' },
  { to: '/visit', label: 'Visit' },
]

export default function PublicModuleNav() {
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Beranda PT. BACT">
          <BrandLogo size="sm" />
        </Link>
        <nav className="scrollbar-none flex min-w-0 overflow-x-auto rounded-full bg-slate-100 p-1" aria-label="Modul HSSE">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/admin/login" className="hidden text-xs font-semibold text-slate-500 hover:text-slate-800 sm:inline">
          Masuk
        </Link>
      </div>
    </div>
  )
}
