'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Plus, FolderOpen, FolderClosed, MoreVertical, Trash2, Edit2, Users } from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface Workspace {
  id: string
  name: string | null
  group_id?: string | null
}

interface SpacesViewProps {
  groups: Group[]
  workspaces: Workspace[]
  userRole?: 'admin' | 'group_admin' | 'user'
  userGroupIds?: string[]
  onCreateGroup: () => void
  onCreateWorkspace: (groupId?: string) => void
  onRenameGroup: (groupId: string, currentName: string) => void
  onDeleteGroup: (groupId: string) => void
  onInviteGroupAdmin: (groupId: string) => void
  onRenameWorkspace: (wsId: string, currentName: string) => void
  onDeleteWorkspace: (wsId: string) => void
  onInviteWorkspaceMember: (wsId: string) => void
  onSelectWorkspace: (wsId: string) => void
  activeWorkspaceId?: string | null
  defaultWorkspaceId?: string | null
  activeWorkspaceContent?: ReactNode
}

function GroupActionMenu({ onRename, onDelete, onInvite, canDelete }: {
  onRename: () => void
  onDelete: () => void
  onInvite: () => void
  canDelete: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group/menu">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          <div className="absolute right-0 top-5 w-44 bg-white border border-[#e5e7eb] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRename()
                setIsOpen(false)
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#9ca3af]" />
              Rename Group
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onInvite()
                setIsOpen(false)
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#9ca3af]" />
              Invite Admin
            </button>

            {canDelete && (
              <>
                <div className="my-1 border-t border-[#e5e7eb]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Group
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function WorkspaceActionMenu({ onRename, onDelete, onInvite, canDelete }: {
  onRename: () => void
  onDelete: () => void
  onInvite: () => void
  canDelete: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group/menu">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          <div className="absolute right-0 top-5 w-48 bg-white border border-[#e5e7eb] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRename()
                setIsOpen(false)
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#9ca3af]" />
              Rename Workspace
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onInvite()
                setIsOpen(false)
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#9ca3af]" />
              Invite Member
            </button>

            {canDelete && (
              <>
                <div className="my-1 border-t border-[#e5e7eb]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Workspace
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function SpacesView({
  groups,
  workspaces,
  userRole = 'user',
  userGroupIds = [],
  onCreateGroup,
  onCreateWorkspace,
  onRenameGroup,
  onDeleteGroup,
  onInviteGroupAdmin,
  onRenameWorkspace,
  onDeleteWorkspace,
  onInviteWorkspaceMember,
  onSelectWorkspace,
  activeWorkspaceId,
  defaultWorkspaceId,
  activeWorkspaceContent
}: SpacesViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null)

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const canManageGroup = () => userRole === 'admin'
  const canCreateWorkspaceInGroup = (groupId: string) => {
    if (userRole === 'admin') return true
    if (userRole === 'group_admin' && userGroupIds.includes(groupId)) return true
    return false
  }
  const canManageWorkspace = (groupId: string | null | undefined) => {
    if (userRole === 'admin') return true
    if (userRole === 'group_admin' && groupId && userGroupIds.includes(groupId)) return true
    return false
  }
  const canDeleteWorkspace = (groupId: string | null | undefined) => {
    if (userRole === 'admin') return true
    if (userRole === 'group_admin' && groupId && userGroupIds.includes(groupId)) return true
    return false
  }
  const canDeleteGroup = () => userRole === 'admin'
  const handleWorkspaceClick = (workspaceId: string) => {
    if (expandedWorkspaceId === workspaceId) {
      setExpandedWorkspaceId(null)
      if (defaultWorkspaceId && defaultWorkspaceId !== workspaceId) {
        onSelectWorkspace(defaultWorkspaceId)
      }
      return
    }

    setExpandedWorkspaceId(workspaceId)
    onSelectWorkspace(workspaceId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add Group button */}
      <div className="px-3 pt-4 pb-1 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-[#91918e] uppercase tracking-wider">Spaces</span>
        {userRole === 'admin' && (
          <button
            onClick={onCreateGroup}
            className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-opacity"
            title="Create group"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Scrollable Groups List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-[12px] text-[#9ca3af]">No groups yet</p>
          </div>
        ) : (
          groups.map(group => {
            const groupWorkspaces = workspaces.filter(w => w.group_id === group.id)
            const isExpanded = expandedGroups.has(group.id)
            const hasWorkspaces = groupWorkspaces.length > 0

            return (
              <div key={group.id}>
                {/* Group Row */}
                <div
                  onClick={() => hasWorkspaces && toggleGroup(group.id)}
                  className={`group flex items-center h-[32px] rounded-md hover:bg-[#f3f4f6] px-2 gap-1 ${hasWorkspaces ? 'cursor-pointer' : ''}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (hasWorkspaces) toggleGroup(group.id)
                    }}
                    aria-expanded={hasWorkspaces ? isExpanded : undefined}
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-sm hover:bg-black/5"
                  >
                    {hasWorkspaces ? (
                      isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
                        : <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                  </button>

                  {isExpanded && hasWorkspaces ? (
                    <FolderOpen className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                  ) : (
                    <FolderClosed className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                  )}

                  <span className="flex-1 text-[13px] text-[#37352f] truncate font-medium">
                    {group.name}
                  </span>

                  <div className="flex items-center gap-1">
                    {(canCreateWorkspaceInGroup(group.id) || canManageGroup()) && (
                      <>
                        {canCreateWorkspaceInGroup(group.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCreateWorkspace(group.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-all"
                            title="Add workspace"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        {canManageGroup() && (
                          <GroupActionMenu
                            onRename={() => onRenameGroup(group.id, group.name)}
                            onDelete={() => onDeleteGroup(group.id)}
                            onInvite={() => onInviteGroupAdmin(group.id)}
                            canDelete={canDeleteGroup()}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Workspaces */}
                {isExpanded && groupWorkspaces.map(ws => {
                  const isActiveWorkspace = ws.id === activeWorkspaceId
                  const isExpandedWorkspace = ws.id === expandedWorkspaceId

                  return (
                    <div key={ws.id}>
                      <div
                        className={`group flex items-center h-[32px] rounded-md pl-10 pr-2 gap-2 ml-1 transition-colors ${
                          isActiveWorkspace ? 'bg-[#e8f0fe]' : 'hover:bg-[#f3f4f6]'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#d1d5db] flex-shrink-0" />
                        <button
                          onClick={() => handleWorkspaceClick(ws.id)}
                          aria-expanded={isExpandedWorkspace}
                          className={`text-[13px] flex-1 truncate text-left cursor-pointer ${
                            isActiveWorkspace ? 'font-medium text-[#1f1f1f]' : 'text-[#5f6368]'
                          }`}
                        >
                          {ws.name || 'Untitled'}
                        </button>

                        {canManageWorkspace(ws.group_id) && (
                          <WorkspaceActionMenu
                            onRename={() => onRenameWorkspace(ws.id, ws.name || '')}
                            onDelete={() => onDeleteWorkspace(ws.id)}
                            onInvite={() => onInviteWorkspaceMember(ws.id)}
                            canDelete={canDeleteWorkspace(ws.group_id)}
                          />
                        )}
                      </div>

                      {isExpandedWorkspace && activeWorkspaceContent}
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
