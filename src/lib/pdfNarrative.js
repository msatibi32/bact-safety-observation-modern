/**
 * Narasi PDF — notice HSSE terminal (padat & formal).
 * Metodologi 5W+1H / 5 Whys tetap di data internal; di PDF tidak disebut eksplisit.
 */

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
  return new Date(d).toLocaleDateString('en-GB', {
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
  let s = `Temuan ini diklasifikasikan sebagai ${cat} dengan tingkat risiko ${risk} sesuai prosedur keselamatan operasional Batu Ampar Container Terminal.`
  if (obs.is_hipo) s += ' Kasus ini dikategorikan sebagai HiPo (High Potential).'
  if (obs.stop_work) {
    s +=
      ' Stop Work Authority telah diterapkan di area terkait hingga kondisi dinyatakan aman.'
  }
  return s
}

function classificationEn(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'This observation has been recorded in the Safety Observation Card (SOC) system and is pending official classification by the Batu Ampar Container Terminal HSSE Team.'
  }
  const cat = categoryLabel(obs.kategori)
  let s = `This finding has been classified as ${cat} with a ${obs.tingkat_risiko} risk level under Batu Ampar Container Terminal operational safety procedures.`
  if (obs.is_hipo) s += ' The case is categorized as HiPo (High Potential).'
  if (obs.stop_work) {
    s +=
      ' Stop Work Authority was applied in the related area until conditions were declared safe.'
  }
  return s
}

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
    id.push(`Menyampaikan rekomendasi tindak lanjut: ${obs.rekomendasi}`)
    en.push(`Issued the following recommendation: ${obs.rekomendasi}`)
  } else if (obs.triage_notes) {
    id.push(`Melakukan triage awal HSSE: ${obs.triage_notes}`)
    en.push(`Conducted initial HSSE triage: ${obs.triage_notes}`)
  } else {
    id.push(
      'Memberikan pengarahan keselamatan kepada pihak terkait di lokasi terkait kepatuhan terhadap peraturan operasional terminal.',
    )
    en.push(
      'Provided an on-site safety briefing to the parties concerned regarding compliance with terminal operational rules.',
    )
  }

  if (obs.pic_assigned) {
    id.push(`Menugaskan departemen follow-up: ${obs.pic_assigned}.`)
    en.push(`Assigned follow-up to: ${obs.pic_assigned}.`)
  }

  if (obs.requires_investigation || obs.investigation_data) {
    id.push('Kasus dilanjutkan ke tahap investigasi formal sesuai prosedur HSSE.')
    en.push('The case was escalated to a formal investigation under HSSE procedure.')
  }

  return { id: id.slice(0, 4), en: en.slice(0, 4) }
}

export function buildSocNarrativeId(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const intro = `Dengan ini kami sampaikan bahwa pada tanggal ${fmtDateLongId(when)} pukul ${fmtTimeWib(when)}, ${personId(obs)} dari ${companyOf(obs)}${deptId(obs)} teridentifikasi terkait observasi keselamatan di area ${obs.lokasi_teks || 'Batu Ampar Container Terminal'}. Adapun uraian kejadian sebagai berikut: ${obs.deskripsi || '—'}`

  const closing =
    'Pemberitahuan ini disampaikan untuk menjadi perhatian agar seluruh personel mematuhi persyaratan keselamatan operasional di Batu Ampar Container Terminal. Terima kasih atas perhatian dan kerja samanya.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classificationId(obs), actions: actions.id, closing }
}

export function buildSocNarrativeEn(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const intro = `We hereby inform you that on ${fmtDateLongEn(when)} at ${fmtTimeWib(when)}, ${personEn(obs)} from ${companyOf(obs)}${deptEn(obs)} was identified in connection with a safety observation at ${obs.lokasi_teks || 'Batu Ampar Container Terminal'}. The incident is described as follows: ${obs.deskripsi || '—'}`

  const closing =
    'This notice is issued for your attention to ensure continued compliance with operational safety requirements at Batu Ampar Container Terminal. Thank you for your attention and cooperation.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classificationEn(obs), actions: actions.en, closing }
}

export function investigationFallbacks(obs) {
  const loc = obs.lokasi_teks || 'area kerja'
  const desc = obs.deskripsi || 'kondisi/tindakan tidak aman'
  return {
    natureId: `Sifat kejadian: observasi di ${loc} — ${desc}`,
    natureEn: `Nature of occurrence: observation at ${loc} — ${desc}`,
    locationId: `Lokasi: ${loc}, area operasional bongkar muat Batu Ampar Container Terminal.`,
    locationEn: `Location: ${loc}, cargo-handling operational area of Batu Ampar Container Terminal.`,
    timeId: `Waktu: dilaporkan pada ${fmtDateLongId(obs.tanggal_waktu || obs.created_at)}, pukul ${fmtTimeWib(obs.tanggal_waktu || obs.created_at)}.`,
    timeEn: `Time: reported on ${fmtDateLongEn(obs.tanggal_waktu || obs.created_at)} at ${fmtTimeWib(obs.tanggal_waktu || obs.created_at)}.`,
    factorsId:
      'Faktor penyebab langsung: pengendalian di lokasi (pengawasan, APD, atau prosedur kerja) belum mencegah kondisi tersebut.',
    factorsEn:
      'Immediate contributing factors: site controls (supervision, PPE, or work procedure) did not prevent the condition.',
    sequenceId: obs.stop_work
      ? 'Urutan kejadian: kondisi berlanjut hingga Stop Work diterapkan agar pekerjaan tidak dilanjutkan dalam keadaan tidak aman.'
      : 'Urutan kejadian: teridentifikasi melalui pelaporan SOC sebelum berkembang menjadi insiden lebih berat.',
    sequenceEn: obs.stop_work
      ? 'Sequence of events: the condition continued until Stop Work was applied so work would not proceed unsafely.'
      : 'Sequence of events: identified through the SOC report before developing into a more serious incident.',
    cause1Id: `Temuan lapangan: ${desc}.`,
    cause1En: `Field finding: ${desc}.`,
    cause2Id: 'Pemeriksaan atau pengawasan shift tidak menangkap penyimpangan lebih awal.',
    cause2En: 'Shift inspection or supervision did not identify the deviation earlier.',
    cause3Id: 'SOP atau disiplin kerja di titik tersebut belum dijalankan secara penuh.',
    cause3En: 'SOP or work discipline at that point was not fully applied.',
    cause4Id: 'Kontrol pengawas area atau mitra terhadap praktik di lokasi masih longgar.',
    cause4En: 'Area supervisor or contractor control of on-site practice remained weak.',
    cause5Id: 'Penegakan standar keselamatan operasional di titik ini belum konsisten.',
    cause5En: 'Enforcement of operational safety standards at this point was not consistent.',
    rootId: 'Pengawasan dan kepatuhan prosedur di area operasional belum memadai.',
    rootEn: 'Supervision and procedure compliance in the operational area were inadequate.',
    caId: 'Briefing ulang di lokasi, perketat pengawasan shift, pastikan APD dan SOP dipatuhi, serta verifikasi sebelum kerja dilanjutkan.',
    caEn: 'Re-brief on site, tighten shift supervision, enforce PPE and SOP, and verify before work resumes.',
    recId: 'Lakukan patrol berkala di area sejenis dan tinjau ulang kontrol operasional agar kejadian tidak berulang.',
    recEn: 'Conduct periodic patrols in similar areas and review operational controls to prevent recurrence.',
  }
}

export function buildInvestigationNarrative(obs) {
  const inv = parseInvestigationData(obs)
  const when = obs.tanggal_waktu || obs.created_at
  const fb = investigationFallbacks(obs)

  return {
    ringkasanId: `Dengan ini kami sampaikan hasil investigasi atas laporan SOC terkait observasi di ${obs.lokasi_teks || '—'} pada tanggal ${fmtDateLongId(when)} yang melibatkan ${personId(obs)} dari ${companyOf(obs)}. Uraian awal: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority telah diterapkan di lapangan.' : ''}`,
    ringkasanEn: `We hereby submit the investigation findings for the SOC report concerning an observation at ${obs.lokasi_teks || '—'} on ${fmtDateLongEn(when)} involving ${personEn(obs)} from ${companyOf(obs)}. Initial description: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority had been applied on site.' : ''}`,
    inv,
    summary5: inv.summary_5w1h || buildSummary5W1H(inv),
    finding: obs.finding_observation || '',
    recommendation: obs.rekomendasi || '',
    investigator: inv.investigator_name || obs.investigator_name || 'HSSE',
    fb,
  }
}
