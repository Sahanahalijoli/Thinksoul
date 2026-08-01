'use client'

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * DASHBOARD LAYOUT - Defense-in-depth security guard
 * 
 * While the primary authentication check happens in middleware.ts (server-side),
 * this layout provides a safety layer for the client-side experience.
 * 
 * Features for 1100+ concurrent users:
 *   1. Immediate verification via getUser() with a 5s race-limit.
 *   2. Subscription to auth events for instant logout propagation across tabs.
 *   3. Prevents re-checking on every route transition via useRef persistence.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const isChecking = useRef(false)

  useEffect(() => {
    if (isChecking.current) return
    isChecking.current = true

    const supabase = createClient()

    const checkInternal = async () => {
      try {
        // We use getUser() - it makes a network call to verify the JWT signal.
        // We race this against a 5-second timeout to prevent UI hangs if network is flaky.
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 5000)
        )

        const { data: { user }, error } = (await Promise.race([authPromise, timeoutPromise])) as any

        if (error || !user) {
          throw new Error('UNAUTHORIZED')
        }

        setAuthenticated(true)
      } catch (err: any) {
        console.warn(`[Auth Guard] Redirecting: ${err.message}`)
        // On failure or timeout, redirect to login
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }

    checkInternal()

    // Real-time synchronization for SIGNED_OUT events (e.g., from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-zinc-100 shadow-[4px_4px_0px_0px_rgba(244,244,245,1)] flex items-center justify-center animate-pulse">
            <img src="/assets/ThinkSoul.jpg" alt="ThinkSoul" className="w-6 h-6 grayscale opacity-30" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-zinc-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">Synchronizing</span>
          </div>
        </div>
      </div>
    )
  }

  return authenticated ? <>{children}</> : null
}
