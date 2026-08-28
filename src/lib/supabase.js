import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Isi file .env.local terlebih dahulu.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const PHOTO_BUCKET = 'evidence-photos'
