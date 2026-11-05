'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, AtSign, Building2, CalendarDays, Check, ChevronRight, Clock3, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { type UserRecord, type UserStatus } from '@/lib/users';
import { getUser } from '@/lib/usersApi';

const statusStyles: Record<UserStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-700/15',
  Inactive: 'bg-[#ee1c25]/[0.07] text-[#b9151c] ring-[#ee1c25]/20',
  Pending: 'bg-[#fff9b8] text-slate-700 ring-[#fef200]/70'
};

export default function UserProfileViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoaded(false);
    getUser(id)
      .then((record) => { if (active) setUser(record); })
      .catch((error: unknown) => {
        if (active) {
          setUser(null);
          setLoadError(error instanceof Error ? error.message : 'Unable to load this user from the backend.');
        }
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [id]);

  if (!loaded) return <div className="rounded-2xl border border-[#2e3192]/15 bg-white p-8 text-sm text-slate-500">Loading user profile…</div>;
  if (!user) {
    return <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-8 text-center shadow-[0_12px_36px_rgba(46,49,146,0.06)]"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff9b8] text-[#2e3192]"><UserRound size={22} /></div><h1 className="mt-4 text-xl font-bold text-slate-800">{loadError && !loadError.includes('not found') ? 'Unable to load profile' : 'User not found'}</h1><p className="mt-2 text-sm text-slate-500">{loadError || 'This account may have been removed or the profile link is invalid.'}</p>{loadError && !loadError.includes('not found') && <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#b9151c]"><AlertCircle size={13} />Check that the API and MongoDB are running.</p>}<Link href="/users" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2e3192] hover:text-[#23256f]"><ArrowLeft size={16} /> Return to user management</Link></section>;
  }

  const fullName = [user.fname, user.mname, user.lname].filter(Boolean).join(' ');
  const active = user.status === 'Active';

  return (
    <div>
      <button type="button" onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#2e3192]"><ArrowLeft size={16} /> Back to users</button>
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="h-28 bg-[#2e3192] sm:h-36"><div className="h-full bg-[radial-gradient(circle_at_85%_10%,rgba(254,242,0,0.23),transparent_30%),linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.08)_60%,transparent_60%)]" /></div>
        <div className="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div className="-mt-10 flex min-w-0 items-end gap-4 sm:-mt-12">
            <div className="grid h-[82px] w-[82px] shrink-0 place-items-center rounded-2xl border-4 border-white bg-[#fff9b8] text-2xl font-extrabold text-[#2e3192] shadow-sm sm:h-24 sm:w-24">{user.fname[0]}{user.lname[0]}</div>
            <div className="min-w-0 pb-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2e3192]">{user.id}</p><h1 className="truncate text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">{fullName}</h1><p className="mt-1 truncate text-sm text-slate-500">@{user.username} <span className="mx-1.5 text-slate-300">·</span>{user.role === 'admin' ? 'Administrator' : 'Standard user'}</p></div>
          </div>
          <div className="flex items-center gap-2 pb-1"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[user.status]}`}>{active ? <Check size={14} /> : <Clock3 size={14} />}{user.status}</span><Link href="/users" className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#2e3192]/20 px-3 text-xs font-semibold text-[#2e3192] hover:bg-[#2e3192]/[0.04]">Directory<ChevronRight size={14} /></Link></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-bold text-slate-800">Personal information</h2><p className="mt-1 text-xs text-slate-500">Account identity and contact details</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2e3192]/[0.06] text-[#2e3192]"><UserRound size={17} /></span></div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email address" value={user.email} />
              <InfoItem icon={AtSign} label="Username" value={`@${user.username}`} />
              <InfoItem icon={Phone} label="Phone number" value={user.phone || 'Not provided'} />
              <InfoItem icon={CalendarDays} label="Date added" value={user.joined} />
            </div>
          </section>
          <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-bold text-slate-800">Assigned office</h2><p className="mt-1 text-xs text-slate-500">Department location and region</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><Building2 size={17} /></span></div>
            <div className="rounded-xl border border-[#2e3192]/15 bg-[#f6f7ff] p-4"><div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[#2e3192]" /><div><p className="text-sm font-bold text-slate-800">{user.office}</p><p className="mt-1 text-xs text-slate-600">{user.region}</p><p className="mt-3 text-xs font-medium text-slate-500">Department of Social Welfare and Development</p></div></div></div>
          </section>
          <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-6">
            <div className="mb-5"><h2 className="text-base font-bold text-slate-800">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Latest account audit events</p></div>
            {user.activities.length ? <ol className="space-y-0">{user.activities.map((activity, index) => <li key={`${activity.action}-${index}`} className="relative flex gap-3 pb-5 last:pb-0"><span className="relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2e3192]/[0.06] text-[#2e3192]">{index === 0 ? <Check size={15} /> : <Clock3 size={15} />}</span>{index < user.activities.length - 1 && <span className="absolute left-4 top-8 h-full w-px bg-[#2e3192]/15" />}<div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><p className="text-sm font-semibold text-slate-800">{activity.action}</p><time className="text-xs text-slate-400">{activity.date}</time></div><p className="mt-1 text-xs leading-5 text-slate-600">{activity.detail}</p><p className="mt-1 text-[11px] text-slate-400">Source: {activity.source}</p></div></li>)}</ol> : <p className="text-sm text-slate-500">No audit activity has been recorded.</p>}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2e3192] text-[#fef200]"><ShieldCheck size={19} /></span><div><h2 className="text-base font-bold text-slate-800">Security status</h2><p className="mt-0.5 text-xs text-slate-500">Account protection overview</p></div></div>
            <div className={`rounded-xl border p-4 ${user.securityStatus === 'MFA enabled' ? 'border-emerald-200 bg-emerald-50' : 'border-[#fef200]/70 bg-[#fff9b8]/50'}`}><div className="flex items-center gap-2">{user.securityStatus === 'MFA enabled' ? <Check size={16} className="text-emerald-700" /> : <Clock3 size={16} className="text-[#2e3192]" />}<p className={`text-sm font-bold ${user.securityStatus === 'MFA enabled' ? 'text-emerald-800' : 'text-slate-800'}`}>{user.securityStatus}</p></div><p className="mt-2 text-xs leading-5 text-slate-600">{user.securityStatus === 'MFA enabled' ? 'Multi-factor authentication is enabled for this account.' : 'The user must complete account security setup after signing in.'}</p></div>
            <dl className="mt-5 space-y-4"><SecurityRow label="Account role" value={user.role === 'admin' ? 'Administrator' : 'Standard user'} /><SecurityRow label="Account status" value={user.status} /><SecurityRow label="Last activity" value={user.lastActive} /></dl>
          </section>
          <section className="rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-6"><h2 className="text-sm font-bold text-slate-800">Account reference</h2><p className="mt-2 break-all font-mono text-xs text-slate-500">{user.id}</p><div className="mt-4 border-t border-[#2e3192]/10 pt-4"><p className="text-xs leading-5 text-slate-500">For changes to access or office assignment, follow your office account administration process.</p></div></section>
        </aside>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-slate-400"><Icon size={16} /></span><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-700">{value}</p></div></div>;
}

function SecurityRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[#2e3192]/[0.08] pb-3 last:border-0 last:pb-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="text-right text-xs font-semibold text-slate-700">{value}</dd></div>;
}
