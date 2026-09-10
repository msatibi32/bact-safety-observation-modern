/**
 * Narasi PDF padat — notice HSSE terminal bongkar muat.
 * Metodologi internal tidak ditampilkan di PDF.
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

function statusLineId(obs) {
  const bits = [`Status laporan: ${obs.status || 'Open'}`]
  if (obs.pic_assigned) bits.push(`follow-up ${obs.pic_assigned}`)
  if (obs.requires_investigation) bits.push('dilanjutkan ke investigasi')
  return `${bits.join('; ')}.`
}

function statusLineEn(obs) {
  const bits = [`Report status: ${obs.status || 'Open'}`]
  if (obs.pic_assigned) bits.push(`follow-up ${obs.pic_assigned}`)
  if (obs.requires_investigation) bits.push('escalated to investigation')
  return `${bits.join('; ')}.`
}

function classificationId(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'Observasi ini telah dicatat pada sistem Safety Observation Card (SOC) Batu Ampar Container Terminal dan menunggu klasifikasi kategori serta tingkat risiko oleh Tim HSSE. Sampai klasifikasi ditetapkan, area terkait tetap diawasi sesuai prosedur operasional terminal.'
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
  let s = `Berdasarkan penilaian Tim HSSE, temuan ini diklasifikasikan sebagai ${cat} dengan tingkat risiko ${risk}, sesuai prosedur keselamatan operasional bongkar muat di Batu Ampar Container Terminal.`
  if (obs.is_hipo) {
    s +=
      ' Kasus ini juga dikategorikan sebagai HiPo (High Potential) sehingga memerlukan perhatian prioritas dari pengawas area dan manajemen terkait.'
  }
  if (obs.stop_work) {
    s +=
      ' Sehubungan dengan potensi bahaya di area operasional, Stop Work Authority telah diterapkan hingga kondisi dinyatakan aman untuk melanjutkan kegiatan.'
  }
  return s
}

function classificationEn(obs) {
  if (isUnclassifiedObservation(obs)) {
    return 'This observation has been recorded in the Batu Ampar Container Terminal Safety Observation Card (SOC) system and is pending category and risk classification by the HSSE Team. Until classification is completed, the related area remains under operational supervision in line with terminal procedures.'
  }
  const cat = categoryLabel(obs.kategori)
  let s = `Based on the HSSE Team assessment, this finding is classified as ${cat} with a ${obs.tingkat_risiko} risk level, in accordance with cargo-handling operational safety procedures at Batu Ampar Container Terminal.`
  if (obs.is_hipo) {
    s +=
      ' The case is also categorized as HiPo (High Potential) and therefore requires priority attention from the area supervisor and concerned management.'
  }
  if (obs.stop_work) {
    s +=
      ' Due to the hazard potential in the operational area, Stop Work Authority was applied until conditions were declared safe to resume activities.'
  }
  return s
}

export function buildNoticeActions(obs) {
  const id = []
  const en = []

  if (obs.stop_work) {
    id.push(
      'Melaksanakan Stop Work Authority dan menghentikan sementara aktivitas di area terkait hingga kondisi dinyatakan aman oleh Tim HSSE / pengawas area.',
    )
    en.push(
      'Exercised Stop Work Authority and temporarily suspended related activities until the area was declared safe by HSSE / the area supervisor.',
    )
  }

  id.push(
    'Mencatat kejadian pada sistem Safety Observation Card (SOC) digital HSSE untuk pemantauan dan tindak lanjut.',
  )
  en.push(
    'Logged the incident in the HSSE digital Safety Observation Card (SOC) system for monitoring and follow-up.',
  )

  if (obs.finding_observation) {
    id.push(`Mencatat temuan observasi: ${obs.finding_observation}`)
    en.push(`Recorded the observation finding: ${obs.finding_observation}`)
  } else {
    id.push(
      'Melakukan verifikasi singkat di lokasi terhadap kondisi operasional, APD, dan kepatuhan terhadap zona kerja yang berlaku.',
    )
    en.push(
      'Conducted a brief on-site verification of operational conditions, PPE, and compliance with applicable work zones.',
    )
  }

  if (obs.rekomendasi) {
    id.push(`Menyampaikan rekomendasi tindak lanjut: ${obs.rekomendasi}`)
    en.push(`Issued the following recommendation: ${obs.rekomendasi}`)
  } else if (obs.triage_notes) {
    id.push(`Melakukan triage awal HSSE: ${obs.triage_notes}`)
    en.push(`Conducted initial HSSE triage: ${obs.triage_notes}`)
  } else {
    id.push(
      'Memberikan pengarahan keselamatan kepada pihak terkait di lokasi mengenai peraturan operasional terminal dan zona aman kerja.',
    )
    en.push(
      'Provided an on-site safety briefing to the parties concerned on terminal operational rules and safe work zones.',
    )
  }

  if (obs.pic_assigned) {
    id.push(`Menugaskan departemen follow-up: ${obs.pic_assigned} untuk penyelesaian tindakan korektif.`)
    en.push(`Assigned follow-up to ${obs.pic_assigned} for completion of corrective actions.`)
  } else {
    id.push(
      'Menginformasikan pengawas area / PIC terkait agar pengawasan shift diperkuat pada titik kejadian.',
    )
    en.push(
      'Informed the area supervisor / concerned PIC to strengthen shift supervision at the location of occurrence.',
    )
  }

  if (obs.requires_investigation || obs.investigation_data) {
    id.push(
      'Mengangkat kasus ke tahap investigasi formal sesuai prosedur HSSE untuk penelusuran penyebab dan tindakan korektif.',
    )
    en.push(
      'Escalated the case to a formal investigation under HSSE procedure to establish causes and corrective actions.',
    )
  }

  if (obs.catatan_penutupan) {
    id.push(`Catatan penutupan: ${obs.catatan_penutupan}`)
    en.push(`Closure note: ${obs.catatan_penutupan}`)
  }

  // Pastikan minimal 4 poin agar halaman terisi
  while (id.length < 4) {
    id.push(
      'Meminta pihak terkait menjaga disiplin operasional di area bongkar muat dan segera melapor bila kondisi tidak aman kembali muncul.',
    )
    en.push(
      'Requested the parties concerned to maintain operational discipline in the cargo-handling area and to report immediately should unsafe conditions reappear.',
    )
  }

  return { id: id.slice(0, 6), en: en.slice(0, 6) }
}

export function buildSocNarrativeId(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const loc = obs.lokasi_teks || 'Batu Ampar Container Terminal'

  const intro = `Dengan ini kami sampaikan bahwa pada tanggal ${fmtDateLongId(when)} pukul ${fmtTimeWib(when)}, ${personId(obs)} dari ${companyOf(obs)}${deptId(obs)} teridentifikasi terkait observasi keselamatan di area ${loc}. Adapun uraian kejadian sebagai berikut: ${obs.deskripsi || '—'}`

  const context = `Kejadian tersebut berada pada area operasional bongkar muat container di Batu Ampar Container Terminal. Aktivitas di lokasi ini melibatkan pergerakan alat, kendaraan, dan personel, sehingga setiap penyimpangan terhadap zona kerja, APD, maupun prosedur operasional berpotensi menimbulkan risiko terhadap keselamatan kerja dan kelancaran operasi.`

  const followUp = `Sehubungan dengan hal tersebut, Tim HSSE menyampaikan pemberitahuan ini kepada pihak terkait untuk segera menindaklanjuti sesuai tanggung jawab masing-masing. ${statusLineId(obs)} Pemantauan lanjutan akan dilakukan hingga tindakan korektif dinyatakan selesai atau laporan ditutup sesuai alur SOC.`

  const closing =
    'Demikian pemberitahuan ini disampaikan untuk menjadi perhatian dan ditindaklanjuti sebagaimana mestinya, agar seluruh personel senantiasa mematuhi persyaratan keselamatan operasional di Batu Ampar Container Terminal. Atas perhatian dan kerja sama yang baik, kami mengucapkan terima kasih.'

  const actions = buildNoticeActions(obs)
  return {
    intro,
    context,
    classification: classificationId(obs),
    actions: actions.id,
    followUp,
    closing,
  }
}

export function buildSocNarrativeEn(obs) {
  const when = obs.tanggal_waktu || obs.created_at
  const loc = obs.lokasi_teks || 'Batu Ampar Container Terminal'

  const intro = `We hereby inform you that on ${fmtDateLongEn(when)} at ${fmtTimeWib(when)}, ${personEn(obs)} from ${companyOf(obs)}${deptEn(obs)} was identified in connection with a safety observation at ${loc}. The incident is described as follows: ${obs.deskripsi || '—'}`

  const context = `The occurrence took place within the container cargo-handling operational area of Batu Ampar Container Terminal. Activities at this location involve equipment, vehicle, and personnel movement; therefore any deviation from work zones, PPE requirements, or operational procedures may create risk to workplace safety and operational continuity.`

  const followUp = `In this regard, the HSSE Team issues this notice to the parties concerned for prompt follow-up according to their respective responsibilities. ${statusLineEn(obs)} Further monitoring will continue until corrective actions are completed or the report is closed under the SOC workflow.`

  const closing =
    'This notice is issued for your attention and appropriate follow-up, to ensure that all personnel continue to comply with operational safety requirements at Batu Ampar Container Terminal. We thank you for your attention and cooperation.'

  const actions = buildNoticeActions(obs)
  return {
    intro,
    context,
    classification: classificationEn(obs),
    actions: actions.en,
    followUp,
    closing,
  }
}

export function investigationFallbacks(obs) {
  const loc = obs.lokasi_teks || 'area kerja'
  const desc = obs.deskripsi || 'kondisi/tindakan tidak aman'
  const when = obs.tanggal_waktu || obs.created_at
  return {
    natureId: `Sifat kejadian yang diinvestigasi adalah observasi keselamatan di ${loc}. Uraian inti kejadian: ${desc}. Investigasi menelaah kondisi operasional di sekitar titik kejadian, termasuk interaksi personel, alat, dan zona kerja pada saat aktivitas bongkar muat berlangsung.`,
    natureEn: `The matter under investigation is a safety observation at ${loc}. Core description: ${desc}. The investigation reviewed operational conditions around the point of occurrence, including interaction of personnel, equipment, and work zones during cargo-handling activity.`,
    locationId: `Lokasi kejadian ditetapkan di ${loc}, yang merupakan bagian dari area operasional bongkar muat container Batu Ampar Container Terminal. Karakteristik area ini menuntut disiplin zona kerja, komunikasi yang jelas antar personel, serta pengawasan shift yang aktif.`,
    locationEn: `The location is established as ${loc}, within the container cargo-handling operational area of Batu Ampar Container Terminal. This area requires work-zone discipline, clear communication between personnel, and active shift supervision.`,
    timeId: `Waktu kejadian / pelaporan: ${fmtDateLongId(when)}, pukul ${fmtTimeWib(when)}. Penelaahan mempertimbangkan kondisi operasional pada periode tersebut, termasuk beban aktivitas dan kehadiran pengawas area.`,
    timeEn: `Time of occurrence / reporting: ${fmtDateLongEn(when)} at ${fmtTimeWib(when)}. The review considered operational conditions during that period, including activity load and presence of area supervision.`,
    factorsId: `Faktor yang berkontribusi meliputi pengendalian di lokasi yang belum sepenuhnya mencegah kondisi tidak aman — antara lain pengawasan, pemakaian APD, penempatan personel di zona kerja, dan/atau penerapan prosedur operasional yang berlaku di titik tersebut.`,
    factorsEn: `Contributing factors include site controls that did not fully prevent the unsafe condition — among others supervision, PPE use, personnel positioning in work zones, and/or application of the operational procedure applicable at that point.`,
    sequenceId: obs.stop_work
      ? `Urutan kejadian menunjukkan kondisi berlanjut hingga Tim HSSE / pengawas area menerapkan Stop Work Authority agar pekerjaan tidak dilanjutkan dalam keadaan tidak aman. Setelah itu dilakukan pengamanan lokasi dan pencatatan melalui SOC.`
      : `Urutan kejadian menunjukkan kondisi teridentifikasi melalui pelaporan SOC dan ditindaklanjuti sebelum berkembang menjadi insiden yang lebih berat. Pencatatan dan pengarahan di lokasi dilakukan sebagai bagian dari respons awal.`,
    sequenceEn: obs.stop_work
      ? `The sequence of events shows that the condition continued until HSSE / the area supervisor applied Stop Work Authority so that work would not proceed unsafely. The area was then secured and recorded through the SOC.`
      : `The sequence of events shows that the condition was identified through the SOC report and addressed before developing into a more serious incident. Recording and on-site briefing formed part of the initial response.`,
    cause1Id: `Temuan lapangan mengonfirmasi adanya penyimpangan operasional: ${desc}. Hal ini menjadi titik awal penelusuran penyebab.`,
    cause1En: `Field findings confirm an operational deviation: ${desc}. This formed the starting point of the cause review.`,
    cause2Id: `Pemeriksaan atau pengawasan pada shift terkait belum menangkap penyimpangan lebih awal, sehingga kondisi sempat berlangsung di area operasional.`,
    cause2En: `Inspection or supervision on the related shift did not identify the deviation earlier, allowing the condition to persist in the operational area.`,
    cause3Id: `Penerapan SOP atau disiplin kerja di titik kejadian belum berjalan penuh, baik pada individu maupun pada praktik kerja setempat.`,
    cause3En: `Application of SOP or work discipline at the point of occurrence was incomplete, both at individual level and in local work practice.`,
    cause4Id: `Kontrol pengawas area atau mitra terhadap praktik di lokasi masih longgar, termasuk penegasan zona kerja dan komunikasi sebelum kegiatan berisiko.`,
    cause4En: `Area supervisor or contractor control of on-site practice remained weak, including enforcement of work zones and pre-task communication for higher-risk activity.`,
    cause5Id: `Pada tingkat sistem, penegakan standar keselamatan operasional di titik ini belum cukup konsisten untuk mencegah terulangnya kondisi serupa.`,
    cause5En: `At system level, enforcement of operational safety standards at this point was not consistent enough to prevent similar conditions from recurring.`,
    rootId: `Akar masalah mengarah pada pengawasan dan kepatuhan prosedur di area operasional yang belum memadai, sehingga kondisi tidak aman dapat muncul dan tidak segera dikendalikan.`,
    rootEn: `The root cause points to inadequate supervision and procedure compliance in the operational area, allowing an unsafe condition to arise and not be controlled promptly.`,
    caId: `Tindakan korektif meliputi briefing ulang di lokasi, pengetatan pengawasan shift, penegasan APD dan zona kerja, serta verifikasi kondisi aman sebelum kegiatan dilanjutkan. Bukti tindakan wajib dilaporkan kepada HSSE.`,
    caEn: `Corrective actions include on-site re-briefing, tighter shift supervision, enforcement of PPE and work zones, and verification that conditions are safe before activity resumes. Evidence of actions must be reported to HSSE.`,
    recId: `Direkomendasikan patrol berkala di area sejenis, peninjauan kontrol operasional oleh pengawas terkait, serta sosialisasi singkat kepada personel/mitra agar kejadian tidak berulang.`,
    recEn: `It is recommended that periodic patrols be conducted in similar areas, that operational controls be reviewed by the concerned supervisor, and that a short briefing be given to personnel/contractors to prevent recurrence.`,
  }
}

export function buildInvestigationNarrative(obs) {
  const inv = parseInvestigationData(obs)
  const when = obs.tanggal_waktu || obs.created_at
  const fb = investigationFallbacks(obs)

  return {
    ringkasanId: `Dengan ini kami sampaikan hasil investigasi atas laporan Safety Observation Card (SOC) terkait observasi di ${obs.lokasi_teks || '—'} pada tanggal ${fmtDateLongId(when)} yang melibatkan ${personId(obs)} dari ${companyOf(obs)}${deptId(obs)}. Uraian awal pelapor: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority telah diterapkan di lapangan sebagai respons awal.' : ''} Investigasi bertujuan menetapkan fakta kejadian, faktor penyebab, akar masalah, serta tindakan korektif yang diperlukan.`,
    ringkasanEn: `We hereby submit the investigation findings for the Safety Observation Card (SOC) report concerning an observation at ${obs.lokasi_teks || '—'} on ${fmtDateLongEn(when)} involving ${personEn(obs)} from ${companyOf(obs)}${deptEn(obs)}. Initial reporter description: ${obs.deskripsi || '—'}${obs.stop_work ? ' Stop Work Authority had been applied on site as the initial response.' : ''} The investigation aims to establish the facts, contributing factors, root cause, and required corrective actions.`,
    inv,
    summary5: inv.summary_5w1h || buildSummary5W1H(inv),
    finding: obs.finding_observation || '',
    recommendation: obs.rekomendasi || '',
    investigator: inv.investigator_name || obs.investigator_name || 'HSSE',
    fb,
    purposeId:
      'Ruang lingkup investigasi mencakup penelaahan laporan SOC, klarifikasi kondisi di area operasional terkait, serta penyusunan rekomendasi agar risiko serupa dapat dikendalikan pada kegiatan bongkar muat selanjutnya.',
    purposeEn:
      'The investigation scope covers review of the SOC report, clarification of conditions in the related operational area, and formulation of recommendations so that similar risks can be controlled in subsequent cargo-handling activities.',
  }
}
