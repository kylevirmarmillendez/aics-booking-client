'use client';

import { getCsrfToken } from './authApi';

export type OfficeType = 'SWAD' | 'Regional Office' | 'Satellite Office';

export interface OfficeLink {
  label: string;
  url: string;
}

export interface OfficeRecord {
  id: string;
  slug: string;
  name: string;
  officeType: OfficeType;
  province: string;
  city: string;
  address: string;
  contacts: string[];
  hours: string;
  serviceArea: string;
  dailyCapacity: number;
  amCapacity: number;
  pmCapacity: number;
  links: OfficeLink[];
  sourceNote: string;
  active: boolean;
}

export type OfficeInput = Omit<OfficeRecord, 'id'>;

export interface AppointmentRecord {
  id: string;
  appointmentCode: string;
  typeOfAssistance: string;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  officeSlug?: string;
  officeName?: string;
  appointmentDateKey?: string;
  appointmentDateTimeSlot: string;
  timeSlot?: string;
  status: 'Pending' | 'Confirmed' | 'Arrived' | 'No-show' | 'Completed' | 'Cancelled';
}

interface ApiOffice extends Omit<OfficeRecord, 'id'> {
  _id: string;
}

interface ApiAppointment extends Omit<AppointmentRecord, 'id'> {
  _id: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
  field?: string;
}

export class OfficeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfficeApiError';
  }
}

const ENDPOINT = '/backend-api/offices';

async function request<T>(path = '', init?: RequestInit, endpoint = ENDPOINT): Promise<T> {
  let response: Response;
  try {
    const method = init?.method?.toUpperCase() ?? 'GET';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await getCsrfToken();
    response = await fetch(`${endpoint}${path}`, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: { ...headers, ...init?.headers }
    });
  } catch {
    throw new OfficeApiError('Cannot reach the office API. Check that the backend is running.');
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new OfficeApiError(`The API returned an unreadable response (${response.status}).`);
  }
  if (!response.ok || !payload.success) {
    throw new OfficeApiError(payload.errors?.[0]?.message ?? payload.message ?? `Office request failed (${response.status}).`);
  }
  return payload.data;
}

function toOfficeRecord(office: ApiOffice): OfficeRecord {
  return { ...office, id: office._id };
}

export async function getOffices(): Promise<OfficeRecord[]> {
  return (await request<ApiOffice[]>()).map(toOfficeRecord);
}

export async function createOffice(input: OfficeInput): Promise<OfficeRecord> {
  return toOfficeRecord(await request<ApiOffice>('', { method: 'POST', body: JSON.stringify(input) }));
}

export async function updateOffice(id: string, input: Partial<OfficeInput>): Promise<OfficeRecord> {
  return toOfficeRecord(await request<ApiOffice>(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }));
}

export async function deleteOffice(id: string): Promise<void> {
  await request<ApiOffice>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getAppointments(): Promise<AppointmentRecord[]> {
  const appointments = await request<ApiAppointment[]>('', undefined, '/backend-api/appointments');
  return appointments.map((appointment) => ({ ...appointment, id: appointment._id }));
}

export async function updateAppointmentStatus(id: string, status: AppointmentRecord['status']): Promise<AppointmentRecord> {
  const appointment = await request<ApiAppointment>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }, '/backend-api/appointments');
  return { ...appointment, id: appointment._id };
}
