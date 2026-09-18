// ============================================================
// PROJECT NOVA / ADRIAN — Registered Demo Accounts
// ------------------------------------------------------------
// Accounts created through the Sign Up flow in this frontend-only
// demo build are kept here (backed by localStorage) so they show
// up consistently in both the login flow (lib/auth.ts) and the
// Admin → Users panel (lib/api/client.ts adminApi.getUsers).
// This intentionally has no server component — it's just shared
// browser storage between two frontend modules.
// ============================================================

const STORAGE_KEY = 'adrian_registered_users';

export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'rescue_team' | 'hospital' | 'admin';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED';
  approvalStatus?: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  phone?: string;
  district?: string;
  organization?: string;
  rescueTeamId?: string;
  language: 'en' | 'ta' | 'si';
  createdAt: string;
  lastActive: string;
  isActive: boolean;
  isVerified: boolean;
  password: string; // demo-only, plaintext, never sent anywhere
  pendingOtp?: string;
}

function readAll(): RegisteredUserRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(users: RegisteredUserRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore quota errors in the demo build
  }
}

export function getRegisteredUsers(): RegisteredUserRecord[] {
  return readAll();
}

export function findRegisteredUserByEmail(email: string): RegisteredUserRecord | undefined {
  const target = email.trim().toLowerCase();
  return readAll().find((u) => u.email.toLowerCase() === target);
}

export function saveRegisteredUser(user: RegisteredUserRecord): void {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeAll(users);
}

export function updateRegisteredUser(id: string, updates: Partial<RegisteredUserRecord>): RegisteredUserRecord | undefined {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  users[idx] = { ...users[idx], ...updates };
  writeAll(users);
  return users[idx];
}
