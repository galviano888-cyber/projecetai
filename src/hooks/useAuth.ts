import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pasang listener DULU sebelum getSession, agar tidak ada event
    // yang terlewat di antara keduanya (race condition).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Ambil session awal — onAuthStateChange akan memanggil callback
    // dengan INITIAL_SESSION sehingga ini hanya sebagai safety fallback.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(s => s ?? session)
      setUser(u => u ?? session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, session, loading, signOut }
}
