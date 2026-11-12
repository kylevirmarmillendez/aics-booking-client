'use client';

export interface AuthUser {
  id: string;
  fname: string;
  mname?: string | null;
  lname: string;
  email: string;
  username: string;
  role: 'super_admin' | 'admin' | 'booking_officer' | 'congressional_officer';
  status: 'Active' | 'Inactive' | 'Pending';
  office?: string;
  region?: string;
  phone?: string;
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: Array<{ field: string; message: string }>;
  errors?: Array<{ field: string; message: string }>;
}

export class AuthApiError extends Error {
  constructor(message: string, public readonly details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const AUTH_ENDPOINT = '/backend-api/auth';

async function readResponse<T>(response: Response): Promise<T> {
  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    throw new AuthApiError(response.status >= 500
      ? 'Could not reach the authentication backend. Check that the API is running.'
      : `The authentication service returned an invalid response (${response.status}).`);
  }
  if (!response.ok || !body.success) {
    throw new AuthApiError(body.message ?? `Authentication request failed (${response.status}).`, body.details ?? body.errors);
  }
  return body.data as T;
}

export async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${AUTH_ENDPOINT}/csrf`, { credentials: 'include', cache: 'no-store' });
  const data = await readResponse<{ csrfToken: string }>(response);
  return data.csrfToken;
}

async function mutate<T>(route: string, body?: unknown): Promise<T> {
  const token = await getCsrfToken();
  const response = await fetch(`${AUTH_ENDPOINT}${route}`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return readResponse<T>(response);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${AUTH_ENDPOINT}/me`, { credentials: 'include', cache: 'no-store' });
  const data = await readResponse<{ user: AuthUser | null }>(response);
  return data.user;
}

export async function signIn(login: string, password: string): Promise<AuthUser> {
  const data = await mutate<{ user: AuthUser }>('/login', { login, password });
  return data.user;
}

export async function registerAccount(input: {
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  username: string;
  password: string;
}): Promise<AuthUser> {
  const data = await mutate<{ user: AuthUser }>('/register', input);
  return data.user;
}

export async function signOut(): Promise<void> {
  await mutate('/logout');
}
