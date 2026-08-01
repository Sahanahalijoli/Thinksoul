'use client'

import React, { useState } from 'react'
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteGroupModalProps {
  groupName: string
  workspaceCount: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteGroupModal({ groupName, workspaceCount, onClose, onConfirm }: DeleteGroupModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
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
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Delete Group</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-amber-900 mb-1">
                Are you sure you want to delete &ldquo;{groupName}&rdquo;?
              </p>
              <p className="text-[13px] text-amber-700 leading-relaxed">
                {workspaceCount > 0 
                  ? `The ${workspaceCount} workspace${workspaceCount > 1 ? 's' : ''} inside this group will be permanently deleted, including pages, tasks, blocks, and memberships. This cannot be undone.`
                  : 'This group is empty. It will be permanently removed.'
                }
              </p>
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
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center min-w-[120px]"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : workspaceCount > 0 ? 'Delete All' : 'Delete Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
