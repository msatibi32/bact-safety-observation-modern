import { useEffect, useMemo, useState } from 'react'

const LAST_VISIT_KEY = 'soc_admin_last_visit'

function getLastVisit() {
  const raw = localStorage.getItem(LAST_VISIT_KEY)
  return raw ? new Date(raw) : null
}

function markVisited() {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
}

export default function AdminNotifications({ observations = [], queueItems = [], onSelect }) {
  const [dismissed, setDismissed] = useState(false)

  const lastVisit = useMemo(() => getLastVisit(), [])

  const newReports = useMemo(() => {
    if (!lastVisit) {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      return observations.filter((o) => new Date(o.created_at).getTime() > dayAgo)
    }
    return observations.filter((o) => new Date(o.created_at) > lastVisit)
  }, [observations, lastVisit])

  const hipoNew = newReports.filter((o) => o.is_hipo)
  const pendingQueue = queueItems.filter((n) => n.status === 'pending')

  useEffect(() => {
    if (!dismissed && (newReports.length > 0 || hipoNew.length > 0)) {
      markVisited()
    }
  }, [dismissed, newReports.length, hipoNew.length])

  if (dismissed || newReports.length === 0) return null

  return (
    <div className="mb-4 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-300">
            {lastVisit ? 'Ada laporan baru sejak kunjungan terakhir' : 'Selamat datang di Command Center'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            <span className="font-mono text-brand-400">{newReports.length}</span> laporan baru
            {hipoNew.length > 0 && (
              <>
                {' '}
                — <span className="font-mono text-red-400">{hipoNew.length}</span> HiPo
              </>
            )}
            {pendingQueue.length > 0 && (
              <>
                {' '}
                · <span className="text-slate-500">{pendingQueue.length} menunggu kirim email/WA</span>
              </>
            )}
          </p>

          <ul className="mt-3 space-y-1.5">
            {newReports.slice(0, 5).map((obs) => (
              <li key={obs.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(obs.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-slate-800/60"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${obs.is_hipo ? 'bg-red-500' : 'bg-brand-500'}`}
                  />
                  <span className="truncate text-slate-300">
                    {obs.is_anonymous ? 'Anonim' : obs.nama_pelapor} — {obs.lokasi_teks}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">
                    {new Date(obs.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
