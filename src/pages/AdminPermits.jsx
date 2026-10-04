import RequestDesk, { Fact } from '../components/admin/RequestDesk'
import { approveWorkPermit, formatJakarta, listWorkPermits, permitKindLabel, rejectWorkPermit } from '../lib/passes'

export default function AdminPermits() {
  return (
    <RequestDesk
      eyebrow="Permit to Work"
      title="Work permits"
      description="Job Permit is valid for 14 days after approval. E-Permit to Work is valid for 12 hours. The barcode shows HSSE approval and the lifetime."
      loader={async () => {
        const rows = await listWorkPermits()
        return rows.map((row) => ({
          ...row,
          heading: row.applicant_name,
          sub: `${permitKindLabel(row.permit_kind)} · ${row.company} · ${row.area}`,
        }))
      }}
      approve={approveWorkPermit}
      reject={rejectWorkPermit}
      renderFacts={(row) => (
        <>
          <Fact label="Type" value={permitKindLabel(row.permit_kind)} />
          <Fact label="Company" value={row.company} />
          <Fact label="Phone" value={row.phone} />
          <Fact label="Department" value={row.department} />
          <Fact label="Area" value={row.area} />
          <Fact label="Work type" value={(row.work_types || []).join(', ')} />
          <Fact label="Start" value={formatJakarta(row.start_at)} />
          <Fact label="Description" value={row.description} />
          <Fact label="People" value={row.persons} />
          <Fact label="Safety induction" value={row.safety_induction ? 'Yes' : 'No'} />
          <Fact label="Valid until" value={row.valid_until ? formatJakarta(row.valid_until) : 'Set on approval'} />
        </>
      )}
    />
  )
}
