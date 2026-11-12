'use client';

export type UserRole = 'super_admin' | 'admin' | 'booking_officer' | 'congressional_officer';
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  booking_officer: 'Booking Officer',
  congressional_officer: 'Congressional Officer'
};
export type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface UserActivity {
  action: string;
  detail: string;
  date: string;
  source: string;
}

export interface UserRecord {
  id: string;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  office: string;
  region: string;
  joined: string;
  lastActive: string;
  phone: string;
  securityStatus: string;
  activities: UserActivity[];
}

export type NewUserInput = Omit<UserRecord, 'id' | 'joined' | 'lastActive' | 'securityStatus' | 'activities'>;

export const offices = [
  { name: 'Central Office', region: 'National Capital Region' },
  { name: 'NCR Field Office', region: 'National Capital Region' },
  { name: 'Region I Field Office', region: 'Ilocos Region' },
  { name: 'Region III Field Office', region: 'Central Luzon' },
  { name: 'Region IV-A Field Office', region: 'CALABARZON' },
  { name: 'Region V Field Office', region: 'Bicol Region' },
  { name: 'Region VII Field Office', region: 'Central Visayas' },
  { name: 'Region XI Field Office', region: 'Davao Region' }
] as const;

export const initialUsers: UserRecord[] = [
  { id: 'USR-2025-001', fname: 'Maria', mname: 'Santos', lname: 'Reyes', email: 'maria.reyes@dswd.gov.ph', username: 'mreyes', role: 'admin', status: 'Active', office: 'Central Office', region: 'National Capital Region', lastActive: 'Just now', joined: 'Jan 08, 2025', phone: '+63 917 123 4567', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful administrator sign-in', date: 'Today, 9:42 AM', source: 'Central Office network' }, { action: 'Updated profile', detail: 'Contact information reviewed', date: 'Yesterday, 3:18 PM', source: 'Web portal' }, { action: 'Password changed', detail: 'Account password updated', date: 'Oct 22, 2025', source: 'Web portal' }] },
  { id: 'USR-2025-002', fname: 'Jose', mname: 'Cruz', lname: 'Dela Cruz', email: 'jose.delacruz@dswd.gov.ph', username: 'jdelacruz', role: 'booking_officer', status: 'Active', office: 'NCR Field Office', region: 'National Capital Region', lastActive: '18 min ago', joined: 'Jan 12, 2025', phone: '+63 918 234 5678', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful sign-in', date: 'Today, 9:16 AM', source: 'NCR Field Office' }, { action: 'Viewed booking', detail: 'Reviewed booking request #BK-1904', date: 'Yesterday, 2:05 PM', source: 'Web portal' }] },
  { id: 'USR-2025-003', fname: 'Angela', lname: 'Garcia', email: 'angela.garcia@dswd.gov.ph', username: 'agarcia', role: 'booking_officer', status: 'Pending', office: 'Region IV-A Field Office', region: 'CALABARZON', lastActive: 'Never', joined: 'Jan 14, 2025', phone: '+63 919 345 6789', securityStatus: 'Setup required', activities: [{ action: 'Account created', detail: 'Awaiting first sign-in and security setup', date: 'Jan 14, 2025', source: 'Administrator' }] },
  { id: 'USR-2025-004', fname: 'Ramon', mname: 'Villanueva', lname: 'Santos', email: 'ramon.santos@dswd.gov.ph', username: 'rsantos', role: 'booking_officer', status: 'Active', office: 'Region III Field Office', region: 'Central Luzon', lastActive: '2 hours ago', joined: 'Jan 16, 2025', phone: '+63 920 456 7890', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful sign-in', date: 'Today, 8:01 AM', source: 'Region III Field Office' }] },
  { id: 'USR-2025-005', fname: 'Lourdes', mname: 'Mendoza', lname: 'Aquino', email: 'lourdes.aquino@dswd.gov.ph', username: 'laquino', role: 'admin', status: 'Inactive', office: 'Central Office', region: 'National Capital Region', lastActive: '12 days ago', joined: 'Jan 18, 2025', phone: '+63 921 567 8901', securityStatus: 'MFA enabled', activities: [{ action: 'Account deactivated', detail: 'Access paused by administrator', date: 'Oct 23, 2025', source: 'Central Office' }] },
  { id: 'USR-2025-006', fname: 'Miguel', lname: 'Torres', email: 'miguel.torres@dswd.gov.ph', username: 'mtorres', role: 'booking_officer', status: 'Active', office: 'Region VII Field Office', region: 'Central Visayas', lastActive: 'Yesterday', joined: 'Jan 20, 2025', phone: '+63 922 678 9012', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful sign-in', date: 'Yesterday, 4:32 PM', source: 'Region VII Field Office' }] },
  { id: 'USR-2025-007', fname: 'Catherine', mname: 'Lim', lname: 'Bautista', email: 'catherine.bautista@dswd.gov.ph', username: 'cbautista', role: 'booking_officer', status: 'Pending', office: 'Region XI Field Office', region: 'Davao Region', lastActive: 'Never', joined: 'Jan 21, 2025', phone: '+63 923 789 0123', securityStatus: 'Setup required', activities: [{ action: 'Account created', detail: 'Invitation sent; first sign-in pending', date: 'Jan 21, 2025', source: 'Administrator' }] },
  { id: 'USR-2025-008', fname: 'Andres', mname: 'Ramos', lname: 'Flores', email: 'andres.flores@dswd.gov.ph', username: 'aflores', role: 'booking_officer', status: 'Active', office: 'Region V Field Office', region: 'Bicol Region', lastActive: '3 days ago', joined: 'Jan 22, 2025', phone: '+63 924 890 1234', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful sign-in', date: 'Oct 31, 2025', source: 'Region V Field Office' }] },
  { id: 'USR-2025-009', fname: 'Patricia', lname: 'Rivera', email: 'patricia.rivera@dswd.gov.ph', username: 'privera', role: 'booking_officer', status: 'Inactive', office: 'Region I Field Office', region: 'Ilocos Region', lastActive: '1 month ago', joined: 'Jan 24, 2025', phone: '+63 925 901 2345', securityStatus: 'MFA enabled', activities: [{ action: 'Signed in', detail: 'Successful sign-in', date: 'Oct 03, 2025', source: 'Region I Field Office' }] }
];

const STORAGE_KEY = 'dswd-user-directory-v1';

export function readUsers(): UserRecord[] {
  if (typeof window === 'undefined') return initialUsers;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialUsers;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as UserRecord[]) : initialUsers;
  } catch {
    return initialUsers;
  }
}

export function saveUsers(users: UserRecord[]): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function createLocalUser(input: NewUserInput): UserRecord {
  const users = readUsers();
  const newUser: UserRecord = {
    ...input,
    id: `USR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    joined: new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()),
    lastActive: 'Never',
    securityStatus: 'Setup required',
    activities: [{ action: 'Account created', detail: 'User account created from the management portal', date: 'Just now', source: 'Administrator' }]
  };
  saveUsers([newUser, ...users]);
  return newUser;
}
