import { PHOTO_BUCKET, supabase } from './supabase'
import { photoStoragePath, validatePhotoFile } from './limits'
import { triggerNotificationProcessingInBackground } from './store'

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

export function submitWorkPermit(payload) {
  return rpc('submit_work_permit', { p: payload })
}

export function submitVisitRequest(payload) {
  return rpc('submit_visit_request', { p: payload })
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
  const id = await rpc('queue_followup_email', {
    p_id: observationId,
    p_app_url: window.location.origin,
  })
  triggerNotificationProcessingInBackground(observationId)
  return id
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

export function approveWorkPermit(id) {
  return rpc('approve_work_permit', { p_id: id })
}

export function rejectWorkPermit(id, reason) {
  return rpc('reject_work_permit', { p_id: id, p_reason: reason })
}

export function approveVisitRequest(id) {
  return rpc('approve_visit_request', { p_id: id })
}

export function rejectVisitRequest(id, reason) {
  return rpc('reject_visit_request', { p_id: id, p_reason: reason })
}

export const PERMIT_KINDS = [
  {
    id: 'job_permit',
    title: 'Job Permit',
    life: 'Berlaku 14 hari',
    lifeEn: 'Valid for 14 days after HSSE approval',
  },
  {
    id: 'e_permit',
    title: 'E-Permit to Work',
    life: 'Berlaku 12 jam',
    lifeEn: 'Valid for 12 hours after HSSE approval',
  },
]

export const WORK_TYPES = ['Hot Work', 'Cold Work', 'Confine Space', 'Isolation Energy']

export function permitKindLabel(kind) {
  return PERMIT_KINDS.find((k) => k.id === kind)?.title || kind
}
