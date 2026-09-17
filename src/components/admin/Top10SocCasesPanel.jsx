import { useMemo } from 'react'
import { latestSocCases } from '../../lib/analytics'
import { HiPoBadge, RiskBadge } from '../Badge'
import { PinIcon } from '../Icon'

const RISK_BAR = {
  High: 'bg-red-500',
  Medium: 'bg-amber-400',
  Low: 'bg-emerald-500',
  Unclassified: 'bg-slate-600',
}

function MetaChip({ icon, children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

export default function Top10SocCasesPanel({ observations, capaList }) {
  const rows = useMemo(() => latestSocCases(observations, capaList, 10), [observations, capaList])

  return (
    <section
      className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
      aria-label="Top 10 Case Safety Observation Card"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Top 10 Case</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest safety observations</p>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-slate-500">{rows.length} shown</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
          No reports yet.
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, index) => {
            const hasFollowUp = row.actionBy !== '—' || row.dueDate !== '—'
            return (
              <li
                key={row.id}
                className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 pl-4"
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1 ${RISK_BAR[row.riskLevel] || RISK_BAR.Unclassified}`}
                  aria-hidden
                />
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold tabular-nums text-brand-400">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-slate-100">{row.finding}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <MetaChip>{row.date}</MetaChip>
                      <MetaChip icon={<PinIcon className="h-3 w-3 shrink-0 opacity-70" />}>
                        {row.location}
                      </MetaChip>
                      <MetaChip>{row.source}</MetaChip>
                    </div>
                    {hasFollowUp && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        {row.actionBy !== '—' && <span>Action by {row.actionBy}</span>}
                        {row.actionBy !== '—' && row.dueDate !== '—' && <span> · </span>}
                        {row.dueDate !== '—' && <span>Due {row.dueDate}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <RiskBadge level={row.riskLevel} pending={row.riskLevel === 'Unclassified'} />
                    {row.isHipo && <HiPoBadge />}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
