// Data layer — terhubung ke tabel `observations` di Supabase (project yang
// sama dipakai oleh aplikasi-pertama). Halaman (pages/) cuma manggil fungsi
// di file ini, jadi detail Supabase (nama kolom, upload foto, dst) tidak
// perlu diketahui oleh komponen UI.

import { PHOTO_BUCKET, supabase } from './supabase'

function toAppShape(row) {
  return {
    id: row.id,
    nama_pelapor: row.reporter_name,
    departemen: row.reporter_position,
    nama_perusahaan: row.company_name,
    tanggal_waktu: row.incident_datetime,
    lokasi_teks: row.location_text,
    lokasi_gps: row.latitude != null ? { lat: row.latitude, lng: row.longitude } : null,
    kategori: row.category,
    deskripsi: row.description,
    tingkat_risiko: row.risk_level,
    foto: row.photo_urls || [],
    tindakan_langsung: row.immediate_action || '',
    rekomendasi: row.recommendation || '',
    pic_assigned: row.assigned_pic || '',
    status: row.status,
    catatan_penutupan: row.closing_notes || '',
    created_at: row.created_at,
  }
}

async function uploadPhotos(files) {
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file)
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

export async function getObservations() {
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(toAppShape)
}

export async function addObservation(data) {
  const photoUrls = await uploadPhotos(data.foto || [])

  // Sengaja tidak chain .select() di sini: pelapor publik (role anon) cuma
  // punya izin INSERT, bukan SELECT, jadi .select() bikin insert ditolak RLS
  // (Postgres butuh izin SELECT juga untuk me-return baris lewat RETURNING).
  const { error } = await supabase.from('observations').insert({
    reporter_name: data.nama_pelapor,
    reporter_position: data.departemen,
    company_name: data.nama_perusahaan,
    incident_datetime: new Date(data.tanggal_waktu).toISOString(),
    location_text: data.lokasi_teks,
    latitude: data.lokasi_gps?.lat ?? null,
    longitude: data.lokasi_gps?.lng ?? null,
    category: data.kategori,
    description: data.deskripsi,
    risk_level: data.tingkat_risiko,
    photo_urls: photoUrls,
    immediate_action: data.tindakan_langsung || null,
    recommendation: data.rekomendasi || null,
  })

  if (error) throw new Error(error.message)
}

export async function updateObservation(id, patch) {
  const dbPatch = {}
  if ('pic_assigned' in patch) dbPatch.assigned_pic = patch.pic_assigned || null
  if ('status' in patch) dbPatch.status = patch.status
  if ('catatan_penutupan' in patch) dbPatch.closing_notes = patch.catatan_penutupan || null
  if (patch.status === 'Closed') dbPatch.closed_date = new Date().toISOString().slice(0, 10)

  const { data: row, error } = await supabase
    .from('observations')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return toAppShape(row)
}
