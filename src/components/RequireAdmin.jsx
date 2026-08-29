import { Navigate } from 'react-router-dom'
import RequireRole from './RequireRole'

/** @deprecated use RequireRole — kept for backward compat */
export default function RequireAdmin({ children }) {
  return <RequireRole minRole="viewer">{children}</RequireRole>
}
