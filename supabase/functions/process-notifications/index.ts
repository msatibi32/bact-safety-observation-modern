// Kirim notifikasi email + WhatsApp dari notification_queue
// Deploy: supabase functions deploy process-notifications
//
// Secrets (Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY       — dari resend.com
//   NOTIFY_EMAIL_TO      — email HSE, mis. hse@bact.co.id
//   FONNTE_TOKEN         — dari fonnte.com (opsional, untuk WA)
//   NOTIFY_WA_TO         — nomor WA tujuan, format 62812xxx (opsional)
//   NOTIFY_EMAIL_FROM    — mis. "BACT SOC <noreply@domain.com>"
//   PUBLIC_APP_URL       — URL dashboard admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL_TO = Deno.env.get('NOTIFY_EMAIL_TO') || ''
const NOTIFY_EMAIL_FROM = Deno.env.get('NOTIFY_EMAIL_FROM') || 'BACT SOC <noreply@bact.local>'
const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN') || ''
const NOTIFY_WA_TO = Deno.env.get('NOTIFY_WA_TO') || ''
const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

type Payload = {
  observation_id?: string
  category?: string
  risk_level?: string
  location?: string
  reporter?: string
  is_hipo?: boolean
  company?: string
}

function buildMessage(type: string, p: Payload) {
  const label = type === 'hipo_alert' || p.is_hipo ? '⚠️ HiPo Alert' : '📋 Laporan Baru'
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

async function sendEmail(subject: string, html: string, text: string) {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO) return { ok: false, skipped: true }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_EMAIL_FROM,
      to: [NOTIFY_EMAIL_TO],
      subject,
      html,
      text,
    }),
  })
  return { ok: res.ok, error: res.ok ? null : await res.text() }
}

async function sendWhatsApp(message: string) {
  if (!FONNTE_TOKEN || !NOTIFY_WA_TO) return { ok: false, skipped: true }
  const body = new URLSearchParams({
    target: NOTIFY_WA_TO,
    message,
    countryCode: '62',
  })
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: FONNTE_TOKEN },
    body,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && data?.status !== false, error: data?.reason || null }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: pending, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .in('type', ['new_report', 'hipo_alert'])
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  let processed = 0
  const results: unknown[] = []

  for (const row of pending || []) {
    const p = row.payload as Payload
    const text = buildMessage(row.type, p)
    const subject =
      row.type === 'hipo_alert' || p.is_hipo
        ? `[BACT SOC] HiPo — ${p.category || 'Observasi'}`
        : `[BACT SOC] Laporan Baru — ${p.category || 'Observasi'}`
    const html = text.replace(/\n/g, '<br>')

    const emailResult = await sendEmail(subject, `<p>${html}</p>`, text)
    const waResult = await sendWhatsApp(text)

    const emailOk = emailResult.skipped || emailResult.ok
    const waOk = waResult.skipped || waResult.ok
    const anyChannelConfigured = !emailResult.skipped || !waResult.skipped

    if (!anyChannelConfigured) {
      results.push({ id: row.id, error: 'No email/WA secrets configured' })
      continue
    }

    if (emailOk && waOk) {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      processed++
      results.push({ id: row.id, sent: true })
    } else {
      const errMsg = [emailResult.error, waResult.error].filter(Boolean).join(' | ')
      await supabase
        .from('notification_queue')
        .update({ status: 'failed', error_message: errMsg || 'Send failed' })
        .eq('id', row.id)
      results.push({ id: row.id, sent: false, error: errMsg })
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
