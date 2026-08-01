import React, { useState } from 'react'
import { Loader2, UserPlus, X, Mail, Check, Users, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

interface InviteMemberModalProps {
  workspaceId: string
  workspaceName: string
  onClose: () => void
}

export function InviteMemberModal({ workspaceId, workspaceName, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const supabase = createClient()

  React.useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const fetchMembers = async () => {
    setMembersLoading(true)
    const { data, error } = await supabase
      .from('workspace_members')
      .select('role, user_id, profiles(id, email, display_name)')
      .eq('workspace_id', workspaceId)

    if (!error && data) {
      setMembers(data)
    }
    setMembersLoading(false)
  }

  const handleRemoveMember = async (targetUserId: string, targetEmail: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (targetUserId === user?.id) {
      toast.error("You cannot remove yourself.")
      return
    }

    if (!window.confirm(`Are you sure you want to remove ${targetEmail} from this workspace?`)) return

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)

    if (error) {
      toast.error("Failed to remove member: " + error.message)
    } else {
      toast.success("Member removed")
      fetchMembers()
      window.dispatchEvent(new Event('force_workspace_refresh'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

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
          workspaceId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send invitation.')
      } else {
        setSuccess(true)
        toast.success(`Invitation sent to ${email}`)
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
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-gray-900">Invite to Workspace</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-[13px] text-gray-500 mb-4">
              Send an invitation to join <span className="font-semibold text-gray-900">"{workspaceName}"</span>. They will receive an email with a secure link to sign up.
            </p>
            
            <div className="space-y-1.5">
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
                  className="w-full h-10 pl-10 pr-3 bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none transition-all"
                  disabled={loading || success}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
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
              className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px] gap-2"
              disabled={loading || !email.trim() || success}
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

        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3 mt-4">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-[13px] font-semibold text-gray-900">Current Members ({members.length})</h3>
          </div>

          {membersLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[11px] shrink-0">
                      {member.profiles?.display_name?.charAt(0).toUpperCase() || member.profiles?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">
                        {member.profiles?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded uppercase tracking-wider uppercase">
                      {member.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.user_id, member.profiles?.email)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
