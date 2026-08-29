export function exportObservationsCsv(observations, filename = 'laporan-soc-bact.csv') {
  const headers = [
    'ID',
    'Tanggal',
    'Pelapor',
    'Departemen',
    'Perusahaan',
    'Lokasi',
    'Kategori',
    'Risiko',
    'Potensi Risiko',
    'HiPo',
    'Life Saving Rule',
    'Stop Work',
    'Status',
    'PIC',
    'Deskripsi',
    'Rekomendasi',
    'Tanggal Tutup',
  ]

  const rows = observations.map((o) => [
    o.id,
    new Date(o.tanggal_waktu).toLocaleString('id-ID'),
    o.nama_pelapor,
    o.departemen,
    o.nama_perusahaan,
    o.lokasi_teks,
    o.kategori,
    o.tingkat_risiko,
    o.potensi_risiko,
    o.is_hipo ? 'Ya' : 'Tidak',
    o.life_saving_rule,
    o.stop_work ? 'Ya' : 'Tidak',
    o.status,
    o.pic_assigned,
    o.deskripsi,
    o.rekomendasi,
    o.closed_date || '',
  ])

  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function avgDaysToClose(observations) {
  const closed = observations.filter((o) => o.status === 'Closed' && o.created_at)
  if (!closed.length) return null
  const totalDays = closed.reduce((sum, o) => {
    const start = new Date(o.created_at)
    const end = o.closed_date ? new Date(o.closed_date) : new Date(o.updated_at || o.created_at)
    return sum + (end - start) / (1000 * 60 * 60 * 24)
  }, 0)
  return Math.round(totalDays / closed.length)
}

export function countOverdueCapa(capaList) {
  const today = new Date().toISOString().slice(0, 10)
  return capaList.filter(
    (c) => c.due_date && c.due_date < today && c.status !== 'Completed' && c.status !== 'Verified',
  ).length
}
