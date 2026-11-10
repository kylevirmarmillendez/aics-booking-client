'use client';

import { useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowDownUp, BarChart3, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Moon, Search, Sun, TicketCheck, TrendingDown, TrendingUp } from 'lucide-react';

type BookingStatus = 'Confirmed' | 'Pending' | 'Canceled' | 'Completed';
type RangeKey = '7d' | '30d' | 'ytd' | 'custom';
type Booking = { id: string; customer: string; bookedAt: string; scheduledAt: string; service: string; category: string; amount: number; status: BookingStatus; reason?: string };

const today = new Date();
const daysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const bookings: Booking[] = [
  { id: 'BK-28491', customer: 'Isabella Santos', bookedAt: daysAgo(0), scheduledAt: daysAgo(-3), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Confirmed' },
  { id: 'BK-28490', customer: 'Noah Reyes', bookedAt: daysAgo(0), scheduledAt: daysAgo(-4), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Pending' },
  { id: 'BK-28489', customer: 'Mia Garcia', bookedAt: daysAgo(1), scheduledAt: daysAgo(-2), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Canceled', reason: 'Customer Schedule Conflict' },
  { id: 'BK-28488', customer: 'Ethan Cruz', bookedAt: daysAgo(1), scheduledAt: daysAgo(-5), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Completed' },
  { id: 'BK-28487', customer: 'Amara Dela Cruz', bookedAt: daysAgo(2), scheduledAt: daysAgo(-1), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Confirmed' },
  { id: 'BK-28486', customer: 'Liam Mendoza', bookedAt: daysAgo(2), scheduledAt: daysAgo(-7), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Canceled', reason: 'Weather / Unforeseen' },
  { id: 'BK-28485', customer: 'Sofia Villanueva', bookedAt: daysAgo(3), scheduledAt: daysAgo(-2), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Confirmed' },
  { id: 'BK-28484', customer: 'Lucas Torres', bookedAt: daysAgo(4), scheduledAt: daysAgo(-6), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Canceled', reason: 'Found Cheaper Option' },
  { id: 'BK-28483', customer: 'Chloe Bautista', bookedAt: daysAgo(5), scheduledAt: daysAgo(-4), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Completed' },
  { id: 'BK-28482', customer: 'Gabriel Flores', bookedAt: daysAgo(6), scheduledAt: daysAgo(-2), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Pending' },
  { id: 'BK-28481', customer: 'Zoe Rivera', bookedAt: daysAgo(8), scheduledAt: daysAgo(-1), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Canceled', reason: 'Payment Issue' },
  { id: 'BK-28480', customer: 'Elijah Lim', bookedAt: daysAgo(10), scheduledAt: daysAgo(-3), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Confirmed' },
  { id: 'BK-28479', customer: 'Nina Aquino', bookedAt: daysAgo(12), scheduledAt: daysAgo(-8), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Canceled', reason: 'Late Cancellation' },
  { id: 'BK-28478', customer: 'Caleb Ramos', bookedAt: daysAgo(15), scheduledAt: daysAgo(-2), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Completed' },
  { id: 'BK-28477', customer: 'Layla Lim', bookedAt: daysAgo(18), scheduledAt: daysAgo(-4), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Confirmed' },
  { id: 'BK-28476', customer: 'Mateo Garcia', bookedAt: daysAgo(21), scheduledAt: daysAgo(-6), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Canceled', reason: 'Customer Schedule Conflict' },
  { id: 'BK-28475', customer: 'Ava Reyes', bookedAt: daysAgo(25), scheduledAt: daysAgo(-3), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Confirmed' },
  { id: 'BK-28474', customer: 'Theo Santos', bookedAt: daysAgo(32), scheduledAt: daysAgo(-4), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Canceled', reason: 'Weather / Unforeseen' },
  { id: 'BK-28473', customer: 'Ella Cruz', bookedAt: daysAgo(39), scheduledAt: daysAgo(-2), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Completed' },
  { id: 'BK-28472', customer: 'Finn Mendoza', bookedAt: daysAgo(47), scheduledAt: daysAgo(-5), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Confirmed' },
  { id: 'BK-28471', customer: 'Aria Torres', bookedAt: daysAgo(58), scheduledAt: daysAgo(-1), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Canceled', reason: 'Payment Issue' },
  { id: 'BK-28470', customer: 'Kai Bautista', bookedAt: daysAgo(74), scheduledAt: daysAgo(-3), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Confirmed' },
  { id: 'BK-28469', customer: 'Luna Aquino', bookedAt: daysAgo(95), scheduledAt: daysAgo(-7), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Canceled', reason: 'Customer Schedule Conflict' },
  { id: 'BK-28468', customer: 'Jude Flores', bookedAt: daysAgo(130), scheduledAt: daysAgo(-2), service: 'Family Consultation', category: 'Consultation', amount: 2400, status: 'Completed' },
  { id: 'BK-28467', customer: 'Ivy Rivera', bookedAt: daysAgo(178), scheduledAt: daysAgo(-4), service: 'Medical Assistance', category: 'Assistance', amount: 5600, status: 'Confirmed' },
  { id: 'BK-28466', customer: 'Ezra Ramos', bookedAt: daysAgo(240), scheduledAt: daysAgo(-5), service: 'Wellness Assessment', category: 'Assessment', amount: 1800, status: 'Canceled', reason: 'Found Cheaper Option' },
  { id: 'BK-28465', customer: 'Maya Villanueva', bookedAt: daysAgo(300), scheduledAt: daysAgo(-3), service: 'Counseling Session', category: 'Counseling', amount: 3200, status: 'Confirmed' }
];

const reasonColors = ['#2e3192', '#ee1c25', '#f59e0b', '#6366f1', '#94a3b8'];
const rangeLabels: Record<RangeKey, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', ytd: 'Year to date', custom: 'Custom range' };
const money = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);
const compact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));

function withinRange(date: string, range: RangeKey, from: string, to: string) {
  const value = new Date(`${date}T00:00:00`).getTime();
  if (range === 'custom') return value >= new Date(`${from}T00:00:00`).getTime() && value <= new Date(`${to}T23:59:59`).getTime();
  if (range === 'ytd') return value >= new Date(today.getFullYear(), 0, 1).getTime() && value <= Date.now();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 365;
  return value >= new Date(`${daysAgo(days - 1)}T00:00:00`).getTime() && value <= Date.now();
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [status, setStatus] = useState<'All' | BookingStatus>('All');
  const [category, setCategory] = useState('All services');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'bookedAt' | 'amount'>('bookedAt');
  const [sortAscending, setSortAscending] = useState(false);
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(false);
  const [customFrom, setCustomFrom] = useState(daysAgo(6));
  const [customTo, setCustomTo] = useState(daysAgo(0));
  const pageSize = 7;
  const categories = useMemo(() => ['All services', ...Array.from(new Set(bookings.map((item) => item.category)))], []);

  const dateBookings = useMemo(() => bookings.filter((item) => withinRange(item.bookedAt, range, customFrom, customTo)), [range, customFrom, customTo]);
  const filtered = useMemo(() => dateBookings.filter((item) => (status === 'All' || item.status === status) && (category === 'All services' || item.category === category)), [dateBookings, status, category]);
  const searched = useMemo(() => filtered.filter((item) => `${item.customer} ${item.id}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
    const result = sort === 'amount' ? a.amount - b.amount : a.bookedAt.localeCompare(b.bookedAt);
    return sortAscending ? result : -result;
  }), [filtered, search, sort, sortAscending]);
  const counts = useMemo(() => ({
    total: filtered.length,
    confirmed: filtered.filter((item) => item.status === 'Confirmed').length,
    pending: filtered.filter((item) => item.status === 'Pending').length,
    canceled: filtered.filter((item) => item.status === 'Canceled').length,
    completed: filtered.filter((item) => item.status === 'Completed').length,
    revenue: filtered.filter((item) => item.status === 'Confirmed' || item.status === 'Completed').reduce((sum, item) => sum + item.amount, 0),
    lost: filtered.filter((item) => item.status === 'Canceled').reduce((sum, item) => sum + item.amount, 0)
  }), [filtered]);
  const cancellationRate = counts.total ? counts.canceled / counts.total * 100 : 0;
  const pages = Math.max(1, Math.ceil(searched.length / pageSize));
  const rows = searched.slice((page - 1) * pageSize, page * pageSize);
  const trends = useMemo(() => buildTrend(filtered, range, customFrom, customTo), [filtered, range, customFrom, customTo]);
  const reasons = useMemo(() => {
    const grouped = new Map<string, number>();
    filtered.filter((item) => item.status === 'Canceled').forEach((item) => grouped.set(item.reason ?? 'Other', (grouped.get(item.reason ?? 'Other') ?? 0) + 1));
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);
  const distribution: { name: BookingStatus; value: number; color: string }[] = [
    { name: 'Confirmed', value: filtered.filter((item) => item.status === 'Confirmed').length, color: '#16a34a' },
    { name: 'Completed', value: counts.completed, color: '#2e3192' },
    { name: 'Pending', value: counts.pending, color: '#f59e0b' },
    { name: 'Canceled', value: counts.canceled, color: '#ee1c25' }
  ];
  const reasonMax = Math.max(1, ...reasons.map(([, amount]) => amount));
  const theme = dark ? 'bg-[#111827] text-slate-100' : 'bg-[#f6f7ff] text-slate-800';
  const card = dark ? 'border-slate-700 bg-[#1f2937] text-slate-100' : 'border-[#2e3192]/15 bg-white text-slate-800';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const border = dark ? 'border-slate-700' : 'border-[#2e3192]/10';

  function updateFilters(action: () => void) { action(); setPage(1); }

  return (
    <div className={`-mx-4 -my-7 min-h-[calc(100vh-74px)] px-4 py-7 transition-colors sm:-mx-7 sm:px-7 sm:py-9 lg:-mx-10 lg:px-10 ${theme}`}>
      <div className="mx-auto max-w-[1700px]">
        <header className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#2e3192]">AICS booking intelligence</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-[34px]">Analytics overview</h1><p className={`mt-2 text-sm ${muted}`}>A real-time view of booking performance and service demand.</p></div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative"><span className="sr-only">Select date range</span><CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={range} onChange={(e) => updateFilters(() => setRange(e.target.value as RangeKey))} className={`h-10 appearance-none rounded-xl border ${border} ${card} pl-9 pr-9 text-xs font-semibold`} aria-label="Date range">{Object.entries(rangeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></label>
            <label className="relative"><span className="sr-only">Filter by booking status</span><select value={status} onChange={(e) => updateFilters(() => setStatus(e.target.value as 'All' | BookingStatus))} className={`h-10 appearance-none rounded-xl border ${border} ${card} px-3 pr-8 text-xs font-semibold`}><option>All</option><option>Confirmed</option><option>Pending</option><option>Canceled</option><option>Completed</option></select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></label>
            <label className="relative"><span className="sr-only">Filter by service type</span><select value={category} onChange={(e) => updateFilters(() => setCategory(e.target.value))} className={`h-10 appearance-none rounded-xl border ${border} ${card} px-3 pr-8 text-xs font-semibold`}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" /></label>
            <button type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} className={`grid h-10 w-10 place-items-center rounded-xl border ${border} ${card} transition hover:opacity-80`}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </header>

        {range === 'custom' && <div className="mb-5 flex flex-wrap items-end gap-3"><DateInput label="From" value={customFrom} onChange={setCustomFrom} dark={dark} /><DateInput label="To" value={customTo} onChange={setCustomTo} dark={dark} /></div>}

        <section className="mb-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Booking key performance indicators">
          <Metric icon={TicketCheck} label="Total bookings" value={compact(counts.total)} detail="vs. previous period" growth="+12.8%" positive dark={dark} />
          <Metric icon={Check} label="Confirmed bookings" value={compact(counts.confirmed)} detail={`${counts.completed} completed`} growth={`${counts.pending} pending`} dark={dark} />
          <Metric icon={TrendingDown} label="Cancellation rate" value={`${cancellationRate.toFixed(1)}%`} detail={`${counts.canceled} of ${counts.total} bookings`} growth={money(counts.lost) + ' lost'} alert dark={dark} />
          <Metric icon={CircleDollarSign} label="Total revenue" value={money(counts.revenue)} detail="Lost to cancellations" growth={money(counts.lost)} alert dark={dark} />
        </section>

        <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.9fr)]">
          <article className={`rounded-2xl border p-5 shadow-[0_12px_36px_rgba(46,49,146,0.05)] sm:p-6 ${card}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-extrabold">Booking trends</h2><p className={`mt-1 text-xs ${muted}`}>Confirmed & canceled bookings over time</p></div><div className="flex items-center gap-4 text-[10px] font-semibold"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2e3192]" />Confirmed</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ee1c25]" />Canceled</span></div></div>
            <TrendChart points={trends} dark={dark} />
          </article>
          <article className={`rounded-2xl border p-5 shadow-[0_12px_36px_rgba(46,49,146,0.05)] sm:p-6 ${card}`}>
            <div><h2 className="text-sm font-extrabold">Booking status</h2><p className={`mt-1 text-xs ${muted}`}>Distribution for selected filters</p></div>
            <div className="mt-2 flex items-center justify-center"><DonutChart values={distribution.map((item) => item.value)} colors={distribution.map((item) => item.color)} center={counts.total.toString()} subtitle="bookings" /></div>
            <div className="mt-1 grid grid-cols-2 gap-x-5 gap-y-3">{distribution.map((item) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span className={`flex-1 ${muted}`}>{item.name}</span><strong>{item.value}</strong></div>)}</div>
          </article>
        </section>

        <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <article className={`rounded-2xl border p-5 shadow-[0_12px_36px_rgba(46,49,146,0.05)] sm:p-6 ${card}`}>
            <div className="mb-2"><h2 className="text-sm font-extrabold">Cancellation reasons</h2><p className={`mt-1 text-xs ${muted}`}>Why customers canceled in this period</p></div>
            {reasons.length ? <div className="space-y-4 pt-3">{reasons.map(([label, amount], index) => <div key={label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className={dark ? 'text-slate-300' : 'text-slate-600'}>{label}</span><strong>{amount}</strong></div><div className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="h-full rounded-full" style={{ width: `${Math.max(8, amount / reasonMax * 100)}%`, background: reasonColors[index] }} /></div></div>)}</div> : <EmptyChart dark={dark} message="No cancellations for these filters" />}
          </article>
          <article className={`rounded-2xl border p-5 shadow-[0_12px_36px_rgba(46,49,146,0.05)] sm:p-6 ${card}`}>
            <div className="flex items-start justify-between"><div><h2 className="text-sm font-extrabold">Revenue at risk</h2><p className={`mt-1 text-xs ${muted}`}>Estimated value of canceled bookings</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ee1c25]/[0.08] text-[#ee1c25]"><TrendingDown size={17} /></span></div>
            <p className="mt-6 text-3xl font-extrabold tracking-tight text-[#ee1c25]">{money(counts.lost)}</p><p className={`mt-1 text-xs ${muted}`}>{counts.canceled} canceled bookings in {rangeLabels[range].toLowerCase()}</p>
            <div className={`mt-6 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3.5 text-xs leading-5 text-amber-900 ${dark ? 'dark-risk' : ''}`}><strong className="flex items-center gap-2"><Activity size={14} />Recovery opportunity</strong><p className="mt-1">Consider reminders and flexible rescheduling to reduce preventable cancellations.</p></div>
          </article>
        </section>

        <section className={`overflow-hidden rounded-2xl border shadow-[0_12px_36px_rgba(46,49,146,0.05)] ${card}`}>
          <div className={`flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between ${border}`}>
            <div><h2 className="text-sm font-extrabold">Booking log <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${dark ? 'bg-slate-700 text-slate-200' : 'bg-[#2e3192]/[0.06] text-[#2e3192]'}`}>{searched.length}</span></h2><p className={`mt-1 text-xs ${muted}`}>Detailed booking transactions for selected filters</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative"><span className="sr-only">Search booking log</span><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => updateFilters(() => setSearch(e.target.value))} placeholder="Search customer or ID" className={`h-10 w-full rounded-xl border ${border} ${dark ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-slate-800'} pl-9 pr-3 text-xs outline-none focus:border-[#2e3192] sm:w-56`} /></label>
              <div className={`inline-flex h-10 items-center rounded-xl border px-3 text-xs font-semibold ${border} ${dark ? 'bg-slate-800' : 'bg-white'}`}><button type="button" onClick={() => setSort((value) => value === 'bookedAt' ? 'amount' : 'bookedAt')} className="inline-flex items-center gap-2"><ArrowDownUp size={14} />Sort: {sort === 'bookedAt' ? 'Date' : 'Amount'}</button><button type="button" aria-label="Toggle sort direction" onClick={() => setSortAscending((value) => !value)} className="ml-2 rounded p-1 hover:bg-slate-500/10"><ArrowDown size={13} className={sortAscending ? 'rotate-180' : ''} /></button></div>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className={`${dark ? 'bg-slate-800/80 text-slate-400' : 'bg-[#f6f7ff] text-slate-500'} text-[9px] font-bold uppercase tracking-[.12em]`}><tr><th className="px-5 py-3.5">Booking ID</th><th className="px-4 py-3.5">Customer</th><th className="px-4 py-3.5">Booking date</th><th className="px-4 py-3.5">Scheduled</th><th className="px-4 py-3.5">Service</th><th className="px-4 py-3.5">Amount</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5">Cancellation reason</th></tr></thead><tbody className={`divide-y ${dark ? 'divide-slate-700' : 'divide-[#2e3192]/[0.07]'}`}>
            {rows.map((item) => <tr key={item.id} className={`${dark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#2e3192]/[0.02]'} transition-colors`}><td className="px-5 py-3.5 font-mono text-[10px] font-bold text-[#2e3192]">{item.id}</td><td className="px-4 py-3.5 text-xs font-semibold">{item.customer}</td><td className={`px-4 py-3.5 text-[10px] ${muted}`}>{dateLabel(item.bookedAt)}</td><td className={`px-4 py-3.5 text-[10px] ${muted}`}>{dateLabel(item.scheduledAt)}</td><td className="px-4 py-3.5 text-xs">{item.service}</td><td className="px-4 py-3.5 text-xs font-semibold">{money(item.amount)}</td><td className="px-4 py-3.5"><StatusBadge status={item.status} /></td><td className={`max-w-48 truncate px-5 py-3.5 text-[10px] ${muted}`}>{item.reason ?? '—'}</td></tr>)}
            {!rows.length && <tr><td colSpan={8} className={`px-5 py-12 text-center text-sm ${muted}`}>No bookings match your filters.</td></tr>}
          </tbody></table></div>
          <div className={`flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${border}`}><p className={`text-xs ${muted}`}>Showing {searched.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, searched.length)} of {searched.length} bookings</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={`grid h-8 w-8 place-items-center rounded-lg border ${border} disabled:opacity-40`}><ChevronLeft size={15} /></button><span className="px-2 text-[10px] font-semibold">Page {page} / {pages}</span><button type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className={`grid h-8 w-8 place-items-center rounded-lg border ${border} disabled:opacity-40`}><ChevronRight size={15} /></button></div></div>
        </section>
        <p className={`mt-4 text-center text-[10px] ${muted}`}>Illustrative mock booking data · Dashboard totals respond to the selected date, status, and service filters.</p>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, growth, positive = false, alert = false, dark }: { icon: typeof TicketCheck; label: string; value: string; detail: string; growth: string; positive?: boolean; alert?: boolean; dark: boolean }) {
  return <article className={`rounded-2xl border p-5 shadow-[0_12px_36px_rgba(46,49,146,0.05)] ${dark ? 'border-slate-700 bg-[#1f2937]' : 'border-[#2e3192]/15 bg-white'}`}><div className="flex items-start justify-between"><div><p className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p><p className={`mt-2 text-2xl font-extrabold tracking-tight ${alert ? 'text-[#ee1c25]' : dark ? 'text-white' : 'text-slate-800'}`}>{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${alert ? 'bg-[#ee1c25]/[0.08] text-[#ee1c25]' : 'bg-[#2e3192]/[0.06] text-[#2e3192]'}`}><Icon size={18} /></span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-1 text-[10px]"><span className={dark ? 'text-slate-500' : 'text-slate-400'}>{detail}</span><span className={`inline-flex items-center gap-1 font-bold ${alert ? 'text-[#b9151c]' : positive ? 'text-emerald-600' : dark ? 'text-slate-300' : 'text-slate-600'}`}>{positive ? <TrendingUp size={12} /> : alert ? <TrendingDown size={12} /> : null}{growth}</span></div></article>;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = { Confirmed: 'bg-emerald-50 text-emerald-700', Completed: 'bg-[#2e3192]/[0.07] text-[#2e3192]', Pending: 'bg-[#fff9b8] text-amber-800', Canceled: 'bg-[#ee1c25]/[0.08] text-[#b9151c]' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${styles[status]}`}>{status}</span>;
}

function DateInput({ label, value, onChange, dark }: { label: string; value: string; onChange: (value: string) => void; dark: boolean }) {
  return <label className={`text-[10px] font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}<input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 block h-9 rounded-lg border px-2 text-xs ${dark ? 'border-slate-700 bg-slate-800 text-white' : 'border-[#2e3192]/15 bg-white text-slate-700'}`} /></label>;
}

function buildTrend(data: Booking[], range: RangeKey, customFrom: string, customTo: string) {
  const buckets: Array<{ label: string; confirmed: number; canceled: number; start: number; end: number }> = [];
  if (range === '7d') {
    for (let days = 6; days >= 0; days -= 1) {
      const start = new Date(today);
      start.setDate(start.getDate() - days);
      const next = new Date(start);
      next.setDate(next.getDate() + 1);
      buckets.push({ label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start), confirmed: 0, canceled: 0, start: start.getTime(), end: next.getTime() });
    }
  } else if (range === 'ytd') {
    for (let month = 0; month <= today.getMonth(); month += 1) {
      buckets.push({ label: new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(today.getFullYear(), month, 1)), confirmed: 0, canceled: 0, start: new Date(today.getFullYear(), month, 1).getTime(), end: new Date(today.getFullYear(), month + 1, 1).getTime() });
    }
  } else {
    const from = range === 'custom' ? new Date(`${customFrom}T00:00:00`) : new Date(`${daysAgo(29)}T00:00:00`);
    const to = range === 'custom' ? new Date(`${customTo}T23:59:59`) : new Date();
    const span = Math.max(1, to.getTime() - from.getTime() + 1);
    const count = range === '30d' ? 10 : Math.min(10, Math.max(1, Math.ceil(span / 86400000)));
    for (let index = 0; index < count; index += 1) {
      const start = from.getTime() + Math.floor(span * index / count);
      const end = from.getTime() + Math.floor(span * (index + 1) / count);
      buckets.push({ label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(start)), confirmed: 0, canceled: 0, start, end });
    }
  }
  data.forEach((booking) => {
    const timestamp = new Date(`${booking.bookedAt}T12:00:00`).getTime();
    const index = buckets.findIndex((bucket, bucketIndex) => timestamp >= bucket.start && (timestamp < bucket.end || (bucketIndex === buckets.length - 1 && timestamp <= bucket.end)));
    if (index >= 0) {
      if (booking.status === 'Canceled') buckets[index].canceled += 1;
      if (booking.status === 'Confirmed' || booking.status === 'Completed') buckets[index].confirmed += 1;
    }
  });
  return buckets;
}

function TrendChart({ points, dark }: { points: Array<{ label: string; confirmed: number; canceled: number }>; dark: boolean }) {
  const width = 720;
  const height = 240;
  const padding = { top: 16, right: 12, bottom: 30, left: 28 };
  const max = Math.max(4, ...points.flatMap((point) => [point.confirmed, point.canceled])) + 1;
  const x = (index: number) => padding.left + index * (width - padding.left - padding.right) / Math.max(1, points.length - 1);
  const y = (value: number) => height - padding.bottom - value / max * (height - padding.top - padding.bottom);
  const line = (key: 'confirmed' | 'canceled') => points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point[key])}`).join(' ');
  const ticks = Array.from({ length: 4 }, (_, index) => Math.round(max * index / 3));
  return <div className="mt-4 w-full overflow-hidden"><svg viewBox={`0 0 ${width} ${height}`} className="h-[230px] w-full" role="img" aria-label="Line chart showing confirmed and canceled bookings over time" preserveAspectRatio="none">
    {ticks.map((tick) => <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke={dark ? '#374151' : '#e8ecf5'} strokeDasharray="4 5" /><text x={padding.left - 8} y={y(tick) + 3} textAnchor="end" fontSize="10" fill={dark ? '#9ca3af' : '#94a3b8'}>{tick}</text></g>)}
    <path d={`${line('confirmed')} L ${x(points.length - 1)} ${height - padding.bottom} L ${x(0)} ${height - padding.bottom} Z`} fill="#2e3192" fillOpacity=".08" />
    <path d={line('confirmed')} fill="none" stroke="#2e3192" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d={line('canceled')} fill="none" stroke="#ee1c25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {points.map((point, index) => <g key={point.label}><circle cx={x(index)} cy={y(point.confirmed)} r="3.5" fill="white" stroke="#2e3192" strokeWidth="2" /><circle cx={x(index)} cy={y(point.canceled)} r="3" fill="white" stroke="#ee1c25" strokeWidth="2" />{(points.length <= 10 || index % 2 === 0) && <text x={x(index)} y={height - 8} textAnchor="middle" fontSize="9" fill={dark ? '#9ca3af' : '#94a3b8'}>{point.label}</text>}</g>)}
  </svg></div>;
}

function DonutChart({ values, colors, center, subtitle }: { values: number[]; colors: string[]; center: string; subtitle: string }) {
  const total = values.reduce((sum, value) => sum + value, 0);
  let offset = 0;
  const segments = values.map((value, index) => {
    const percentage = total ? value / total * 100 : 0;
    const dash = `${percentage} ${100 - percentage}`;
    const currentOffset = offset;
    offset += percentage;
    return <circle key={colors[index]} cx="21" cy="21" r="15.915" fill="none" stroke={colors[index]} strokeWidth="5" strokeDasharray={dash} strokeDashoffset={-currentOffset} pathLength="100" />;
  });
  return <div className="relative h-40 w-40"><svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-label="Booking status donut chart"><circle cx="21" cy="21" r="15.915" fill="none" stroke="#e8ecf5" strokeWidth="5" />{segments}</svg><div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl font-extrabold">{center}</strong><span className="text-[9px] text-slate-400">{subtitle}</span></div></div>;
}

function EmptyChart({ dark, message }: { dark: boolean; message: string }) {
  return <div className={`grid min-h-40 place-items-center text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}><div className="text-center"><BarChart3 size={22} className="mx-auto mb-2 opacity-60" />{message}</div></div>;
}
