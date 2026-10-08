/** Menu dan isian mengikuti HSE OMNI PRO.html. Tampilan tetap gaya dashboard BACT. */

const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed', 'Scheduled']
const WORK_TYPES = ['Hot Work', 'Working at Height', 'Confined Space', 'Excavation', 'Lifting']
const LIKELIHOOD_OPTIONS = [
  '1 - Sangat Jarang (Rare)',
  '2 - Jarang (Unlikely)',
  '3 - Mungkin (Possible)',
  '4 - Sering (Likely)',
  '5 - Sangat Sering (Almost Certain)',
]
const SEVERITY_OPTIONS = [
  '1 - Tidak Signifikan (Insignificant)',
  '2 - Kecil (Minor)',
  '3 - Sedang (Moderate)',
  '4 - Besar (Major)',
  '5 - Bencana (Catastrophic)',
]
const INSPEKSI_KATEGORI = [
  'Inspeksi APD',
  'Inspeksi Scaffold',
  'Inspeksi Alat Berat',
  'Inspeksi Kebakaran',
  'Inspeksi Umum',
  'Kantor & Fasilitas',
  'Petugas P3K dan Fasilitas',
  'Tempat Pabrikasi',
  'Housekeeping dan Akses & Jalur Keluar',
  'Bekerja di Ketinggian',
  'Pengangkatan & Pengikatan Sling',
  'Alat Angkat',
  'Perancah',
  'Alat Listrik',
  'Alat Berat',
  'Perilaku Orang di Tempat Kerja',
  'JSA',
  'Surat Ijin Kerja',
  'Bahan Berbahaya',
  'Pekerjaan Las, Memotong & Pekerjaan Menghasilkan Percikan Api',
  'Pekerjaan Galian',
  'Pekerjaan Ruang Terbatas',
  'Penerangan',
  'Mencari Sumber Bahaya',
]

export const MODULE_SCHEMAS = {
  employee: {
    label: 'Employee',
    fields: [
      { key: 'nama', label: 'Nama Pekerja', type: 'text', title: true, col: true, required: true },
      { key: 'proyek_penempatan', label: 'Proyek Penempatan', type: 'text', col: true, required: true },
      {
        key: 'jabatan',
        label: 'Jabatan / Trade',
        type: 'select',
        options: ['Mandor', 'Tukang / Skilled Worker', 'Helper / Buruh', 'Operator Alat Berat', 'Teknisi', 'Supervisor Lapangan', 'Admin Proyek', 'Lainnya'],
        col: true,
        required: true,
      },
      { key: 'kontraktor', label: 'Kontraktor / Sub-Kontraktor', type: 'text', col: true },
      { key: 'no_hp', label: 'No. HP', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Non-aktif'], col: true, badge: true },
    ],
  },
  manpower: {
    label: 'Man Power',
    fields: [
      { key: 'lokasi_proyek', label: 'Lokasi / Proyek', type: 'text', title: true, col: true, required: true },
      { key: 'tanggal', label: 'Tanggal', type: 'date', col: true, required: true },
      { key: 'kontraktor', label: 'Kontraktor / Sub-Kontraktor', type: 'text', col: true },
      { key: 'jumlah_pekerja', label: 'Jumlah Pekerja Hadir', type: 'number', col: true, required: true },
      { key: 'jam_kerja_per_hari', label: 'Jam Kerja per Hari', type: 'number', ph: 'Kosongkan jika 8 jam' },
      { key: 'daftar_pekerja', label: 'Daftar Pekerja Hadir', type: 'employee_multi', syncCountField: 'jumlah_pekerja' },
      { key: 'catatan', label: 'Catatan Tambahan', type: 'textarea' },
    ],
  },
  hseplan: {
    label: 'HSE Plan',
    fields: [
      { key: 'judul', label: 'Judul Rencana / Program', type: 'text', title: true, col: true, required: true },
      { key: 'kategori', label: 'Kategori Rencana', type: 'select', options: ['Rencana Tahunan', 'Rencana Proyek', 'Program Kerja Bulanan', 'Emergency Response Plan', 'Lainnya'], col: true },
      { key: 'periode', label: 'Periode', type: 'text', col: true },
      { key: 'tujuan_sasaran', label: 'Tujuan & Sasaran', type: 'textarea' },
      { key: 'ruang_lingkup', label: 'Ruang Lingkup', type: 'textarea' },
      { key: 'program_kerja', label: 'Program Kerja & Kegiatan', type: 'textarea' },
      { key: 'pic', label: 'Penanggung Jawab', type: 'text' },
      { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date', col: true },
      { key: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, col: true, badge: true },
    ],
  },
  inspeksi: {
    label: 'Inspeksi',
    fields: [
      { key: 'judul', label: 'Judul Inspeksi', type: 'text', title: true, col: true, required: true },
      { key: 'kategori', label: 'Kategori Inspeksi', type: 'select_other', options: INSPEKSI_KATEGORI, col: true },
      { key: 'tanggal', label: 'Tanggal Inspeksi', type: 'date', col: true },
      { key: 'lokasi', label: 'Lokasi', type: 'text', col: true },
      { key: 'pic', label: 'Petugas Inspeksi (PIC)', type: 'text' },
      { key: 'temuan', label: 'Temuan', type: 'textarea' },
      { key: 'rekomendasi', label: 'Rekomendasi', type: 'textarea' },
      { key: 'skor', label: 'Nilai Assessment (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, col: true, badge: true },
    ],
  },
  capa: {
    label: 'Tindakan Perbaikan (CAPA)',
    fields: [
      { key: 'judul', label: 'Judul Temuan', type: 'text', title: true, col: true, required: true },
      { key: 'finding_code', label: 'Kode Temuan', type: 'text', col: true },
      { key: 'kategori', label: 'Kategori', type: 'select', options: ['Temuan APD', 'Housekeeping', 'Prosedur LOTO', 'Lainnya'], col: true },
      { key: 'severity', label: 'Tingkat Keparahan', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], col: true, badge: true },
      { key: 'lokasi', label: 'Lokasi', type: 'text' },
      { key: 'deskripsi', label: 'Deskripsi Temuan', type: 'textarea' },
      { key: 'tindakan_perbaikan', label: 'Tindakan Perbaikan', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, badge: true },
    ],
  },
  audit: {
    label: 'Manajemen Audit',
    fields: [
      { key: 'judul_audit', label: 'Judul Audit', type: 'text', title: true, col: true, required: true },
      { key: 'auditor', label: 'Auditor', type: 'text', col: true },
      { key: 'tanggal', label: 'Tanggal Audit', type: 'date', col: true },
      { key: 'lokasi', label: 'Lokasi / Area Audit', type: 'text' },
      { key: 'ruang_lingkup', label: 'Ruang Lingkup', type: 'textarea' },
      { key: 'temuan', label: 'Temuan Audit', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, col: true, badge: true },
    ],
  },
  hiradc: {
    label: 'HIRADC & Risiko',
    fields: [
      { key: 'aktivitas', label: 'Aktivitas Pekerjaan', type: 'text', title: true, col: true, required: true },
      { key: 'bahaya', label: 'Potensi Bahaya (Hazard)', type: 'textarea', col: true },
      { key: 'dampak', label: 'Dampak / Konsekuensi', type: 'textarea' },
      { key: 'likelihood', label: 'Likelihood (Peluang)', type: 'select', options: LIKELIHOOD_OPTIONS },
      { key: 'severity_n', label: 'Severity (Keparahan)', type: 'select', options: SEVERITY_OPTIONS },
      { key: 'pengendalian', label: 'Langkah Pengendalian (Controls)', type: 'textarea' },
      { key: 'lokasi', label: 'Lokasi / Proyek', type: 'text', col: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'], col: true, badge: true },
    ],
  },
  legal: {
    label: 'Legal & Kepatuhan',
    fields: [
      { key: 'nama_regulasi', label: 'Nama Regulasi / Dokumen', type: 'text', title: true, col: true, required: true },
      { key: 'kategori', label: 'Kategori', type: 'select', options: ['Izin Lingkungan', 'Sertifikat Laik Operasi', 'Laporan P2K3', 'Perizinan K3', 'Lainnya'], col: true },
      { key: 'otoritas', label: 'Otoritas Penerbit', type: 'text' },
      { key: 'lokasi', label: 'Lokasi / Area', type: 'text' },
      { key: 'persyaratan', label: 'Persyaratan (Requirement)', type: 'textarea' },
      { key: 'pic_auditor', label: 'PIC / Auditor', type: 'text' },
      { key: 'tenggat_waktu', label: 'Tenggat Waktu (Deadline)', type: 'date', col: true },
      { key: 'status', label: 'Status Kepatuhan', type: 'select', options: ['Compliant', 'In Progress', 'Non-Compliant', 'N/A'], col: true, badge: true },
    ],
  },
  sertifikasi: {
    label: 'SIA/SIO & Sertifikasi',
    fields: [
      { key: 'nama_alat_operator', label: 'Nama Alat / Operator', type: 'text', title: true, col: true, required: true },
      { key: 'tipe', label: 'Tipe Sertifikat', type: 'select', options: ['SIA (Alat)', 'SIO (Operator)', 'Sertifikat Kompetensi'], col: true },
      { key: 'kategori', label: 'Kategori', type: 'text' },
      { key: 'no_seri', label: 'No. Seri / No. Sertifikat', type: 'text', col: true },
      { key: 'proyek_lokasi', label: 'Proyek / Lokasi', type: 'text' },
      { key: 'pic_operator', label: 'PIC / Operator', type: 'text' },
      { key: 'petugas_pemeriksa', label: 'Petugas Pemeriksa', type: 'text' },
      { key: 'tanggal_kadaluarsa', label: 'Tanggal Kadaluarsa', type: 'date', col: true },
      { key: 'status', label: 'Status Validitas', type: 'select', options: ['Active', 'Near Expiry', 'Expired'], col: true, badge: true },
    ],
  },
  csms: {
    label: 'Manajemen CSMS',
    fields: [
      { key: 'nama_kontraktor', label: 'Nama Kontraktor', type: 'text', title: true, col: true, required: true },
      { key: 'bidang_kategori', label: 'Bidang / Kategori', type: 'text', col: true },
      { key: 'email', label: 'Email PIC', type: 'text' },
      { key: 'telepon', label: 'Telepon', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'textarea' },
      { key: 'location_site', label: 'Lokasi / Site', type: 'text', col: true },
      { key: 'skor_hse', label: 'Skor HSE', type: 'number' },
      { key: 'terakhir_audit', label: 'Terakhir Audit', type: 'date' },
      { key: 'batas_berlaku', label: 'Batas Berlaku Kualifikasi', type: 'date', col: true },
      { key: 'pic_auditor', label: 'PIC Auditor', type: 'text' },
      { key: 'status', label: 'Status Kualifikasi', type: 'select', options: ['Qualified', 'Probation', 'Blacklisted', 'Not Evaluated'], col: true, badge: true },
    ],
  },
  kalender: {
    label: 'Kalender Keselamatan',
    fields: [
      { key: 'nama_kegiatan', label: 'Nama Kegiatan', type: 'text', title: true, col: true, required: true },
      { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date', col: true, required: true },
      { key: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date', col: true, required: true },
      { key: 'kategori', label: 'Kategori', type: 'select', options: ['Meeting', 'Training', 'Emergency', 'Inspection', 'Audit', 'Umum'], col: true },
      { key: 'deskripsi', label: 'Deskripsi / Catatan', type: 'textarea' },
      { key: 'lokasi', label: 'Lokasi Kegiatan', type: 'text' },
      { key: 'pic', label: 'Penanggung Jawab (PIC)', type: 'text' },
    ],
  },
  rapat: {
    label: 'Rapat HSE',
    fields: [
      { key: 'judul_rapat', label: 'Judul Rapat', type: 'text', title: true, col: true, required: true },
      { key: 'deskripsi', label: 'Deskripsi / Agenda', type: 'textarea' },
      { key: 'tanggal', label: 'Tanggal', type: 'date', col: true },
      { key: 'jam', label: 'Jam', type: 'text' },
      { key: 'lokasi', label: 'Lokasi', type: 'text', col: true },
      { key: 'rangkuman', label: 'Rangkuman Hasil Rapat', type: 'textarea' },
      { key: 'notulis', label: 'Notulis', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, badge: true },
    ],
  },
  pelatihan: {
    label: 'Pelatihan',
    fields: [
      { key: 'judul', label: 'Judul Pelatihan', type: 'text', title: true, col: true, required: true },
      { key: 'deskripsi', label: 'Deskripsi Pelatihan', type: 'textarea' },
      { key: 'tanggal', label: 'Tanggal', type: 'date', col: true },
      { key: 'waktu', label: 'Waktu', type: 'text' },
      { key: 'lokasi', label: 'Lokasi', type: 'text', col: true },
      { key: 'instruktur', label: 'Instruktur', type: 'text' },
      { key: 'jumlah_peserta', label: 'Jumlah Peserta', type: 'number', col: true },
      { key: 'daftar_peserta', label: 'Daftar Peserta', type: 'employee_multi', syncCountField: 'jumlah_peserta' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, col: true, badge: true },
    ],
  },
  inventaris: {
    label: 'Inventaris HSE',
    fields: [
      { key: 'nama_barang', label: 'Nama Barang / Aset', type: 'text', title: true, col: true, required: true },
      { key: 'tipe', label: 'Tipe Inventaris', type: 'select', options: ['Perlengkapan Keselamatan', 'Alat Berat', 'Bahan Kimia', 'Peralatan Medis'], col: true },
      { key: 'jumlah', label: 'Jumlah (Qty)', type: 'number', col: true },
      { key: 'lokasi', label: 'Lokasi', type: 'text', col: true },
      { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['Baik', 'Rusak', 'Perlu Perbaikan'], col: true, badge: true },
      { key: 'catatan', label: 'Catatan Tambahan', type: 'textarea' },
      { key: 'pic', label: 'Petugas (PIC)', type: 'text' },
    ],
  },
  dokumen: {
    label: 'Pusat Dokumen',
    fields: [
      { key: 'judul_dokumen', label: 'Judul Dokumen', type: 'text', title: true, col: true, required: true },
      { key: 'deskripsi', label: 'Deskripsi & Ruang Lingkup', type: 'textarea' },
      { key: 'kategori', label: 'Kategori Dokumen', type: 'select', options: ['Dokumen Prosedur (SOP)', 'Form / Template', 'Laporan', 'Kebijakan', 'Manual'], col: true },
      { key: 'tanggal_upload', label: 'Tanggal Upload', type: 'date', col: true },
      { key: 'otoritas_pic', label: 'Otoritas / Petugas (PIC)', type: 'text' },
      { key: 'masa_berlaku', label: 'Masa Berlaku Dokumen', type: 'date' },
      { key: 'lokasi_proyek', label: 'Lokasi / Proyek Terkait', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Expired', 'Warning'], col: true, badge: true },
    ],
  },
}

export const WORK_TYPE_OPTIONS = WORK_TYPES

export function moduleStats(key, rows) {
  const status = (value) => rows.filter((row) => row.data?.status === value).length
  if (key === 'employee') {
    const proyek = new Set(rows.map((row) => String(row.data?.proyek_penempatan || '').trim().toLowerCase()).filter(Boolean))
    return [
      { label: 'Total pekerja', value: rows.length },
      { label: 'Aktif', value: status('Aktif') },
      { label: 'Non-aktif', value: status('Non-aktif') },
      { label: 'Proyek tercakup', value: proyek.size },
    ]
  }
  if (key === 'manpower') {
    const byDate = {}
    rows.forEach((row) => {
      const date = row.data?.tanggal
      if (!date) return
      byDate[date] = (byDate[date] || 0) + (Number(row.data?.jumlah_pekerja) || 0)
    })
    const dates = Object.keys(byDate).sort()
    const latest = dates.length ? byDate[dates[dates.length - 1]] : 0
    const avg = dates.length ? Math.round(dates.reduce((sum, date) => sum + byDate[date], 0) / dates.length) : 0
    const proyek = new Set(rows.map((row) => String(row.data?.lokasi_proyek || '').trim().toLowerCase()).filter(Boolean))
    return [
      { label: 'Entri tercatat', value: rows.length },
      { label: 'Pekerja hari terakhir', value: latest },
      { label: 'Rata-rata / hari', value: avg },
      { label: 'Proyek tercatat', value: proyek.size },
    ]
  }
  if (key === 'hseplan') {
    return [
      { label: 'Total rencana', value: rows.length },
      { label: 'Berjalan', value: status('In Progress') },
      { label: 'Terjadwal', value: status('Scheduled') },
      { label: 'Selesai', value: status('Closed') },
    ]
  }
  if (key === 'legal') {
    return [
      { label: 'Total register', value: rows.length },
      { label: 'Compliant', value: status('Compliant') },
      { label: 'In Progress', value: status('In Progress') },
      { label: 'Non-Compliant', value: status('Non-Compliant') },
    ]
  }
  if (key === 'sertifikasi') {
    return [
      { label: 'Total sertifikasi', value: rows.length },
      { label: 'Active', value: status('Active') },
      { label: 'Near Expiry', value: status('Near Expiry') },
      { label: 'Expired', value: status('Expired') },
    ]
  }
  if (key === 'csms') {
    return [
      { label: 'Total kontraktor', value: rows.length },
      { label: 'Qualified', value: status('Qualified') },
      { label: 'Probation', value: status('Probation') },
      { label: 'Blacklisted', value: status('Blacklisted') },
    ]
  }
  return [{ label: 'Total catatan', value: rows.length }]
}

export function titleField(schema) {
  return schema.fields.find((field) => field.title) || schema.fields[0]
}

export function columnFields(schema) {
  const cols = schema.fields.filter((field) => field.col)
  return cols.length ? cols.slice(0, 4) : schema.fields.slice(0, 3)
}

/** Sidebar admin. PTW, analitik SOC, tim, dan pengaturan mengarah ke halaman yang sudah ada. */
export const ADMIN_NAV = [
  {
    label: null,
    items: [
      { to: '/admin', end: true, label: 'Dashboard' },
      { to: '/admin/performa', label: 'Performa HSE' },
      { to: '/admin/statistik', label: 'Statistik KPI' },
      { to: '/admin/ringkasan', label: 'Analitik SOC' },
    ],
  },
  {
    label: 'Tenaga Kerja',
    items: [
      { to: '/admin/modul/employee', label: 'Employee' },
      { to: '/admin/modul/manpower', label: 'Man Power' },
      { to: '/admin/man-hours', label: 'Safety Man Hours' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/admin/modul/hseplan', label: 'HSE Plan' },
      { to: '/admin/insiden', label: 'Insiden' },
      { to: '/admin/modul/inspeksi', label: 'Inspeksi' },
      { to: '/admin/modul/capa', label: 'Tindakan Perbaikan (CAPA)' },
      { to: '/admin/modul/audit', label: 'Manajemen Audit' },
      { to: '/admin/modul/hiradc', label: 'HIRADC & Risiko' },
      { to: '/admin/ptw', label: 'Izin Kerja (PTW)' },
      { to: '/admin/visit', label: 'Kunjungan' },
      { to: '/admin/modul/legal', label: 'Legal & Kepatuhan' },
      { to: '/admin/modul/sertifikasi', label: 'SIA/SIO & Sertifikasi' },
      { to: '/admin/modul/csms', label: 'Manajemen CSMS' },
    ],
  },
  {
    label: 'Aktivitas',
    items: [
      { to: '/admin/modul/kalender', label: 'Kalender Keselamatan' },
      { to: '/admin/modul/rapat', label: 'Rapat HSE' },
      { to: '/admin/modul/pelatihan', label: 'Pelatihan' },
    ],
  },
  {
    label: 'Sumber Daya',
    items: [
      { to: '/admin/modul/inventaris', label: 'Inventaris HSE' },
      { to: '/admin/modul/dokumen', label: 'Pusat Dokumen' },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { to: '/admin/pengguna', label: 'Manajemen Tim', gate: 'users' },
      { to: '/admin/pengaturan', label: 'Pengaturan', gate: 'notifications' },
      { to: '/admin/aktivitas', label: 'HSE Log', gate: 'activity' },
    ],
  },
]
