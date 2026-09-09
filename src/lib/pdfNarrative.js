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
    day: 'numeric',
    month: 'long',
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

function companyOf(obs) {
  return obs.nama_perusahaan || 'PT. BACT'
}

function personId(obs) {
  if (obs.is_anonymous) return 'seorang pelapor anonim'
  return `Saudara/i ${obs.nama_pelapor || '—'}`
}

function personEn(obs) {
  if (obs.is_anonymous) return 'an anonymous reporter'
  return `Mr/Ms ${obs.nama_pelapor || '—'}`
}

function deptId(obs) {
  return obs.departemen ? ` (${obs.departemen})` : ''
}

function deptEn(obs) {
  return obs.departemen ? ` (${obs.departemen} Department)` : ''
}

function classificationId(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'Observasi ini telah dicatat pada sistem Safety Observation Card (SOC) dan menunggu klasifikasi resmi oleh Tim HSSE Batu Ampar Container Terminal.'
  }
  const cat = categoryLabel(obs.kategori)
  const risk =
    obs.tingkat_risiko === 'High'
      ? 'Tinggi (High)'
      : obs.tingkat_risiko === 'Medium'
        ? 'Sedang (Medium)'
        : obs.tingkat_risiko === 'Low'
          ? 'Rendah (Low)'
          : obs.tingkat_risiko
  let s = `Temuan ini diklasifikasikan sebagai ${cat} dengan tingkat risiko ${risk} sesuai prosedur keselamatan dan manajemen risiko operasional PT. Batu Ampar Container Terminal.`
  if (obs.is_hipo) s += ' Kasus ini juga dikategorikan sebagai HiPo (High Potential).'
  if (obs.stop_work) {
    s +=
      ' Sehubungan dengan potensi bahaya tersebut, Stop Work Authority telah diterapkan di area terkait hingga kondisi dinyatakan aman.'
  }
  return s
}

function classificationEn(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'This observation has been recorded in the Safety Observation Card (SOC) system and is pending official classification by the Batu Ampar Container Terminal HSSE Team.'
  }
  const cat = categoryLabel(obs.kategori)
  let s = `This finding has been classified as ${cat} with a ${obs.tingkat_risiko} risk level in accordance with the operational safety and risk management procedures of PT. Batu Ampar Container Terminal.`
  if (obs.is_hipo) s += ' The case is also categorized as HiPo (High Potential).'
  if (obs.stop_work) {
    s +=
      ' Due to the associated hazard potential, Stop Work Authority was applied in the related area until conditions were declared safe.'
  }
  return s
}

/** Actions: selalu 3 poin profesional gaya Notice (isi dari data bila ada). */
export function buildNoticeActions(obs) {
  const id = []
  const en = []

  if (obs.stop_work) {
    id.push(
      'Melaksanakan Stop Work Authority dan menghentikan sementara aktivitas di area terkait hingga kondisi dinyatakan aman oleh Tim HSSE.',
    )
    en.push(
      'Exercised Stop Work Authority and temporarily suspended related activities until the area was declared safe by the HSSE Team.',
    )
  }

  id.push(
    obs.finding_observation
      ? `Mencatat temuan observasi pada sistem SOC digital: ${obs.finding_observation}`
      : 'Mencatat kejadian pada sistem Safety Observation Card (SOC) digital HSSE untuk ditindaklanjuti.',
  )
  en.push(
    obs.finding_observation
      ? `Recorded the observation finding in the digital SOC system: ${obs.finding_observation}`
      : 'Recorded the incident in the HSSE digital Safety Observation Card (SOC) system for follow-up.',
  )

  if (obs.rekomendasi) {
    id.push(`Memberikan penguatan awareness dan rekomendasi: ${obs.rekomendasi}`)
    en.push(`Provided safety awareness reinforcement and recommendation: ${obs.rekomendasi}`)
  } else if (obs.triage_notes) {
    id.push(`Melakukan triage awal HSSE: ${obs.triage_notes}`)
    en.push(`Conducted initial HSSE triage: ${obs.triage_notes}`)
  } else {
    id.push(
      'Memberikan penguatan awareness keselamatan kepada pihak terkait mengenai kepatuhan terhadap peraturan keselamatan yang berlaku di area terminal.',
    )
    en.push(
      'Provided safety awareness reinforcement to the parties concerned regarding compliance with applicable terminal safety regulations.',
    )
  }

  if (obs.pic_assigned && id.length < 4) {
    id.push(`Menugaskan departemen follow-up: ${obs.pic_assigned}.`)
    en.push(`Assigned follow-up department: ${obs.pic_assigned}.`)
  }

  if (obs.requires_investigation || obs.investigation_data) {
    id.push(
      'Mengangkat kasus ke tahap investigasi mendalam (analisis 5W+1H dan 5 Whys) sesuai prosedur HSSE.',
    )
    en.push(
      'Escalated the case to a formal investigation (5W+1H and 5 Whys analysis) in accordance with HSSE procedure.',
    )
  }

  return { id: id.slice(0, 4), en: en.slice(0, 4) }
}

/**
 * Narasi SOC gaya Notice of Safety Violation — formal, padat, paralel ID/EN.
 */
export function buildSocNarrativeId(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const intro = `Dengan ini kami sampaikan bahwa pada tanggal ${fmtDateLongId(when)} pukul ${fmtTimeWib(when)}, ${personId(obs)} dari ${companyOf(obs)}${deptId(obs)} teridentifikasi terkait observasi keselamatan di area ${obs.lokasi_teks || 'Batu Ampar Container Terminal'}. Adapun uraian kejadian sebagai berikut: ${obs.deskripsi || '—'}`

  const closing =
    'Pemberitahuan ini disampaikan untuk menjadi perhatian agar seluruh personel senantiasa mematuhi persyaratan keselamatan yang berlaku di Batu Ampar Container Terminal. Terima kasih atas perhatian dan kerja samanya.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classificationId(obs), actions: actions.id, closing }
}

export function buildSocNarrativeEn(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const intro = `We hereby inform you that on ${fmtDateLongEn(when)} at ${fmtTimeWib(when)}, ${personEn(obs)} from ${companyOf(obs)}${deptEn(obs)} was identified in connection with a safety observation at ${obs.lokasi_teks || 'Batu Ampar Container Terminal'}. The incident is described as follows: ${obs.deskripsi || '—'}`

  const closing =
    'This notification is issued for your information and attention to ensure that all personnel continue to comply with the applicable safety requirements at Batu Ampar Container Terminal. Thank you for your attention and cooperation.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classificationEn(obs), actions: actions.en, closing }
}

export function buildInvestigationNarrative(obs) {
  const inv = parseInvestigationData(obs)
  const when = obs.tanggal_waktu || obs.created_at

  return {
    ringkasanId: `Dengan ini kami sampaikan hasil investigasi atas laporan SOC terkait observasi di ${obs.lokasi_teks || '—'} pada tanggal ${fmtDateLongId(when)} yang melibatkan ${personId(obs)} dari ${companyOf(obs)}. Uraian awal: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority telah diterapkan di lapangan.' : ''}`,
    ringkasanEn: `We hereby submit the investigation findings for the SOC report concerning an observation at ${obs.lokasi_teks || '—'} on ${fmtDateLongEn(when)} involving ${personEn(obs)} from ${companyOf(obs)}. Initial description: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority had been applied on site.' : ''}`,
    inv,
    summary5: inv.summary_5w1h || buildSummary5W1H(inv),
    finding: obs.finding_observation || '',
    recommendation: obs.rekomendasi || '',
    investigator: inv.investigator_name || obs.investigator_name || 'Tim HSSE',
  }
}
