import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useUser } from '../components/RequireRole'
import { canManageNotifications } from '../lib/roles'
import {
  addNotificationRecipient,
  getNotificationRecipients,
  removeNotificationRecipient,
  toggleNotificationRecipient,
  triggerNotificationProcessing,
} from '../lib/store'

export default function AdminSettings() {
  const user = useUser()
  const canManage = canManageNotifications(user)

  const [recipients, setRecipients] = useState([])
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setRecipients(await getNotificationRecipients())
    } catch (err) {
      setError(err.message || 'Gagal memuat pengaturan.')
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
      setMessage('Email notifikasi ditambahkan.')
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menambah email.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id, active) {
    if (!canManage) return
    try {
      await toggleNotificationRecipient(id, !active)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal mengubah status.')
    }
  }

  async function handleRemove(id) {
    if (!canManage) return
    if (!confirm('Hapus email ini dari daftar notifikasi?')) return
    try {
      await removeNotificationRecipient(id)
      await load()
    } catch (err) {
      setError(err.message || 'Gagal menghapus email.')
    }
  }

  async function handleProcessQueue() {
    if (!canManage) return
    setProcessing(true)
    setError('')
    setMessage('')
    try {
      const result = await triggerNotificationProcessing()
      setMessage(`Antrian diproses. Terkirim: ${result?.processed ?? 0} notifikasi.`)
    } catch (err) {
      setError(
        err.message ||
          'Gagal memproses antrian. Pastikan Edge Function process-notifications sudah di-deploy di Supabase.',
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Pengaturan Notifikasi</h1>
      <p className="mb-5 text-sm text-slate-500">Kelola email yang menerima notifikasi laporan baru & HiPo.</p>

      {!canManage && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Hanya admin yang bisa mengubah daftar email notifikasi.
        </p>
      )}

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Setup Resend (sekali)</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-400">
          <li>Supabase → Edge Functions → deploy <code className="text-brand-400">process-notifications</code></li>
          <li>Set secret <code className="text-brand-400">RESEND_API_KEY</code> dari dashboard Resend</li>
          <li>Set secret <code className="text-brand-400">NOTIFY_EMAIL_FROM</code> = <code className="text-slate-300">BACT SOC &lt;onboarding@resend.dev&gt;</code></li>
          <li>Database → Webhooks → insert ke <code className="text-brand-400">notification_queue</code> → panggil function</li>
        </ol>
      </div>

      {canManage && (
        <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-400">Email notifikasi</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hse@bact.co.id"
              className="admin-input w-full"
            />
          </label>
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
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            {saving ? 'Menyimpan…' : 'Tambah email'}
          </button>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {message && <p className="mb-4 text-sm text-emerald-400">{message}</p>}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Daftar penerima email</p>
          {canManage && (
            <button
              type="button"
              onClick={handleProcessQueue}
              disabled={processing}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-brand-500 hover:text-brand-400"
            >
              {processing ? 'Memproses…' : 'Kirim antrian sekarang'}
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-slate-500">Memuat…</p>}

        {!loading && recipients.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada email. Tambahkan minimal satu email penerima.</p>
        )}

        <ul className="space-y-2">
          {recipients.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-slate-200">{r.email}</p>
                {r.label && <p className="text-xs text-slate-500">{r.label}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${r.active ? 'text-emerald-400' : 'text-slate-500'}`}
                >
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
    </AdminLayout>
  )
}
