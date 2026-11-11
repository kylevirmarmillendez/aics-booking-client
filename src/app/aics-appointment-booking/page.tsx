'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Download, HeartHandshake, LoaderCircle, LockKeyhole, Mail, Phone, ScanQrCode, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import {
  BookingApiError,
  cancelBooking,
  createBooking,
  getAvailability,
  getBookingRules,
  lookupBooking,
  type AssistanceType,
  type Availability,
  type BookingRules,
  type PublicAppointment
} from '@/lib/bookingApi';

type Language = 'en' | 'fil' | 'ceb' | 'hil';
const PRIVACY_COPY: Record<Language, { subtitle: string; paragraphs: string[]; accept: string; proceed: string }> = {
  en: {
    subtitle: 'Personal Information Collection and Use',
    paragraphs: [
      'DSWD is committed to safeguarding your personal and sensitive personal information. Your data may be collected through forms, intake sheets, visitor logs, and other official channels, as authorized or required by law.',
      'Your information is processed for the delivery of social welfare and development services and the implementation of DSWD programs. Disclosure is made only with your consent or when authorized or required by law.',
      'Appropriate security measures protect your data in accordance with the Data Privacy Act of 2012 and relevant National Privacy Commission issuances.',
      'For privacy concerns, contact the Data Protection Officer at dpo@dswd.gov.ph.'
    ],
    accept: 'I have read and understood this Data Privacy Notice.',
    proceed: 'I acknowledge and proceed'
  },
  fil: {
    subtitle: 'Pagkolekta at Paggamit ng Personal na Impormasyon',
    paragraphs: [
      'Nakatuon ang DSWD sa pangangalaga ng inyong personal at sensitibong personal na impormasyon. Maaaring kolektahin ang datos sa pamamagitan ng mga form at iba pang opisyal na paraan, alinsunod sa batas.',
      'Pinoproseso ang impormasyon para sa paghahatid ng mga serbisyong panlipunan at pagpapatupad ng mga programa ng DSWD. Ibabahagi lamang ito nang may pahintulot o kung pinahihintulutan ng batas.',
      'Pinoprotektahan ang inyong datos alinsunod sa Data Privacy Act of 2012 at mga kaugnay na patakaran ng National Privacy Commission.',
      'Para sa mga alalahanin sa privacy, makipag-ugnayan sa Data Protection Officer sa dpo@dswd.gov.ph.'
    ],
    accept: 'Nabasa at naunawaan ko ang Data Privacy Notice na ito.',
    proceed: 'Kinikilala ko at magpapatuloy'
  },
  ceb: {
    subtitle: 'Pagkolekta ug Paggamit sa Personal nga Impormasyon',
    paragraphs: [
      'Ang DSWD komitado sa pagpanalipod sa inyong personal ug sensitibong personal nga impormasyon. Mahimong kolektahon ang datos pinaagi sa mga form ug uban pang opisyal nga pamaagi sumala sa balaod.',
      'Ipahigayon ang pagproseso alang sa paghatag sa mga serbisyo sa social welfare ug pagpatuman sa mga programa sa DSWD. Ipaambit lamang kini kon gitugotan o gikinahanglan sa balaod.',
      'Gipanalipdan ang inyong datos subay sa Data Privacy Act of 2012 ug may kalabotan nga mga lagda sa National Privacy Commission.',
      'Alang sa mga kabalaka sa privacy, kontaka ang Data Protection Officer sa dpo@dswd.gov.ph.'
    ],
    accept: 'Nabasa ug nasabtan nako kini nga Data Privacy Notice.',
    proceed: 'Akong gikumpirma ug mopadayon'
  },
  hil: {
    subtitle: 'Pagkolekta kag Paggamit sang Personal nga Impormasyon',
    paragraphs: [
      'Ang DSWD komitado sa pag-amlig sang inyo personal kag sensitibo nga impormasyon. Mahimo kolektahon ang datos paagi sa mga form kag iban nga opisyal nga pamaagi suno sa kasuguan.',
      'Ginaproseso ang impormasyon para sa paghatag sang mga serbisyo sosyal kag pagpatuman sang mga programa sang DSWD. Ginapaambit lamang ini kon ginatugutan ukon ginapatuman sang kasuguan.',
      'Ginaprotektahan ang inyo datos suno sa Data Privacy Act of 2012 kag may kaangtanan nga mga patakaran sang National Privacy Commission.',
      'Para sa mga kabalaka sa privacy, kontaka ang Data Protection Officer sa dpo@dswd.gov.ph.'
    ],
    accept: 'Nabasa kag naintiendihan ko ini nga Data Privacy Notice.',
    proceed: 'Ginakilala ko kag magapadayon'
  }
};

const inputClass = 'mt-2 h-12 w-full rounded-xl border border-[#2e3192]/20 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2e3192] focus:ring-4 focus:ring-[#2e3192]/10 disabled:bg-slate-100';
const labelClass = 'block text-sm font-semibold text-slate-700';

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'full', timeZone: 'Asia/Manila' }).format(date);
}

function findScannedName(rawValue: string): string {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    const values: Record<string, string> = {};
    function walk(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) return value.forEach(walk);
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        if (typeof item === 'string') {
          const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
          if (['lastname', 'surname', 'familyname', 'lname'].includes(normalized)) values.last = item.trim();
          if (['firstname', 'givenname', 'fname'].includes(normalized)) values.first = item.trim();
          if (['middlename', 'middleinitial', 'mname'].includes(normalized)) values.middle = item.trim();
        } else walk(item);
      });
    }
    walk(parsed);
    if (values.last && values.first) return `${values.last}, ${values.first}${values.middle ? ` ${values.middle[0]}.` : ''}`;
  } catch {
    const labels = rawValue.match(/(?:last\s*name|surname)\s*[:=]\s*([^|;\n]+)[|;\n].*?(?:first\s*name|given\s*name)\s*[:=]\s*([^|;\n]+)/i);
    if (labels) return `${labels[1].trim()}, ${labels[2].trim()}`;
  }
  return '';
}

export default function AicsAppointmentBookingPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [checkingPrivacy, setCheckingPrivacy] = useState(true);
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [form, setForm] = useState({ typeOfAssistance: '' as AssistanceType | '', fullName: '', cellNumber: '', email: '', appointmentDate: '', timeSlot: '' });
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingRules, setLoadingRules] = useState(true);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<PublicAppointment | null>(null);
  const [lookupCode, setLookupCode] = useState('');
  const [lookupCell, setLookupCell] = useState('');
  const [lookupResult, setLookupResult] = useState<PublicAppointment | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const availabilityRequest = useRef(0);
  const copy = PRIVACY_COPY[language];

  useEffect(() => {
    const acknowledged = sessionStorage.getItem('aicsPrivacyAcknowledgedV11') === 'true';
    setPrivacyAccepted(acknowledged);
    setHasAcceptedPrivacy(acknowledged);
    const savedLanguage = sessionStorage.getItem('aicsPrivacyLanguage') as Language | null;
    if (savedLanguage && savedLanguage in PRIVACY_COPY) setLanguage(savedLanguage);
    setCheckingPrivacy(false);
    getBookingRules()
      .then(setRules)
      .catch((error: unknown) => setBookingError(error instanceof Error ? error.message : 'The booking calendar could not be loaded.'))
      .finally(() => setLoadingRules(false));
  }, []);

  const holidayMap = useMemo(() => new Map((rules?.holidays ?? []).map((holiday) => [holiday.date, holiday.name])), [rules]);
  const dateRestriction = useMemo(() => {
    if (!form.appointmentDate || !rules) return '';
    if (form.appointmentDate < rules.minDate) return 'Past dates cannot be booked.';
    if (form.appointmentDate > rules.maxDate) return 'This date is outside the configured booking calendar.';
    const day = new Date(`${form.appointmentDate}T00:00:00`).getDay();
    if (day === 0 || day === 6) return 'Appointments are not available on weekends.';
    if (holidayMap.has(form.appointmentDate)) return `Appointments are not available on ${holidayMap.get(form.appointmentDate)}.`;
    return '';
  }, [form.appointmentDate, holidayMap, rules]);

  useEffect(() => {
    const requestId = ++availabilityRequest.current;
    setAvailability(null);
    setForm((current) => ({ ...current, timeSlot: '' }));
    if (!form.appointmentDate || !rules || dateRestriction) {
      setCheckingSlots(false);
      return;
    }

    setCheckingSlots(true);
    getAvailability(form.appointmentDate)
      .then((result) => {
        if (requestId === availabilityRequest.current) setAvailability(result);
      })
      .catch((error: unknown) => {
        if (requestId !== availabilityRequest.current) return;
        setBookingError(error instanceof Error ? error.message : 'Availability could not be checked.');
      })
      .finally(() => {
        if (requestId === availabilityRequest.current) setCheckingSlots(false);
      });
  }, [form.appointmentDate, rules, dateRestriction]);

  function acceptPrivacy() {
    if (!privacyAccepted) return;
    sessionStorage.setItem('aicsPrivacyAcknowledgedV11', 'true');
    sessionStorage.setItem('aicsPrivacyLanguage', language);
    setHasAcceptedPrivacy(true);
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setBookingError('');
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError('');
    if (!form.typeOfAssistance || !form.fullName.trim() || !/^09\d{9}$/.test(form.cellNumber.trim()) ||
      (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ||
      !form.appointmentDate || !form.timeSlot || dateRestriction || !availability?.availableSlots.includes(form.timeSlot)) {
      setBookingError(dateRestriction || 'Complete all required fields and choose an available time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        typeOfAssistance: form.typeOfAssistance,
        fullName: form.fullName.trim(),
        cellNumber: form.cellNumber.trim(),
        email: form.email.trim().toLowerCase(),
        appointmentDate: form.appointmentDate,
        timeSlot: form.timeSlot
      });
      setBookingSuccess(created);
      setForm({ typeOfAssistance: '', fullName: '', cellNumber: '', email: '', appointmentDate: '', timeSlot: '' });
      setAvailability(null);
    } catch (error) {
      setBookingError(error instanceof BookingApiError ? error.message : 'The booking could not be completed. Please try again.');
      if (error instanceof BookingApiError && (error.message.includes('filled') || error.message.includes('available'))) {
        getAvailability(form.appointmentDate).then(setAvailability).catch(() => undefined);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError('');
    setLookupMessage('');
    setLookupResult(null);
    if (!/^AICS-(?:MED|FUN)-\d{4}-[A-Z0-9]{5}$/i.test(lookupCode.trim()) || !/^09\d{9}$/.test(lookupCell.trim())) {
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

  async function cancelAppointment() {
    if (!lookupResult?.canCancel || !window.confirm(`Cancel appointment ${lookupResult.appointmentCode}?`)) return;
    setCancelling(true);
    setLookupError('');
    setLookupMessage('');
    try {
      const result = await cancelBooking({
        appointmentCode: lookupResult.appointmentCode,
        cellNumber: lookupCell.trim(),
        cancellationReason: cancellationReason.trim()
      });
      setLookupResult(result.appointment);
      setLookupMessage('Appointment cancelled. The released slot is now available for booking.');
      if (form.appointmentDate === result.appointment.appointmentDate) {
        getAvailability(form.appointmentDate).then(setAvailability).catch(() => undefined);
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'The appointment could not be cancelled.');
    } finally {
      setCancelling(false);
    }
  }

  function downloadConfirmation(appointment: PublicAppointment) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const context = canvas.getContext('2d');
    if (!context) {
      setBookingError('Confirmation image could not be created in this browser.');
      return;
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#2e3192';
    context.fillRect(0, 0, canvas.width, 190);
    context.fillStyle = '#fef200';
    context.fillRect(0, 182, canvas.width, 8);
    context.textAlign = 'center';
    context.fillStyle = '#ffffff';
    context.font = 'bold 42px Arial';
    context.fillText('DSWD AICS APPOINTMENT CONFIRMATION', 600, 78);
    context.fillStyle = '#fff9b8';
    context.font = '24px Arial';
    context.fillText('Official Web Booking Confirmation', 600, 132);
    context.fillStyle = '#f6f7ff';
    context.fillRect(70, 235, 1060, 145);
    context.strokeStyle = '#2e3192';
    context.lineWidth = 2;
    context.strokeRect(70, 235, 1060, 145);
    context.fillStyle = '#2e3192';
    context.font = 'bold 20px Arial';
    context.fillText('APPOINTMENT REFERENCE CODE', 600, 278);
    context.font = 'bold 42px monospace';
    context.fillText(appointment.appointmentCode, 600, 338);
    const rows = [
      ['Applicant', appointment.fullName],
      ['Assistance', `${appointment.assistanceType} Assistance`],
      ['Scheduled date', formatDate(appointment.appointmentDate)],
      ['Time window', appointment.timeSlot],
      ['Status', appointment.status]
    ];
    rows.forEach(([label, value], index) => {
      const y = 455 + index * 64;
      context.textAlign = 'left';
      context.fillStyle = '#64748b';
      context.font = '24px Arial';
      context.fillText(label, 100, y);
      context.textAlign = 'right';
      context.fillStyle = '#1e293b';
      context.font = 'bold 24px Arial';
      context.fillText(value, 1100, y, 700);
      context.strokeStyle = '#e2e8f0';
      context.beginPath();
      context.moveTo(100, y + 22);
      context.lineTo(1100, y + 22);
      context.stroke();
    });
    context.textAlign = 'center';
    context.fillStyle = '#2e3192';
    context.font = 'bold 20px Arial';
    context.fillText('Please keep this confirmation for your records.', 600, 830);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `DSWD-Appointment-${appointment.appointmentCode}.png`;
    link.click();
  }

  function onScan(rawValue: string) {
    const name = findScannedName(rawValue);
    if (!name) {
      setBookingError('QR scanned, but a full name could not be extracted. Enter the name manually.');
      return;
    }
    updateForm('fullName', name);
    setScanOpen(false);
  }

  if (checkingPrivacy) return <div className="grid min-h-screen place-items-center bg-[#f6f7ff] text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Preparing the public booking page…</div>;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(254,242,0,.18),_transparent_30%),linear-gradient(180deg,#f6f7ff_0%,#fff_55%,#f6f7ff_100%)] px-4 py-6 text-slate-800 sm:px-7 sm:py-10">
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2e3192] text-[#fef200] shadow-lg shadow-[#2e3192]/15"><HeartHandshake size={24} /></span><div><p className="text-sm font-extrabold tracking-tight">DSWD <span className="font-medium text-slate-500">| AICS Services</span></p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#2e3192]/70">Public appointment booking</p></div></div>
        <span className="hidden items-center gap-2 rounded-full border border-[#2e3192]/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 sm:inline-flex"><ShieldCheck size={15} className="text-[#2e3192]" /> No account required</span>
      </header>

      {!hasAcceptedPrivacy ? (
        <section className="mx-auto max-w-2xl overflow-hidden rounded-[26px] border border-[#2e3192]/15 bg-white shadow-[0_24px_70px_rgba(46,49,146,0.12)]">
          <div className="border-b-4 border-[#fef200] bg-[#2e3192] p-6 text-white sm:p-8"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#fef200]">Data privacy notice</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">DSWD AICS Appointment Booking</h1><p className="mt-2 text-sm text-white/75">{copy.subtitle}</p></div>
          <div className="space-y-5 p-5 sm:p-8">
            <fieldset><legend className="text-sm font-bold text-[#2e3192]">Choose your language</legend><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['en', 'English'], ['fil', 'Filipino'], ['ceb', 'Bisaya'], ['hil', 'Ilonggo']] as const).map(([key, title]) => <button key={key} type="button" aria-pressed={language === key} onClick={() => { setLanguage(key); setPrivacyAccepted(false); }} className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/15 ${language === key ? 'border-[#2e3192] bg-[#2e3192] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#2e3192]/40'}`}>{title}</button>)}</div></fieldset>
            <div className="space-y-3 rounded-2xl border border-[#2e3192]/10 bg-[#f6f7ff]/70 p-4 text-sm leading-6 text-slate-600">{copy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#2e3192]/15 p-4 text-sm leading-6 text-slate-600"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#2e3192]" /><span>{copy.accept}</span></label>
            <button type="button" disabled={!privacyAccepted} onClick={acceptPrivacy} className="w-full rounded-xl bg-[#2e3192] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#23256f] disabled:cursor-not-allowed disabled:bg-slate-300">{copy.proceed}</button>
          </div>
        </section>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,.92fr)]">
          <section className="overflow-hidden rounded-[26px] border border-[#2e3192]/15 bg-white shadow-[0_24px_70px_rgba(46,49,146,0.09)] lg:col-span-2">
            <div className="border-b-4 border-[#fef200] bg-[#2e3192] px-6 py-7 text-center text-white sm:px-9"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#fef200]">Assistance appointment</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Book your AICS appointment</h1><p className="mt-2 text-sm text-white/75">Medical and funeral assistance scheduling · No login required</p></div>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]">
              <form onSubmit={submitBooking} noValidate className="space-y-5 p-5 sm:p-8">
                <div className="mb-1"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2e3192]/65">Applicant information</p><p className="mt-1 text-xs text-slate-500">Fields marked with <span className="text-[#ee1c25]">*</span> are required.</p></div>
                {bookingError && <div role="alert" className="flex gap-2.5 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[.05] p-3.5 text-sm leading-5 text-[#b9151c]"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p>{bookingError}</p></div>}
                <div><label htmlFor="assistance" className={labelClass}>Type of assistance requested <Required /></label><select id="assistance" required value={form.typeOfAssistance} onChange={(event) => updateForm('typeOfAssistance', event.target.value)} className={inputClass}><option value="">Select assistance type…</option><option value="Medical">Medical assistance</option><option value="Funeral">Funeral assistance</option></select></div>
                <div><label htmlFor="fullName" className={labelClass}>Full name <Required /></label><div className="flex gap-2"><input id="fullName" required minLength={3} maxLength={150} value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} autoComplete="name" placeholder="e.g. Dela Cruz, Juan P." className={inputClass} /><button type="button" onClick={() => setScanOpen(true)} aria-label="Scan National ID QR" title="Scan National ID QR" className="mt-2 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#2e3192]/20 bg-[#fff9b8]/60 text-[#2e3192] transition hover:bg-[#fff9b8]"><ScanQrCode size={20} /></button></div><p className="mt-1.5 text-[11px] text-slate-400">Enter the applicant’s name as it appears on their ID.</p></div>
                <div><label htmlFor="cellNumber" className={labelClass}>Cell number <Required /></label><div className="relative"><Phone size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-slate-400" /><input id="cellNumber" type="tel" required inputMode="numeric" pattern="09[0-9]{9}" maxLength={11} value={form.cellNumber} onChange={(event) => updateForm('cellNumber', event.target.value.replace(/\D/g, '').slice(0, 11))} autoComplete="tel" placeholder="09123456789" className={`${inputClass} pl-10`} /></div><p className="mt-1.5 text-[11px] text-slate-400">Enter an 11-digit mobile number starting with 09.</p></div>
                <div><label htmlFor="email" className={labelClass}>Email address <span className="font-normal text-slate-400">(optional)</span></label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-slate-400" /><input id="email" type="email" maxLength={254} value={form.email} onChange={(event) => updateForm('email', event.target.value)} autoComplete="email" placeholder="juan@email.com" className={`${inputClass} pl-10`} /></div></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="appointmentDate" className={labelClass}>Preferred date <Required /></label><div className="relative"><CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-[#2e3192]" /><input id="appointmentDate" type="date" required min={rules?.minDate} max={rules?.maxDate} value={form.appointmentDate} onChange={(event) => { setBookingError(''); updateForm('appointmentDate', event.target.value); }} disabled={!rules || loadingRules} className={`${inputClass} pl-10`} /></div>{dateRestriction ? <p role="alert" className="mt-1.5 text-xs font-medium text-[#b9151c]">{dateRestriction}</p> : <p className="mt-1.5 text-[11px] leading-4 text-slate-400">Weekends and Philippine regular holidays are unavailable.</p>}</div>
                  <div><label htmlFor="timeSlot" className={labelClass}>Preferred time slot <Required /></label><div className="relative"><Clock3 size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-[#2e3192]" /><select id="timeSlot" required value={form.timeSlot} disabled={!availability || checkingSlots || !availability.availableSlots.length} onChange={(event) => updateForm('timeSlot', event.target.value)} className={`${inputClass} pl-10`}><option value="">{checkingSlots ? 'Checking availability…' : !form.appointmentDate ? 'Choose a date first' : availability?.isFullyBooked ? 'Fully booked' : 'Select a time…'}</option>{availability?.availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></div>{availability?.isFullyBooked && <p className="mt-1.5 text-xs font-semibold text-[#b9151c]">No slots remain for this day. Please choose another date.</p>}</div>
                </div>
                <button type="submit" disabled={submitting || checkingSlots || !availability?.availableSlots.length || !form.timeSlot || !rules?.available} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/20 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? <><LoaderCircle size={17} className="animate-spin" />Processing appointment…</> : 'Book appointment'}</button>
                <p className="text-center text-[11px] leading-5 text-slate-400">Your information is used to process and manage your assistance appointment request.</p>
              </form>

              <aside className="border-t border-[#2e3192]/10 bg-[#f6f7ff]/65 p-5 sm:p-8 lg:border-l lg:border-t-0">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><CalendarDays size={19} /></span><div><h2 className="text-sm font-extrabold text-slate-800">Daily availability</h2><p className="mt-1 text-xs text-slate-500">Choose a date to view open times.</p></div></div>
                {loadingRules ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#2e3192]/10 bg-white p-4 text-xs text-slate-500"><LoaderCircle size={15} className="animate-spin text-[#2e3192]" />Loading the Philippine booking calendar…</div> : !rules?.available ? <div role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">The booking calendar is not currently accepting appointments. Please check back later.</div> : <>
                  <div className="mt-6 rounded-2xl border border-[#2e3192]/15 bg-white p-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#2e3192]">Remaining</p><p className="mt-1 text-sm font-semibold text-slate-700">{form.appointmentDate ? formatDate(form.appointmentDate) : 'Select an appointment date'}</p></div><div className="text-right"><span className={`text-3xl font-black ${availability?.remainingSlots === 0 ? 'text-[#ee1c25]' : 'text-[#2e3192]'}`}>{availability?.remainingSlots ?? '—'}</span><span className="block text-[10px] font-semibold text-slate-400">of {rules.dailyCapacity} slots</span></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#fff9b8]"><div className={`h-full rounded-full transition-all ${availability?.remainingSlots === 0 ? 'bg-[#ee1c25]' : 'bg-[#2e3192]'}`} style={{ width: `${availability ? Math.max(0, availability.remainingSlots / rules.dailyCapacity * 100) : 0}%` }} /></div></div>
                  <div className="mt-4 space-y-2">{rules.timeSlots.map((slot) => { const isAvailable = availability?.availableSlots.includes(slot); const isChecked = checkingSlots && Boolean(form.appointmentDate); return <div key={slot} className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-xs ${isAvailable ? 'border-[#2e3192]/15 bg-white text-slate-700' : 'border-slate-200/80 bg-white/60 text-slate-400'}`}><span className="flex items-center gap-2"><Clock3 size={14} className={isAvailable ? 'text-[#2e3192]' : 'text-slate-300'} />{slot}</span><span className={`font-bold ${isChecked ? 'text-slate-400' : isAvailable ? 'text-emerald-700' : 'text-slate-400'}`}>{isChecked ? 'Checking' : !availability ? '—' : isAvailable ? 'Open' : 'Full'}</span></div>; })}</div>
                  <div className="mt-5 rounded-xl border border-[#2e3192]/10 bg-white p-4"><h3 className="text-xs font-bold text-slate-700">Appointment details</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />80 appointments maximum each day.</li><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />Up to 14 appointments per time window.</li><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />A reference code is issued after a successful booking.</li></ul></div>
                </>}
                {bookingError && <div role="status" className="mt-4 break-words rounded-xl border border-[#ee1c25]/15 bg-[#ee1c25]/[.04] p-3 text-xs leading-5 text-[#b9151c]">{bookingError}</div>}
              </aside>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-[#2e3192]/15 bg-white shadow-[0_16px_50px_rgba(46,49,146,0.07)] lg:col-span-2">
            <div className="border-b border-[#2e3192]/10 bg-[#2e3192] px-5 py-5 text-white sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fef200]"><Search size={19} /></span><div><h2 className="text-lg font-extrabold">Manage an appointment</h2><p className="mt-1 text-xs text-white/70">Find or cancel an existing booking securely.</p></div></div></div>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
              <form onSubmit={submitLookup} className="space-y-4">
                <div><label htmlFor="lookupCode" className={labelClass}>Appointment reference code <Required /></label><input id="lookupCode" required value={lookupCode} onChange={(event) => setLookupCode(event.target.value.toUpperCase())} placeholder="AICS-MED-2026-ABCDE" className={`${inputClass} font-mono tracking-wide`} /></div>
                <div><label htmlFor="lookupCell" className={labelClass}>Cell number used for booking <Required /></label><input id="lookupCell" type="tel" inputMode="numeric" required pattern="09[0-9]{9}" maxLength={11} value={lookupCell} onChange={(event) => setLookupCell(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09123456789" className={inputClass} /></div>
                <button type="submit" disabled={lookingUp} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white transition hover:bg-[#23256f] disabled:opacity-60">{lookingUp ? <><LoaderCircle size={16} className="animate-spin" />Finding…</> : <><Search size={16} />Find appointment</>}</button>
                {lookupError && <p role="alert" className="rounded-xl bg-[#ee1c25]/[.05] p-3 text-xs leading-5 text-[#b9151c]">{lookupError}</p>}
              </form>
              <div className="min-h-36 rounded-2xl border border-dashed border-[#2e3192]/20 bg-[#f6f7ff]/60 p-4 sm:p-5">
                {lookupResult ? <><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2e3192]">Appointment found</p><p className="mt-1 font-mono text-lg font-extrabold tracking-wide text-[#2e3192]">{lookupResult.appointmentCode}</p></div><StatusPill status={lookupResult.status} /></div><dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-slate-400">Applicant</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.fullName}</dd><dt className="text-slate-400">Assistance</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.assistanceType}</dd><dt className="text-slate-400">Date</dt><dd className="text-right font-semibold text-slate-700">{formatDate(lookupResult.appointmentDate)}</dd><dt className="text-slate-400">Time</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.timeSlot}</dd></dl>{lookupResult.canCancel && <div className="mt-4 border-t border-[#2e3192]/10 pt-4"><label htmlFor="cancelReason" className="text-xs font-semibold text-slate-700">Cancellation reason <span className="font-normal text-slate-400">(optional)</span></label><textarea id="cancelReason" rows={2} maxLength={500} value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} placeholder="Optional note" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ee1c25] focus:ring-4 focus:ring-[#ee1c25]/10" /><button type="button" onClick={cancelAppointment} disabled={cancelling} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#ee1c25] px-3 text-xs font-bold text-white transition hover:bg-[#b9151c] disabled:opacity-60">{cancelling ? <LoaderCircle size={15} className="animate-spin" /> : null}{cancelling ? 'Cancelling…' : 'Cancel appointment'}</button></div>}{lookupMessage && <p role="status" className="mt-3 text-xs font-medium text-emerald-700">{lookupMessage}</p>}</> : <div className="grid h-full min-h-32 place-items-center text-center"><div><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white text-[#2e3192]"><LockKeyhole size={17} /></span><p className="mt-3 text-sm font-semibold text-slate-600">Your booking details will appear here</p><p className="mt-1 text-xs text-slate-400">Only the matching reference code and mobile number can find an appointment.</p></div></div>}
              </div>
            </div>
          </section>
          <footer className="px-2 text-center text-[10px] leading-5 text-slate-400 lg:col-span-2">Republic of the Philippines · Department of Social Welfare and Development<br />Your personal information is handled in accordance with the Data Privacy Act of 2012.</footer>
        </div>
      )}

      {bookingSuccess && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><section className="w-full max-w-md overflow-hidden rounded-[26px] bg-white shadow-2xl"><div className="border-b border-dashed border-slate-200 p-6 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span><h2 id="confirmation-title" className="mt-4 text-xl font-extrabold text-slate-800">Appointment request received</h2><p className="mt-1 text-xs text-slate-500">Keep this reference code for your records.</p><div className="mt-5 rounded-2xl border border-[#2e3192]/15 bg-[#f6f7ff] px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#2e3192]">Appointment reference code</p><p className="mt-1 break-all font-mono text-xl font-black tracking-wider text-[#2e3192]">{bookingSuccess.appointmentCode}</p></div><dl className="mt-5 grid grid-cols-[100px_1fr] gap-x-3 gap-y-3 text-left text-xs"><dt className="text-slate-400">Applicant</dt><dd className="text-right font-semibold text-slate-700">{bookingSuccess.fullName}</dd><dt className="text-slate-400">Assistance</dt><dd className="text-right font-semibold text-slate-700">{bookingSuccess.assistanceType} assistance</dd><dt className="text-slate-400">Scheduled date</dt><dd className="text-right font-semibold text-slate-700">{formatDate(bookingSuccess.appointmentDate)}</dd><dt className="text-slate-400">Time window</dt><dd className="text-right font-semibold text-slate-700">{bookingSuccess.timeSlot}</dd><dt className="text-slate-400">Status</dt><dd className="text-right"><StatusPill status={bookingSuccess.status} /></dd></dl><p className="mt-5 rounded-xl bg-[#fff9b8]/55 p-3 text-xs leading-5 text-[#2e3192]">Present a copy of your confirmation code when you arrive for your appointment.</p></div><div className="flex flex-col gap-2 bg-slate-50 p-4 sm:flex-row"><button type="button" onClick={() => downloadConfirmation(bookingSuccess)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white hover:bg-[#23256f]"><Download size={16} />Download confirmation</button><button type="button" onClick={() => setBookingSuccess(null)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-300"><X size={15} />Close</button></div></section></div>}
      {scanOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="scanner-title"><section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between bg-[#2e3192] p-4 text-white"><h2 id="scanner-title" className="text-sm font-bold">Scan National ID QR</h2><button type="button" onClick={() => setScanOpen(false)} aria-label="Close scanner"><X size={18} /></button></div><div className="p-4"><div className="overflow-hidden rounded-xl bg-slate-950"><Scanner onScan={(codes) => { const value = codes[0]?.rawValue; if (value) onScan(value); }} onError={() => setBookingError('Camera access is unavailable. Use a secure connection or enter the name manually.')} formats={['qr_code']} constraints={{ facingMode: 'environment' }} /></div><p className="mt-3 text-center text-xs text-slate-500">Camera access requires permission and a secure connection.</p></div></section></div>}
    </main>
  );
}

function Required() {
  return <span className="ml-1 text-[#ee1c25]" aria-label="required">*</span>;
}

function StatusPill({ status }: { status: PublicAppointment['status'] }) {
  const styles: Record<PublicAppointment['status'], string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Confirmed: 'bg-emerald-100 text-emerald-800',
    Completed: 'bg-[#2e3192]/10 text-[#2e3192]',
    Cancelled: 'bg-[#ee1c25]/10 text-[#b9151c]'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}
