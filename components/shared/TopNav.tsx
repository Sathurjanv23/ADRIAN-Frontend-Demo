'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useNovaStore } from '@/lib/store/nova-store';
import { signOut, getSession } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  Bell, ChevronDown, ChevronLeft, Globe, LogOut,
  AlertTriangle, Menu, X, Phone
} from 'lucide-react';
import type { UserRole } from '@/types';
import { useTranslation } from '@/lib/i18n';

// ─── ADRIAN Logo ─────────────────────────────────────────────

export function NovaLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap   = { sm: 'h-7', md: 'h-8', lg: 'h-10' };
  const textMap   = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const subMap    = { sm: 'hidden', md: 'block', lg: 'block' };

  return (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0" aria-label="ADRIAN Home">
      {/* Shield icon */}
      <div className={cn('relative flex-shrink-0', sizeMap[size])}>
        <svg viewBox="0 0 36 40" fill="none" className="h-full w-auto">
          <path
            d="M18 2L3 8.5V20C3 29.3 9.8 37.8 18 40C26.2 37.8 33 29.3 33 20V8.5L18 2Z"
            fill="#D32F2F"
            stroke="#B71C1C"
            strokeWidth="1.5"
          />
          <path
            d="M18 9L8 13.5V20C8 26.1 12.4 31.8 18 34C23.6 31.8 28 26.1 28 20V13.5L18 9Z"
            fill="white"
            fillOpacity="0.2"
          />
          <text x="18" y="25" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="Inter, sans-serif">A</text>
        </svg>
      </div>
      <div>
        <div className={cn('font-black text-em-text tracking-wide leading-none', textMap[size])}>
          ADRIAN
        </div>
        <div className={cn('text-[9px] text-em-text-muted tracking-widest uppercase font-semibold leading-none mt-0.5', subMap[size])}>
          Emergency Response Network
        </div>
      </div>
    </Link>
  );
}

// ─── Alert Ticker ─────────────────────────────────────────────

export function AlertTicker() {
  const { alerts, loading, errors } = useNovaStore();
  const { localize, t } = useTranslation();
  const activeAlerts = alerts.map((alert) => {
    let title = alert.title;
    if (!title || title.trim() === '' || title.toLowerCase() === 'notification') {
      if (alert.severity === 'critical') title = '🔴 CRITICAL EMERGENCY';
      else if (alert.severity === 'high') title = '🟠 HIGH PRIORITY';
      else title = '⚠️ EMERGENCY ALERT';
    }
    return `${title}: ${alert.message}`;
  });

  const displayList = activeAlerts.length > 0
    ? activeAlerts
    : errors.alerts
      ? [`Live alerts unavailable: ${errors.alerts}`]
      : loading.alerts
        ? ['Loading live alerts...']
        : ['✅ All operational sectors normal — No active critical emergency alerts at this time'];

  const hasActive = activeAlerts.length > 0;

  return (
    <div className={cn(
      'border-b py-1.5 overflow-hidden relative',
      hasActive
        ? 'bg-er-red-light border-er-red/30'
        : 'bg-er-blue-light border-er-blue/20'
    )}>
      <div className="flex items-center gap-3 px-4">
        <span className={cn(
          'text-[10px] font-black uppercase tracking-widest flex-shrink-0 px-2.5 py-1 rounded-full',
          hasActive
            ? 'bg-er-red text-white animate-[status-pulse_1s_ease-in-out_infinite]'
            : 'bg-er-blue text-white'
        )}>
          {hasActive ? '🔴 LIVE' : 'STATUS'}
        </span>
        <div className="ticker-wrapper flex-1">
          <div className="ticker-content">
            {[...displayList, ...displayList].map((msg, i) => (
              <span key={i} className={cn(
                'inline-flex items-center text-xs font-semibold mr-16',
                hasActive ? 'text-er-red-dark' : 'text-er-blue'
              )}>
                {localize(msg)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markNotificationRead, markAllRead, currentUser } = useNovaStore();
  const { t, localize, timeAgo } = useTranslation();
  const recent = notifications.slice(0, 8);

  const viewAllHref = currentUser
    ? currentUser.role === 'officer'
      ? '/command/alerts'
      : currentUser.role === 'rescue_team'
      ? '/rescue'
      : currentUser.role === 'hospital'
      ? '/hospital'
      : currentUser.role === 'admin'
      ? '/admin'
      : '/citizen'
    : '/login';

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(!open)}
        className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-em-subtle hover:bg-em-muted transition-colors border border-em-border"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-em-text-dim" />
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-er-red rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-em-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[99998]" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 mt-2 w-[380px] max-w-[92vw] bg-white border border-em-border rounded-2xl shadow-em-xl z-[99999] overflow-hidden"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-em-subtle border-b border-em-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-er-blue" />
                  <span className="text-sm font-bold text-em-text">{t('common.notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold bg-er-red-light text-er-red-dark border border-er-red/20 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-er-blue hover:underline font-semibold"
                  >
                    {t('common.mark_all_read')}
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-em-border/50">
                {recent.length > 0 ? (
                  recent.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={cn(
                        'w-full text-left px-4 py-3.5 hover:bg-em-subtle transition-colors flex items-start gap-3',
                        !notif.read ? 'bg-er-blue-light/40' : 'bg-transparent'
                      )}
                    >
                      <div className={cn(
                        'status-dot mt-1',
                        notif.severity === 'critical' ? 'status-critical' :
                        notif.severity === 'high'     ? 'status-en-route' :
                        notif.severity === 'medium'   ? 'bg-er-yellow' : 'status-available'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-em-text truncate">
                            {localize(notif.title)}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-er-blue flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-em-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                          {localize(notif.message)}
                        </p>
                        {notif.createdAt && (
                          <p className="text-[11px] text-em-text-disabled mt-1 font-mono">
                            {timeAgo(notif.createdAt)}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center px-4">
                    <Bell className="w-10 h-10 text-em-text-disabled mx-auto opacity-50 mb-3" />
                    <p className="text-sm font-semibold text-em-text-dim">No notifications</p>
                    <p className="text-xs text-em-text-muted mt-1">Emergency alerts will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-em-subtle border-t border-em-border flex justify-between items-center">
                <Link
                  href={viewAllHref}
                  className="text-xs text-er-blue hover:underline font-semibold"
                  onClick={() => setOpen(false)}
                >
                  {t('common.view_all_notifications')} →
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs text-em-text-muted hover:text-em-text font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Simulation Control ───────────────────────────────────────

export function SimulationControl() {
  const { simulation, startSimulation, stopSimulation } = useNovaStore();
  const { t } = useTranslation();

  return (
    <motion.button
      id="simulation-control-btn"
      onClick={simulation.isActive ? stopSimulation : startSimulation}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all',
        simulation.isActive
          ? 'bg-er-red-light border-er-red/40 text-er-red-dark hover:bg-er-red hover:text-white'
          : 'bg-er-blue-light border-er-blue/30 text-er-blue hover:bg-er-blue hover:text-white'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={simulation.isActive ? 'Stop simulation' : 'Start simulation'}
    >
      {simulation.isActive ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-sm bg-current"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          {t('btn.stop_sim')}
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-current" />
          {t('btn.start_sim')}
        </>
      )}
    </motion.button>
  );
}

// ─── Role Switcher config ─────────────────────────────────────

const ROLE_LINKS: Record<UserRole, string> = {
  citizen:      '/citizen',
  officer:      '/command',
  rescue_team:  '/rescue',
  hospital:     '/hospital',
  admin:        '/admin',
};

const ROLE_ICONS: Record<UserRole, string> = {
  citizen:      '👤',
  officer:      '🛡️',
  rescue_team:  '🚒',
  hospital:     '🏥',
  admin:        '⚙️',
};

const ROLE_COLORS: Record<UserRole, string> = {
  citizen:     'text-er-blue bg-er-blue-light border-er-blue/30',
  officer:     'text-purple-700 bg-purple-50 border-purple-300',
  rescue_team: 'text-er-orange bg-er-orange-light border-er-orange/30',
  hospital:    'text-pink-700 bg-pink-50 border-pink-300',
  admin:       'text-er-red-dark bg-er-red-light border-er-red/30',
};

// ─── Main Top Navigation Bar ──────────────────────────────────

interface TopNavProps {
  role?: UserRole;
  showTicker?: boolean;
  title?: string;
  subtitle?: string;
}

export function TopNav({ role, showTicker = true }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, currentUser, isAuthenticated, logout } = useNovaStore();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adrian_lang') as 'en' | 'ta' | 'si' | null;
      if (saved && ['en', 'ta', 'si'].includes(saved) && saved !== language) {
        setLanguage(saved);
      }
    }
  }, []);

  const effectiveUser = currentUser || (mounted ? getSession() : null);
  const effectiveName = effectiveUser?.name;
  const avatarInitials = effectiveName
    ? effectiveName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'DP';

  const userOriginalRole = effectiveUser?.role;
  const isVisitingFromOtherPortal = Boolean(
    userOriginalRole && ['hospital', 'rescue_team', 'citizen'].includes(userOriginalRole)
  );
  const isCommandSection = Boolean(role === 'officer' || pathname?.startsWith('/command'));

  const handleSignOut = () => {
    signOut();
    logout();
    setRoleMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const TRANSLATED_ROLES: Record<UserRole, string> = {
    citizen:      t('portal.citizen'),
    officer:      t('portal.command'),
    rescue_team:  t('portal.rescue'),
    hospital:     t('portal.hospital'),
    admin:        t('portal.admin'),
  };

  const LANG_OPTIONS = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ta', label: 'தமிழ்',   short: 'TA' },
    { code: 'si', label: 'සිංහල',   short: 'SI' },
  ] as const;

  const handleLanguageSelect = (code: 'en' | 'ta' | 'si') => {
    setLanguage(code);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('adrian_lang', code);
      } catch {}
    }
  };

  return (
    <header className="sticky top-0 z-[10000]" role="banner">
      {showTicker && <AlertTicker />}

      {/* Main Nav Bar */}
      <div className="sticky-header">
        <div className="flex items-center justify-between px-4 h-16 gap-2 sm:gap-3 max-w-[1600px] mx-auto">

          {/* Logo */}
          <NovaLogo size="md" />

          {/* Portal indicator pill — desktop */}
          {role && mounted && (
            <span className={cn(
              'hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
              ROLE_COLORS[role]
            )}>
              {ROLE_ICONS[role]} {TRANSLATED_ROLES[role]}
            </span>
          )}

          <div className="flex-1" />

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Emergency hotline — always visible, touch friendly */}
            <a
              href="tel:119"
              id="emergency-hotline-btn"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-er-red text-white text-xs font-bold border border-er-red-dark hover:bg-er-red-dark transition-all shadow-em-sm min-h-[40px]"
              aria-label="Emergency hotline 119"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>119</span>
            </a>

            {/* Go to Command Center (outside command) */}
            {mounted && !isCommandSection && (
              <Link
                href="/command"
                id="command-center-link"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold bg-em-subtle text-em-text-dim border border-em-border rounded-xl px-3 py-2 hover:bg-em-muted hover:text-em-text transition-all min-h-[40px]"
              >
                <Globe className="w-3.5 h-3.5" />
                {t('portal.command')}
              </Link>
            )}

            {/* Back to portal (inside command, if cross-portal) */}
            {mounted && isCommandSection && isVisitingFromOtherPortal && (
              <Link
                href={ROLE_LINKS[userOriginalRole as UserRole]}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold bg-er-blue-light text-er-blue border border-er-blue/30 rounded-xl px-3 py-2 hover:bg-er-blue hover:text-white transition-all min-h-[40px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to {TRANSLATED_ROLES[userOriginalRole as UserRole]}
              </Link>
            )}

            {/* Language switcher - desktop / tablet */}
            <div
              className="hidden sm:flex items-center gap-0.5 bg-em-subtle border border-em-border rounded-xl p-1"
              role="group"
              aria-label="Language selector"
            >
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  id={`lang-${opt.code}-btn`}
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

            {/* Notification Bell */}
            <NotificationBell />

            {/* Portal Switcher Dropdown - desktop */}
            <div className="relative hidden md:block">
              <button
                id="portal-switcher-btn"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-em-text-dim bg-em-subtle border border-em-border rounded-xl px-3 py-2 hover:border-em-border-strong hover:text-em-text transition-colors min-h-[40px]"
                aria-expanded={roleMenuOpen}
                aria-label="Switch portal"
              >
                <span className="w-2 h-2 rounded-full bg-er-green" />
                <span>{role ? TRANSLATED_ROLES[role] : t('portal.select')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-em-text-disabled ml-0.5" />
              </button>

              <AnimatePresence>
                {roleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
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
                      {Object.entries(ROLE_LINKS).map(([key, href]) => (
                        <Link
                          key={key}
                          href={href}
                          id={`portal-link-${key}`}
                          onClick={() => setRoleMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                            role === key
                              ? 'bg-er-blue-light text-er-blue'
                              : 'text-em-text-dim hover:bg-em-subtle hover:text-em-text'
                          )}
                        >
                          <span className="text-base">{ROLE_ICONS[key as UserRole]}</span>
                          {TRANSLATED_ROLES[key as UserRole]}
                        </Link>
                      ))}
                      <div className="border-t border-em-border my-1" />
                      <Link
                        href="/"
                        onClick={() => setRoleMenuOpen(false)}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-em-text-muted hover:text-em-text hover:bg-em-subtle transition-colors"
                      >
                        🏠 {t('btn.home')}
                      </Link>
                      {currentUser && isAuthenticated ? (
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-er-red hover:bg-er-red-light transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> {t('btn.sign_out')}
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setRoleMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-er-blue hover:bg-er-blue-light transition-colors"
                        >
                          🔑 {t('nav.users') || 'Sign In'}
                        </Link>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar / Sign In */}
            {currentUser && isAuthenticated ? (
              <button
                title={currentUser?.name ?? 'Profile'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-er-blue flex items-center justify-center text-white text-xs font-black cursor-pointer hover:bg-er-blue-dark transition-all flex-shrink-0 shadow-em-sm"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                aria-label={`Profile: ${currentUser?.name}`}
              >
                {avatarInitials}
              </button>
            ) : (
              <Link
                href="/login?portal=citizen"
                id="sign-in-btn"
                className="text-xs sm:text-sm font-bold bg-er-red text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-er-red-dark transition-all whitespace-nowrap shadow-em-sm min-h-[40px] flex items-center"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-em-subtle border border-em-border text-em-text-dim hover:bg-em-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden bg-white border-t border-em-border px-4 py-4 space-y-2 shadow-em-md"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Language */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-em-border">
                <span className="text-xs text-em-text-muted font-semibold mr-2">Language:</span>
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => { setLanguage(opt.code); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      language === opt.code
                        ? 'bg-er-blue text-white'
                        : 'bg-em-subtle text-em-text-muted'
                    )}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>

              {/* Portal links */}
              <div className="space-y-1">
                {Object.entries(ROLE_LINKS).map(([key, href]) => (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-em-text-dim hover:bg-em-subtle hover:text-em-text transition-colors"
                  >
                    <span className="text-lg">{ROLE_ICONS[key as UserRole]}</span>
                    {TRANSLATED_ROLES[key as UserRole]} Portal
                  </Link>
                ))}
              </div>

              {/* Sign out / sign in */}
              <div className="pt-2 border-t border-em-border">
                {currentUser && isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-bold text-er-red hover:bg-er-red-light transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-er-red text-white"
                  >
                    🔑 Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
