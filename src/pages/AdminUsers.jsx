import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useUser } from '../components/RequireRole'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  setAdminUserDisabled,
  updateAdminUser,
} from '../lib/adminUsers'
import { ASSIGNABLE_ROLES, canManageUsers, displayRole } from '../lib/roles'

const emptyForm = { email: '', password: '', role: 'hse', pic_department: '' }

export default function AdminUsers() {
  const user = useUser()
  const allowed = canManageUsers(user)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetId, setResetId] = useState('')
  const [resetPassword, setResetPassword] = useState('')

  async function load() {
    if (!allowed) return
    setLoading(true)
    setError('')
    try {
      setUsers(await listAdminUsers())
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [allowed])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await createAdminUser(form)
      setMessage(`Account ${form.email} created. They can sign in on the admin page.`)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || 'Could not add user.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(id, role, pic_department) {
    setError('')
    try {
      await updateAdminUser(id, { role, pic_department })
      await load()
    } catch (err) {
      setError(err.message || 'Could not change role.')
    }
  }

  async function handleReset(id) {
    if (resetPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setError('')
    setMessage('')
    try {
      await updateAdminUser(id, { password: resetPassword })
      setMessage('Password updated.')
      setResetId('')
      setResetPassword('')
    } catch (err) {
      setError(err.message || 'Could not change password.')
    }
  }

  async function handleToggle(target) {
    if (target.id === user?.id) {
      setError('You cannot disable your own account.')
      return
    }
    const nextDisabled = !target.disabled
    if (
      nextDisabled &&
      !confirm(`Disable ${target.email}? They cannot sign in until you enable the account again.`)
    ) {
      return
    }
    setError('')
    setMessage('')
    try {
      await setAdminUserDisabled(target.id, nextDisabled)
      setMessage(nextDisabled ? `${target.email} disabled.` : `${target.email} enabled again.`)
      await load()
    } catch (err) {
      setError(err.message || 'Could not change account status.')
    }
  }

  async function handleDelete(target) {
    if (!confirm(`Delete account ${target.email}? They will not be able to sign in.`)) return
    setError('')
    try {
      await deleteAdminUser(target.id)
      setMessage(`Account ${target.email} deleted.`)
      await load()
    } catch (err) {
      setError(err.message || 'Could not delete user.')
    }
  }

  if (!allowed) {
    return (
      <AdminLayout>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          This menu is Super Admin only.
        </p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Users & roles</h1>
      <p className="mb-5 text-sm text-slate-500">
        All registered accounts. Super Admin can add users, change role/password, or enable/disable anytime.
      </p>

      <form
        onSubmit={handleCreate}
        className="admin-panel mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
      >
        <p className="text-sm font-medium text-slate-200">Add new user</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Login email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="admin-input"
              placeholder="nama@bact.co.id"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Temporary password</span>
            <input
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="admin-input"
              placeholder="At least 8 characters"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="admin-input"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Super Admin = all menus + manage accounts. HSE = classification, investigation, notifications. Viewer = view only.
        </p>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Add user'}
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}

      {loading && <p className="text-sm text-slate-500">Loading users…</p>}

      {!loading && users.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          {users.length} accounts · {users.filter((u) => !u.disabled).length} active ·{' '}
          {users.filter((u) => u.disabled).length} disabled
        </p>
      )}

      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className={`admin-panel rounded-2xl border px-4 py-3 ${
              u.disabled
                ? 'border-slate-800/70 bg-slate-950/40 opacity-80'
                : 'border-slate-800 bg-slate-900/40'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-100">{u.email}</p>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      u.disabled
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {u.disabled ? 'Disabled' : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {displayRole(u.role)}
                  {u.pic_department ? ` · ${u.pic_department}` : ''}
                  {u.id === user?.id ? ' · you' : ''}
                  {u.last_sign_in_at
                    ? ` · last login ${new Date(u.last_sign_in_at).toLocaleString('en-GB')}`
                    : ' · never signed in'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={u.role === 'admin' ? 'super_admin' : u.role}
                  disabled={u.id === user?.id}
                  onChange={(e) =>
                    handleRoleChange(u.id, e.target.value, u.pic_department)
                  }
                  className="admin-input !w-auto !py-1.5 text-xs"
                >
                  {u.role === 'pic' && <option value="pic">PIC / Department (legacy)</option>}
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {u.id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => handleToggle(u)}
                    className={`rounded-lg px-2 py-1 text-xs ${
                      u.disabled
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setResetId(u.id)
                    setResetPassword('')
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Change password
                </button>
                {u.id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {resetId === u.id && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="min-w-[12rem] flex-1">
                  <span className="mb-1 block text-xs text-slate-400">Password baru</span>
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="admin-input"
                    placeholder="At least 8 characters"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleReset(u.id)}
                  className="btn-primary !py-2 text-sm"
                >
                  Save password
                </button>
                <button
                  type="button"
                  onClick={() => setResetId('')}
                  className="rounded-lg px-3 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </AdminLayout>
  )
}
