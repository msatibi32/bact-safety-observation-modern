import { supabase } from './supabase'

async function invokeManageUsers(body) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi login habis. Login ulang sebagai Super Admin.')

  const { data, error } = await supabase.functions.invoke('manage-users', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (data?.error) throw new Error(data.error)
  if (error) {
    const ctx = error.context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const json = await ctx.json()
        if (json?.error) throw new Error(json.error)
      } catch (inner) {
        if (inner instanceof Error && inner.message && !inner.message.startsWith('Unexpected')) {
          throw inner
        }
      }
    }
    throw new Error(error.message || 'Gagal menghubungi layanan pengguna. Deploy function manage-users dulu.')
  }
  return data
}

export async function listAdminUsers() {
  const data = await invokeManageUsers({ action: 'list' })
  return data.users || []
}

export async function createAdminUser({ email, password, role, pic_department }) {
  const data = await invokeManageUsers({
    action: 'create',
    email,
    password,
    role,
    pic_department,
  })
  return data.user
}

export async function updateAdminUser(id, patch) {
  const data = await invokeManageUsers({ action: 'update', id, ...patch })
  return data.user
}

export async function deleteAdminUser(id) {
  await invokeManageUsers({ action: 'delete', id })
}
