'use client'

import { useState } from 'react'
import { Trash2, AlertCircle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  pageTitle: string
  onCancel: () => void
  onConfirm: (permanent: boolean) => void
}

export function DeleteConfirmModal({ pageTitle, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const [permanent, setPermanent] = useState(false)

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-3xl w-full max-w-[440px] overflow-hidden border-2 border-black/5 animate-in zoom-in-95 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                <Trash2 className="w-5 h-5 text-red-500" />
             </div>
             <div className="flex flex-col">
                <span className="text-[11px] font-bold text-red-500 uppercase tracking-[0.1em]">Safety Warning</span>
                <span className="text-[14px] font-bold text-[#1a1a1a]">Delete Confirmation</span>
             </div>
          </div>
          <button 
            onClick={onCancel} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#1a1a1a] transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#f9fafb] border-2 border-transparent">
              <p className="text-[15px] font-medium text-[#1a1a1a] leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-red-600">"{pageTitle}"</span>?
              </p>
              <p className="text-[13px] font-medium text-[#5f6368] mt-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                By default, this will be safely moved to your Trash.
              </p>
            </div>

            {/* Permanent Option */}
            <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
              permanent ? 'bg-red-50 border-red-100' : 'bg-white border-black/5 hover:border-red-100'
            }`}>
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox" 
                  checked={permanent}
                  onChange={(e) => setPermanent(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-black/10 text-red-600 focus:ring-red-500 cursor-pointer transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-[14px] font-bold transition-colors ${permanent ? 'text-red-700' : 'text-[#1a1a1a]'}`}>
                  Delete permanently
                </span>
                <span className="text-[12px] font-medium text-[#9ca3af] leading-tight">
                  This bypasses the trash and removes the data forever. This action is irreversible.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-[#f9fafb] border-t border-black/5 flex items-center justify-end gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 h-12 rounded-xl text-[14px] font-bold text-[#1a1a1a] bg-white border-2 border-black/5 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(permanent)}
            className={`flex-[2] px-6 h-12 rounded-xl text-[14px] font-bold text-white transition-all shadow-lg active:scale-95 ${
              permanent ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-[#1a1a1a] hover:bg-black'
            }`}
          >
            {permanent ? 'Permanently Delete' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}
