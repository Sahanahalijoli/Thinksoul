'use client'

import React, { useState } from 'react'
import { Edit2, X, Loader2 } from 'lucide-react'

interface RenameGroupModalProps {
  initialName: string
  onClose: () => void
  onSubmit: (newName: string) => Promise<void>
}

export function RenameGroupModal({ initialName, onClose, onSubmit }: RenameGroupModalProps) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === initialName) return

    setLoading(true)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch {
      // parent handles errors
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
      style={{ fontFamily: "'Inter', sans-serif" }} 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Rename Group</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center min-w-[120px]"
              disabled={loading || !name.trim() || name.trim() === initialName}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
