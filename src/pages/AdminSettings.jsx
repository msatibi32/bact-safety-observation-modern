import AdminLayout from '../components/AdminLayout'
import NotificationRecipientsPanel from '../components/admin/NotificationRecipientsPanel'
import { useUser } from '../components/RequireRole'
import { canManageNotifications } from '../lib/roles'

export default function AdminSettings() {
  const user = useUser()
  const canManage = canManageNotifications(user)

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Notification settings</h1>
      <p className="mb-5 text-sm text-slate-500">
        Choose which emails receive new reports and HiPo alerts. Add, disable, or remove them here anytime.
      </p>

      <div className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <p className="mb-2 font-medium text-slate-100">How to add an email</p>
        <ol className="list-decimal space-y-1 pl-5 text-slate-400">
          <li>
            Type the address in “Add new email”, for example{' '}
            <span className="text-slate-200">hse@bact.co.id</span>.
          </li>
          <li>Optional label, for example “HSE team”. Can be left empty.</li>
          <li>
            Click <span className="text-slate-200">Add email</span>.
          </li>
          <li>
            Status should be <span className="text-emerald-400">Active</span>. If Disabled, click Enable.
          </li>
          <li>
            Optional: click <span className="text-slate-200">Send test</span>, then check Inbox and Spam.
          </li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Active emails get a message when a new report or HiPo case arrives. No code or server change needed.
        </p>
      </div>

      {!canManage && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Only Super Admin / HSE can change the notification email list.
        </p>
      )}

      <NotificationRecipientsPanel variant="full" />
    </AdminLayout>
  )
}
