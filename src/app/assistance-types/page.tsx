'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  createAssistanceType,
  deleteAssistanceType,
  getAssistanceTypeRecords,
  AssistanceTypeApiError,
  updateAssistanceType,
  type AssistanceTypeInput,
  type AssistanceTypeRecord
} from '@/lib/assistanceTypesApi';

const emptyForm: AssistanceTypeInput = { code: '', name: '', codePrefix: '', requirements: [], active: true };

export default function AssistanceTypesPage() {
  const [records, setRecords] = useState<AssistanceTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [editing, setEditing] = useState<AssistanceTypeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AssistanceTypeInput>(emptyForm);
  const [requirementsText, setRequirementsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  async function loadRecords() {
    setLoading(true);
    setLoadError('');
    try {
      setRecords(await getAssistanceTypeRecords());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load assistance types.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRecords(); }, []);

  function beginCreate() {
    setEditing(null);
    setForm({ ...emptyForm, requirements: [] });
    setRequirementsText('');
    setFormError('');
    setFormOpen(true);
  }

  function beginEdit(record: AssistanceTypeRecord) {
    setEditing(record);
    setForm({ ...record });
    setRequirementsText(record.requirements.join('\n'));
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm({ ...emptyForm, requirements: [] });
    setRequirementsText('');
    setFormError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requirements = requirementsText.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!requirements.length) {
      setFormError('Add at least one requirement.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, requirements };
      const saved = editing
        ? await updateAssistanceType(editing.id, { name: payload.name, requirements: payload.requirements, active: payload.active })
        : await createAssistanceType(payload);
      setRecords((current) => editing
        ? current.map((record) => record.id === saved.id ? saved : record).sort((a, b) => a.name.localeCompare(b.name))
        : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      closeForm();
    } catch (error) {
      setFormError(error instanceof AssistanceTypeApiError ? error.message : 'Unable to save this assistance type.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: AssistanceTypeRecord) {
    if (!window.confirm(`Delete or deactivate “${record.name}”? Types with existing appointments will be deactivated to preserve booking history.`)) return;
    setDeletingId(record.id);
    setLoadError('');
    try {
      const result = await deleteAssistanceType(record.id);
      setRecords((current) => result.active
        ? current.map((item) => item.id === result.id ? result : item)
        : current.filter((item) => item.id !== result.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to delete this assistance type.');
    } finally {
      setDeletingId('');
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const text = `${record.code} ${record.name} ${record.codePrefix} ${record.requirements.join(' ')}`.toLowerCase();
      return (!query || text.includes(query)) && (activeFilter === 'All' || record.active === (activeFilter === 'Active'));
    });
  }, [records, search, activeFilter]);

  return (
    <div className="w-full max-w-none">
      <header className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2e3192]/65">Booking configuration · Catalog</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-[34px]">Assistance Types</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Manage the assistance choices and documentary requirements shown to applicants before they book.</p>
        </div>
        <button type="button" onClick={beginCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2e3192]/90"><Plus size={17} /> Add assistance type</button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Assistance type summary">
        <SummaryCard label="Total types" value={records.length} />
        <SummaryCard label="Active for booking" value={records.filter((record) => record.active).length} />
        <SummaryCard label="Requirements" value={records.reduce((total, record) => total + record.requirements.length, 0)} note="Stored with each type" />
      </section>

      {loadError && <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[0.05] p-4 text-sm text-[#ee1c25]"><AlertCircle size={17} className="mt-0.5 shrink-0" />{loadError}</p>}

      {formOpen && <section className="mb-6 rounded-2xl border border-[#2e3192]/15 bg-white p-5 shadow-[0_12px_36px_rgba(46,49,146,0.06)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit assistance type' : 'Create assistance type'}</h2><p className="mt-1 text-xs text-slate-500">Code and appointment reference prefix stay fixed after creation.</p></div><button type="button" onClick={closeForm} aria-label="Close form" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={16} /></button></div>
        {formError && <p role="alert" className="mb-4 rounded-lg bg-[#ee1c25]/[0.06] p-3 text-sm text-[#ee1c25]">{formError}</p>}
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Assistance name *"><input required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Hospital bill" className={inputClass} /></Field>
          <Field label="Catalog code *"><input required disabled={Boolean(editing)} minLength={2} maxLength={10} pattern="[A-Za-z0-9]+" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="e.g. HOS" className={`${inputClass} disabled:bg-slate-100`} /></Field>
          <Field label="Appointment reference prefix *"><input required disabled={Boolean(editing)} maxLength={3} minLength={3} pattern="[A-Za-z0-9]{3}" value={form.codePrefix} onChange={(event) => setForm((current) => ({ ...current, codePrefix: event.target.value.toUpperCase() }))} placeholder="3 characters" className={`${inputClass} disabled:bg-slate-100`} /></Field>
          <label className="flex items-center gap-2 self-end rounded-xl border border-[#2e3192]/15 px-3 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 accent-[#2e3192]" />Active for new bookings</label>
          <Field label="Requirements (one per line) *" className="sm:col-span-2"><textarea required rows={7} maxLength={4000} value={requirementsText} onChange={(event) => setRequirementsText(event.target.value)} placeholder={'Valid ID of claimant\nSupporting document for requested assistance'} className={textareaClass} /><span className="mt-1 block text-[11px] text-slate-500">These requirements are displayed to applicants in Step 2. Verify official requirements with the relevant DSWD Field Office.</span></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={closeForm} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2e3192] px-4 text-sm font-bold text-white hover:bg-[#2e3192]/90 disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : null}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create type'}</button></div>
        </form>
      </section>}

      <section className="overflow-hidden rounded-2xl border border-[#2e3192]/15 bg-white shadow-[0_12px_36px_rgba(46,49,146,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#2e3192]/15 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-base font-bold text-slate-800">Assistance type catalog <span className="ml-1 rounded-full bg-[#2e3192]/[0.06] px-2 py-0.5 text-xs text-[#2e3192]">{filtered.length}</span></h2><p className="mt-1 text-xs text-slate-500">Type records and applicant requirements stored in MongoDB.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><span className="sr-only">Search assistance types</span><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or requirement…" className={`${inputClass} pl-9 sm:w-72`} /></label>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as 'All' | 'Active' | 'Inactive')} aria-label="Filter by status" className={inputClass}><option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
          </div>
        </div>
        {loading ? <div className="grid min-h-52 place-items-center text-sm text-slate-500"><span><LoaderCircle size={18} className="mr-2 inline animate-spin text-[#2e3192]" />Loading assistance types…</span></div> : filtered.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left"><thead className="bg-[#f6f7ff] text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-3.5">Type</th><th className="px-4 py-3.5">Codes</th><th className="px-4 py-3.5">Requirements</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#2e3192]/[0.08]">{filtered.map((record) => <tr key={record.id} className="align-top hover:bg-[#2e3192]/[0.02]">
              <td className="px-5 py-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fef200]/[0.35] text-[#2e3192]"><ClipboardList size={17} /></span><div><p className="text-sm font-bold text-slate-800">{record.name}</p><p className="mt-1 text-[10px] text-slate-500">Created {formatDate(record.createdAt)}</p></div></div></td>
              <td className="px-4 py-4"><p className="font-mono text-xs font-bold text-[#2e3192]">{record.code}</p><p className="mt-1 text-[10px] text-slate-500">Ref: {record.codePrefix}</p></td>
              <td className="max-w-[520px] px-4 py-4"><p className="text-xs leading-5 text-slate-600">{record.requirements.slice(0, 3).join(' · ')}{record.requirements.length > 3 ? ` · +${record.requirements.length - 3} more` : ''}</p><p className="mt-1 text-[10px] text-slate-400">{record.requirements.length} requirement(s)</p></td>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${record.active ? 'bg-[#2e3192]/[0.08] text-[#2e3192]' : 'bg-[#ee1c25]/[0.08] text-[#ee1c25]'}`}>{record.active ? 'Active' : 'Inactive'}</span></td>
              <td className="px-5 py-4 text-right"><div className="inline-flex items-center gap-2"><button type="button" onClick={() => beginEdit(record)} aria-label={`Edit ${record.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#2e3192]/20 text-[#2e3192] hover:bg-[#2e3192]/[0.04]"><Pencil size={14} /></button><button type="button" onClick={() => handleDelete(record)} disabled={deletingId === record.id} aria-label={`${record.active ? 'Delete or deactivate' : 'Delete'} ${record.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#ee1c25]/20 text-[#ee1c25] hover:bg-[#ee1c25]/[0.05] disabled:opacity-50">{deletingId === record.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}</button></div></td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="grid min-h-52 place-items-center px-5 text-center"><div><ClipboardList size={25} className="mx-auto text-[#2e3192]/50" /><p className="mt-3 text-sm font-semibold text-slate-700">{loadError ? 'Assistance types could not be loaded' : 'No assistance types match your filters'}</p><p className="mt-1 text-xs text-slate-500">{loadError || 'Try another search or add an assistance type.'}</p></div></div>}
      </section>
      <p className="mt-4 text-xs leading-5 text-slate-500">Code and reference prefix are immutable after creation. Assistance types with appointment history are deactivated rather than permanently deleted.</p>
    </div>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return <div className="rounded-2xl border border-[#2e3192]/15 bg-white p-4 shadow-[0_12px_36px_rgba(46,49,146,0.04)]"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-800">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-semibold text-slate-600 ${className}`}>{label}{children}</label>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
}

const inputClass = 'mt-1.5 block h-10 w-full rounded-lg border border-[#2e3192]/20 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10 disabled:bg-slate-100';
const textareaClass = 'mt-1.5 block w-full resize-y rounded-lg border border-[#2e3192]/20 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10';
