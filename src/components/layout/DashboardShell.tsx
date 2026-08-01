'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const PageEditor = dynamic(() => import('@/components/editor/PageEditorWrapper'), { ssr: false })
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal'
import { TrashModal } from '@/components/modals/TrashModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { CreateWorkspaceModal } from '@/components/modals/CreateWorkspaceModal'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { RenameGroupModal } from '@/components/modals/RenameGroupModal'
import { DeleteGroupModal } from '@/components/modals/DeleteGroupModal'
import { InviteGroupAdminModal } from '@/components/modals/InviteGroupAdminModal'
import { RenameWorkspaceModal } from '@/components/modals/RenameWorkspaceModal'
import { DeleteWorkspaceModal } from '@/components/modals/DeleteWorkspaceModal'
import { InviteMemberModal } from '@/components/modals/InviteMemberModal'
import { AdminWorkspacesView } from '@/components/admin/AdminWorkspacesView'
import { ProfileModal } from '@/components/modals/ProfileModal'
import { RenameModal } from '@/components/modals/RenameModal'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import type { PartialBlock } from '@blocknote/core'

interface Page {
  id: string
  title: string | null
  icon: string | null
  parent_id: string | null
  workspace_id: string
  is_trash: boolean
  is_favorite: boolean
  type: string
}

export function DashboardShell() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string>('ThinkSoul')
  const [userDisplayName, setUserDisplayName] = useState<string>('')
  const [isGroupAdmin, setIsGroupAdmin] = useState(false)
  const [groupAdminGroupIds, setGroupAdminGroupIds] = useState<string[]>([])
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string | null; group_id: string | null }[]>([])
  const [workspaceGroups, setWorkspaceGroups] = useState<{ id: string; name: string }[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [activePage, setActivePage] = useState<{ id: string; title: string; icon: string | null; type: string } | null>(null)
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(undefined)
  const [editorKey, setEditorKey] = useState(0)

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
  const [createWorkspaceGroupId, setCreateWorkspaceGroupId] = useState<string | null>(null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameData, setRenameData] = useState<{ id: string; title: string }>({ id: '', title: '' })
  const [deleteCandidate, setDeleteCandidate] = useState<Page | null>(null)
  const [renameWorkspaceData, setRenameWorkspaceData] = useState<{ id: string; name: string } | null>(null)
  const [deleteWorkspaceData, setDeleteWorkspaceData] = useState<{ id: string; name: string } | null>(null)
  const [inviteWorkspaceData, setInviteWorkspaceData] = useState<{ id: string; name: string } | null>(null)
  const [renameGroupData, setRenameGroupData] = useState<{ id: string; name: string } | null>(null)
  const [deleteGroupData, setDeleteGroupData] = useState<{ id: string; name: string; workspaceCount: number } | null>(null)
  const [inviteGroupAdminData, setInviteGroupAdminData] = useState<{ groupId?: string } | null>(null)

  const [activeView, setActiveView] = useState<'editor' | 'admin-workspaces'>('editor')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const inited = useRef(false)
  const lastLocalBlockSaveRef = useRef<{ pageId: string; content: string } | null>(null)

  const normalizePageRecord = (record: Record<string, unknown>): Page | null => {
    if (typeof record.id !== 'string' || typeof record.workspace_id !== 'string') return null

    return {
      id: record.id,
      title: typeof record.title === 'string' ? record.title : null,
      icon: typeof record.icon === 'string' ? record.icon : null,
      parent_id: typeof record.parent_id === 'string' ? record.parent_id : null,
      workspace_id: record.workspace_id,
      is_trash: Boolean(record.is_trash),
      is_favorite: Boolean(record.is_favorite),
      type: typeof record.type === 'string' ? record.type : 'document'
    }
  }

  const upsertPageState = (page: Page) => {
    setPages(prev => {
      const exists = prev.some(p => p.id === page.id)
      if (page.is_trash) return prev.filter(p => p.id !== page.id)
      return exists ? prev.map(p => p.id === page.id ? page : p) : [...prev, page]
    })

    setActivePage(prev => {
      if (!prev || prev.id !== page.id) return prev
      if (page.is_trash) return null
      return { id: page.id, title: page.title ?? 'Untitled', icon: page.icon, type: page.type }
    })
  }

  // Fetch workspace and pages on mount
  useEffect(() => {
    // Restore the active view first
    const savedActiveView = localStorage.getItem('ts_active_view') as 'editor' | 'admin-workspaces'
    if (savedActiveView) {
      setActiveView(savedActiveView)
    }

    if (!inited.current) {
      inited.current = true

      const loadDemoMode = () => {
        setIsAdmin(true)
        setIsGroupAdmin(true)
        setUserDisplayName('Demo Founder')

        const demoGroups = [
          { id: 'demo-group-1', name: 'Incubation Cohort 2026' }
        ]
        const demoWorkspaces = [
          { id: 'demo-ws-1', name: '🚀 Startup Incubation Cohort 2026', group_id: 'demo-group-1' },
          { id: 'demo-ws-2', name: '💡 AI HealthTech Startup', group_id: 'demo-group-1' }
        ]
        const demoPages: Page[] = [
          { id: 'demo-p-1', title: 'Welcome to ThinkSoul Demo', icon: '🚀', parent_id: null, workspace_id: 'demo-ws-1', is_trash: false, is_favorite: true, type: 'document' },
          { id: 'demo-p-2', title: 'Sprint Kanban Board', icon: '📊', parent_id: null, workspace_id: 'demo-ws-1', is_trash: false, is_favorite: false, type: 'board' },
          { id: 'demo-p-3', title: 'Product Pitch Deck', icon: '💡', parent_id: null, workspace_id: 'demo-ws-2', is_trash: false, is_favorite: false, type: 'document' }
        ]

        setWorkspaceGroups(demoGroups)
        setWorkspaces(demoWorkspaces)
        setWorkspaceId('demo-ws-1')
        setWorkspaceName('🚀 Startup Incubation Cohort 2026')
        setPages(demoPages.filter(p => p.workspace_id === 'demo-ws-1'))
        setActivePage({ id: 'demo-p-1', title: 'Welcome to ThinkSoul Demo', icon: '🚀', type: 'document' })
        setLoading(false)
      }

      const init = async () => {
        try {
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            loadDemoMode()
            return
          }

          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
          const user = session?.user
          
          if (!user) {
            loadDemoMode()
            return
          }

          // Check if admin + get display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, user_role, display_name, full_name')
            .eq('id', user.id)
            .single()

          if (profile?.role === 'admin') {
            setIsAdmin(true)
          }
          setUserDisplayName(profile?.display_name || profile?.full_name || user.email || '')

          // Check if group admin
          const { data: groupAdminsData } = await supabase
            .from('group_admins')
            .select('group_id')
            .eq('user_id', user.id)

          let groupAdminIds: string[] = []
          if (groupAdminsData && groupAdminsData.length > 0) {
            setIsGroupAdmin(true)
            groupAdminIds = groupAdminsData.map(ga => ga.group_id)
            setGroupAdminGroupIds(groupAdminIds)
          }

          // Get user's workspaces and accessible groups
          // For admins: fetch all groups
          // For group admins: fetch only their assigned groups
          // For others: fetch groups they have workspaces in (handled via RLS)
          let groupsQuery = supabase
            .from('workspace_groups')
            .select('id, name')
            .order('name', { ascending: true })

          // If group admin (but not global admin), restrict to their groups
          if (!profile?.role || profile?.role !== 'admin') {
            if (groupAdminIds.length > 0) {
              groupsQuery = groupsQuery.in('id', groupAdminIds)
            }
          }

          // Similarly, filter workspaces for group admins
          let workspacesQuery = supabase
            .from('workspaces')
            .select('id, name, group_id')
            .order('created_at', { ascending: true })

          // If group admin (but not global admin), also filter workspaces  
          // This provides faster query filtering on top of RLS
          if (!profile?.role || profile?.role !== 'admin') {
            if (groupAdminIds.length > 0) {
              workspacesQuery = workspacesQuery.in('group_id', groupAdminIds)
            }
          }

          const [wsResponse, groupsResponse] = await Promise.all([
            workspacesQuery,
            groupsQuery
          ])

          const workspacesData = wsResponse.data
          const wsError = wsResponse.error

          if (groupsResponse.data) {
            setWorkspaceGroups(groupsResponse.data)
          }

          if (wsError) {
            console.error('Workspace fetch error:', wsError)
            setLoading(false)
            return
          }

          if (!workspacesData || workspacesData.length === 0) {
            setLoading(false)
            return
          }

          setWorkspaces(workspacesData)

          // For group admins with no workspaces visible yet,
          // don't try to load pages - just set loading to false
          if (isGroupAdmin && (!workspacesData || workspacesData.length === 0)) {
            setLoading(false)
            return
          }

          // Check localStorage first
          const savedWsId = localStorage.getItem('ts_workspace_id')
          let targetWs = null
          if (savedWsId) {
            targetWs = workspacesData.find(w => w.id === savedWsId)
          }
          
          if (!targetWs) {
            // Prioritize "ThinkSoul Admin" for admins/members who have it
            targetWs = workspacesData.find(w => w.name === 'ThinkSoul Admin') || workspacesData[0]
          }

          setUserId(user.id)
          setWorkspaceId(targetWs.id)
          setWorkspaceName(targetWs.name ?? 'ThinkSoul')

          await loadPagesForWorkspace(targetWs.id)
        } catch (err) {
          console.error('Init error:', err)
        } finally {
          setLoading(false)
        }
      }

      init()
    }

    const wsChannel = supabase.channel('dashboard_workspaces')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setWorkspaces(prev => {
             if (prev.find(w => w.id === payload.new.id)) return prev;
             return [...prev, { id: payload.new.id, name: payload.new.name, group_id: payload.new.group_id ?? null }]
          })
        } else if (payload.eventType === 'DELETE') {
          setWorkspaces(prev => prev.filter(w => w.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setWorkspaces(prev => {
            const updated = prev.map(w => w.id === payload.new.id ? { ...w, name: payload.new.name, group_id: payload.new.group_id ?? w.group_id } : w)
            setWorkspaceId(currentWsId => {
              if (currentWsId === payload.new.id) {
                setWorkspaceName(payload.new.name ?? 'ThinkSoul')
              }
              return currentWsId
            })
            return updated
          })
        }
      })
      .subscribe()

    const fetchDropdownWorkspaces = async () => {
      const { data: workspacesData } = await supabase
        .from('workspaces')
        .select('id, name, group_id')
        .order('created_at', { ascending: true })
      if (workspacesData) {
        setWorkspaces(workspacesData)
        setWorkspaceId(currentWsId => {
          const matchingWs = workspacesData.find(w => w.id === currentWsId)
          if (matchingWs) {
            setWorkspaceName(matchingWs.name)
          }
          return currentWsId
        })
      }
    }
    
    window.addEventListener('dashboard_force_refresh', fetchDropdownWorkspaces)

    return () => {
      supabase.removeChannel(wsChannel)
      window.removeEventListener('dashboard_force_refresh', fetchDropdownWorkspaces)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPagesForWorkspace = async (wsId: string) => {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('id, title, icon, parent_id, workspace_id, is_trash, is_favorite, type')
      .eq('workspace_id', wsId)
      .eq('is_trash', false)
      .order('created_at', { ascending: true })

    if (pageError) {
      console.error('Pages fetch error:', pageError)
    } else if (pageData && pageData.length > 0) {
      setPages(pageData as Page[])
      
      const savedPageId = localStorage.getItem('ts_active_page_id')
      let targetPage = null
      
      if (savedPageId) {
        targetPage = pageData.find(p => p.id === savedPageId)
      }
      
      if (!targetPage) {
        targetPage = pageData.find(p => p.parent_id === null) || pageData[0]
      }
      
      if (targetPage) {
        setActivePage({ id: targetPage.id, title: targetPage.title ?? 'Untitled', icon: targetPage.icon, type: targetPage.type })
      }
    } else if (pageData && pageData.length === 0) {
      const { count } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', wsId)

      if (count === 0) {
        const { data: newPages, error: createError } = await supabase
          .from('pages')
          .insert([
            {
              workspace_id: wsId,
              title: 'Getting Started',
              icon: '👋',
              type: 'document'
            },
            {
              workspace_id: wsId,
              title: 'To-Do List',
              icon: '✅',
              type: 'board'
            }
          ])
          .select('id, title, icon, parent_id, workspace_id, is_trash, is_favorite, type')

        if (newPages && newPages.length > 0 && !createError) {
          setPages(newPages as Page[])
          setActivePage({ id: newPages[0].id, title: 'Getting Started', icon: '👋', type: 'document' })
        } else {
          setPages([])
          setActivePage(null)
        }
      } else {
        setPages([])
        setActivePage(null)
      }
    }
  }

  useEffect(() => {
    if (!workspaceId) return

    const pagesChannel = supabase.channel(`workspace_pages_${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pages', filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = typeof payload.old.id === 'string' ? payload.old.id : null
            if (!deletedId) return

            setPages(prev => prev.filter(p => p.id !== deletedId))
            setActivePage(prev => prev?.id === deletedId ? null : prev)
            return
          }

          const page = normalizePageRecord(payload.new)
          if (!page || page.workspace_id !== workspaceId) return

          upsertPageState(page)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(pagesChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const handleSwitchWorkspace = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId)
    if (!ws) return
    setWorkspaceId(ws.id)
    setWorkspaceName(ws.name ?? 'ThinkSoul')
    localStorage.setItem('ts_workspace_id', ws.id)
    loadPagesForWorkspace(ws.id)
    setActiveView('editor')
    localStorage.setItem('ts_active_view', 'editor')
  }

  const refreshWorkspaceCollections = async () => {
    let workspacesQuery = supabase
      .from('workspaces')
      .select('id, name, group_id')
      .order('created_at', { ascending: true })

    let groupsQuery = supabase
      .from('workspace_groups')
      .select('id, name')
      .order('name', { ascending: true })

    if (!isAdmin && groupAdminGroupIds.length > 0) {
      workspacesQuery = workspacesQuery.in('group_id', groupAdminGroupIds)
      groupsQuery = groupsQuery.in('id', groupAdminGroupIds)
    }

    const [wsResponse, groupsResponse] = await Promise.all([
      workspacesQuery,
      groupsQuery
    ])

    if (groupsResponse.data) {
      setWorkspaceGroups(groupsResponse.data)
    }

    if (wsResponse.data) {
      setWorkspaces(wsResponse.data)
      setWorkspaceId(currentWsId => {
        const matchingWs = wsResponse.data.find(w => w.id === currentWsId)
        if (matchingWs) {
          setWorkspaceName(matchingWs.name ?? 'ThinkSoul')
        }
        return currentWsId
      })
    }

    return wsResponse.data ?? null
  }

  const handleWorkspaceCreated = async (newWsId: string) => {
    setIsCreateWorkspaceOpen(false)
    setCreateWorkspaceGroupId(null)

    const workspacesData = await refreshWorkspaceCollections()
    if (workspacesData) {
      const ws = workspacesData.find(w => w.id === newWsId)
      if (ws && !isAdmin) {
        setWorkspaceId(ws.id)
        setWorkspaceName(ws.name ?? 'ThinkSoul')
        localStorage.setItem('ts_workspace_id', ws.id)
        loadPagesForWorkspace(ws.id)
        setActiveView('editor')
        localStorage.setItem('ts_active_view', 'editor')
      }
    }
  }

  const handleOpenCreateWorkspace = (groupId?: string) => {
    setCreateWorkspaceGroupId(groupId || null)
    setIsCreateWorkspaceOpen(true)
    setSidebarOpen(false)
  }

  const handleCreateGroupCreated = async () => {
    setIsCreateGroupOpen(false)
    toast.success("Group created successfully")
    window.dispatchEvent(new Event('dashboard_force_refresh'))
    window.dispatchEvent(new Event('force_workspace_refresh'))
    await refreshWorkspaceCollections()
  }

  const handleOpenDeleteGroup = (groupId: string) => {
    const group = workspaceGroups.find(g => g.id === groupId)
    if (!group) return

    setDeleteGroupData({
      id: group.id,
      name: group.name,
      workspaceCount: workspaces.filter(ws => ws.group_id === group.id).length
    })
  }

  const handleRenameWorkspaceSubmit = async (newName: string) => {
    if (!renameWorkspaceData) return

    const { error } = await supabase
      .from('workspaces')
      .update({ name: newName })
      .eq('id', renameWorkspaceData.id)

    if (error) {
      toast.error("Failed to rename workspace: " + error.message)
      return
    }

    toast.success("Workspace renamed successfully")
    setWorkspaces(prev => prev.map(w => w.id === renameWorkspaceData.id ? { ...w, name: newName } : w))
    setWorkspaceName(prev => workspaceId === renameWorkspaceData.id ? newName : prev)
    setRenameWorkspaceData(null)
    window.dispatchEvent(new Event('dashboard_force_refresh'))
    window.dispatchEvent(new Event('force_workspace_refresh'))
  }

  const handleDeleteWorkspaceConfirm = async () => {
    if (!deleteWorkspaceData) return

    const deletedWorkspaceId = deleteWorkspaceData.id
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', deletedWorkspaceId)

    if (error) {
      toast.error("Failed to delete workspace: " + error.message)
      return
    }

    toast.success("Workspace deleted successfully")
    setDeleteWorkspaceData(null)
    window.dispatchEvent(new Event('dashboard_force_refresh'))
    window.dispatchEvent(new Event('force_workspace_refresh'))

    const refreshedWorkspaces = await refreshWorkspaceCollections()
    if (workspaceId === deletedWorkspaceId) {
      const nextWorkspace = refreshedWorkspaces?.find(w => w.name === 'ThinkSoul Admin') || refreshedWorkspaces?.[0]

      if (nextWorkspace) {
        setWorkspaceId(nextWorkspace.id)
        setWorkspaceName(nextWorkspace.name ?? 'ThinkSoul')
        localStorage.setItem('ts_workspace_id', nextWorkspace.id)
        await loadPagesForWorkspace(nextWorkspace.id)
      } else {
        setWorkspaceId(null)
        setWorkspaceName('ThinkSoul')
        setPages([])
        setActivePage(null)
        localStorage.removeItem('ts_workspace_id')
        localStorage.removeItem('ts_active_page_id')
      }
    }
  }

  const handleRenameGroupSubmit = async (newName: string) => {
    if (!renameGroupData) return

    const { error } = await supabase
      .from('workspace_groups')
      .update({ name: newName })
      .eq('id', renameGroupData.id)

    if (error) {
      toast.error("Failed to rename group: " + error.message)
      throw new Error(error.message)
    }

    toast.success("Group renamed successfully")
    setRenameGroupData(null)
    window.dispatchEvent(new Event('dashboard_force_refresh'))
    window.dispatchEvent(new Event('force_workspace_refresh'))
    await refreshWorkspaceCollections()
  }

  const handleDeleteGroupConfirm = async () => {
    if (!deleteGroupData) return

    const deletesActiveWorkspace = workspaces.some(
      ws => ws.group_id === deleteGroupData.id && ws.id === workspaceId
    )

    if (deleteGroupData.workspaceCount > 0) {
      const { error: workspaceDeleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('group_id', deleteGroupData.id)

      if (workspaceDeleteError) {
        toast.error("Failed to delete group workspaces: " + workspaceDeleteError.message)
        throw new Error(workspaceDeleteError.message)
      }
    }

    const { error } = await supabase
      .from('workspace_groups')
      .delete()
      .eq('id', deleteGroupData.id)

    if (error) {
      toast.error("Failed to delete group: " + error.message)
      throw new Error(error.message)
    }

    toast.success("Group deleted successfully")
    setDeleteGroupData(null)
    window.dispatchEvent(new Event('dashboard_force_refresh'))
    window.dispatchEvent(new Event('force_workspace_refresh'))
    const refreshedWorkspaces = await refreshWorkspaceCollections()

    if (deletesActiveWorkspace) {
      const nextWorkspace = refreshedWorkspaces?.find(w => w.name === 'ThinkSoul Admin') || refreshedWorkspaces?.[0]

      if (nextWorkspace) {
        setWorkspaceId(nextWorkspace.id)
        setWorkspaceName(nextWorkspace.name ?? 'ThinkSoul')
        localStorage.setItem('ts_workspace_id', nextWorkspace.id)
        await loadPagesForWorkspace(nextWorkspace.id)
      } else {
        setWorkspaceId(null)
        setWorkspaceName('ThinkSoul')
        setPages([])
        setActivePage(null)
        localStorage.removeItem('ts_workspace_id')
        localStorage.removeItem('ts_active_page_id')
      }
    }
  }

  // Load page content
  useEffect(() => {
    if (!activePage) {
      setInitialContent(undefined)
      return
    }

    const loadContent = async () => {
      const { data } = await supabase
        .from('blocks')
        .select('content')
        .eq('page_id', activePage.id)
        .maybeSingle()

      if (data?.content) {
        setInitialContent(data.content as PartialBlock[])
      } else {
        setInitialContent(undefined)
      }
      setEditorKey(prev => prev + 1)
    }

    loadContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage?.id])

  useEffect(() => {
    if (!activePage?.id || activePage.type === 'board') return

    const blocksChannel = supabase.channel(`page_blocks_${activePage.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocks', filter: `page_id=eq.${activePage.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setInitialContent(undefined)
            setEditorKey(prev => prev + 1)
            return
          }

          const content = payload.new.content as PartialBlock[] | undefined
          if (!content) return

          const contentString = JSON.stringify(content)
          const lastLocalSave = lastLocalBlockSaveRef.current
          if (lastLocalSave?.pageId === activePage.id && lastLocalSave.content === contentString) {
            lastLocalBlockSaveRef.current = null
            return
          }

          setInitialContent(content)
          setEditorKey(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(blocksChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage?.id, activePage?.type])

  // Handlers
  const handleCreatePage = useCallback(async (parentId: string | null = null, type: string = 'document') => {
    if (!workspaceId) return

    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        parent_id: parentId,
        title: type === 'board' ? 'New Board' : 'Untitled',
        icon: null,
        type: type
      })
      .select('id, title, icon, parent_id, workspace_id, is_trash, is_favorite, type')
      .single()

    if (error || !data) return

    setPages(prev => [...prev, data as Page])
    setActivePage({ id: data.id, title: data.title ?? 'Untitled', icon: data.icon, type: data.type })
    localStorage.setItem('ts_active_page_id', data.id)
    setActiveView('editor')
    localStorage.setItem('ts_active_view', 'editor')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const handleDeletePage = useCallback((page: Page) => {
    setDeleteCandidate(page)
    setIsDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async (permanent: boolean) => {
    if (!deleteCandidate) return

    if (permanent) {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', deleteCandidate.id)

      if (!error) {
        setPages(prev => prev.filter(p => p.id !== deleteCandidate.id))
        if (activePage?.id === deleteCandidate.id) setActivePage(null)
      }
    } else {
      const { error } = await supabase
        .from('pages')
        .update({ is_trash: true })
        .eq('id', deleteCandidate.id)

      if (!error) {
        setPages(prev => prev.filter(p => p.id !== deleteCandidate.id))
        if (activePage?.id === deleteCandidate.id) setActivePage(null)
      }
    }

    setIsDeleteConfirmOpen(false)
    setDeleteCandidate(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteCandidate, activePage?.id])

  const handleRestorePage = useCallback(async (pageId: string) => {
    const { data: restoredPage, error } = await supabase
      .from('pages')
      .update({ is_trash: false })
      .eq('id', pageId)
      .select('*')
      .single()

    if (!error && restoredPage) {
      setPages(prev => [...prev, restoredPage as Page])
      // Optionally switch to restored page
      setActivePage({ id: restoredPage.id, title: restoredPage.title ?? 'Untitled', icon: restoredPage.icon, type: restoredPage.type })
      localStorage.setItem('ts_active_page_id', restoredPage.id)
      setActiveView('editor')
      localStorage.setItem('ts_active_view', 'editor')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePermanentDelete = useCallback(async (pageId: string) => {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (!error) {
      // If by some chance the user is on this page (shouldn't happen with trash open)
      if (activePage?.id === pageId) setActivePage(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage?.id])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleSaveContent = useCallback(async (pageId: string, content: PartialBlock[]) => {
    lastLocalBlockSaveRef.current = { pageId, content: JSON.stringify(content) }

    await supabase
      .from('blocks')
      .upsert({ page_id: pageId, content }, { onConflict: 'page_id' })
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTitleChange = useCallback(async (pageId: string, newTitle: string) => {
    await supabase
      .from('pages')
      .update({ title: newTitle })
      .eq('id', pageId)

    setPages(prev => prev.map(p => p.id === pageId ? { ...p, title: newTitle } : p))
    setActivePage(prev => prev?.id === pageId ? { ...prev, title: newTitle } : prev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenRename = useCallback((id: string, title: string) => {
    setRenameData({ id, title })
    setIsRenameOpen(true)
  }, [])

  const handleToggleFavorite = useCallback(async (pageId: string, status: boolean) => {
    const { error } = await supabase
      .from('pages')
      .update({ is_favorite: status })
      .eq('id', pageId)

    if (!error) {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, is_favorite: status } : p))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDuplicatePage = useCallback(async (pageId: string) => {
    // 1. Get original page
    const { data: originalPage } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (!originalPage) return

    // 2. Create new page
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        workspace_id: originalPage.workspace_id,
        parent_id: originalPage.parent_id,
        title: `${originalPage.title} (Copy)`,
        icon: originalPage.icon,
        type: originalPage.type || 'document'
      })
      .select('*')
      .single()

    if (createError || !newPage) return

    // 3. Copy blocks
    const { data: blocks } = await supabase
      .from('blocks')
      .select('content')
      .eq('page_id', pageId)
      .maybeSingle()

    if (blocks?.content) {
      await supabase
        .from('blocks')
        .insert({
          page_id: newPage.id,
          content: blocks.content
        })
    }

    // 4. Update UI
    setPages(prev => [...prev, newPage as Page])
    setActivePage({ id: newPage.id, title: newPage.title ?? 'Untitled', icon: newPage.icon, type: newPage.type ?? 'document' })
    localStorage.setItem('ts_active_page_id', newPage.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f2f3f5]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#9ca3af]" />
          <span className="text-[12px] font-semibold text-[#9ca3af] tracking-widest">LOADING</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        userDisplayName={userDisplayName}
        workspaces={workspaces}
        workspaceGroups={workspaceGroups}
        isAdmin={isAdmin}
        isGroupAdmin={isGroupAdmin}
        groupAdminGroupIds={groupAdminGroupIds}
        onSwitchWorkspace={handleSwitchWorkspace}
        onOpenCreateWorkspace={handleOpenCreateWorkspace}
        onOpenCreateGroup={() => { setIsCreateGroupOpen(true); setSidebarOpen(false) }}
        onOpenAdminWorkspaces={() => { 
          setActiveView('admin-workspaces'); 
          localStorage.setItem('ts_active_view', 'admin-workspaces');
          setSidebarOpen(false) 
        }}
        onRenameGroup={(groupId, currentName) => setRenameGroupData({ id: groupId, name: currentName })}
        onDeleteGroup={handleOpenDeleteGroup}
        onInviteGroupAdmin={(groupId) => setInviteGroupAdminData({ groupId })}
        onRenameWorkspace={(wsId, currentName) => setRenameWorkspaceData({ id: wsId, name: currentName || 'Untitled Workspace' })}
        onDeleteWorkspace={(wsId) => {
          const ws = workspaces.find(w => w.id === wsId)
          if (ws) setDeleteWorkspaceData({ id: ws.id, name: ws.name || 'Untitled Workspace' })
        }}
        onInviteWorkspaceMember={(wsId) => {
          const ws = workspaces.find(w => w.id === wsId)
          if (ws) setInviteWorkspaceData({ id: ws.id, name: ws.name || 'Untitled Workspace' })
        }}
        activePageId={activePage?.id ?? null}
        activeView={activeView}
        onPageSelect={(page) => {
          setActivePage({ id: page.id, title: page.title || 'Untitled', icon: page.icon, type: page.type || 'document' })
          localStorage.setItem('ts_active_page_id', page.id)
          setActiveView('editor')
          localStorage.setItem('ts_active_view', 'editor')
          setSidebarOpen(false)
        }}
        pages={pages}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onToggleFavorite={handleToggleFavorite}
        onRenamePage={handleOpenRename}
        onDuplicatePage={handleDuplicatePage}
        onLogout={handleLogout}
        onOpenTrash={() => setIsTrashOpen(true)}
        onOpenSettings={() => { setIsSettingsOpen(true); setSidebarOpen(false) }}
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {isSettingsOpen && workspaceId && userId && (
        <SettingsModal
          workspaceId={workspaceId}
          userId={userId}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
          onWorkspaceUpdated={(newName) => {
            setWorkspaceName(newName)
            // Optionally, update the list 
            setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name: newName } : w))
          }}
        />
      )}

      {isCreateWorkspaceOpen && (
        <CreateWorkspaceModal
          onClose={() => { setIsCreateWorkspaceOpen(false); setCreateWorkspaceGroupId(null) }}
          onWorkspaceCreated={handleWorkspaceCreated}
          groupId={createWorkspaceGroupId}
        />
      )}

      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onGroupCreated={handleCreateGroupCreated}
        />
      )}

      {renameWorkspaceData && (
        <RenameWorkspaceModal
          initialName={renameWorkspaceData.name}
          onClose={() => setRenameWorkspaceData(null)}
          onSubmit={handleRenameWorkspaceSubmit}
        />
      )}

      {deleteWorkspaceData && (
        <DeleteWorkspaceModal
          workspaceName={deleteWorkspaceData.name}
          onClose={() => setDeleteWorkspaceData(null)}
          onConfirm={handleDeleteWorkspaceConfirm}
        />
      )}

      {inviteWorkspaceData && (
        <InviteMemberModal
          workspaceId={inviteWorkspaceData.id}
          workspaceName={inviteWorkspaceData.name}
          onClose={() => setInviteWorkspaceData(null)}
        />
      )}

      {renameGroupData && (
        <RenameGroupModal
          initialName={renameGroupData.name}
          onClose={() => setRenameGroupData(null)}
          onSubmit={handleRenameGroupSubmit}
        />
      )}

      {deleteGroupData && (
        <DeleteGroupModal
          groupName={deleteGroupData.name}
          workspaceCount={deleteGroupData.workspaceCount}
          onClose={() => setDeleteGroupData(null)}
          onConfirm={handleDeleteGroupConfirm}
        />
      )}

      {inviteGroupAdminData && (
        <InviteGroupAdminModal
          preselectedGroupId={inviteGroupAdminData.groupId}
          onClose={() => setInviteGroupAdminData(null)}
        />
      )}

      {isDeleteConfirmOpen && deleteCandidate && (
        <DeleteConfirmModal
          pageTitle={deleteCandidate.title ?? 'Untitled'}
          onCancel={() => {
            setIsDeleteConfirmOpen(false)
            setDeleteCandidate(null)
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {isTrashOpen && workspaceId && (
        <TrashModal
          workspaceId={workspaceId}
          onClose={() => setIsTrashOpen(false)}
          onRestore={handleRestorePage}
          onPermanentDelete={handlePermanentDelete}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden relative">
        <Topbar
          pageName={activePage?.title || ''}
          pageIcon={activePage?.icon || null}
          workspaceName={workspaceName}
          userDisplayName={userDisplayName}
          isAdmin={isAdmin}
          onOpenProfile={() => setIsProfileOpen(true)}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          {activeView === 'admin-workspaces' ? (
            <AdminWorkspacesView
              isAdmin={isAdmin}
              isGroupAdmin={isGroupAdmin}
              groupAdminGroupIds={groupAdminGroupIds}
              onSwitchWorkspace={handleSwitchWorkspace}
              onOpenCreateWorkspace={handleOpenCreateWorkspace}
            />
          ) : activePage ? (
            activePage.type === 'board' ? (
              <KanbanBoard 
                key={editorKey}
                pageId={activePage.id} 
              />
            ) : (
              <PageEditor
                key={editorKey}
                pageId={activePage.id}
                pageTitle={activePage.title}
                pageIcon={activePage.icon}
                initialContent={initialContent}
                onSave={handleSaveContent}
                onTitleChange={handleTitleChange}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full gray-bg">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e7eb] flex items-center justify-center mb-5 shadow-sm">
                <img src="/assets/ThinkSoul.jpg" alt="TS" className="w-7 h-7 object-contain" />
              </div>
              <h2 className="text-lg font-semibold text-[#1f1f1f] mb-2">Welcome to ThinkSoul</h2>
              <p className="text-[#5f6368] text-[13px] max-w-sm leading-relaxed px-6">
                Select or create a page in the sidebar to get started.
              </p>
            </div>
          )}
        </main>
      </div>

      {isProfileOpen && userId && (
        <ProfileModal
          userId={userId}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isRenameOpen && (
        <RenameModal 
          initialTitle={renameData.title}
          onClose={() => setIsRenameOpen(false)}
          onConfirm={async (newTitle) => {
            await handleTitleChange(renameData.id, newTitle)
          }}
        />
      )}
    </div>
  )
}
