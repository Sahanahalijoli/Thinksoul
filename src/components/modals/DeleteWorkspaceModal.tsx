import React, { useState } from 'react'
import { Loader2, AlertTriangle, X } from 'lucide-react'

interface DeleteWorkspaceModalProps {
  workspaceName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteWorkspaceModal({ workspaceName, onClose, onConfirm }: DeleteWorkspaceModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
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
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Delete Workspace</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
            Are you sure you want to permanently delete the workspace <span className="font-semibold text-gray-900">"{workspaceName}"</span>? All associated data, documents, and tasks will be lost. This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center min-w-[100px]"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
