import RequestDesk, { Fact } from '../components/admin/RequestDesk'
import {
  approveVisitRequest,
  formatJakarta,
  listVisitRequests,
  passPhase,
  phaseLabel,
  rejectVisitRequest,
  remainingLabel,
  resendPassEmail,
} from '../lib/passes'

export default function AdminVisits() {
  return (
    <RequestDesk
      eyebrow="Corporate Communication HSSE"
      title="Port visits"
      description="Visit requests arrive here for Corporate Communication HSSE. Approval sets the barcode lifetime to the visit dates."
      passKind="visit"
      exportName="bact-visit"
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
      resendApproval={(id) => resendPassEmail('visit', id)}
      exportRows={(rows) => ({
        headers: ['Ref', 'Lifetime', 'Name', 'Company', 'Email', 'Phone', 'Purpose', 'Start', 'End', 'Valid until', 'Declaration', 'Briefing'],
        rows: rows.map((row) => [
          row.ref_no,
          `${phaseLabel(passPhase(row))} · ${remainingLabel(row)}`,
          row.visitor_name,
          row.company,
          row.applicant_email,
          row.phone,
          row.purpose,
          row.visit_start,
          row.visit_end,
          formatJakarta(row.valid_until),
          row.declaration_accepted ? 'Yes' : 'No',
          row.safety_induction ? 'Yes' : 'No',
        ]),
      })}
      renderFacts={(row) => (
        <>
          <Fact label="Company" value={row.company} />
          <Fact label="Email" value={row.applicant_email} />
          <Fact label="Phone" value={row.phone} />
          <Fact label="Purpose" value={row.purpose} />
          <Fact label="Dates" value={`${row.visit_start} – ${row.visit_end}`} />
          <Fact label="Declaration" value={row.declaration_accepted ? 'Safety & ISPS accepted' : 'No'} />
          <Fact label="Safety briefing" value={row.safety_induction ? 'Acknowledged' : 'No'} />
          <Fact label="Routed to" value={row.route_to} />
          <Fact label="Valid until" value={row.valid_until ? formatJakarta(row.valid_until) : 'Set on approval'} />
          <IdPhoto label="KTP" url={row.ktp_url} />
          <IdPhoto label="Passport" url={row.passport_url} />
        </>
      )}
    />
  )
}

function IdPhoto({ label, url }) {
  if (!url) return null
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1">
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt={label} className="max-h-44 w-full rounded-xl border border-slate-700 object-cover" />
        </a>
      </dd>
    </div>
  )
}
