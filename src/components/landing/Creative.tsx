import { Network, ServerCrash } from 'lucide-react';

export default function Creative() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-6">
              Unbreakable Network Connectivity.
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Enjoy uninterrupted productivity. ThinkSoul features built-in fallback network bridges to ensure stable communication with the database—even on unstable connections or behind strict DNS firewalls.
            </p>
            
            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <ServerCrash size={20} />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">Bypasses ISP DNS Poisoning</h3>
                  <p className="mt-1 text-slate-500">Automatically detects local connection timeouts and redirects traffic smoothly without user action.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Network size={20} />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-slate-900">SNI-Compliant Direct Tunnels</h3>
                  <p className="mt-1 text-slate-500">Maintains enterprise-grade SSL/TLS connections straight to Supabase, bypassing standard fetch failure points.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Creative Animation Graphic Placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 shadow-inner flex items-center justify-center p-8">
               <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
               <div className="relative z-10 w-full max-w-sm space-y-4">
                 <div className="h-12 w-full bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 animate-pulse">
                    <div className="h-4 w-4 bg-red-400 rounded-full"></div>
                    <div className="ml-3 h-2 w-24 bg-gray-200 rounded"></div>
                 </div>
                 <div className="h-12 w-full bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4">
                    <div className="h-4 w-4 bg-green-400 rounded-full"></div>
                    <div className="ml-3 h-2 w-32 bg-gray-200 rounded"></div>
                 </div>
                 <div className="h-12 w-full bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4">
                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
