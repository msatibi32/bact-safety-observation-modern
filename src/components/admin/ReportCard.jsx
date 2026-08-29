import { HiPoBadge, RiskBadge, StatusBadge } from '../Badge'

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function ReportCard({ obs, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        selected
          ? 'border-brand-500/60 bg-brand-500/10'
          : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-600'
      } ${obs.is_hipo ? 'ring-1 ring-red-500/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-mono text-xs font-bold text-brand-400">
          {initials(obs.nama_pelapor)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-slate-100">{obs.nama_pelapor}</span>
            {obs.is_hipo && <HiPoBadge />}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{obs.lokasi_teks}</p>
          <p className="mt-0.5 text-xs text-slate-600">{obs.kategori}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <RiskBadge level={obs.tingkat_risiko} />
          <StatusBadge status={obs.status} />
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] text-slate-600">
        {new Date(obs.tanggal_waktu).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </button>
  )
}
