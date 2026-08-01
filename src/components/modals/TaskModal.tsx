'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Loader2, MessageSquare, User, Send, Paperclip, ImageIcon, ExternalLink, Trash2, AlignLeft, LayoutDashboard, ChevronDown, Pencil } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { uploadToS3 } from '@/utils/s3/upload'
import { format } from 'date-fns'

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

interface KanbanColumn {
  id: string
  title: string
  color: string | null
}

interface BoardProperty {
  id: string
  name: string
  type: string
}

interface TaskComment {
  id: string
  text: string
  created_at: string
  author: string
}

interface TaskModalProps {
  task: KanbanTask
  columns: KanbanColumn[]
  columnTitle: string
  onClose: () => void
  onUpdate: (updatedTask: KanbanTask) => void
}

export function TaskModal({ task, columns, columnTitle, onClose, onUpdate }: TaskModalProps) {
  const supabase = createClient()
  const [title, setTitle] = useState(task.title || '')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [content, setContent] = useState(task.content || '')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(task.progress || 0)

  // Dynamic Properties & Comments State
  const [boardProps, setBoardProps] = useState<BoardProperty[]>([])
  const [customProps, setCustomProps] = useState<Record<string, any>>(task.custom_properties || {})
  const [comments, setComments] = useState<TaskComment[]>(task.custom_properties?.comments || [])
  const [newComment, setNewComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<string[]>(task.custom_properties?.attachments || [])

  useEffect(() => {
    const fetchBoardProps = async () => {
      const { data } = await supabase.from('pages').select('board_properties').eq('id', task.page_id).single()
      if (data && data.board_properties) {
        setBoardProps(data.board_properties)
      }
    }
    fetchBoardProps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.page_id])

  const handleUpdate = async (updates: Partial<KanbanTask>) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kanban_tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single()

    if (error) {
      console.error('Update failed', error)
    } else if (data) {
      onUpdate(data)
    }
    setLoading(false)
  }

  const handleTitleBlur = () => {
    if (title !== task.title) {
      handleUpdate({ title })
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment: TaskComment = {
      id: crypto.randomUUID(),
      text: newComment,
      created_at: new Date().toISOString(),
      author: 'You'
    }
    const updatedComments = [...comments, comment]
    setComments(updatedComments)
    setNewComment('')
    
    const updatedProps = { ...customProps, comments: updatedComments }
    setCustomProps(updatedProps)
    handleUpdate({ custom_properties: updatedProps })
  }

  const handleStatusChange = (newColId: string) => {
    if (newColId === task.column_id) return
    handleUpdate({ column_id: newColId })
  }

  const handleProgressChange = (val: number) => {
    setProgress(val)
  }

  const handleProgressBlur = () => {
    if (progress !== task.progress) {
      handleUpdate({ progress: Number(progress) })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadToS3(file)
      const updatedAttachments = [...attachments, url]
      setAttachments(updatedAttachments)
      
      const updatedProps = { ...customProps, attachments: updatedAttachments }
      setCustomProps(updatedProps)
      handleUpdate({ custom_properties: updatedProps })
    } catch (err: any) {
      alert(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    const updatedAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(updatedAttachments)
    const updatedProps = { ...customProps, attachments: updatedAttachments }
    setCustomProps(updatedProps)
    handleUpdate({ custom_properties: updatedProps })
  }

  return (
    <div className="fixed inset-0 z-[200] flex sm:items-center items-end justify-center p-0 sm:p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[960px] h-[95vh] sm:h-[85vh] sm:max-h-[800px] flex flex-col bg-white sm:rounded-xl rounded-t-2xl shadow-2xl overflow-hidden border-t sm:border border-zinc-200 animate-in zoom-in-95 sm:slide-in-from-bottom-0 slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white shrink-0">
          <div className="flex items-center gap-2 text-zinc-500">
             <LayoutDashboard className="w-4 h-4" />
             <span className="text-sm font-medium text-zinc-600">Task Details</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row no-scrollbar">
          
          {/* Main Content Area */}
          <div className="flex-1 md:overflow-y-auto w-full no-scrollbar shrink-0">
            <div className="p-6 md:p-10 flex flex-col gap-10">
              
              {/* Title */}
              <div className="relative group/title pt-2">
                <div className="absolute -left-6 top-5 text-zinc-300 opacity-0 group-hover/title:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                  <Pencil className="w-4 h-4" />
                </div>
                <textarea
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onBlur={handleTitleBlur}
                  placeholder="Task Title"
                  rows={1}
                  className="w-full text-2xl md:text-[32px] font-bold text-zinc-900 placeholder-zinc-300 outline-none bg-transparent hover:bg-zinc-50 border border-transparent hover:border-zinc-200 focus:border-zinc-300 focus:bg-white focus:shadow-sm rounded-lg sm:-ml-3 px-0 sm:px-3 py-1.5 transition-all resize-none overflow-hidden leading-tight"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-zinc-700">
                    <AlignLeft className="w-4 h-4" />
                    <span className="text-sm font-semibold">Description</span>
                 </div>
                 <textarea 
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   onBlur={() => handleUpdate({ content })}
                   placeholder="Add a more detailed description..."
                   className="w-full min-h-[140px] text-[14px] text-zinc-700 placeholder-zinc-400 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-lg p-4 outline-none focus:border-zinc-300 focus:bg-white transition-all resize-y leading-relaxed"
                 />
              </div>

              {/* Files Preview Grid */}
              {attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-700">
                     <Paperclip className="w-4 h-4" />
                     <span className="text-sm font-semibold">Attachments</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {attachments.map((url, idx) => {
                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                        return (
                          <div key={idx} className="group relative aspect-square bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                             {isImage ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={url} alt="Attachment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                             ) : (
                               <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-zinc-100">
                                     <ImageIcon className="w-5 h-5 text-zinc-400" />
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Doc</span>
                               </div>
                             )}
                             <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
                                <a href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white rounded-lg text-zinc-700 flex items-center justify-center hover:bg-zinc-100 transition-all shadow-md">
                                   <ExternalLink className="w-4 h-4" />
                                </a>
                                <button onClick={() => removeAttachment(idx)} className="w-8 h-8 bg-white rounded-lg text-red-500 flex items-center justify-center hover:bg-red-50 transition-all shadow-md">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        )
                    })}
                  </div>
                </div>
              )}

              <hr className="border-zinc-100" />

              {/* Comments Section */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-zinc-700">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-semibold">Activity</span>
                 </div>
                 
                 <div className="space-y-6">
                    {comments.length === 0 ? (
                      <div className="text-[13px] text-zinc-500 italic pl-6">
                        No activity yet.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                              <User className="w-4 h-4 text-zinc-400" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                 <span className="text-[13px] font-semibold text-zinc-900">{comment.author}</span>
                                 <span className="text-[11px] text-zinc-500">{format(new Date(comment.created_at), 'MMM d, p')}</span>
                              </div>
                              <div className="text-[14px] text-zinc-700 break-words leading-relaxed bg-zinc-50 border border-zinc-100 rounded-b-lg rounded-tr-lg px-4 py-2.5 inline-block">
                                 {comment.text}
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>

                 {/* New Comment Input */}
                 <div className="flex gap-3 pt-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                       <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 relative group">
                       <textarea 
                         value={newComment}
                         onChange={(e) => {
                           setNewComment(e.target.value)
                           e.target.style.height = 'auto'
                           e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                         }}
                         placeholder="Write a comment..."
                         rows={1}
                         className="w-full text-sm p-3 pr-12 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100/50 rounded-lg outline-none transition-all resize-none min-h-[44px]"
                       />
                       <button 
                         onClick={handleAddComment}
                         disabled={!newComment.trim()}
                         className="absolute right-2 bottom-2 p-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:cursor-not-allowed"
                       >
                          <Send className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              </div>
              
            </div>
          </div>

          {/* Sidebar Properties Panel */}
          <div className="w-full md:w-[280px] bg-zinc-50/50 border-b md:border-b-0 md:border-l border-zinc-200 flex flex-col shrink-0 md:overflow-y-auto no-scrollbar order-first md:order-none">
             <div className="p-6 md:p-8 flex flex-col gap-6">
                
                {/* Status */}
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</label>
                   <div className="relative">
                      <select 
                         value={task.column_id}
                         onChange={(e) => handleStatusChange(e.target.value)}
                         className="w-full h-9 px-3 pr-8 rounded-lg text-[13px] font-medium outline-none cursor-pointer border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-all appearance-none text-zinc-700"
                      >
                         {columns.map(col => (
                           <option key={col.id} value={col.id}>{col.title}</option>
                         ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none" />
                   </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Due Date</label>
                   <div className="relative">
                     <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
                     <input 
                        type="date" 
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value)
                          handleUpdate({ due_date: e.target.value || null })
                        }}
                        className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] font-medium text-zinc-700 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 outline-none focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all cursor-pointer" 
                     />
                   </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Progress</label>
                      <span className="text-[11px] font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-sm">{progress}%</span>
                   </div>
                   <div className="pt-2">
                     <input 
                       type="range"
                       min="0"
                       max="100"
                       value={progress}
                       onChange={(e) => handleProgressChange(Number(e.target.value))}
                       onMouseUp={handleProgressBlur}
                       className="w-full h-1.5 rounded-full bg-zinc-200 border border-zinc-300 accent-zinc-800 cursor-pointer appearance-none shadow-inner" 
                     />
                   </div>
                </div>

                <hr className="border-zinc-200 my-2" />

                {/* File Attachment */}
                <div className="space-y-2">
                   <label className={`w-full flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium border border-zinc-200 shadow-sm transition-all cursor-pointer ${uploading ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Attach File'}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={uploading}
                      />
                   </label>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
