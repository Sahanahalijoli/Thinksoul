// ============================================================
// src/app/api/register/route.ts - IMPROVED VERSION
// Handles group_admin and workspace_member invitations differently
// ============================================================

export const dynamic = 'force-static'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for user creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Lookup invitation by token (for pre-filling the form)
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const { data: invitation, error } = await supabaseAdmin
    .from('invitations')
    .select('id, email, workspace_id, status, expires_at, invite_type, group_ids, workspaces(name)')
    .eq('token', token)
    .maybeSingle()

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
  }

  if (invitation.status !== 'pending' && invitation.status !== 'expired') {
    return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 })
  }

  const inviteType = invitation.invite_type || 'workspace_member'

  // For group admin invites, get the group info
  let groupInfo: any[] = []
  if (inviteType === 'group_admin' && invitation.group_ids?.length > 0) {
    const { data: groupData } = await supabaseAdmin
      .from('workspace_groups')
      .select('id, name')
      .in('id', invitation.group_ids)
    if (groupData) {
      groupInfo = groupData
    }
  }

  // For workspace member invites, check if project details are already filled
  let hasProjectDetails = false
  if (inviteType === 'workspace_member' && invitation.workspace_id) {
    const { data: members } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', invitation.workspace_id)
    
    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id)
      const { data: projDetails } = await supabaseAdmin
        .from('project_details')
        .select('id')
        .in('user_id', userIds)
        .limit(1)
      
      if (projDetails && projDetails.length > 0) {
        hasProjectDetails = true
      }
    }
  }

  return NextResponse.json({
    email: invitation.email,
    inviteType,
    // For group admins: show group names
    displayText: inviteType === 'group_admin' 
      ? `Admin for: ${groupInfo.map(g => g.name).join(', ')}`
      : (invitation.workspaces as any)?.name || 'ThinkSoul',
    workspaceId: invitation.workspace_id,
    groupIds: invitation.group_ids || [],
    groupInfo,
    hasProjectDetails,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      token,
      password,
      displayName,
      // Project details (only for workspace_member)
      fullName,
      phone,
      aboutMe,
      projectName,
      projectDescription,
      startDate,
      currentStage,
    } = body

    const { autoJoin } = body

    console.log('[Register] POST received:', {
      tokenSnippet: token?.slice(0, 8) + '...',
      displayName,
      hasPassword: !!password,
    })

    if (!token || !displayName) {
      console.warn('[Register] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: token and displayName are required' },
        { status: 400 }
      )
    }

    const cleanToken = token.trim().replace(/\/$/, '')

    // ============================================================
    // STEP 1: Validate invitation
    // ============================================================
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('id, email, workspace_id, status, invite_type, group_ids')
      .eq('token', cleanToken)
      .maybeSingle()

    if (invError || !invitation) {
      console.error('[Register] Invitation lookup failed:', invError)
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    if (invitation.status !== 'pending' && invitation.status !== 'expired') {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 })
    }

    const email = invitation.email
    const inviteType = invitation.invite_type || 'workspace_member'

    console.log(`[Register] ✅ Invitation valid. Type: ${inviteType}, Email: ${email}`)

    // ============================================================
    // STEP 2: Validate required fields based on invite type
    // ============================================================
    if (inviteType === 'workspace_member' && (!password || !fullName)) {
      console.warn('[Register] workspace_member requires password and fullName')
      return NextResponse.json(
        { error: 'For workspace members: password and fullName are required' },
        { status: 400 }
      )
    }

    if (inviteType === 'group_admin' && !password) {
      console.warn('[Register] group_admin requires password')
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // ============================================================
    // STEP 3: Get or create auth user
    // ============================================================
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`[Register] ✅ User already exists in auth: ${userId}`)
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError || !newUser?.user) {
        console.error('[Register] ❌ Failed to create auth user:', createError)
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
      console.log(`[Register] ✅ Created auth user: ${userId}`)
    }

    // ============================================================
    // STEP 4: Upsert profile based on invite type
    // ============================================================
    if (inviteType === 'group_admin') {
      // Group admins: minimal profile, no full_name
      console.log(`[Register] 📝 Creating group_admin profile`)
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          display_name: displayName || email.split('@')[0],
          full_name: null,
          role: 'group_admin',
          user_role: 'group_admin',
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('[Register] ❌ Profile upsert error:', profileError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      console.log(`[Register] ✅ Profile created for group_admin`)
    } else {
      // Workspace members: full profile with project details
      console.log(`[Register] 📝 Creating workspace_member profile`)
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: fullName || email.split('@')[0],
          display_name: displayName || fullName || email.split('@')[0],
          phone: phone || null,
          about_me: aboutMe || null,
          role: 'founder',
          user_role: 'user',
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('[Register] ❌ Profile upsert error:', profileError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      console.log(`[Register] ✅ Profile created for workspace_member`)
    }

    // ============================================================
    // STEP 5: Add to workspace_members (only for workspace_member invites)
    // ============================================================
    if (inviteType === 'workspace_member' && invitation.workspace_id) {
      console.log(`[Register] 🔗 Adding to workspace_members`)
      
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .upsert({
          workspace_id: invitation.workspace_id,
          user_id: userId,
          role: 'member',
        }, { onConflict: 'workspace_id,user_id' })

      if (memberError) {
        console.error('[Register] ❌ Failed to add workspace member:', memberError)
        return NextResponse.json(
          { error: 'Failed to add to workspace' },
          { status: 500 }
        )
      }
      console.log(`[Register] ✅ Added to workspace_members`)
    }

    // ============================================================
    // STEP 6: Add to group_admins (only for group_admin invites)
    // ============================================================
    if (inviteType === 'group_admin') {
      console.log(`[Register] 🔐 Processing group_admin assignment`)

      // Parse group_ids
      let groupIdsArray: string[] = []
      
      if (Array.isArray(invitation.group_ids)) {
        groupIdsArray = invitation.group_ids.filter(
          (id) => typeof id === 'string' && id.trim().length > 0
        )
      } else if (typeof invitation.group_ids === 'string') {
        groupIdsArray = [invitation.group_ids.trim()]
      }

      if (groupIdsArray.length === 0) {
        console.error('[Register] ❌ No valid group_ids found')
        return NextResponse.json(
          { error: 'Invalid group admin invitation: no groups specified' },
          { status: 400 }
        )
      }

      console.log(`[Register] 📋 Will assign to ${groupIdsArray.length} groups`)

      // Assign to each group
      const groupResults: { groupId: string; success: boolean; error?: string }[] = []

      for (const groupId of groupIdsArray) {
        try {
          const { error: gaError } = await supabaseAdmin
            .from('group_admins')
            .upsert(
              { group_id: groupId, user_id: userId },
              { onConflict: 'group_id,user_id' }
            )

          if (gaError) {
            console.error(`[Register] ❌ Failed to assign to group ${groupId}:`, gaError)
            groupResults.push({ groupId, success: false, error: gaError.message })
          } else {
            console.log(`[Register] ✅ Assigned to group ${groupId}`)
            groupResults.push({ groupId, success: true })
          }
        } catch (err) {
          console.error(`[Register] ❌ Exception assigning to group ${groupId}:`, err)
          groupResults.push({
            groupId,
            success: false,
            error: err instanceof Error ? err.message : String(err)
          })
        }
      }

      // Check if all assignments succeeded
      const failedAssignments = groupResults.filter(r => !r.success)
      if (failedAssignments.length > 0) {
        console.error('[Register] ❌ Some group assignments failed:', failedAssignments)
        return NextResponse.json(
          {
            error: 'Failed to assign as group admin',
            failed_groups: failedAssignments
          },
          { status: 500 }
        )
      }

      console.log(`[Register] ✅ Successfully assigned to all ${groupIdsArray.length} groups`)
    }

    // ============================================================
    // STEP 7: Insert project_details (only for workspace_member invites)
    // ============================================================
    if (inviteType === 'workspace_member' && projectName) {
      console.log(`[Register] 📊 Adding project details`)
      
      const { error: projError } = await supabaseAdmin
        .from('project_details')
        .insert({
          user_id: userId,
          project_name: projectName,
          project_description: projectDescription || null,
          start_date: startDate || null,
          current_stage: currentStage ? Number(currentStage) : null,
        })

      if (projError) {
        console.error('[Register] ❌ Failed to insert project details:', projError)
        // Don't fail registration for this, it's optional
      } else {
        console.log(`[Register] ✅ Project details added`)
      }
    }

    // ============================================================
    // STEP 8: Mark invitation as accepted
    // ============================================================
    console.log(`[Register] 📮 Marking invitation as accepted`)
    
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('[Register] ⚠️ Failed to update invitation status:', updateError)
      // Don't fail registration for this, invitation is already used
    }

    // ============================================================
    // STEP 9: Return success
    // ============================================================
    const successMessage = inviteType === 'group_admin'
      ? 'Group admin registration complete! You can now log in and manage your groups.'
      : 'Registration complete! You can now log in.'

    console.log(`[Register] ✅ Registration complete for ${email}`)

    return NextResponse.json({
      success: true,
      message: successMessage,
      inviteType,
      email
    })

  } catch (err: any) {
    console.error('[Register] ❌ Unexpected error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
