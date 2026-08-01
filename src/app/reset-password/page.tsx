'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [readyToVerify, setReadyToVerify] = useState(false)
  const supabase = createClient()

  const startVerification = async () => {
    setReadyToVerify(true)
    setVerifying(true)
    setError(null)

    // Check for explicit errors in URL first
    const urlParams = new URL(window.location.href)
    const errorMsg = urlParams.hash.includes('error_description') 
      ? new URLSearchParams(urlParams.hash.substring(1)).get('error_description')
      : urlParams.searchParams.get('error_description')

    if (errorMsg) {
      setError(errorMsg.replace(/\+/g, ' '))
      setVerifying(false)
      return
    }

    // Small delay and then check session
    await new Promise(r => setTimeout(r, 1000))
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      setVerifying(false)
    } else {
      setError('Invalid or expired link.')
      setVerifying(false)
    }
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords mismatch.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Min 6 characters.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/login/'
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] selection:bg-zinc-100 selection:text-zinc-900 antialiased font-sans">

      {/* PROFESSIONAL STATUS PILLS */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[320px] pointer-events-none">
        {error && (
          <div className="bg-white border-2 border-zinc-200 shadow-[4px_4px_0px_0px_rgba(228,228,231,1)] rounded-xl px-5 py-3 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[12px] font-bold text-zinc-800 uppercase tracking-tight">{error}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-[390px] p-4 relative">

        {/* BOXXY SKEUOMORPHIC CARD - EYE SOOTHING GRAY SHADOWS */}
        <div className="bg-white border-2 border-zinc-200 rounded-[20px] p-10 shadow-[8px_8px_0px_0px_rgba(228,228,231,1)] transition-all duration-500">

          {/* HEADER SECTION */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-zinc-100 shadow-[3px_3px_0px_0px_rgba(244,244,245,1)] flex items-center justify-center mb-5 overflow-hidden">
              <div className="relative w-9 h-9">
                <Image
                  src="/assets/ThinkSoul.jpg"
                  alt="ThinkSoul Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Reset Password
            </h1>
          </div>

          {!readyToVerify ? (
            <div className="flex flex-col items-center py-6 animate-in slide-in-from-bottom-2 duration-500">
              <div className="w-16 h-16 rounded-xl bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(244,244,245,1)]">
                <KeyRound className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-[13px] font-medium text-zinc-500 text-center mb-10 leading-relaxed">
                Unlock your identity to set a new password. Any session established will be permanent.
              </p>
              <button
                onClick={startVerification}
                className="w-full h-12 bg-zinc-900 text-white font-bold text-sm rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(228,228,231,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(228,228,231,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all cursor-pointer"
              >
                Identify Yourself
              </button>
            </div>
          ) : verifying ? (
            <div className="flex flex-col items-center py-10 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-300 mb-4" />
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Verifying Identity...</p>
            </div>
          ) : error && !success ? (
            <div className="flex flex-col items-center py-6 animate-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(254,226,226,1)]">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-[13px] font-medium text-red-500 text-center mb-10 leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => window.location.href = '/login/'}
                className="w-full h-12 bg-zinc-900 text-white font-bold text-sm rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(228,228,231,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(228,228,231,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          ) : !success ? (
            <form onSubmit={handleReset} className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full h-11 pl-11 pr-11 rounded-xl bg-zinc-50/50 border-2 border-zinc-100 text-sm font-medium focus:border-zinc-900 focus:bg-white transition-all placeholder-zinc-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-900 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full h-11 pl-11 pr-11 rounded-xl bg-zinc-50/50 border-2 border-zinc-100 text-sm font-medium focus:border-zinc-900 focus:bg-white transition-all placeholder-zinc-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-zinc-900 text-white font-bold text-sm rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(228,228,231,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(228,228,231,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:bg-zinc-100 disabled:border-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(240,253,244,1)]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 mb-2">Saved</h2>
              <p className="text-sm text-zinc-400 mb-10 leading-relaxed">
                Returning...
              </p>
              <div className="w-full h-1.5 bg-zinc-50 border border-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 animate-[progress_3s_linear]" />
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase italic">&copy; {new Date().getFullYear()} ThinkSoul Co.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
