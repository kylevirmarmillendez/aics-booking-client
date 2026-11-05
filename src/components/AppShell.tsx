'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck, UsersRound } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#2e3192]/15 bg-white">
        <div className="flex h-[74px] w-full items-center justify-between px-4 sm:px-7 lg:px-10">
          <Link href="/users" className="flex items-center gap-3" aria-label="DSWD User Management home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2e3192] text-[#fef200]"><Building2 size={22} /></span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-800">DSWD <span className="font-medium text-slate-500">| User Management</span></span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Department of Social Welfare and Development</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full bg-[#fff9b8] px-3 py-2 text-xs font-semibold text-slate-700 sm:flex">
            <ShieldCheck size={15} className="text-[#2e3192]" /> Secure administrator workspace
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-74px)] w-full lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#2e3192]/15 bg-white/70 p-5 lg:block">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <Link href="/users" className="flex items-center gap-3 rounded-xl bg-[#2e3192] px-3 py-3 text-sm font-semibold text-white shadow-sm">
            <UsersRound size={17} /> User management
          </Link>
          <div className="mt-8 rounded-2xl border border-[#2e3192]/15 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#2e3192]"><ShieldCheck size={15} /> Access reminder</div>
            <p className="text-xs leading-5 text-slate-600">Review account roles and assigned offices regularly to support secure access.</p>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">{children}</main>
      </div>
    </>
  );
}
