import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { ChartIcon, ClipboardIcon, LogoutIcon, ShieldIcon } from './Icon'

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30' : 'text-slate-500 hover:bg-slate-100'
  }`

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                BACT · Safety Observation Card
              </p>
              <p className="text-sm font-semibold text-slate-900">Panel Admin / HSE</p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5">
            <NavLink to="/admin" end className={navLinkClass}>
              <ClipboardIcon className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/ringkasan" className={navLinkClass}>
              <ChartIcon className="h-4 w-4" />
              Ringkasan
            </NavLink>
            <button
              onClick={handleLogout}
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <LogoutIcon className="h-4 w-4" />
              Keluar
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
