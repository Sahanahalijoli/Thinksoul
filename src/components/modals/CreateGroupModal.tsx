'use client'

import React, { useState } from 'react'
import { FolderPlus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CreateGroupModalProps {
  onClose: () => void
  onGroupCreated: () => void
}

export function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError("You must be logged in.")
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('workspace_groups')
      .insert({
        name: name.trim(),
        created_by: user.id
      })

    setLoading(false)

    if (insertError) {
      console.error(insertError)
      setError(insertError.message || 'Failed to create group')
      return
    }

    window.dispatchEvent(new Event('force_workspace_refresh'))
    onGroupCreated()
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
              <FolderPlus className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Create Group</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
            Groups let you organize workspaces into folders. You can assign group admins to manage workspaces within each group.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Batch 2026, Engineering, Marketing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <p className="text-[13px] font-medium text-red-600">{error}</p>
            </div>
          )}

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
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center min-w-[150px]"
              disabled={loading || !name.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
