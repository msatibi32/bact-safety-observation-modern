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

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <p className="mb-2 font-medium text-slate-100">Cara masukin email (langkah awam)</p>
        <ol className="list-decimal space-y-1 pl-5 text-slate-400">
          <li>Ketik alamat email di kotak “Tambah email baru”, contoh <span className="text-slate-200">hse@bact.co.id</span>.</li>
          <li>Isi label kalau mau, contoh “Tim HSE”. Boleh dikosongkan.</li>
          <li>Klik <span className="text-slate-200">Tambah email</span>.</li>
          <li>Pastikan statusnya <span className="text-emerald-400">Aktif</span>. Kalau Nonaktif, klik Aktifkan.</li>
          <li>Opsional: klik <span className="text-slate-200">Kirim tes</span>, lalu cek Inbox dan folder Spam.</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Email yang aktif otomatis dapat kabar saat ada laporan baru atau kasus HiPo. Tidak perlu ubah kode atau server.
        </p>
      </div>

      {!canManage && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Hanya admin / HSE yang bisa mengubah daftar email notifikasi.
        </p>
      )}

      <NotificationRecipientsPanel variant="full" />
    </AdminLayout>
  )
}
