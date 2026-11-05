'use client';

import type { UserRecord } from './users';
import type { UserRole, UserStatus } from './users';

export interface CreateUserInput {
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  office: string;
  region: string;
  phone: string;
}

interface ApiUser {
  _id: string;
  fname: string;
  mname?: string | null;
  lname: string;
  email: string;
  username: string;
  role: UserRole;
  status?: UserStatus;
  office?: string;
  region?: string;
  phone?: string;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
  field?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly errors?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// Next.js rewrites this same-origin path to the Express API, avoiding browser CORS configuration.
const USERS_ENDPOINT = '/backend-api/users';

async function request<T>(path = '', init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${USERS_ENDPOINT}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store'
    });
  } catch {
    throw new ApiRequestError('Cannot reach the user API. Start the backend and try again.');
  }

  let payload: ApiEnvelope<T>;
  try {
    const body = await response.text();
    payload = JSON.parse(body) as ApiEnvelope<T>;
  } catch {
    if (response.status >= 500) {
      throw new ApiRequestError('The API proxy could not reach the Express backend. Start the backend and check BACKEND_API_URL.');
    }
    throw new ApiRequestError(`The API returned an unreadable response (${response.status}).`);
  }

  if (!response.ok || !payload.success) {
    throw new ApiRequestError(payload.message || `Request failed (${response.status}).`, payload.field, payload.errors);
  }
  return payload.data;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

function toUserRecord(user: ApiUser): UserRecord {
  const joined = formatDate(user.createdAt);
  return {
    id: user._id,
    fname: user.fname,
    mname: user.mname ?? undefined,
    lname: user.lname,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status ?? 'Active',
    office: user.office || 'Not assigned',
    region: user.region || 'Not assigned',
    joined,
    lastActive: 'No sign-in recorded',
    phone: user.phone ?? '',
    securityStatus: 'Setup required',
    activities: [{
      action: 'Account created',
      detail: 'User record created in the account directory',
      date: joined,
      source: 'User API'
    }]
  };
}

export async function getUsers(): Promise<UserRecord[]> {
  const users = await request<ApiUser[]>();
  return users.map(toUserRecord);
}

export async function getUser(id: string): Promise<UserRecord> {
  const user = await request<ApiUser>(`/${encodeURIComponent(id)}`);
  return toUserRecord(user);
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const user = await request<ApiUser>('', { method: 'POST', body: JSON.stringify(input) });
  return toUserRecord(user);
}

export async function updateUser(id: string, changes: Partial<Omit<CreateUserInput, 'password'>> & { password?: string }): Promise<UserRecord> {
  const user = await request<ApiUser>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(changes)
  });
  return toUserRecord(user);
}

export async function deleteUser(id: string): Promise<void> {
  await request<ApiUser>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
