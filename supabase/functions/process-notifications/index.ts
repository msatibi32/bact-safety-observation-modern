// Kirim notifikasi email dari notification_queue
// Email penerima diambil dari tabel notification_recipients (kelola via dashboard admin)
//
// Product: domain Resend yang sudah verified dipakai dulu.
// Selama from masih onboarding@resend.dev, kirim lewat Brevo. Sandbox Resend
// mengembalikan ID tetapi tidak sampai ke penerima di luar akun Resend.
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
  ref_no?: string
  kind_label?: string
  name?: string
  token?: string
  valid_from?: string
  valid_until?: string
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

function formatJakarta(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function validityLine(p: Payload) {
  const from = formatJakarta(p.valid_from)
  const until = formatJakarta(p.valid_until)
  if (from && until) return `Masa aktif: ${from} – ${until} WIB`
  if (until) return `Masa aktif sampai: ${until} WIB`
  return ''
}

function buildMessage(type: string, p: Payload) {
  if (type === 'pass_barcode' || type === 'pass_approved') {
    const approved = type === 'pass_approved'
    const lines = [
      approved ? 'Pengajuan Anda sudah disetujui HSSE.' : 'Barcode pengajuan Anda.',
      '',
      `Nomor: ${p.ref_no || '—'}`,
      `Jenis: ${p.kind_label || '—'}`,
      `Nama: ${p.name || '—'}`,
      '',
      approved
        ? 'Tunjukkan barcode ini di lokasi. Status dan masa aktif juga ada di tautan berikut.'
        : 'Pengajuan masih menunggu persetujuan HSSE. Simpan barcode ini. Email berikutnya dikirim setelah disetujui.',
      p.link || '',
    ]
    const validity = validityLine(p)
    if (validity) lines.push('', validity)
    return lines.join('\n')
  }
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

function isSandboxFrom(from: string) {
  const domain = fromDomain(from).toLowerCase()
  return domain === 'resend.dev' || domain.endsWith('.resend.dev')
}

async function sendEmailToOne(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string,
): Promise<SendResult> {
  const sandbox = isSandboxFrom(from)
  if (sandbox && BREVO_API_KEY) return sendViaBrevo(to, subject, html, text)
  if (sandbox) {
    return {
      ok: false,
      skipped: false,
      provider: 'none',
      from,
      id: null,
      error:
        'Email tidak terkirim. Pengirim masih onboarding@resend.dev, jadi penerima di luar akun Resend tidak menerima. Pasang BREVO_API_KEY atau domain Resend yang sudah verified.',
    }
  }
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
  let actualFrom = from
  for (const email of to) {
    const result = await sendEmailToOne(email, subject, html, text, from)
    if (result.ok) {
      sentTo.push(email)
      actualFrom = result.from
      if (result.id) ids[email] = result.id
      if (result.provider === 'brevo' && RESEND_API_KEY) usedBrevoFallback = true
    } else {
      failed.push({ email, error: result.error || 'Gagal kirim' })
    }
  }
  return {
    skipped: false,
    provider: usedBrevoFallback ? 'brevo' : chosenProvider(),
    from: actualFrom,
    sentTo,
    ids,
    failed,
    usedBrevoFallback,
  }
}

function isServiceRole(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const parts = token.split('.')
  if (parts.length < 2) return false
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

function passEmailHtml(type: string, p: Payload, imageUrl?: string) {
  const approved = type === 'pass_approved'
  const validity = validityLine(p)
  const intro = approved
    ? 'Pengajuan Anda sudah disetujui HSSE.'
    : 'Ini barcode pengajuan Anda. Statusnya masih menunggu persetujuan HSSE.'
  const image = imageUrl
    ? `<p style="margin:20px 0"><img src="${escapeHtml(imageUrl)}" alt="Barcode" width="220" height="220" style="display:block" /></p>`
    : ''
  const footer = approved && validity
    ? validity
    : 'Masa aktif dikirim di email ini setelah HSSE menyetujui pengajuan.'
  return `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:520px">
    <p style="margin:0 0 12px">${escapeHtml(intro)}</p>
    <p style="margin:0"><strong>${escapeHtml(p.ref_no || '')}</strong></p>
    <p style="margin:4px 0;color:#334155">${escapeHtml(p.kind_label || '')}${p.name ? ` · ${escapeHtml(p.name)}` : ''}</p>
    ${image}
    <p style="margin:8px 0 0"><a href="${escapeHtml(p.link || '')}" style="color:#F37021">${escapeHtml(p.link || '')}</a></p>
    <p style="margin:28px 0 0;padding-top:12px;border-top:1px solid #e6e8ec;text-align:right;font-size:13px;color:#334155">${escapeHtml(footer)}</p>
  </div>`
}

function followUpEmailHtml(p: Payload) {
  const link = p.link || ''
  return `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:520px">
    <p>Tindak lanjut SOC untuk departemen <strong>${escapeHtml(p.department || '—')}</strong>.</p>
    <p style="margin:4px 0">Nomor: ${escapeHtml(p.soc_number || '—')}</p>
    <p style="margin:4px 0">Kategori: ${escapeHtml(p.category || '—')} · Risiko: ${escapeHtml(p.risk_level || '—')}</p>
    <p style="margin:4px 0">Lokasi: ${escapeHtml(p.location || '—')}</p>
    <p style="margin:20px 0">
      <a href="${escapeHtml(link)}" style="background:#F37021;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:bold">Buka form follow-up</a>
    </p>
    <p style="font-size:12px;color:#64748b">Tidak perlu login. Isi deadline, action plan, dan foto bukti. Jika sudah selesai, tutup laporan dari tautan yang sama.</p>
    <p style="font-size:12px;color:#64748b">Jika tombol tidak terbuka, salin tautan ini:<br>${escapeHtml(link)}</p>
  </div>`
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out[4] = type.charCodeAt(0)
  out[5] = type.charCodeAt(1)
  out[6] = type.charCodeAt(2)
  out[7] = type.charCodeAt(3)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function deflateZlib(raw: Uint8Array) {
  const stream = new CompressionStream('deflate')
  const writer = stream.writable.getWriter()
  await writer.write(raw)
  await writer.close()
  return new Uint8Array(await new Response(stream.readable).arrayBuffer())
}

async function qrPng(link: string) {
  const mod = await Promise.race([
    import('https://esm.sh/uqr@0.1.2'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('qr module timeout')), 8000)),
  ])
  const encode = mod.encode || mod.default?.encode
  const qr = encode(link)
  const scale = 8
  const margin = 2
  const size = qr.size as number
  const modules = qr.data as Uint8Array
  const dim = (size + margin * 2) * scale
  const raw = new Uint8Array((1 + dim) * dim)
  for (let y = 0; y < dim; y++) {
    const row = (1 + dim) * y
    const my = Math.floor(y / scale) - margin
    for (let x = 0; x < dim; x++) {
      const mx = Math.floor(x / scale) - margin
      const dark = mx >= 0 && my >= 0 && mx < size && my < size && modules[my * size + mx]
      raw[row + 1 + x] = dark ? 0 : 255
    }
  }
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, dim)
  view.setUint32(4, dim)
  header[8] = 8
  const idat = await deflateZlib(raw)
  const parts = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array()),
  ]
  const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    png.set(part, offset)
    offset += part.length
  }
  return png
}

async function barcodeImageUrl(
  _supabase: ReturnType<typeof createClient>,
  _token: string,
  _link: string,
) {
  // The pass page draws the barcode. A remote QR library was hanging the email send.
  return null
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
  const serviceRole = isServiceRole(req)
  const superAdminCaller = caller && isSuperAdmin(role)
  const observationId = typeof body.observation_id === 'string' ? body.observation_id.trim() : ''
  const queueId = typeof body.queue_id === 'string' ? body.queue_id.trim() : ''
  const publicProcess = Boolean(observationId) && !staffCaller && !serviceRole

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

  if (!staffCaller && !serviceRole && !observationId && !queueId) {
    return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401)
  }

  const resendFrom = await resolveResendFrom()
  const fromAddress = chosenProvider() === 'resend' ? resendFrom.from : `${BREVO_SENDER_NAME} <${brevoSenderEmail()}>`

  let pendingQuery = supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .in('type', ['new_report', 'hipo_alert', 'followup_assign', 'pass_barcode', 'pass_approved'])
    .order('created_at', { ascending: true })
    .limit(20)

  if (queueId && !staffCaller && !serviceRole) {
    pendingQuery = pendingQuery.eq('id', queueId).in('type', ['pass_barcode', 'pass_approved', 'followup_assign'])
  } else if (queueId) {
    pendingQuery = pendingQuery.eq('id', queueId)
  } else if (observationId) {
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
    let imageUrl: string | null = null
    if ((row.type === 'pass_barcode' || row.type === 'pass_approved') && p.link) {
      imageUrl = await barcodeImageUrl(supabase, String(p.token || p.ref_no || row.id), p.link)
    }
    const html =
      row.type === 'followup_assign'
        ? followUpEmailHtml(p)
        : row.type === 'pass_barcode' || row.type === 'pass_approved'
          ? passEmailHtml(row.type, p, imageUrl || undefined)
          : `<p>${escapeHtml(text).replaceAll('\n', '<br>')}</p>`

    if (recipients.length === 0 && !FONNTE_TOKEN) {
      results.push({ id: row.id, error: 'Tidak ada email penerima aktif. Tambahkan di dashboard.' })
      continue
    }

    const emailResult = await sendEmailToAll(recipients, subject, html, text, fromAddress)
    const directMail = row.type === 'followup_assign' || row.type === 'pass_barcode' || row.type === 'pass_approved'
    const waResult = directMail ? { ok: true, skipped: true } : await sendWhatsApp(text)

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
