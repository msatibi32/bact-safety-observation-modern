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
    potensi_risiko: row.potential_risk_level || row.risk_level,
    is_hipo: row.is_hipo ?? false,
    life_saving_rule: row.life_saving_rule || 'Tidak terkait',
    stop_work: row.stop_work ?? false,
    foto: row.photo_urls || [],
    tindakan_langsung: row.immediate_action || '',
    rekomendasi: row.recommendation || '',
    pic_assigned: row.assigned_pic || '',
    status: row.status,
    triage_notes: row.triage_notes || '',
    investigation_notes: row.investigation_notes || '',
    root_cause: row.root_cause || '',
    verification_notes: row.verification_notes || '',
    verified_at: row.verified_at,
    verified_by: row.verified_by || '',
    catatan_penutupan: row.closing_notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    closed_date: row.closed_date,
    is_anonymous: row.is_anonymous ?? false,
    escalated: row.escalated ?? false,
    escalation_due_at: row.escalation_due_at,
  }
}

function toCapaShape(row) {
  return {
    id: row.id,
    observation_id: row.observation_id,
    title: row.title,
    description: row.description || '',
    owner: row.owner,
    due_date: row.due_date,
    status: row.status,
    completed_at: row.completed_at,
    verification_notes: row.verification_notes || '',
    created_at: row.created_at,
  }
}

function toAuditShape(row) {
  return {
    id: row.id,
    observation_id: row.observation_id,
    action: row.action,
    details: row.details || '',
    actor_email: row.actor_email || 'Sistem',
    created_at: row.created_at,
  }
}

async function getActorEmail() {
  const { data } = await supabase.auth.getUser()
  return data.user?.email || 'Admin'
}

async function logAudit(observationId, action, details, actorEmail) {
  const email = actorEmail ?? (await getActorEmail())
  await supabase.from('audit_logs').insert({
    observation_id: observationId,
    action,
    details,
    actor_email: email,
  })
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

export async function getObservation(id) {
  const { data, error } = await supabase.from('observations').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return toAppShape(data)
}

export async function addObservation(data) {
  const photoUrls = await uploadPhotos(data.foto || [])
  const id = crypto.randomUUID()

  const row = {
    id,
    reporter_name: data.is_anonymous ? 'Anonim' : data.nama_pelapor,
    reporter_position: data.departemen,
    company_name: data.nama_perusahaan,
    is_anonymous: data.is_anonymous ?? false,
    incident_datetime: new Date(data.tanggal_waktu).toISOString(),
    location_text: data.lokasi_teks,
    latitude: data.lokasi_gps?.lat ?? null,
    longitude: data.lokasi_gps?.lng ?? null,
    category: data.kategori,
    description: data.deskripsi,
    risk_level: data.tingkat_risiko,
    potential_risk_level: data.potensi_risiko || data.tingkat_risiko,
    is_hipo: data.is_hipo ?? false,
    life_saving_rule: data.life_saving_rule || 'Tidak terkait',
    stop_work: data.stop_work ?? false,
    photo_urls: photoUrls,
    immediate_action: data.tindakan_langsung || null,
    recommendation: data.rekomendasi || null,
    status: data.is_hipo ? 'Under Review' : 'Open',
  }

  const { error } = await supabase.from('observations').insert(row)
  if (error) throw new Error(error.message)

  try {
    await supabase.from('audit_logs').insert({
      observation_id: id,
      action: 'Laporan dikirim',
      details: `Kategori: ${data.kategori}, Risiko: ${data.tingkat_risiko}${data.is_hipo ? ' (HiPo)' : ''}`,
      actor_email: data.nama_pelapor,
    })
  } catch {
    // audit_logs mungkin belum ada jika migrasi v2 belum dijalankan
  }

  triggerNotificationProcessingInBackground()

  return id
}

export async function updateObservation(id, patch, previous) {
  const dbPatch = {}
  if ('pic_assigned' in patch) dbPatch.assigned_pic = patch.pic_assigned || null
  if ('status' in patch) dbPatch.status = patch.status
  if ('catatan_penutupan' in patch) dbPatch.closing_notes = patch.catatan_penutupan || null
  if ('triage_notes' in patch) dbPatch.triage_notes = patch.triage_notes || null
  if ('investigation_notes' in patch) dbPatch.investigation_notes = patch.investigation_notes || null
  if ('root_cause' in patch) dbPatch.root_cause = patch.root_cause || null
  if ('verification_notes' in patch) dbPatch.verification_notes = patch.verification_notes || null
  if ('is_hipo' in patch) dbPatch.is_hipo = patch.is_hipo

  if (patch.status === 'Closed') {
    dbPatch.closed_date = new Date().toISOString().slice(0, 10)
  }
  if (patch.status === 'Pending Verification' || patch.status === 'Closed') {
    if (patch.verification_notes) {
      dbPatch.verified_at = new Date().toISOString()
      dbPatch.verified_by = await getActorEmail()
    }
  }

  const { data: row, error } = await supabase
    .from('observations')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  const changes = []
  if (previous && patch.status && previous.status !== patch.status) {
    changes.push(`Status: ${previous.status} → ${patch.status}`)
  }
  if (previous && patch.pic_assigned !== undefined && previous.pic_assigned !== patch.pic_assigned) {
    changes.push(`PIC: ${previous.pic_assigned || '—'} → ${patch.pic_assigned || '—'}`)
  }
  if (changes.length > 0) {
    try {
      await logAudit(id, 'Perubahan laporan', changes.join('; '))
    } catch {
      /* migrasi belum dijalankan */
    }
  }

  return toAppShape(row)
}

// ─── CAPA ────────────────────────────────────────────────────────────────────

export async function getCapaByObservation(observationId) {
  const { data, error } = await supabase
    .from('capa_actions')
    .select('*')
    .eq('observation_id', observationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(toCapaShape)
}

export async function getAllCapa() {
  const { data, error } = await supabase
    .from('capa_actions')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(toCapaShape)
}

export async function addCapa(observationId, capa) {
  const { data, error } = await supabase
    .from('capa_actions')
    .insert({
      observation_id: observationId,
      title: capa.title,
      description: capa.description || null,
      owner: capa.owner,
      due_date: capa.due_date || null,
      status: 'Open',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  try {
    await logAudit(observationId, 'CAPA dibuat', `"${capa.title}" → ${capa.owner}`)
  } catch {
    /* noop */
  }

  return toCapaShape(data)
}

export async function updateCapa(id, observationId, patch) {
  const dbPatch = { ...patch }
  if (patch.status === 'Completed' || patch.status === 'Verified') {
    dbPatch.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('capa_actions')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  try {
    await logAudit(observationId, 'CAPA diperbarui', `"${data.title}" → status ${patch.status}`)
  } catch {
    /* noop */
  }

  return toCapaShape(data)
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export async function getAuditLogs(observationId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('observation_id', observationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(toAuditShape)
}

// ─── KPI & Notifications ─────────────────────────────────────────────────────

export async function getKpiTargets() {
  const { data, error } = await supabase.from('kpi_targets').select('*')
  if (error) return null
  return data || []
}

export async function getPendingNotifications() {
  const { data, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data || []
}

export async function getNotificationRecipients() {
  const { data, error } = await supabase
    .from('notification_recipients')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(recipientError(error))
  return data || []
}

function recipientError(error) {
  const msg = error?.message || 'Gagal menyimpan email.'
  if (error?.code === '23505' || /duplicate|unique/i.test(msg)) {
    return 'Email ini sudah ada di daftar penerima.'
  }
  if (/permission|rls|row-level/i.test(msg)) {
    return 'Tidak punya izin mengubah daftar email. Login sebagai admin/HSE.'
  }
  if (/relation .* does not exist|schema cache/i.test(msg)) {
    return 'Tabel penerima email belum ada. Jalankan schema-v4-notification-emails.sql di Supabase.'
  }
  return msg
}

export async function addNotificationRecipient({ email, label }) {
  const { data, error } = await supabase
    .from('notification_recipients')
    .insert({ email: email.trim().toLowerCase(), label: label?.trim() || null })
    .select()
    .single()
  if (error) throw new Error(recipientError(error))
  return data
}

export async function toggleNotificationRecipient(id, active) {
  const { error } = await supabase.from('notification_recipients').update({ active }).eq('id', id)
  if (error) throw new Error(recipientError(error))
}

export async function updateNotificationRecipient(id, patch) {
  const { error } = await supabase.from('notification_recipients').update(patch).eq('id', id)
  if (error) throw new Error(recipientError(error))
}

export async function removeNotificationRecipient(id) {
  const { error } = await supabase.from('notification_recipients').delete().eq('id', id)
  if (error) throw new Error(recipientError(error))
}

export async function getNotificationLog() {
  const { data, error } = await supabase
    .from('notification_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) return []
  return data || []
}

export async function sendTestNotification(email) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi login habis. Silakan login ulang.')

  const { data, error } = await supabase.functions.invoke('process-notifications', {
    body: { action: 'test', email: email.trim().toLowerCase() },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error) {
    const msg = error.message || 'Gagal memanggil Edge Function'
    if (msg.includes('Failed to send a request')) {
      throw new Error(
        'Gagal menghubungi Edge Function. Pastikan process-notifications sudah di-deploy ulang di Supabase.',
      )
    }
    throw new Error(msg)
  }
  if (data?.ok === false) {
    throw new Error(data.error || 'Tes email gagal')
  }
  return data
}

/** Fire-and-forget: proses antrian notifikasi tanpa menunggu (fallback jika webhook gagal). */
export function triggerNotificationProcessingInBackground() {
  void invokeProcessNotifications().catch(() => {})
}

async function invokeProcessNotifications() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return supabase.functions.invoke('process-notifications', {
    ...(session && {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }),
  })
}

export async function triggerNotificationProcessing() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Sesi login habis. Silakan login ulang.')
  }

  const { data, error } = await invokeProcessNotifications()

  if (error) {
    const msg = error.message || 'Gagal memanggil Edge Function'
    if (msg.includes('Failed to send a request')) {
      throw new Error(
        'Gagal menghubungi Edge Function. Pastikan process-notifications sudah di-deploy di Supabase.',
      )
    }
    throw new Error(msg)
  }

  if (data?.ok === false) {
    throw new Error(data.error || 'Proses notifikasi gagal')
  }

  return data
}

export function getObservationsWithGps(observations) {
  return observations.filter((o) => o.lokasi_gps?.lat != null && o.lokasi_gps?.lng != null)
}
