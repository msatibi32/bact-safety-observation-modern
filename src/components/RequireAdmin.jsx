import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function RequireAdmin({ children }) {
  const session = useSession()

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Memuat…</div>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
