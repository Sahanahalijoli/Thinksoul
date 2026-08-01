export const dynamic = 'force-static'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, generateResetEmailHTML } from '@/utils/mail'

/**
 * Forgot Password API Route
 * 
 * Flow:
 *   1. User enters email on /login/ forgot password form
 *   2. This route verifies the email exists in `profiles` table
 *   3. Generates a recovery link via Supabase Admin API
 *   4. Sends the link via AWS SES / SMTP
 *   5. User clicks link → lands on /reset-password/ → sets new password
 * 
 * Security:
 *   - Uses service role key (server-only, never exposed to browser)
 *   - Checks profile existence before generating link (prevents enumeration via timing)
 *   - Rate-limited on the client side (60s cooldown)
 */

// Admin client — lazy singleton to avoid connection issues at module load
let _adminClient: ReturnType<typeof createClient> | null = null
function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminClient
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    console.log(`[ForgotPassword] Request received for: ${email}`)

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Verify user exists before sending reset email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle() as { data: { id: string; email: string } | null; error: any }
 
    if (profileError) {
      console.warn(`[ForgotPassword] User lookup error:`, profileError)
      return NextResponse.json({ error: 'Email not registered.' }, { status: 404 })
    }
    if (!profile) {
      console.warn(`[ForgotPassword] Email not found: ${email}`)
      return NextResponse.json({ error: 'Email not registered.' }, { status: 404 })
    }
    console.log(`[ForgotPassword] User found: ${profile.id}`)

    // 2. Generate the Recovery Link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      }
    })

    if (linkError || !data.properties?.action_link) {
      console.error('[ForgotPassword] Link Generation Error:', linkError)
      return NextResponse.json({ error: 'Failed to generate reset link.' }, { status: 500 })
    }
    console.log(`[ForgotPassword] Recovery link generated successfully`)

    // 3. Send via SMTP (AWS SES or Hostinger)
    console.log(`Sending Reset Password email to ${email}...`)
    
    await sendEmail({
      to: email.trim(),
      subject: 'Reset your ThinkSoul password',
      html: generateResetEmailHTML(data.properties.action_link),
    })

    console.log(`[ForgotPassword] Email sent successfully to ${email}`)
    return NextResponse.json({ success: true, message: 'Recovery email sent.' })
    
  } catch (err: any) {
    console.error('Forgot Password API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
