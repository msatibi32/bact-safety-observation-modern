// Ringkasan mingguan HSE via email.
// Auth: header x-cron-secret = CRON_SECRET, atau JWT Super Admin.
// Deploy cron: supabase functions deploy weekly-digest --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL_TO = Deno.env.get('NOTIFY_EMAIL_TO') || ''
const NOTIFY_EMAIL_FROM = Deno.env.get('NOTIFY_EMAIL_FROM') || 'BACT SOC <onboarding@resend.dev>'
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function roleOf(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null) {
  return String(user?.app_metadata?.role || user?.user_metadata?.role || '')
}

function isSuperAdminRole(role: string) {
  return role === 'admin' || role === 'super_admin'
}

function cronSecretOk(req: Request) {
  if (!CRON_SECRET) return false
  const provided = req.headers.get('x-cron-secret') || ''
  return provided === CRON_SECRET
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (!cronSecretOk(req)) {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user || !isSuperAdminRole(roleOf(data.user))) {
      return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
    }
  }

  if (!RESEND_API_KEY) {
    return jsonResponse(req, { ok: false, error: 'Missing RESEND_API_KEY' }, 500)
  }

  const { data: recipientRows } = await supabase
    .from('notification_recipients')
    .select('email')
    .eq('active', true)

  const recipients = [...new Set((recipientRows || []).map((r) => r.email).filter(Boolean))]
  if (NOTIFY_EMAIL_TO && !recipients.includes(NOTIFY_EMAIL_TO)) recipients.push(NOTIFY_EMAIL_TO)

  if (recipients.length === 0) {
    return jsonResponse(req, { ok: false, error: 'Tidak ada email penerima aktif' }, 400)
  }
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: rows, error } = await supabase
    .from('observations')
    .select('category, risk_level, status, is_hipo, created_at')
    .gte('created_at', weekAgo.toISOString())

  if (error) {
    return jsonResponse(req, { ok: false, error: error.message }, 500)
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

  const sentTo = []
  const failed = []
  for (const email of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: NOTIFY_EMAIL_FROM,
        to: [email],
        subject: `[BACT SOC] Ringkasan Mingguan — ${total} laporan`,
        html,
      }),
    })
    if (res.ok) sentTo.push(email)
    else failed.push({ email, error: await res.text() })
  }

  const ok = sentTo.length > 0
  return jsonResponse(req, { ok, total, hipo, open, sentTo, failed }, ok ? 200 : 500)
})
