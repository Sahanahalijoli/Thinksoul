import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * SINGLETON BROWSER CLIENT
 * 
 * Optimized for 1100+ concurrent users on ThinkSoul.
 * This client is purely for browser-side interactions.
 */
let clientInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // 1. SSR PROTECTION
  // If this is called during server-side rendering, we return a client
  // that is explicitly configured to NOT make any network calls or state syncs.
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  }

  // 2. BROWSER SINGLETON
  // In the browser, we use a single instance to prevent race conditions 
  // on token refreshing and storage access.
  if (clientInstance) return clientInstance

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-client-info': 'thinksoul-lms@1.0.0',
        },
      },
      auth: {
        flowType: 'pkce', // Recommended for secure browser flow
      }
    }
  )

  return clientInstance
}
