export const dynamic = 'force-static'

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * SERVER-SIDE LOGIN BRIDGE
 * 
 * This route handles the login process on the server to bypass browser-side
 * network restrictions (ad-blockers, DNS issues, CORS).
 * 
 * Flow:
 *  1. Client sends email/password to this API.
 *  2. Server uses createServerClient to call signInWithPassword.
 *  3. session cookies are automatically managed by @supabase/ssr.
 *  4. Returns success/failure to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Initialize the server-side Supabase client
    const supabase = await createClient()

    // Perform the sign-in
    // This will automatically handle cookie setting via the server client logic
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[LoginBridge] Auth error:', error.message)
      
      // Specifically identify network/fetch failures
      if (error.message.includes('fetch failed') || error.message.includes('ConnectTimeoutError')) {
        return NextResponse.json(
          { error: 'Supabase Connection Timeout. Please try again in 5 seconds.' },
          { status: 504 } // Gateway Timeout
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    console.log(`[LoginBridge] Successful login for: ${email}`)

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    })

  } catch (err: any) {
    console.error('[LoginBridge] Internal Error:', err)
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 500 }
    )
  }
}
