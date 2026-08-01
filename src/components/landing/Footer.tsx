import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">
                T
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">ThinkSoul</span>
            </Link>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Web App</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">iOS App</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Security</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Solutions</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Enterprise</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Startups</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Agencies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">About Us</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Careers</Link></li>
              <li><Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">Terms & Privacy</Link></li>
            </ul>
          </div>

        </div>
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} ThinkSoul. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-400 hover:text-slate-900 cursor-pointer">
             English (US)
          </div>
        </div>
      </div>
    </footer>
  );
}
