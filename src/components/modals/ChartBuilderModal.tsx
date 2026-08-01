'use client'

import React, { useState } from 'react'
import { X, BarChart, PieChart, LineChart, Hash, CheckCircle, Columns, Loader2 } from 'lucide-react'

export interface CustomChartConfig {
  title: string
  chart_type: 'bar' | 'pie' | 'line'
  metric: 'count' | 'progress'
  group_by: 'column' | 'status'
}

interface ChartBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: CustomChartConfig) => Promise<void>
}

export function ChartBuilderModal({ isOpen, onClose, onSave }: ChartBuilderModalProps) {
  const [title, setTitle] = useState('')
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [metric, setMetric] = useState<'count' | 'progress'>('count')
  const [groupBy, setGroupBy] = useState<'column' | 'status'>('column')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSave({ title, chart_type: chartType, metric, group_by: groupBy })
      setTitle('')
      setChartType('bar')
      setMetric('count')
      setGroupBy('column')
    } finally {
      setIsSubmitting(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg h-[92vh] sm:h-auto rounded-t-3xl sm:rounded-2xl shadow-3xl overflow-hidden border-none sm:border-2 sm:border-black/5 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-400 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-black/5 bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <BarChart className="w-5 h-5 text-[#1a73e8]" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#1a73e8] uppercase tracking-[0.11em]">Data Visualization</span>
                <span className="text-[14px] sm:text-[15px] font-bold text-[#1a1a1a]">Custom Chart Builder</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#1a1a1a] transition-all"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSave} className="flex-1 p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">
          {/* Title Section */}
          <div className="space-y-3">
            <label className="text-[10px] sm:text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] ml-1">Visualization Name</label>
            <input
              type="text"
              placeholder="e.g. Project Velocity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 bg-[#f9fafb] border-2 border-transparent focus:border-[#1a73e8] focus:bg-white rounded-xl text-[14px] font-bold text-[#1a1a1a] placeholder-[#d1d5db] outline-none transition-all shadow-inner"
              required
              autoFocus
            />
          </div>

          {/* Visualization Type Selector */}
          <div className="space-y-4">
            <label className="text-[10px] sm:text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] ml-1">Select Chart Type</label>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { type: 'bar', icon: BarChart, label: 'Bar' },
                { type: 'pie', icon: PieChart, label: 'Pie' },
                { type: 'line', icon: LineChart, label: 'Line' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChartType(type as any)}
                  className={`flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all group ${
                    chartType === type 
                      ? 'border-[#1a73e8] bg-blue-50 text-[#1a73e8] shadow-sm' 
                      : 'border-black/5 bg-white text-zinc-400 hover:border-[#1a73e8]/20 hover:bg-blue-50/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${chartType === type ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Axes Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Group By Configuration */}
            <div className="space-y-4">
              <label className="text-[10px] sm:text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] ml-1">Pivot (X-Axis)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'column', icon: Columns, label: 'Column' },
                  { id: 'status', icon: CheckCircle, label: 'Status' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setGroupBy(id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      groupBy === id 
                        ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-md' 
                        : 'border-black/5 bg-white text-[#1a1a1a] hover:bg-zinc-50 shadow-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] sm:text-[12px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Configuration */}
            <div className="space-y-4">
              <label className="text-[10px] sm:text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.1em] ml-1">Metric (Y-Axis)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'count', icon: Hash, label: 'Count' },
                  { id: 'progress', icon: CheckCircle, label: 'Progress' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMetric(id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      metric === id 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' 
                        : 'border-black/5 bg-white text-[#1a1a1a] hover:bg-zinc-50 shadow-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] sm:text-[12px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-auto border-t border-black/5 flex items-center gap-3 sm:gap-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-[14px] font-bold text-[#1a1a1a] border-2 border-black/5 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-[2] h-12 rounded-xl bg-[#1a73e8] text-white text-[14px] font-bold hover:bg-[#1557b0] transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-30"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Apply Chart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
