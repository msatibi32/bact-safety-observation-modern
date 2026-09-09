import { categoryLabel, isUnclassifiedObservation } from './constants'
import { buildSummary5W1H, parseInvestigationData } from './investigation'

function fmtDateLongId(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fmtDateLongEn(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtTimeWib(d) {
  return (
    new Date(d).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' WIB'
  )
}

function riskPhraseId(level) {
  if (level === 'High') return 'Tinggi (High)'
  if (level === 'Medium') return 'Sedang (Medium)'
  if (level === 'Low') return 'Rendah (Low)'
  return 'belum diklasifikasi'
}

function riskPhraseEn(level) {
  if (level === 'High' || level === 'Medium' || level === 'Low') return level
  return 'not yet classified'
}

function companyOf(obs) {
  return obs.nama_perusahaan || 'PT. BACT'
}

function reporterOf(obs) {
  if (obs.is_anonymous) return { id: 'seorang pelapor anonim', en: 'an anonymous reporter' }
  const name = obs.nama_pelapor || '—'
  return { id: `Saudara/i ${name}`, en: `Mr/Ms ${name}` }
}

function buildActionsId(obs) {
  const actions = []
  if (obs.stop_work) {
    actions.push('Melaksanakan Stop Work Authority dan menghentikan sementara aktivitas di area terkait hingga kondisi dinyatakan aman.')
  }
  if (obs.triage_notes) {
    actions.push(`Melakukan triage awal oleh petugas HSSE: ${obs.triage_notes}`)
  }
  if (obs.finding_observation) {
    actions.push(`Mencatat finding observasi: ${obs.finding_observation}`)
  }
  if (obs.rekomendasi) {
    actions.push(`Menyampaikan rekomendasi tindak lanjut: ${obs.rekomendasi}`)
  }
  if (obs.pic_assigned) {
    actions.push(`Menugaskan departemen follow-up: ${obs.pic_assigned}.`)
  }
  if (obs.catatan_penutupan) {
    actions.push(`Catatan penutupan: ${obs.catatan_penutupan}`)
  }
  if (obs.requires_investigation || obs.investigation_data) {
    actions.push('Mengangkat kasus ke tahap investigasi mendalam (5W+1H dan 5 Whys) sesuai prosedur HSSE.')
  }
  if (!actions.length) {
    actions.push('Mencatat observasi pada sistem Safety Observation Card (SOC) digital untuk ditindaklanjuti Tim HSSE.')
    actions.push('Memberikan penguatan awareness keselamatan kepada pihak terkait di area operasional.')
  }
  return actions
}

function buildActionsEn(obs) {
  const actions = []
  if (obs.stop_work) {
    actions.push('Exercised Stop Work Authority and temporarily suspended related activities until the area was declared safe.')
  }
  if (obs.triage_notes) {
    actions.push(`Conducted initial HSSE triage: ${obs.triage_notes}`)
  }
  if (obs.finding_observation) {
    actions.push(`Recorded observation finding: ${obs.finding_observation}`)
  }
  if (obs.rekomendasi) {
    actions.push(`Issued follow-up recommendation: ${obs.rekomendasi}`)
  }
  if (obs.pic_assigned) {
    actions.push(`Assigned follow-up department: ${obs.pic_assigned}.`)
  }
  if (obs.catatan_penutupan) {
    actions.push(`Closing notes: ${obs.catatan_penutupan}`)
  }
  if (obs.requires_investigation || obs.investigation_data) {
    actions.push('Escalated the case to a formal investigation (5W+1H and 5 Whys) per HSSE procedure.')
  }
  if (!actions.length) {
    actions.push('Recorded the observation in the digital Safety Observation Card (SOC) system for HSSE follow-up.')
    actions.push('Reinforced safety awareness to the parties concerned in the operational area.')
  }
  return actions
}

/** Narasi padat gaya Notice of Safety Violation (template profesional, tanpa API AI). */
export function buildSocNarrativeId(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const rep = reporterOf(obs)
  const dept = obs.departemen ? `, Departemen ${obs.departemen}` : ''
  const unclassified = isUnclassifiedObservation(obs)
  const cat = categoryLabel(obs.kategori)
  const risk = riskPhraseId(obs.tingkat_risiko)

  const p1 = `Pada tanggal ${fmtDateLongId(when)}, sekitar pukul ${fmtTimeWib(when)}, ${rep.id} dari ${companyOf(obs)}${dept} dilaporkan terkait observasi keselamatan di area ${obs.lokasi_teks || '—'}. Adapun uraian kejadian sebagai berikut: ${obs.deskripsi || '—'}`

  const p2 = unclassified
    ? `Observasi ini telah dicatat dalam sistem Safety Observation Card (SOC) Batu Ampar Container Terminal dan menunggu klasifikasi kategori serta tingkat risiko oleh Tim HSSE.`
    : `Berdasarkan penilaian Tim HSSE, observasi ini diklasifikasikan sebagai ${cat} dengan tingkat risiko ${risk}.${obs.is_hipo ? ' Kasus ini juga dikategorikan sebagai HiPo (High Potential) yang memerlukan perhatian prioritas.' : ''}${obs.stop_work ? ' Pekerjaan di area tersebut telah dihentikan sementara melalui Stop Work Authority demi mencegah eskalasi bahaya.' : ''} Klasifikasi dilakukan sesuai prosedur keselamatan dan manajemen risiko operasional PT. Batu Ampar Container Terminal.`

  const closing =
    'Demikian laporan observasi keselamatan ini disampaikan untuk menjadi perhatian dan ditindaklanjuti sebagaimana mestinya. Kami mengucapkan terima kasih atas kerja sama semua pihak dalam menjaga budaya keselamatan di area terminal.'

  return { intro: p1, classification: p2, actions: buildActionsId(obs), closing }
}

export function buildSocNarrativeEn(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const rep = reporterOf(obs)
  const dept = obs.departemen ? `, ${obs.departemen} Department` : ''
  const unclassified = isUnclassifiedObservation(obs)
  const cat = categoryLabel(obs.kategori)
  const risk = riskPhraseEn(obs.tingkat_risiko)

  const p1 = `On ${fmtDateLongEn(when)}, at approximately ${fmtTimeWib(when)}, ${rep.en} of ${companyOf(obs)}${dept} was subject to a safety observation at ${obs.lokasi_teks || '—'}. The incident is described as follows: ${obs.deskripsi || '—'}`

  const p2 = unclassified
    ? `This observation has been recorded in the Batu Ampar Container Terminal Safety Observation Card (SOC) system and is pending category and risk classification by the HSSE Team.`
    : `Based on the HSSE Team assessment, this observation is classified as ${cat} with a ${risk} risk level.${obs.is_hipo ? ' The case is also categorized as HiPo (High Potential) and requires priority attention.' : ''}${obs.stop_work ? ' Work in the area was temporarily stopped under Stop Work Authority to prevent hazard escalation.' : ''} Classification follows the operational safety and risk management procedures of PT. Batu Ampar Container Terminal.`

  const closing =
    'This safety observation report is submitted for your attention and appropriate follow-up. We thank all parties for their cooperation in maintaining a strong safety culture across the terminal.'

  return { intro: p1, classification: p2, actions: buildActionsEn(obs), closing }
}

export function buildInvestigationNarrative(obs) {
  const inv = parseInvestigationData(obs)
  const when = obs.tanggal_waktu || obs.created_at
  const rep = reporterOf(obs)

  const ringkasanId = `Investigasi dilaksanakan terhadap laporan SOC terkait observasi di ${obs.lokasi_teks || '—'} pada ${fmtDateLongId(when)} yang melibatkan ${rep.id} (${companyOf(obs)}). Deskripsi awal pelapor: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority telah diterapkan di lapangan.' : ''}`

  const ringkasanEn = `An investigation was conducted on the SOC report concerning an observation at ${obs.lokasi_teks || '—'} on ${fmtDateLongEn(when)} involving ${rep.en} (${companyOf(obs)}). Initial reporter description: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority had been applied on site.' : ''}`

  const summary5 = inv.summary_5w1h || buildSummary5W1H(inv)

  return {
    ringkasanId,
    ringkasanEn,
    inv,
    summary5,
    finding: obs.finding_observation || '',
    recommendation: obs.rekomendasi || '',
    investigator: inv.investigator_name || obs.investigator_name || 'Tim HSSE',
  }
}
