import { buildSummary5W1H } from '../lib/investigation'

const W5H1_FIELDS = [
  { key: 'what', label: 'WHAT — What is the main incident / potential hazard?' },
  { key: 'where', label: 'WHERE — Specific location and area vulnerability?' },
  { key: 'when', label: 'WHEN — When did it happen, and when was the last supervision?' },
  { key: 'why', label: 'WHY — Why did the hazard appear without being detected?' },
  { key: 'how', label: 'HOW — How did the hazard develop until Stop Work / escalation?' },
]

const WHY_FIELDS = [
  { key: 'why1', label: 'Why 1 (Field symptom)' },
  { key: 'why2', label: 'Why 2 (Inspection failure)' },
  { key: 'why3', label: 'Why 3 (Procedure / individual failure)' },
  { key: 'why4', label: 'Why 4 (Supervision & control failure)' },
  { key: 'why5', label: 'Why 5 (Main / systemic root cause)' },
]

export default function InvestigationForm({ data, onChange, disabled }) {
  function setField(key, value) {
    const next = { ...data, [key]: value }
    if (['what', 'where', 'when', 'why', 'how'].includes(key)) {
      next.summary_5w1h = buildSummary5W1H(next)
    }
    onChange(next)
  }

  return (
    <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">1. Root cause analysis (5W + 1H)</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Map the facts and identify failures — same format for every HSE officer.
          </p>
        </div>
        {W5H1_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">{f.label}</span>
            <textarea
              rows={2}
              value={data[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="admin-input"
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">
            5W+1H summary (result sentence)
          </span>
          <textarea
            rows={3}
            value={data.summary_5w1h || ''}
            onChange={(e) => setField('summary_5w1h', e.target.value)}
            className="admin-input"
            placeholder="Filled from the fields above — you can edit it."
          />
        </label>
      </section>

      <section className="space-y-3 border-t border-slate-800 pt-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">2. Deep dive (5 Whys)</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Five levels until the management / system root cause.
          </p>
        </div>
        {WHY_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">{f.label}</span>
            <textarea
              rows={2}
              value={data[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              className="admin-input"
            />
          </label>
        ))}
      </section>

      <section className="space-y-3 border-t border-slate-800 pt-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Root cause</span>
          <textarea
            rows={3}
            value={data.root_cause || ''}
            onChange={(e) => setField('root_cause', e.target.value)}
            className="admin-input"
            placeholder="Systemic root-cause conclusion…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Corrective action</span>
          <textarea
            rows={3}
            value={data.corrective_action || ''}
            onChange={(e) => setField('corrective_action', e.target.value)}
            className="admin-input"
            placeholder="Agreed corrective action…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-400">Investigator name</span>
          <input
            type="text"
            value={data.investigator_name || ''}
            onChange={(e) => setField('investigator_name', e.target.value)}
            className="admin-input"
            placeholder="HSE officer who investigated"
          />
        </label>
      </section>
    </fieldset>
  )
}
