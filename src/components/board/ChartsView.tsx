'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart as RechartsLineChart,
  Line
} from 'recharts'
import { LayoutDashboard, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { ChartBuilderModal, CustomChartConfig } from '../modals/ChartBuilderModal'

interface KanbanColumn {
  id: string
  title: string
  color: string | null
  position: number
}

interface KanbanTask {
  id: string
  column_id: string
  page_id: string
  title: string
  progress: number
  due_date: string | null
  content: string | null
  position: number
}

interface CustomChart {
  id: string
  page_id: string
  title: string
  chart_type: 'bar' | 'pie' | 'line'
  metric: 'count' | 'progress'
  group_by: 'column' | 'status'
}

interface ChartsViewProps {
  pageId: string
  tasks: KanbanTask[]
  columns: KanbanColumn[]
}

export function ChartsView({ pageId, tasks, columns }: ChartsViewProps) {
  const supabase = createClient()
  const [customCharts, setCustomCharts] = useState<CustomChart[]>([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Top level stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.progress === 100).length
  const overdueOrDatedTasks = tasks.filter(t => t.due_date !== null).length

  // Fetch custom charts
  useEffect(() => {
    const fetchCharts = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('custom_charts')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true })
      
      if (!error && data) {
        setCustomCharts(data as CustomChart[])
      }
      setIsLoading(false)
    }
    
    if (pageId) {
      fetchCharts()
    }
  }, [pageId, supabase])

  const handleSaveCustomChart = async (config: CustomChartConfig) => {
    const newChart = {
      page_id: pageId,
      title: config.title,
      chart_type: config.chart_type,
      metric: config.metric,
      group_by: config.group_by,
      position: customCharts.length
    }

    const { data, error } = await supabase
      .from('custom_charts')
      .insert(newChart)
      .select()
      .single()

    if (!error && data) {
      setCustomCharts([...customCharts, data as CustomChart])
    } else {
      console.error("Failed to save custom chart", error)
    }
  }

  const handleDeleteCustomChart = async (id: string) => {
    const { error } = await supabase
      .from('custom_charts')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setCustomCharts(customCharts.filter(c => c.id !== id))
    }
  }

  // Dynamic Chart Rendering Engine
  const renderCustomChart = (chart: CustomChart) => {
    // 1. Process Data
    let data: { name: string; value: number }[] = []
    
    if (chart.group_by === 'column') {
      data = columns.map(col => {
        const groupTasks = tasks.filter(t => t.column_id === col.id)
        let value = 0
        if (chart.metric === 'count') {
          value = groupTasks.length
        } else if (chart.metric === 'progress') {
          value = groupTasks.length > 0 
            ? Math.round(groupTasks.reduce((sum, t) => sum + t.progress, 0) / groupTasks.length) 
            : 0
        }
        return { name: col.title, value }
      })
    } else if (chart.group_by === 'status') {
      const statusGroups = [
        { name: 'Not Started', filter: (t: KanbanTask) => t.progress === 0 },
        { name: 'In Progress', filter: (t: KanbanTask) => t.progress > 0 && t.progress < 100 },
        { name: 'Completed', filter: (t: KanbanTask) => t.progress === 100 },
      ]
      data = statusGroups.map(group => {
        const groupTasks = tasks.filter(group.filter)
        let value = 0
        if (chart.metric === 'count') {
          value = groupTasks.length
        } else if (chart.metric === 'progress') {
          value = groupTasks.length > 0 
            ? Math.round(groupTasks.reduce((sum, t) => sum + t.progress, 0) / groupTasks.length) 
            : 0
        }
        return { name: group.name, value }
      })
    }

    // 2. Render Chart Component
    return (
      <div key={chart.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col min-h-[300px] relative group">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-800">{chart.title}</h3>
            <p className="text-[10px] text-zinc-400 font-medium uppercase mt-0.5">
              {chart.metric === 'count' ? 'Total Count' : 'Avg Progress'} • Grouped by {chart.group_by}
            </p>
          </div>
          <button 
            onClick={() => handleDeleteCustomChart(chart.id)}
            className="text-zinc-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 w-full min-h-[220px]">
          {data.every(d => d.value === 0) ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-zinc-400 font-medium">No Data Available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chart.chart_type === 'bar' ? (
                <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#fafafa' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#1a73e8" />
                </RechartsBarChart>
              ) : chart.chart_type === 'pie' ? (
                <PieChart>
                  <Pie data={data} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#d8b4fe'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" formatter={(value) => <span className="text-[11px] font-medium text-zinc-600 ml-1">{value}</span>} />
                </PieChart>
              ) : (
                <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#fafafa]">
        <div className="max-w-[1400px] w-full mx-auto space-y-6">
          
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-0.5">Total Tasks</p>
                <h3 className="text-2xl font-black text-zinc-800">{totalTasks}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-0.5">Completed</p>
                <h3 className="text-2xl font-black text-zinc-800">{completedTasks}</h3>
              </div>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight mb-0.5">Scheduled / Due</p>
                <h3 className="text-2xl font-black text-zinc-800">{overdueOrDatedTasks}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Dynamic Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Render Custom Charts from Supabase */}
            {!isLoading && customCharts.map(chart => renderCustomChart(chart))}

            {/* Add Custom Chart Button */}
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="bg-white/50 hover:bg-white border-2 border-dashed border-zinc-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-400 hover:text-blue-500 transition-all min-h-[300px] group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm tracking-tight">Add Custom Widget</span>
              <span className="text-xs mt-1 text-zinc-400 group-hover:text-blue-400/80">Configure dynamic data</span>
            </button>

          </div>
        </div>
      </div>

      <ChartBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSaveCustomChart}
      />
    </>
  )
}
