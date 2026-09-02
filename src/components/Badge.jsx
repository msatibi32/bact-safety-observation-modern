const RISK_STYLES = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
}

const STATUS_STYLES = {
  Open: 'bg-brand-100 text-brand-700',
  'Under Review': 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Pending Verification': 'bg-sky-100 text-sky-700',
  Closed: 'bg-slate-200 text-slate-600',
  Rejected: 'bg-red-50 text-red-500',
}

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

export function RiskBadge({ level, pending = false }) {
  if (pending || !RISK_STYLES[level]) {
    return <Badge className="bg-slate-800 text-slate-400">Belum diklasifikasi</Badge>
  }
  return <Badge className={RISK_STYLES[level]}>{level}</Badge>
}

export function StatusBadge({ status }) {
  return <Badge className={STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}>{status}</Badge>
}

export function HiPoBadge() {
  return <Badge className="bg-red-600 text-white">HiPo</Badge>
}

export function CapaStatusBadge({ status }) {
  const styles = {
    Open: 'bg-brand-100 text-brand-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Verified: 'bg-slate-200 text-slate-600',
  }
  return <Badge className={styles[status] || 'bg-slate-100 text-slate-600'}>{status}</Badge>
}
