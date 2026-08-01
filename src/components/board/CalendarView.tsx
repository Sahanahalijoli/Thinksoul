'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Check, X, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { createClient } from '@/utils/supabase/client'

interface KanbanTask {
  id: string
  page_id: string
  column_id: string
  title: string
  progress: number
  due_date: string | null
  content: string | null
  position: number
  custom_properties?: Record<string, any>
}

interface CalendarViewProps {
  tasks: KanbanTask[]
  onTaskClick: (task: KanbanTask) => void
  onAddTask: (date: Date) => void
  onTaskUpdated: (updatedTask: KanbanTask) => void
  onTaskDeleted: (taskId: string) => void
}

export function CalendarView({ 
  tasks, 
  onTaskClick, 
  onAddTask,
  onTaskUpdated,
  onTaskDeleted,
}: CalendarViewProps) {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const startEditing = (task: KanbanTask, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setDeletingTaskId(null)
    // Focus input on next tick after render
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const saveTitle = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!editingTitle.trim()) {
      cancelEditing()
      return
    }
    setSavingTaskId(taskId)
    const { data, error } = await supabase
      .from('kanban_tasks')
      .update({ title: editingTitle.trim() })
      .eq('id', taskId)
      .select()
      .single()

    if (!error && data) {
      onTaskUpdated(data)
    }
    setSavingTaskId(null)
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const confirmDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId)
    if (!error) {
      onTaskDeleted(taskId)
    }
    setDeletingTaskId(null)
  }

  const selectedDayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate))

  return (
    <div className="h-full flex flex-col bg-white" onClick={() => { setDeletingTaskId(null); cancelEditing() }}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-5 px-1" onClick={e => e.stopPropagation()}>
        <h2 className="text-[17px] font-bold text-[#1f1f1f] tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1 p-0.5 bg-[#f9fafb] border border-[#f3f4f6] rounded-lg">
          <button 
            onClick={prevMonth}
            className="p-1 hover:bg-white hover:border-[#e5e7eb] border border-transparent rounded-md text-[#6b7280] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              const today = new Date()
              setCurrentMonth(today)
              setSelectedDate(today)
            }}
            className="px-2.5 py-1 text-[11px] font-bold text-[#374151] hover:bg-white hover:border-[#e5e7eb] border border-transparent rounded-md transition-all"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-1 hover:bg-white hover:border-[#e5e7eb] border border-transparent rounded-md text-[#6b7280] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isMobile ? (
        /* ── MOBILE VIEW: Grid + List ── */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-3 px-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-[10px] font-bold text-[#9ca3af] uppercase text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Clean Monthly Grid */}
          <div className="grid grid-cols-7 gap-y-0.5 mb-4 shrink-0 px-1">
            {days.map((day) => {
              const hasTasks = tasks.some(t => t.due_date && isSameDay(new Date(t.due_date), day))
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const sameMonth = isSameMonth(day, currentMonth)

              return (
                <button
                  key={day.toString()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate(day)
                    if (!sameMonth) setCurrentMonth(startOfMonth(day))
                  }}
                  className="relative flex flex-col items-center justify-center p-0.5 min-h-[42px]"
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-[14px] font-bold ${
                    isSelected 
                    ? 'bg-[#1a73e8] text-white' 
                    : isToday 
                    ? 'border-2 border-[#1a73e8]/30 text-[#1a73e8]' 
                    : sameMonth ? 'text-[#1f1f1f]' : 'text-[#d1d5db]'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Subtle Task Dot */}
                  {hasTasks && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1a73e8]" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected Day Task List */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-[#f3f4f6] pt-4 px-2">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-10 pb-1">
               <div>
                 <h3 className="text-[15px] font-bold text-[#1f1f1f] tracking-tight">
                   {format(selectedDate, 'EEEE, MMM d')}
                 </h3>
                 <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                    {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Task' : 'Tasks'}
                 </span>
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); onAddTask(selectedDate) }}
                 className="flex items-center gap-1 px-3 py-1.5 bg-[#1a73e8] text-white text-[12px] font-bold rounded-lg hover:bg-[#1557b0] transition-all"
               >
                 <Plus className="w-4 h-4" />
                 Add
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-10">
              {selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[#e5e7eb] rounded-xl bg-zinc-50/50">
                   <Calendar className="w-5 h-5 text-[#d1d5db] mb-2" />
                   <p className="text-[11px] font-bold text-[#9ca3af]">No tasks scheduled</p>
                </div>
              ) : (
                selectedDayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="group bg-white border border-[#f3f4f6] rounded-xl p-3 transition-all active:bg-zinc-50 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task) }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13.5px] font-bold text-[#1f1f1f] mb-0.5 leading-snug">
                          {task.title}
                        </h4>
                        {task.content && (
                          <p className="text-[12px] text-[#6b7280] line-clamp-1 opacity-70">
                            {task.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={(e) => startEditing(task, e)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#1a73e8] rounded-lg"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingTaskId(task.id)
                          }}
                          className="p-1.5 text-[#9ca3af] hover:text-[#ef4444] rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Actions */}
                    {editingTaskId === task.id && (
                      <div className="mt-3 flex flex-col gap-2 bg-[#f9fafb] p-2 rounded-lg border border-[#e5e7eb]" onClick={e => e.stopPropagation()}>
                        <textarea
                          ref={inputRef as any}
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          className="w-full bg-white border border-[#e5e7eb] text-[13px] font-bold rounded-md p-2 outline-none resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                           <button onClick={cancelEditing} className="px-2 py-1 text-[11px] font-bold text-[#6b7280]">Cancel</button>
                           <button onClick={() => saveTitle(task.id)} className="px-2.5 py-1 bg-[#1a73e8] text-white text-[11px] font-bold rounded-md">Save</button>
                        </div>
                      </div>
                    )}

                    {deletingTaskId === task.id && (
                      <div className="mt-3 pt-3 border-t border-[#f3f4f6]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-2">
                           <p className="text-[11px] font-bold text-[#1f1f1f]">Confirm delete?</p>
                           <div className="flex gap-2">
                             <button onClick={() => setDeletingTaskId(null)} className="px-3 py-1 bg-zinc-100 text-[#374151] text-[11px] font-bold rounded-md">No</button>
                             <button onClick={(e) => confirmDelete(task.id, e)} className="px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md">Yes</button>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── DESKTOP VIEW: Full Grid ── */
        <>
          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-3 border-b border-[#f3f4f6] pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Container */}
          <div className="flex-1 overflow-auto no-scrollbar">
            <div className="grid grid-cols-7 border-t border-l border-[#f3f4f6] min-h-full">
            {days.map((day) => {
              const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))
              const isToday = isSameDay(day, new Date())
              
              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[120px] p-2 border-r border-b border-[#f3f4f6] group/day relative transition-all ${
                    !isSameMonth(day, currentMonth) ? 'bg-[#fafafa]/40' : 'bg-white'
                  } ${deletingTaskId && dayTasks.some(t => t.id === deletingTaskId) ? 'z-[100]' : 'z-10'} hover:z-20`}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold transition-all ${
                       isToday 
                      ? 'border-2 border-[#1a73e8]/30 text-[#1a73e8]' 
                      : !isSameMonth(day, currentMonth) ? 'text-[#d1d5db]' : 'text-[#374151]'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAddTask(day) }}
                      className="p-1 opacity-0 group-hover/day:opacity-100 hover:bg-[#f3f4f6] rounded text-[#9ca3af] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {dayTasks.map(task => (
                      <div key={task.id} className="relative group/task">
                        
                        {/* ── EDIT MODE ── */}
                        {editingTaskId === task.id ? (
                          <div 
                            className="bg-white rounded-lg border border-[#1a73e8] shadow-lg p-1.5 z-50 relative flex flex-col gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <textarea
                              ref={inputRef as any}
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  saveTitle(task.id)
                                }
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              className="w-full text-[11px] font-bold text-[#1f1f1f] outline-none bg-transparent resize-none leading-tight border-none focus:ring-0"
                              autoFocus
                              rows={2}
                            />
                            <div className="flex justify-end gap-1">
                              <button onClick={cancelEditing} className="p-1 text-[#9ca3af] hover:bg-zinc-100 rounded">
                                <X className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => saveTitle(task.id, e)} className="p-1 text-[#1a73e8] hover:bg-blue-50 rounded">
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        ) : (
                          /* ── NORMAL MODE ── */
                          <div className={`relative ${deletingTaskId === task.id ? 'z-50' : ''}`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onTaskClick(task) }}
                              className="w-full text-left px-1.5 py-1 text-[11px] font-medium rounded hover:bg-zinc-50 border border-transparent hover:border-[#e5e7eb] transition-all text-[#374151] pr-6 truncate"
                            >
                              <span className="w-1 h-3 bg-[#1a73e8] rounded-full inline-block mr-1.5 align-middle" />
                              <span className="align-middle">{task.title}</span>
                            </button>
                            
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/task:opacity-100 transition-all px-1 bg-white hover:bg-zinc-50">
                              <button onClick={(e) => startEditing(task, e)} className="p-0.5 text-[#9ca3af] hover:text-[#1a73e8]">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDeletingTaskId(task.id) }} className="p-0.5 text-[#9ca3af] hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Delete Confirm */}
                            {deletingTaskId === task.id && (
                              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-[#e5e7eb] shadow-xl rounded-lg p-2 z-[200]">
                                <p className="text-[10px] font-bold mb-2">Delete?</p>
                                <div className="flex gap-1">
                                  <button onClick={(e) => confirmDelete(task.id, e)} className="flex-1 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">Yes</button>
                                  <button onClick={(e) => { e.stopPropagation(); setDeletingTaskId(null) }} className="flex-1 py-0.5 bg-zinc-100 text-[#6b7280] text-[10px] font-bold rounded">No</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}
