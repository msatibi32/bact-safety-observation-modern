import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const ITEMS = [
  { to: '/', label: 'SOC', end: true },
  { to: '/ptw', label: 'PTW' },
  { to: '/visit', label: 'Visit' },
]

export default function PublicModuleNav() {
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo size="sm" />
        <nav className="flex rounded-full bg-slate-100 p-1" aria-label="Modul HSSE">
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
      </div>
    </div>
  )
}
