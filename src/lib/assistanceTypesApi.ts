'use client';

import { getCsrfToken } from './authApi';

export interface AssistanceTypeRecord {
  id: string;
  code: string;
  name: string;
  codePrefix: string;
  requirements: string[];
  active: boolean;
  createdAt: string;
}

export type AssistanceTypeInput = Omit<AssistanceTypeRecord, 'id' | 'createdAt'>;

interface ApiAssistanceType extends Omit<AssistanceTypeRecord, 'id'> {
  _id: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
}

export class AssistanceTypeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssistanceTypeApiError';
  }
}

const ENDPOINT = '/backend-api/assistance-types';

async function request<T>(path = '', init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const method = init?.method?.toUpperCase() ?? 'GET';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await getCsrfToken();
    response = await fetch(`${ENDPOINT}${path}`, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: { ...headers, ...init?.headers }
    });
  } catch {
    throw new AssistanceTypeApiError('Cannot reach the assistance type API. Check that the backend is running.');
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new AssistanceTypeApiError(`The API returned an unreadable response (${response.status}).`);
  }
  if (!response.ok || !payload.success) {
    throw new AssistanceTypeApiError(payload.errors?.[0]?.message ?? payload.message ?? `Request failed (${response.status}).`);
  }
  return payload.data;
}

function toRecord(record: ApiAssistanceType): AssistanceTypeRecord {
  return { ...record, id: record._id };
}

export async function getAssistanceTypeRecords(): Promise<AssistanceTypeRecord[]> {
  return (await request<ApiAssistanceType[]>()).map(toRecord);
}

export async function createAssistanceType(input: AssistanceTypeInput): Promise<AssistanceTypeRecord> {
  return toRecord(await request<ApiAssistanceType>('', { method: 'POST', body: JSON.stringify(input) }));
}

export async function updateAssistanceType(id: string, input: Partial<Omit<AssistanceTypeInput, 'code' | 'codePrefix'>>): Promise<AssistanceTypeRecord> {
  return toRecord(await request<ApiAssistanceType>(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }));
}

export async function deleteAssistanceType(id: string): Promise<AssistanceTypeRecord> {
  return toRecord(await request<ApiAssistanceType>(`/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
