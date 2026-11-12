'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Clock3, ExternalLink, LoaderCircle, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { createOffice, deleteOffice, getOffices, OfficeApiError, updateOffice, type OfficeInput, type OfficeRecord, type OfficeType } from '@/lib/officesApi';

const DEFAULT_DAILY_CAPACITY = 60;
const emptyForm: OfficeInput = {
  slug: '', name: '', officeType: 'SWAD', province: '', city: '', address: '', contacts: [], hours: '', serviceArea: '', dailyCapacity: DEFAULT_DAILY_CAPACITY, amCapacity: DEFAULT_DAILY_CAPACITY / 2, pmCapacity: DEFAULT_DAILY_CAPACITY / 2, links: [], sourceNote: '', active: true
};

export default function OfficesPage() {
  const [offices, setOffices] = useState<OfficeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | OfficeType>('All');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [editing, setEditing] = useState<OfficeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<OfficeInput>(emptyForm);
  const [contactsText, setContactsText] = useState('');
  const [linksText, setLinksText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  async function loadOffices() {
    setLoading(true);
    setLoadError('');
    try {
      setOffices(await getOffices());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load offices.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadOffices(); }, []);

  function beginCreate() {
    setFormOpen(true);
    setEditing(null);
    setForm({ ...emptyForm, contacts: [], links: [] });
    setContactsText('');
    setLinksText('');
    setFormError('');
  }

  function beginEdit(office: OfficeRecord) {
    setFormOpen(true);
    setEditing(office);
    const { id: _id, ...officeInput } = office;
    const dailyCapacity = office.dailyCapacity || DEFAULT_DAILY_CAPACITY;
    const amCapacity = office.amCapacity ?? Math.floor(dailyCapacity / 2);
    setForm({ ...officeInput, dailyCapacity, amCapacity, pmCapacity: office.pmCapacity ?? dailyCapacity - amCapacity });
    setContactsText(office.contacts.join('\n'));
    setLinksText(office.links.map((link) => `${link.label} | ${link.url}`).join('\n'));
    setFormError('');
  }

  function updateDailyCapacity(value: number) {
    const dailyCapacity = Math.max(1, value || 1);
    const amCapacity = Math.floor(dailyCapacity / 2);
    setForm((current) => ({ ...current, dailyCapacity, amCapacity, pmCapacity: dailyCapacity - amCapacity }));
  }

  function updatePeriodCapacity(period: 'AM' | 'PM', value: number) {
    setForm((current) => {
      const capacity = Math.max(0, Math.min(current.dailyCapacity, value || 0));
      return period === 'AM'
        ? { ...current, amCapacity: capacity, pmCapacity: current.dailyCapacity - capacity }
        : { ...current, pmCapacity: capacity, amCapacity: current.dailyCapacity - capacity };
    });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm({ ...emptyForm, contacts: [], links: [] });
    setContactsText('');
    setLinksText('');
    setFormError('');
  }

  async function submitOffice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.amCapacity + form.pmCapacity !== form.dailyCapacity) {
      setFormError('AM and PM slots must total the daily appointment capacity.');
      return;
    }
    setSaving(true);
    setFormError('');
    const links = linksText.split('\n').map((line) => {
      const [label, ...urlParts] = line.split('|');
      return { label: label.trim(), url: urlParts.join('|').trim() };
    }).filter((link) => link.label && link.url);
    const payload: OfficeInput = {
      ...form,
      contacts: contactsText.split('\n').map((value) => value.trim()).filter(Boolean),
      links
    };
    try {
      const saved = editing
        ? await updateOffice(editing.id, payload)
        : await createOffice(payload);
      setOffices((current) => editing
        ? current.map((office) => office.id === saved.id ? saved : office)
        : [...current, saved].sort((a, b) => a.province.localeCompare(b.province) || a.name.localeCompare(b.name)));
      closeForm();
    } catch (error) {
      setFormError(error instanceof OfficeApiError ? error.message : 'Unable to save this office.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(office: OfficeRecord) {
    if (!window.confirm(`Permanently delete ${office.name}? Offices linked to appointment history cannot be deleted; deactivate them instead.`)) return;
    setDeletingId(office.id);
    setLoadError('');
    try {
      await deleteOffice(office.id);
      setOffices((current) => current.filter((item) => item.id !== office.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to delete this office.');
    } finally {
      setDeletingId('');
    }
  }

  const filteredOffices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return offices.filter((office) => {
      const content = `${office.name} ${office.province} ${office.city} ${office.address} ${office.officeType}`.toLowerCase();
      return (!query || content.includes(query)) && (typeFilter === 'All' || office.officeType === typeFilter) &&
        (activeFilter === 'All' || office.active === (activeFilter === 'Active'));
    });
  }, [offices, search, typeFilter, activeFilter]);
  return (
    <div className="w-full max-w-none">
      <header className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Booking analytics · Directory</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-[34px]">Office Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage the SWAD, regional, and satellite offices available for appointment booking.</p>
        </div>
        <button type="button" onClick={beginCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f]"><Plus size={17} /> Add office</button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Office directory summary">
        <SummaryCard label="Total offices" value={offices.length} />
        <SummaryCard label="Active offices" value={offices.filter((office) => office.active).length} />
        <SummaryCard label="Standard appointment capacity" value="60 / day" note="30 AM · 30 PM per office" />
      </section>

      {loadError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#b9151c]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{loadError}</p></div>}

      {formOpen ? (
        <section className="mb-6 rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.06)] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit office' : 'Add an office'}</h2><p className="mt-1 text-xs text-slate-500">Fields marked with * are required. Set the total daily appointment capacity and the capacity for each AM/PM period.</p></div>
            <button type="button" onClick={closeForm} aria-label="Close office form" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={16} /></button>
          </div>
          {formError && <p role="alert" className="mb-4 rounded-lg bg-[#ee1c25]/[0.06] p-3 text-sm text-[#b9151c]">{formError}</p>}
          <form onSubmit={submitOffice} className="grid gap-4 sm:grid-cols-2">
            <Field label="Office name *"><input required maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Office name" className={inputClass} /></Field>
            <Field label="Office slug *"><input required disabled={Boolean(editing)} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="office-slug" className={`${inputClass} disabled:bg-slate-100`} /><span className="mt-1 block text-[11px] text-slate-400">Slug cannot be changed after creation because appointments reference it.</span></Field>
            <Field label="Office type *"><select required value={form.officeType} onChange={(event) => setForm((current) => ({ ...current, officeType: event.target.value as OfficeType }))} className={inputClass}><option value="SWAD">SWAD</option><option value="Regional Office">Regional Office</option><option value="Satellite Office">Satellite Office</option></select></Field>
            <Field label="Province *"><input required maxLength={100} value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))} placeholder="Province" className={inputClass} /></Field>
            <Field label="Appointment capacity (slots per day) *"><input type="number" required min={1} max={10000} step={1} value={form.dailyCapacity} onChange={(event) => updateDailyCapacity(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="AM appointment slots *"><input type="number" required min={0} max={form.dailyCapacity} step={1} value={form.amCapacity} onChange={(event) => updatePeriodCapacity('AM', Number(event.target.value))} className={inputClass} /></Field>
            <Field label="PM appointment slots *"><input type="number" required min={0} max={form.dailyCapacity} step={1} value={form.pmCapacity} onChange={(event) => updatePeriodCapacity('PM', Number(event.target.value))} className={inputClass} /><span className="mt-1 block text-[11px] text-slate-400">Defaults to an even split of {DEFAULT_DAILY_CAPACITY} daily slots. AM + PM always equals the daily total.</span></Field>
            <Field label="City / municipality"><input maxLength={100} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="City or municipality" className={inputClass} /></Field>
            <Field label="Office hours"><input maxLength={150} value={form.hours} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} placeholder="Monday–Friday, 8:00 AM–5:00 PM" className={inputClass} /></Field>
            <Field label="Address"><textarea rows={2} maxLength={300} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street, barangay, city" className={textareaClass} /></Field>
            <Field label="Service area"><input maxLength={200} value={form.serviceArea} onChange={(event) => setForm((current) => ({ ...current, serviceArea: event.target.value }))} placeholder="Area served" className={inputClass} /></Field>
            <Field label="Contacts (one per line)"><textarea rows={3} value={contactsText} onChange={(event) => setContactsText(event.target.value)} placeholder="035-402-0115" className={textareaClass} /></Field>
            <Field label="Directory links (one per line: label | URL)"><textarea rows={3} value={linksText} onChange={(event) => setLinksText(event.target.value)} placeholder="DSWD directory | https://www.dswd.gov.ph/" className={textareaClass} /></Field>
            <Field label="Source / verification note"><textarea rows={2} maxLength={500} value={form.sourceNote} onChange={(event) => setForm((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="Optional internal note" className={textareaClass} /></Field>
            <label className="flex items-center gap-2 self-end rounded-xl border border-[#2e3192]/15 px-3 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 accent-[#2e3192]" />Active for bookings</label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={closeForm} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2e3192] px-4 text-sm font-bold text-white hover:bg-[#23256f] disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : null}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create office'}</button></div>
          </form>
        </section>
      ) : null}

      <div className="grid items-start gap-5">
      <section className="overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#2e3192]/15 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-base font-bold text-slate-800">Office directory <span className="ml-1 rounded-full bg-[#2e3192]/[0.06] px-2 py-0.5 text-xs text-[#2e3192]">{filteredOffices.length}</span></h2><p className="mt-1 text-xs text-slate-500">Create, review, edit, deactivate, or delete office records.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><span className="sr-only">Search offices</span><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, city, province…" className={`${inputClass} pl-9 sm:w-64`} /></label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'All' | OfficeType)} aria-label="Filter by office type" className={inputClass}><option value="All">All types</option><option value="SWAD">SWAD</option><option value="Regional Office">Regional Office</option><option value="Satellite Office">Satellite office</option></select>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as 'All' | 'Active' | 'Inactive')} aria-label="Filter by status" className={inputClass}><option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
          </div>
        </div>
        {loading ? <div className="grid min-h-52 place-items-center text-sm text-slate-500"><span><LoaderCircle size={18} className="mr-2 inline animate-spin text-[#2e3192]" />Loading offices…</span></div> : filteredOffices.length ? (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            {filteredOffices.map((office) => <OfficeCard key={office.id} office={office} deleting={deletingId === office.id} onEdit={() => beginEdit(office)} onDelete={() => handleDelete(office)} />)}
          </div>
        ) : <div className="grid min-h-52 place-items-center px-5 text-center"><div><Building2 size={26} className="mx-auto text-[#2e3192]/50" /><p className="mt-3 text-sm font-semibold text-slate-700">{loadError ? 'Offices could not be loaded' : 'No offices match these filters'}</p><p className="mt-1 text-xs text-slate-500">{loadError || 'Try another search or add an office.'}</p></div></div>}
      </section>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Office records are stored in MongoDB. Offices with appointment history cannot be permanently deleted; deactivate them to stop new bookings while retaining history.</p>
    </div>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return <div className="rounded-2xl border border-[#2e3192]/15 bg-white p-4 shadow-[0_12px_36px_rgba(46,49,146,0.04)]"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{children}</label>;
}

function OfficeCard({ office, deleting, onEdit, onDelete }: { office: OfficeRecord; deleting: boolean; onEdit: () => void; onDelete: () => void }) {
  return <article className="rounded-xl border border-[#2e3192]/12 p-4 transition hover:border-[#2e3192]/25 hover:shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><Building2 size={18} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-800">{office.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${office.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{office.active ? 'Active' : 'Inactive'}</span></div><p className="mt-1 text-xs text-slate-500">{office.officeType} · {office.province}{office.city ? ` · ${office.city}` : ''}</p></div></div>
      <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={onEdit} aria-label={`Edit ${office.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/15 text-[#2e3192] hover:bg-[#2e3192]/[0.04]"><Pencil size={15} /></button><button type="button" onClick={onDelete} disabled={deleting} aria-label={`Delete ${office.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#ee1c25]/20 text-[#b9151c] hover:bg-[#ee1c25]/[0.05] disabled:opacity-50">{deleting ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div>
    </div>
    <div className="mt-4 grid gap-3 border-t border-[#2e3192]/[0.08] pt-4 text-xs sm:grid-cols-2">
      <InfoLine icon={MapPin} text={office.address || office.city || 'Address not provided'} />
      <InfoLine icon={Clock3} text={office.hours || 'Hours not provided'} />
      <InfoLine icon={CheckCircle2} text={`${office.dailyCapacity} per day · ${office.amCapacity} AM and ${office.pmCapacity} PM`} />
      <InfoLine icon={Building2} text={office.contacts.length ? office.contacts.join(' · ') : 'Contact not provided'} />
    </div>
    {office.serviceArea && <p className="mt-3 text-xs text-slate-600"><span className="font-semibold">Service area:</span> {office.serviceArea}</p>}
    {office.links.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{office.links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2e3192] underline underline-offset-2">{link.label}<ExternalLink size={12} /></a>)}</div>}
    {office.sourceNote && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">{office.sourceNote}</p>}
  </article>;
}

function InfoLine({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return <div className="flex min-w-0 items-start gap-2 text-slate-600"><Icon size={14} className="mt-0.5 shrink-0 text-[#2e3192]" /><span className="break-words">{text}</span></div>;
}

const inputClass = 'mt-1.5 block h-10 w-full rounded-lg border border-[#2e3192]/20 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10 disabled:bg-slate-100';
const textareaClass = 'mt-1.5 block w-full resize-y rounded-lg border border-[#2e3192]/20 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10';
