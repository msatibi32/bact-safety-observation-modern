import { supabase } from './supabase'

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function logout() {
  await supabase.auth.signOut()
}
