import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white text-center pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
          ✨ Interactive Demo Platform
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl mb-6">
          The workspace hierarchy that scales with you.
        </h1>
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 mb-10">
          Centralize your teams, secure your data, and manage custom nested workspaces. ThinkSoul is the robust collaboration platform offering granular access control across web and iOS.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-800 transition-colors shadow-md">
            <Play className="h-4 w-4 fill-white" />
            Try Live Demo
          </Link>
          <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-6 py-3.5 text-base font-medium text-slate-700 hover:bg-gray-50 transition-colors">
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Interactive Dashboard Preview Banner */}
        <div className="mt-16 sm:mt-20 w-full max-w-5xl mx-auto drop-shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 text-white p-8 sm:p-12 text-left relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
              <span className="ml-4 text-xs font-mono text-slate-400">ThinkSoul LMS — Workspace Preview</span>
            </div>
            <Link href="/dashboard" className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors">
              Launch Live App →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Notion-Style Editor</div>
              <h3 className="text-lg font-bold text-white mb-2">Block-Based Logging</h3>
              <p className="text-sm text-slate-300">Rich-text documentation with nested pages, icons, and embedded media assets.</p>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Kanban & Calendar</div>
              <h3 className="text-lg font-bold text-white mb-2">Sprint Management</h3>
              <p className="text-sm text-slate-300">Drag and drop task boards with status filtering, priorities, and deadlines.</p>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Multi-Tenant RBAC</div>
              <h3 className="text-lg font-bold text-white mb-2">Incubator Hierarchy</h3>
              <p className="text-sm text-slate-300">Organize 300-400 startup projects into structured cohort groups with role permissions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
