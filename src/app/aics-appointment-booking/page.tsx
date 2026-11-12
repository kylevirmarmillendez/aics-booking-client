'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Download, HeartHandshake, LoaderCircle, LockKeyhole, Mail, Phone, ScanQrCode, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import {
  BookingApiError,
  cancelBooking,
  createBooking,
  getAssistanceTypes,
  getBookingOffices,
  getAvailability,
  getBookingRules,
  lookupBooking,
  type AssistanceType,
  type Availability,
  type BookingRules,
  type BookingOffice,
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

function findScannedName(rawValue: string): { firstName: string; middleName: string; lastName: string } | null {
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
    if (values.last && values.first) return { firstName: values.first, middleName: values.middle ?? '', lastName: values.last };
  } catch {
    const labels = rawValue.match(/(?:last\s*name|surname)\s*[:=]\s*([^|;\n]+)[|;\n].*?(?:first\s*name|given\s*name)\s*[:=]\s*([^|;\n]+)/i);
    if (labels) {
      const middle = rawValue.match(/(?:middle\s*name|middle\s*initial)\s*[:=]\s*([^|;\n]+)/i);
      return { firstName: labels[2].trim(), middleName: middle?.[1].trim() ?? '', lastName: labels[1].trim() };
    }
  }
  return null;
}

export default function AicsAppointmentBookingPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [bookingStep, setBookingStep] = useState<'request' | 'requirements' | 'privacy' | 'details'>('privacy');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [checkingPrivacy, setCheckingPrivacy] = useState(true);
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [assistanceTypes, setAssistanceTypes] = useState<AssistanceType[]>([]);
  const [assistanceTypesError, setAssistanceTypesError] = useState('');
  const [offices, setOffices] = useState<BookingOffice[]>([]);
  const [officesError, setOfficesError] = useState('');
  const [form, setForm] = useState({ officeSlug: '', typeOfAssistance: '', firstName: '', middleName: '', lastName: '', birthdate: '', cellNumber: '', email: '', appointmentDate: '', timeSlot: '' });
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
  const selectedAssistanceType = assistanceTypes.find((type) => type.name === form.typeOfAssistance);
  const selectedOffice = offices.find((office) => office.slug === form.officeSlug);

  useEffect(() => {
    const savedLanguage = sessionStorage.getItem('aicsPrivacyLanguage') as Language | null;
    if (savedLanguage && savedLanguage in PRIVACY_COPY) setLanguage(savedLanguage);
    setCheckingPrivacy(false);
    getBookingRules()
      .then(setRules)
      .catch((error: unknown) => setBookingError(error instanceof Error ? error.message : 'The booking calendar could not be loaded.'))
      .finally(() => setLoadingRules(false));
    getAssistanceTypes()
      .then(setAssistanceTypes)
      .catch((error: unknown) => setAssistanceTypesError(error instanceof Error ? error.message : 'Assistance types could not be loaded.'));
    getBookingOffices()
      .then(setOffices)
      .catch((error: unknown) => setOfficesError(error instanceof Error ? error.message : 'Offices could not be loaded.'));
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
    if (!form.appointmentDate || !form.officeSlug || !rules || dateRestriction) {
      setCheckingSlots(false);
      return;
    }

    setCheckingSlots(true);
    getAvailability(form.appointmentDate, form.officeSlug)
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
  }, [form.appointmentDate, form.officeSlug, rules, dateRestriction]);

  function acceptPrivacy() {
    if (!privacyAccepted) return;
    sessionStorage.setItem('aicsPrivacyLanguage', language);
    setBookingStep('request');
  }

  function continueFromRequest() {
    setBookingError('');
    if (!form.officeSlug || !form.typeOfAssistance || !form.appointmentDate || !form.timeSlot || dateRestriction ||
      !availability?.availableSlots.includes(form.timeSlot)) {
      setBookingError(dateRestriction || 'Choose an office, assistance type, available date, and available time period.');
      return;
    }
    setBookingStep('requirements');
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setBookingError('');
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError('');
    if (!form.officeSlug || !form.typeOfAssistance || !form.firstName.trim() || !form.lastName.trim() || !form.birthdate || form.birthdate > localDateString() || !/^09\d{9}$/.test(form.cellNumber.trim()) ||
      (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ||
      !form.appointmentDate || !form.timeSlot || dateRestriction || !availability?.availableSlots.includes(form.timeSlot)) {
      setBookingError(dateRestriction || 'Complete all required fields and choose an available time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        typeOfAssistance: form.typeOfAssistance,
        officeSlug: form.officeSlug,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        birthdate: form.birthdate,
        cellNumber: form.cellNumber.trim(),
        email: form.email.trim().toLowerCase(),
        appointmentDate: form.appointmentDate,
        timeSlot: form.timeSlot
      });
      setBookingSuccess(created);
      setForm({ officeSlug: '', typeOfAssistance: '', firstName: '', middleName: '', lastName: '', birthdate: '', cellNumber: '', email: '', appointmentDate: '', timeSlot: '' });
      setAvailability(null);
      setBookingStep('privacy');
    } catch (error) {
      setBookingError(error instanceof BookingApiError ? error.message : 'The booking could not be completed. Please try again.');
      if (error instanceof BookingApiError && (error.message.includes('filled') || error.message.includes('available'))) {
        getAvailability(form.appointmentDate, form.officeSlug).then(setAvailability).catch(() => undefined);
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
      if (form.appointmentDate === result.appointment.appointmentDate && form.officeSlug === result.appointment.officeSlug) {
        getAvailability(form.appointmentDate, form.officeSlug).then(setAvailability).catch(() => undefined);
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
      ['Office', appointment.officeName || ''],
      ['Assistance', appointment.assistanceType],
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
      setBookingError('QR scanned, but the first and last names could not be extracted. Enter the name manually.');
      return;
    }
    setForm((current) => ({ ...current, ...name }));
    setBookingError('');
    setScanOpen(false);
  }

  if (checkingPrivacy) return <div className="grid min-h-screen place-items-center bg-[#f6f7ff] text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Preparing the public booking page…</div>;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(254,242,0,.18),_transparent_30%),linear-gradient(180deg,#f6f7ff_0%,#fff_55%,#f6f7ff_100%)] px-4 py-6 text-slate-800 sm:px-7 sm:py-10">
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2e3192] text-[#fef200] shadow-lg shadow-[#2e3192]/15"><HeartHandshake size={24} /></span><div><p className="text-sm font-extrabold tracking-tight">DSWD <span className="font-medium text-slate-500">| AICS Services</span></p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#2e3192]/70">Public appointment booking</p></div></div>
        <span className="hidden items-center gap-2 rounded-full border border-[#2e3192]/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 sm:inline-flex"><ShieldCheck size={15} className="text-[#2e3192]" /> No account required</span>
      </header>

      {bookingSuccess ? (
        <section className="mx-auto max-w-2xl overflow-hidden rounded-[26px] border border-[#2e3192]/15 bg-white shadow-[0_24px_70px_rgba(46,49,146,0.12)]">
          <div className="border-b-4 border-[#fef200] bg-[#2e3192] p-6 text-center text-white sm:p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/10 text-[#fef200]"><CheckCircle2 size={30} /></span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#fef200]">Booking confirmation</p>
            <h1 id="confirmation-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Appointment request received</h1>
            <p className="mt-2 text-sm text-white/75">Keep this reference code for your records.</p>
          </div>
          <div className="space-y-5 p-5 sm:p-8">
            <div className="rounded-2xl border border-[#2e3192]/15 bg-[#f6f7ff] px-4 py-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#2e3192]">Appointment reference code</p>
              <p className="mt-2 break-all font-mono text-2xl font-black tracking-wider text-[#2e3192]">{bookingSuccess.appointmentCode}</p>
            </div>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 rounded-2xl border border-slate-200 p-4 text-sm">
              <dt className="text-slate-500">Applicant</dt><dd className="text-right font-semibold text-slate-800">{bookingSuccess.fullName}</dd>
              <dt className="text-slate-500">Office</dt><dd className="text-right font-semibold text-slate-800">{bookingSuccess.officeName}</dd>
              <dt className="text-slate-500">Assistance</dt><dd className="text-right font-semibold text-slate-800">{bookingSuccess.assistanceType}</dd>
              <dt className="text-slate-500">Birthdate</dt><dd className="text-right font-semibold text-slate-800">{bookingSuccess.birthdate}</dd>
              <dt className="text-slate-500">Date</dt><dd className="text-right font-semibold text-slate-800">{formatDate(bookingSuccess.appointmentDate)}</dd>
              <dt className="text-slate-500">Period</dt><dd className="text-right font-semibold text-slate-800">{bookingSuccess.timeSlot}</dd>
              <dt className="text-slate-500">Status</dt><dd className="text-right"><StatusPill status={bookingSuccess.status} /></dd>
            </dl>
            <p className="rounded-xl bg-[#fff9b8]/55 p-3 text-center text-xs leading-5 text-[#2e3192]">Present a copy of your confirmation code when you arrive for your appointment.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => downloadConfirmation(bookingSuccess)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white hover:bg-[#23256f]"><Download size={16} />Download confirmation</button>
              <button type="button" onClick={() => setBookingSuccess(null)} className="h-12 rounded-xl border border-[#2e3192]/20 px-4 text-sm font-bold text-[#2e3192] hover:bg-[#f6f7ff]">Start another booking</button>
            </div>
          </div>
        </section>
      ) : bookingStep === 'privacy' ? (
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
        <div className={bookingStep === 'details' || bookingStep === 'requirements' ? 'mx-auto max-w-2xl' : 'mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,.92fr)]'}>
          <section className="overflow-hidden rounded-[26px] border border-[#2e3192]/15 bg-white shadow-[0_24px_70px_rgba(46,49,146,0.09)] lg:col-span-2">
            <div className="border-b-4 border-[#fef200] bg-[#2e3192] px-6 py-7 text-center text-white sm:px-9"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#fef200]">Assistance appointment</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Book your AICS appointment</h1><p className="mt-2 text-sm text-white/75">Hospital bill, medicine, laboratory, and burial assistance · No login required</p></div>
            <div className={bookingStep !== 'request' ? 'grid gap-0' : 'grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]'}>
              <form onSubmit={submitBooking} noValidate className="space-y-5 p-5 sm:p-8">
                {bookingError && <div role="alert" className="flex gap-2.5 rounded-xl border border-[#ee1c25]/20 bg-[#ee1c25]/[.05] p-3.5 text-sm leading-5 text-[#b9151c]"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p>{bookingError}</p></div>}
                {bookingStep === 'request' ? (
                  <>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2e3192]/65">Step 1 · Appointment request</p><p className="mt-1 text-xs text-slate-500">Fields marked with <span className="text-[#ee1c25]">*</span> are required.</p></div>
                    <div><label htmlFor="office" className={labelClass}>Office <Required /></label><select id="office" required value={form.officeSlug} onChange={(event) => updateForm('officeSlug', event.target.value)} disabled={!offices.length} className={inputClass}><option value="">{offices.length ? 'Select an office…' : 'Loading offices…'}</option>{offices.map((office) => <option key={office.slug} value={office.slug}>{office.name}{office.city ? ` — ${office.city}` : ''}</option>)}</select>{officesError && <p role="alert" className="mt-1.5 text-xs text-[#b9151c]">{officesError}</p>}{selectedOffice && <p className="mt-1.5 text-[11px] text-slate-400">Capacity: {selectedOffice.dailyCapacity} per day · {selectedOffice.amCapacity} AM · {selectedOffice.pmCapacity} PM.</p>}</div>
                    <div><label htmlFor="assistance" className={labelClass}>Type of assistance requested <Required /></label><select id="assistance" required value={form.typeOfAssistance} onChange={(event) => updateForm('typeOfAssistance', event.target.value)} disabled={!form.officeSlug || !assistanceTypes.length} className={inputClass}><option value="">{assistanceTypes.length ? 'Select assistance type…' : 'Loading assistance types…'}</option>{assistanceTypes.map((type) => <option key={type.code} value={type.name}>{type.name}</option>)}</select>{assistanceTypesError && <p role="alert" className="mt-1.5 text-xs text-[#b9151c]">{assistanceTypesError}</p>}</div>
                    <div><label htmlFor="appointmentDate" className={labelClass}>Preferred date <Required /></label><div className="relative"><CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-[#2e3192]" /><input id="appointmentDate" type="date" required min={rules?.minDate} max={rules?.maxDate} value={form.appointmentDate} onChange={(event) => { setBookingError(''); updateForm('appointmentDate', event.target.value); }} disabled={!form.officeSlug || !rules || loadingRules} className={`${inputClass} pl-10`} /></div>{dateRestriction ? <p role="alert" className="mt-1.5 text-xs font-medium text-[#b9151c]">{dateRestriction}</p> : <p className="mt-1.5 text-[11px] leading-4 text-slate-400">Weekends and Philippine regular holidays are unavailable.</p>}</div>
                    <div><label htmlFor="timeSlot" className={labelClass}>Preferred time slot <Required /></label><div className="relative"><Clock3 size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-[#2e3192]" /><select id="timeSlot" required value={form.timeSlot} disabled={!form.officeSlug || !availability || checkingSlots || !availability.availableSlots.length} onChange={(event) => updateForm('timeSlot', event.target.value)} className={`${inputClass} pl-10`}><option value="">{!form.officeSlug ? 'Choose an office first' : checkingSlots ? 'Checking availability…' : !form.appointmentDate ? 'Choose a date first' : availability?.isFullyBooked ? 'Fully booked' : 'Select a time…'}</option>{availability?.availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></div>{availability?.isFullyBooked && <p className="mt-1.5 text-xs font-semibold text-[#b9151c]">No slots remain for this day. Please choose another date.</p>}</div>
                    <button type="button" onClick={continueFromRequest} disabled={!form.officeSlug} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/20 disabled:cursor-not-allowed disabled:bg-slate-300">Continue to requirements</button>
                  </>
                ) : bookingStep === 'requirements' ? (
                  <>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2e3192]/65">Step 2 · {form.typeOfAssistance} requirements</p><p className="mt-1 text-xs text-slate-500">Review the requirements for this assistance type.</p></div>
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">Requirements are subject to DSWD review and may vary by Field Office.</p><p className="mt-1">Please confirm the current requirements with the office handling your application.</p></div>
                    <ul className="space-y-3 rounded-2xl border border-[#2e3192]/10 bg-white p-4 text-sm leading-6 text-slate-700">{(selectedAssistanceType?.requirements ?? []).map((requirement) => <li key={requirement} className="flex gap-2.5"><CheckCircle2 size={17} className="mt-1 shrink-0 text-[#2e3192]" /><span>{requirement}</span></li>)}</ul>
                    <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setBookingError(''); setBookingStep('request'); }} className="h-12 rounded-xl border border-[#2e3192]/20 px-4 text-sm font-bold text-[#2e3192] transition hover:bg-[#f6f7ff]">Back to appointment details</button><button type="button" onClick={() => setBookingStep('details')} className="h-12 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white transition hover:bg-[#23256f]">Continue to applicant information</button></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2e3192]/65">Step 3 · Applicant information</p><p className="mt-1 text-xs text-slate-500">Fields marked with <span className="text-[#ee1c25]">*</span> are required.</p></div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2e3192]/10 bg-[#f6f7ff]/70 p-3.5 text-xs"><span className="font-semibold text-slate-600">{selectedOffice?.name} · {form.typeOfAssistance} · {form.appointmentDate ? formatDate(form.appointmentDate) : ''} · {form.timeSlot}</span><button type="button" onClick={() => { setBookingError(''); setBookingStep('request'); }} className="shrink-0 font-bold text-[#2e3192] underline underline-offset-2">Edit</button></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label htmlFor="firstName" className={labelClass}>First name <Required /></label><input id="firstName" required maxLength={80} value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} autoComplete="given-name" placeholder="First name" className={inputClass} /></div>
                      <div><label htmlFor="middleName" className={labelClass}>Middle name <span className="font-normal text-slate-400">(optional)</span></label><input id="middleName" maxLength={80} value={form.middleName} onChange={(event) => updateForm('middleName', event.target.value)} autoComplete="additional-name" placeholder="Middle name" className={inputClass} /></div>
                      <div><label htmlFor="lastName" className={labelClass}>Last name <Required /></label><div className="flex gap-2"><input id="lastName" required maxLength={80} value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} autoComplete="family-name" placeholder="Last name" className={inputClass} /><button type="button" onClick={() => setScanOpen(true)} aria-label="Scan National ID QR" title="Scan National ID QR" className="mt-2 grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#2e3192]/20 bg-[#fff9b8]/60 text-[#2e3192] transition hover:bg-[#fff9b8]"><ScanQrCode size={20} /></button></div></div>
                      <div><label htmlFor="birthdate" className={labelClass}>Birthdate <Required /></label><input id="birthdate" type="date" required max={localDateString()} value={form.birthdate} onChange={(event) => updateForm('birthdate', event.target.value)} autoComplete="bday" className={inputClass} /></div>
                    </div>
                    <p className="-mt-2 text-[11px] text-slate-400">Enter your name as it appears on your ID.</p>
                    <div><label htmlFor="cellNumber" className={labelClass}>Cell number <Required /></label><div className="relative"><Phone size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-slate-400" /><input id="cellNumber" type="tel" required inputMode="numeric" pattern="09[0-9]{9}" maxLength={11} value={form.cellNumber} onChange={(event) => updateForm('cellNumber', event.target.value.replace(/\D/g, '').slice(0, 11))} autoComplete="tel" placeholder="09123456789" className={`${inputClass} pl-10`} /></div><p className="mt-1.5 text-[11px] text-slate-400">Enter an 11-digit mobile number starting with 09.</p></div>
                    <div><label htmlFor="email" className={labelClass}>Email address <span className="font-normal text-slate-400">(optional)</span></label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-[26px] text-slate-400" /><input id="email" type="email" maxLength={254} value={form.email} onChange={(event) => updateForm('email', event.target.value)} autoComplete="email" placeholder="juan@email.com" className={`${inputClass} pl-10`} /></div></div>
                    <button type="submit" disabled={submitting || checkingSlots || !availability?.availableSlots.length || !form.timeSlot || !rules?.available} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#23256f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2e3192]/20 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? <><LoaderCircle size={17} className="animate-spin" />Processing appointment…</> : 'Book appointment'}</button>
                    <p className="text-center text-[11px] leading-5 text-slate-400">Your information is used to process and manage your assistance appointment request.</p>
                  </>
                )}
              </form>

                {bookingStep === 'request' && <aside className="border-t border-[#2e3192]/10 bg-[#f6f7ff]/65 p-5 sm:p-8 lg:border-l lg:border-t-0">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff9b8] text-[#2e3192]"><CalendarDays size={19} /></span><div><h2 className="text-sm font-extrabold text-slate-800">Daily availability</h2><p className="mt-1 text-xs text-slate-500">Choose a date to view open times.</p></div></div>
                {loadingRules ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#2e3192]/10 bg-white p-4 text-xs text-slate-500"><LoaderCircle size={15} className="animate-spin text-[#2e3192]" />Loading the Philippine booking calendar…</div> : !rules?.available ? <div role="status" className="mt-6 rounded-xl border border-[#fef200]/70 bg-[#fef200]/[0.18] p-4 text-xs leading-5 text-slate-800">The booking calendar is not currently accepting appointments. Please check back later.</div> : <>
                  <div className="mt-6 rounded-2xl border border-[#2e3192]/15 bg-white p-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#2e3192]">{selectedOffice?.name ?? 'Selected office'}</p><p className="mt-1 text-sm font-semibold text-slate-700">{form.appointmentDate ? formatDate(form.appointmentDate) : 'Select an appointment date'}</p></div><div className="text-right"><span className={`text-3xl font-black ${availability?.remainingSlots === 0 ? 'text-[#ee1c25]' : 'text-[#2e3192]'}`}>{availability?.remainingSlots ?? '—'}</span><span className="block text-[10px] font-semibold text-slate-400">of {availability?.dailyCapacity ?? selectedOffice?.dailyCapacity ?? 60} slots</span></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#fff9b8]"><div className={`h-full rounded-full transition-all ${availability?.remainingSlots === 0 ? 'bg-[#ee1c25]' : 'bg-[#2e3192]'}`} style={{ width: `${availability ? Math.max(0, availability.remainingSlots / availability.dailyCapacity * 100) : 0}%` }} /></div></div>
                  <div className="mt-4 space-y-2">{rules.timeSlots.map((slot) => { const isAvailable = availability?.availableSlots.includes(slot); const isChecked = checkingSlots && Boolean(form.appointmentDate && form.officeSlug); const remaining = availability?.periodRemaining[slot]; const slotCapacity = availability?.periodCapacities[slot] ?? (slot === 'AM' ? selectedOffice?.amCapacity : selectedOffice?.pmCapacity) ?? 30; return <div key={slot} className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-xs ${isAvailable ? 'border-[#2e3192]/15 bg-white text-slate-700' : 'border-slate-200/80 bg-white/60 text-slate-400'}`}><span className="flex items-center gap-2"><Clock3 size={14} className={isAvailable ? 'text-[#2e3192]' : 'text-slate-300'} />{slot}</span><span className={`font-bold ${isChecked ? 'text-slate-400' : isAvailable ? 'text-[#2e3192]' : 'text-slate-400'}`}>{isChecked ? 'Checking' : !availability ? '—' : `${remaining ?? 0} / ${slotCapacity} slots remaining`}</span></div>; })}</div>
                  <div className="mt-5 rounded-xl border border-[#2e3192]/10 bg-white p-4"><h3 className="text-xs font-bold text-slate-700">Appointment details</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#2e3192]" />60 appointments maximum each day.</li><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#2e3192]" />Up to 30 appointments in the AM period and 30 in the PM period.</li><li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#2e3192]" />A reference code is issued after a successful booking.</li></ul></div>
                </>}
                {bookingError && <div role="status" className="mt-4 break-words rounded-xl border border-[#ee1c25]/15 bg-[#ee1c25]/[.04] p-3 text-xs leading-5 text-[#b9151c]">{bookingError}</div>}
              </aside>}
            </div>
          </section>

          {bookingStep === 'request' && <section className="overflow-hidden rounded-[24px] border border-[#2e3192]/15 bg-white shadow-[0_16px_50px_rgba(46,49,146,0.07)] lg:col-span-2">
            <div className="border-b border-[#2e3192]/10 bg-[#2e3192] px-5 py-5 text-white sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fef200]"><Search size={19} /></span><div><h2 className="text-lg font-extrabold">Manage an appointment</h2><p className="mt-1 text-xs text-white/70">Find or cancel an existing booking securely.</p></div></div></div>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
              <form onSubmit={submitLookup} className="space-y-4">
                <div><label htmlFor="lookupCode" className={labelClass}>Appointment reference code <Required /></label><input id="lookupCode" required value={lookupCode} onChange={(event) => setLookupCode(event.target.value.toUpperCase())} placeholder="AICS-HOS-2026-ABCDE" className={`${inputClass} font-mono tracking-wide`} /></div>
                <div><label htmlFor="lookupCell" className={labelClass}>Cell number used for booking <Required /></label><input id="lookupCell" type="tel" inputMode="numeric" required pattern="09[0-9]{9}" maxLength={11} value={lookupCell} onChange={(event) => setLookupCell(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09123456789" className={inputClass} /></div>
                <button type="submit" disabled={lookingUp} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e3192] px-4 text-sm font-bold text-white transition hover:bg-[#23256f] disabled:opacity-60">{lookingUp ? <><LoaderCircle size={16} className="animate-spin" />Finding…</> : <><Search size={16} />Find appointment</>}</button>
                {lookupError && <p role="alert" className="rounded-xl bg-[#ee1c25]/[.05] p-3 text-xs leading-5 text-[#b9151c]">{lookupError}</p>}
              </form>
              <div className="min-h-36 rounded-2xl border border-dashed border-[#2e3192]/20 bg-[#f6f7ff]/60 p-4 sm:p-5">
                {lookupResult ? <><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2e3192]">Appointment found</p><p className="mt-1 font-mono text-lg font-extrabold tracking-wide text-[#2e3192]">{lookupResult.appointmentCode}</p></div><StatusPill status={lookupResult.status} /></div><dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-slate-400">Applicant</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.fullName}</dd><dt className="text-slate-400">Office</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.officeName || '—'}</dd><dt className="text-slate-400">Assistance</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.assistanceType}</dd><dt className="text-slate-400">Date</dt><dd className="text-right font-semibold text-slate-700">{formatDate(lookupResult.appointmentDate)}</dd><dt className="text-slate-400">Time</dt><dd className="text-right font-semibold text-slate-700">{lookupResult.timeSlot}</dd></dl>{lookupResult.canCancel && <div className="mt-4 border-t border-[#2e3192]/10 pt-4"><label htmlFor="cancelReason" className="text-xs font-semibold text-slate-700">Cancellation reason <span className="font-normal text-slate-400">(optional)</span></label><textarea id="cancelReason" rows={2} maxLength={500} value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} placeholder="Optional note" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ee1c25] focus:ring-4 focus:ring-[#ee1c25]/10" /><button type="button" onClick={cancelAppointment} disabled={cancelling} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#ee1c25] px-3 text-xs font-bold text-white transition hover:bg-[#b9151c] disabled:opacity-60">{cancelling ? <LoaderCircle size={15} className="animate-spin" /> : null}{cancelling ? 'Cancelling…' : 'Cancel appointment'}</button></div>}{lookupMessage && <p role="status" className="mt-3 text-xs font-medium text-emerald-700">{lookupMessage}</p>}</> : <div className="grid h-full min-h-32 place-items-center text-center"><div><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white text-[#2e3192]"><LockKeyhole size={17} /></span><p className="mt-3 text-sm font-semibold text-slate-600">Your booking details will appear here</p><p className="mt-1 text-xs text-slate-400">Only the matching reference code and mobile number can find an appointment.</p></div></div>}
              </div>
            </div>
          </section>}
          <footer className="px-2 text-center text-[10px] leading-5 text-slate-400 lg:col-span-2">Republic of the Philippines · Department of Social Welfare and Development<br />Your personal information is handled in accordance with the Data Privacy Act of 2012.</footer>
        </div>
      )}

      {scanOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
          <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#2e3192] p-4 text-white">
              <h2 id="scanner-title" className="text-sm font-bold">Scan National ID QR</h2>
              <button type="button" onClick={() => setScanOpen(false)} aria-label="Close scanner"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="overflow-hidden rounded-xl bg-slate-950">
                <Scanner
                  onScan={(codes) => {
                    const value = codes[0]?.rawValue;
                    if (value) onScan(value);
                  }}
                  onError={() => setBookingError('Camera access is unavailable. Use a secure connection or enter the name manually.')}
                  formats={['qr_code']}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">Camera access requires permission and a secure connection.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Required() {
  return <span className="ml-1 text-[#ee1c25]" aria-label="required">*</span>;
}

function StatusPill({ status }: { status: PublicAppointment['status'] }) {
  const styles: Record<PublicAppointment['status'], string> = {
    Pending: 'bg-[#fef200]/[0.35] text-slate-800',
    Confirmed: 'bg-[#2e3192]/[0.08] text-[#2e3192]',
    Arrived: 'bg-sky-100 text-sky-800',
    'No-show': 'bg-[#ee1c25]/10 text-[#ee1c25]',
    Completed: 'bg-[#2e3192]/10 text-[#2e3192]',
    Cancelled: 'bg-[#ee1c25]/10 text-[#ee1c25]'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}
