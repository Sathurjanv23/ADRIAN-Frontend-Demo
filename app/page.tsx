'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NovaLogo } from '@/components/shared/TopNav';
import {
  Zap, Map, Brain, Shield, Globe, ArrowRight,
  BarChart3, Radio, Users, AlertTriangle, Activity, Cpu,
  CheckCircle, Clock, TrendingUp, Navigation,
  HeartPulse, Truck, Phone, Menu, X, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNovaStore } from '@/lib/store/nova-store';
import { useTranslation } from '@/lib/i18n';

// ─── Counter animation hook ──────────────────────────────────

function useCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 2000;

  useEffect(() => {
    if (!start) return;
    let isMounted = true;
    const startTime = performance.now();
    let timer: ReturnType<typeof setInterval>;

    const updateValue = () => {
      if (!isMounted) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / safeDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * safeTarget));
      if (progress >= 1) clearInterval(timer);
    };

    timer = setInterval(updateValue, 16);
    updateValue();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [safeTarget, safeDuration, start]);
  return value;
}

// ─── Live Stats ──────────────────────────────────────────────

function LiveStats() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const activeIncidents = useCounter(1247, 2000, started);
  const peopleAssisted  = useCounter(48391, 2500, started);
  const rescueTeams     = useCounter(342, 1800, started);
  const avgResponse     = useCounter(114, 2200, started);
  const aiPredictions   = useCounter(873, 2000, started);

  const stats = [
    { value: activeIncidents, label: 'Active Incidents',   unit: '',  icon: <AlertTriangle className="w-5 h-5" />, color: 'text-er-red',    bg: 'bg-er-red-light border-er-red/20' },
    { value: peopleAssisted,  label: 'People Assisted',    unit: '+', icon: <Users className="w-5 h-5" />,         color: 'text-er-blue',   bg: 'bg-er-blue-light border-er-blue/20' },
    { value: rescueTeams,     label: 'Rescue Teams',       unit: '',  icon: <Shield className="w-5 h-5" />,        color: 'text-er-green',  bg: 'bg-er-green-light border-er-green/20' },
    { value: avgResponse,     label: 'Avg Response (min)', unit: '',  icon: <Clock className="w-5 h-5" />,         color: 'text-er-orange', bg: 'bg-er-orange-light border-er-orange/20' },
    { value: aiPredictions,   label: 'AI Predictions',     unit: '',  icon: <Brain className="w-5 h-5" />,        color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className={cn('em-card p-4 text-center border', stat.bg)}
          initial={{ opacity: 0, y: 20 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <div className={cn('flex justify-center mb-2', stat.color)}>{stat.icon}</div>
          <div className={cn('text-3xl font-black tabular-nums', stat.color)}>
            {stat.value.toLocaleString()}{stat.unit}
          </div>
          <div className="text-xs text-em-text-muted mt-1 font-semibold">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Hero Map Visual (Light) ─────────────────────────────────

function HeroMapVisual() {
  const incidents = [
    { x: 45, y: 62, type: 'critical', label: 'Zone 04 · Critical' },
    { x: 38, y: 55, type: 'high',     label: 'Zone 03 · High' },
    { x: 55, y: 42, type: 'medium',   label: 'Zone 07 · Medium' },
    { x: 42, y: 70, type: 'critical', label: 'Colombo · Critical' },
    { x: 30, y: 48, type: 'low',      label: 'Gampaha · Low' },
  ];

  const colors = {
    critical: '#D32F2F',
    high:     '#F57C00',
    medium:   '#F9A825',
    low:      '#2E7D32',
  };

  const labelBgs = {
    critical: '#FFEBEE',
    high:     '#FFF3E0',
    medium:   '#FFFDE7',
    low:      '#E8F5E9',
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 border border-em-border shadow-em-lg">
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(21,101,192,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(21,101,192,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Sri Lanka outline */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="150" cy="200" rx="80" ry="160" fill="none" stroke="#1565C0" strokeWidth="1.5" />
          <ellipse cx="150" cy="200" rx="60" ry="130" fill="rgba(21,101,192,0.05)" stroke="#1976D2" strokeWidth="0.5" />
        </svg>

        {/* Scan line */}
        <motion.div
          className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-er-blue to-transparent opacity-40"
          animate={{ y: ['0%', '100%', '0%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* Incident markers */}
        {incidents.map((incident, i) => (
          <div key={i} className="absolute" style={{ left: `${incident.x}%`, top: `${incident.y}%` }}>
            <motion.div
              className="absolute -inset-4 rounded-full border-2"
              style={{ borderColor: colors[incident.type as keyof typeof colors] + '40' }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
            />
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-em-md relative"
              style={{ background: colors[incident.type as keyof typeof colors] }}
            />
            <div
              className="absolute left-5 top-0 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border shadow-em-sm"
              style={{ backgroundColor: labelBgs[incident.type as keyof typeof labelBgs], color: colors[incident.type as keyof typeof colors], borderColor: colors[incident.type as keyof typeof colors] + '40' }}
            >
              {incident.label}
            </div>
          </div>
        ))}

        {/* AI connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.line x1="45" y1="62" x2="42" y2="70" stroke="#1565C0" strokeWidth="0.4" strokeDasharray="2,2"
            animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.line x1="38" y1="55" x2="42" y2="70" stroke="#F57C00" strokeWidth="0.4" strokeDasharray="2,2"
            animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }} />
        </svg>

        {/* Corner HUD */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-er-blue/70 space-y-0.5 font-semibold">
          <div>SYS: ONLINE</div>
          <div>AI: ACTIVE</div>
          <div>TEAMS: 12</div>
        </div>
        <div className="absolute top-3 right-3 text-[9px] font-mono text-er-blue/70 text-right space-y-0.5 font-semibold">
          <div>LK-DMC-ADRION</div>
          <div>LIVE FEED</div>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-er-red font-black">
            ● REC
          </motion.div>
        </div>
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-em-text-muted font-semibold">
          6.9271°N, 79.8612°E
        </div>
      </div>
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────

const FEATURES = [
  { icon: <Brain className="w-6 h-6" />,      title: 'Multimodal AI',         desc: 'Analyzes text, voice, and image reports in English, Tamil, and Sinhala in under 5 seconds.',       color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { icon: <Map className="w-6 h-6" />,         title: 'Live GIS Command',       desc: 'Real-time interactive map showing all incidents, rescue teams, and risk zones.',                    color: 'text-er-blue',   bg: 'bg-er-blue-light border-er-blue/20' },
  { icon: <TrendingUp className="w-6 h-6" />,  title: 'Predictive Intelligence',desc: 'ML models predict flood and landslide risk up to 6 hours in advance.',                            color: 'text-er-blue',   bg: 'bg-er-blue-light border-er-blue/20' },
  { icon: <Zap className="w-6 h-6" />,         title: 'Smart Prioritization',   desc: 'AI ranks all incidents by severity, vulnerability, and available resources automatically.',         color: 'text-er-orange', bg: 'bg-er-orange-light border-er-orange/20' },
  { icon: <Users className="w-6 h-6" />,       title: 'Multi-Role Coordination',desc: 'Connects citizens, officers, rescue teams, and hospitals in one unified platform.',                  color: 'text-er-green',  bg: 'bg-er-green-light border-er-green/20' },
  { icon: <Activity className="w-6 h-6" />,    title: 'Digital Twin',           desc: 'Simulate future risk scenarios to proactively position and deploy resources before disasters.',       color: 'text-er-red',    bg: 'bg-er-red-light border-er-red/20' },
];

// ─── How ADRIAN Works ────────────────────────────────────────

const HOW_STEPS = [
  { icon: '📱', step: '01', title: 'Citizen Reports',     desc: 'Send SOS via text, voice, photo, or GPS in any language — no account needed' },
  { icon: '🤖', step: '02', title: 'AI Understands',       desc: 'Multimodal AI analyzes the report, detects severity & type in under 5 seconds' },
  { icon: '🎯', step: '03', title: 'Priority Assigned',    desc: 'ADRIAN ranks the incident against all active emergencies automatically' },
  { icon: '🗺️', step: '04', title: 'Team Dispatched',      desc: 'Nearest capable rescue team is recommended and deployed via live map' },
  { icon: '🏥', step: '05', title: 'Hospital Coordinated', desc: 'Medical facilities receive patient alerts and ETA before arrival' },
  { icon: '📊', step: '06', title: 'AI Learns',            desc: 'After-action reports generated to continuously improve future responses' },
];

// ─── Portals ─────────────────────────────────────────────────

const PORTALS = [
  {
    icon: '👤',
    title: 'Citizen Portal',
    subtitle: 'No login required for SOS',
    desc: 'Report emergencies, track rescue status, and access safety guidelines for your area.',
    href: '/citizen/sos',
    cta: 'Report Emergency',
    color: 'border-er-blue bg-er-blue-light',
    btnColor: 'em-btn em-btn-blue em-btn-lg w-full',
    badge: 'OPEN — No Login Needed',
    badgeColor: 'bg-er-green-light text-er-green border-er-green/30',
  },
  {
    icon: '🚒',
    title: 'Rescue Team',
    subtitle: 'Login Required',
    desc: 'Live incident map, priority queue, mission acceptance, and navigation to victims.',
    href: '/rescue',
    cta: 'Rescue Dashboard',
    color: 'border-er-orange bg-er-orange-light',
    btnColor: 'em-btn em-btn-lg w-full',
    badge: 'RESCUE TEAMS',
    badgeColor: 'bg-er-orange-light text-er-orange border-er-orange/30',
  },
  {
    icon: '🏥',
    title: 'Hospital Portal',
    subtitle: 'Login Required',
    desc: 'Manage triage queue, track ambulances, and receive advance patient arrival alerts.',
    href: '/hospital',
    cta: 'Hospital Dashboard',
    color: 'border-pink-300 bg-pink-50',
    btnColor: 'em-btn em-btn-lg w-full',
    badge: 'MEDICAL STAFF',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  {
    icon: '🛡️',
    title: 'Command Center',
    subtitle: 'Officers Only',
    desc: 'Full situational awareness: live map, AI analysis, resource coordination, and reporting.',
    href: '/command',
    cta: 'Launch Command Center',
    color: 'border-purple-300 bg-purple-50',
    btnColor: 'em-btn em-btn-lg w-full',
    badge: 'OFFICERS',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

// ─── Emergency Types ──────────────────────────────────────────

const EMERGENCY_TYPES = [
  { icon: '🌊', label: 'Flood',          risk: 82, color: '#1565C0' },
  { icon: '⛰️', label: 'Landslide',     risk: 55, color: '#F57C00' },
  { icon: '🔥', label: 'Fire',            risk: 28, color: '#D32F2F' },
  { icon: '🌍', label: 'Earthquake',      risk: 15, color: '#795548' },
  { icon: '🌪️', label: 'Severe Weather', risk: 68, color: '#546E7A' },
  { icon: '🏥', label: 'Medical',         risk: 40, color: '#E91E63' },
];

// ─── Main Landing Page ────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage, simulation } = useNovaStore();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  const LANG_OPTIONS = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ta', label: 'தமிழ்',   short: 'TA' },
    { code: 'si', label: 'සිංහල',   short: 'SI' },
  ] as const;

  const handleLanguageSelect = (code: 'en' | 'ta' | 'si') => {
    setLanguage(code);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('adrian_lang', code); } catch {}
    }
  };

  const PORTAL_LINKS = [
    { href: '/citizen',  label: t('portal.citizen'),  icon: '👤' },
    { href: '/command',  label: t('portal.command'),  icon: '🛡️' },
    { href: '/rescue',   label: t('portal.rescue'),   icon: '🚒' },
    { href: '/hospital', label: t('portal.hospital'), icon: '🏥' },
    { href: '/admin',    label: t('portal.admin'),    icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-em-bg">

      {/* ─ Navigation ─ */}
      <nav className="sticky top-0 z-50 bg-white/97 backdrop-blur-xl border-b border-em-border shadow-em-sm" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <NovaLogo size="md" />

          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-em-text-dim">
            <Link href="/about"        className="hover:text-em-text transition-colors">About</Link>
            <Link href="/preparedness" className="hover:text-em-text transition-colors">Preparedness</Link>
            <Link href="/command"      className="hover:text-em-text transition-colors">{t('portal.command')}</Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Language Selector */}
            <div
              className="flex items-center gap-0.5 bg-em-subtle border border-em-border rounded-xl p-1"
              role="group"
              aria-label="Language selector"
            >
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  id={`home-lang-${opt.code}-btn`}
                  onClick={() => handleLanguageSelect(opt.code)}
                  className={cn(
                    'px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                    language === opt.code
                      ? 'bg-er-blue text-white shadow-em-sm'
                      : 'text-em-text-muted hover:text-em-text hover:bg-em-muted'
                  )}
                  aria-label={opt.label}
                  aria-pressed={language === opt.code}
                >
                  {opt.short}
                </button>
              ))}
            </div>

            {/* Portal Switcher Dropdown */}
            <div className="relative">
              <button
                id="home-portal-switcher-btn"
                onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-em-text-dim bg-em-subtle border border-em-border rounded-xl px-2.5 sm:px-3 py-2 hover:border-em-border-strong hover:text-em-text transition-colors min-h-[40px]"
                aria-expanded={portalMenuOpen}
                aria-label="Select portal"
              >
                <span className="w-2 h-2 rounded-full bg-er-green" />
                <span className="hidden sm:inline">{t('portal.select')}</span>
                <span className="sm:hidden">⚡</span>
                <ChevronDown className="w-3.5 h-3.5 text-em-text-disabled ml-0.5" />
              </button>

              <AnimatePresence>
                {portalMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPortalMenuOpen(false)} />
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-em-border rounded-2xl shadow-em-xl z-50 overflow-hidden p-1.5 space-y-0.5"
                      initial={{ opacity: 0, y: -5, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-em-text-muted uppercase tracking-widest">
                        {t('portal.select')}
                      </div>
                      {PORTAL_LINKS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setPortalMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-em-text-dim hover:bg-em-subtle hover:text-em-text transition-colors"
                        >
                          <span className="text-base">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <a href="tel:119" className="hidden sm:flex items-center gap-1.5 em-btn em-btn-red em-btn-sm" aria-label="Emergency 119">
              <Phone className="w-3.5 h-3.5" /> 119
            </a>
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-em-text-dim bg-em-subtle border border-em-border px-3.5 py-2 rounded-xl hover:bg-em-muted transition-all">
              Sign In
            </Link>
            <Link href="/citizen/sos" className="em-btn em-btn-red em-btn-sm whitespace-nowrap">
              🆘 SOS
            </Link>
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-em-subtle border border-em-border"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              className="md:hidden bg-white border-t border-em-border px-4 py-4 space-y-2"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            >
              {[
                { href: '/about', label: 'About' },
                { href: '/preparedness', label: 'Preparedness' },
                { href: '/command', label: 'Command Center' },
                { href: '/login', label: 'Sign In' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileNavOpen(false)}
                  className="block px-3 py-3 rounded-xl text-sm font-semibold text-em-text-dim hover:bg-em-subtle hover:text-em-text transition-colors">
                  {label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─ Hero Section ─ */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-white" aria-label="Hero">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(21,101,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(21,101,192,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'rgba(21,101,192,0.06)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(211,47,47,0.05)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        />

        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full relative z-10">
          {/* Left: Hero Text */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Live status badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-er-red-light border border-er-red/30 text-er-red-dark text-sm font-bold px-4 py-2 rounded-full shadow-em-sm"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-2 h-2 rounded-full bg-er-red animate-ping-slow" />
              LIVE — 1,247 Incidents Monitored Nationwide
            </motion.div>

            <div>
              <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight text-em-text">
                Predict.{' '}
                <span className="text-er-red">Respond.</span>{' '}
                Protect.
              </h1>
              <p className="text-lg text-em-text-dim mt-5 max-w-lg leading-relaxed">
                An AI-powered disaster management platform transforming citizen emergency reports into coordinated rescue and relief operations — in seconds.
              </p>
              <p className="text-sm text-er-blue font-bold mt-3 tracking-wide">
                ADRIAN — AI Disaster Response & Intelligent Assistance Network
              </p>
            </div>

            {/* CTA buttons — 56px height, touch-friendly */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/citizen/sos"
                id="hero-sos-btn"
                className="em-btn em-btn-red em-btn-lg group"
              >
                <Radio className="w-5 h-5" />
                Report Emergency
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/command"
                id="hero-command-btn"
                className="em-btn em-btn-blue em-btn-lg group"
              >
                <Map className="w-5 h-5" />
                Command Center
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-em-text-muted font-semibold">
              {['AI-Powered Analysis', 'Real-Time GIS', 'Multilingual', 'End-to-End Encrypted'].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-er-green" />
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Hero Map */}
          <motion.div
            className="h-[480px] lg:h-[560px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <HeroMapVisual />
          </motion.div>
        </div>
      </section>

      {/* ─ Live Stats Banner ─ */}
      <section className="py-16 bg-em-bg border-y border-em-border" aria-label="Live statistics">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-er-blue bg-er-blue-light border border-er-blue/20 px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-er-blue animate-pulse" /> Real-Time Platform Statistics
            </span>
            <h2 className="text-3xl font-black text-em-text">Protecting Sri Lanka, in Real-Time</h2>
          </div>
          <LiveStats />
        </div>
      </section>

      {/* ─ Portal Cards ─ */}
      <section className="py-20 bg-white" aria-label="Access portals">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-em-text">Choose Your Portal</h2>
            <p className="text-lg text-em-text-muted mt-3 max-w-xl mx-auto">
              Every role has a dedicated workspace designed for their mission.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PORTALS.map((portal, i) => (
              <motion.div
                key={portal.title}
                className={cn('em-card rounded-2xl p-6 flex flex-col gap-4 border-2', portal.color)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{portal.icon}</span>
                  <span className={cn('text-[10px] font-black px-2.5 py-1 rounded-full border', portal.badgeColor)}>
                    {portal.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-em-text">{portal.title}</h3>
                  <p className="text-xs font-semibold text-em-text-muted mt-0.5">{portal.subtitle}</p>
                  <p className="text-sm text-em-text-dim mt-2 leading-relaxed">{portal.desc}</p>
                </div>
                <Link href={portal.href} className={portal.btnColor} id={`portal-${portal.title.toLowerCase().replace(/\s+/g, '-')}-btn`}>
                  {portal.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ How It Works ─ */}
      <section className="py-20 bg-em-bg" aria-label="How ADRIAN works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-em-text">How ADRIAN Works</h2>
            <p className="text-lg text-em-text-muted mt-3">From citizen SOS to coordinated rescue — in seconds.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                {/* Connector line */}
                <div className="flex items-center justify-center mb-4 relative">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-em-border shadow-em-md flex items-center justify-center text-3xl">
                    {step.icon}
                  </div>
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute left-[calc(50%+32px)] top-1/2 w-[calc(100%-64px)] h-0.5 bg-em-muted" />
                  )}
                </div>
                <div className="text-[10px] font-black text-er-red mb-1">{step.step}</div>
                <div className="text-sm font-black text-em-text mb-1">{step.title}</div>
                <div className="text-xs text-em-text-muted leading-relaxed">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ Features Grid ─ */}
      <section className="py-20 bg-white" aria-label="Platform features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-em-text">Platform Capabilities</h2>
            <p className="text-lg text-em-text-muted mt-3 max-w-xl mx-auto">
              Built for the most demanding emergency scenarios — from individual medical incidents to large-scale natural disasters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={cn('em-card p-6 rounded-2xl border', feature.bg)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white shadow-em-sm border border-em-border', feature.color)}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black text-em-text mb-2">{feature.title}</h3>
                <p className="text-sm text-em-text-dim leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ Risk Types ─ */}
      <section className="py-20 bg-em-bg" aria-label="Emergency types monitored">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-em-text">Sri Lanka Risk Monitor</h2>
            <p className="text-lg text-em-text-muted mt-3">Current national risk levels by disaster category.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {EMERGENCY_TYPES.map((type, i) => (
              <motion.div
                key={type.label}
                className="em-card p-5 rounded-2xl text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <div className="text-sm font-black text-em-text mb-3">{type.label}</div>
                {/* Risk bar */}
                <div className="h-2 bg-em-muted rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: type.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${type.risk}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                  />
                </div>
                <div className="text-xs font-bold" style={{ color: type.color }}>{type.risk}%</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ CTA Banner ─ */}
      <section className="py-20 bg-er-red" aria-label="Call to action">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Emergency? Report It Now.
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              No account needed. Send your location, text, voice, or photo — we'll coordinate the response.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/citizen/sos" id="cta-sos-btn" className="em-btn em-btn-lg bg-white text-er-red hover:bg-er-red-light border-2 border-white font-black">
                🆘 Send SOS Now
              </Link>
              <a href="tel:119" className="em-btn em-btn-lg bg-er-red-dark text-white border-2 border-white/30 font-black hover:bg-er-red-dark hover:opacity-90">
                <Phone className="w-5 h-5" /> Call 119
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─ Footer ─ */}
      <footer className="bg-em-text py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <div className="text-white font-black text-lg">ADRIAN</div>
                <div className="text-white/50 text-xs">AI Disaster Response & Intelligent Assistance Network</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-white/60">
              <Link href="/about"        className="hover:text-white transition-colors">About</Link>
              <Link href="/preparedness" className="hover:text-white transition-colors">Preparedness</Link>
              <Link href="/command"      className="hover:text-white transition-colors">Command Center</Link>
              <Link href="/login"        className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <div className="text-xs text-white/40 text-center">
              Emergency: <a href="tel:119" className="text-white font-black hover:underline">119</a> | Disaster Management: <a href="tel:117" className="text-white font-black hover:underline">117</a>
              <br />© 2026 ADRIAN Emergency Response Network
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
