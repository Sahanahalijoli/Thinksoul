'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Edit2, Loader2 } from 'lucide-react'

interface RenameModalProps {
  initialTitle: string
  onClose: () => void
  onConfirm: (newTitle: string) => Promise<void>
}

export function RenameModal({ initialTitle, onClose, onConfirm }: RenameModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Select the text for easier editing
    if (inputRef.current) {
      inputRef.current.select()
    }
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim() || title === initialTitle) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onConfirm(title)
      onClose()
    } catch (err) {
      console.error('Rename error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-3xl overflow-hidden border-2 border-black/5 animate-in zoom-in-95 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header */}
        <div className="px-8 pt-8 pb-6 bg-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <Edit2 className="w-5 h-5 text-[#1a73e8]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#1a73e8] uppercase tracking-[0.1em]">Page Action</span>
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">Rename Page</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#1a1a1a] transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-[13px] font-medium text-[#5f6368] leading-relaxed ml-13">
            Enter a professional title that clearly describes the content of this page.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] ml-1">
                New Page Title
              </label>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Page"
                className="w-full h-12 px-4 rounded-xl border-2 border-transparent focus:border-[#1a73e8] bg-[#f9fafb] focus:bg-white outline-none transition-all text-[#1a1a1a] text-[15px] font-bold shadow-inner"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-[#f9fafb] border-t border-black/5 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-[14px] font-bold text-[#1a1a1a] border-2 border-black/5 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
          >
            Cancel
          </button>
          <button
            disabled={loading || !title.trim() || title === initialTitle}
            onClick={() => handleSubmit()}
            className="flex-[2] h-12 rounded-xl bg-[#1a73e8] text-white text-[14px] font-bold hover:bg-[#1557b0] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
