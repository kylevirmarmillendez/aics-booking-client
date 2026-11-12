'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronDown, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { USER_ROLE_LABELS, type UserRole, type UserStatus } from '@/lib/users';
import { ApiRequestError, createUser } from '@/lib/usersApi';
import { getOffices, type OfficeRecord } from '@/lib/officesApi';

type FormValues = {
  fname: string;
  mname: string;
  lname: string;
  email: string;
  username: string;
  phone: string;
  region: string;
  office: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
const initialValues: FormValues = { fname: '', mname: '', lname: '', email: '', username: '', phone: '', region: '', office: '', role: 'booking_officer', status: 'Active', password: '', confirmPassword: '' };

export default function UserCreatePage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [officeOptions, setOfficeOptions] = useState<OfficeRecord[]>([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [officesError, setOfficesError] = useState('');

  useEffect(() => {
    let active = true;
    getOffices()
      .then((records) => { if (active) setOfficeOptions(records.filter((office) => office.active)); })
      .catch((error: unknown) => { if (active) setOfficesError(error instanceof Error ? error.message : 'Unable to load offices.'); })
      .finally(() => { if (active) setOfficesLoading(false); });
    return () => { active = false; };
  }, []);
  const passwordChecks = [
    { label: 'At least 8 characters', valid: values.password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(values.password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(values.password) },
    { label: 'One number', valid: /\d/.test(values.password) }
  ];

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setAlert('');
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!values.fname.trim()) next.fname = 'First name is required.';
    if (!values.lname.trim()) next.lname = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^[a-zA-Z0-9]{3,30}$/.test(values.username.trim())) next.username = 'Use 3–30 letters and numbers only.';
    if (values.role === 'booking_officer' && !values.office) next.office = 'Select an assigned office.';
    if (passwordChecks.some((check) => !check.valid)) next.password = 'Meet all password requirements.';
    if (values.confirmPassword !== values.password) next.confirmPassword = 'Passwords do not match.';
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setAlert('Please review the highlighted fields before creating the account.');
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        fname: values.fname.trim(),
        mname: values.mname.trim() || undefined,
        lname: values.lname.trim(),
        email: values.email.trim().toLowerCase(),
        username: values.username.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim(),
        office: values.office,
        region: values.region,
        role: values.role,
        status: values.status
      });
      router.push('/users');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.field && error.field in values) {
          setErrors((current) => ({ ...current, [error.field as keyof FormValues]: error.message }));
        }
        if (error.errors?.length) {
          const apiErrors = error.errors.reduce<FormErrors>((result, item) => {
            if (item.field && item.field in values) result[item.field as keyof FormValues] = item.message;
            return result;
          }, {});
          setErrors((current) => ({ ...current, ...apiErrors }));
        }
        setAlert(error.message);
      } else {
        setAlert('Unable to create the account. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/users" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#2e3192]"><ArrowLeft size={16} /> Back to user directory</Link>
      <div className="mb-6"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Access administration</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Create user account</h1><p className="mt-2 text-sm leading-6 text-slate-600">Add a staff member and assign their department access.</p></div>

      {alert && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#b9151c]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{alert}</p></div>}

      <form onSubmit={submit} noValidate className="space-y-5">
        <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><UserRound size={18} /></span><div><h2 className="text-base font-bold text-slate-800">Personal details</h2><p className="mt-0.5 text-xs text-slate-500">Enter the user's name and contact information</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" required error={errors.fname}><input value={values.fname} onChange={(e) => update('fname', e.target.value)} autoComplete="given-name" placeholder="e.g. Maria" className={inputClass(!!errors.fname)} /></Field>
            <Field label="Middle name" hint="Optional"><input value={values.mname} onChange={(e) => update('mname', e.target.value)} autoComplete="additional-name" placeholder="e.g. Santos" className={inputClass(false)} /></Field>
            <Field label="Last name" required error={errors.lname}><input value={values.lname} onChange={(e) => update('lname', e.target.value)} autoComplete="family-name" placeholder="e.g. Reyes" className={inputClass(!!errors.lname)} /></Field>
            <Field label="Email address" required error={errors.email}><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" value={values.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" placeholder="name@dswd.gov.ph" className={`${inputClass(!!errors.email)} pl-10`} /></div></Field>
            <Field label="Username" required error={errors.username} hint="3–30 letters and numbers"><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span><input value={values.username} onChange={(e) => update('username', e.target.value)} autoComplete="username" placeholder="username" className={`${inputClass(!!errors.username)} pl-9`} /></div></Field>
            <Field label="Phone number" hint="Optional"><input type="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" placeholder="+63 9XX XXX XXXX" className={inputClass(false)} /></Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><KeyRound size={18} /></span><div><h2 className="text-base font-bold text-slate-800">Account access</h2><p className="mt-0.5 text-xs text-slate-500">Set a role, status, and initial password</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Role" required><Select value={values.role} onChange={(value) => { update('role', value as UserRole); if (value !== 'booking_officer') { update('office', ''); update('region', ''); } }}>{Object.entries(USER_ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}</Select></Field>
            {values.role === 'booking_officer' && <Field label="Assigned office" required error={errors.office} className="sm:col-span-2"><Select value={values.office} invalid={!!errors.office} disabled={officesLoading || officeOptions.length === 0} onChange={(officeName) => {
              const office = officeOptions.find((item) => item.name === officeName);
              update('office', officeName);
              update('region', office?.province ?? '');
            }}>
              <option value="">{officesLoading ? 'Loading offices…' : 'Select an office'}</option>
              {officeOptions.map((office) => <option key={office.slug} value={office.name}>{office.name}{office.city ? ` — ${office.city}` : ''}</option>)}
            </Select>{officesError && <p className="mt-1.5 text-xs font-medium text-[#b9151c]">{officesError}</p>}</Field>}
            <Field label="Account status" required><Select value={values.status} onChange={(value) => update('status', value as UserStatus)}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></Select></Field>
            <Field label="Initial password" required error={errors.password} className="sm:col-span-2"><div className="relative"><input type={showPassword ? 'text' : 'password'} value={values.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" placeholder="Enter a strong password" className={`${inputClass(!!errors.password)} pr-12`} /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-[#2e3192]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{passwordChecks.map((check) => <p key={check.label} className={`flex items-center gap-2 text-xs ${check.valid ? 'text-emerald-700' : 'text-slate-400'}`}>{check.valid ? <CheckCircle2 size={14} /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />}{check.label}</p>)}</div></Field>
            <Field label="Confirm password" required error={errors.confirmPassword}><input type={showPassword ? 'text' : 'password'} value={values.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} autoComplete="new-password" placeholder="Re-enter password" className={inputClass(!!errors.confirmPassword)} /></Field>
          </div>
          <div className="mt-5 flex gap-3 rounded-xl border border-[#2e3192]/15 bg-[#f6f7ff] p-3.5 text-xs leading-5 text-slate-600"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#2e3192]" /><p>The password is sent securely to the API over this connection and hashed by the backend before storage. It is not saved by this page.</p></div>
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 pb-8 sm:flex-row"><Link href="/users" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e3192]/20 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-[#2e3192]/[0.03]">Cancel</Link><button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f] disabled:cursor-not-allowed disabled:opacity-60"><UsersRound size={17} />{submitting ? 'Creating account…' : 'Create user account'}</button></div>
      </form>
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `min-h-11 w-full rounded-xl border ${invalid ? 'border-[#ee1c25]/50' : 'border-[#2e3192]/20'} bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10`;
}

function Field({ label, required, hint, error, className = '', children }: { label: string; required?: boolean; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><label className="mb-2 block text-sm font-semibold text-slate-700">{label}{required && <span className="ml-1 text-[#ee1c25]" aria-hidden="true">*</span>}</label>{children}{error ? <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#b9151c]"><AlertCircle size={13} />{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}</div>;
}

function Select({ value, onChange, children, invalid = false, disabled = false }: { value: string; onChange: (value: string) => void; children: React.ReactNode; invalid?: boolean; disabled?: boolean }) {
  return <div className="relative"><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`min-h-11 w-full appearance-none rounded-xl border ${invalid ? 'border-[#ee1c25]/50' : 'border-[#2e3192]/20'} bg-white px-3.5 pr-10 text-sm text-slate-800 focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10 disabled:cursor-not-allowed disabled:bg-slate-100`}>{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /></div>;
}
