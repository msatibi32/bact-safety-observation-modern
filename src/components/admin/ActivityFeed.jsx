import { LivePulse } from './TradingStatCard'
import { HiPoBadge, RiskBadge, StatusBadge } from '../Badge'

export default function ActivityFeed({ items, onSelect }) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-slate-500">Belum ada aktivitas laporan.</p>
  }

  return (
    <ul className="divide-y divide-slate-800/80">
      {items.map((obs) => (
        <li key={obs.id}>
          <button
            type="button"
            onClick={() => onSelect?.(obs.id)}
            className="flex w-full items-start gap-3 px-1 py-3 text-left transition hover:bg-slate-800/40"
          >
            <div className="mt-1.5 shrink-0">
              <LivePulse />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-medium text-slate-100">{obs.nama_pelapor}</span>
                {obs.is_hipo && <HiPoBadge />}
                <RiskBadge level={obs.tingkat_risiko} />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {obs.kategori} · {obs.lokasi_teks}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-600">
                {new Date(obs.created_at || obs.tanggal_waktu).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <StatusBadge status={obs.status} />
          </button>
        </li>
      ))}
    </ul>
  )
}
