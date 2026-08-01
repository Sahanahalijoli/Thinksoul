'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">
              T
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">ThinkSoul</span>
          </Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm">
            Try Live Demo
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Log in
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <Link href="/dashboard" className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors">
            Try Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}
