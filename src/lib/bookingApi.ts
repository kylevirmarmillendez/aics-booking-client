'use client';

import { getCsrfToken } from './authApi';

export type AssistanceType = 'Medical' | 'Funeral';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface BookingRules {
  minDate: string;
  maxDate: string;
  weekendDays: number[];
  holidays: Array<{ date: string; name: string }>;
  timeSlots: string[];
  dailyCapacity: number;
  timeSlotCapacity: number;
  available: boolean;
}

export interface Availability {
  selectedDate: string;
  availableSlots: string[];
  remainingSlots: number;
  dailyCapacity: number;
  isFullyBooked: boolean;
}

export interface PublicAppointment {
  appointmentCode: string;
  assistanceType: string;
  fullName: string;
  email: string;
  cellNumber: string;
  appointmentDate: string;
  timeSlot: string;
  status: BookingStatus;
  cancellationReason: string;
  canCancel: boolean;
  remainingSlots?: number;
  dailyCapacity?: number;
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  dateUnavailable?: boolean;
}

export class BookingApiError extends Error {
  constructor(message: string, public readonly dateUnavailable = false) {
    super(message);
    this.name = 'BookingApiError';
  }
}

const ENDPOINT = '/backend-api/public-booking';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method?.toUpperCase() ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: { ...headers, ...options.headers }
    });
  } catch {
    throw new BookingApiError('Cannot reach the appointment service. Please try again later.');
  }

  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new BookingApiError(response.status >= 500
      ? 'The booking service is temporarily unavailable.'
      : `The booking service returned an invalid response (${response.status}).`);
  }

  if (!response.ok || !payload.success) {
    const detail = payload.errors?.[0]?.message;
    throw new BookingApiError(detail || payload.message || `Booking request failed (${response.status}).`, payload.dateUnavailable ?? false);
  }
  return payload.data as T;
}

export function getBookingRules() {
  return request<BookingRules>('/calendar-rules');
}

export function getAvailability(date: string) {
  return request<Availability>(`/availability?date=${encodeURIComponent(date)}`);
}

export function createBooking(input: {
  typeOfAssistance: AssistanceType;
  fullName: string;
  cellNumber: string;
  email: string;
  appointmentDate: string;
  timeSlot: string;
}) {
  return request<PublicAppointment>('', { method: 'POST', body: JSON.stringify(input) });
}

export function lookupBooking(input: { appointmentCode: string; cellNumber: string }) {
  return request<{ appointment: PublicAppointment }>('/lookup', { method: 'POST', body: JSON.stringify(input) });
}

export function cancelBooking(input: {
  appointmentCode: string;
  cellNumber: string;
  cancellationReason: string;
}) {
  return request<{ appointment: PublicAppointment }>('/cancel', { method: 'POST', body: JSON.stringify(input) });
}
