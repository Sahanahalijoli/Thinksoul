'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Plus, Users, Calendar, ArrowRight, Trash2, Edit2, UserPlus, FolderOpen, FolderClosed, ChevronDown, ChevronRight, Shield, FolderPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { RenameWorkspaceModal } from '../modals/RenameWorkspaceModal'
import { DeleteWorkspaceModal } from '../modals/DeleteWorkspaceModal'
import { InviteMemberModal } from '../modals/InviteMemberModal'
import { CreateGroupModal } from '../modals/CreateGroupModal'
import { RenameGroupModal } from '../modals/RenameGroupModal'
import { DeleteGroupModal } from '../modals/DeleteGroupModal'
import { InviteGroupAdminModal } from '../modals/InviteGroupAdminModal'

const STAGES = [
  { value: 1, label: 'Ideation' },
  { value: 2, label: 'Market Research' },
  { value: 3, label: 'Problem Validation' },
  { value: 4, label: 'MVP Design' },
  { value: 5, label: 'Prototype Development' },
  { value: 6, label: 'Beta Testing' },
  { value: 7, label: 'Product Launch' },
  { value: 8, label: 'Early Traction' },
  { value: 9, label: 'Growth & Scaling' },
  { value: 10, label: 'Startup Registration' },
]

interface AdminWorkspacesViewProps {
  isAdmin: boolean
  isGroupAdmin?: boolean
  groupAdminGroupIds?: string[]
  onSwitchWorkspace: (wsId: string) => void
  onOpenCreateWorkspace: (groupId?: string) => void
}

interface WorkspaceData {
  id: string
  name: string | null
  created_at: string
  memberCount: number
  projectName?: string | null
  currentStage?: number | null
  ownerUserId?: string | null
  group_id?: string | null
  isMember?: boolean
}

interface GroupData {
  id: string
  name: string
  created_at: string
  workspaces: WorkspaceData[]
}

export function AdminWorkspacesView({ isAdmin, isGroupAdmin, groupAdminGroupIds, onSwitchWorkspace, onOpenCreateWorkspace }: AdminWorkspacesViewProps) {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [ungroupedWorkspaces, setUngroupedWorkspaces] = useState<WorkspaceData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Workspace modals
  const [renameModal, setRenameModal] = useState<{ id: string, name: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string, name: string } | null>(null)
  const [inviteModal, setInviteModal] = useState<{ id: string, name: string } | null>(null)

  // Group modals
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [renameGroupModal, setRenameGroupModal] = useState<{ id: string, name: string } | null>(null)
  const [deleteGroupModal, setDeleteGroupModal] = useState<{ id: string, name: string, workspaceCount: number } | null>(null)
  const [inviteGroupAdminModal, setInviteGroupAdminModal] = useState<{ groupId?: string } | null>(null)

  const supabase = createClient()

  const canAdministerWorkspace = (ws: WorkspaceData) => {
    if (isAdmin) return true;
    if (isGroupAdmin && ws.group_id && groupAdminGroupIds?.includes(ws.group_id)) return true;
    return false;
  }

  useEffect(() => {
    fetchData()

    const channel = supabase.channel('admin_workspaces_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_groups' }, () => {
        fetchData()
      })
      .subscribe()

    const forceFetch = () => fetchData()
    window.addEventListener('force_workspace_refresh', forceFetch)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('force_workspace_refresh', forceFetch)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id

    if (!userId) {
      setLoading(false)
      return
    }

    // Fetch groups - filter based on user role
    let groupsQuery = supabase
      .from('workspace_groups')
      .select('id, name, created_at')
      .order('created_at', { ascending: true })

    // If group admin (and not global admin), restrict to assigned groups
    if (!isAdmin && isGroupAdmin && groupAdminGroupIds && groupAdminGroupIds.length > 0) {
      groupsQuery = groupsQuery.in('id', groupAdminGroupIds)
    }

    const groupsResponse = await groupsQuery
    const groupsData = groupsResponse.data
    const groupsError = groupsResponse.error

    // Fetch workspaces
    let wsData: any[] = []
    let wsError: any = null

    if (isAdmin) {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, created_at, owner_id, group_id, workspace_members(role, user_id)')
        .order('created_at', { ascending: false })
      wsData = data || []
      wsError = error
    } else {
      // Not a global admin. 
      // Fetch matching explicit memberships
      const { data: memberData, error: memError } = await supabase
        .from('workspaces')
        .select('id, name, created_at, owner_id, group_id, workspace_members!inner(role, user_id)')
        .eq('workspace_members.user_id', userId)
        .order('created_at', { ascending: false })
      
      if (memError) wsError = memError
      else wsData = [...(memberData || [])]

      // If group admin, also fetch workspaces in their assigned groups
      if (isGroupAdmin && groupAdminGroupIds && groupAdminGroupIds.length > 0) {
        const { data: groupData, error: grpError } = await supabase
          .from('workspaces')
          .select('id, name, created_at, owner_id, group_id, workspace_members(role, user_id)')
          .in('group_id', groupAdminGroupIds)
          .order('created_at', { ascending: false })
        
        if (grpError) wsError = grpError
        else if (groupData) {
          // Merge avoiding duplicates
          const existingIds = new Set(wsData.map(ws => ws.id))
          for (const ws of groupData) {
            if (!existingIds.has(ws.id)) {
              wsData.push(ws)
            }
          }
        }
      }
    }

    if (wsData && !wsError) {
      const ownerIds = wsData.map((ws: any) => ws.owner_id).filter(Boolean)

      // Fetch project details for owners
      let projects: any[] = []
      if (ownerIds.length > 0) {
        const { data: pdData } = await supabase
          .from('project_details')
          .select('user_id, project_name, current_stage')
          .in('user_id', ownerIds)
        if (pdData) projects = pdData
      }

      const formattedWorkspaces: WorkspaceData[] = wsData
        .filter((ws: any) => ws.name !== 'ThinkSoul Admin')
        .map((ws: any) => {
          const project = ws.owner_id ? projects.find((p: any) => p.user_id === ws.owner_id) : null
          return {
            id: ws.id,
            name: ws.name,
            created_at: ws.created_at,
            memberCount: ws.workspace_members?.length || 0,
            projectName: project?.project_name || null,
            currentStage: project?.current_stage || null,
            ownerUserId: ws.owner_id || null,
            group_id: ws.group_id || null,
            isMember: ws.workspace_members?.some((m: any) => m.user_id === userId) || false
          }
        })

      // Client-side filter for group admins
      let finalWorkspaces = formattedWorkspaces
      if (!isAdmin && isGroupAdmin) {
        finalWorkspaces = formattedWorkspaces.filter(ws => 
          (ws.group_id && groupAdminGroupIds?.includes(ws.group_id)) || ws.isMember
        )
      } else {
         finalWorkspaces = formattedWorkspaces
      }

      // Organize workspaces into groups
      if (groupsData && !groupsError) {
        // groupsData is already filtered by database RLS and query filters
        // No need for additional client-side filtering
        const groupMap: GroupData[] = groupsData.map((g: any) => ({
          id: g.id,
          name: g.name,
          created_at: g.created_at,
          workspaces: finalWorkspaces.filter(ws => ws.group_id === g.id)
        }))

        const ungrouped = isGroupAdmin ? [] : finalWorkspaces.filter(ws => !ws.group_id)
        
        setGroups(groupMap)
        setUngroupedWorkspaces(ungrouped)
        
        // Auto-expand all groups on first load
        if (expandedGroups.size === 0) {
          setExpandedGroups(new Set(groupMap.map(g => g.id)))
        }
      }
    } else {
      console.error("Error fetching workspaces:", wsError)
    }
    setLoading(false)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleUpdateStage = async (e: React.ChangeEvent<HTMLSelectElement>, wsId: string, ownerId: string | null) => {
    e.stopPropagation()
    
    if (!ownerId) {
      toast.error("No owner linked to this workspace")
      return
    }

    const newStage = e.target.value ? Number(e.target.value) : null
    
    // Optimistic UI update
    setGroups(prev => prev.map(g => ({
      ...g,
      workspaces: g.workspaces.map(w => w.id === wsId ? { ...w, currentStage: newStage } : w)
    })))

    const { error } = await supabase
      .from('project_details')
      .update({ current_stage: newStage })
      .eq('user_id', ownerId)

    if (error) {
      toast.error('Failed to update stage')
      fetchData()
    } else {
      toast.success('Startup phase updated')
    }
  }

  const handleRenameWorkspace = async (wsId: string, wsName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenameModal({ id: wsId, name: wsName })
  }

  const handleInviteWorkspace = (wsId: string, wsName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setInviteModal({ id: wsId, name: wsName })
  }

  const onRenameSubmit = async (newName: string) => {
    if (!renameModal) return

    setLoading(true)
    try {
      const { error } = await supabase.from('workspaces').update({ name: newName }).eq('id', renameModal.id)
      if (error) {
        toast.error("Failed to rename workspace: " + error.message)
      } else {
        toast.success("Workspace renamed successfully")
        window.dispatchEvent(new Event('dashboard_force_refresh'))
        window.dispatchEvent(new Event('force_workspace_refresh'))
        setRenameModal(null)
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during rename")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkspace = async (wsId: string, wsName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({ id: wsId, name: wsName })
  }

  const onDeleteConfirm = async () => {
    if (!deleteModal) return

    setLoading(true)
    try {
      const { error } = await supabase.from('workspaces').delete().eq('id', deleteModal.id)
      if (error) {
        toast.error("Failed to delete workspace: " + error.message)
        setLoading(false)
      } else {
        toast.success("Workspace deleted successfully")
        window.dispatchEvent(new Event('dashboard_force_refresh'))
        window.dispatchEvent(new Event('force_workspace_refresh'))
        setDeleteModal(null)
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during deletion")
      setLoading(false)
    }
  }

  // Group actions
  const handleRenameGroup = async (newName: string) => {
    if (!renameGroupModal) return

    const { error } = await supabase
      .from('workspace_groups')
      .update({ name: newName })
      .eq('id', renameGroupModal.id)

    if (error) {
      toast.error("Failed to rename group: " + error.message)
    } else {
      toast.success("Group renamed successfully")
      fetchData()
    }
  }

  const handleDeleteGroup = async () => {
    if (!deleteGroupModal) return

    if (deleteGroupModal.workspaceCount > 0) {
      const { error: workspaceDeleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('group_id', deleteGroupModal.id)

      if (workspaceDeleteError) {
        toast.error("Failed to delete group workspaces: " + workspaceDeleteError.message)
        return
      }
    }

    const { error } = await supabase
      .from('workspace_groups')
      .delete()
      .eq('id', deleteGroupModal.id)

    if (error) {
      toast.error("Failed to delete group: " + error.message)
    } else {
      toast.success("Group deleted successfully")
      window.dispatchEvent(new Event('force_workspace_refresh'))
      fetchData()
    }
  }

  // Render a workspace row for the desktop table
  const renderWorkspaceRow = (ws: WorkspaceData) => (
    <tr 
      key={ws.id} 
      className="hover:bg-[#f9fafb] transition-colors group cursor-pointer"
      onClick={() => onSwitchWorkspace(ws.id)}
    >
      <td className="px-6 py-3">
        <div className="flex items-center gap-3 pl-8">
          <div className="w-7 h-7 rounded bg-[#efefed] flex items-center justify-center flex-shrink-0 border border-[#e5e7eb]">
            <span className="text-[13px] font-bold text-[#5f6368]">
              {(ws.projectName || ws.name)?.charAt(0).toUpperCase() || 'T'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#37352f] truncate max-w-[200px]">
              {ws.projectName || ws.name || 'Untitled Workspace'}
            </span>
            {ws.projectName && ws.name && ws.projectName !== ws.name && (
              <span className="text-[11px] text-[#9ca3af] truncate max-w-[200px]">
                {ws.name}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <select
          value={ws.currentStage || ''}
          onChange={(e) => handleUpdateStage(e, ws.id, ws.ownerUserId || null)}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-[12px] text-[#37352f] bg-transparent border border-transparent hover:border-[#e5e7eb] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none rounded p-1 cursor-pointer transition-all"
        >
          <option value="">Select Phase...</option>
          {STAGES.map(s => (
            <option key={s.value} value={s.value}>{s.value}. {s.label}</option>
          ))}
        </select>
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center gap-1.5 text-[#5f6368]">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[12px]">{ws.memberCount} Mems</span>
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center gap-1.5 text-[#5f6368]">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[12px]">
            {new Date(ws.created_at).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </td>
      <td className="px-6 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button 
            className="flex items-center justify-end gap-1 text-[12px] font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onSwitchWorkspace(ws.id)
            }}
          >
            Visit <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          {canAdministerWorkspace(ws) && (
            <>
              <button
                onClick={(e) => handleInviteWorkspace(ws.id, ws.name || 'Untitled Workspace', e)}
                className="text-gray-400 hover:text-indigo-600 transition-colors ml-2"
                title="Invite Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleRenameWorkspace(ws.id, ws.name || 'Untitled Workspace', e)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Rename Workspace"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDeleteWorkspace(ws.id, ws.name || 'Untitled Workspace', e)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Workspace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )

  // Render a workspace card for mobile
  const renderWorkspaceCard = (ws: WorkspaceData) => (
    <div 
      key={ws.id} 
      className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm p-4 active:bg-[#f9fafb] transition-colors ml-3"
      onClick={() => onSwitchWorkspace(ws.id)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#efefed] flex items-center justify-center flex-shrink-0 border border-[#e5e7eb]">
          <span className="text-[15px] font-bold text-[#5f6368]">
            {(ws.projectName || ws.name)?.charAt(0).toUpperCase() || 'T'}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-[#37352f] truncate">
            {ws.projectName || ws.name || 'Untitled Workspace'}
          </span>
          <span className="text-[11px] text-[#9ca3af] truncate">
            {ws.name}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Startup Phase</label>
          <select
            value={ws.currentStage || ''}
            onChange={(e) => handleUpdateStage(e, ws.id, ws.ownerUserId || null)}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[12px] text-[#37352f] bg-[#fbfbfa] border border-[#e5e7eb] focus:border-[#1a73e8] outline-none rounded-lg p-2 cursor-pointer transition-all appearance-none"
          >
            <option value="">Select Phase...</option>
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.value}. {s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-[#5f6368]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[12px]">{ws.memberCount} Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {new Date(ws.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button 
          className="flex-1 h-9 flex items-center justify-center gap-2 bg-[#f3f4f6] text-[#1a73e8] text-[12px] font-semibold rounded-lg hover:bg-[#e8f0fe] transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onSwitchWorkspace(ws.id)
          }}
        >
          Visit <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {canAdministerWorkspace(ws) && (
          <div className="flex gap-2">
            <button
              onClick={(e) => handleInviteWorkspace(ws.id, ws.name || 'Untitled Workspace', e)}
              className="h-9 px-3 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              title="Invite Member"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleDeleteWorkspace(ws.id, ws.name || 'Untitled Workspace', e)}
              className="h-9 px-3 flex items-center justify-center bg-[#fee2e2] text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete Workspace"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Render group header row for desktop table
  const renderGroupHeader = (group: GroupData) => {
    const isExpanded = expandedGroups.has(group.id)
    const isGeneral = group.name === 'General'
    return (
      <tr 
        key={`group-${group.id}`}
        className="bg-[#fbfbfa] hover:bg-[#f3f4f6] cursor-pointer transition-colors border-b border-[#e5e7eb]"
        onClick={() => toggleGroup(group.id)}
      >
        <td colSpan={5} className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-0.5">
                {isExpanded 
                  ? <ChevronDown className="w-4 h-4 text-[#5f6368]" />
                  : <ChevronRight className="w-4 h-4 text-[#5f6368]" />
                }
              </button>
              {isExpanded 
                ? <FolderOpen className="w-[18px] h-[18px] text-amber-500" />
                : <FolderClosed className="w-[18px] h-[18px] text-amber-500" />
              }
              <span className="text-[14px] font-semibold text-[#37352f]">
                {group.name}
              </span>
              <span className="text-[11px] text-[#9ca3af] bg-[#efefed] px-2 py-0.5 rounded-full font-medium">
                {group.workspaces.length} workspace{group.workspaces.length !== 1 ? 's' : ''}
              </span>
            </div>

            {(isAdmin || isGroupAdmin) && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenCreateWorkspace(group.id)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                  title="Add workspace to this group"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setInviteGroupAdminModal({ groupId: group.id })}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                    title="Invite group admin"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && !isGeneral && (
                  <button
                    onClick={() => setRenameGroupModal({ id: group.id, name: group.name })}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                    title="Rename group"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && !isGeneral && (
                  <button
                    onClick={() => setDeleteGroupModal({ id: group.id, name: group.name, workspaceCount: group.workspaces.length })}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    title="Delete group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }

  // Render a group section for mobile
  const renderMobileGroup = (group: GroupData) => {
    const isExpanded = expandedGroups.has(group.id)
    const isGeneral = group.name === 'General'
    return (
      <div key={`mgroup-${group.id}`} className="mb-4">
        <div 
          className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden"
        >
          {/* Group header */}
          <div 
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f9fafb] transition-colors"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center gap-2.5">
              {isExpanded 
                ? <ChevronDown className="w-4 h-4 text-[#5f6368]" />
                : <ChevronRight className="w-4 h-4 text-[#5f6368]" />
              }
              {isExpanded 
                ? <FolderOpen className="w-5 h-5 text-amber-500" />
                : <FolderClosed className="w-5 h-5 text-amber-500" />
              }
              <span className="text-[14px] font-semibold text-[#37352f]">{group.name}</span>
              <span className="text-[11px] text-[#9ca3af] bg-[#efefed] px-2 py-0.5 rounded-full font-medium">
                {group.workspaces.length}
              </span>
            </div>

            {(isAdmin || isGroupAdmin) && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenCreateWorkspace(group.id)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md"
                  title="Add workspace"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setInviteGroupAdminModal({ groupId: group.id })}
                    className="p-1.5 text-gray-400 hover:text-purple-600 rounded-md"
                    title="Invite admin"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && !isGeneral && (
                  <button
                    onClick={() => setRenameGroupModal({ id: group.id, name: group.name })}
                    className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && !isGeneral && (
                  <button
                    onClick={() => setDeleteGroupModal({ id: group.id, name: group.name, workspaceCount: group.workspaces.length })}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Expanded workspace list */}
          {isExpanded && (
            <div className="border-t border-[#e5e7eb] px-3 py-3 space-y-3 bg-[#fbfbfa]">
              {group.workspaces.length === 0 ? (
                <p className="text-[12px] text-[#9ca3af] text-center py-4">No workspaces in this group.</p>
              ) : (
                group.workspaces.map(ws => renderWorkspaceCard(ws))
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalWorkspaces = groups.reduce((sum, g) => sum + g.workspaces.length, 0) + ungroupedWorkspaces.length

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[20px] md:text-[24px] font-bold text-[#1f1f1f] mb-1">Workspaces Directory</h1>
            <p className="text-[13px] md:text-[14px] text-[#5f6368]">Manage and navigate across all isolated client environments.</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setInviteGroupAdminModal({})}
                className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm flex-1 sm:flex-initial"
              >
                <Shield className="w-4 h-4" /> Invite Group Admin
              </button>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="h-10 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm flex-1 sm:flex-initial"
              >
                <FolderPlus className="w-4 h-4" /> Create Category
              </button>
            </div>
          )}
        </div>

        {/* Mobile View: Card Grid */}
        <div className="md:hidden space-y-2 mb-8">
          {loading ? (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#9ca3af] mb-2" />
              <p className="text-[13px] text-[#5f6368]">Loading workspaces...</p>
            </div>
          ) : totalWorkspaces === 0 && groups.length === 0 ? (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-[#9ca3af]" />
              </div>
              <h1 className="text-[14px] font-medium text-[#1f1f1f] mb-1">No Groups Found</h1>
              <p className="text-[13px] text-[#5f6368]">
                {isAdmin ? "Click above to create your first group." : "Contact an administrator to be assigned to a workspace."}
              </p>
            </div>
          ) : (
            <>
              {groups.map(group => renderMobileGroup(group))}
              {ungroupedWorkspaces.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-[#91918e] uppercase tracking-wider mb-2 px-1">Ungrouped</p>
                  <div className="space-y-3">
                    {ungroupedWorkspaces.map(ws => renderWorkspaceCard(ws))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop View: Data Table with Groups */}
        <div className="hidden md:block bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fbfbfa] border-b border-[#e5e7eb]">
                  <th className="px-6 py-4 text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider">Startup / Workspace Name</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider w-48">Startup Phase</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider w-32">Members</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider w-40">Created At</th>
                  <th className="px-6 py-4 text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#9ca3af] mb-2" />
                      <p className="text-[13px] text-[#5f6368]">Loading workspaces...</p>
                    </td>
                  </tr>
                ) : totalWorkspaces === 0 && groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-5 h-5 text-[#9ca3af]" />
                      </div>
                      <h3 className="text-[14px] font-medium text-[#1f1f1f] mb-1">No Groups Found</h3>
                      <p className="text-[13px] text-[#5f6368]">
                        {isAdmin ? "Click above to create your first group." : "Contact an administrator to be assigned to a workspace."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {groups.map(group => (
                      <React.Fragment key={group.id}>
                        {renderGroupHeader(group)}
                        {expandedGroups.has(group.id) && (
                          group.workspaces.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center bg-[#fbfbfa]/50">
                                <p className="text-[12px] text-[#9ca3af] italic">No workspaces in this group yet.</p>
                              </td>
                            </tr>
                          ) : (
                            group.workspaces.map(ws => renderWorkspaceRow(ws))
                          )
                        )}
                      </React.Fragment>
                    ))}
                    {ungroupedWorkspaces.length > 0 && (
                      <>
                        <tr className="bg-[#fbfbfa] border-b border-[#e5e7eb]">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <FolderOpen className="w-[18px] h-[18px] text-gray-400" />
                              <span className="text-[13px] font-medium text-[#5f6368] italic">Ungrouped</span>
                              <span className="text-[11px] text-[#9ca3af] bg-[#efefed] px-2 py-0.5 rounded-full font-medium">
                                {ungroupedWorkspaces.length}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {ungroupedWorkspaces.map(ws => renderWorkspaceRow(ws))}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Workspace Modals */}
      {renameModal && (
        <RenameWorkspaceModal 
          initialName={renameModal.name}
          onClose={() => setRenameModal(null)}
          onSubmit={onRenameSubmit}
        />
      )}

      {deleteModal && (
        <DeleteWorkspaceModal 
          workspaceName={deleteModal.name}
          onClose={() => setDeleteModal(null)}
          onConfirm={onDeleteConfirm}
        />
      )}

      {inviteModal && (
        <InviteMemberModal 
          workspaceId={inviteModal.id}
          workspaceName={inviteModal.name}
          onClose={() => setInviteModal(null)}
        />
      )}

      {/* Group Modals */}
      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={() => {
            setIsCreateGroupOpen(false)
            toast.success("Group created successfully")
            fetchData()
          }}
        />
      )}

      {renameGroupModal && (
        <RenameGroupModal
          initialName={renameGroupModal.name}
          onClose={() => setRenameGroupModal(null)}
          onSubmit={handleRenameGroup}
        />
      )}

      {deleteGroupModal && (
        <DeleteGroupModal
          groupName={deleteGroupModal.name}
          workspaceCount={deleteGroupModal.workspaceCount}
          onClose={() => setDeleteGroupModal(null)}
          onConfirm={handleDeleteGroup}
        />
      )}

      {inviteGroupAdminModal && (
        <InviteGroupAdminModal
          preselectedGroupId={inviteGroupAdminModal.groupId}
          onClose={() => setInviteGroupAdminModal(null)}
        />
      )}
    </div>
  )
}
