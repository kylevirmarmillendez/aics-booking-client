'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Building2, LoaderCircle, LogOut, ShieldCheck, UsersRound } from 'lucide-react';
import { type AuthUser, getCurrentUser, signOut } from '@/lib/authApi';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register' || pathname === '/aics-appointment-booking') {
      setCheckingAuth(false);
      return;
    }

    let active = true;
    setCheckingAuth(true);
    getCurrentUser()
      .then((authenticatedUser) => {
        if (!active) return;
        if (!authenticatedUser) {
          router.replace('/login');
          return;
        }
        setUser(authenticatedUser);
        setAuthError('');
        setCheckingAuth(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : 'Unable to verify your sign-in.');
        setCheckingAuth(false);
      });
    return () => { active = false; };
  }, [pathname, router]);

  if (pathname === '/login' || pathname === '/register' || pathname === '/aics-appointment-booking') return <>{children}</>;

  if (!mounted || checkingAuth) {
    return <div className="grid min-h-screen place-items-center bg-[#f6f7ff] text-sm text-slate-500"><span className="flex items-center gap-3"><LoaderCircle size={20} className="animate-spin text-[#2e3192]" />Verifying secure session…</span></div>;
  }

  if (authError) {
    return <div className="grid min-h-screen place-items-center bg-[#f6f7ff] p-5"><div role="alert" className="max-w-lg rounded-2xl border border-[#ee1c25]/20 bg-white p-6 text-center shadow-lg"><h1 className="text-lg font-bold text-slate-800">Authentication service unavailable</h1><p className="mt-2 text-sm text-slate-600">{authError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-[#2e3192] px-4 py-2 text-sm font-bold text-white hover:bg-[#23256f]">Try again</button></div></div>;
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
      setSigningOut(false);
    }
  }

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
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-[#fff9b8] px-3 py-2 text-xs font-semibold text-slate-700 sm:flex"><ShieldCheck size={15} className="text-[#2e3192]" />{user?.fname} {user?.lname}</div>
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2e3192]/20 px-3 text-xs font-semibold text-slate-600 transition hover:border-[#ee1c25]/25 hover:bg-[#ee1c25]/[0.04] hover:text-[#b9151c] disabled:opacity-50"><LogOut size={14} />{signingOut ? 'Signing out…' : 'Sign out'}</button>
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-74px)] w-full lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#2e3192]/15 bg-white/70 p-5 lg:block">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <Link href="/users" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${pathname?.startsWith('/users') ? 'bg-[#2e3192] text-white shadow-sm' : 'text-slate-600 hover:bg-[#2e3192]/[0.05] hover:text-[#2e3192]'}`}><UsersRound size={17} /> User management</Link>
          <Link href="/analytics" className={`mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${pathname === '/analytics' ? 'bg-[#2e3192] text-white shadow-sm' : 'text-slate-600 hover:bg-[#2e3192]/[0.05] hover:text-[#2e3192]'}`}><BarChart3 size={17} /> Booking analytics</Link>
          <div className="mt-8 rounded-2xl border border-[#2e3192]/15 bg-white p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#2e3192]"><ShieldCheck size={15} /> Access reminder</div><p className="text-xs leading-5 text-slate-600">Review account roles and assigned offices regularly to support secure access.</p></div>
        </aside>
        <main className="min-w-0 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">{children}</main>
      </div>
    </>
  );
}
