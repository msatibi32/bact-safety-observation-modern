import { useEffect, useState } from 'react'
import { getAuditLogs } from '../lib/store'

export default function AuditTrail({ observationId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs(observationId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [observationId])

  if (loading) return <p className="text-sm text-slate-400">Memuat riwayat…</p>

  if (logs.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Belum ada riwayat audit. Submit laporan baru atau ubah status untuk mencatat riwayat.
      </p>
    )
  }

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-4">
      {logs.map((log) => (
        <li key={log.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
          <p className="text-sm font-medium text-slate-900">{log.action}</p>
          {log.details && <p className="text-xs text-slate-600">{log.details}</p>}
          <p className="mt-0.5 text-xs text-slate-400">
            {log.actor_email} ·{' '}
            {new Date(log.created_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </li>
      ))}
    </ol>
  )
}
