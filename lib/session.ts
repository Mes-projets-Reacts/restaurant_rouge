'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useSession() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        setSession(data.session?.user ?? null)
        setLoading(false)
      }
    }

    load()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}