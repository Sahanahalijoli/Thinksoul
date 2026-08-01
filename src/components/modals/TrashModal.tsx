'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, RotateCcw, Search, X, Loader2, FileText, AlertCircle } from 'lucide-react'

interface TrashModalProps {
  workspaceId: string
  onClose: () => void
  onRestore: (pageId: string) => void
  onPermanentDelete: (pageId: string) => void
}

interface TrashedPage {
  id: string
  title: string | null
  icon: string | null
  updated_at: string
}

export function TrashModal({ workspaceId, onClose, onRestore, onPermanentDelete }: TrashModalProps) {
  const supabase = createClient()
  const [pages, setPages] = useState<TrashedPage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchTrash = async () => {
      const { data } = await supabase
        .from('pages')
        .select('id, title, icon, updated_at')
        .eq('workspace_id', workspaceId)
        .eq('is_trash', true)
        .order('updated_at', { ascending: false })
      
      if (data) setPages(data)
      setLoading(false)
    }
    fetchTrash()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const filteredPages = pages.filter(p => 
    (p.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:max-w-2xl h-[92vh] sm:h-[650px] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-3xl overflow-hidden border-none sm:border-2 sm:border-black/5 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modern Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-black/5 bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.11em]">System Maintenance</span>
                <span className="text-[14px] sm:text-[15px] font-bold text-[#1a1a1a]">Archive & Trash</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#1a1a1a] transition-all"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Integrated Search Bar */}
        <div className="px-6 sm:px-8 py-4 bg-white border-b border-black/5 shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#9ca3af] transition-colors group-focus-within:text-[#1a73e8]" />
            <input 
              type="text"
              placeholder="Search deleted pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 sm:h-12 bg-[#f9fafb] border-2 border-transparent focus:border-[#1a73e8] focus:bg-white rounded-xl pl-11 sm:pl-12 pr-4 text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] placeholder-[#d1d5db] outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">Scanning Archive...</span>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 sm:p-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 opacity-30">
                <Trash2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300" />
              </div>
              <p className="text-[13px] sm:text-[14px] font-bold text-zinc-400 max-w-[200px]">Your archive is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              {filteredPages.map(page => (
                <div key={page.id} className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-[#f9fafb] border-2 border-transparent hover:border-black/5 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white border-2 border-black/5 flex items-center justify-center text-[18px] sm:text-[20px] flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                    {page.icon ? (
                      <span className="leading-none">{page.icon}</span>
                    ) : (
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] truncate group-hover:text-[#1a73e8] transition-colors">{page.title || 'Untitled archive'}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider mt-0.5">Updated • {new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => onRestore(page.id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white border-2 border-black/5 rounded-lg sm:rounded-xl text-zinc-500 hover:text-[#1a73e8] hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onPermanentDelete(page.id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white border-2 border-black/5 rounded-lg sm:rounded-xl text-zinc-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modern Safety Info */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 bg-red-50/50 border-t border-red-100 shrink-0">
           <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg border border-red-100 shadow-sm shrink-0">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-red-700 uppercase tracking-widest">Retention Policy</span>
                <p className="text-[11px] sm:text-[12px] font-medium text-red-600/70 leading-relaxed">
                  Items in trash are removed from your active sidebar. Restoring an item moves it back to your primary workspace.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
