'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface TopbarProps {
  pageName: string
  pageIcon: string | null
  workspaceName: string
  userDisplayName: string
  isAdmin: boolean
  onOpenProfile: () => void
  onToggleSidebar?: () => void
}

export function Topbar({ pageName, pageIcon, workspaceName, userDisplayName, isAdmin, onOpenProfile, onToggleSidebar }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = userDisplayName
    ? userDisplayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      } else {
        setMenuOpen(false)
        router.push('/login')
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="h-11 flex items-center justify-between px-3 md:px-4 border-b border-[#f3f4f6] bg-white flex-shrink-0 relative z-50">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-[#9ca3af] min-w-0">
        {/* Hamburger — mobile only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f3f4f6] text-[#5f6368] -ml-1 mr-1 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="truncate max-w-[100px] md:max-w-[140px] font-medium">{workspaceName}</span>
        <span className="text-[#d1d5db]">/</span>
        <span className="flex items-center gap-1.5 text-[#37352f] font-medium truncate max-w-[120px] md:max-w-[240px]">
          {pageIcon && <span className="text-[14px] leading-none">{pageIcon}</span>}
          {pageName || 'Untitled'}
        </span>
      </div>

      {/* Right: User Avatar */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#4cc9f0] flex items-center justify-center text-white text-[11px] font-bold cursor-pointer hover:ring-2 hover:ring-[#1a73e8]/20 transition-all"
          title={userDisplayName}
        >
          {initials}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-9 w-[180px] bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                setMenuOpen(false)
                onOpenProfile()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#37352f] hover:bg-[#f3f4f6] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#9ca3af]" />
              My Profile
            </button>
            <div className="h-px bg-[#e5e7eb] my-1"></div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#dc2626] hover:bg-[#fef2f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

