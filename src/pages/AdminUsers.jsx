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
import { DEPARTMENT_OPTIONS } from '../lib/constants'
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
      setError(err.message || 'Gagal memuat daftar pengguna.')
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
      setMessage(`Akun ${form.email} sudah dibuat. Orang itu bisa login di halaman admin.`)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menambah pengguna.')
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
      setError(err.message || 'Gagal mengubah role.')
    }
  }

  async function handleReset(id) {
    if (resetPassword.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }
    setError('')
    setMessage('')
    try {
      await updateAdminUser(id, { password: resetPassword })
      setMessage('Password sudah diganti.')
      setResetId('')
      setResetPassword('')
    } catch (err) {
      setError(err.message || 'Gagal ganti password.')
    }
  }

  async function handleToggle(target) {
    if (target.id === user?.id) {
      setError('Tidak boleh menonaktifkan akun sendiri.')
      return
    }
    const nextDisabled = !target.disabled
    if (
      nextDisabled &&
      !confirm(`Nonaktifkan ${target.email}? Orang ini tidak bisa login sampai diaktifkan lagi.`)
    ) {
      return
    }
    setError('')
    setMessage('')
    try {
      await setAdminUserDisabled(target.id, nextDisabled)
      setMessage(nextDisabled ? `${target.email} dinonaktifkan.` : `${target.email} diaktifkan lagi.`)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal mengubah status akun.')
    }
  }

  async function handleDelete(target) {
    if (!confirm(`Hapus akun ${target.email}? Orang ini tidak bisa login lagi.`)) return
    setError('')
    try {
      await deleteAdminUser(target.id)
      setMessage(`Akun ${target.email} dihapus.`)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menghapus pengguna.')
    }
  }

  if (!allowed) {
    return (
      <AdminLayout>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Menu ini hanya untuk Super Admin.
        </p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Pengguna & Role</h1>
      <p className="mb-5 text-sm text-slate-500">
        Semua akun terdaftar. Super Admin bisa tambah, ganti role/password, atau aktifkan/nonaktifkan kapan saja.
      </p>

      <form
        onSubmit={handleCreate}
        className="mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
      >
        <p className="text-sm font-medium text-slate-200">Tambah pengguna baru</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Email login</span>
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
            <span className="mb-1 block text-xs font-medium text-slate-400">Password sementara</span>
            <input
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="admin-input"
              placeholder="Minimal 8 karakter"
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
          {form.role === 'pic' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-400">Departemen PIC</span>
              <select
                value={form.pic_department}
                onChange={(e) => setForm((f) => ({ ...f, pic_department: e.target.value }))}
                className="admin-input"
                required
              >
                <option value="">— Pilih departemen —</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Super Admin = semua akses. HSE = klasifikasi & investigasi. PIC = follow-up departemen. Viewer = lihat saja.
        </p>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Menyimpan…' : 'Tambah pengguna'}
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}

      {loading && <p className="text-sm text-slate-500">Memuat daftar pengguna…</p>}

      {!loading && users.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          {users.length} akun terdaftar · {users.filter((u) => !u.disabled).length} aktif ·{' '}
          {users.filter((u) => u.disabled).length} nonaktif
        </p>
      )}

      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className={`rounded-2xl border px-4 py-3 ${
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
                    {u.disabled ? 'Nonaktif' : 'Aktif'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {displayRole(u.role)}
                  {u.pic_department ? ` · ${u.pic_department}` : ''}
                  {u.id === user?.id ? ' · akun kamu' : ''}
                  {u.last_sign_in_at
                    ? ` · login terakhir ${new Date(u.last_sign_in_at).toLocaleString('id-ID')}`
                    : ' · belum pernah login'}
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
                    {u.disabled ? 'Aktifkan' : 'Nonaktifkan'}
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
                  Ganti password
                </button>
                {u.id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Hapus
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
                    placeholder="Minimal 8 karakter"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleReset(u.id)}
                  className="btn-primary !py-2 text-sm"
                >
                  Simpan password
                </button>
                <button
                  type="button"
                  onClick={() => setResetId('')}
                  className="rounded-lg px-3 py-2 text-xs text-slate-400"
                >
                  Batal
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </AdminLayout>
  )
}
