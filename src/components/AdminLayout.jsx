import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { BRANDING } from '../lib/branding'
import { canManageNotifications, canManageUsers, canViewActivityLog } from '../lib/roles'
import BrandLogo from './BrandLogo'
import SiteFooter from './SiteFooter'
import ThemeToggle from './ThemeToggle'
import { ChartIcon, ClipboardIcon, LogoutIcon, UsersIcon } from './Icon'
import { useUser } from './RequireRole'

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

const MODULES = [
  { id: 'soc', to: '/admin', label: 'SOC' },
  { id: 'ptw', to: '/admin/ptw', label: 'PTW' },
  { id: 'visit', to: '/admin/visit', label: 'Visit' },
]

function activeModule(pathname) {
  if (pathname.startsWith('/admin/ptw')) return 'ptw'
  if (pathname.startsWith('/admin/visit')) return 'visit'
  return 'soc'
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const module = activeModule(pathname)
  const user = useUser()
  const showActivity = canViewActivityLog(user)
  const showUsers = canManageUsers(user)
  const showNotifications = canManageNotifications(user)

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo size="sm" className="rounded-lg" />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                  {BRANDING.shortName} HSE
                </p>
                <p className="truncate text-sm font-semibold text-slate-100">Command Center</p>
              </div>
            </div>
            <nav className="flex rounded-xl bg-slate-900 p-1" aria-label="Modul HSSE">
              {MODULES.map((item) => {
                const active = module === item.id
                return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.id === 'soc'}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                      active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 md:inline-flex"
              >
                <LogoutIcon className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
          {module === 'soc' && (
            <nav className="mt-3 hidden items-center gap-1 md:flex">
              <NavLink to="/admin" end className={desktopNavClass}>
                <ClipboardIcon className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink to="/admin/ringkasan" className={desktopNavClass}>
                <ChartIcon className="h-4 w-4" />
                Analytics
              </NavLink>
              {showActivity && (
                <NavLink to="/admin/aktivitas" className={desktopNavClass}>
                  <UsersIcon className="h-4 w-4" />
                  HSE Log
                </NavLink>
              )}
              {showNotifications && (
                <NavLink to="/admin/pengaturan" className={desktopNavClass}>
                  <UsersIcon className="h-4 w-4" />
                  Notifications
                </NavLink>
              )}
              {showUsers && (
                <NavLink to="/admin/pengguna" className={desktopNavClass}>
                  <UsersIcon className="h-4 w-4" />
                  Users
                </NavLink>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="admin-main mx-auto max-w-6xl px-4 py-4 pb-28 md:pb-6">
        {children}
        <SiteFooter tone="dark" />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {module === 'soc' ? (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                <ClipboardIcon className="h-5 w-5" />
                Dashboard
              </NavLink>
              <NavLink to="/admin/ringkasan" className={navLinkClass}>
                <ChartIcon className="h-5 w-5" />
                Analytics
              </NavLink>
              {showNotifications && (
                <NavLink to="/admin/pengaturan" className={navLinkClass}>
                  <UsersIcon className="h-5 w-5" />
                  Alerts
                </NavLink>
              )}
              {showUsers ? (
                <NavLink to="/admin/pengguna" className={navLinkClass}>
                  <UsersIcon className="h-5 w-5" />
                  Users
                </NavLink>
              ) : showActivity ? (
                <NavLink to="/admin/aktivitas" className={navLinkClass}>
                  <UsersIcon className="h-5 w-5" />
                  Log
                </NavLink>
              ) : null}
            </>
          ) : (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                <ClipboardIcon className="h-5 w-5" />
                SOC
              </NavLink>
              <NavLink to="/admin/ptw" className={navLinkClass}>
                <ClipboardIcon className="h-5 w-5" />
                PTW
              </NavLink>
              <NavLink to="/admin/visit" className={navLinkClass}>
                <ClipboardIcon className="h-5 w-5" />
                Visit
              </NavLink>
            </>
          )}
          <button type="button" onClick={handleLogout} className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-slate-500">
            <LogoutIcon className="h-5 w-5" />
            Out
          </button>
        </div>
      </nav>
    </div>
  )
}
