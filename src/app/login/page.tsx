'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { AuthApiError, getCurrentUser, signIn } from '@/lib/authApi';
import DswdLogo from '@/components/DswdLogo';

type LoginErrors = { email?: string; password?: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.replace('/users');
    }).catch(() => undefined);
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address or username.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice('Please review the highlighted fields.');
      return;
    }
    setSubmitting(true);
    setNotice('');
    try {
      await signIn(email.trim(), password);
      router.replace('/users');
      router.refresh();
    } catch (error) {
      setNotice(error instanceof AuthApiError ? error.message : 'Unable to sign in. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7ff]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-36 -top-40 h-[480px] w-[480px] rounded-full border-[80px] border-[#2e3192]/[0.035]" />
        <div className="absolute -bottom-48 right-[27%] h-[560px] w-[560px] rounded-full bg-[#fff9b8]/45 blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-[#2e3192]/10 bg-white/90 backdrop-blur">
        <div className="flex h-[76px] w-full items-center justify-between px-5 sm:px-8 lg:px-12 2xl:px-16">
          <Link href="/login" className="flex items-center gap-3" aria-label="DSWD portal home">
            <DswdLogo />
            <span><span className="block text-sm font-extrabold tracking-tight text-slate-800">DSWD <span className="font-medium text-slate-500">| User Portal</span></span><span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.17em] text-[#2e3192]/65">Department of Social Welfare and Development</span></span>
          </Link>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><ShieldCheck size={16} className="text-[#2e3192]" /> Official workforce portal</div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-76px)] w-full items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <section className="mx-auto w-full max-w-xl">
          <div className="mb-6 text-center lg:hidden"><DswdLogo className="mx-auto mb-4 h-14 w-14" /><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2e3192]/70">AICS Booking & User Services</p></div>
          <div className="rounded-[26px] border border-[#2e3192]/15 bg-white p-6 shadow-[0_24px_70px_rgba(46,49,146,0.12)] sm:p-9">
            <div className="mb-7"><div className="mb-5 hidden h-1.5 w-12 rounded-full bg-[#fef200] lg:block" /><p className="text-sm font-bold text-[#2e3192]">Welcome back</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-800">Sign in to your account</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use your official DSWD account credentials to continue.</p></div>

            {notice && <div role={Object.keys(errors).length ? 'alert' : 'status'} className={`mb-5 flex gap-3 rounded-xl border p-3.5 text-sm leading-5 ${Object.keys(errors).length ? 'border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] text-[#b9151c]' : 'border-[#2e3192]/15 bg-[#f6f7ff] text-slate-700'}`}><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#2e3192]" /><p>{notice}</p></div>}

            <form onSubmit={submit} noValidate className="space-y-5">
              <div><label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address or username</label><div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-email" name="login" type="text" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); setNotice(''); }} placeholder="you@dswd.gov.ph or username" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className={`h-12 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10 ${errors.email ? 'border-[#ee1c25]/50' : 'border-[#2e3192]/20'}`} /></div>{errors.email && <p id="email-error" className="mt-1.5 text-xs font-medium text-[#b9151c]">{errors.email}</p>}</div>

              <div><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="login-password" className="text-sm font-semibold text-slate-700">Password</label><button type="button" onClick={() => setNotice('For password assistance, please contact your office system administrator.')} className="text-xs font-semibold text-[#2e3192] hover:text-[#23256f]">Forgot password?</button></div><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); setNotice(''); }} placeholder="Enter your password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className={`h-12 w-full rounded-xl border bg-white pl-10 pr-12 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10 ${errors.password ? 'border-[#ee1c25]/50' : 'border-[#2e3192]/20'}`} /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#2e3192]/[0.05] hover:text-[#2e3192]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p id="password-error" className="mt-1.5 text-xs font-medium text-[#b9151c]">{errors.password}</p>}</div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-[#2e3192]/30 accent-[#2e3192] focus:ring-[#2e3192]/20" />Keep me signed in</label>
              <button type="submit" disabled={submitting} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/25 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in securely'}<ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></button>
            </form>

            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#2e3192]/10" /><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Secure access</span><span className="h-px flex-1 bg-[#2e3192]/10" /></div>
            <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2e3192]" />Your credentials should never be shared with another person.</p>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">Need access? <Link href="/register" className="font-semibold text-[#2e3192] hover:text-[#23256f]">Create an account</Link></p>
          <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Republic of the Philippines <span className="mx-1.5">·</span> Department of Social Welfare and Development</p>
        </section>
      </div>
    </main>
  );
}
