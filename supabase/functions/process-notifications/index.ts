// Kirim notifikasi email dari notification_queue
// Email penerima diambil dari tabel notification_recipients (kelola via dashboard admin)
//
// Secrets (Supabase → Edge Functions → Secrets):
//   BREVO_API_KEY        — dari brevo.com (disarankan jika TIDAK punya domain)
//   BREVO_SENDER_EMAIL   — email pengirim yang sudah diverifikasi di Brevo
//   RESEND_API_KEY       — dari resend.com (butuh domain untuk kirim ke semua alamat)
//   NOTIFY_EMAIL_FROM    — mis. "BACT SOC <onboarding@resend.dev>"
//   PUBLIC_APP_URL       — URL dashboard (opsional)
//   FONNTE_TOKEN         — opsional WA
//   NOTIFY_WA_TO         — opsional WA

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || ''
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'BACT SOC'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL_FROM = Deno.env.get('NOTIFY_EMAIL_FROM') || 'BACT SOC <onboarding@resend.dev>'
const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN') || ''
const NOTIFY_WA_TO = Deno.env.get('NOTIFY_WA_TO') || ''
const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
}

function parseFromAddress() {
  const match = NOTIFY_EMAIL_FROM.match(/<([^>]+)>/)
  return (match ? match[1] : NOTIFY_EMAIL_FROM).trim()
}

function brevoSenderEmail() {
  if (BREVO_SENDER_EMAIL) return BREVO_SENDER_EMAIL.trim()
  const from = parseFromAddress()
  if (from && !from.endsWith('resend.dev')) return from
  return 'chibiajjh12@gmail.com'
}

function humanizeResendError(raw: string, email: string) {
  const text = raw || ''
  if (
    text.includes('403') ||
    text.includes('validation_error') ||
    text.includes('not allowed') ||
    text.includes('You can only send testing emails')
  ) {
    return `${email}: Resend menolak (403). Tanpa domain, Resend hanya kirim ke pemilik akun. Set BREVO_API_KEY (gratis, tanpa domain) atau verifikasi domain di resend.com/domains.`
  }
  return `${email}: ${text.slice(0, 280)}`
}

function humanizeBrevoError(raw: string, email: string) {
  const text = raw || ''
  if (text.includes('not verified') || text.includes('unrecognised') || text.includes('sender')) {
    return `${email}: Brevo menolak pengirim. Verifikasi ${brevoSenderEmail()} di Brevo → Senders.`
  }
  return `${email}: Brevo: ${text.slice(0, 280)}`
}

function buildMessage(type: string, p: Payload) {
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
  if (PUBLIC_APP_URL) lines.push('', `Dashboard: ${PUBLIC_APP_URL}/admin`)
  return lines.join('\n')
}

async function getRecipientEmails(
  supabase: ReturnType<typeof createClient>,
  isHiPo: boolean,
): Promise<string[]> {
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

async function sendViaBrevo(to: string, subject: string, html: string, text: string) {
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
  if (res.ok) return { ok: true, skipped: false, id: parsed.messageId || null }
  return { ok: false, skipped: false, error: humanizeBrevoError(raw, to) }
}

async function sendViaResend(to: string, subject: string, html: string, text: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: NOTIFY_EMAIL_FROM, to: [to], subject, html, text }),
  })
  const raw = await res.text()
  let parsed: { id?: string } = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }
  if (res.ok) return { ok: true, skipped: false, id: parsed.id || null }
  return { ok: false, skipped: false, error: humanizeResendError(raw, to) }
}

async function sendEmailToOne(to: string, subject: string, html: string, text: string) {
  if (BREVO_API_KEY) return sendViaBrevo(to, subject, html, text)
  if (RESEND_API_KEY) return sendViaResend(to, subject, html, text)
  return { ok: false, skipped: true, error: 'Set BREVO_API_KEY (tanpa domain) atau RESEND_API_KEY' }
}

async function sendEmailToAll(to: string[], subject: string, html: string, text: string) {
  if (!BREVO_API_KEY && !RESEND_API_KEY) {
    return { skipped: true, sentTo: [] as string[], failed: [] as { email: string; error: string }[] }
  }
  const sentTo: string[] = []
  const failed: { email: string; error: string }[] = []
  for (const email of to) {
    const result = await sendEmailToOne(email, subject, html, text)
    if (result.ok) sentTo.push(email)
    else failed.push({ email, error: result.error || 'Gagal kirim' })
  }
  return { skipped: false, sentTo, failed }
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
    return new Response('ok', { headers: corsHeaders })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (body.action === 'test' && typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase()
    if (!email) return jsonResponse({ ok: false, error: 'Email tes kosong' }, 400)
    const text = [
      'Tes notifikasi — BACT SOC',
      '',
      'Email ini dikirim dari dashboard untuk memastikan alamat penerima bisa menerima notifikasi laporan.',
      PUBLIC_APP_URL ? `Dashboard: ${PUBLIC_APP_URL}/admin` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const result = await sendEmailToOne(
      email,
      '[BACT SOC] Tes notifikasi',
      `<p>${text.replace(/\n/g, '<br>')}</p>`,
      text,
    )
    if (result.ok) {
      return jsonResponse({ ok: true, sent: true, to: email, resend_id: result.id || null })
    }
    // 200 + ok:false supaya dashboard bisa menampilkan pesan Resend, bukan "non-2xx"
    return jsonResponse({ ok: false, error: result.error || 'Gagal kirim tes' })
  }

  const { data: pending, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .in('type', ['new_report', 'hipo_alert'])
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return jsonResponse({ ok: false, error: error.message }, 500)
  }

  let processed = 0
  const results: unknown[] = []

  for (const row of pending || []) {
    const p = row.payload as Payload
    const isHiPo = row.type === 'hipo_alert' || !!p.is_hipo
    const recipients = await getRecipientEmails(supabase, isHiPo)
    const text = buildMessage(row.type, p)
    const subject = isHiPo
      ? `[BACT SOC] HiPo — ${p.category || 'Observasi'}`
      : `[BACT SOC] Laporan Baru — ${p.category || 'Observasi'}`
    const html = `<p>${text.replace(/\n/g, '<br>')}</p>`

    if (recipients.length === 0 && !FONNTE_TOKEN) {
      results.push({ id: row.id, error: 'Tidak ada email penerima aktif. Tambahkan di dashboard.' })
      continue
    }

    const emailResult = await sendEmailToAll(recipients, subject, html, text)
    const waResult = await sendWhatsApp(text)

    const emailOk = emailResult.skipped || emailResult.sentTo.length > 0 || recipients.length === 0
    const waOk = waResult.skipped || waResult.ok
    const anyChannelConfigured = !emailResult.skipped || !waResult.skipped

    if (!anyChannelConfigured) {
      results.push({ id: row.id, error: 'Tambahkan email di dashboard atau set RESEND_API_KEY' })
      continue
    }

    const lastSend = {
      sent_to: emailResult.sentTo,
      failed: emailResult.failed,
      at: new Date().toISOString(),
    }

    if (emailOk && waOk && (emailResult.sentTo.length > 0 || waResult.ok)) {
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
      results.push({ id: row.id, sent: true, to: emailResult.sentTo, failed: emailResult.failed })
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
      results.push({ id: row.id, sent: false, error: errMsg })
    } else {
      const errMsg = [emailResult.failed.map((f) => f.error).join(' | '), waResult.error]
        .filter(Boolean)
        .join(' | ')
      results.push({ id: row.id, error: errMsg || 'Tidak terkirim' })
    }
  }

  return jsonResponse({ ok: true, processed, results })
})
