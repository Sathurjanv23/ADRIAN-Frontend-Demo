'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NovaLogo } from '@/components/shared/TopNav';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, XCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';
import { useNovaStore } from '@/lib/store/nova-store';
import { toast } from 'sonner';
import {
  signIn, signInWithGoogle,
  validateEmail, validatePassword,
  verifyEmail, resendVerificationCode,
} from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// ─── Google Icon SVG ──────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  officer: 'Emergency Officer',
  rescue_team: 'Rescue Team',
  hospital: 'Hospital',
  admin: 'Administrator',
};

const ROLE_HREF: Record<UserRole, string> = {
  citizen: '/citizen',
  officer: '/command',
  rescue_team: '/rescue',
  hospital: '/hospital',
  admin: '/admin',
};

// ─── Field Input ─────────────────────────────────────────────

function Field({
  id, label, type = 'text', value, onChange, error, icon, placeholder, suffix,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string | null; icon?: React.ReactNode;
  placeholder?: string; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-em-text-dim block mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-em-text-muted pointer-events-none">{icon}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          className={cn(
            'w-full bg-white border rounded-xl py-2.5 text-sm text-em-text placeholder:text-em-text-muted focus:outline-none transition-all',
            icon ? 'pl-10 pr-4' : 'px-4',
            suffix ? 'pr-11' : '',
            error
              ? 'border-red-500/60 focus:border-red-500 bg-red-500/5'
              : 'border-em-border focus:border-er-blue/40 focus:bg-em-subtle'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="flex items-center gap-1 text-[11px] text-er-red mt-1"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <XCircle className="w-3 h-3 flex-shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
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

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 30s countdown timer
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
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

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

    toast.success('Email verified!', { description: 'Welcome to ADRIAN.' });
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
      toast.success('New code sent!', { description: 'Check your email for the 6-digit code.' });
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
      {/* Icon */}
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-2xl bg-er-blue-light border border-er-blue/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-er-blue" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-em-text">Verify Your Email</h2>
        <p className="text-sm text-em-text-dim mt-1.5 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="text-er-blue font-semibold">{user.email}</span>
        </p>
      </div>

      {/* OTP boxes */}
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
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={timeLeft === 0}
            className={cn(
              'w-11 h-12 text-center text-lg font-bold border rounded-xl bg-white text-em-text focus:outline-none transition-all disabled:opacity-40',
              digit ? 'border-nova-cyan bg-er-blue-light' : 'border-em-border focus:border-er-blue/40'
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
          <p className="text-xs font-semibold text-er-red">
            ⚠️ OTP expired. Please request a new OTP.
          </p>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-er-red text-xs"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify button */}
      <motion.button
        id="otp-verify-btn"
        onClick={handleVerify}
        disabled={loading || otp.join('').length < 6 || timeLeft === 0}
        className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        whileHover={!loading && timeLeft > 0 ? { scale: 1.01 } : {}}
        whileTap={!loading && timeLeft > 0 ? { scale: 0.99 } : {}}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Sign In</>}
      </motion.button>

      {/* Resend */}
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-em-text-muted hover:text-em-text transition-colors">
          ← Use different email
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

// ─── Main Login Page ─────────────────────────────────────────

type LoginStep = 'credentials' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser } = useNovaStore();

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.replace(ROLE_HREF[currentUser.role] ?? '/');
    }
  }, [isAuthenticated, currentUser, router]);

  // Read error from query string (e.g. redirected from OAuth)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'google_not_configured') {
        setGlobalError(
          'Google Authentication redirect failed. Please try the Google button again, or sign in with your email and password.'
        );
      } else if (err === 'google_auth_failed') {
        setGlobalError(
          'Google Authentication could not be completed. Please try again or sign in with your email and password.'
        );
      }
    }
  }, []);

  const [step, setStep] = useState<LoginStep>('credentials');
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | undefined>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const validate = (): boolean => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    return !eErr && !pErr;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      if (result.field === 'email') setEmailError(result.error);
      else if (result.field === 'password') setPasswordError(result.error);
      else setGlobalError(result.error);
      return;
    }

    // Needs email verification
    if (result.requiresVerification) {
      setPendingUser(result.user);
      setDemoOtp(result.demoOtp);
      setStep('otp');
      return;
    }

    // Successfully authenticated
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
      language: user.language,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      isActive: true,
    });

    const roleLabel = ROLE_LABELS[user.role] || 'User';
    toast.success(`Welcome back, ${user.name}!`, { description: `Signed in as ${roleLabel}` });
    router.push(ROLE_HREF[user.role] || '/');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGlobalError(null);
    const result = await signInWithGoogle();
    setGoogleLoading(false);

    if (!result.success) {
      setGlobalError(result.error);
      return;
    }

    // Google accounts are always pre-verified
    doLogin(result.user);
    toast.success('Signed in with Google!', { description: `Welcome, ${result.user.name}` });
  };

  return (
    <div className="min-h-screen bg-em-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated BG */}
      <div className="absolute inset-0 opacity-10 opacity-20 pointer-events-none" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(0,212,255,0.05)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.05)' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
      />

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card */}
        <div className="em-card border border-em-border rounded-2xl p-8 shadow-nova">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <NovaLogo size="md" />
            </div>
            <h1 className="text-2xl font-bold text-em-text">Sign In to ADRIAN</h1>
            <p className="text-xs text-em-text-dim mt-1">AI Emergency Response Network</p>
          </div>

          <AnimatePresence mode="wait">
            {/* ─── OTP step ─── */}
            {step === 'otp' && pendingUser && (
              <OtpVerificationScreen
                user={pendingUser}
                demoOtp={demoOtp}
                onSuccess={handleVerifySuccess}
                onBack={() => { setStep('credentials'); setPendingUser(null); }}
              />
            )}

            {/* ─── Credentials step ─── */}
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Google SSO */}
                <motion.button
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 border border-em-border rounded-xl py-2.5 text-sm font-medium text-em-text hover:bg-em-subtle hover:border-em-border-strong transition-all disabled:opacity-50 mb-5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="w-4 h-4" />
                  )}
                  {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
                </motion.button>

                {/* Divider */}
                <div className="relative flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-nova-border" />
                  <span className="text-[10px] text-em-text-muted uppercase tracking-wider">or sign in with email</span>
                  <div className="flex-1 h-px bg-nova-border" />
                </div>

                {/* Global Error */}
                <AnimatePresence>
                  {globalError && (
                    <motion.div
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-er-red text-xs mb-4"
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {globalError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleLogin} noValidate className="space-y-4">
                  <Field
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(v) => { setEmail(v); setEmailError(null); setGlobalError(null); }}
                    error={emailError}
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="you@adrian-emergency.lk"
                  />
                  <Field
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(v) => { setPassword(v); setPasswordError(null); setGlobalError(null); }}
                    error={passwordError}
                    icon={<Lock className="w-4 h-4" />}
                    placeholder="••••••••"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-em-text-muted hover:text-em-text transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Forgot Password */}
                  <div className="flex justify-end -mt-1">
                    <Link href="/forgot-password" className="text-xs text-er-blue hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <motion.button
                    id="signin-submit-btn"
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.99 } : {}}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                    ) : (
                      <>Sign In to ADRIAN <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-em-text-muted mt-5">
                  New to ADRIAN?{' '}
                  <Link href="/register" className="text-er-blue hover:underline font-medium">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
