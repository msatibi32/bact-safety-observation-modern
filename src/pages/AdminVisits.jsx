import RequestDesk, { Fact } from '../components/admin/RequestDesk'
import { approveVisitRequest, formatJakarta, listVisitRequests, rejectVisitRequest } from '../lib/passes'

export default function AdminVisits() {
  return (
    <RequestDesk
      eyebrow="Corporate Communication HSSE"
      title="Port visits"
      description="Visit requests arrive here for Corporate Communication HSSE. Approval sets the barcode lifetime to the visit dates."
      loader={async () => {
        const rows = await listVisitRequests()
        return rows.map((row) => ({
          ...row,
          heading: row.visitor_name,
          sub: `${row.company} · ${row.visit_start} – ${row.visit_end}`,
        }))
      }}
      approve={approveVisitRequest}
      reject={rejectVisitRequest}
      renderFacts={(row) => (
        <>
          <Fact label="Company" value={row.company} />
          <Fact label="Phone" value={row.phone} />
          <Fact label="Purpose" value={row.purpose} />
          <Fact label="Dates" value={`${row.visit_start} – ${row.visit_end}`} />
          <Fact label="Declaration" value={row.declaration_accepted ? 'Safety & ISPS accepted' : 'No'} />
          <Fact label="Safety briefing" value={row.safety_induction ? 'Acknowledged' : 'No'} />
          <Fact label="Routed to" value={row.route_to} />
          <Fact label="Valid until" value={row.valid_until ? formatJakarta(row.valid_until) : 'Set on approval'} />
          {row.ktp_url && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">KTP</dt>
              <dd>
                <a href={row.ktp_url} target="_blank" rel="noreferrer" className="text-sm text-brand-400">
                  Open photo
                </a>
              </dd>
            </div>
          )}
          {row.passport_url && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Passport</dt>
              <dd>
                <a href={row.passport_url} target="_blank" rel="noreferrer" className="text-sm text-brand-400">
                  Open photo
                </a>
              </dd>
            </div>
          )}
        </>
      )}
    />
  )
}
