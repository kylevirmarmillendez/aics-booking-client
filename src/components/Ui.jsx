import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Info } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-dswd-blue/65">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-dswd-blue text-white shadow-sm hover:bg-dswd-blue-dark focus-visible:ring-dswd-blue/30',
    secondary: 'border border-dswd-blue/20 bg-white text-slate-700 hover:border-dswd-blue/40 hover:bg-dswd-blue/[0.03]',
    danger: 'bg-dswd-red text-white hover:bg-dswd-red-dark'
  };
  return (
    <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-dswd-blue/15 bg-white shadow-card ${className}`}>{children}</section>;
}

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Pending: 'bg-dswd-yellow-soft text-slate-700 ring-dswd-yellow/70',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/10'
};

export function StatusBadge({ status }) {
  const Icon = status === 'Active' ? CircleCheck : status === 'Pending' ? Info : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status] ?? statusStyles.Inactive}`}>
      <Icon size={13} aria-hidden="true" />{status}
    </span>
  );
}

export function FormField({ label, hint, error, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-dswd-red" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-dswd-red"><AlertCircle size={13} />{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
      <input className={`min-h-11 w-full rounded-xl border border-dswd-blue/20 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-dswd-blue focus:outline-none focus:ring-4 focus:ring-dswd-blue/10 ${Icon ? 'pl-10' : ''} ${className}`} {...props} />
    </div>
  );
}

export function SelectInput({ children, className = '', ...props }) {
  return (
    <div className="relative">
      <select className={`min-h-11 w-full appearance-none rounded-xl border border-dswd-blue/20 bg-white px-3.5 pr-10 text-sm text-slate-800 transition focus:border-dswd-blue focus:outline-none focus:ring-4 focus:ring-dswd-blue/10 ${className}`} {...props}>{children}</select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </div>
  );
}

export function Alert({ children, variant = 'error' }) {
  const success = variant === 'success';
  const Icon = success ? Check : AlertCircle;
  return (
    <div role={success ? 'status' : 'alert'} className={`flex gap-3 rounded-xl border p-4 text-sm ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-dswd-red/20 bg-dswd-red/[0.05] text-dswd-red-dark'}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Pagination({ page, pageCount, onChange, itemCount, pageSize }) {
  if (pageCount <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, itemCount);
  return (
    <div className="flex flex-col gap-3 border-t border-dswd-blue/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of <span className="font-semibold text-slate-700">{itemCount}</span> users</p>
      <div className="flex items-center gap-2" aria-label="Pagination">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-dswd-blue/15 px-3 text-sm font-medium text-slate-600 hover:bg-dswd-blue/[0.03] disabled:opacity-40"><ChevronLeft size={16} />Previous</button>
        <span className="px-2 text-sm font-semibold text-dswd-blue">{page} / {pageCount}</span>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page === pageCount} className="inline-flex h-9 items-center gap-1 rounded-lg border border-dswd-blue/15 px-3 text-sm font-medium text-slate-600 hover:bg-dswd-blue/[0.03] disabled:opacity-40">Next<ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
