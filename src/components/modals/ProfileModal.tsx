'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, User, Briefcase, Loader2, Check } from 'lucide-react'

const STAGES = [
  { value: 1, label: 'Ideation' },
  { value: 2, label: 'Market Research' },
  { value: 3, label: 'Problem Validation' },
  { value: 4, label: 'MVP Design' },
  { value: 5, label: 'Prototype Development' },
  { value: 6, label: 'Beta Testing' },
  { value: 7, label: 'Product Launch' },
  { value: 8, label: 'Early Traction' },
  { value: 9, label: 'Growth & Scaling' },
  { value: 10, label: 'Startup Registration' },
]

interface ProfileModalProps {
  userId: string
  onClose: () => void
}

export function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'personal' | 'project'>('personal')

  // Personal
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [personalSaving, setPersonalSaving] = useState(false)
  const [personalSuccess, setPersonalSuccess] = useState(false)

  // Project
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [currentStage, setCurrentStage] = useState<number | ''>('')
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectSuccess, setProjectSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, display_name, phone, about_me')
        .eq('id', userId)
        .single()

      if (profile) {
        setEmail(profile.email || '')
        setFullName(profile.full_name || '')
        setDisplayName(profile.display_name || '')
        setPhone(profile.phone || '')
        setAboutMe(profile.about_me || '')
      }

      // Fetch project details
      const { data: project } = await supabase
        .from('project_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (project) {
        setProjectId(project.id)
        setProjectName(project.project_name || '')
        setProjectDescription(project.project_description || '')
        setStartDate(project.start_date || '')
        setCurrentStage(project.current_stage || '')
      }

      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleSavePersonal = async () => {
    setPersonalSaving(true)
    await supabase.from('profiles').update({
      full_name: fullName,
      display_name: displayName,
      phone,
      about_me: aboutMe,
    }).eq('id', userId)
    setPersonalSaving(false)
    setPersonalSuccess(true)
    setTimeout(() => setPersonalSuccess(false), 2000)
  }

  const handleSaveProject = async () => {
    setProjectSaving(true)
    
    const projectData = {
      user_id: userId,
      project_name: projectName,
      project_description: projectDescription,
      start_date: startDate || null,
      current_stage: currentStage || null,
    }

    if (projectId) {
      await supabase.from('project_details').update(projectData).eq('id', projectId)
    } else {
      const { data } = await supabase.from('project_details').insert(projectData).select('id').single()
      if (data) setProjectId(data.id)
    }

    setProjectSaving(false)
    setProjectSuccess(true)
    setTimeout(() => setProjectSuccess(false), 2000)
  }

  const tabItems = [
    { id: 'personal' as const, icon: User, label: 'Personal' },
    { id: 'project' as const, icon: Briefcase, label: 'Project' },
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-[92vh] md:h-auto md:max-h-[85vh] md:max-w-[680px] md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden rounded-t-2xl md:rounded-2xl border border-black/5 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── Sidebar Navigation ── */}
        <div className="w-full md:w-[180px] bg-[#fafafa] border-b md:border-b-0 md:border-r border-[#f0f0f0] flex flex-col shrink-0">
          {/* Mobile header */}
          <div className="flex md:hidden items-center justify-between px-4 pt-3 pb-1">
            <h2 className="text-[15px] font-bold text-[#1a1a1a]">My Profile</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-[#9ca3af]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile: horizontal pills */}
          <div className="flex md:hidden gap-1 px-3 pb-2.5 overflow-x-auto no-scrollbar">
            {tabItems.map(tab => (
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

          {/* Desktop: vertical sidebar */}
          <div className="hidden md:flex flex-col flex-1 p-3 gap-0.5">
            <div className="px-2 py-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-[#b0b0b0] uppercase tracking-[0.08em]">Section</span>
            </div>
            {tabItems.map(tab => (
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
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
          {/* Desktop close */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-4 right-4 w-8 h-8 items-center justify-center hover:bg-[#f3f4f6] rounded-lg transition-colors text-[#9ca3af] z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
              </div>
            ) : activeTab === 'personal' ? (
              /* ═══ PERSONAL TAB ═══ */
              <div className="space-y-5 animate-in fade-in duration-300 max-w-[440px]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Personal Info</h2>
                  <p className="text-[12px] text-[#9ca3af]">Update your identity and contact details.</p>
                </div>

                <div className="space-y-4">
                  {/* Email (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Email</label>
                    <input 
                      type="email" value={email} disabled
                      className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 text-[13px] font-medium text-[#9ca3af] cursor-not-allowed opacity-60"
                    />
                  </div>

                  {/* Name row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Display Name</label>
                      <input 
                        type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Phone</label>
                    <input 
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                    />
                  </div>

                  {/* About */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">About Me</label>
                    <textarea 
                      value={aboutMe} onChange={(e) => setAboutMe(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg p-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSavePersonal}
                  disabled={personalSaving}
                  className="h-9 px-5 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {personalSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : personalSuccess ? (
                    <><Check className="w-4 h-4 text-green-400" /> Saved</>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            ) : (
              /* ═══ PROJECT TAB ═══ */
              <div className="space-y-5 animate-in fade-in duration-300 max-w-[440px]">
                <div>
                  <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-0.5">Project Details</h2>
                  <p className="text-[12px] text-[#9ca3af]">Define your current venture&apos;s core metrics.</p>
                </div>

                <div className="space-y-4">
                  {/* Project Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Project Name</label>
                    <input 
                      type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter name"
                      className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Description</label>
                    <textarea 
                      value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="What are you building?"
                      rows={3}
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg p-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Date + Stage row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Start Date</label>
                      <input 
                        type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Milestone</label>
                      <select 
                        value={currentStage} onChange={(e) => setCurrentStage(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-9 bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#1a73e8] focus:bg-white rounded-lg px-3 text-[13px] font-medium text-[#1a1a1a] outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select…</option>
                        {STAGES.map(s => (
                          <option key={s.value} value={s.value}>{s.value}. {s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {currentStage && (
                    <div className="p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#1a73e8] uppercase">Progress</span>
                        <span className="text-[10px] font-bold text-[#9ca3af]">{Math.round((Number(currentStage)/10)*100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-[#e5e7eb]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#1a73e8] to-[#4cc9f0] transition-all duration-700 ease-out rounded-full"
                          style={{ width: `${(Number(currentStage) / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-bold text-[#374151] text-center">
                        {STAGES.find(s => s.value === currentStage)?.label}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSaveProject}
                  disabled={projectSaving}
                  className="h-9 px-5 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {projectSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : projectSuccess ? (
                    <><Check className="w-4 h-4 text-green-400" /> Saved</>
                  ) : (
                    'Save Project'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
