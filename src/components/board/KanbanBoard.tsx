'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Calendar, 
  Layout, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Pencil, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronDown,
  BarChart3,
  Paperclip,
  ImageIcon,
  Kanban,
  X,
  BarChart2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { TaskModal } from '@/components/modals/TaskModal'
import { CalendarView } from './CalendarView'
import { ChartsView } from './ChartsView'
import { format } from 'date-fns'

interface KanbanColumn {
  id: string
  title: string
  color: string | null
  position: number
}

interface KanbanTask {
  id: string
  column_id: string
  page_id: string
  title: string
  progress: number
  due_date: string | null
  content: string | null
  position: number
  custom_properties?: Record<string, any>
}

interface ViewTab {
  id: string
  page_id: string
  name: string
  type: 'kanban' | 'calendar' | 'chart'
  position: number
}

interface KanbanBoardProps {
  pageId: string
}

export function KanbanBoard({ pageId }: KanbanBoardProps) {
  const supabase = createClient()
  
  const fetcher = async () => {
    const [colsRes, tasksRes, viewsRes] = await Promise.all([
      supabase.from('kanban_columns').select('*').eq('page_id', pageId).order('position'),
      supabase.from('kanban_tasks').select('*').eq('page_id', pageId).order('position'),
      supabase.from('page_views').select('*').eq('page_id', pageId).order('position')
    ])
    return {
      columns: colsRes.data || [],
      tasks: tasksRes.data || [],
      tabs: viewsRes.data || []
    }
  }

  const { data, mutate, isLoading } = useSWR(`board-${pageId}`, fetcher, {
    revalidateOnFocus: false
  })

  const columns = data?.columns || []
  const tasks = data?.tasks || []
  const tabs = data?.tabs || []
  const loading = !data && isLoading

  const setColumns = (updater: KanbanColumn[] | ((prev: KanbanColumn[]) => KanbanColumn[])) => mutate(curr => ({ ...curr!, columns: typeof updater === 'function' ? updater(curr!.columns) : updater }), false)
  const setTasks = (updater: KanbanTask[] | ((prev: KanbanTask[]) => KanbanTask[])) => mutate(curr => ({ ...curr!, tasks: typeof updater === 'function' ? updater(curr!.tasks) : updater }), false)
  const setTabs = (updater: ViewTab[] | ((prev: ViewTab[]) => ViewTab[])) => mutate(curr => ({ ...curr!, tabs: typeof updater === 'function' ? updater(curr!.tabs) : updater }), false)

  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [isDeletingColId, setIsDeletingColId] = useState<string | null>(null)
  const [isDeletingTaskId, setIsDeletingTaskId] = useState<string | null>(null)
  
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isAddingView, setIsAddingView] = useState(false)
  const [tabToDelete, setTabToDelete] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const activeTab = tabs.find(t => t.id === activeTabId)
  const viewType = activeTab?.type || 'kanban'

  useEffect(() => {
    if (tabs.length > 0 && (!activeTabId || !tabs.find(t => t.id === activeTabId))) {
      setActiveTabId(tabs[0].id)
    }
  }, [tabs, activeTabId])

  const handleCreateView = async (type: 'kanban' | 'calendar' | 'chart') => {
    const name = type === 'kanban' ? 'Board' : type === 'calendar' ? 'Calendar' : 'Charts'
    const newPosition = tabs.length

    const { data, error } = await supabase
      .from('page_views')
      .insert({
        page_id: pageId,
        name: name,
        type: type,
        position: newPosition
      })
      .select()
      .single()

    if (data && !error) {
      setTabs(prev => [...prev, data])
      setActiveTabId(data.id)
      setIsAddingView(false)
    }
  }

  const handleDeleteView = async (tabId: string) => {
    // Optimistic UI update
    const remainingTabs = tabs.filter(t => t.id !== tabId)
    setTabs(remainingTabs)
    
    // Fallback to the first available tab if active was deleted
    if (activeTabId === tabId && remainingTabs.length > 0) {
      setActiveTabId(remainingTabs[0].id)
    }

    setTabToDelete(null)

    // Delete from DB asynchronously
    await supabase.from('page_views').delete().eq('id', tabId)
  }

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result
    
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (type === 'column') {
      const newCols = Array.from(columns)
      const [removed] = newCols.splice(source.index, 1)
      newCols.splice(destination.index, 0, removed)
      
      const updatedCols = newCols.map((col, index) => ({ ...col, position: index }))
      setColumns(updatedCols)

      // Sync with DB
      const updates = updatedCols.map(c => ({ id: c.id, page_id: pageId, title: c.title, color: c.color, position: c.position }))
      await supabase.from('kanban_columns').upsert(updates)
      return
    }

    if (type === 'task') {
      const sourceCol = source.droppableId
      const destCol = destination.droppableId
      
      const newTasks = Array.from(tasks)
      const taskIndex = newTasks.findIndex(t => t.id === draggableId)
      const task = newTasks[taskIndex]
      
      if (sourceCol === destCol) {
        const colTasks = newTasks.filter(t => t.column_id === sourceCol)
        colTasks.splice(source.index, 1)
        colTasks.splice(destination.index, 0, task)
        const updatedColTasks = colTasks.map((t, i) => ({ ...t, position: i }))
        
        setTasks(prev => prev.map(p => updatedColTasks.find(u => u.id === p.id) || p))
        await supabase.from('kanban_tasks').upsert(updatedColTasks.map(t => ({ id: t.id, page_id: pageId, column_id: t.column_id, position: t.position, title: t.title })))
      } else {
        const sourceTasks = newTasks.filter(t => t.column_id === sourceCol)
        const destTasks = newTasks.filter(t => t.column_id === destCol)
        
        sourceTasks.splice(source.index, 1)
        task.column_id = destCol
        destTasks.splice(destination.index, 0, task)
        
        const updatedSource = sourceTasks.map((t, i) => ({ ...t, position: i }))
        const updatedDest = destTasks.map((t, i) => ({ ...t, position: i }))
        
        setTasks(prev => prev.map(p => {
          const s = updatedSource.find(u => u.id === p.id)
          if (s) return s
          const d = updatedDest.find(u => u.id === p.id)
          if (d) return d
          return p
        }))
        
        await supabase.from('kanban_tasks').upsert([
          ...updatedSource.map(t => ({ id: t.id, page_id: pageId, column_id: t.column_id, position: t.position, title: t.title })),
          ...updatedDest.map(t => ({ id: t.id, page_id: pageId, column_id: t.column_id, position: t.position, title: t.title }))
        ])
      }
    }
  }

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) {
      setIsAddingColumn(false)
      return
    }

    const { data } = await supabase
      .from('kanban_columns')
      .insert({
        page_id: pageId,
        title: newColTitle,
        color: 'gray',
        position: columns.length
      })
      .select()
      .single()

    if (data) {
      setColumns([...columns, data])
      setIsAddingColumn(false)
      setNewColTitle('')
    }
  }

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingColId(null)
      return
    }
    const { data } = await supabase
      .from('kanban_columns')
      .update({ title: newTitle })
      .eq('id', columnId)
      .select()
      .single()
      
    if (data) {
      setColumns(cols => cols.map(c => c.id === columnId ? data : c))
    }
    setEditingColId(null)
  }

  const handleAddTask = async (columnId: string, dueDate?: Date) => {
    const colTasks = tasks.filter(t => t.column_id === columnId)
    const { data } = await supabase
      .from('kanban_tasks')
      .insert({
        page_id: pageId,
        column_id: columnId,
        title: 'New Task',
        progress: 0,
        position: colTasks.length,
        due_date: dueDate ? dueDate.toISOString() : null
      })
      .select()
      .single()

    if (data) {
      setTasks([...tasks, data])
      setSelectedTask(data)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    await supabase.from('kanban_columns').delete().eq('id', columnId)
    await supabase.from('kanban_tasks').delete().eq('column_id', columnId)
    setColumns(cols => cols.filter(c => c.id !== columnId))
    setTasks(ts => ts.filter(t => t.column_id !== columnId))
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId)
    if (!error) {
      setTasks(ts => ts.filter(t => t.id !== taskId))
    }
    setIsDeletingTaskId(null)
  }

  const handleMoveTask = async (taskId: string, targetColumnId: string) => {
    const destTasks = tasks.filter(t => t.column_id === targetColumnId)
    const newPosition = destTasks.length > 0 ? Math.max(...destTasks.map(t => t.position)) + 1024 : 1024
    
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, column_id: targetColumnId, position: newPosition } : t))
    
    await supabase
      .from('kanban_tasks')
      .update({ column_id: targetColumnId, position: newPosition })
      .eq('id', taskId)
  }

  const handleEditTaskTitle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTaskId(taskId)
  }

  const handleUpdateTaskTitle = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingTaskId(null)
      return
    }
    const { data } = await supabase
      .from('kanban_tasks')
      .update({ title: newTitle })
      .eq('id', taskId)
      .select()
      .single()
    
    if (data) {
      setTasks(ts => ts.map(t => t.id === taskId ? data : t))
    }
    setEditingTaskId(null)
  }

  const handleApplyTemplate = async (template: string) => {
    if (template === 'kanban') {
      const defaultCols = [
        { title: 'To Do', color: '#e8f0fe', position: 0 },
        { title: 'Doing', color: '#fef3c7', position: 1 },
        { title: 'In Review', color: '#ede9fe', position: 2 },
        { title: 'Done', color: '#dcfce7', position: 3 }
      ]
      
      const { data: createdCols } = await supabase
        .from('kanban_columns')
        .insert(defaultCols.map(c => ({ ...c, page_id: pageId })))
        .select()

      const { data: createdView } = await supabase
        .from('page_views')
        .insert({
          page_id: pageId,
          name: 'Board',
          type: 'kanban',
          position: 0
        })
        .select()
        .single()

      if (createdCols) setColumns(createdCols)
      if (createdView) {
        setTabs([createdView])
        setActiveTabId(createdView.id)
      }
    } else if (template === 'calendar') {
      const { data: defaultCol } = await supabase
        .from('kanban_columns')
        .insert({ title: 'Tasks', color: '#f3e8ff', position: 0, page_id: pageId })
        .select()
        .single()

      const { data: createdView } = await supabase
        .from('page_views')
        .insert({
          page_id: pageId,
          name: 'Calendar',
          type: 'calendar',
          position: 0
        })
        .select()
        .single()
      
      if (defaultCol) setColumns([defaultCol])
      if (createdView) {
        setTabs([createdView])
        setActiveTabId(createdView.id)
      }
    } else if (template === 'chart') {
      const { data: createdView } = await supabase
        .from('page_views')
        .insert({
          page_id: pageId,
          name: 'Charts',
          type: 'chart',
          position: 0
        })
        .select()
        .single()
      
      if (createdView) {
        setTabs([createdView])
        setActiveTabId(createdView.id)
      }
    }
  }

  if (loading) return null

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col pt-4 md:pt-6 px-4 md:px-12 bg-white">


      {tabs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <div className="w-[100px] h-[100px] mb-8 bg-[#f8f9fa] rounded-full flex items-center justify-center border-4 border-[#f3f4f6]">
             <Kanban className="w-10 h-10 text-[#d1d5db]" />
          </div>
          <h2 className="text-[22px] font-bold text-[#1f1f1f] tracking-tight mb-2">Create a new view</h2>
          <p className="text-[14px] font-medium text-[#9ca3af] mb-10 max-w-[320px] text-center leading-relaxed">
            Organize your team's tasks with our pre-built templates or start fresh.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-full">
             <button 
               onClick={() => handleApplyTemplate('kanban')} 
               className="flex flex-col items-center justify-center gap-3 w-[140px] h-[140px] bg-white border-2 border-[#e5e7eb] rounded-2xl shadow-[4px_4px_0_0_#e4e4e7] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_#e4e4e7] active:translate-y-[0] active:translate-x-[0] active:shadow-none transition-all cursor-pointer group"
             >
                <div className="w-12 h-12 bg-[#e8f0fe] text-[#1a73e8] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Kanban className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold text-[#37352f]">Kanban Board</span>
             </button>

             <button 
               onClick={() => handleApplyTemplate('calendar')} 
               className="flex flex-col items-center justify-center gap-3 w-[140px] h-[140px] bg-white border-2 border-[#e5e7eb] rounded-2xl shadow-[4px_4px_0_0_#e4e4e7] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_#e4e4e7] active:translate-y-[0] active:translate-x-[0] active:shadow-none transition-all cursor-pointer group"
             >
                <div className="w-12 h-12 bg-[#f3e8ff] text-[#9333ea] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold text-[#37352f]">Calendar</span>
             </button>

             <button 
               onClick={() => handleApplyTemplate('chart')} 
               className="flex flex-col items-center justify-center gap-3 w-[140px] h-[140px] bg-white border-2 border-[#e5e7eb] rounded-2xl shadow-[4px_4px_0_0_#e4e4e7] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0_0_#e4e4e7] active:translate-y-[0] active:translate-x-[0] active:shadow-none transition-all cursor-pointer group"
             >
                <div className="w-12 h-12 bg-[#ecfdf5] text-[#10b981] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <BarChart2 className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold text-[#37352f]">Charts</span>
             </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="relative z-[40] flex flex-wrap items-center gap-1 p-2 md:p-4 border-b border-[#e5e7eb] bg-white/50 backdrop-blur-md active:cursor-grabbing">
            {tabs.map((tab) => (
              <div key={tab.id} className="relative group/tab flex items-center">
                <button 
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-l-lg text-[13px] font-bold transition-all shrink-0 ${
                    activeTabId === tab.id 
                    ? 'bg-[#e8f0fe] text-[#1a73e8] shadow-sm rounded-r-none' 
                    : 'text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#37352f] rounded-r-lg'
                  }`}
                >
                  {tab.type === 'kanban' ? <Kanban className="w-4 h-4" /> : tab.type === 'calendar' ? <Calendar className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
                  {tab.name}
                </button>
                
                {tabs.length > 1 && (
                  <button
                    onClick={() => setTabToDelete(tab.id)}
                    className={`p-1.5 rounded-r-lg border-l border-transparent hover:bg-red-50 hover:text-red-600 transition-colors ${
                      activeTabId === tab.id 
                      ? 'bg-[#e8f0fe] text-[#1a73e8] border-l-[#d2e3fc]' 
                      : 'text-[#9ca3af] bg-transparent'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {tabToDelete === tab.id && (
                  <>
                    <div className="fixed inset-0 z-[60]" onPointerDown={(e) => { e.stopPropagation(); setTabToDelete(null); }}></div>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-red-100 shadow-xl rounded-lg p-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mb-2 text-center">Delete View?</p>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleDeleteView(tab.id)}
                          className="w-full py-1.5 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700 transition-colors"
                        >Delete</button>
                        <button 
                          onClick={() => setTabToDelete(null)}
                          className="w-full py-1.5 text-zinc-400 text-[11px] font-bold hover:bg-zinc-50 rounded transition-colors"
                        >Cancel</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Smart Add View Button */}
            {(() => {
              const hasKanban = tabs.some(t => t.type === 'kanban')
              const hasCalendar = tabs.some(t => t.type === 'calendar')
              const hasChart = tabs.some(t => t.type === 'chart')
              const canAdd = !hasKanban || !hasCalendar || !hasChart

              if (!canAdd) return null

              return (
                <div className="relative">
                  <button 
                    onClick={() => setIsAddingView(!isAddingView)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#37352f] transition-all"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${isAddingView ? 'rotate-45' : ''}`} />
                  </button>

                  {isAddingView && (
                    <>
                      <div className="fixed inset-0 z-40" onPointerDown={() => setIsAddingView(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e5e7eb] shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <p className="px-3 py-2 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Add View</p>
                        
                        {!hasKanban && (
                          <button 
                            onClick={() => handleCreateView('kanban')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-[#37352f] hover:bg-[#f3f4f6] rounded-lg transition-colors group"
                          >
                            <div className="w-8 h-8 bg-[#e8f0fe] text-[#1a73e8] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Kanban className="w-4 h-4" />
                            </div>
                            Board
                          </button>
                        )}
                        
                        {!hasCalendar && (
                          <button 
                            onClick={() => handleCreateView('calendar')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-[#37352f] hover:bg-[#f3f4f6] rounded-lg transition-colors group"
                          >
                            <div className="w-8 h-8 bg-[#f3e8ff] text-[#9333ea] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Calendar className="w-4 h-4" />
                            </div>
                            Calendar
                          </button>
                        )}
                        
                        {!hasChart && (
                          <button 
                            onClick={() => handleCreateView('chart')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-[#37352f] hover:bg-[#f3f4f6] rounded-lg transition-colors group"
                          >
                            <div className="w-8 h-8 bg-[#ecfdf5] text-[#10b981] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BarChart2 className="w-4 h-4" />
                            </div>
                            Charts
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="flex-1 overflow-auto p-4 min-h-0">
            {viewType === 'kanban' ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="board" type="column" direction="horizontal">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex gap-6 h-full items-start"
                    >
                      {columns.map((col, colIndex) => (
                        <Draggable key={col.id} draggableId={col.id} index={colIndex} isDragDisabled={isMobile}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="w-[300px] shrink-0 flex flex-col max-h-full group bg-[#f8f9fa] border border-[#f3f4f6] rounded-xl p-2.5 pb-3"
                            >
                              <div {...provided.dragHandleProps} className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-3 min-w-0">
                                  {editingColId === col.id ? (
                                    <input
                                      autoFocus
                                      className="text-[13px] font-bold text-[#37352f] bg-[#f3f4f6] border-none focus:ring-0 p-1 rounded outline-none w-full"
                                      defaultValue={col.title}
                                      onBlur={(e) => handleUpdateColumnTitle(col.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateColumnTitle(col.id, e.currentTarget.value)
                                        if (e.key === 'Escape') setEditingColId(null)
                                      }}
                                    />
                                  ) : (
                                    <div className={`px-2 py-0.5 rounded text-[12px] font-medium flex items-center gap-2 cursor-pointer hover:bg-black/5 transition-colors ${
                                      col.title.toLowerCase().trim() === 'done' ? 'bg-green-100 text-green-700' :
                                      col.title.toLowerCase().trim() === 'doing' ? 'bg-yellow-100 text-yellow-700' :
                                      col.title.toLowerCase().replace(/\s+/g,'') === 'todo' ? 'bg-blue-100 text-blue-700' :
                                      'bg-purple-100 text-purple-700'
                                    }`}
                                    onClick={() => setEditingColId(col.id)}
                                    >
                                      {col.title}
                                    </div>
                                  )}
                                  <span className="text-[12px] font-bold text-[#d1d5db]">
                                    {tasks.filter(t => t.column_id === col.id).length}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                  <div className="relative">
                                    {isDeletingColId === col.id ? (
                                      <>
                                        <div className="fixed inset-0 z-[60]" onPointerDown={(e) => { e.stopPropagation(); setIsDeletingColId(null); }}></div>
                                        <div className="absolute top-full right-0 mt-2 w-36 bg-white border border-red-100 shadow-xl rounded-lg p-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mb-2 text-center">Delete Group?</p>
                                          <div className="flex flex-col gap-1">
                                            <button 
                                              onClick={() => {
                                                handleDeleteColumn(col.id)
                                                setIsDeletingColId(null)
                                              }}
                                              className="w-full py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-md hover:bg-red-700 transition-colors"
                                            >Delete</button>
                                            <button 
                                              onClick={() => setIsDeletingColId(null)}
                                              className="w-full py-1.5 text-zinc-400 text-[11px] font-bold hover:bg-zinc-50 rounded-md transition-colors"
                                            >Cancel</button>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <button 
                                        onClick={() => setIsDeletingColId(col.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] text-[#9ca3af] transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => handleAddTask(col.id)}
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f3f4f6] text-[#9ca3af]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <Droppable droppableId={col.id} type="task">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex flex-col gap-2 min-h-[100px] h-full"
                                  >
                                    {tasks
                                      .filter(t => t.column_id === col.id)
                                      .sort((a, b) => a.position - b.position)
                                      .map((task, taskIndex) => (
                                        <Draggable key={task.id} draggableId={task.id} index={taskIndex} isDragDisabled={isMobile}>
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group/task relative"
                                              onClick={() => setSelectedTask(task)}
                                            >
                                              {/* Attachment Thumbnail */}
                                              {task.custom_properties?.attachments?.[0] && task.custom_properties.attachments[0].match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                                                <div className="w-full h-32 overflow-hidden border-b border-[#f3f4f6] rounded-t-xl">
                                                  <img 
                                                    src={task.custom_properties.attachments[0]} 
                                                    alt="Task cover" 
                                                    className="w-full h-full object-cover group-hover/task:scale-105 transition-transform duration-500"
                                                  />
                                                </div>
                                              )}
                                              {editingTaskId === task.id ? (
                                                <div className="p-2">
                                                  <input
                                                    autoFocus
                                                    className="w-full text-[13px] text-[#37352f] bg-[#f9fafb] border-none focus:ring-0 p-1 rounded outline-none"
                                                    defaultValue={task.title}
                                                    onBlur={(e) => handleUpdateTaskTitle(task.id, e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') handleUpdateTaskTitle(task.id, e.currentTarget.value)
                                                      if (e.key === 'Escape') setEditingTaskId(null)
                                                    }}
                                                  />
                                                </div>
                                              ) : (
                                                <>
                                                  <div 
                                                    className="p-2 flex items-start justify-between gap-1.5"
                                                  >
                                                    <p className="text-[13px] text-[#37352f] leading-snug flex-1 font-medium">
                                                      {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                      <button 
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleEditTaskTitle(task.id, e)
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#37352f] transition-colors"
                                                      >
                                                        <Pencil className="w-4 h-4" />
                                                      </button>
                                                      <div className="relative">
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            setIsDeletingTaskId(task.id)
                                                          }}
                                                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-[#9ca3af] hover:text-red-600 transition-colors"
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </button>

                                                        {isDeletingTaskId === task.id && (
                                                          <>
                                                            <div className="fixed inset-0 z-[60]" onPointerDown={(e) => { e.stopPropagation(); setIsDeletingTaskId(null); }}></div>
                                                            <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-red-100 shadow-xl rounded-lg p-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                                                              <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mb-2 text-center">Confirm Delete?</p>
                                                              <div className="flex flex-col gap-1">
                                                                <button 
                                                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                                  className="w-full py-1 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700 transition-colors"
                                                                >Delete</button>
                                                                <button 
                                                                  onClick={(e) => { e.stopPropagation(); setIsDeletingTaskId(null); }}
                                                                  className="w-full py-1 text-zinc-400 text-[11px] font-bold hover:bg-zinc-50 rounded transition-colors"
                                                                >Cancel</button>
                                                              </div>
                                                            </div>
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Task Metadata Footer */}
                                                  {(task.custom_properties?.attachments?.length > 0 || task.due_date || task.content) && (
                                                    <div className="px-2 pb-2.5 pt-1 flex items-center gap-3">
                                                       {task.custom_properties?.attachments?.length > 0 && (
                                                          <div className="flex items-center gap-1 text-[#9ca3af]">
                                                             <Paperclip className="w-3.5 h-3.5" />
                                                             <span className="text-[11px] font-medium">{task.custom_properties?.attachments?.length || 0}</span>
                                                          </div>
                                                       )}
                                                       {task.due_date && (
                                                         <div className="flex items-center gap-1 text-[#9ca3af]">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="text-[11px] font-medium">{format(new Date(task.due_date), 'MMM d')}</span>
                                                         </div>
                                                       )}
                                                       {task.content && (
                                                         <div className="text-[#9ca3af]">
                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                         </div>
                                                       )}
                                                    </div>
                                                  )}

                                                  {/* Mobile Stage Movement Buttons */}
                                                  {isMobile && columns.length > 1 && (
                                                    <div className="px-2 pb-2 flex items-center justify-between gap-2">
                                                      {colIndex > 0 && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, columns[colIndex - 1].id) }}
                                                          className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg text-[11px] font-bold text-[#6b7280] hover:bg-gray-100 shadow-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis px-2"
                                                        >
                                                          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                                                          <span className="truncate">{columns[colIndex - 1].title}</span>
                                                        </button>
                                                      )}
                                                      
                                                      {colIndex < columns.length - 1 && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, columns[colIndex + 1].id) }}
                                                          className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg text-[11px] font-bold text-[#1a73e8] hover:bg-[#e8f0fe] hover:border-[#1a73e8] shadow-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis px-2"
                                                        >
                                                          <span className="truncate">{columns[colIndex + 1].title}</span>
                                                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                    {provided.placeholder}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleAddTask(col.id); }}
                                      className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-[12px] font-bold text-[#5f6368] bg-white border border-[#e5e7eb] shadow-sm hover:text-[#37352f] hover:bg-black/5 rounded-lg transition-all group/add-btn"
                                    >
                                      <Plus className="w-4 h-4 group-hover/add-btn:scale-125 transition-transform" />
                                      New
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      <div className="w-[300px] shrink-0">
                        {isAddingColumn ? (
                          <div className="bg-white border-2 border-[#e5e7eb] rounded-xl p-3 shadow-sm">
                            <input
                              autoFocus
                              className="w-full text-[13px] font-bold text-[#37352f] bg-[#f9fafb] border-none focus:ring-0 p-2 rounded-lg outline-none mb-3"
                              placeholder="Name this group..."
                              value={newColTitle}
                              onChange={(e) => setNewColTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddColumn()
                                if (e.key === 'Escape') setIsAddingColumn(false)
                              }}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={handleAddColumn}
                                className="flex-1 py-1.5 text-[12px] font-bold bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors"
                              >Add Group</button>
                              <button 
                                onClick={() => setIsAddingColumn(false)}
                                className="flex-1 py-1.5 text-[12px] font-bold text-[#9ca3af] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                              >Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsAddingColumn(true)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-[13px] font-bold text-[#9ca3af] hover:text-[#37352f] hover:bg-white border-2 border-dashed border-[#e5e7eb] rounded-xl transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Add Group
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : viewType === 'calendar' ? (
              <CalendarView 
                tasks={tasks}
                onTaskClick={(task) => setSelectedTask(task)}
                onAddTask={(date) => handleAddTask(columns[0]?.id, date)}
                onTaskUpdated={(updatedTask) => {
                  setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
                }}
                onTaskDeleted={(taskId) => {
                  setTasks(prev => prev.filter(t => t.id !== taskId))
                }}
              />
            ) : (
              <ChartsView pageId={pageId} tasks={tasks} columns={columns} />
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={columns}
          columnTitle={columns.find(c => c.id === selectedTask.column_id)?.title || ''}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
            setSelectedTask(updated)
          }}
        />
      )}
    </div>
  )
}
