import { PHOTO_BUCKET, supabase } from './supabase'
import { photoStoragePath, validatePhotoFile } from './limits'

export function randomToken() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function passUrl(kind, token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/pass/${kind}/${token}`
}

export function formatJakarta(value, withTime = true) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(date)
}

function explain(error) {
  const msg = error?.message || 'Permintaan gagal.'
  if (/schema cache|could not find|does not exist|PGRST202|PGRST205/i.test(msg)) {
    return 'Modul belum aktif di database. Jalankan file supabase/schema-v13-followup-ptw-visit.sql di SQL Editor.'
  }
  return msg
}

async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(explain(error))
  return data
}

export async function uploadEvidenceFiles(files) {
  const urls = []
  for (const file of files) {
    const invalid = validatePhotoFile(file)
    if (invalid) throw new Error(invalid)
    const path = photoStoragePath(file)
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

function appOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://bact-safety-observation-modern.vercel.app'
}

export async function deliverQueuedMail({ observationId, queueId } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const { data, error } = await supabase.functions.invoke('process-notifications', {
    body: {
      ...(observationId ? { observation_id: observationId } : {}),
      ...(queueId ? { queue_id: queueId } : {}),
    },
    ...(session?.access_token ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {}),
  })
  if (error || data?.ok === false) {
    let message = data?.error || error?.message || 'Email gagal dikirim.'
    const ctx = error?.context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const json = await ctx.json()
        if (json?.error) message = json.error
        const failed = Array.isArray(json?.results) ? json.results.find((row) => row.error) : null
        if (failed?.error) message = failed.error
      } catch {
        /* response body already read */
      }
    }
    throw new Error(message)
  }
  const results = Array.isArray(data?.results) ? data.results : []
  const failed = results.find((row) => row.sent === false || (row.error && !row.sent))
  if (failed?.error) throw new Error(failed.error)
  if (queueId && !results.some((row) => row.sent) && !data?.processed) {
    throw new Error('Email masuk antrian, tetapi belum terkirim ke penerima.')
  }
  return data
}

async function submitAndMail(fn, payload) {
  const issued = await rpc(fn, { p: { ...payload, app_url: appOrigin() } })
  if (!issued?.queue_id) return issued
  try {
    await deliverQueuedMail({ queueId: issued.queue_id })
    return { ...issued, email_sent: true }
  } catch (err) {
    return { ...issued, email_sent: false, email_error: err.message || 'Barcode belum terkirim ke email.' }
  }
}

export function submitWorkPermit(payload) {
  return submitAndMail('submit_work_permit', payload)
}

export function submitVisitRequest(payload) {
  return submitAndMail('submit_visit_request', payload)
}

export function getPublicPass(kind, token) {
  return rpc('get_public_pass', { p_kind: kind, p_token: token })
}

export function getFollowUpForm(token) {
  return rpc('get_followup_form', { p_token: token })
}

export function submitFollowUp(payload) {
  return rpc('submit_followup', { p: payload })
}

export async function listDepartmentContacts() {
  const { data, error } = await supabase
    .from('department_contacts')
    .select('department, email')
    .order('department')
  if (error) return []
  return data || []
}

export async function upsertDepartmentContact(department, email) {
  const { error } = await supabase.from('department_contacts').upsert({
    department,
    email: email.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(explain(error))
}

export async function queueFollowUpEmail(observationId) {
  const queueId = await rpc('queue_followup_email', {
    p_id: observationId,
    p_app_url: appOrigin(),
  })
  await deliverQueuedMail({ observationId, queueId })
  return queueId
}

export function listWorkPermits() {
  return supabase
    .from('work_permits')
    .select('*')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) throw new Error(explain(error))
      return data || []
    })
}

export function listVisitRequests() {
  return supabase
    .from('visit_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) throw new Error(explain(error))
      return data || []
    })
}

async function approveAndMail(fn, args) {
  const payload = typeof args === 'string' ? { p_id: args } : args
  const result = await rpc(fn, payload)
  if (!result?.queue_id) return result
  try {
    await deliverQueuedMail({ queueId: result.queue_id })
    return result
  } catch (err) {
    return { ...result, email_warning: err.message || 'Email persetujuan belum terkirim.' }
  }
}

export function approveWorkPermit(id, duration, reason) {
  return approveAndMail('approve_work_permit', {
    p_id: id,
    p_duration: duration || '',
    p_reason: reason || '',
  })
}

export function approveWorkPermitSpv(id, duration) {
  return approveAndMail('approve_work_permit_spv', { p_id: id, p_duration: duration })
}

export function listAreaAuthorities() {
  return rpc('list_area_authorities')
}

export function getMySignature() {
  return rpc('get_staff_signature')
}

export function saveMySignature(image) {
  return rpc('save_staff_signature', { p_image: image })
}

export function updateWorkPermitSheet(id, payload) {
  return rpc('update_work_permit_sheet', { p_id: id, p: payload })
}

export function rejectWorkPermit(id, reason) {
  return rpc('reject_work_permit', { p_id: id, p_reason: reason })
}

export function approveVisitRequest(id) {
  return approveAndMail('approve_visit_request', id)
}

export async function resendPassEmail(kind, id) {
  const queueId = await rpc('resend_pass_email', { p_kind: kind, p_id: id })
  if (!queueId) throw new Error('Pengajuan ini tidak punya email pemohon.')
  await deliverQueuedMail({ queueId })
}

export function rejectVisitRequest(id, reason) {
  return rpc('reject_visit_request', { p_id: id, p_reason: reason })
}

export const PERMIT_KINDS = [
  {
    id: 'work_permit',
    title: 'Izin kerja',
    life: '12 jam atau 7 hari, dipilih supervisor',
    lifeEn: '12 hours or 7 days, chosen by the supervisor',
  },
]

export const WORK_TYPES = ['Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy']

export const ELECTRONIC_DISCLAIMER =
  'Formulir ini elektronik dan tidak memerlukan tanda tangan fisik.'

export function permitKindLabel(kind) {
  if (kind === 'work_permit') return 'Izin kerja'
  if (kind === 'e_permit') return 'E-Permit to Work'
  if (kind === 'job_permit') return 'Job Permit'
  return kind || 'Izin kerja'
}

export function durationLabel(code) {
  if (code === '12h') return '12 jam · risiko tinggi'
  if (code === '7d') return '7 hari · risiko rendah'
  if (code === '14d') return '14 hari · izin lama'
  return 'Menunggu supervisor'
}

export function finalDuration(row) {
  return row?.hsse_duration_choice || row?.duration_choice || (row?.permit_kind === 'e_permit' ? '12h' : row?.permit_kind === 'job_permit' ? '14d' : '')
}

export function passPhase(row) {
  if (!row) return 'pending'
  if (row.status === 'Rejected') return 'rejected'
  if (row.status === 'SpvApproved') return 'awaiting_hsse'
  if (row.status !== 'Approved') return 'pending'
  const now = Date.now()
  const until = row.valid_until ? new Date(row.valid_until).getTime() : NaN
  const from = row.valid_from ? new Date(row.valid_from).getTime() : NaN
  if (!Number.isNaN(until) && now > until) return 'expired'
  if (!Number.isNaN(from) && now < from) return 'scheduled'
  return 'valid'
}

const PHASE_LABEL = {
  pending: 'Pending SPV',
  awaiting_hsse: 'Pending HSSE',
  scheduled: 'Scheduled',
  valid: 'Valid',
  expired: 'Expired',
  rejected: 'Rejected',
}

export function phaseLabel(phase) {
  return PHASE_LABEL[phase] || phase
}

export function expiringSoon(row) {
  if (passPhase(row) !== 'valid') return false
  if (!row?.valid_until) return false
  const ms = new Date(row.valid_until).getTime() - Date.now()
  if (ms <= 0) return false
  const windowMs = finalDuration(row) === '12h' ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  return ms <= windowMs
}

export function remainingLabel(row) {
  const phase = passPhase(row)
  if (phase === 'pending') return 'Waiting for SPV'
  if (phase === 'awaiting_hsse') return 'Waiting for HSSE'
  if (phase === 'rejected') return 'Rejected'
  if (phase === 'scheduled') return `Starts ${formatJakarta(row.valid_from)}`
  if (!row?.valid_until) return '—'
  const ms = new Date(row.valid_until).getTime() - Date.now()
  const abs = Math.abs(ms)
  const hours = Math.max(1, Math.round(abs / 36e5))
  const days = Math.max(1, Math.round(abs / 864e5))
  const span = abs < 36 * 36e5 ? `${hours} h` : `${days} d`
  if (phase === 'expired') return `Expired ${span} ago`
  return `${span} left`
}

export function downloadCsv(filename, headers, rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`
  const csv = [headers, ...rows].map((line) => line.map(escape).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
