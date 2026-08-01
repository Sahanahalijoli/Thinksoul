'use client'

import React, { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface CreateWorkspaceModalProps {
  onClose: () => void
  onWorkspaceCreated: (workspaceId: string) => void
  groupId?: string | null
}

export function CreateWorkspaceModal({ onClose, onWorkspaceCreated, groupId }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    
    // RLS Policy allows insert if owner_id = current user
    // However, the triggers in the DB might assign owner_id automatically if omitted, 
    // but better to fetch the user ID first.
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        setError("You must be logged in.")
        setLoading(false)
        return
    }

    const { data: newWorkspace, error: insertError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        owner_id: user.id,
        ...(groupId ? { group_id: groupId } : {})
      })
      .select('id')
      .single()

    setLoading(false)

    if (insertError || !newWorkspace) {
      console.error(insertError)
      setError(insertError?.message || 'Failed to create workspace')
      return
    }

    window.dispatchEvent(new Event('force_workspace_refresh')) // Instantly refresh Admin Table

    // Pass the new ID back to the dashboard to switch to it
    onWorkspaceCreated(newWorkspace.id)
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Create Workspace</h2>
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
            Workspaces allow you to collaborate with different groups on isolated sets of documents and tasks.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Acme Corp Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all"
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
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[150px]"
              disabled={loading || !name.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
