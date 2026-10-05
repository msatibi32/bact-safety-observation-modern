import { CONTROLS, HAZARDS, PPE_ITEMS, PTW_SECTIONS, labelFor } from '../../lib/ptwForm'

export default function PermitDetails({ details }) {
  if (!details || typeof details !== 'object' || !details.sections) return null
  const open = new Set(details.sections)
  const hazards = (details.hazards || []).map((id) => labelFor(HAZARDS, id))
  const controls = (details.controls || []).map((id) => labelFor(CONTROLS, id))
  const ppe = (details.ppe || []).map((id) => labelFor(PPE_ITEMS, id))

  return (
    <div className="space-y-3 border-t border-slate-800 pt-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">Lembar permit</p>
      <p className="text-sm text-slate-200">
        {PTW_SECTIONS.filter((section) => open.has(section.id))
          .map((section) => `${section.no}. ${section.titleId}`)
          .join(' · ')}
      </p>
      {hazards.length > 0 && <Line label="Bahaya" value={joinExtra(hazards, details.hazard_other)} />}
      {controls.length > 0 && <Line label="Kontrol" value={joinExtra(controls, [details.jsa_no && `JSA ${details.jsa_no}`, details.control_other].filter(Boolean).join(', '))} />}
      {ppe.length > 0 && <Line label="APD" value={ppe.join(', ')} />}
      {(details.activities || []).map((row, index) => (
        <Line key={index} label={`Aktivitas ${index + 1}`} value={[row.activity, row.tool, row.hazard, row.action].filter(Boolean).join(' · ')} />
      ))}
      {details.isolation && (
        <Line
          label="Isolasi"
          value={[
            details.isolation.mechanical_cert && `Mekanik ${details.isolation.mechanical_cert}`,
            details.isolation.electrical_cert && `Listrik ${details.isolation.electrical_cert}`,
            details.isolation.loto_location,
          ].filter(Boolean).join(' · ')}
        />
      )}
      {details.gas?.tester_name && (
        <Line
          label="Tes gas"
          value={[
            details.gas.tester_name,
            details.gas.position,
            ...(details.gas.readings || []).map((row) => [row.time, row.lel && `LEL ${row.lel}`, row.o2 && `O2 ${row.o2}`, row.toxic && `Toxic ${row.toxic}`].filter(Boolean).join(' ')),
          ].filter(Boolean).join(' · ')}
        />
      )}
      {details.approvals?.nominated_person && <Line label="Nominasi" value={details.approvals.nominated_person} />}
      {details.approvals?.area_authority && <Line label="Otoritas area" value={details.approvals.area_authority} />}
      {(details.people || []).length > 0 && <Line label="Personil" value={details.people.join(', ')} />}
      {details.deisolation?.status && (
        <Line
          label="Buka isolasi"
          value={`${details.deisolation.status === 'complete' ? 'Selesai' : 'Belum selesai'}${details.deisolation.signer ? ` · ${details.deisolation.signer}` : ''}`}
        />
      )}
    </div>
  )
}

function joinExtra(items, extra) {
  return extra ? `${items.join(', ')} (${extra})` : items.join(', ')
}

function Line({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  )
}
