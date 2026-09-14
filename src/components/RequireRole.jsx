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
    return <Navigate to="/admin" replace />
  }

  return children
}
