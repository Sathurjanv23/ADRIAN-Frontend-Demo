'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NovaLogo } from '@/components/shared/TopNav';
import {
  Eye, EyeOff, Shield, AlertTriangle, Truck, Building2,
  Mail, Lock, User, Phone, MapPin, ArrowRight, CheckCircle, XCircle,
  Loader2, ChevronDown, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { useNovaStore } from '@/lib/store/nova-store';
import { toast } from 'sonner';
import {
  signUp, signInWithGoogle,
  validateEmail, validatePassword, validateName, validatePhone,
  validateConfirmPassword, getPasswordStrength,
  verifyEmail, resendVerificationCode, SL_DISTRICTS,
} from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// ─── Google Icon ──────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Public Self-Registration Roles (Admin is strictly excluded) ─

const PUBLIC_ROLES: { value: 'citizen' | 'officer' | 'rescue_team' | 'hospital'; label: string; desc: string; icon: React.ReactNode; color: string; href: string }[] = [
  { value: 'citizen',     label: 'Citizen',           desc: 'Report emergencies & track rescue operations', icon: <Shield className="w-4 h-4" />,       color: 'border-er-blue/30 text-er-blue bg-er-blue-light',     href: '/citizen' },
  { value: 'officer',     label: 'Emergency Officer', desc: 'Command center & dispatch coordination',       icon: <AlertTriangle className="w-4 h-4" />, color: 'border-purple-400/60 text-purple-400 bg-purple-400/10', href: '/command' },
  { value: 'rescue_team', label: 'Rescue Team',       desc: 'Field response & victim extraction units',     icon: <Truck className="w-4 h-4" />,         color: 'border-orange-400/60 text-orange-400 bg-orange-400/10', href: '/rescue' },
  { value: 'hospital',    label: 'Hospital Unit',     desc: 'Emergency triage & casualty management',       icon: <Building2 className="w-4 h-4" />,     color: 'border-pink-400/60 text-pink-400 bg-pink-400/10',       href: '/hospital' },
];

const ROLE_HREF: Record<UserRole, string> = {
  citizen: '/citizen',
  officer: '/command',
  rescue_team: '/rescue',
  hospital: '/hospital',
  admin: '/admin',
};

// ─── Field component ─────────────────────────────────────────

function Field({
  id, label, type = 'text', value, onChange, error, icon, placeholder, suffix, hint,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string | null; icon?: React.ReactNode;
  placeholder?: string; suffix?: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-em-text-dim block mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-em-text-muted pointer-events-none">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'new-password' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
          className={cn(
            'w-full bg-white border rounded-xl py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none transition-all',
            icon ? 'pl-10' : 'pl-4',
            suffix ? 'pr-11' : 'pr-4',
            error
              ? 'border-red-500/60 focus:border-red-500 bg-red-500/5'
              : 'border-em-border focus:border-er-blue/30 focus:bg-em-subtle'
          )}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
      {hint && !error && <p className="text-[10px] text-em-text-muted mt-1">{hint}</p>}
      <AnimatePresence>
        {error && (
          <motion.p
            className="flex items-center gap-1 text-[11px] text-red-400 mt-1"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <XCircle className="w-3 h-3 flex-shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Password Strength Bar ────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength.score ? strength.color : '#1a2744' }}
          />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: strength.color }}>
        {strength.label && `Password strength: ${strength.label}`}
      </p>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-[10px] transition-colors', met ? 'text-green-400' : 'text-em-text-muted')}>
      {met ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-em-border" />}
      {text}
    </div>
  );
}

// ─── OTP Verification Screen ──────────────────────────────────

function OtpVerificationScreen({
  user,
  demoOtp,
  onSuccess,
  onBack,
}: {
  user: AuthUser;
  demoOtp?: string;
  onSuccess: (u: AuthUser) => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(null);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    if (timeLeft === 0) {
      setError('OTP has expired. Please request a new OTP.');
      return;
    }
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true);
    setError(null);
    const result = await verifyEmail(user.email, code);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Invalid OTP.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }
    toast.success('Email verified!', { description: 'Your account is now active.' });
    onSuccess(result.user);
  };

  const handleResend = async () => {
    setResending(true);
    const result = await resendVerificationCode(user.email);
    setResending(false);
    setTimeLeft(30);
    setOtp(['', '', '', '', '', '']);
    setError(null);
    inputRefs.current[0]?.focus();
    if (result.success) {
      toast.success('New verification code sent!', { description: 'Check your email for the 6-digit code.' });
    } else {
      toast.error(result.message || 'Failed to resend verification code.');
    }
  };

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-5"
    >
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-er-blue-light border border-er-blue/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-er-blue" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-nova-text">Verify Your Email</h2>
        <p className="text-sm text-em-text-dim mt-1.5 leading-relaxed">
          We sent a 6-digit verification code to<br />
          <span className="text-er-blue font-semibold">{user.email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={timeLeft === 0}
            className={cn(
              'w-11 h-12 text-center text-lg font-bold border rounded-xl bg-white text-nova-text focus:outline-none transition-all disabled:opacity-40',
              digit ? 'border-nova-cyan bg-er-blue-light' : 'border-em-border focus:border-er-blue/30'
            )}
          />
        ))}
      </div>

      {/* Countdown timer */}
      <div className="text-center">
        {timeLeft > 0 ? (
          <p className="text-xs text-em-text-muted">
            OTP expires in{' '}
            <span className="font-mono font-bold text-er-blue">{timeLeft}s</span>
          </p>
        ) : (
          <p className="text-xs font-semibold text-red-400">
            ⚠️ OTP expired. Please request a new OTP.
          </p>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="otp-verify-btn"
        onClick={handleVerify}
        disabled={loading || otp.join('').length < 6 || timeLeft === 0}
        className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        whileHover={!loading && timeLeft > 0 ? { scale: 1.01 } : {}}
        whileTap={!loading && timeLeft > 0 ? { scale: 0.99 } : {}}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Activate Account</>}
      </motion.button>

      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-em-text-muted hover:text-nova-text transition-colors">
          ← Change email
        </button>
        <button
          onClick={handleResend}
          disabled={timeLeft > 0 || resending}
          className="flex items-center gap-1.5 text-er-blue hover:underline disabled:text-em-text-muted disabled:no-underline transition-colors"
        >
          {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend code'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 1: Account Info ─────────────────────────────────────

function StepAccountInfo({
  name, setName, email, setEmail,
  password, setPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword, errors, setErrors,
}: any) {
  return (
    <div className="space-y-4">
      <Field
        id="name"
        label="Full Name"
        value={name}
        onChange={(v) => { setName(v); setErrors((e: any) => ({ ...e, name: null })); }}
        error={errors.name}
        icon={<User className="w-4 h-4" />}
        placeholder="Amal Perera"
      />
      <Field
        id="reg-email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(v) => { setEmail(v); setErrors((e: any) => ({ ...e, email: null })); }}
        error={errors.email}
        icon={<Mail className="w-4 h-4" />}
        placeholder="you@example.com"
        hint="A verification code will be sent to this address"
      />
      <div>
        <Field
          id="reg-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(v) => { setPassword(v); setErrors((e: any) => ({ ...e, password: null })); }}
          error={errors.password}
          icon={<Lock className="w-4 h-4" />}
          placeholder="••••••••"
          suffix={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-em-text-muted hover:text-nova-text transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <PasswordStrengthMeter password={password} />
        {password && (
          <div className="grid grid-cols-2 gap-1 mt-2">
            <PasswordRequirement met={password.length >= 8} text="8+ characters" />
            <PasswordRequirement met={/[A-Z]/.test(password)} text="Uppercase letter" />
            <PasswordRequirement met={/[0-9]/.test(password)} text="Number" />
            <PasswordRequirement met={/[^A-Za-z0-9]/.test(password)} text="Special char (optional)" />
          </div>
        )}
      </div>
      <Field
        id="reg-confirm-password"
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(v) => { setConfirmPassword(v); setErrors((e: any) => ({ ...e, confirmPassword: null })); }}
        error={errors.confirmPassword}
        icon={<Lock className="w-4 h-4" />}
        placeholder="••••••••"
      />
    </div>
  );
}

// ─── Step 2: Role & Profile ───────────────────────────────────

function StepRoleProfile({ selectedRole, setSelectedRole, phone, setPhone, district, setDistrict, errors, setErrors }: any) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-em-text-muted uppercase tracking-wider mb-3">Select Your Role</p>
        <div className="space-y-2">
          {PUBLIC_ROLES.map((role) => (
            <button
              key={role.value}
              id={`reg-role-${role.value}`}
              type="button"
              onClick={() => setSelectedRole(role.value)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                selectedRole === role.value
                  ? role.color
                  : 'border-em-border text-em-text-dim hover:border-em-border-strong hover:text-nova-text'
              )}
            >
              {role.icon}
              <div className="flex-1">
                <p className="text-sm font-semibold">{role.label}</p>
                <p className="text-[10px] opacity-70">{role.desc}</p>
              </div>
              {selectedRole === role.value && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <Field
        id="reg-phone"
        label="Phone Number (optional)"
        type="tel"
        value={phone}
        onChange={(v) => { setPhone(v); setErrors((e: any) => ({ ...e, phone: null })); }}
        error={errors.phone}
        icon={<Phone className="w-4 h-4" />}
        placeholder="+94 77 123 4567"
        hint="Used for emergency alerts and verification"
      />

      <div>
        <label htmlFor="reg-district" className="text-xs font-medium text-em-text-dim block mb-1.5">District (optional)</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-em-text-muted pointer-events-none" />
          <select
            id="reg-district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full bg-white border border-em-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-nova-text focus:outline-none focus:border-er-blue/30 transition-all appearance-none"
          >
            <option value="">Select district…</option>
            {SL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-em-text-muted pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Register Page ───────────────────────────────────────

type RegStep = 1 | 2 | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser } = useNovaStore();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.replace(ROLE_HREF[currentUser.role] ?? '/');
    }
  }, [isAuthenticated, currentUser, router]);

  const [step, setStep] = useState<RegStep>(1);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | undefined>();

  // Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Role & Profile
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer' | 'rescue_team' | 'hospital'>('citizen');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<boolean>(false);
  const [agreed, setAgreed] = useState(false);
  const [agreedError, setAgreedError] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    const nameErr    = validateName(name);
    const emailErr   = validateEmail(email);
    const passErr    = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    setErrors({ name: nameErr, email: emailErr, password: passErr, confirmPassword: confirmErr });
    return !nameErr && !emailErr && !passErr && !confirmErr;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setConflictError(false);

    if (!agreed) {
      setAgreedError('You must agree to the terms to continue');
      return;
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setErrors((prev) => ({ ...prev, phone: phoneErr }));
      return;
    }

    setLoading(true);
    const result = await signUp({
      name,
      email,
      password,
      role: selectedRole,
      phone: phone || undefined,
      district: district || undefined,
    });
    setLoading(false);

    if (!result.success) {
      if (result.statusCode === 409) {
        setConflictError(true);
        setGlobalError(result.error);
      } else if (result.field === 'email') {
        setStep(1);
        setErrors((prev) => ({ ...prev, email: result.error }));
      } else if (result.field === 'password') {
        setStep(1);
        setErrors((prev) => ({ ...prev, password: result.error }));
      } else if (result.field === 'name') {
        setStep(1);
        setErrors((prev) => ({ ...prev, name: result.error }));
      } else {
        setGlobalError(result.error);
      }
      return;
    }

    if (result.requiresVerification) {
      setPendingUser(result.user);
      setDemoOtp(result.demoOtp);
      setStep('otp');
      return;
    }

    doLogin(result.user);
  };

  const handleVerifySuccess = (user: AuthUser) => {
    doLogin(user);
  };

  const doLogin = (user: AuthUser) => {
    login({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language || 'en',
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      isActive: true,
    });
    toast.success(`Welcome to ADRIAN, ${user.name}!`, { description: 'Your account has been activated.' });
    router.push(ROLE_HREF[user.role] || '/');
  };

  // Read error from query string (e.g. redirected from OAuth)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'google_not_configured') {
        setGlobalError(
          'Google Authentication redirect failed. Please try the Google button again, or sign up using the form below.'
        );
      } else if (err === 'google_auth_failed') {
        setGlobalError(
          'Google Authentication could not be completed. Please try again or sign up using the form below.'
        );
      }
    }
  }, []);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    await signInWithGoogle('register');
    setGoogleLoading(false);
  };

  const progressSteps = [
    { key: 1, label: 'Account' },
    { key: 2, label: 'Profile & Role' },
    { key: 'otp', label: 'Verify Email' },
  ] as const;

  const stepIndex = step === 1 ? 0 : step === 2 ? 1 : 2;

  return (
    <div className="min-h-screen bg-em-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 opacity-20 pointer-events-none" />
      <motion.div
        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(0,212,255,0.05)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.05)' }}
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="em-card border border-em-border rounded-2xl p-8 shadow-nova">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <NovaLogo size="md" />
            </div>
            <h1 className="text-2xl font-bold text-nova-text">Create Your Account</h1>
            <p className="text-xs text-em-text-dim mt-1">Join the AI Emergency Response Network</p>
          </div>

          <div className="flex items-center gap-1 mb-6">
            {progressSteps.map((s, idx) => (
              <div key={String(s.key)} className="flex items-center gap-1 flex-1">
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0',
                  idx < stepIndex ? 'bg-nova-cyan border-nova-cyan text-nova-bg' :
                  idx === stepIndex ? 'border-nova-cyan text-er-blue' :
                  'border-em-border text-em-text-muted'
                )}>
                  {idx < stepIndex ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={cn('text-[10px] font-medium flex-shrink-0', idx === stepIndex ? 'text-nova-text' : 'text-em-text-muted')}>
                  {s.label}
                </span>
                {idx < progressSteps.length - 1 && (
                  <div className={cn('flex-1 h-px mx-1', idx < stepIndex ? 'bg-nova-cyan' : 'bg-nova-border')} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <motion.button
                id="google-signup-btn"
                onClick={handleGoogleSignUp}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border border-em-border rounded-xl py-2.5 text-sm font-medium text-nova-text hover:bg-em-subtle hover:border-em-border-strong transition-all disabled:opacity-50 mb-5"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
                {googleLoading ? 'Connecting…' : 'Sign up with Google'}
              </motion.button>
              <div className="relative flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-nova-border" />
                <span className="text-[10px] text-em-text-muted uppercase tracking-wider">or register with email</span>
                <div className="flex-1 h-px bg-nova-border" />
              </div>
            </>
          )}

          <AnimatePresence>
            {globalError && (
              <motion.div
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-4 flex items-start gap-2"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{globalError}</p>
                  {conflictError && (
                    <Link href="/login" className="text-er-blue font-bold underline mt-1 inline-block">
                      Sign in to your existing account →
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 'otp' && pendingUser && (
              <OtpVerificationScreen
                user={pendingUser}
                demoOtp={demoOtp}
                onSuccess={handleVerifySuccess}
                onBack={() => { setStep(1); setPendingUser(null); }}
              />
            )}

            {step === 1 && (
              <motion.form
                key="step1"
                onSubmit={handleNextStep}
                noValidate
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <StepAccountInfo
                  name={name} setName={setName}
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showPassword={showPassword} setShowPassword={setShowPassword}
                  errors={errors} setErrors={setErrors}
                />
                <motion.button
                  id="register-next-btn"
                  type="submit"
                  className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all flex items-center justify-center gap-2 mt-6"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                onSubmit={handleSubmit}
                noValidate
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <StepRoleProfile
                  selectedRole={selectedRole} setSelectedRole={setSelectedRole}
                  phone={phone} setPhone={setPhone}
                  district={district} setDistrict={setDistrict}
                  errors={errors} setErrors={setErrors}
                />

                <div className="mt-5">
                  <label className={cn('flex items-start gap-3 cursor-pointer')}>
                    <div
                      onClick={() => { setAgreed(!agreed); setAgreedError(null); }}
                      className={cn(
                        'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        agreed ? 'bg-nova-cyan border-nova-cyan' : 'border-em-border hover:border-em-border-strong'
                      )}
                    >
                      {agreed && <CheckCircle className="w-3 h-3 text-nova-bg" />}
                    </div>
                    <span className="text-xs text-em-text-dim leading-relaxed">
                      I agree to the{' '}
                      <span className="text-er-blue hover:underline cursor-pointer">Terms of Service</span>
                      {' '}and{' '}
                      <span className="text-er-blue hover:underline cursor-pointer">Privacy Policy</span>.
                    </span>
                  </label>
                  {agreedError && (
                    <p className="flex items-center gap-1 text-[11px] text-red-400 mt-1 ml-7">
                      <XCircle className="w-3 h-3" /> {agreedError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setGlobalError(null); }}
                    className="flex-1 border border-em-border text-em-text-dim py-3 rounded-xl hover:border-em-border-strong hover:text-nova-text transition-all text-sm font-medium"
                  >
                    ← Back
                  </button>
                  <motion.button
                    id="register-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.99 } : {}}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {step !== 'otp' && (
            <p className="text-center text-xs text-em-text-muted mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-er-blue hover:underline font-medium">Sign In</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
