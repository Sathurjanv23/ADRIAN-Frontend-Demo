// ─── Auth utilities for PROJECT NOVA / ADRIAN (Frontend Demo) ─
// Fully local mock auth — no backend required.
// Accounts come from lib/mock/data.ts (MOCK_USERS) plus anything
// created through the Sign Up flow (kept in localStorage via
// lib/mock/registered-users.ts). All demo accounts accept any
// password that satisfies validatePassword() below (e.g. "Demo1234").
// ─────────────────────────────────────────────────────────────

import { MOCK_USERS } from '@/lib/mock/data';
import {
  findRegisteredUserByEmail,
  saveRegisteredUser,
  updateRegisteredUser,
  type RegisteredUserRecord,
} from '@/lib/mock/registered-users';

const TOKEN_KEY = 'nova_token';
const USER_KEY  = 'nova_user';
const DEMO_OTP  = '123456';

// ─── AuthUser ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'rescue_team' | 'hospital' | 'admin';
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DEACTIVATED';
  approvalStatus?: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  avatarUrl?: string;
  phone?: string;
  district?: string;
  organization?: string;
  rescueTeamId?: string;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
  isVerified: boolean;
  language: 'en' | 'ta' | 'si';
}

export const SL_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle',
] as const;

// ─── Validation ──────────────────────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Email is required';
  const trimmed = email.trim();
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(trimmed)) return 'Enter a valid email address (e.g. you@example.com)';
  const blockedDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com', 'trashmail.com'];
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (blockedDomains.includes(domain)) return 'Disposable email addresses are not allowed';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 60) return 'Name must be at most 60 characters';
  if (!/^[a-zA-Z\s\u0080-\uFFFF]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
  return null;
}

export function validatePhone(phone?: string): string | null {
  if (!phone || !phone.trim()) return null;
  const trimmed = phone.trim();
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Sri Lankan local format: 07XXXXXXXX or 0XXXXXXXXX (10 digits)
  if (/^0[1-9][0-9]{8}$/.test(cleaned)) {
    return null; // Valid Sri Lankan local number
  }

  // Sri Lankan international format: +947XXXXXXXX or +94XXXXXXXXX or 947XXXXXXXX
  if (/^(\+?94)[1-9][0-9]{8}$/.test(cleaned)) {
    return null; // Valid Sri Lankan international number
  }

  // General international format: +[country code][number] (total 7 to 15 digits)
  if (/^\+?[0-9]{7,15}$/.test(cleaned)) {
    return null; // Valid international number
  }

  return 'Enter a valid phone number (e.g. +94 77 123 4567 or 077 123 4567)';
}

export function isSriLankanPhone(phone?: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^0[1-9][0-9]{8}$/.test(cleaned) || /^(\+?94)[1-9][0-9]{8}$/.test(cleaned);
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

// ─── Token helpers ────────────────────────────────────────────

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function saveUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

function genToken(): string {
  return `demo-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─── Combined directory: seed mock users + locally registered ─

function seedUserToAuthUser(u: (typeof MOCK_USERS)[number]): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    phone: u.phone,
    district: u.district,
    organization: u.organization,
    language: u.language,
    createdAt: u.createdAt,
    lastActive: u.lastActive,
    isActive: u.isActive,
    isVerified: true,
  };
}

function registeredToAuthUser(r: RegisteredUserRecord): AuthUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    approvalStatus: r.approvalStatus,
    phone: r.phone,
    district: r.district,
    organization: r.organization,
    rescueTeamId: r.rescueTeamId,
    language: r.language,
    createdAt: r.createdAt,
    lastActive: r.lastActive,
    isActive: r.isActive,
    isVerified: r.isVerified,
  };
}

function findDirectoryUser(email: string): AuthUser | null {
  const target = email.trim().toLowerCase();
  const seed = MOCK_USERS.find((u) => u.email.toLowerCase() === target);
  if (seed) return seedUserToAuthUser(seed);
  const registered = findRegisteredUserByEmail(email);
  if (registered) return registeredToAuthUser(registered);
  return null;
}

// ─── Auth Result ─────────────────────────────────────────────

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: AuthUser['role'];
  phone?: string;
  district?: string;
  organization?: string;
  language?: string;
}

export type AuthResult =
  | { success: true; user: AuthUser; requiresVerification?: boolean; demoOtp?: string }
  | { success: false; error: string; field?: string; statusCode?: number };

// ─── Sign Up (Email / Password) ──────────────────────────────

export async function signUp(payload: SignUpPayload): Promise<AuthResult> {
  const nameErr = validateName(payload.name);
  if (nameErr) return { success: false, error: nameErr, field: 'name' };

  const emailErr = validateEmail(payload.email);
  if (emailErr) return { success: false, error: emailErr, field: 'email' };

  const passErr = validatePassword(payload.password);
  if (passErr) return { success: false, error: passErr, field: 'password' };

  const phoneErr = validatePhone(payload.phone);
  if (phoneErr) return { success: false, error: phoneErr, field: 'phone' };

  if (payload.role === 'admin') {
    return { success: false, error: 'Administrator accounts cannot be self-registered.' };
  }

  if (findDirectoryUser(payload.email)) {
    return { success: false, error: 'An account with this email already exists.', statusCode: 409 };
  }

  const requiresApproval = payload.role === 'rescue_team' || payload.role === 'hospital';
  const now = new Date().toISOString();
  const record: RegisteredUserRecord = {
    id: `u-${Date.now()}`,
    name: payload.name.trim(),
    email: payload.email.trim(),
    role: payload.role,
    status: 'PENDING_VERIFICATION',
    approvalStatus: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
    phone: payload.phone?.trim() || undefined,
    district: payload.district,
    organization: payload.organization,
    language: (payload.language as RegisteredUserRecord['language']) || 'en',
    createdAt: now,
    lastActive: now,
    isActive: false,
    isVerified: false,
    password: payload.password,
    pendingOtp: DEMO_OTP,
  };
  saveRegisteredUser(record);

  return delay({
    success: true,
    user: registeredToAuthUser(record),
    requiresVerification: true,
    demoOtp: DEMO_OTP,
  });
}

// ─── Sign In (Email / Password) ──────────────────────────────

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr, field: 'email' };

  const passErr = validatePassword(password);
  if (passErr) return { success: false, error: passErr, field: 'password' };

  const registered = findRegisteredUserByEmail(email);
  const user = findDirectoryUser(email);

  if (!user) {
    return delay({ success: false, error: 'No account found with this email address.', field: 'email' });
  }

  if (user.status === 'DEACTIVATED') {
    return delay({
      success: false,
      error: 'Your account is deactivated. Please contact emergency administration.',
      statusCode: 403,
    });
  }

  // Registered (self-signed-up) accounts still needing OTP verification
  if (registered && !registered.isVerified) {
    return delay({
      success: true,
      user,
      requiresVerification: true,
      demoOtp: registered.pendingOtp || DEMO_OTP,
    });
  }

  const token = genToken();
  saveToken(token);
  saveUser(user);

  if (registered) {
    updateRegisteredUser(registered.id, { lastActive: new Date().toISOString() });
  }

  return delay({ success: true, user });
}

// ─── OAuth Exchange (Existing Google User) ───────────────────
// No real OAuth provider is wired up in the frontend-only demo.
// signInWithGoogle() below signs the person in directly instead of
// redirecting anywhere, so this is kept only for shape-compatibility.

export async function exchangeOAuthCode(_code: string): Promise<AuthResult> {
  return { success: false, error: 'Google Sign-In runs locally in this demo — use the Google button on the login page.' };
}

// ─── Google Complete Registration (New Google User) ─────────

export interface GoogleRegisterPayload {
  registrationIntent: string;
  role: 'citizen' | 'officer' | 'rescue_team' | 'hospital';
  phone?: string;
  district?: string;
  organization?: string;
  language?: string;
}

export async function completeGoogleRegistration(payload: GoogleRegisterPayload): Promise<AuthResult> {
  if (payload.role === ('admin' as any)) {
    return { success: false, error: 'Administrator accounts cannot be self-registered.' };
  }

  const phoneErr = validatePhone(payload.phone);
  if (phoneErr) return { success: false, error: phoneErr, field: 'phone' };

  const now = new Date().toISOString();
  const record: RegisteredUserRecord = {
    id: `u-${Date.now()}`,
    name: 'Google Demo User',
    email: `google-demo-${Date.now()}@nova.lk`,
    role: payload.role,
    status: 'ACTIVE',
    approvalStatus: payload.role === 'rescue_team' || payload.role === 'hospital' ? 'PENDING_APPROVAL' : 'APPROVED',
    phone: payload.phone,
    district: payload.district,
    organization: payload.organization,
    language: (payload.language as RegisteredUserRecord['language']) || 'en',
    createdAt: now,
    lastActive: now,
    isActive: true,
    isVerified: true,
    password: '',
  };
  saveRegisteredUser(record);

  const token = genToken();
  saveToken(token);
  const user = registeredToAuthUser(record);
  saveUser(user);

  return delay({ success: true, user });
}

// ─── Request Email OTP ───────────────────────────────────────

export async function requestLoginOtp(email: string): Promise<{ success: boolean; message: string }> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, message: emailErr };

  return delay({ success: true, message: `Verification code sent (demo code: ${DEMO_OTP}).` });
}

// ─── Sign Out ────────────────────────────────────────────────

export function signOut(): void {
  clearSession();
}

// ─── Get Session ─────────────────────────────────────────────

export function getSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = getToken();
    if (!token) return null;

    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    const user: AuthUser = JSON.parse(userStr);
    return user;
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const session = getSession();
  if (!session) {
    throw new Error('No active demo session.');
  }
  // Re-resolve against the directory in case an admin changed the
  // account's approval/active status since the session was saved.
  const fresh = findDirectoryUser(session.email) || session;
  saveUser(fresh);
  return delay(fresh);
}

// ─── Forgot Password ─────────────────────────────────────────

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, message: emailErr };

  return delay({
    success: true,
    message: `If registered, a verification code has been sent to your email. (demo code: ${DEMO_OTP})`,
  });
}

// ─── Reset Password ──────────────────────────────────────────

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr, field: 'email' };

  if (!otp || !otp.trim()) return { success: false, error: 'OTP code is required', field: 'otp' };
  if (otp.trim() !== DEMO_OTP) return { success: false, error: 'Invalid or expired verification code.' };

  const passErr = validatePassword(newPassword);
  if (passErr) return { success: false, error: passErr, field: 'password' };

  const user = findDirectoryUser(email);
  if (!user) return { success: false, error: 'No account found with this email address.', field: 'email' };

  const registered = findRegisteredUserByEmail(email);
  if (registered) {
    updateRegisteredUser(registered.id, { password: newPassword });
  }

  const token = genToken();
  saveToken(token);
  saveUser(user);

  return delay({ success: true, user });
}

// ─── Google OAuth Initiate ───────────────────────────────────
// Frontend-only demo: instead of redirecting to a backend OAuth
// endpoint, this signs the person straight in as a demo citizen
// account so the "Sign in with Google" button stays functional.

export async function signInWithGoogle(_from?: string): Promise<AuthResult> {
  const demoSeed = MOCK_USERS.find((u) => u.role === 'citizen') || MOCK_USERS[0];
  const user = seedUserToAuthUser(demoSeed);

  const token = genToken();
  saveToken(token);
  saveUser(user);

  return delay({ success: true, user }, 700);
}

// ─── Email Verification ───────────────────────────────────────

export async function verifyEmail(
  email: string,
  otp: string
): Promise<AuthResult> {
  const registered = findRegisteredUserByEmail(email);
  if (!registered) {
    return { success: false, error: 'No pending registration found for this email.' };
  }

  if (otp.trim() !== (registered.pendingOtp || DEMO_OTP)) {
    return { success: false, error: 'Invalid or expired verification code.' };
  }

  const updated = updateRegisteredUser(registered.id, {
    isVerified: true,
    isActive: true,
    status: 'ACTIVE',
    pendingOtp: undefined,
  });
  if (!updated) return { success: false, error: 'Verification failed. Please try again.' };

  const user = registeredToAuthUser(updated);
  const token = genToken();
  saveToken(token);
  saveUser(user);

  return delay({ success: true, user });
}

export async function resendVerificationCode(
  email: string
): Promise<{ success: boolean; message: string }> {
  const registered = findRegisteredUserByEmail(email);
  if (registered) {
    updateRegisteredUser(registered.id, { pendingOtp: DEMO_OTP });
  }
  return delay({ success: true, message: `Verification code resent. (demo code: ${DEMO_OTP})` });
}
