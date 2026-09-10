/**
 * Narasi PDF SOC / Investigasi — gaya HSSE pelabuhan & stevedoring (bongkar muat).
 * Faktual, ringkas, standar notice internasional. Hindari frasa generik bergaya AI.
 */

import { categoryLabel, isUnclassifiedObservation } from './constants'
import { buildSummary5W1H, parseInvestigationData } from './investigation'

function fmtDateId(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fmtDateEn(d) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function company(obs) {
  return obs.nama_perusahaan || 'PT. BACT'
}

function nameId(obs) {
  if (obs.is_anonymous) return 'pelapor anonim'
  return obs.nama_pelapor || '—'
}

function nameEn(obs) {
  if (obs.is_anonymous) return 'an anonymous reporter'
  return obs.nama_pelapor || '—'
}

function deptBitId(obs) {
  return obs.departemen ? `, ${obs.departemen}` : ''
}

function deptBitEn(obs) {
  return obs.departemen ? `, ${obs.departemen}` : ''
}

function riskId(level) {
  if (level === 'High') return 'tinggi'
  if (level === 'Medium') return 'sedang'
  if (level === 'Low') return 'rendah'
  return null
}

function classLineId(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'Kategori dan tingkat risiko masih menunggu klasifikasi HSSE.'
  }
  const parts = [`Kategori: ${categoryLabel(obs.kategori)}`, `risiko ${riskId(obs.tingkat_risiko) || obs.tingkat_risiko}`]
  if (obs.is_hipo) parts.push('status HiPo')
  if (obs.stop_work) parts.push('Stop Work diterapkan di lokasi')
  return `${parts.join('; ')}.`
}

function classLineEn(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'Category and risk level are pending HSSE classification.'
  }
  const parts = [`Category: ${categoryLabel(obs.kategori)}`, `risk: ${obs.tingkat_risiko}`]
  if (obs.is_hipo) parts.push('HiPo')
  if (obs.stop_work) parts.push('Stop Work applied on site')
  return `${parts.join('; ')}.`
}

/**
 * Actions konkret — bahasa lapangan terminal, bukan “awareness reinforcement”.
 */
export function buildNoticeActions(obs) {
  const id = []
  const en = []

  if (obs.stop_work) {
    id.push('Stop Work di area terkait sampai kondisi dinyatakan aman.')
    en.push('Stop Work in the affected area until cleared safe.')
  }

  id.push('Kejadian dicatat di SOC digital HSSE.')
  en.push('Incident logged in the HSSE digital SOC.')

  if (obs.finding_observation) {
    id.push(`Temuan: ${obs.finding_observation}`)
    en.push(`Finding: ${obs.finding_observation}`)
  }

  if (obs.rekomendasi) {
    id.push(obs.rekomendasi)
    en.push(obs.rekomendasi)
  } else if (obs.triage_notes) {
    id.push(`Triage HSSE: ${obs.triage_notes}`)
    en.push(`HSSE triage: ${obs.triage_notes}`)
  } else {
    id.push('Pihak terkait diberi pengarahan singkat di lokasi.')
    en.push('Parties concerned were briefed on site.')
  }

  if (obs.pic_assigned) {
    id.push(`Follow-up: ${obs.pic_assigned}.`)
    en.push(`Follow-up assigned to ${obs.pic_assigned}.`)
  }

  if (obs.requires_investigation || obs.investigation_data) {
    id.push('Kasus dilanjutkan ke investigasi (5W+1H / 5 Whys).')
    en.push('Case escalated to investigation (5W+1H / 5 Whys).')
  }

  if (obs.catatan_penutupan) {
    id.push(`Penutupan: ${obs.catatan_penutupan}`)
    en.push(`Closure: ${obs.catatan_penutupan}`)
  }

  return { id: id.slice(0, 5), en: en.slice(0, 5) }
}

export function buildSocNarrativeId(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const loc = obs.lokasi_teks || 'area terminal'
  const intro = `Pada ${fmtDateId(when)} pukul ${fmtTime(when)} WIB, ${nameId(obs)} (${company(obs)}${deptBitId(obs)}) dilaporkan terkait observasi keselamatan di ${loc}. Uraian: ${obs.deskripsi || '—'}`

  const closing =
    'Mohon ditindaklanjuti agar ketentuan keselamatan operasional terminal dipatuhi. Terima kasih.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classLineId(obs), actions: actions.id, closing }
}

export function buildSocNarrativeEn(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const loc = obs.lokasi_teks || 'the terminal area'
  const intro = `On ${fmtDateEn(when)} at ${fmtTime(when)} hrs (WIB), ${nameEn(obs)} (${company(obs)}${deptBitEn(obs)}) was reported in a safety observation at ${loc}. Details: ${obs.deskripsi || '—'}`

  const closing =
    'Please follow up to ensure terminal operational safety requirements are observed. Thank you.'

  const actions = buildNoticeActions(obs)
  return { intro, classification: classLineEn(obs), actions: actions.en, closing }
}

/** Fallback investigasi — bahasa operasional yard/quay, bukan konsultan generik. */
export function investigationFallbacks(obs) {
  const loc = obs.lokasi_teks || 'area kerja'
  const desc = obs.deskripsi || 'kondisi/tindakan tidak aman'
  return {
    whatId: `Observasi di ${loc}: ${desc}`,
    whatEn: `Observation at ${loc}: ${desc}`,
    whereId: `${loc}, Batu Ampar Container Terminal (area operasional bongkar muat / yard).`,
    whereEn: `${loc}, Batu Ampar Container Terminal (cargo handling / yard operational area).`,
    whenId: `Dilaporkan ${fmtDateId(obs.tanggal_waktu || obs.created_at)}, pukul ${fmtTime(obs.tanggal_waktu || obs.created_at)} WIB.`,
    whenEn: `Reported ${fmtDateEn(obs.tanggal_waktu || obs.created_at)}, ${fmtTime(obs.tanggal_waktu || obs.created_at)} hrs WIB.`,
    whyId: 'Pengendalian di lokasi (pengawasan, APD, atau prosedur kerja) belum mencegah kondisi tersebut.',
    whyEn: 'Site controls (supervision, PPE, or work procedure) did not prevent the condition.',
    howId: obs.stop_work
      ? 'Kondisi berlanjut hingga Stop Work diterapkan agar pekerjaan tidak dilanjutkan dalam keadaan tidak aman.'
      : 'Teridentifikasi lewat pelaporan SOC sebelum menjadi insiden lebih berat.',
    howEn: obs.stop_work
      ? 'The condition continued until Stop Work was applied so work would not proceed unsafely.'
      : 'Identified through the SOC report before developing into a more serious incident.',
    why1Id: `Gejala di lapangan: ${desc}.`,
    why1En: `Field condition: ${desc}.`,
    why2Id: 'Pemeriksaan / pengawasan shift tidak menangkap penyimpangan lebih awal.',
    why2En: 'Shift inspection / supervision did not catch the deviation earlier.',
    why3Id: 'SOP atau disiplin kerja di titik tersebut belum dijalankan penuh.',
    why3En: 'SOP or work discipline at that point was not fully applied.',
    why4Id: 'Kontrol pengawas area / mitra terhadap praktik di lokasi masih longgar.',
    why4En: 'Area supervisor / contractor control of on-site practice remained weak.',
    why5Id: 'Standar penegakan keselamatan operasional di terminal belum konsisten pada titik ini.',
    why5En: 'Enforcement of operational safety standards at this terminal point was not consistent.',
    rootId: 'Pengawasan dan kepatuhan prosedur di area operasional belum memadai.',
    rootEn: 'Supervision and procedure compliance in the operational area were inadequate.',
    caId: 'Briefing ulang di lokasi, perketat pengawasan shift, pastikan APD/SOP dipatuhi, verifikasi sebelum kerja dilanjutkan.',
    caEn: 'Re-brief on site, tighten shift supervision, enforce PPE/SOP, verify before work resumes.',
    recId: 'Patrol berkala di area sejenis; evaluasi kontrol operasional agar tidak berulang.',
    recEn: 'Schedule patrols in similar areas; review operational controls to prevent recurrence.',
  }
}

export function buildInvestigationNarrative(obs) {
  const inv = parseInvestigationData(obs)
  const when = obs.tanggal_waktu || obs.created_at
  const fb = investigationFallbacks(obs)

  return {
    ringkasanId: `Investigasi SOC — ${obs.lokasi_teks || '—'}, ${fmtDateId(when)}. Terlibat: ${nameId(obs)} (${company(obs)}). Uraian awal: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work sudah diterapkan.' : ''}`,
    ringkasanEn: `SOC investigation — ${obs.lokasi_teks || '—'}, ${fmtDateEn(when)}. Involved: ${nameEn(obs)} (${company(obs)}). Initial report: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work already applied.' : ''}`,
    inv,
    summary5: inv.summary_5w1h || buildSummary5W1H(inv),
    finding: obs.finding_observation || '',
    recommendation: obs.rekomendasi || '',
    investigator: inv.investigator_name || obs.investigator_name || 'HSSE',
    fb,
  }
}
