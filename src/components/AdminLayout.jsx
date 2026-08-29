import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { BRANDING } from '../lib/branding'
import BrandLogo from './BrandLogo'
import { ChartIcon, ClipboardIcon, LogoutIcon, PinIcon, UsersIcon } from './Icon'

const navLinkClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition md:inline-flex md:flex-none md:flex-row md:gap-1.5 md:rounded-lg md:px-3 md:py-2 md:text-sm ${
    isActive
      ? 'text-brand-400 md:bg-brand-600 md:text-white md:shadow-sm md:shadow-brand-600/30'
      : 'text-slate-500 hover:text-slate-300 md:hover:bg-slate-800'
  }`

const desktopNavClass = ({ isActive }) =>
  `hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition md:inline-flex ${
    isActive ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
  }`

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo size="sm" className="rounded-lg" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                {BRANDING.shortName} HSE
              </p>
              <p className="truncate text-sm font-semibold text-slate-100">Command Center</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/admin" end className={desktopNavClass}>
              <ClipboardIcon className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/ringkasan" className={desktopNavClass}>
              <ChartIcon className="h-4 w-4" />
              Analitik
            </NavLink>
            <NavLink to="/admin/peta" className={desktopNavClass}>
              <PinIcon className="h-4 w-4" />
              Peta
            </NavLink>
            <NavLink to="/admin/pengaturan" className={desktopNavClass}>
              <UsersIcon className="h-4 w-4" />
              Notifikasi
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogoutIcon className="h-4 w-4" />
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <main className="admin-main mx-auto max-w-6xl px-4 py-4 pb-28 md:pb-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <NavLink to="/admin" end className={navLinkClass}>
            <ClipboardIcon className="h-5 w-5" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/ringkasan" className={navLinkClass}>
            <ChartIcon className="h-5 w-5" />
            Analitik
          </NavLink>
          <NavLink to="/admin/peta" className={navLinkClass}>
            <PinIcon className="h-5 w-5" />
            Peta
          </NavLink>
          <NavLink to="/admin/pengaturan" className={navLinkClass}>
            <UsersIcon className="h-5 w-5" />
            Notif
          </NavLink>
          <button type="button" onClick={handleLogout} className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-slate-500">
            <LogoutIcon className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </nav>
    </div>
  )
}
