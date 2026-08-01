'use client'

type SidebarPage = {
  id: string
  title: string | null
  icon: string | null
  parent_id: string | null
  workspace_id: string
  is_trash: boolean
  is_favorite: boolean
  type: string
}

function PageMenu({ page, onDelete, onToggleFavorite, onRename, onDuplicate }: {
  page: SidebarPage,
  onDelete: () => void,
  onToggleFavorite: () => void,
  onRename: () => void,
  onDuplicate: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className={`relative ${isOpen ? 'opacity-100' : ''}`} ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] hover:text-[#1f1f1f]"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-[#e5e7eb] rounded-lg shadow-xl py-1 z-[100] animate-in fade-in zoom-in duration-100">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); setIsOpen(false) }}
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2"
          >
            <Star className={`w-3.5 h-3.5 ${page.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-[#9ca3af]'}`} />
            {page.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>

          <div className="my-1 border-t border-[#e5e7eb]" />

          <button
            onClick={(e) => { e.stopPropagation(); onRename(); setIsOpen(false) }}
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#9ca3af]" />
            Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); setIsOpen(false) }}
            className="w-full px-3 py-1.5 text-left text-[13px] text-[#37352f] hover:bg-[#f3f4f6] flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-[#9ca3af]" />
            Duplicate
          </button>

          <div className="my-1 border-t border-[#e5e7eb]" />

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false) }}
            className="w-full px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Settings, ChevronRight, ChevronDown, FileText, Layout, Trash2, LogOut, Check, ArrowLeft, MoreHorizontal, Star, Copy, Edit2, X } from 'lucide-react'
import { SpacesView } from './SpacesView'

interface SidebarProps {
  workspaceId: string | null
  workspaceName: string
  userDisplayName?: string
  workspaces: { id: string; name: string | null; group_id?: string | null }[]
  workspaceGroups?: { id: string; name: string }[]
  isAdmin: boolean
  isGroupAdmin?: boolean
  groupAdminGroupIds?: string[]
  onSwitchWorkspace: (wsId: string) => void
  onOpenCreateWorkspace: (groupId?: string) => void
  onOpenCreateGroup: () => void
  onOpenAdminWorkspaces: () => void
  onRenameGroup: (groupId: string, currentName: string) => void
  onDeleteGroup: (groupId: string) => void
  onInviteGroupAdmin: (groupId: string) => void
  onRenameWorkspace: (wsId: string, currentName: string) => void
  onDeleteWorkspace: (wsId: string) => void
  onInviteWorkspaceMember: (wsId: string) => void
  activePageId: string | null
  activeView?: 'editor' | 'admin-workspaces'
  onPageSelect: (page: { id: string; title: string; icon: string | null; type?: string }) => void
  pages: SidebarPage[]
  onCreatePage: (parentId: string | null, type?: string) => void
  onDeletePage: (page: SidebarPage) => void
  onToggleFavorite: (pageId: string, status: boolean) => void
  onRenamePage: (pageId: string, currentTitle: string) => void
  onDuplicatePage: (pageId: string) => void
  onLogout: () => void
  onOpenTrash: () => void
  onOpenSettings: () => void
  isMobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  workspaceId,
  workspaceName,
  userDisplayName,
  workspaces,
  workspaceGroups = [],
  isAdmin,
  isGroupAdmin,
  groupAdminGroupIds = [],
  onSwitchWorkspace,
  onOpenCreateWorkspace,
  onOpenCreateGroup,
  activePageId,
  activeView,
  onPageSelect,
  pages,
  onCreatePage,
  onDeletePage,
  onToggleFavorite,
  onRenamePage,
  onDuplicatePage,
  onLogout,
  onOpenTrash,
  onOpenSettings,
  onOpenAdminWorkspaces,
  onRenameGroup,
  onDeleteGroup,
  onInviteGroupAdmin,
  onRenameWorkspace,
  onDeleteWorkspace,
  onInviteWorkspaceMember,
  isMobileOpen,
  onClose
}: SidebarProps) {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)
  const workspaceSwitcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceSwitcherRef.current && !workspaceSwitcherRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false)
      }
    }
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isWorkspaceMenuOpen])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [spaceOpen, setSpaceOpen] = useState(true)
  const [favoritesOpen, setFavoritesOpen] = useState(true)
  const [todosOpen, setTodosOpen] = useState(true)
  const adminHomeWorkspace = isAdmin ? workspaces.find(w => w.name === 'ThinkSoul Admin') : null
  const showBackToAdmin = Boolean(adminHomeWorkspace && workspaceId !== adminHomeWorkspace.id)
  const defaultWorkspaceId = adminHomeWorkspace?.id ?? workspaces[0]?.id ?? null

  const toggleExpand = (pageId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) next.delete(pageId)
      else next.add(pageId)
      return next
    })
  }

  const renderActiveWorkspaceSections = () => (
    <div className="ml-9 mr-1 mt-1 mb-2 border-l border-[#e5e7eb] pl-2">
      <div className="pt-1 pb-1 flex items-center justify-between">
        <button
          onClick={() => setTodosOpen(!todosOpen)}
          className="flex items-center gap-1.5 px-1.5 h-[26px] flex-1 text-left rounded hover:bg-[#f3f4f6]"
        >
          {todosOpen
            ? <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
            : <ChevronRight className="w-3 h-3 text-[#9ca3af]" />
          }
          <span className="text-[11px] font-semibold text-[#91918e] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-green-500 rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            To-dos
          </span>
        </button>
        <button
          onClick={() => onCreatePage(null, 'board')}
          className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="mt-0.5">
        {todosOpen && renderTree(null, 0, 'board')}
      </div>

      <div className="pt-2 pb-1 flex items-center justify-between">
        <button
          onClick={() => setSpaceOpen(!spaceOpen)}
          className="flex items-center gap-1.5 px-1.5 h-[26px] flex-1 text-left rounded hover:bg-[#f3f4f6]"
        >
          {spaceOpen
            ? <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
            : <ChevronRight className="w-3 h-3 text-[#9ca3af]" />
          }
          <span className="text-[11px] font-semibold text-[#91918e] uppercase tracking-wider">General Workspace</span>
        </button>
        <button
          onClick={() => onCreatePage(null, 'document')}
          className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/5 text-[#9ca3af] transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="mt-0.5">
        {spaceOpen && renderTree(null, 0, 'document')}
      </div>
    </div>
  )

  const renderTree = (parentId: string | null, level: number = 0, pageType: string = 'document'): React.ReactNode => {
    const children = pages.filter(p => p.parent_id === parentId && (p.type || 'document') === pageType)
    if (children.length === 0 && parentId !== null) return null

    return children.map(page => {
      const isActive = activePageId === page.id && activeView !== 'admin-workspaces'
      const isExpanded = expanded.has(page.id)
      const hasChildren = pages.some(p => p.parent_id === page.id)

      return (
        <div key={page.id}>
          <div
            className={`group flex items-center h-[32px] rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#e8f0fe]' : 'hover:bg-[#f3f4f6]'
              }`}
            style={{ paddingLeft: `${level * 16 + 12}px`, paddingRight: '8px' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(page.id) }}
              className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-sm hover:bg-black/5"
            >
              {hasChildren ? (
                isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />
                  : <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
              ) : (
                <span className="w-3.5" />
              )}
            </button>

            <div
              onClick={() => onPageSelect({ id: page.id, title: page.title ?? 'Untitled', icon: page.icon, type: page.type })}
              className="flex-1 flex items-center gap-2 min-w-0 text-left"
            >
              {page.icon ? (
                <span className="text-[14px] flex-shrink-0 leading-none">{page.icon}</span>
              ) : (
                <FileText className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
              )}
              <span className={`text-[13px] truncate ${isActive ? 'font-medium text-[#1f1f1f]' : 'text-[#5f6368]'}`}>
                {page.title || 'Untitled'}
              </span>
            </div>

            <div className={`flex items-center gap-0.5 ml-auto relative transition-opacity ${activePageId === page.id ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'
              }`}>
              <PageMenu
                page={page}
                onDelete={() => onDeletePage(page)}
                onToggleFavorite={() => onToggleFavorite(page.id, !page.is_favorite)}
                onRename={() => onRenamePage(page.id, page.title || '')}
                onDuplicate={() => onDuplicatePage(page.id)}
              />
            </div>
          </div>

          {isExpanded && renderTree(page.id, level + 1, pageType)}
        </div>
      )
    })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[100] 
        w-[260px] max-md:fixed
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full bg-[#fbfbfa] border-r border-[#e5e7eb] transition-transform duration-300 ease-in-out
      `}>
      {/* Workspace Header Switcher */}
      <div className="h-12 flex items-center justify-between px-4 relative" ref={workspaceSwitcherRef}>
        <div 
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="flex flex-1 items-center gap-2.5 p-1 -ml-1 rounded transition-colors text-left cursor-pointer hover:bg-[#efefed]"
        >
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-white border border-[#e5e7eb] shadow-sm">
            <img src="/assets/ThinkSoul.jpg" alt="TS" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-[14px] font-semibold text-[#37352f] truncate flex-1">{workspaceName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0" />
        </div>

        {/* Workspace Dropdown */}
        {isWorkspaceMenuOpen && (
          <div className="absolute top-full left-4 mt-1 w-64 bg-white border border-[#e5e7eb] shadow-xl rounded-lg py-1.5 z-[100] animate-in fade-in zoom-in duration-100 max-h-[60vh] overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider">
              {userDisplayName || 'Account'}
            </div>
            
            <div className="my-1 border-t border-[#e5e7eb]" />
            
            {/* Map groups */}
            {workspaceGroups.map(group => {
              const groupWorkspaces = workspaces.filter(w => w.group_id === group.id)
              if (groupWorkspaces.length === 0) return null

              return (
                <div key={group.id} className="mb-2">
                  <div className="px-3 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">
                    <span>#</span> {group.name}
                  </div>
                  {groupWorkspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSwitchWorkspace(ws.id)
                        setIsWorkspaceMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2.5 hover:bg-[#f3f4f6] transition-colors"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${workspaceId === ws.id ? 'bg-[#1a73e8]' : 'bg-[#efefed]'}`}>
                        <span className={`text-[10px] font-bold ${workspaceId === ws.id ? 'text-white' : 'text-[#5f6368]'}`}>
                          {ws.name?.[0]?.toUpperCase() || 'W'}
                        </span>
                      </div>
                      <span className={`flex-1 truncate ${workspaceId === ws.id ? 'font-medium text-[#1f1f1f]' : 'text-[#37352f]'}`}>
                        {ws.name}
                      </span>
                      {workspaceId === ws.id && <Check className="w-4 h-4 text-[#1a73e8]" />}
                    </button>
                  ))}
                </div>
              )
            })}

            {/* Workspaces with no group assignment */}
            {(() => {
              const unassignedWorkspaces = workspaces.filter(w => !w.group_id)
              if (unassignedWorkspaces.length === 0) return null

              return (
                <div className="mb-2">
                  <div className="px-3 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">
                    <span>#</span> Unassigned
                  </div>
                  {unassignedWorkspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSwitchWorkspace(ws.id)
                        setIsWorkspaceMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2.5 hover:bg-[#f3f4f6] transition-colors"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${workspaceId === ws.id ? 'bg-[#1a73e8]' : 'bg-[#efefed]'}`}>
                        <span className={`text-[10px] font-bold ${workspaceId === ws.id ? 'text-white' : 'text-[#5f6368]'}`}>
                          {ws.name?.[0]?.toUpperCase() || 'W'}
                        </span>
                      </div>
                      <span className={`flex-1 truncate ${workspaceId === ws.id ? 'font-medium text-[#1f1f1f]' : 'text-[#37352f]'}`}>
                        {ws.name}
                      </span>
                      {workspaceId === ws.id && <Check className="w-4 h-4 text-[#1a73e8]" />}
                    </button>
                  ))}
                </div>
              )
            })()}

            {(isAdmin || isGroupAdmin) && (
              <>
                <div className="my-1 border-t border-[#e5e7eb]" />
                <button
                  onClick={() => {
                    onOpenCreateWorkspace()
                    setIsWorkspaceMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#5f6368] hover:bg-[#f3f4f6] transition-colors flex items-center gap-2"
                >
                  <div className="w-5 h-5 flex items-center justify-center bg-[#efefed] rounded">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  Create Workspace
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#efefed] text-[#9ca3af] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 flex items-center justify-center rounded hover:bg-[#efefed] text-[#9ca3af] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="px-3 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[#5f6368] hover:bg-[#efefed]">
          <Search className="w-4 h-4 text-[#9ca3af]" />
          <span className="text-[13px]">Search</span>
        </button>
        {(isAdmin || isGroupAdmin) && !showBackToAdmin && (
          <button
            onClick={onOpenAdminWorkspaces}
            className={`w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md transition-colors ${activeView === 'admin-workspaces' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#5f6368] hover:bg-[#efefed]'}`}
          >
            <Layout className={`w-4 h-4 ${activeView === 'admin-workspaces' ? 'text-[#1a73e8]' : 'text-[#9ca3af]'}`} />
            <span className={`text-[13px] ${activeView === 'admin-workspaces' ? 'font-medium' : ''}`}>Workspaces</span>
          </button>
        )}
        {isAdmin && adminHomeWorkspace && showBackToAdmin && (() => {
            return (
              <button
                onClick={() => onSwitchWorkspace(adminHomeWorkspace.id)}
                className="w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] transition-colors"
                title="Return to ThinkSoul Admin"
              >
                <ArrowLeft className="w-4 h-4 text-[#1a73e8]" />
                <span className="text-[13px] font-medium text-[#1a73e8]">Back to Admin</span>
              </button>
            )
        })()}

      </div>

      {/* Favorites Section */}
      {pages.some(p => p.is_favorite && !p.is_trash) && (
        <>
          <div className="px-3 pt-4 pb-1">
            <button
              onClick={() => setFavoritesOpen(!favoritesOpen)}
              className="flex items-center gap-1.5 px-2.5 w-full text-left"
            >
              {favoritesOpen
                ? <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
                : <ChevronRight className="w-3 h-3 text-[#9ca3af]" />
              }
              <span className="text-[11px] font-semibold text-[#91918e] uppercase tracking-wider">Favorites</span>
            </button>
          </div>
          <div className="px-2 mt-1">
            {favoritesOpen && pages.filter(p => p.is_favorite && !p.is_trash).map(page => (
              <div
                key={`fav-${page.id}`}
                onClick={() => onPageSelect({ id: page.id, title: page.title ?? 'Untitled', icon: page.icon, type: page.type })}
                className={`group flex items-center h-[32px] rounded-md cursor-pointer transition-colors px-3 gap-2 ${activePageId === page.id && activeView !== 'admin-workspaces' ? 'bg-[#e8f0fe]' : 'hover:bg-[#f3f4f6]'
                  }`}
              >
                {page.icon ? (
                  <span className="text-[14px] flex-shrink-0">{page.icon}</span>
                ) : (
                  <FileText className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
                )}
                <span className={`text-[13px] truncate ${activePageId === page.id && activeView !== 'admin-workspaces' ? 'font-medium text-[#1f1f1f]' : 'text-[#5f6368]'}`}>
                  {page.title || 'Untitled'}
                </span>

                <div className={`flex items-center gap-0.5 ml-auto relative transition-opacity ${activePageId === page.id && activeView !== 'admin-workspaces' ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'
                  }`}>
                  <PageMenu
                    page={page}
                    onDelete={() => onDeletePage(page)}
                    onToggleFavorite={() => onToggleFavorite(page.id, !page.is_favorite)}
                    onRename={() => onRenamePage(page.id, page.title || '')}
                    onDuplicate={() => onDuplicatePage(page.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Spaces Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-2">
        <SpacesView
          groups={workspaceGroups || []}
          workspaces={workspaces}
          userRole={isAdmin ? 'admin' : isGroupAdmin ? 'group_admin' : 'user'}
          userGroupIds={groupAdminGroupIds}
          onCreateGroup={onOpenCreateGroup}
          onCreateWorkspace={onOpenCreateWorkspace}
          onRenameGroup={onRenameGroup}
          onDeleteGroup={onDeleteGroup}
          onInviteGroupAdmin={onInviteGroupAdmin}
          onRenameWorkspace={onRenameWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onInviteWorkspaceMember={onInviteWorkspaceMember}
          onSelectWorkspace={onSwitchWorkspace}
          activeWorkspaceId={workspaceId}
          defaultWorkspaceId={defaultWorkspaceId}
          activeWorkspaceContent={renderActiveWorkspaceSections()}
        />
      </div>

      {/* Bottom Bar */}
      <div className="mt-auto border-t border-[#e5e7eb] px-3 py-2 space-y-0.5">
        <button
          onClick={onOpenTrash}
          className="w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[#5f6368] hover:bg-[#efefed]"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#9ca3af]" />
          <span className="text-[13px]">Trash</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[#5f6368] hover:bg-[#efefed] hover:text-[#ef4444] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[13px]">Logout</span>
        </button>
        <div className="pt-2 pb-1 text-center opacity-70 pointer-events-none">
          <span className="text-[9px] font-bold text-[#9ca3af] tracking-[0.1em] uppercase italic">&copy; {new Date().getFullYear()} ThinkSoul Co.</span>
        </div>
      </div>
    </aside>
    </>
  )
}
