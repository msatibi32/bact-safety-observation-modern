import AdminLayout from '../components/AdminLayout'
import NotificationRecipientsPanel from '../components/admin/NotificationRecipientsPanel'
import { useUser } from '../components/RequireRole'
import { canManageNotifications } from '../lib/roles'

export default function AdminSettings() {
  const user = useUser()
  const canManage = canManageNotifications(user)

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

      <NotificationRecipientsPanel variant="full" />
    </AdminLayout>
  )
}
