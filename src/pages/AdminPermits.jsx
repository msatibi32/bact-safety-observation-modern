import { useState } from 'react'
import RequestDesk, { Fact } from '../components/admin/RequestDesk'
import PermitDetails from '../components/ptw/PermitDetails'
import PermitReviewModal from '../components/ptw/PermitReviewModal'
import {
  approveWorkPermit,
  approveWorkPermitSpv,
  durationLabel,
  formatJakarta,
  listWorkPermits,
  permitKindLabel,
  phaseLabel,
  passPhase,
  rejectWorkPermit,
  remainingLabel,
  resendPassEmail,
  WORK_TYPES,
} from '../lib/passes'

const FACETS = [
  {
    id: 'kind',
    options: [
      { id: 'all', label: 'All types' },
      { id: '12h', label: '12 jam' },
      { id: '7d', label: '7 hari' },
    ],
    match: (row, id) => id === 'all' || (row.hsse_duration_choice || row.duration_choice) === id,
  },
  {
    id: 'work',
    options: [{ id: 'all', label: 'All work' }, ...WORK_TYPES.map((type) => ({ id: type, label: type }))],
    match: (row, id) => id === 'all' || (row.work_types || []).includes(id),
  },
]

export default function AdminPermits() {
  const [review, setReview] = useState(null)

  return (
    <>
    <RequestDesk
      eyebrow="Permit to Work"
      title="Work permits"
      description="Satu izin kerja. Area authority memilih 12 jam atau 7 hari. HSSE boleh mengubah durasi, wajib dengan alasan yang terlihat."
      chooseDuration
      passKind="ptw"
      facets={FACETS}
      exportName="bact-ptw"
      loader={async () => {
        const rows = await listWorkPermits()
        return rows.map((row) => ({
          ...row,
          heading: row.applicant_name,
          sub: `${permitKindLabel(row.permit_kind)} · ${row.company} · ${row.area}`,
        }))
      }}
      approve={approveWorkPermit}
      spvApprove={approveWorkPermitSpv}
      reject={rejectWorkPermit}
      resendApproval={(id) => resendPassEmail('ptw', id)}
      tools={(row, api) => (
        <button
          type="button"
          onClick={() => setReview({ row, patchRow: api.patchRow })}
          className="w-full rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-brand-500"
        >
          Preview & edit PDF
        </button>
      )}
      exportRows={(rows) => ({
        headers: ['Ref', 'Lifetime', 'Type', 'Name', 'Company', 'Email', 'Phone', 'Department', 'Area', 'Work', 'Start', 'Valid until', 'Description'],
        rows: rows.map((row) => [
          row.ref_no,
          `${phaseLabel(passPhase(row))} · ${remainingLabel(row)}`,
          permitKindLabel(row.permit_kind),
          row.applicant_name,
          row.company,
          row.applicant_email,
          row.phone,
          row.department,
          row.area,
          (row.work_types || []).join(', '),
          formatJakarta(row.start_at),
          formatJakarta(row.valid_until),
          row.description,
        ]),
      })}
      renderFacts={(row) => (
        <>
          <Fact label="Type" value={permitKindLabel(row.permit_kind)} />
          <Fact label="Durasi supervisor" value={durationLabel(row.duration_choice)} />
          <Fact label="Durasi HSSE" value={row.hsse_duration_choice ? durationLabel(row.hsse_duration_choice) : '—'} />
          {row.hsse_duration_reason ? <Fact label="Alasan ubah durasi" value={row.hsse_duration_reason} /> : null}
          <Fact label="Company" value={row.company} />
          <Fact label="Email" value={row.applicant_email} />
          <Fact label="Phone" value={row.phone} />
          <Fact label="Department" value={row.department} />
          <Fact label="Area" value={row.area} />
          <Fact label="Work type" value={(row.work_types || []).join(', ')} />
          <Fact label="Start" value={formatJakarta(row.start_at)} />
          <Fact label="Description" value={row.description} />
          <Fact label="People" value={row.persons} />
          <Fact label="Safety induction" value={row.safety_induction ? 'Yes' : 'No'} />
          <Fact label="Valid until" value={row.valid_until ? formatJakarta(row.valid_until) : 'Set on approval'} />
          <PermitDetails details={row.details} />
        </>
      )}
    />
    {review && (
      <PermitReviewModal
        permit={review.row}
        onClose={() => setReview(null)}
        onSaved={(next) => {
          const card = {
            ...next,
            heading: next.applicant_name,
            sub: `${permitKindLabel(next.permit_kind)} · ${next.company} · ${next.area}`,
          }
          review.patchRow(card.id, card)
          setReview((current) => (current ? { ...current, row: card } : current))
        }}
      />
    )}
    </>
  )
}
