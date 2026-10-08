import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { BRANDING } from '../lib/branding'
import { ADMIN_NAV } from '../lib/omniCatalog'
import { canManageNotifications, canManageUsers, canViewActivityLog, isSpvOnly } from '../lib/roles'
import BrandLogo from './BrandLogo'
import SiteFooter from './SiteFooter'
import ThemeToggle from './ThemeToggle'
import { LogoutIcon } from './Icon'
import { useUser } from './RequireRole'

function allowItem(item, gates) {
  if (!item.gate) return true
  return Boolean(gates[item.gate])
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const user = useUser()
  const spvOnly = isSpvOnly(user)
  const [open, setOpen] = useState(false)
  const gates = {
    users: canManageUsers(user),
    notifications: canManageNotifications(user),
    activity: canViewActivityLog(user),
  }

  const groups = spvOnly
    ? [{ label: 'Operasional', items: [{ to: '/admin/ptw', label: 'Izin Kerja (PTW)' }] }]
    : ADMIN_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => allowItem(item, gates)),
      })).filter((group) => group.items.length)

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-slate-950 text-slate-100 md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 md:flex">
        <SidebarBrand />
        <SidebarNav groups={groups} onNavigate={() => {}} />
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 transition md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarBrand />
        <SidebarNav groups={groups} onNavigate={() => setOpen(false)} />
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            Menu
          </button>
          <p className="truncate text-sm font-semibold">{BRANDING.shortName} HSE</p>
          <ThemeToggle />
        </header>
        <main className="admin-main mx-auto max-w-6xl px-4 py-4 pb-10">
          {children}
          <SiteFooter tone="dark" />
        </main>
      </div>
    </div>
  )
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-4">
      <BrandLogo size="sm" className="rounded-lg" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-brand-400">{BRANDING.shortName} HSE</p>
        <p className="truncate text-sm font-semibold text-slate-100">Command Center</p>
      </div>
    </div>
  )
}

function SidebarNav({ groups, onNavigate }) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label || 'utama'}>
          {group.label && (
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? 'bg-brand-600 font-semibold text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter({ onLogout }) {
  return (
    <div className="space-y-2 border-t border-slate-800 p-3">
      <div className="hidden md:block">
        <ThemeToggle />
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogoutIcon className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}
