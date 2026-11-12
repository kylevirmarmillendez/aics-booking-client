'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Search, UserX } from 'lucide-react';
import { getAppointments, type AppointmentRecord, updateAppointmentStatus } from '@/lib/officesApi';

const PAGE_SIZE = 10;
type StatusFilter = 'All' | AppointmentRecord['status'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    getAppointments()
      .then((records) => { if (active) setAppointments(records); })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load appointments.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const searchable = `${appointment.appointmentCode} ${appointment.fullName} ${appointment.officeName ?? ''} ${appointment.typeOfAssistance}`.toLowerCase();
      return (!query || searchable.includes(query)) && (status === 'All' || appointment.status === status);
    });
  }, [appointments, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function markAttendance(appointment: AppointmentRecord, nextStatus: 'Arrived' | 'No-show') {
    const action = nextStatus === 'Arrived' ? 'mark this appointment as arrived' : 'mark this appointment as a no-show';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setUpdatingId(appointment.id);
    setActionError('');
    try {
      const updated = await updateAppointmentStatus(appointment.id, nextStatus);
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update the appointment status.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <div className="w-full max-w-none">
      <header className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Booking analytics · Records</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-[34px]">Appointment List</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Search and review appointment bookings across all offices.</p>
        </div>
        <div className="rounded-xl border border-[#2e3192]/15 bg-white px-4 py-3 text-sm"><span className="font-bold text-[#2e3192]">{filtered.length}</span><span className="ml-2 text-slate-500">appointments</span></div>
      </header>

      {(loadError || actionError) && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#b9151c]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{actionError || loadError}</p></div>}

      <section className="overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#2e3192]/15 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-base font-bold text-slate-800">All appointments <span className="ml-1 rounded-full bg-[#2e3192]/[0.06] px-2 py-0.5 text-xs text-[#2e3192]">{filtered.length}</span></h2><p className="mt-1 text-xs text-slate-500">Most recently created appointments appear first.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><span className="sr-only">Search appointments</span><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search code, applicant, office…" className="h-10 w-full rounded-lg border border-[#2e3192]/20 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10 sm:w-72" /></label>
            <select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} aria-label="Filter by appointment status" className="h-10 rounded-lg border border-[#2e3192]/20 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10"><option value="All">All statuses</option><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Arrived">Arrived</option><option value="No-show">No-show</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select>
          </div>
        </div>

        {loading ? <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span><LoaderCircle size={19} className="mr-2 inline animate-spin text-[#2e3192]" />Loading appointments…</span></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-[#f6f7ff] text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"><tr><th className="px-5 py-3.5">Reference / applicant</th><th className="px-4 py-3.5">Office</th><th className="px-4 py-3.5">Assistance</th><th className="px-4 py-3.5">Appointment date</th><th className="px-4 py-3.5">Period</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-[#2e3192]/[0.08]">
                  {rows.map((appointment) => <tr key={appointment.id} className="transition-colors hover:bg-[#2e3192]/[0.02]">
                    <td className="px-5 py-4"><p className="font-mono text-xs font-bold text-[#2e3192]">{appointment.appointmentCode}</p><p className="mt-1 text-sm font-semibold text-slate-700">{appointment.fullName}</p></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{appointment.officeName || 'Office not assigned'}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{appointment.typeOfAssistance}</td>
                    <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><CalendarDays size={14} className="text-[#2e3192]" />{formatAppointmentDate(appointment.appointmentDateKey || appointment.appointmentDateTimeSlot)}</span></td>
                    <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><Clock3 size={14} className="text-[#2e3192]" />{appointment.timeSlot || '—'}</span></td>
                    <td className="px-5 py-4"><AppointmentStatus status={appointment.status} /></td>
                    <td className="px-5 py-4 text-right">
                      {appointment.status === 'Pending' || appointment.status === 'Confirmed' ? <div className="inline-flex items-center gap-2">
                        <button type="button" onClick={() => markAttendance(appointment, 'Arrived')} disabled={updatingId === appointment.id} className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#2e3192]/[0.08] px-2.5 text-xs font-semibold text-[#2e3192] transition hover:bg-[#2e3192]/[0.14] disabled:opacity-50" title="Mark applicant as arrived">{updatingId === appointment.id ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}Mark arrived</button>
                        <button type="button" onClick={() => markAttendance(appointment, 'No-show')} disabled={updatingId === appointment.id} className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#ee1c25]/20 px-2.5 text-xs font-semibold text-[#b9151c] transition hover:bg-[#ee1c25]/[0.05] disabled:opacity-50" title="Mark applicant as a no-show">{updatingId === appointment.id ? <LoaderCircle size={13} className="animate-spin" /> : <UserX size={13} />}Mark no-show</button>
                      </div> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>)}
                  {!rows.length && <tr><td colSpan={7} className="px-5 py-14 text-center"><CalendarDays size={24} className="mx-auto text-[#2e3192]/50" /><p className="mt-3 text-sm font-semibold text-slate-700">{loadError ? 'Appointments could not be loaded' : 'No appointments match these filters'}</p><p className="mt-1 text-xs text-slate-500">{loadError ? 'Check the API connection and refresh this page.' : 'Try a different search or status filter.'}</p></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#2e3192]/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-slate-700">{filtered.length}</span> appointments</p>
              <div className="flex items-center gap-2"><button type="button" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/15 text-slate-600 hover:bg-[#2e3192]/[0.03] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button><span className="px-2 text-xs font-semibold text-slate-600">Page {page} of {pageCount}</span><button type="button" aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/15 text-slate-600 hover:bg-[#2e3192]/[0.03] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button></div>
            </div>
          </>
        )}
      </section>
      <p className="mt-4 text-xs leading-5 text-slate-500">Appointment records are loaded from the authenticated API.</p>
    </div>
  );
}

function formatAppointmentDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(date);
}

function AppointmentStatus({ status }: { status: AppointmentRecord['status'] }) {
  const styles: Record<AppointmentRecord['status'], string> = {
    Pending: 'bg-[#fef200]/[0.35] text-slate-800',
    Confirmed: 'bg-[#2e3192]/[0.08] text-[#2e3192]',
    Arrived: 'bg-[#2e3192]/[0.14] text-[#2e3192]',
    'No-show': 'bg-[#ee1c25]/[0.07] text-[#ee1c25]',
    Completed: 'bg-[#2e3192]/[0.07] text-[#2e3192]',
    Cancelled: 'bg-[#ee1c25]/[0.07] text-[#ee1c25]'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>;
}
