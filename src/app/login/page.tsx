'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff, ChevronLeft, AlertCircle, CheckCircle2, ShieldCheck, Building2, X } from 'lucide-react'
import Image from 'next/image'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuthView = 'login' | 'forgot'

export default function LoginPage() {
  const [view, setView] = useState<AuthView>('login')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Lazy client: only create when the user actually interacts (clicks login/forgot)
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  const startCooldown = () => {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStatus(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = getSupabase()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      window.location.href = '/dashboard/'
    } catch (err: any) {
      setError('Connection failed. Please check your internet.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (cooldown > 0) return

    setLoading(true)
    setError(null)
    setStatus(null)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string).trim()

    try {
      const supabase = getSupabase()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setStatus('Link sent! Check your inbox.')
        startCooldown()
      }
    } catch (err: any) {
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div suppressHydrationWarning className="min-h-screen flex relative overflow-hidden bg-white selection:bg-zinc-200 selection:text-zinc-900 antialiased font-sans">
      
      {/* STATUS PILLS */}
      <div suppressHydrationWarning className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[320px] pointer-events-none">
        {error && (
          <div className="bg-white border text-center border-zinc-200 shadow-xl rounded-2xl px-5 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[12px] font-bold text-zinc-900 uppercase tracking-tight">{error}</span>
          </div>
        )}
        {status && (
          <div className="bg-white border text-center border-zinc-200 shadow-xl rounded-2xl px-5 py-3 flex items-center justify-center gap-3 animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[12px] font-bold text-zinc-900 uppercase tracking-tight">{status}</span>
          </div>
        )}
      </div>

      {/* LEFT PANE / MOBILE BACKGROUND */}
      <div className="absolute inset-0 md:relative md:w-[70%] lg:w-[70%] xl:w-[70%] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white flex flex-col items-center justify-center z-0 overflow-hidden">
        
        {/* Abstract Background Elements (Soft Orbs) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-700/20 blur-[100px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-600/20 blur-[100px] mix-blend-screen pointer-events-none" />

        {/* Mobile Decorative Waves */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-10">
           <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
             <path fill="white" className="opacity-[0.03]" d="M0,100 C30,-30 70,130 100,-30 L100,100 L0,100 Z" />
             <path fill="white" className="opacity-[0.05]" d="M0,100 C30,-10 70,110 100,-10 L100,100 L0,100 Z" />
             <path fill="white" className="opacity-[0.08]" d="M0,100 C30,10 70,90 100,10 L100,100 L0,100 Z" />
           </svg>
        </div>

        {/* Content Box (Hidden on Mobile entirely to keep focus on form) */}
        <div className="relative z-20 hidden md:flex flex-col items-center text-center px-6 max-w-xl">
          {/* Logo */}
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl mb-10">
            <div className="relative w-12 h-12 lg:w-14 lg:h-14 overflow-hidden rounded-xl">
              <Image
                src="/assets/ThinkSoul.jpg"
                alt="ThinkSoul Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-4">
              ThinkSoul
            </h1>
            <p className="text-zinc-400 text-sm font-medium max-w-[280px] mx-auto">
              Secure access to your learning management system and workspaces.
            </p>

            {/* Desktop Footer Stats */}
            <div className="flex items-center justify-center gap-6 mt-16 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>Secure Access</span>
              </div>
              <div className="w-[1px] h-4 bg-zinc-700" />
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span>LMS Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE (FORM AREA) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-transparent md:bg-white min-h-[100dvh] md:min-h-0 w-full">
        
        {/* Decorative Multi-Layer SVG Wave */}
        <div className="hidden md:block absolute left-[1px] inset-y-0 h-full w-[150px] lg:w-[250px] pointer-events-none z-0" style={{ transform: 'translateX(-100%)' }}>
           <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
             <path fill="white" className="opacity-5" d="M100,0 C-30,30 130,70 -30,100 L100,100 Z" />
             <path fill="white" className="opacity-10" d="M100,0 C-10,30 110,70 -10,100 L100,100 Z" />
             <path fill="white" className="opacity-20" d="M100,0 C10,30 90,70 10,100 L100,100 Z" />
             <path fill="white" className="opacity-40" d="M100,0 C30,30 70,70 30,100 L100,100 Z" />
             <path fill="white" className="opacity-100" d="M100,0 C50,30 50,70 50,100 L100,100 Z" />
           </svg>
        </div>

        {/* White Card Container */}
        <div className="bg-white rounded-[32px] md:rounded-none w-full max-w-sm sm:max-w-md md:max-w-[400px] xl:max-w-[440px] p-8 sm:p-10 md:p-0 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.4)] md:shadow-none flex flex-col justify-center relative">
          
          {/* Logo (Mobile Only, Inside the White Card) */}
          <div className="flex md:hidden justify-center mb-6">
            <div className="w-16 h-16 rounded-[20px] bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl">
                <Image
                  src="/assets/ThinkSoul.jpg"
                  alt="ThinkSoul Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="mb-8 md:mb-12 text-center md:text-left">
            <h1 className="text-2xl md:text-[28px] lg:text-3xl font-bold text-zinc-900 tracking-tight mb-3">
              {view === 'login' ? 'Sign in to your account' : 'Reset your password'}
            </h1>
            <p className="text-sm font-medium text-zinc-500">
              {view === 'login' 
                ? 'Enter your credentials to access ThinkSoul.' 
                : 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {/* FORM: Login */}
          {view === 'login' ? (
            <form suppressHydrationWarning onSubmit={handleLogin} className="space-y-6">
              
              <div suppressHydrationWarning className="space-y-2">
                <label htmlFor="email" className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                  Email ID
                </label>
                <div suppressHydrationWarning className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    suppressHydrationWarning
                    placeholder="name@company.com"
                    className="w-full h-11 pl-8 pr-4 bg-transparent border-b border-zinc-200 text-zinc-900 text-sm font-semibold focus:border-zinc-900 transition-all placeholder-zinc-300 outline-none pb-1"
                  />
                </div>
              </div>

              <div suppressHydrationWarning className="space-y-2 pt-2">
                <label htmlFor="password" suppressHydrationWarning className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                  Password
                </label>
                <div suppressHydrationWarning className="relative group">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    suppressHydrationWarning
                    placeholder="••••••••"
                    className="w-full h-11 pl-8 pr-12 bg-transparent border-b border-zinc-200 text-zinc-900 text-[15px] font-bold tracking-widest focus:border-zinc-900 transition-all placeholder-zinc-300 outline-none pb-1"
                  />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative flex items-center justify-center w-[18px] h-[18px]">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-[18px] h-[18px] border-2 border-zinc-300 rounded-[5px] checked:bg-zinc-900 checked:border-zinc-900 transition-all cursor-pointer"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <CheckCircle2 className="absolute w-[14px] h-[14px] text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[13px] font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors select-none">Remember Me</span>
                </label>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setView('forgot')}
                  className="text-[13px] font-bold text-zinc-900 hover:text-zinc-500 transition-colors cursor-pointer text-left sm:text-right"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="w-full h-14 mt-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[15px] rounded-[14px] shadow-[0_8px_20px_rgb(24,24,27,0.2)] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          ) : (
            /* FORM: Forgot */
            <form suppressHydrationWarning onSubmit={handleForgotPassword} className="space-y-6">
              <div suppressHydrationWarning className="space-y-2">
                <label htmlFor="recovery-email" className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                  Email ID
                </label>
                <div suppressHydrationWarning className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="w-full h-11 pl-8 pr-4 bg-transparent border-b border-zinc-200 text-zinc-900 text-sm font-semibold focus:border-zinc-900 transition-all placeholder-zinc-300 outline-none pb-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[15px] rounded-[14px] shadow-[0_8px_20px_rgb(24,24,27,0.2)] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full h-12 text-zinc-500 font-bold text-[13px] rounded-[14px] hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* LOWER FOOTER */}
          <div className="mt-14 text-center space-y-6">
            <button 
              suppressHydrationWarning
              onClick={() => setShowHelpModal(true)}
              className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-widest cursor-pointer"
            >
              <span>&#10042;</span> NEED HELP
            </button>
            <div className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">
              POWERED BY <span className="text-zinc-600">THINKSOUL SOLUTIONS</span>
            </div>
          </div>

        </div>
      </div>

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              suppressHydrationWarning
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center w-12 h-12 bg-zinc-100 rounded-full mb-5">
              <Mail className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">Need Assistance?</h3>
            <p className="text-sm font-medium text-zinc-500 mb-8 leading-relaxed">
              If you're having trouble logging in or need to request access, our support team is ready to help.
            </p>
            <button 
              suppressHydrationWarning
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "mailto:contact@thinksoul.in";
              }}
              className="w-full flex items-center justify-center h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] rounded-xl transition-all shadow-[0_8px_20px_rgb(24,24,27,0.2)] cursor-pointer"
            >
              contact@thinksoul.in
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
