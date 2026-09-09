/**
 * Seed 10 dummy SOC (sebagian dengan investigasi lengkap) untuk uji PDF.
 *
 *   node --env-file=.env.local scripts/seed-dummy-soc.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Butuh VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

const DUMMIES = [
  {
    reporter_name: 'Riki Mulyadi',
    reporter_position: 'OPERATIONS',
    company_name: 'PT. ESQARADA (Truck)',
    location_text: 'Jetty',
    category: 'Unsafe Act',
    risk_level: 'High',
    is_hipo: true,
    stop_work: true,
    description:
      'Dua pekerja ditemukan duduk di dermaga di luar area istirahat yang ditentukan dan berkumpul dalam kelompok di area operasional aktif saat kegiatan bongkar muat berlangsung.',
    assigned_pic: 'OPERATIONS',
    status: 'In Progress',
    requires_investigation: true,
    pdf_to: 'Management of PT. Esqarada',
    pdf_pic: 'Supervisor Operations / HSSE',
    finding_observation:
      'Pekerja berada di luar zona istirahat resmi dan membentuk kerumunan di area operasional Jetty.',
    recommendation:
      'Lakukan refresher Safety Induction, tegaskan zona istirahat, dan catat pelanggaran pada log HSSE.',
    triage_notes: 'HiPo — Stop Work diterapkan; eskalasi ke investigasi.',
    investigator_name: 'Adit HSSE',
    investigation_data: {
      what: 'Pekerja duduk dan berkumpul di dermaga di luar area istirahat saat operasional aktif.',
      where: 'Jetty Batu Ampar Container Terminal — sisi operasional dekat jalur alat dan container.',
      when: 'Shift pagi operasional; pengawasan terakhir sebelum kejadian belum menangkap kerumunan.',
      why: 'Zona istirahat tidak dipatuhi dan pengawasan perilaku di Jetty belum konsisten.',
      how: 'Kerumunan berkembang hingga berisiko tertabrak alat/container sehingga Stop Work diperlukan.',
      summary_5w1h:
        'Pekerja PT. Esqarada berkumpul di Jetty di luar zona istirahat pada shift operasional; celah kepatuhan dan pengawasan membuat bahaya berkembang hingga Stop Work.',
      why1: 'Karena pekerja memilih duduk di dermaga yang lebih dekat daripada ke rest area resmi.',
      why2: 'Karena pemeriksaan area dan pengawas lapangan tidak segera menegur kerumunan.',
      why3: 'Karena pemahaman SOP zona aman / rest area belum tertanam kuat pada individu.',
      why4: 'Karena kontrol vendor dan briefing pra-kerja kurang menekankan disiplin area operasional.',
      why5: 'Karena sistem penegakan aturan lalu lintas manusia di Jetty belum cukup ketat dan konsisten.',
      root_cause:
        'Lemahnya penegakan zona istirahat dan pengawasan perilaku pekerja mitra di area operasional Jetty.',
      corrective_action:
        'Refresher induction, marking ulang rest area, patrol Jetty lebih sering, dan sanksi tertulis Level 1 bila berulang.',
      investigator_name: 'Adit HSSE',
    },
    root_cause:
      'Lemahnya penegakan zona istirahat dan pengawasan perilaku pekerja mitra di area operasional Jetty.',
  },
  {
    reporter_name: 'Budi Santoso',
    reporter_position: 'HSSE · BACT-0042',
    reporter_employee_id: 'BACT-0042',
    company_name: 'PT. BACT',
    location_text: 'CY/A1',
    category: 'Unsafe Condition',
    risk_level: 'Medium',
    is_hipo: false,
    stop_work: false,
    description:
      'Tumpukan pallet rusak dan serpihan kayu berserakan di jalur pejalan kaki CY/A1, berpotensi menyebabkan tersandung operator dan visitor.',
    assigned_pic: 'ENGINEERING',
    status: 'Under Review',
    requires_investigation: false,
    pdf_to: 'Management PT. BACT / Engineering',
    pdf_pic: 'Engineering Housekeeping PIC',
    finding_observation: 'Housekeeping CY/A1 tidak memadai; debris menghalangi walkway.',
    recommendation: 'Bersihkan segera, sediakan tempat sampah sementara, audit housekeeping harian.',
    triage_notes: 'Risiko sedang — tidak perlu investigasi mendalam.',
  },
  {
    reporter_name: 'Siti Aminah',
    reporter_position: 'OPERATIONS · BACT-0110',
    reporter_employee_id: 'BACT-0110',
    company_name: 'PT. BACT',
    location_text: 'Gate IN',
    category: 'Near Miss',
    risk_level: 'High',
    is_hipo: true,
    stop_work: true,
    description:
      'Truk eksternal hampir menabrak petugas cek di Gate IN karena tidak mengurangi kecepatan sesuai rambu 20 km/jam.',
    assigned_pic: 'HSSE',
    status: 'In Progress',
    requires_investigation: true,
    pdf_to: 'Management PT. BACT / Security & HSSE',
    pdf_pic: 'HSSE Gate Controller',
    finding_observation: 'Near miss kecepatan berlebih di Gate IN terhadap petugas.',
    recommendation: 'Pasang pengingat kecepatan, radar spot-check, coaching driver.',
    triage_notes: 'HiPo near miss — investigasi wajib.',
    investigator_name: 'Adit HSSE',
    investigation_data: {
      what: 'Near miss tabrakan truk vs petugas Gate IN akibat kecepatan berlebih.',
      where: 'Gate IN — jalur masuk kendaraan eksternal.',
      when: 'Saat peak inbound pagi hari.',
      why: 'Driver mengabaikan rambu dan tidak ada penegakan kecepatan saat itu.',
      how: 'Truk masuk cepat; petugas menghindar di detik terakhir; Stop Work aliran gate sementara.',
      summary_5w1h:
        'Near miss di Gate IN karena truk melaju di atas batas aman; pengawasan kecepatan dan disiplin driver menjadi titik gagal hingga hampir terjadi benturan.',
      why1: 'Driver tidak menurunkan kecepatan mendekati pos cek.',
      why2: 'Tidak ada barrier/alerting aktif yang memaksa perlambatan.',
      why3: 'Briefing driver eksternal tentang batas kecepatan gate kurang efektif.',
      why4: 'Monitoring kecepatan mitra transport belum rutin.',
      why5: 'Sistem kontrol akses gate belum mengintegrasikan penegakan speed limit secara konsisten.',
      root_cause: 'Kontrol kecepatan dan disiplin driver eksternal di Gate IN belum memadai.',
      corrective_action: 'Spot radar, refresher mitra, marking ulang, dan SOP eskalasi near miss gate.',
      investigator_name: 'Adit HSSE',
    },
    root_cause: 'Kontrol kecepatan dan disiplin driver eksternal di Gate IN belum memadai.',
  },
  {
    reporter_name: 'Andi Wijaya',
    reporter_position: 'ENGINEERING · BACT-0077',
    reporter_employee_id: 'BACT-0077',
    company_name: 'PT. BACT',
    location_text: 'Workshop',
    category: 'Positive Observation',
    risk_level: 'Low',
    is_hipo: false,
    stop_work: false,
    description:
      'Tim maintenance memakai APD lengkap dan mengunci LOTO dengan benar sebelum perbaikan panel listrik di Workshop.',
    assigned_pic: 'ENGINEERING',
    status: 'Closed',
    requires_investigation: false,
    pdf_to: 'Management PT. BACT / Engineering',
    pdf_pic: 'Engineering Supervisor',
    finding_observation: 'Praktik LOTO dan APD sesuai standar — perlu dijadikan contoh baik.',
    recommendation: 'Share best practice di toolbox meeting mingguan.',
    catatan_penutupan: 'Sudah dishare di toolbox; ditutup sebagai positive observation.',
    triage_notes: 'Positif — tutup setelah apresiasi.',
  },
  {
    reporter_name: 'Imamuddin',
    reporter_position: 'Driver',
    company_name: 'PT. ESQARADA (Truck)',
    location_text: 'Parking Area Truck Internal',
    category: 'Unsafe Act',
    risk_level: 'Medium',
    is_hipo: false,
    stop_work: false,
    description:
      'Driver merokok di kabin truk di area parkir internal yang merupakan zona dilarang merokok.',
    assigned_pic: 'HSSE',
    status: 'Open',
    requires_investigation: false,
    pdf_to: 'Management of PT. Esqarada',
    pdf_pic: 'HSSE Patrol',
    finding_observation: 'Pelanggaran zona no-smoking di parkir truk internal.',
    recommendation: 'Teguran tertulis, pasang rambu tambahan, sosialisasi mitra.',
    triage_notes: 'Unsafe act — coaching + catatan pelanggaran.',
  },
  {
    reporter_name: 'Dewi Lestari',
    reporter_position: 'HSSE · BACT-0091',
    reporter_employee_id: 'BACT-0091',
    company_name: 'PT. BACT',
    location_text: 'ETT Charging',
    category: 'Unsafe Condition',
    risk_level: 'High',
    is_hipo: true,
    stop_work: true,
    description:
      'Kabel charging ETT terkelupas dan terendam genangan air di area charging, berisiko sengatan listrik.',
    assigned_pic: 'ENGINEERING',
    status: 'In Progress',
    requires_investigation: true,
    pdf_to: 'Management PT. BACT / Engineering & HSSE',
    pdf_pic: 'Engineering Electrical',
    finding_observation: 'Kerusakan isolasi kabel + genangan di ETT Charging.',
    recommendation: 'Ganti kabel, keringkan area, pasang cover, inspeksi mingguan.',
    triage_notes: 'HiPo listrik — Stop Work charging sampai aman.',
    investigator_name: 'Adit HSSE',
    investigation_data: {
      what: 'Kabel charging ETT rusak isolasi dan terendam air — risiko sengatan.',
      where: 'ETT Charging station.',
      when: 'Ditemukan saat patrol HSSE shift siang setelah hujan.',
      why: 'Kerusakan kabel tidak terdeteksi inspeksi sebelumnya; drainase area buruk.',
      how: 'Air menggenang menyentuh bagian bertegangan sehingga Stop Work charging diterapkan.',
      summary_5w1h:
        'Kabel ETT rusak dan tergenang di charging station; kegagalan inspeksi dan drainase membuat risiko listrik tinggi hingga Stop Work.',
      why1: 'Isolasi kabel sudah aus namun unit masih dipakai.',
      why2: 'Checklist pra-pakai tidak menangkap kerusakan visual kabel.',
      why3: 'Operator/teknisi belum escalate temuan aus lebih awal.',
      why4: 'Jadwal inspeksi electrical area charging jarang dan tidak terdokumentasi ketat.',
      why5: 'Sistem asset integrity untuk peralatan charging belum matang.',
      root_cause: 'Kelemahan inspeksi electrical dan pengelolaan kondisi area ETT Charging.',
      corrective_action: 'Ganti kabel, perbaikan drainase, checklist harian, audit electrical mingguan.',
      investigator_name: 'Adit HSSE',
    },
    root_cause: 'Kelemahan inspeksi electrical dan pengelolaan kondisi area ETT Charging.',
  },
  {
    reporter_name: 'Hendra Gunawan',
    reporter_position: 'OPERATIONS · BACT-0155',
    reporter_employee_id: 'BACT-0155',
    company_name: 'PT. BACT',
    location_text: 'CY/C',
    category: 'Unsafe Act',
    risk_level: 'High',
    is_hipo: true,
    stop_work: true,
    description:
      'Operator RTG menaikkan spreader tanpa memastikan area bawah bebas orang; seorang checker sempat melintas di line of fire.',
    assigned_pic: 'OPERATIONS',
    status: 'Under Review',
    requires_investigation: true,
    pdf_to: 'Management PT. BACT / Operations',
    pdf_pic: 'Yard Operations Superintendent',
    finding_observation: 'Pelanggaran line of fire / komunikasi radio sebelum lift.',
    recommendation: 'Stop kerja, refresh lifting protocol, spot audit radio check.',
    triage_notes: 'HiPo lifting — investigasi.',
    investigator_name: 'Adit HSSE',
    investigation_data: {
      what: 'Lift spreader tanpa konfirmasi area bawah aman; checker di line of fire.',
      where: 'CY/C — bay aktif RTG.',
      when: 'Operasi siang hari peak stack.',
      why: 'Komunikasi radio dan visual check sebelum lift tidak dijalankan penuh.',
      how: 'Spreader naik saat checker melintas; hampir tertimpa/terkena — Stop Work bay.',
      summary_5w1h:
        'Di CY/C, lift dilakukan tanpa memastikan area bebas; kegagalan komunikasi membuat checker masuk line of fire hingga Stop Work.',
      why1: 'Operator mulai lift sebelum all-clear.',
      why2: 'Tidak ada banksman/signalman yang tegas menahan lift.',
      why3: 'SOP lifting tidak dipatuhi secara disiplin pada peak.',
      why4: 'Pengawasan yard saat peak kurang ketat terhadap protocol lift.',
      why5: 'Budaya produksi-over-safety masih muncul pada tekanan target bongkar.',
      root_cause: 'Disiplin protokol lifting dan kontrol line of fire di yard belum konsisten.',
      corrective_action: 'Refresh SOP lifting, wajib all-clear radio, supervisory spot check tiap shift.',
      investigator_name: 'Adit HSSE',
    },
    root_cause: 'Disiplin protokol lifting dan kontrol line of fire di yard belum konsisten.',
  },
  {
    reporter_name: 'Rina Kusuma',
    reporter_position: 'HRGA · BACT-0021',
    reporter_employee_id: 'BACT-0021',
    company_name: 'PT. BACT',
    location_text: 'BACT Office',
    category: 'Unsafe Condition',
    risk_level: 'Low',
    is_hipo: false,
    stop_work: false,
    description:
      'Kabel ekstensi berserakan di lantai koridor kantor tanpa cable cover, berisiko tersandung karyawan.',
    assigned_pic: 'HRGA',
    status: 'Closed',
    requires_investigation: false,
    pdf_to: 'Management PT. BACT / HRGA',
    pdf_pic: 'HRGA Facility',
    finding_observation: 'Trip hazard dari kabel di koridor office.',
    recommendation: 'Pasang cable cover / reroute kabel ke skirting.',
    catatan_penutupan: 'Cable cover dipasang hari yang sama.',
    triage_notes: 'Low — selesaikan cepat.',
  },
  {
    reporter_name: 'Agus Pratama',
    reporter_position: 'Tally',
    company_name: 'PT. MSB (Tally, CS)',
    location_text: 'CY/F',
    category: 'Unsafe Act',
    risk_level: 'Medium',
    is_hipo: false,
    stop_work: false,
    description:
      'Pekerja tally berjalan di antara stack tanpa helm safety padahal zona wajib APD.',
    assigned_pic: 'OPERATIONS',
    status: 'Open',
    requires_investigation: false,
    pdf_to: 'Management of PT. MSB',
    pdf_pic: 'Operations / HSSE',
    finding_observation: 'Tidak memakai helm di CY/F zona wajib APD.',
    recommendation: 'Stop & coach, pastikan stok helm mitra, gate check APD.',
    triage_notes: 'Unsafe act APD — coaching.',
  },
  {
    reporter_name: 'Fajar Nugroho',
    reporter_position: 'HSSE · BACT-0033',
    reporter_employee_id: 'BACT-0033',
    company_name: 'PT. BACT',
    location_text: 'Power House',
    category: 'Near Miss',
    risk_level: 'High',
    is_hipo: true,
    stop_work: true,
    description:
      'Saat pengujian genset, pintu panel hampir menutup mengenai teknisi yang sedang memeriksa busbar tanpa pengaman penahan pintu.',
    assigned_pic: 'ENGINEERING',
    status: 'In Progress',
    requires_investigation: true,
    pdf_to: 'Management PT. BACT / Engineering',
    pdf_pic: 'Electrical Supervisor',
    finding_observation: 'Near miss pintu panel Power House tanpa door stay.',
    recommendation: 'Pasang door stay, wajib 2-person rule saat panel terbuka.',
    triage_notes: 'HiPo — investigasi electrical safety.',
    investigator_name: 'Adit HSSE',
    investigation_data: {
      what: 'Pintu panel hampir menjepit teknisi saat inspeksi busbar.',
      where: 'Power House — panel genset.',
      when: 'Saat testing/maintenance terjadwal.',
      why: 'Tidak ada penahan pintu dan prosedur 2-person tidak penuh.',
      how: 'Pintu terayun; teknisi menghindar; pekerjaan di-Stop Work hingga alat bantu siap.',
      summary_5w1h:
        'Near miss jepit pintu panel di Power House karena absen door stay dan kontrol prosedur maintenance listrik.',
      why1: 'Pintu panel tidak dikunci terbuka dengan stay.',
      why2: 'Peralatan penahan tidak tersedia di lokasi.',
      why3: 'Teknisi melanjutkan kerja meski tahu risiko pintu.',
      why4: 'Permit/maintenance checklist tidak memuat item door stay.',
      why5: 'Standar electrical maintenance safety belum lengkap di level sistem.',
      root_cause: 'Kontrol peralatan dan prosedur keselamatan pekerjaan panel listrik belum lengkap.',
      corrective_action: 'Door stay wajib, update checklist permit, toolbox electrical safety.',
      investigator_name: 'Adit HSSE',
    },
    root_cause: 'Kontrol peralatan dan prosedur keselamatan pekerjaan panel listrik belum lengkap.',
  },
]

async function seed() {
  let ok = 0
  for (let i = 0; i < DUMMIES.length; i++) {
    const d = DUMMIES[i]
    const id = randomUUID()
    const dayOffset = 9 - i
    const incident = new Date()
    incident.setDate(incident.getDate() - dayOffset)
    incident.setHours(8 + (i % 6), 15 + i * 3, 0, 0)

    const row = {
      id,
      reporter_name: d.reporter_name,
      reporter_position: d.reporter_position,
      reporter_employee_id: d.reporter_employee_id || null,
      company_name: d.company_name,
      is_anonymous: false,
      incident_datetime: incident.toISOString(),
      location_text: d.location_text,
      latitude: null,
      longitude: null,
      category: d.category,
      description: d.description,
      risk_level: d.risk_level,
      potential_risk_level: d.risk_level,
      is_hipo: d.is_hipo,
      life_saving_rule: 'Tidak terkait',
      stop_work: d.stop_work,
      photo_urls: [],
      assigned_pic: d.assigned_pic,
      status: d.status,
      triage_notes: d.triage_notes || null,
      investigation_notes: d.investigation_data
        ? JSON.stringify(d.investigation_data, null, 0).slice(0, 500)
        : null,
      investigation_data: d.investigation_data || null,
      root_cause: d.root_cause || null,
      finding_observation: d.finding_observation || null,
      recommendation: d.recommendation || null,
      pdf_to: d.pdf_to || null,
      pdf_pic: d.pdf_pic || null,
      requires_investigation: Boolean(d.requires_investigation),
      investigator_name: d.investigator_name || null,
      soc_number: null,
      closing_notes: d.catatan_penutupan || null,
      closed_date: d.status === 'Closed' ? incident.toISOString().slice(0, 10) : null,
    }

    // Try full row, then without v8 columns
    let error = null
    ;({ error } = await supabase.from('observations').insert(row))
    if (error) {
      const legacy = { ...row }
      delete legacy.investigation_data
      delete legacy.finding_observation
      delete legacy.pdf_to
      delete legacy.pdf_pic
      delete legacy.requires_investigation
      delete legacy.soc_number
      delete legacy.investigator_name
      delete legacy.reporter_employee_id
      ;({ error } = await supabase.from('observations').insert(legacy))
    }

    if (error) {
      console.error(`✗ [${i + 1}] ${d.reporter_name}: ${error.message}`)
    } else {
      ok++
      console.log(`✓ [${i + 1}] ${d.location_text} — ${d.category} — ${d.requires_investigation ? 'INVESTIGASI' : 'SOC harian'}`)
    }
  }
  console.log(`\nSelesai: ${ok}/${DUMMIES.length} dummy masuk. Refresh dashboard admin.`)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
