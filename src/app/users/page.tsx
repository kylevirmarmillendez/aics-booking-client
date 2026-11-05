'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownUp, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock3, Eye, Filter, LoaderCircle, Plus, Search, ShieldAlert, ShieldCheck, Trash2, UserRound, UsersRound } from 'lucide-react';
import { type UserRecord, type UserRole, type UserStatus } from '@/lib/users';
import { ApiRequestError, deleteUser, getUsers } from '@/lib/usersApi';

const PAGE_SIZE = 6;

function StatusPill({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    Active: 'bg-emerald-50 text-emerald-700 ring-emerald-700/15',
    Inactive: 'bg-[#ee1c25]/[0.07] text-[#b9151c] ring-[#ee1c25]/20',
    Pending: 'bg-[#fff9b8] text-slate-700 ring-[#fef200]/70'
  };
  const Icon = status === 'Active' ? CircleCheck : status === 'Pending' ? Clock3 : ShieldAlert;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}><Icon size={13} aria-hidden="true" />{status}</span>;
}

function initials(user: UserRecord) {
  return `${user.fname.charAt(0)}${user.lname.charAt(0)}`.toUpperCase();
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [status, setStatus] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    getUsers()
      .then((records) => { if (active) setUsers(records); })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load users from the backend.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleDelete(user: UserRecord) {
    if (!window.confirm(`Permanently delete ${user.fname} ${user.lname}?`)) return;
    setDeletingId(user.id);
    setLoadError('');
    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((record) => record.id !== user.id));
    } catch (error) {
      setLoadError(error instanceof ApiRequestError ? error.message : 'Unable to delete this user.');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = `${user.fname} ${user.mname ?? ''} ${user.lname} ${user.email} ${user.username} ${user.office}`.toLowerCase();
      return (!query || searchable.includes(query)) && (role === 'all' || user.role === role) && (status === 'all' || user.status === status);
    });
  }, [users, search, role, status]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = users.filter((user) => user.status === 'Active').length;
  const adminCount = users.filter((user) => user.role === 'admin').length;

  function updateSearch(value: string) { setSearch(value); setPage(1); }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Access administration</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-[34px]">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage staff accounts, roles, and office assignments across the department.</p>
        </div>
        <Link href="/users/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f]">
          <Plus size={17} /> Create user
        </Link>
      </div>

      <section className="mb-7 grid gap-4 sm:grid-cols-3" aria-label="User management summary">
        <SummaryCard icon={UsersRound} label="Total accounts" value={users.length} note="Across all offices" />
        <SummaryCard icon={CircleCheck} label="Active accounts" value={activeCount} note="Currently enabled" iconClass="text-emerald-700 bg-emerald-50" />
        <SummaryCard icon={ShieldCheck} label="Administrators" value={adminCount} note="Elevated access" iconClass="text-[#2e3192] bg-[#2e3192]/[0.06]" />
      </section>

      {loadError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#b9151c]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Backend request failed</p><p className="mt-1">{loadError}</p><p className="mt-1 text-xs">Confirm the Express API and MongoDB are running. See the client README for the API URL setting.</p></div></div>}

      <section className="overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#2e3192]/15 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">All users <span className="ml-1 rounded-full bg-[#2e3192]/[0.06] px-2 py-0.5 text-xs font-semibold text-[#2e3192]">{filteredUsers.length}</span></h2>
            <p className="mt-1 text-xs text-slate-500">Search and filter the user management</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-64">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <span className="sr-only">Search users</span>
              <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search name, email, office..." className="h-10 w-full rounded-xl border border-[#2e3192]/20 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10" />
            </label>
            <label className="relative">
              <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <span className="sr-only">Filter by role</span>
              <select value={role} onChange={(event) => { setRole(event.target.value as 'all' | UserRole); setPage(1); }} className="h-10 w-full appearance-none rounded-xl border border-[#2e3192]/20 bg-white pl-9 pr-9 text-sm text-slate-700 focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10 sm:w-36">
                <option value="all">All roles</option><option value="admin">Admin</option><option value="user">User</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </label>
            <label className="relative">
              <span className="sr-only">Filter by status</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value as 'all' | UserStatus); setPage(1); }} className="h-10 w-full appearance-none rounded-xl border border-[#2e3192]/20 bg-white px-3 pr-9 text-sm text-slate-700 focus:border-[#2e3192] focus:outline-none focus:ring-4 focus:ring-[#2e3192]/10 sm:w-36">
                <option value="all">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#f6f7ff] text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <tr><th className="px-5 py-3.5">User <ArrowDownUp size={12} className="ml-1 inline" /></th><th className="px-4 py-3.5">Office</th><th className="px-4 py-3.5">Role</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Last active</th><th className="px-5 py-3.5 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-[#2e3192]/[0.08]">
              {visibleUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-[#2e3192]/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff9b8] text-xs font-extrabold text-[#2e3192]">{initials(user)}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{user.fname} {user.mname ? `${user.mname} ` : ''}{user.lname}</p><p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><p className="text-sm font-medium text-slate-700">{user.office}</p><p className="mt-0.5 text-xs text-slate-500">{user.region}</p></td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-[#2e3192]/[0.07] text-[#2e3192]' : 'bg-slate-100 text-slate-600'}`}>{user.role === 'admin' ? 'Admin' : 'User'}</span></td>
                  <td className="px-4 py-4"><StatusPill status={user.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-600">{user.lastActive}</td>
                  <td className="px-5 py-4 text-right"><div className="inline-flex items-center gap-2"><button type="button" onClick={() => router.push(`/users/${encodeURIComponent(user.id)}`)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2e3192]/20 bg-white px-3 text-xs font-semibold text-[#2e3192] transition hover:bg-[#2e3192]/[0.04]"><Eye size={14} /> View profile</button><button type="button" onClick={() => handleDelete(user)} disabled={deletingId === user.id} aria-label={`Delete ${user.fname} ${user.lname}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#ee1c25]/20 text-[#b9151c] transition hover:bg-[#ee1c25]/[0.05] disabled:opacity-50">{deletingId === user.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div></td>
                </tr>
              ))}
              {!loading && visibleUsers.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#2e3192]/[0.06] text-[#2e3192]"><UserRound size={20} /></div><p className="text-sm font-semibold text-slate-700">{loadError ? 'Users could not be loaded' : 'No users match these filters'}</p><p className="mt-1 text-xs text-slate-500">{loadError ? 'Check the backend connection and refresh this page.' : 'Try another search or clear a filter.'}</p></td></tr>}
              {loading && <tr><td colSpan={6} className="px-5 py-14 text-center"><LoaderCircle size={20} className="mx-auto animate-spin text-[#2e3192]" /><p className="mt-3 text-sm text-slate-500">Loading users from the backend…</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#2e3192]/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{filteredUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filteredUsers.length)}</span> of <span className="font-semibold text-slate-700">{filteredUsers.length}</span> users</p>
          <div className="flex items-center gap-2" aria-label="Pagination controls">
            <button type="button" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/15 text-slate-600 hover:bg-[#2e3192]/[0.03] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button>
            <span className="px-2 text-xs font-semibold text-slate-600">Page {page} of {pageCount}</span>
            <button type="button" aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/15 text-slate-600 hover:bg-[#2e3192]/[0.03] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button>
          </div>
        </div>
      </section>
      <p className="mt-4 text-xs leading-5 text-slate-500">User records are loaded from the Express API and stored in MongoDB.</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, note, iconClass = 'bg-[#fff9b8] text-[#2e3192]' }: { icon: typeof UsersRound; label: string; value: number; note: string; iconClass?: string }) {
  return <div className="rounded-2xl border border-[#2e3192]/15 bg-white p-4 shadow-[0_12px_36px_rgba(46,49,146,0.04)] sm:p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}><Icon size={19} /></span></div><p className="mt-2 text-xs text-slate-500">{note}</p></div>;
}
