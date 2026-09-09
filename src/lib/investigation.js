/** Struktur investigasi HSE: 5W+1H + 5 Whys (JSON di investigation_data / fallback notes). */

export const emptyInvestigation = () => ({
  what: '',
  where: '',
  when: '',
  why: '',
  how: '',
  summary_5w1h: '',
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  root_cause: '',
  corrective_action: '',
  investigator_name: '',
})

export function buildSummary5W1H(data) {
  const parts = []
  if (data.what) parts.push(`Apa: ${data.what}`)
  if (data.where) parts.push(`Di mana: ${data.where}`)
  if (data.when) parts.push(`Kapan: ${data.when}`)
  if (data.why) parts.push(`Mengapa muncul: ${data.why}`)
  if (data.how) parts.push(`Bagaimana berkembang: ${data.how}`)
  if (!parts.length) return ''
  return parts.join('. ') + '.'
}

export function parseInvestigationData(obs) {
  const raw = obs?.investigation_data
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...emptyInvestigation(), ...raw }
  }
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      return { ...emptyInvestigation(), ...JSON.parse(raw) }
    } catch {
      /* fall through */
    }
  }
  // Legacy: plain text di investigation_notes / root_cause
  const base = emptyInvestigation()
  if (obs?.investigation_notes && !obs.investigation_notes.trim().startsWith('{')) {
    base.what = obs.investigation_notes
  }
  if (obs?.root_cause) base.root_cause = obs.root_cause
  return base
}

export function hasInvestigationContent(data) {
  if (!data) return false
  return Boolean(
    data.what ||
      data.where ||
      data.when ||
      data.why ||
      data.how ||
      data.why1 ||
      data.root_cause ||
      data.corrective_action ||
      data.investigator_name,
  )
}

export function investigationPlainSummary(data) {
  const d = data || emptyInvestigation()
  const lines = []
  if (d.summary_5w1h || buildSummary5W1H(d)) {
    lines.push(d.summary_5w1h || buildSummary5W1H(d))
  }
  if (d.why1) lines.push(`Why 1: ${d.why1}`)
  if (d.why2) lines.push(`Why 2: ${d.why2}`)
  if (d.why3) lines.push(`Why 3: ${d.why3}`)
  if (d.why4) lines.push(`Why 4: ${d.why4}`)
  if (d.why5) lines.push(`Why 5: ${d.why5}`)
  if (d.root_cause) lines.push(`Root cause: ${d.root_cause}`)
  if (d.corrective_action) lines.push(`Corrective action: ${d.corrective_action}`)
  if (d.investigator_name) lines.push(`Investigator: ${d.investigator_name}`)
  return lines.join('\n')
}
