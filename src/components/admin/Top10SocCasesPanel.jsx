import { useMemo } from 'react'
import { latestSocCases } from '../../lib/analytics'

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
    <section className="soc-top10 mb-5" aria-label="Top 10 Case Safety Observation Card">
      <h2 className="soc-top10-title">Top 10 Case Safety Observation Card</h2>
      <div className="soc-top10-scroll">
        <table className="soc-top10-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="soc-top10-nowrap">{row.date}</td>
                <td>{row.source}</td>
                <td>{row.location}</td>
                <td className="soc-top10-finding" title={row.finding}>
                  {row.finding}
                </td>
                <td className="soc-top10-nowrap">{row.riskLevel}</td>
                <td className="soc-top10-nowrap">{row.actionBy}</td>
                <td className="soc-top10-nowrap">{row.dueDate}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length}>No reports yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
