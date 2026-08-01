'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, User, Shield, Briefcase, Users, Loader2, Check, Trash2, LogOut } from 'lucide-react'

interface SettingsModalProps {
  workspaceId: string
  userId: string
  onClose: () => void
  onLogout: () => void
  onWorkspaceUpdated: (newName: string) => void
}

type Tab = 'profile' | 'account' | 'workspace' | 'members'

export function SettingsModal({ workspaceId, userId, onClose, onLogout, onWorkspaceUpdated }: SettingsModalProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile State
  const [profileLoading, setProfileLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Workspace State
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSaving, setWorkspaceSaving] = useState(false)
  const [workspaceSuccess, setWorkspaceSuccess] = useState(false)

  // Account State
  const [password, setPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Members State
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState('')

  // Init Data Fetch
  useEffect(() => {
    const fetchInitData = async () => {
      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, about_me')
        .eq('id', userId)
        .single()
      
      if (profile) {
        setDisplayName(profile.display_name || '')
        setAboutMe(profile.about_me || '')
      }
      setProfileLoading(false)

      // Fetch Workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()
      
      if (workspace) {
        setWorkspaceName(workspace.name || '')
      }
      setWorkspaceLoading(false)

      // Fetch Members
      fetchMembers()
    }

    fetchInitData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, userId])

  const fetchMembers = async () => {
    setMembersLoading(true)
    const { data: mems, error } = await supabase
      .from('workspace_members')
      .select('role, user_id, profiles(id, email, display_name)')
      .eq('workspace_id', workspaceId)
    
    if (mems && !error) {
      setMembers(mems)
    }
    setMembersLoading(false)
  }

  // Action Handlers
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    await supabase.from('profiles').update({ display_name: displayName, about_me: aboutMe }).eq('id', userId)
    setProfileSaving(false)
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 2000)
  }

  const handleUpdatePassword = async () => {
    if (!password) return
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPasswordSaving(false)
    if (!error) {
      setPassword('')
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 2000)
    } else {
      alert('Failed to update password: ' + error.message)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')
    if (!error) {
      onLogout()
    } else {
      alert('Failed to delete account: ' + error.message)
      setDeleting(false)
    }
  }

  const handleSaveWorkspace = async () => {
    if (!workspaceName) return
    setWorkspaceSaving(true)
    const { error } = await supabase.from('workspaces').update({ name: workspaceName }).eq('id', workspaceId)
    setWorkspaceSaving(false)
    if (!error) {
      setWorkspaceSuccess(true)
      onWorkspaceUpdated(workspaceName)
      setTimeout(() => setWorkspaceSuccess(false), 2000)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    setInviteFeedback('')

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setInviteFeedback('Session expired. Please re-login.')
        setInviting(false)
        return
      }

      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          workspaceId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setInviteFeedback(data.error || 'Failed to send invitation.')
      } else {
        setInviteFeedback(`✓ Invitation sent to ${inviteEmail}!`)
        setInviteEmail('')
        // Refresh members list in case user already existed
        fetchMembers()
      }
    } catch {
      setInviteFeedback('Network error. Please try again.')
    }
    setInviting(false)
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (targetUserId === userId) {
      alert("You cannot remove yourself. Ask another admin to do this, or delete the workspace.")
      return
    }
    await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', targetUserId)
    fetchMembers()
  }

  const tabs: { id: Tab; icon: typeof User; label: string; group: 'personal' | 'workspace' }[] = [
    { id: 'profile', icon: User, label: 'Profile', group: 'personal' },
    { id: 'account', icon: Shield, label: 'Security', group: 'personal' },
    { id: 'workspace', icon: Briefcase, label: 'General', group: 'workspace' },
    { id: 'members', icon: Users, label: 'Members', group: 'workspace' },
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-[92vh] md:h-[600px] md:max-w-[720px] shadow-2xl flex flex-col md:flex-row overflow-hidden rounded-t-2xl md:rounded-2xl border border-black/5 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── Sidebar Navigation ── */}
        <div className="w-full md:w-[200px] bg-[#fafafa] border-b md:border-b-0 md:border-r border-[#f0f0f0] flex flex-col shrink-0">
          {/* Mobile: Horizontal tab bar */}
          <div className="flex md:hidden items-center justify-between px-4 pt-3 pb-1">
            <h2 className="text-[15px] font-bold text-[#1a1a1a]">Settings</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-[#9ca3af]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex md:hidden gap-1 px-3 pb-2.5 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm border border-[#e5e7eb] text-[#1a73e8]'
                    : 'text-[#6b7280] active:bg-white/60'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-[#1a73e8]' : 'text-[#9ca3af]'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop: Vertical sidebar */}
          <div className="hidden md:flex flex-col flex-1 p-3 gap-0.5">
            <div className="px-2 py-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-[#b0b0b0] uppercase tracking-[0.08em]">Personal</span>
            </div>
            {tabs.filter(t => t.group === 'personal').map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm border border-[#e5e7eb] text-[#1a73e8]'
                    : 'text-[#6b7280] hover:bg-white/60 hover:text-[#374151]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#1a73e8]' : 'text-[#9ca3af]'}`} />
                {tab.label}
              </button>
            ))}

            <div className="px-2 py-1.5 mt-4 mb-0.5 border-t border-[#f0f0f0] pt-4">
              <span className="text-[10px] font-bold text-[#b0b0b0] uppercase tracking-[0.08em]">Workspace</span>
            </div>
            {tabs.filter(t => t.group === 'workspace').map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm border border-[#e5e7eb] text-[#1a73e8]'
                    : 'text-[#6b7280] hover:bg-white/60 hover:text-[#374151]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#1a73e8]' : 'text-[#9ca3af]'}`} />
                {tab.label}
              </button>
            ))}

            <div className="mt-auto pt-3 border-t border-[#f0f0f0]">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
          {/* Desktop close button */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-4 right-4 w-8 h-8 items-center justify-center hover:bg-[#f3f4f6] rounded-lg transition-colors text-[#9ca3af] z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-8">

            {/* ═══ PROFILE TAB ═══ */}
            {activeTab === 'profile' && (
              <div className="space-y-5 animate-in fade-in duration-300 max-w-[440px]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Profile</h2>
                  <p className="text-[12px] text-[#9ca3af]">Manage how you appear to others.</p>
                </div>
                
                {profileLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Display Name</label>
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">About Me</label>
                        <textarea 
                          value={aboutMe}
                          onChange={(e) => setAboutMe(e.target.value)}
                          placeholder="A short bio..."
                          rows={3}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg p-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="h-9 px-5 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      {profileSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profileSuccess ? (
                        <><Check className="w-4 h-4 text-green-400" /> Saved</>
                      ) : (
                        'Save Profile'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ═══ ACCOUNT / SECURITY TAB ═══ */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-[440px]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Security</h2>
                  <p className="text-[12px] text-[#9ca3af]">Update credentials and manage your account.</p>
                </div>
                
                {/* Password Section */}
                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-[#1a1a1a]">Change Password</h3>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium outline-none transition-all"
                    />
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={passwordSaving || !password}
                      className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50 shrink-0"
                    >
                      {passwordSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (passwordSuccess ? <Check className="w-3.5 h-3.5" /> : 'Update')}
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-5 border-t border-[#f3f4f6]">
                  <h3 className="text-[13px] font-bold text-red-600 mb-1">Danger Zone</h3>
                  <p className="text-[12px] text-[#6b7280] mb-4 leading-relaxed">
                    Permanently delete your account, data, and team access. This cannot be undone.
                  </p>
                  
                  <div className="p-4 rounded-xl border border-red-100 bg-red-50/40 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Type &apos;DELETE&apos; to confirm</label>
                      <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full h-9 bg-white border border-red-200 focus:border-red-500 rounded-lg px-3 text-[13px] font-bold text-red-600 outline-none transition-all placeholder:text-red-200"
                      />
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE'}
                      className="w-full h-9 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete My Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE TAB ═══ */}
            {activeTab === 'workspace' && (
              <div className="space-y-5 animate-in fade-in duration-300 max-w-[440px]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Workspace</h2>
                  <p className="text-[12px] text-[#9ca3af]">Configure your workspace settings.</p>
                </div>
                
                {workspaceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Workspace Name</label>
                      <input 
                        type="text" 
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                      />
                    </div>
                    
                    <button 
                      onClick={handleSaveWorkspace}
                      disabled={workspaceSaving || !workspaceName}
                      className="h-9 px-5 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      {workspaceSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (workspaceSuccess ? <><Check className="w-4 h-4" /> Saved</> : 'Rename Workspace')}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ═══ MEMBERS TAB ═══ */}
            {activeTab === 'members' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Members</h2>
                  <p className="text-[12px] text-[#9ca3af]">Invite and manage workspace users.</p>
                </div>
                
                <form onSubmit={handleAddMember} className="space-y-2">
                  <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Invite Member</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="name@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium outline-none transition-all min-w-0"
                    />
                    <button 
                      type="submit"
                      disabled={inviting || !inviteEmail}
                      className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50 shrink-0"
                    >
                      {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
                    </button>
                  </div>
                  {inviteFeedback && (
                    <p className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg ${inviteFeedback.startsWith('✓') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                      {inviteFeedback}
                    </p>
                  )}
                </form>

                <div className="pt-3">
                  <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Active ({members.length})</h3>
                  
                  {membersLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
                    </div>
                  ) : (
                    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden divide-y divide-[#f3f4f6]">
                      {members.map(member => (
                        <div key={member.user_id} className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#fafafa] transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a73e8] to-[#4cc9f0] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                              {member.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-[#1a1a1a] truncate">{member.profiles?.display_name || 'Anonymous'}</p>
                              <p className="text-[11px] text-[#9ca3af] truncate">{member.profiles?.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f3f4f6] text-[#6b7280] rounded uppercase tracking-wider">
                              {member.role}
                            </span>
                            {member.user_id !== userId && (
                              <button 
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
