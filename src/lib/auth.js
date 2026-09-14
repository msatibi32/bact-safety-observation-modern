import { supabase } from './supabase'

const GUARD_KEY = 'soc_login_guard'
const MAX_ATTEMPTS = 5
const LOCK_MS = 2 * 60 * 1000

function readGuard() {
  try {
    const raw = sessionStorage.getItem(GUARD_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      fails: Number(parsed.fails) || 0,
      until: Number(parsed.until) || 0,
    }
  } catch {
    return { fails: 0, until: 0 }
  }
}

function writeGuard(next) {
  try {
    sessionStorage.setItem(GUARD_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

function remainingLockMs() {
  const until = readGuard().until
  return until > Date.now() ? until - Date.now() : 0
}

export function loginLockMessage() {
  const ms = remainingLockMs()
  if (ms <= 0) return ''
  const sec = Math.max(1, Math.ceil(ms / 1000))
  return `Terlalu banyak percobaan. Coba lagi dalam ${sec} detik.`
}

export async function login(email, password) {
  const locked = loginLockMessage()
  if (locked) throw new Error(locked)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const prev = readGuard()
    const fails = prev.fails + 1
    writeGuard({
      fails,
      until: fails >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
    })
    if (fails >= MAX_ATTEMPTS) throw new Error(loginLockMessage())
    throw new Error(error.message)
  }

  writeGuard({ fails: 0, until: 0 })
}

export async function logout() {
  await supabase.auth.signOut()
}
