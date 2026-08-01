import { FolderTree, ShieldCheck, Smartphone, Layers } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
            Everything you need. Secured natively.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Experience an intuitive nested environment built on top of robust row-level security. Work confidently from anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6">
              <FolderTree size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Hierarchical Spaces</h3>
            <p className="text-slate-600">
              Create a folder-style, collapsible view listing Workspace Groups and their specific Workspaces.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h3>
            <p className="text-slate-600">
              Built on strict Row-Level Security (RLS). Group Admins securely manage only what belongs to them.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Admin Command Center</h3>
            <p className="text-slate-600">
              Smooth modals for creating groups, inviting members, and renaming workspaces all from one hub.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Mobile Native (iOS)</h3>
            <p className="text-slate-600">
              Not just responsive web. ThinkSoul is exported as a high-performance native iOS app via Capacitor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
