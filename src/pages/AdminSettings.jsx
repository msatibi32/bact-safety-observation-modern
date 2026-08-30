import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import NotificationRecipientsPanel from '../components/admin/NotificationRecipientsPanel'
import { useUser } from '../components/RequireRole'
import { canManageNotifications } from '../lib/roles'
import { getNotificationLog, triggerNotificationProcessing } from '../lib/store'

function statusLabel(status) {
  if (status === 'sent') return { text: 'Terkirim', className: 'text-emerald-400' }
  if (status === 'failed') return { text: 'Gagal', className: 'text-red-400' }
  return { text: 'Menunggu', className: 'text-amber-400' }
}

function sentToText(row) {
  const sent = row.payload?.last_send?.sent_to
  if (Array.isArray(sent) && sent.length > 0) return sent.join(', ')
  return null
}

export default function AdminSettings() {
  const user = useUser()
  const canManage = canManageNotifications(user)

  const [logs, setLogs] = useState([])
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadLogs() {
    try {
      setLogs(await getNotificationLog())
    } catch {
      setLogs([])
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  async function handleProcessQueue() {
    if (!canManage) return
    setProcessing(true)
    setError('')
    setMessage('')
    try {
      const result = await triggerNotificationProcessing()
      const n = result?.processed ?? 0
      setMessage(
        n > 0
          ? `Antrian diproses. Terkirim: ${n} notifikasi.`
          : 'Tidak ada antrian pending, atau semua penerima ditolak Resend. Cek riwayat di bawah.',
      )
      await loadLogs()
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
      <p className="mb-5 text-sm text-slate-500">
        Tentukan email mana yang menerima laporan baru &amp; HiPo. Tambah, matikan, atau hapus kapan saja dari sini.
      </p>

      {!canManage && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Hanya admin / HSE yang bisa mengubah daftar email notifikasi.
        </p>
      )}

      <div className="mb-6">
        <NotificationRecipientsPanel variant="full" />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Riwayat pengiriman</p>
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

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}

        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada antrian notifikasi.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((row) => {
              const st = statusLabel(row.status)
              const to = sentToText(row)
              const when = new Date(row.created_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-200">
                      {row.type === 'hipo_alert' ? 'HiPo' : 'Laporan baru'}
                      <span className="text-slate-500"> · {row.payload?.category || '—'}</span>
                    </p>
                    <span className={`text-xs font-medium ${st.className}`}>{st.text}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{when}</p>
                  {to && <p className="mt-1 text-xs text-slate-400">Terkirim ke: {to}</p>}
                  {row.error_message && (
                    <p className="mt-1 break-words text-xs text-red-400/90">{row.error_message}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <details className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-slate-500">
          Kirim ke semua email tanpa beli domain (Brevo, sekali)
        </summary>
        <ol className="mt-3 list-inside list-decimal space-y-2">
          <li>
            Daftar gratis di{' '}
            <a href="https://www.brevo.com" className="text-brand-400 underline" target="_blank" rel="noreferrer">
              brevo.com
            </a>{' '}
            (boleh pakai <code className="text-slate-300">chibiajjh12@gmail.com</code>)
          </li>
          <li>
            Menu <code className="text-brand-400">Senders, Domains & Dedicated IPs</code> → <strong>Senders</strong> →
            Add sender → email <code className="text-slate-300">chibiajjh12@gmail.com</code> → buka inbox, klik link
            verifikasi
          </li>
          <li>
            Menu <code className="text-brand-400">SMTP & API</code> → API Keys → buat key → copy
          </li>
          <li>
            Supabase → Project Settings → Edge Functions → Secrets, tambah:
            <ul className="mt-1 list-inside list-disc pl-4">
              <li>
                <code className="text-brand-400">BREVO_API_KEY</code> = key dari Brevo
              </li>
              <li>
                <code className="text-brand-400">BREVO_SENDER_EMAIL</code> ={' '}
                <code className="text-slate-300">chibiajjh12@gmail.com</code>
              </li>
            </ul>
          </li>
          <li>
            Edge Functions → <code className="text-brand-400">process-notifications</code> → paste kode terbaru → Deploy
          </li>
          <li>Kembali ke halaman ini → Kirim tes ke email lain. Seharusnya tidak 403 lagi.</li>
        </ol>
      </details>
    </AdminLayout>
  )
}
