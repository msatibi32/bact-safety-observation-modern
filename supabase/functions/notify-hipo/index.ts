// Supabase Edge Function — kirim email HiPo dari notification_queue
// Deploy: supabase functions deploy notify-hipo
// Secrets: RESEND_API_KEY, NOTIFY_EMAIL_TO (mis. hse@bact.co.id)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL_TO = Deno.env.get('NOTIFY_EMAIL_TO') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing RESEND_API_KEY or NOTIFY_EMAIL_TO' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: pending, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'hipo_alert')
    .limit(10)

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  let sent = 0
  for (const row of pending || []) {
    const p = row.payload as Record<string, string>
    const subject = `[BACT SOC] HiPo Alert — ${p.category || 'Observasi'}`
    const html = `
      <h2>High Potential Incident (HiPo)</h2>
      <p><b>Kategori:</b> ${p.category}</p>
      <p><b>Risiko:</b> ${p.risk_level}</p>
      <p><b>Lokasi:</b> ${p.location}</p>
      <p><b>Pelapor:</b> ${p.reporter}</p>
      <p>ID: ${p.observation_id}</p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BACT SOC <noreply@yourdomain.com>',
        to: [NOTIFY_EMAIL_TO],
        subject,
        html,
      }),
    })

    if (res.ok) {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } else {
      const errText = await res.text()
      await supabase
        .from('notification_queue')
        .update({ status: 'failed', error_message: errText })
        .eq('id', row.id)
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
