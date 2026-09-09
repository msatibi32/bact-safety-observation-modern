import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useUser } from '../components/RequireRole'
import { canViewActivityLog } from '../lib/roles'
import { getActivityLogs, getAllAuditLogs } from '../lib/store'

function startOfTodayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function AdminActivity() {
  const user = useUser()
  const allowed = canViewActivityLog(user)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scope, setScope] = useState('today')

  useEffect(() => {
    if (!allowed) {
      setLoading(false)
      return
    }
    setLoading(true)
    const since = scope === 'today' ? startOfTodayIso() : null
    Promise.all([
      getActivityLogs({ since, limit: 200 }).catch(() => []),
      getAllAuditLogs({ since, limit: 200 }).catch(() => []),
    ])
      .then(([activity, audits]) => {
        const merged = [
          ...activity.map((l) => ({ ...l, source: 'activity' })),
          ...audits.map((l) => ({
            id: l.id,
            created_at: l.created_at,
            actor_email: l.actor_email,
            actor_role: '',
            action: l.action,
            details: l.details,
            observation_id: l.observation_id,
            source: 'audit',
          })),
        ]
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        // Dedup by id
        const seen = new Set()
        setLogs(merged.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true))))
      })
      .catch((err) => setError(err.message || 'Gagal memuat log.'))
      .finally(() => setLoading(false))
  }, [allowed, scope])

  const byActor = useMemo(() => {
    const map = {}
    for (const l of logs) {
      const k = l.actor_email || '—'
      map[k] = (map[k] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [logs])

  if (!allowed) {
    return (
      <AdminLayout>
        <p className="text-sm text-amber-400">Hanya Super Admin yang dapat melihat activity log HSE.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-100 md:text-lg">Activity Log HSE</h1>
          <p className="text-xs text-slate-500">Pantau aktivitas anggota HSE di aplikasi (Super Admin).</p>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'today', label: 'Hari ini' },
            { id: 'all', label: 'Semua' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                scope === s.id ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Memuat…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          {byActor.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {byActor.map(([email, count]) => (
                <span
                  key={email}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                >
                  {email} · <span className="font-mono text-brand-400">{count}</span>
                </span>
              ))}
            </div>
          )}

          {logs.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada aktivitas{scope === 'today' ? ' hari ini' : ''}.</p>
          )}

          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={`${log.source}-${log.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">{log.action}</p>
                  <time className="font-mono text-[10px] text-slate-500">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </time>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {log.actor_email}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </p>
                {log.details && <p className="mt-1 text-xs text-slate-500">{log.details}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminLayout>
  )
}
