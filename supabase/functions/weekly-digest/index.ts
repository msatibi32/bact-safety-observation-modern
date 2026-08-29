// Supabase Edge Function — ringkasan mingguan HSE via email
// Deploy: supabase functions deploy weekly-digest
// Jadwalkan: Supabase Dashboard → Database → Cron (pg_cron) atau external cron hit URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL_TO = Deno.env.get('NOTIFY_EMAIL_TO') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing secrets' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: rows, error } = await supabase
    .from('observations')
    .select('category, risk_level, status, is_hipo, created_at')
    .gte('created_at', weekAgo.toISOString())

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  const total = rows?.length || 0
  const hipo = rows?.filter((r) => r.is_hipo).length || 0
  const open = rows?.filter((r) => !['Closed', 'Rejected'].includes(r.status)).length || 0

  const html = `
    <h2>BACT SOC — Ringkasan Mingguan</h2>
    <ul>
      <li>Total laporan: <b>${total}</b></li>
      <li>HiPo: <b>${hipo}</b></li>
      <li>Masih aktif: <b>${open}</b></li>
    </ul>
    <p>Dashboard: ${Deno.env.get('PUBLIC_APP_URL') || 'https://bact-safety-observation-modern.vercel.app/admin'}</p>
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
      subject: `[BACT SOC] Ringkasan Mingguan — ${total} laporan`,
      html,
    }),
  })

  const ok = res.ok
  return new Response(JSON.stringify({ ok, total, hipo, open }), {
    status: ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
