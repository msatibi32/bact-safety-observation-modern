/**
 * Buat / update akun HSE & Super Admin di Supabase Auth.
 *
 * Pakai:
 *   set SUPABASE_URL=https://xxx.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ...   (Settings → API → service_role)
 *   node scripts/create-hse-users.mjs
 *
 * Atau edit email/password di bawah sebelum jalanin.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const USERS = [
  {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@bact.co.id',
    password: process.env.SUPER_ADMIN_PASSWORD || 'BactSuperAdmin2026!',
    role: 'admin',
    label: 'Super Admin',
  },
  {
    email: process.env.HSE_EMAIL || 'hse@bact.co.id',
    password: process.env.HSE_PASSWORD || 'BactHse2026!',
    role: 'hse',
    label: 'HSE Officer',
  },
]

if (!url || !serviceKey) {
  console.error(`
Missing env.
  SUPABASE_URL              = project URL
  SUPABASE_SERVICE_ROLE_KEY = Project Settings → API → service_role (Reveal)

Opsional override:
  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
  HSE_EMAIL / HSE_PASSWORD
`)
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function upsertUser({ email, password, role, label }) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), role },
    })
    if (error) throw error
    console.log(`✓ Updated ${label}: ${email} (role=${role}) id=${data.user.id}`)
    return
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  })
  if (error) throw error
  console.log(`✓ Created ${label}: ${email} (role=${role}) id=${data.user.id}`)
}

for (const u of USERS) {
  try {
    await upsertUser(u)
  } catch (err) {
    console.error(`✗ ${u.label} (${u.email}):`, err.message)
  }
}

console.log(`
Login: https://bact-safety-observation-modern.vercel.app/admin/login
  Super Admin → role admin  (lihat Analitik performa HSE + menu Log HSE)
  HSE Officer → role hse    (dashboard, investigasi, klasifikasi)
`)
