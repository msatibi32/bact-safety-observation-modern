import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    async function initSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Refresh JWT agar perubahan user_metadata (role) dari Supabase langsung terbaca
        const { data: refreshed } = await supabase.auth.refreshSession()
        setSession(refreshed.session ?? data.session)
      } else {
        setSession(null)
      }
    }

    initSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return session
}
