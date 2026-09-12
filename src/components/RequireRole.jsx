import { Navigate } from 'react-router-dom'
import { hasMinRole } from '../lib/roles'
import { useSession } from '../lib/useSession'

export function useUser() {
  const session = useSession()
  return session?.user ?? null
}

export default function RequireRole({ children, minRole = 'hse' }) {
  const session = useSession()

  if (session === undefined) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!hasMinRole(session.user, minRole)) {
    return (
      <div className="admin-shell flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
        <p className="text-lg font-semibold text-slate-100">Access denied</p>
        <p className="text-sm text-slate-500">Your role cannot open this page.</p>
        <p className="text-xs text-slate-600">Check Supabase → Authentication → Users → User Metadata → role: admin or hse</p>
      </div>
    )
  }

  return children
}
