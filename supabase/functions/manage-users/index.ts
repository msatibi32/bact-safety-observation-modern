// Kelola akun login dashboard — hanya Super Admin (role admin / super_admin).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'hse', 'pic', 'viewer'])

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isSuperAdminRole(role: unknown) {
  return role === 'admin' || role === 'super_admin'
}

function callerRole(user: { user_metadata?: Record<string, unknown> } | null) {
  return String(user?.user_metadata?.role || '')
}

function isUserDisabled(user: { banned?: boolean; banned_until?: string | null }) {
  if (user.banned === true) return true
  const until = user.banned_until
  if (!until || until === 'none') return false
  const at = Date.parse(until)
  return Number.isFinite(at) && at > Date.now()
}

function publicUser(user: {
  id: string
  email?: string
  created_at?: string
  last_sign_in_at?: string
  banned?: boolean
  banned_until?: string
  user_metadata?: Record<string, unknown>
}) {
  return {
    id: user.id,
    email: user.email || '',
    role: String(user.user_metadata?.role || 'hse'),
    pic_department: String(user.user_metadata?.pic_department || ''),
    created_at: user.created_at || '',
    last_sign_in_at: user.last_sign_in_at || '',
    disabled: isUserDisabled(user),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return jsonResponse({ error: 'Login dulu sebagai Super Admin.' }, 401)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerData, error: callerError } = await admin.auth.getUser(token)
  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Sesi login tidak valid. Login ulang.' }, 401)
  }
  if (!isSuperAdminRole(callerRole(callerData.user))) {
    return jsonResponse({ error: 'Hanya Super Admin yang boleh kelola pengguna.' }, 403)
  }

  let body: {
    action?: string
    id?: string
    email?: string
    password?: string
    role?: string
    pic_department?: string
    disabled?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Data tidak valid.' }, 400)
  }

  const action = body.action || 'list'

  try {
    if (action === 'list') {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
      if (error) throw error
      const users = (data.users || [])
        .map(publicUser)
        .sort((a, b) => Number(a.disabled) - Number(b.disabled) || a.email.localeCompare(b.email))
      return jsonResponse({ ok: true, users })
    }

    if (action === 'create') {
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const role = String(body.role || 'hse')
      const picDepartment = String(body.pic_department || '').trim()
      if (!email || !email.includes('@')) return jsonResponse({ error: 'Email tidak valid.' }, 400)
      if (password.length < 8) return jsonResponse({ error: 'Password minimal 8 karakter.' }, 400)
      if (!ALLOWED_ROLES.has(role)) return jsonResponse({ error: 'Role tidak dikenal.' }, 400)

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role,
          ...(role === 'pic' && picDepartment ? { pic_department: picDepartment } : {}),
        },
      })
      if (error) throw error
      return jsonResponse({ ok: true, user: publicUser(data.user) })
    }

    if (action === 'update') {
      const id = String(body.id || '')
      if (!id) return jsonResponse({ error: 'ID pengguna kosong.' }, 400)
      if (id === callerData.user.id && body.role && !isSuperAdminRole(body.role)) {
        return jsonResponse({ error: 'Tidak boleh menurunkan role akun sendiri.' }, 400)
      }

      if (body.disabled === true && id === callerData.user.id) {
        return jsonResponse({ error: 'Tidak boleh menonaktifkan akun sendiri.' }, 400)
      }

      const patch: {
        password?: string
        user_metadata?: Record<string, unknown>
        ban_duration?: string
      } = {}
      if (body.password) {
        if (body.password.length < 8) return jsonResponse({ error: 'Password minimal 8 karakter.' }, 400)
        patch.password = body.password
      }
      if (typeof body.disabled === 'boolean') {
        patch.ban_duration = body.disabled ? '876000h' : 'none'
      }
      if (body.role) {
        if (!ALLOWED_ROLES.has(body.role)) return jsonResponse({ error: 'Role tidak dikenal.' }, 400)
        const { data: existing } = await admin.auth.admin.getUserById(id)
        patch.user_metadata = {
          ...(existing.user?.user_metadata || {}),
          role: body.role,
          pic_department:
            body.role === 'pic'
              ? String(body.pic_department || existing.user?.user_metadata?.pic_department || '')
              : '',
        }
      } else if (body.pic_department !== undefined) {
        const { data: existing } = await admin.auth.admin.getUserById(id)
        patch.user_metadata = {
          ...(existing.user?.user_metadata || {}),
          pic_department: String(body.pic_department || ''),
        }
      }

      const { data, error } = await admin.auth.admin.updateUserById(id, patch)
      if (error) throw error
      return jsonResponse({ ok: true, user: publicUser(data.user) })
    }

    if (action === 'delete') {
      const id = String(body.id || '')
      if (!id) return jsonResponse({ error: 'ID pengguna kosong.' }, 400)
      if (id === callerData.user.id) {
        return jsonResponse({ error: 'Tidak boleh menghapus akun sendiri.' }, 400)
      }
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) throw error
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'Aksi tidak dikenal.' }, 400)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal memproses pengguna.'
    return jsonResponse({ error: message }, 400)
  }
})
