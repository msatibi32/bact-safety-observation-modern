import { useMemo } from 'react'
import { latestSocCases } from '../../lib/analytics'
import { RiskBadge } from '../Badge'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'source', label: 'Source' },
  { key: 'location', label: 'Location' },
  { key: 'finding', label: 'Finding Description' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'actionBy', label: 'Action By' },
  { key: 'dueDate', label: 'Due Date' },
]

export default function Top10SocCasesPanel({ observations, capaList }) {
  const rows = useMemo(() => latestSocCases(observations, capaList, 10), [observations, capaList])

  return (
    <section
      className="admin-panel mb-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
      aria-label="Top 10 Case Safety Observation Card"
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Top 10 Case Safety Observation Card</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col" className="pb-2 pr-3 last:pr-0">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/50 last:border-0">
                <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs text-slate-300">{row.date}</td>
                <td className="py-2 pr-3 text-slate-300">{row.source}</td>
                <td className="py-2 pr-3 text-slate-300">{row.location}</td>
                <td className="max-w-xs py-2 pr-3 text-slate-200" title={row.finding}>
                  <span className="line-clamp-3">{row.finding}</span>
                </td>
                <td className="whitespace-nowrap py-2 pr-3">
                  <RiskBadge level={row.riskLevel} pending={row.riskLevel === 'Unclassified'} />
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-slate-300">{row.actionBy}</td>
                <td className="whitespace-nowrap py-2 font-mono text-xs text-slate-300">{row.dueDate}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-3 text-slate-500">
                  No reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
