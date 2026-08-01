'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Shield, X, Mail, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

interface GroupOption {
  id: string
  name: string
}

interface InviteGroupAdminModalProps {
  preselectedGroupId?: string
  onClose: () => void
}

export function InviteGroupAdminModal({ preselectedGroupId, onClose }: InviteGroupAdminModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    preselectedGroupId ? new Set([preselectedGroupId]) : new Set()
  )
  const [groupsLoading, setGroupsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchGroups = async () => {
    setGroupsLoading(true)
    const { data, error } = await supabase
      .from('workspace_groups')
      .select('id, name')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setGroups(data)
    }
    setGroupsLoading(false)
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || selectedGroupIds.size === 0) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Session expired. Please re-login.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          inviteType: 'group_admin',
          groupIds: Array.from(selectedGroupIds),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send invitation.')
      } else {
        setSuccess(true)
        toast.success(`Group admin invitation sent to ${email}`)
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error. Please try again.')
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
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Invite Group Admin</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
            Send an invitation to become a <span className="font-semibold text-purple-600">Group Admin</span>. They will be able to manage workspaces inside the selected groups.
          </p>

          {/* Email Input */}
          <div className="space-y-1.5 mb-5">
            <label className="block text-[13px] font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                autoFocus
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all"
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-1.5 mb-6">
            <label className="block text-[13px] font-medium text-gray-700">
              Assign to Groups
            </label>
            {groupsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {groups.map(group => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedGroupIds.has(group.id) 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.has(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className={`text-[13px] font-medium ${
                      selectedGroupIds.has(group.id) ? 'text-purple-900' : 'text-gray-700'
                    }`}>
                      {group.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedGroupIds.size === 0 && !groupsLoading && (
              <p className="text-[12px] text-amber-600 mt-1">Please select at least one group.</p>
            )}
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
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center min-w-[150px] gap-2"
              disabled={loading || !email.trim() || selectedGroupIds.size === 0 || success}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <><Check className="w-4 h-4" /> Sent</>
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
