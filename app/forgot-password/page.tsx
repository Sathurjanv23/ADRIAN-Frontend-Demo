'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NovaLogo } from '@/components/shared/TopNav';
import {
  Mail, ArrowLeft, CheckCircle, XCircle, Loader2, KeyRound, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { forgotPassword, validateEmail } from '@/lib/auth';
import { toast } from 'sonner';

type Step = 'request' | 'sent' | 'demo-reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [demoToken, setDemoToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      toast.success('Verification code sent!', { description: result.message });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } else {
      setEmailError(result.message);
      toast.error('Request failed', { description: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-em-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated BG */}
      <div className="absolute inset-0 opacity-10 opacity-20 pointer-events-none" />
      <motion.div
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(0,212,255,0.05)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.04)' }}
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="em-card border border-em-border rounded-2xl p-8 shadow-nova">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <NovaLogo size="md" />
          </div>

          <AnimatePresence mode="wait">
            {/* ─ Step: Request Reset ─ */}
            {step === 'request' && (
              <motion.div
                key="request"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-er-blue-light border border-er-blue/20 flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-er-blue" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-nova-text">Forgot Your Password?</h1>
                  <p className="text-sm text-em-text-dim mt-2 leading-relaxed">
                    No worries. Enter your registered email address and we'll send you a secure reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="text-xs font-medium text-em-text-dim block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-em-text-muted pointer-events-none" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                        placeholder="you@nova.lk"
                        autoComplete="email"
                        className={cn(
                          'w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none transition-all',
                          emailError
                            ? 'border-red-500/60 focus:border-red-500 bg-red-500/5'
                            : 'border-em-border focus:border-er-blue/30 focus:bg-em-subtle'
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {emailError && (
                        <motion.p
                          className="flex items-center gap-1 text-[11px] text-red-400 mt-1"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                          <XCircle className="w-3 h-3 flex-shrink-0" /> {emailError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Demo accounts hint */}
                  <div className="p-3 rounded-xl bg-em-subtle border border-em-border text-xs text-em-text-dim space-y-1">
                    <p className="font-medium text-nova-text mb-1.5">Demo accounts you can try:</p>
                    {[
                      { role: 'Officer', email: 'officer@nova.lk' },
                      { role: 'Citizen', email: 'citizen@nova.lk' },
                      { role: 'Admin',   email: 'admin@nova.lk' },
                    ].map((d) => (
                      <button
                        key={d.email}
                        type="button"
                        onClick={() => { setEmail(d.email); setEmailError(null); }}
                        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white hover:border-em-border border border-transparent transition-all"
                      >
                        <span className="text-em-text-muted">{d.role}</span>
                        <span className="text-er-blue font-mono">{d.email}</span>
                      </button>
                    ))}
                  </div>

                  <motion.button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.99 } : {}}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link…</>
                    ) : (
                      'Send Reset Link'
                    )}
                  </motion.button>
                </form>

                <div className="flex justify-center mt-5">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-xs text-em-text-muted hover:text-nova-text transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ─ Step: Email Sent ─ */}
            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Animated success checkmark */}
                <div className="flex justify-center mb-5">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </motion.div>
                  </motion.div>
                </div>

                <h2 className="text-xl font-bold text-nova-text mb-2">Check Your Inbox</h2>
                <p className="text-sm text-em-text-dim mb-1 leading-relaxed">
                  A password reset link has been sent to:
                </p>
                <p className="font-semibold text-er-blue mb-5">{sentEmail}</p>

                <div className="p-4 rounded-xl bg-em-subtle border border-em-border text-left space-y-2 mb-6">
                  {[
                    { icon: '📧', text: 'Check your spam/junk folder if you don\'t see it' },
                    { icon: '⏱️', text: 'The link expires in 30 minutes' },
                    { icon: '🔒', text: 'For security, each link can only be used once' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-2.5 text-xs text-em-text-dim">
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Demo shortcut */}
                <div className="p-3 rounded-xl bg-er-blue-light border border-er-blue/20 text-xs text-em-text-dim mb-5">
                  <p className="font-semibold text-er-blue mb-1">💡 Demo Mode</p>
                  In a real system, an email would be sent. Since this is a simulation, you can{' '}
                  {demoToken ? (
                    <Link
                      href={`/reset-password?token=${demoToken}`}
                      className="text-er-blue underline hover:no-underline"
                    >
                      simulate the reset here →
                    </Link>
                  ) : (
                    <button
                      onClick={() => setStep('demo-reset')}
                      className="text-er-blue underline hover:no-underline"
                    >
                      simulate the reset here →
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setEmail(''); setStep('request'); }}
                    className="w-full text-sm border border-em-border rounded-xl py-2.5 text-em-text-dim hover:border-em-border-strong hover:text-nova-text transition-all"
                  >
                    Try a different email
                  </button>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-xs text-em-text-muted hover:text-nova-text transition-colors py-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ─ Step: Demo Reset ─ */}
            {step === 'demo-reset' && (
              <motion.div
                key="demo-reset"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-nova-text mb-2">Password Reset Simulated</h2>
                <p className="text-sm text-em-text-dim mb-6 leading-relaxed">
                  In a real deployment, clicking the email link would bring you to a secure reset form.
                  For this demo, your password has been kept as-is.
                </p>

                <div className="p-4 rounded-xl bg-em-subtle border border-em-border text-left text-xs text-em-text-dim mb-5 space-y-1">
                  <p className="font-semibold text-nova-text mb-2">Demo credentials for your account:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-em-text-muted">Email:</span>
                    <span className="font-mono text-er-blue">{sentEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-em-text-muted">Password:</span>
                    <span className="font-mono text-er-blue">Demo1234</span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full bg-nova-cyan text-nova-bg font-bold py-3 rounded-xl hover:bg-nova-cyan-dim transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-em-text-muted mt-4">
          SIMULATION DEMO · Not a real government system · Team Code Catalyst
        </p>
      </motion.div>
    </div>
  );
}
