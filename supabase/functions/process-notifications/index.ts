// Kirim notifikasi email dari notification_queue
// Email penerima diambil dari tabel notification_recipients (kelola via dashboard admin)
//
// Product: pengirim = Resend dulu. Kalau Resend 403 / domain belum verified, fallback Brevo.
// Jangan deploy Resend-only selama from masih onboarding@resend.dev.
// Hostinger mailbox hanya untuk baca, bukan SMTP kirim.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY       — wajib untuk kirim
//   NOTIFY_EMAIL_FROM    — mis. "BACT SOC <onboarding@resend.dev>" atau domain terverifikasi
//   PUBLIC_APP_URL       — URL dashboard (opsional)
//   FONNTE_TOKEN         — opsional WA
//   NOTIFY_WA_TO         — opsional WA

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || ''
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'BACT SOC'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const NOTIFY_EMAIL_FROM = Deno.env.get('NOTIFY_EMAIL_FROM') || 'BACT SOC <onboarding@resend.dev>'
const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN') || ''
const NOTIFY_WA_TO = Deno.env.get('NOTIFY_WA_TO') || ''
const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

type SendResult = {
  ok: boolean
  skipped: boolean
  provider: 'resend' | 'brevo' | 'none'
  from: string
  id: string | null
  error?: string
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function staffRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null) {
  return String(user?.app_metadata?.role || user?.user_metadata?.role || '')
}

function isHseStaff(role: string) {
  return role === 'hse' || role === 'admin' || role === 'super_admin'
}

function isSuperAdmin(role: string) {
  return role === 'admin' || role === 'super_admin'
}

function isResendTestingRestriction(error?: string) {
  const text = (error || '').toLowerCase()
  return (
    text.includes('403') ||
    text.includes('validation_error') ||
    text.includes('not allowed') ||
    text.includes('testing emails') ||
    text.includes('you can only send') ||
    text.includes('unverified') ||
    text.includes('not verified')
  )
}

async function getCallerUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

type Payload = {
  observation_id?: string
  category?: string
  risk_level?: string
  location?: string
  reporter?: string
  is_hipo?: boolean
  company?: string
  last_send?: unknown
  department?: string
  soc_number?: string
  link?: string
  only_to?: string
  subject_override?: string
  catchup_note?: string
}

function parseFromAddress(raw: string) {
  const match = raw.match(/<([^>]+)>/)
  return (match ? match[1] : raw).trim()
}

function fromDomain(raw: string) {
  const email = parseFromAddress(raw)
  return email.includes('@') ? email.split('@')[1] : ''
}

function brevoSenderEmail() {
  if (BREVO_SENDER_EMAIL) return BREVO_SENDER_EMAIL.trim()
  const from = parseFromAddress(NOTIFY_EMAIL_FROM)
  if (from && !from.endsWith('resend.dev')) return from
  return 'chibiajjh12@gmail.com'
}

function chosenProvider(): 'resend' | 'brevo' | 'none' {
  if (RESEND_API_KEY) return 'resend'
  if (BREVO_API_KEY) return 'brevo'
  return 'none'
}

function humanizeResendError(raw: string, email: string) {
  const text = (raw || '').replace(/\s+/g, ' ').trim()
  if (
    text.includes('403') ||
    text.includes('validation_error') ||
    text.includes('not allowed') ||
    text.includes('You can only send testing emails')
  ) {
    return `${email}: Resend 403 (belum ada domain terverifikasi). ${text.slice(0, 240)}`
  }
  return `${email}: Resend: ${text.slice(0, 280)}`
}

function humanizeBrevoError(raw: string, email: string) {
  const text = raw || ''
  if (text.includes('not verified') || text.includes('unrecognised') || text.includes('sender')) {
    return `${email}: Brevo menolak pengirim. Verifikasi ${brevoSenderEmail()} di Brevo → Senders.`
  }
  return `${email}: Brevo: ${text.slice(0, 280)}`
}

function buildMessage(type: string, p: Payload) {
  if (type === 'followup_assign') {
    return [
      'Tindak lanjut SOC — BACT',
      '',
      `Departemen: ${p.department || '—'}`,
      `Nomor: ${p.soc_number || '—'}`,
      `Kategori: ${p.category || '—'}`,
      `Risiko: ${p.risk_level || '—'}`,
      `Lokasi: ${p.location || '—'}`,
      '',
      'Buka tautan ini untuk mengisi deadline, action plan, bukti foto, dan menutup laporan jika sudah selesai. Tidak perlu login.',
      p.link || '',
      '',
      'Jika lewat deadline, isi alasannya. HSSE tidak menutup laporan ini secara manual.',
    ].join('\n')
  }
  const label = type === 'hipo_alert' || p.is_hipo ? 'HiPo Alert' : 'Laporan Baru'
  const lines = [
    `${label} — BACT SOC`,
    '',
    `Kategori: ${p.category || '—'}`,
    `Risiko: ${p.risk_level || '—'}`,
    `Lokasi: ${p.location || '—'}`,
    `Pelapor: ${p.reporter || '—'}`,
    `Perusahaan: ${p.company || '—'}`,
    `ID: ${(p.observation_id || '').slice(0, 8)}`,
  ]
  if (p.catchup_note) lines.push('', p.catchup_note)
  if (PUBLIC_APP_URL) lines.push('', `Dashboard: ${PUBLIC_APP_URL}/admin`)
  return lines.join('\n')
}

async function getRecipientEmails(
  supabase: ReturnType<typeof createClient>,
  isHiPo: boolean,
  onlyTo?: string,
): Promise<string[]> {
  if (onlyTo) return [onlyTo.trim().toLowerCase()].filter(Boolean)

  const { data } = await supabase
    .from('notification_recipients')
    .select('email, notify_new_report, notify_hipo')
    .eq('active', true)

  const emails = (data || [])
    .filter((r) => (isHiPo ? r.notify_hipo !== false : r.notify_new_report !== false))
    .map((r) => r.email)
    .filter(Boolean)

  return [...new Set(emails)]
}

async function resolveResendFrom(): Promise<{
  from: string
  domainSource: string
  verifiedDomain: string | null
  domains: Array<{ name: string; status: string }>
}> {
  const fallback = NOTIFY_EMAIL_FROM
  const empty = { from: fallback, domainSource: 'env', verifiedDomain: null, domains: [] as Array<{ name: string; status: string }> }
  if (!RESEND_API_KEY) return empty
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    })
    const raw = await res.text()
    if (!res.ok) return empty
    const parsed = JSON.parse(raw) as { data?: Array<{ name?: string; status?: string }> }
    const domains = (parsed.data || [])
      .filter((d) => d.name)
      .map((d) => ({ name: String(d.name), status: String(d.status || 'unknown') }))
    const verified = domains.find((d) => d.status === 'verified')
    if (verified) {
      return {
        from: `BACT SOC <noreply@${verified.name}>`,
        domainSource: 'resend_verified_domain',
        verifiedDomain: verified.name,
        domains,
      }
    }
    return { from: fallback, domainSource: 'env', verifiedDomain: null, domains }
  } catch {
    return empty
  }
}

async function sendViaBrevo(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const from = `${BREVO_SENDER_NAME} <${brevoSenderEmail()}>`
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: brevoSenderEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  })
  const raw = await res.text()
  let parsed: { messageId?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }
  if (res.ok) {
    return { ok: true, skipped: false, provider: 'brevo', from, id: parsed.messageId || null }
  }
  return { ok: false, skipped: false, provider: 'brevo', from, id: null, error: humanizeBrevoError(raw, to) }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string,
): Promise<SendResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  })
  const raw = await res.text()
  let parsed: { id?: string; message?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }
  if (res.ok) {
    return { ok: true, skipped: false, provider: 'resend', from, id: parsed.id || null }
  }
  return {
    ok: false,
    skipped: false,
    provider: 'resend',
    from,
    id: null,
    error: humanizeResendError(raw || parsed.message || '', to),
  }
}

async function sendEmailToOne(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string,
): Promise<SendResult> {
  if (RESEND_API_KEY) {
    const resendResult = await sendViaResend(to, subject, html, text, from)
    if (resendResult.ok) return resendResult
    if (BREVO_API_KEY && isResendTestingRestriction(resendResult.error)) {
      const brevoResult = await sendViaBrevo(to, subject, html, text)
      if (brevoResult.ok) return brevoResult
      return {
        ...brevoResult,
        error: `${resendResult.error} | Brevo fallback: ${brevoResult.error || 'gagal'}`,
      }
    }
    return resendResult
  }
  if (BREVO_API_KEY) return sendViaBrevo(to, subject, html, text)
  return {
    ok: false,
    skipped: true,
    provider: 'none',
    from,
    id: null,
    error: 'RESEND_API_KEY / BREVO_API_KEY belum di-set di Supabase Edge Function secrets',
  }
}

async function sendEmailToAll(to: string[], subject: string, html: string, text: string, from: string) {
  if (!RESEND_API_KEY && !BREVO_API_KEY) {
    return {
      skipped: true,
      provider: 'none' as const,
      from,
      sentTo: [] as string[],
      ids: {} as Record<string, string>,
      failed: [] as { email: string; error: string }[],
      usedBrevoFallback: false,
    }
  }
  const sentTo: string[] = []
  const ids: Record<string, string> = {}
  const failed: { email: string; error: string }[] = []
  let usedBrevoFallback = false
  for (const email of to) {
    const result = await sendEmailToOne(email, subject, html, text, from)
    if (result.ok) {
      sentTo.push(email)
      if (result.id) ids[email] = result.id
      if (result.provider === 'brevo' && RESEND_API_KEY) usedBrevoFallback = true
    } else {
      failed.push({ email, error: result.error || 'Gagal kirim' })
    }
  }
  return {
    skipped: false,
    provider: usedBrevoFallback ? 'brevo' : chosenProvider(),
    from,
    sentTo,
    ids,
    failed,
    usedBrevoFallback,
  }
}

async function sendWhatsApp(message: string) {
  if (!FONNTE_TOKEN || !NOTIFY_WA_TO) return { ok: false, skipped: true }
  const body = new URLSearchParams({ target: NOTIFY_WA_TO, message, countryCode: '62' })
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: FONNTE_TOKEN },
    body,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && data?.status !== false, error: data?.reason || null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const caller = await getCallerUser(req, supabase)
  const role = staffRole(caller)
  const staffCaller = caller && isHseStaff(role)
  const superAdminCaller = caller && isSuperAdmin(role)
  const observationId = typeof body.observation_id === 'string' ? body.observation_id.trim() : ''
  const publicProcess = Boolean(observationId) && !staffCaller

  if (body.action === 'diag') {
    if (!superAdminCaller) {
      return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
    }
    const resendFrom = await resolveResendFrom()
    const fromAddress = chosenProvider() === 'resend' ? resendFrom.from : `${BREVO_SENDER_NAME} <${brevoSenderEmail()}>`
    return jsonResponse(req, {
      ok: true,
      provider: chosenProvider(),
      has_resend: Boolean(RESEND_API_KEY),
      has_brevo: Boolean(BREVO_API_KEY),
      from: fromAddress,
      from_domain: fromDomain(fromAddress),
      domain_source: resendFrom.domainSource,
      verified_domain: resendFrom.verifiedDomain,
      resend_domains: resendFrom.domains,
      brevo_fallback: Boolean(BREVO_API_KEY),
    })
  }

  if (body.action === 'test' && typeof body.email === 'string') {
    if (!superAdminCaller) {
      return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
    }
    const resendFrom = await resolveResendFrom()
    const fromAddress = chosenProvider() === 'resend' ? resendFrom.from : `${BREVO_SENDER_NAME} <${brevoSenderEmail()}>`
    const email = body.email.trim().toLowerCase()
    if (!email) return jsonResponse(req, { ok: false, error: 'Email tes kosong' }, 400)
    const text = [
      'Tes notifikasi — BACT SOC',
      '',
      'Email ini dikirim dari dashboard untuk memastikan alamat penerima bisa menerima notifikasi laporan.',
      `Pengirim: ${fromAddress}`,
      PUBLIC_APP_URL ? `Dashboard: ${PUBLIC_APP_URL}/admin` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const result = await sendEmailToOne(
      email,
      '[BACT SOC] Tes notifikasi',
      `<p>${escapeHtml(text).replaceAll('\n', '<br>')}</p>`,
      text,
      fromAddress,
    )
    console.log(
      JSON.stringify({
        event: 'notify_test',
        provider: result.provider,
        from: result.from,
        to: email,
        ok: result.ok,
        id: result.id,
      }),
    )
    if (result.ok) {
      return jsonResponse(req, {
        ok: true,
        sent: true,
        to: email,
        provider: result.provider,
        from: result.from,
        resend_id: result.id || null,
        used_brevo_fallback: result.provider === 'brevo' && Boolean(RESEND_API_KEY),
      })
    }
    return jsonResponse(req, { ok: false, error: result.error || 'Gagal kirim tes', provider: result.provider, from: result.from })
  }

  if (!staffCaller && !observationId) {
    return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
  }

  const resendFrom = await resolveResendFrom()
  const fromAddress = chosenProvider() === 'resend' ? resendFrom.from : `${BREVO_SENDER_NAME} <${brevoSenderEmail()}>`

  let pendingQuery = supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .in('type', ['new_report', 'hipo_alert', 'followup_assign'])
    .order('created_at', { ascending: true })
    .limit(20)

  if (observationId) {
    pendingQuery = pendingQuery.filter('payload->>observation_id', 'eq', observationId)
  }

  const { data: pending, error } = await pendingQuery

  if (error) {
    return jsonResponse(req, { ok: false, error: error.message }, 500)
  }

  let processed = 0
  const results: unknown[] = []

  for (const row of pending || []) {
    const p = row.payload as Payload
    const relatedId = String(p.observation_id || '')
    if (relatedId) {
      const { data: obs } = await supabase
        .from('observations')
        .select('id, triage_notes')
        .eq('id', relatedId)
        .maybeSingle()
      const importTagged = String(obs?.triage_notes || '').toLowerCase().includes('imported from hse excel')
      if (!obs || importTagged) {
        await supabase
          .from('notification_queue')
          .update({
            status: 'failed',
            error_message: obs
              ? 'Skipped: historical Excel import (not a live form submission)'
              : 'Skipped: observation no longer exists',
          })
          .eq('id', row.id)
        results.push({ id: row.id, skipped: true, reason: obs ? 'import' : 'missing' })
        continue
      }
    }
    const isHiPo = row.type === 'hipo_alert' || !!p.is_hipo
    const recipients = await getRecipientEmails(supabase, isHiPo, p.only_to)
    const text = buildMessage(row.type, p)
    const subject = p.subject_override
      ? String(p.subject_override)
      : isHiPo
        ? `[BACT SOC] HiPo — ${p.category || 'Observasi'}`
        : `[BACT SOC] Laporan Baru — ${p.category || 'Observasi'}`
    const html = `<p>${escapeHtml(text).replaceAll('\n', '<br>')}</p>`

    if (recipients.length === 0 && !FONNTE_TOKEN) {
      results.push({ id: row.id, error: 'Tidak ada email penerima aktif. Tambahkan di dashboard.' })
      continue
    }

    const emailResult = await sendEmailToAll(recipients, subject, html, text, fromAddress)
    const waResult =
      row.type === 'followup_assign' ? { ok: true, skipped: true } : await sendWhatsApp(text)

    const lastSend = {
      provider: emailResult.provider,
      from: emailResult.from,
      domain_source: resendFrom.domainSource,
      verified_domain: resendFrom.verifiedDomain,
      resend_domains: publicProcess ? undefined : resendFrom.domains,
      used_brevo_fallback: emailResult.usedBrevoFallback,
      sent_to: emailResult.sentTo,
      ids: emailResult.ids,
      failed: emailResult.failed,
      at: new Date().toISOString(),
    }

    console.log(
      JSON.stringify({
        event: 'notify_queue',
        queue_id: row.id,
        provider: emailResult.provider,
        from: emailResult.from,
        sent_to: emailResult.sentTo,
        ids: emailResult.ids,
        failed: emailResult.failed,
      }),
    )

    const emailOk = emailResult.sentTo.length > 0
    const waOk = waResult.skipped || waResult.ok
    const anyChannelConfigured = !emailResult.skipped || !waResult.skipped

    if (!anyChannelConfigured) {
      results.push({ id: row.id, error: 'RESEND_API_KEY belum di-set di Supabase Edge Function secrets' })
      continue
    }

    if (emailOk && waOk) {
      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          error_message: emailResult.failed.length
            ? emailResult.failed.map((f) => f.error).join(' | ')
            : null,
          payload: { ...p, last_send: lastSend },
        })
        .eq('id', row.id)
      processed++
      results.push({
        id: row.id,
        sent: true,
        provider: emailResult.provider,
        from: emailResult.from,
        to: emailResult.sentTo,
        ids: emailResult.ids,
        failed: emailResult.failed,
      })
    } else if (emailResult.sentTo.length === 0 && recipients.length > 0) {
      const errMsg = [
        ...emailResult.failed.map((f) => f.error),
        waResult.error,
      ]
        .filter(Boolean)
        .join(' | ')
      await supabase
        .from('notification_queue')
        .update({
          status: 'failed',
          error_message: errMsg || 'Send failed',
          payload: { ...p, last_send: lastSend },
        })
        .eq('id', row.id)
      results.push({
        id: row.id,
        sent: false,
        provider: emailResult.provider,
        from: emailResult.from,
        error: errMsg,
      })
    } else {
      const errMsg = [emailResult.failed.map((f) => f.error).join(' | '), waResult.error]
        .filter(Boolean)
        .join(' | ')
      results.push({ id: row.id, error: errMsg || 'Tidak terkirim' })
    }
  }

  if (publicProcess) {
    return jsonResponse(req, { ok: true, processed })
  }
  return jsonResponse(req, { ok: true, processed, provider: chosenProvider(), from: fromAddress, results })
})
