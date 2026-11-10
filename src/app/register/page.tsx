'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, HeartHandshake, ShieldCheck } from 'lucide-react';
import { AuthApiError, registerAccount } from '@/lib/authApi';

type Fields = 'fname' | 'lname' | 'email' | 'username' | 'password' | 'confirmPassword';
type Values = Record<Fields, string> & { mname: string };
type Errors = Partial<Record<Fields, string>>;
const initialValues: Values = { fname: '', mname: '', lname: '', email: '', username: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!values.fname.trim()) nextErrors.fname = 'First name is required.';
    if (!values.lname.trim()) nextErrors.lname = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!/^[a-zA-Z0-9]{3,30}$/.test(values.username.trim())) nextErrors.username = 'Use 3–30 letters and numbers only.';
    if (values.password.length < 8 || values.password.length > 128 || !/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/\d/.test(values.password)) nextErrors.password = 'Use at least 8 characters with uppercase, lowercase, and a number.';
    if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage('Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      await registerAccount({
        fname: values.fname.trim(),
        mname: values.mname.trim() || undefined,
        lname: values.lname.trim(),
        email: values.email.trim().toLowerCase(),
        username: values.username.trim().toLowerCase(),
        password: values.password
      });
      router.replace('/users');
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.details?.length) {
          const backendErrors: Errors = {};
          for (const detail of error.details) {
            if (detail.field in values) backendErrors[detail.field as Fields] = detail.message;
          }
          setErrors((current) => ({ ...current, ...backendErrors }));
        }
        setMessage(error.message);
      } else {
        setMessage('Unable to create your account. Please try again.');
      }
      setSubmitting(false);
    }
  }

  const inputStyle = (invalid: boolean) => `h-11 w-full rounded-xl border ${invalid ? 'border-[#ee1c25]/50' : 'border-[#2e3192]/20'} bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10`;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f7ff] px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute -left-36 -top-40 h-[480px] w-[480px] rounded-full border-[80px] border-[#2e3192]/[0.035]" />
      <section className="relative w-full max-w-2xl rounded-[26px] border border-[#2e3192]/15 bg-white p-6 shadow-[0_24px_70px_rgba(46,49,146,0.12)] sm:p-9">
        <Link href="/login" className="inline-flex items-center gap-3" aria-label="DSWD portal login"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2e3192] text-[#fef200]"><HeartHandshake size={23} /></span><span className="text-sm font-extrabold text-slate-800">DSWD <span className="font-medium text-slate-500">| User Portal</span></span></Link>
        <div className="mb-6 mt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">New account</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">Create your account</h1><p className="mt-2 text-sm text-slate-500">Your account will be securely stored by the user service.</p></div>
        {message && <div role="alert" className={`mb-5 flex gap-3 rounded-xl border p-3.5 text-sm ${Object.keys(errors).length ? 'border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] text-[#b9151c]' : 'border-[#2e3192]/15 bg-[#f6f7ff] text-slate-700'}`}><AlertCircle size={17} className="mt-0.5 shrink-0" /><p>{message}</p></div>}
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.fname}><input value={values.fname} onChange={(event) => update('fname', event.target.value)} autoComplete="given-name" placeholder="First name" className={inputStyle(!!errors.fname)} /></Field>
          <Field label="Middle name" hint="Optional"><input value={values.mname} onChange={(event) => update('mname', event.target.value)} autoComplete="additional-name" placeholder="Middle name" className={inputStyle(false)} /></Field>
          <Field label="Last name" error={errors.lname}><input value={values.lname} onChange={(event) => update('lname', event.target.value)} autoComplete="family-name" placeholder="Last name" className={inputStyle(!!errors.lname)} /></Field>
          <Field label="Email address" error={errors.email}><input type="email" value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" placeholder="you@dswd.gov.ph" className={inputStyle(!!errors.email)} /></Field>
          <Field label="Username" hint="3–30 letters and numbers" error={errors.username}><input value={values.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" placeholder="username" className={inputStyle(!!errors.username)} /></Field>
          <Field label="Password" error={errors.password}><div className="relative"><input type={showPassword ? 'text' : 'password'} value={values.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" placeholder="Create a password" className={`${inputStyle(!!errors.password)} pr-12`} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></Field>
          <Field label="Confirm password" className="sm:col-span-2" error={errors.confirmPassword}><input type={showPassword ? 'text' : 'password'} value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} autoComplete="new-password" placeholder="Re-enter your password" className={inputStyle(!!errors.confirmPassword)} /></Field>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 sm:col-span-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2e3192]" />Passwords are hashed on the server and are never returned to the browser.</p>
          <button type="submit" disabled={submitting} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white transition hover:bg-[#23256f] disabled:opacity-60 sm:col-span-2">{submitting ? 'Creating account…' : 'Create account'}<ArrowRight size={16} /></button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-bold text-[#2e3192] hover:text-[#23256f]">Sign in</Link></p>
      </section>
    </main>
  );
}

function Field({ label, hint, error, className = '', children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>{children}{error ? <p className="mt-1 text-xs text-[#b9151c]">{error}</p> : hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}</div>;
}
