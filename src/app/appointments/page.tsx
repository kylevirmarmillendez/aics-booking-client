'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, LoaderCircle, LockKeyhole, Search, UserX } from 'lucide-react';
import { lookupBooking, type PublicAppointment } from '@/lib/bookingApi';
import { getAppointments, type AppointmentRecord, updateAppointmentStatus } from '@/lib/officesApi';

const PAGE_SIZE = 10;
type StatusFilter = 'All' | AppointmentRecord['status'];
type ManagedAppointmentSummary = Pick<PublicAppointment, 'appointmentCode' | 'fullName' | 'officeName' | 'assistanceType' | 'appointmentDate' | 'timeSlot' | 'status' | 'canCancel'>;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [lookupCode, setLookupCode] = useState('');
  const [lookupCell, setLookupCell] = useState('');
  const [lookupResult, setLookupResult] = useState<ManagedAppointmentSummary | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const manageSectionRef = useRef<HTMLElement | null>(null);

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

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError('');
    setLookupMessage('');
    setLookupResult(null);
    if (!/^AICS-[A-Z]{3}-\d{4}-[A-Z0-9]{5}$/i.test(lookupCode.trim()) || !/^09\d{9}$/.test(lookupCell.trim())) {
      setLookupError('Enter a valid reference code and the 11-digit mobile number used for booking.');
      return;
    }
    setLookingUp(true);
    try {
      const result = await lookupBooking({ appointmentCode: lookupCode.trim().toUpperCase(), cellNumber: lookupCell.trim() });
      setLookupResult(result.appointment);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'The appointment could not be checked.');
    } finally {
      setLookingUp(false);
    }
  }

  function manageListedAppointment(appointment: AppointmentRecord) {
    setLookupCode(appointment.appointmentCode);
    setLookupResult({
      appointmentCode: appointment.appointmentCode,
      fullName: appointment.fullName,
      officeName: appointment.officeName ?? '',
      assistanceType: appointment.typeOfAssistance,
      appointmentDate: appointment.appointmentDateKey || appointment.appointmentDateTimeSlot,
      timeSlot: appointment.timeSlot || '',
      status: appointment.status,
      canCancel: false
    });
    setLookupError('');
    setLookupMessage('Selected from the appointment list.');
    manageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function markManagedAttendance(nextStatus: 'Arrived' | 'No-show') {
    if (!lookupResult) return;
    const appointment = appointments.find((item) => item.appointmentCode === lookupResult.appointmentCode);
    if (!appointment) {
      setLookupError('This appointment is not available in the current appointment list.');
      return;
    }
    const action = nextStatus === 'Arrived' ? 'mark this appointment as arrived' : 'mark this appointment as a no-show';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setUpdatingId(appointment.id);
    setLookupError('');
    setLookupMessage('');
    try {
      const updated = await updateAppointmentStatus(appointment.id, nextStatus);
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setLookupResult((current) => current ? { ...current, status: updated.status, canCancel: false } : current);
      setLookupMessage(nextStatus === 'Arrived' ? 'Appointment marked as arrived.' : 'Appointment marked as a no-show.');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'The appointment status could not be updated.');
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

      <section ref={manageSectionRef} id="manage-appointment" className="mb-6 scroll-mt-6 overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="bg-[#2e3192] px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fef200]"><Search size={19} /></span>
            <div><h2 className="text-lg font-extrabold">Manage an appointment</h2><p className="mt-1 text-xs text-white/70">Find an existing booking and update its attendance status.</p></div>
          </div>
        </div>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={submitLookup} className="space-y-4">
            <div><label htmlFor="lookupCode" className="block text-sm font-semibold text-slate-700">Appointment reference code <span className="ml-1 text-[#ee1c25]" aria-label="required">*</span></label><input id="lookupCode" required value={lookupCode} onChange={(event) => setLookupCode(event.target.value.toUpperCase())} placeholder="AICS-HOS-2026-ABCDE" className="mt-2 h-12 w-full rounded-xl border border-[#2e3192]/20 bg-white px-3.5 font-mono text-sm tracking-wide text-slate-800 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10" /></div>
            <div><label htmlFor="lookupCell" className="block text-sm font-semibold text-slate-700">Cell number used for booking <span className="ml-1 text-[#ee1c25]" aria-label="required">*</span></label><input id="lookupCell" type="tel" inputMode="numeric" required pattern="09[0-9]{9}" maxLength={11} value={lookupCell} onChange={(event) => setLookupCell(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09123456789" className="mt-2 h-12 w-full rounded-xl border border-[#2e3192]/20 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10" /></div>
            <button type="submit" disabled={lookingUp} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white transition hover:bg-[#23256f] disabled:opacity-60">{lookingUp ? <><LoaderCircle size={16} className="animate-spin" />Finding…</> : <><Search size={16} />Find appointment</>}</button>
            {lookupError && <p role="alert" className="rounded-xl bg-[#ee1c25]/[0.05] p-3 text-xs leading-5 text-[#b9151c]">{lookupError}</p>}
          </form>
          <div className="min-h-36 rounded-2xl border border-dashed border-[#2e3192]/20 bg-[#f6f7ff]/60 p-4 sm:p-5">
            {lookupResult ? <>
              <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2e3192]">Appointment found</p><p className="mt-1 font-mono text-lg font-extrabold tracking-wide text-[#2e3192]">{lookupResult.appointmentCode}</p></div><AppointmentStatus status={lookupResult.status} /></div>
              <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-slate-400">Applicant</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.fullName}</dd><dt className="text-slate-400">Office</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.officeName || '—'}</dd><dt className="text-slate-400">Assistance</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.assistanceType}</dd><dt className="text-slate-400">Date</dt><dd className="text-right font-semibold text-slate-700">{formatAppointmentDate(lookupResult.appointmentDate)}</dd><dt className="text-slate-400">Time</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.timeSlot}</dd></dl>
              {(lookupResult.status === 'Pending' || lookupResult.status === 'Confirmed') && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#2e3192]/10 pt-4"><button type="button" onClick={() => markManagedAttendance('Arrived')} disabled={updatingId === appointments.find((item) => item.appointmentCode === lookupResult.appointmentCode)?.id} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#2e3192]/[0.08] px-3 text-xs font-semibold text-[#2e3192] transition hover:bg-[#2e3192]/[0.14] disabled:opacity-50">{updatingId === appointments.find((item) => item.appointmentCode === lookupResult.appointmentCode)?.id ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}Mark arrived</button><button type="button" onClick={() => markManagedAttendance('No-show')} disabled={updatingId === appointments.find((item) => item.appointmentCode === lookupResult.appointmentCode)?.id} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#ee1c25]/20 px-3 text-xs font-semibold text-[#b9151c] transition hover:bg-[#ee1c25]/[0.05] disabled:opacity-50">{updatingId === appointments.find((item) => item.appointmentCode === lookupResult.appointmentCode)?.id ? <LoaderCircle size={13} className="animate-spin" /> : <UserX size={13} />}Mark no-show</button></div>}
              {lookupMessage && <p role="status" className="mt-3 text-xs font-medium text-emerald-700">{lookupMessage}</p>}
            </> : <div className="grid h-full min-h-32 place-items-center text-center"><div><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white text-[#2e3192]"><LockKeyhole size={17} /></span><p className="mt-3 text-sm font-semibold text-slate-600">Your booking details will appear here</p><p className="mt-1 text-xs text-slate-400">Only the matching reference code and mobile number can find an appointment.</p></div></div>}
          </div>
        </div>
      </section>

      {loadError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#b9151c]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{loadError}</p></div>}

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
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => manageListedAppointment(appointment)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#2e3192]/20 px-3 text-xs font-semibold text-[#2e3192] transition hover:bg-[#2e3192]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/10"><Eye size={14} />Manage</button></td>
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
