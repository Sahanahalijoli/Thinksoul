export const dynamic = 'force-static'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendEmail, generateInviteEmailHTML } from '@/utils/mail'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, workspaceId, inviteType, groupIds } = body

    // Determine invite type
    const type = inviteType || 'workspace_member'

    // Validate required fields based on type
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    if (type === 'workspace_member' && !workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId for workspace invite' }, { status: 400 })
    }

    if (type === 'group_admin' && (!groupIds || groupIds.length === 0)) {
      return NextResponse.json({ error: 'Missing groupIds for group admin invite' }, { status: 400 })
    }

    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a global admin or has appropriate access
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'admin'

    // Group admin invites require global admin
    if (type === 'group_admin' && !isGlobalAdmin) {
      return NextResponse.json({ error: 'Only admins can invite group admins' }, { status: 403 })
    }

    // For workspace invites, check workspace membership
    if (type === 'workspace_member' && !isGlobalAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json({ error: 'You must be a member of this workspace to send invites' }, { status: 403 })
      }
    }

    // Generate secure token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 100) // 100 years from now

    // Build context name for email
    let contextName = 'ThinkSoul'

    if (type === 'workspace_member' && workspaceId) {
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()
      contextName = workspace?.name || 'ThinkSoul Workspace'
    } else if (type === 'group_admin' && groupIds?.length > 0) {
      const { data: groupData } = await supabaseAdmin
        .from('workspace_groups')
        .select('name')
        .in('id', groupIds)
      if (groupData && groupData.length > 0) {
        contextName = groupData.map((g: any) => g.name).join(', ')
      }
    }

    // Check for existing invitation
    let existingQuery = supabaseAdmin
      .from('invitations')
      .select('id, status')
      .eq('email', email.trim().toLowerCase())
      .eq('invite_type', type)

    if (type === 'workspace_member' && workspaceId) {
      existingQuery = existingQuery.eq('workspace_id', workspaceId)
    }

    const { data: existingInvite } = await existingQuery.maybeSingle()

    if (existingInvite) {
      // Update existing invitation
      const updateData: any = {
        token: inviteToken,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        invite_type: type,
      }

      if (type === 'group_admin') {
        updateData.group_ids = groupIds
      }

      const { error: updateError } = await supabaseAdmin
        .from('invitations')
        .update(updateData)
        .eq('id', existingInvite.id)

      if (updateError) {
        console.error('Update invitation error:', updateError)
        return NextResponse.json({ error: 'Failed to refresh invitation' }, { status: 500 })
      }
    } else {
      // Insert new invitation
      const insertData: any = {
        email: email.trim().toLowerCase(),
        invited_by: user.id,
        token: inviteToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invite_type: type,
      }

      if (type === 'workspace_member') {
        insertData.workspace_id = workspaceId
      }

      if (type === 'group_admin') {
        insertData.group_ids = groupIds
      }

      const { error: insertError } = await supabaseAdmin
        .from('invitations')
        .insert(insertData)

      if (insertError) {
        console.error('Insert invitation error:', insertError)
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
      }
    }

    // Build invite URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/join/${inviteToken}`

    const emailSubject = type === 'group_admin'
      ? `You're invited as a Group Admin for "${contextName}" on ThinkSoul`
      : `You're invited to join "${contextName}" on ThinkSoul`

    console.log(`Sending ${type} invite email to ${email} (SES)...`)

    // Send email in the background (don't await)
    // This prevents the user from waiting for full email delivery
    sendEmail({
      to: email.trim(),
      subject: emailSubject,
      html: generateInviteEmailHTML(inviteUrl, contextName),
    }).catch((err) => {
      console.error('Failed to send email:', err)
      // Log but don't fail the invitation creation
    })

    return NextResponse.json({ success: true, message: `Invitation sent to ${email}` })
  } catch (err: any) {
    console.error('Invite API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
