import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MailIcon } from '../Icon'
import { useUser } from '../RequireRole'
import { canManageNotifications } from '../../lib/roles'
import {
  addNotificationRecipient,
  getNotificationRecipients,
  removeNotificationRecipient,
  sendTestNotification,
  toggleNotificationRecipient,
  updateNotificationRecipient,
} from '../../lib/store'

export default function NotificationRecipientsPanel({ variant = 'full' }) {
  const compact = variant === 'compact'
  const user = useUser()
  const canManage = canManageNotifications(user)

  const [recipients, setRecipients] = useState([])
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setRecipients(await getNotificationRecipients())
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar email.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!canManage) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await addNotificationRecipient({ email, label })
      setEmail('')
      setLabel('')
      setMessage(`Email ${email.trim().toLowerCase()} ditambahkan. Laporan berikutnya akan dikirim ke alamat ini.`)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menambah email.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id, active) {
    if (!canManage) return
    setError('')
    try {
      await toggleNotificationRecipient(id, !active)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal mengubah status.')
    }
  }

  async function handleFlag(id, field, value) {
    if (!canManage) return
    setError('')
    try {
      await updateNotificationRecipient(id, { [field]: value })
      await load()
    } catch (err) {
      setError(err.message || 'Gagal mengubah jenis notifikasi.')
    }
  }

  async function handleRemove(id) {
    if (!canManage) return
    if (!confirm('Hapus email ini dari daftar notifikasi?')) return
    setError('')
    try {
      await removeNotificationRecipient(id)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menghapus email.')
    }
  }

  async function handleTest(recipient) {
    if (!canManage) return
    setTestingId(recipient.id)
    setError('')
    setMessage('')
    try {
      const result = await sendTestNotification(recipient.email)
      const idNote = result?.resend_id ? ` ID Resend: ${result.resend_id}.` : ''
      setMessage(
        `Resend menerima tes ke ${recipient.email}.${idNote} Cek inbox, folder Spam, dan resend.com/emails.`,
      )
    } catch (err) {
      setError(err.message || 'Gagal mengirim tes.')
    } finally {
      setTestingId(null)
    }
  }

  const activeCount = recipients.filter((r) => r.active).length

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <MailIcon className="h-3.5 w-3.5" />
            Tujuan email notifikasi
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {activeCount > 0
              ? `Laporan baru & HiPo dikirim ke ${activeCount} email aktif.`
              : 'Belum ada email aktif. Tambahkan alamat di bawah.'}
          </p>
        </div>
        {compact && (
          <Link
            to="/admin/pengaturan"
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-brand-400 hover:bg-slate-800"
          >
            Kelola lengkap
          </Link>
        )}
      </div>

      <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
        Tanpa domain, Resend hanya mengirim ke pemilik akun. Supaya semua email di daftar ini menerima: daftar gratis di
        brevo.com, verifikasi pengirim, lalu set secret <code className="text-amber-100">BREVO_API_KEY</code> di
        Supabase. Langkah lengkap ada di halaman Notifikasi → Setup teknis.
      </p>

      {canManage && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-400">Tambah email baru</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hse@bact.co.id"
              className="admin-input w-full"
            />
          </label>
          {!compact && (
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-slate-400">Label (opsional)</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Tim HSE"
                className="admin-input w-full"
              />
            </label>
          )}
          <button type="submit" disabled={saving} className="btn-primary shrink-0 !py-2.5">
            {saving ? 'Menyimpan…' : 'Tambah email'}
          </button>
        </form>
      )}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}

      {loading && <p className="text-sm text-slate-500">Memuat daftar email…</p>}

      {!loading && recipients.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada email. Tambahkan minimal satu penerima.</p>
      )}

      <ul className="space-y-2">
        {recipients.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{r.email}</p>
              {r.label && <p className="text-xs text-slate-500">{r.label}</p>}
              {!compact && (
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={r.notify_new_report !== false}
                      disabled={!canManage}
                      onChange={(e) => handleFlag(r.id, 'notify_new_report', e.target.checked)}
                    />
                    Laporan baru
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={r.notify_hipo !== false}
                      disabled={!canManage}
                      onChange={(e) => handleFlag(r.id, 'notify_hipo', e.target.checked)}
                    />
                    HiPo
                  </label>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-medium ${r.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {r.active ? 'Aktif' : 'Nonaktif'}
              </span>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => handleToggle(r.id, r.active)}
                    className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
                  >
                    {r.active ? 'Matikan' : 'Aktifkan'}
                  </button>
                  {!compact && (
                    <button
                      type="button"
                      onClick={() => handleTest(r)}
                      disabled={testingId === r.id}
                      className="rounded-lg px-2 py-1 text-xs text-brand-400 hover:bg-slate-800 disabled:opacity-50"
                    >
                      {testingId === r.id ? 'Mengirim…' : 'Kirim tes'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(r.id)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Hapus
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
