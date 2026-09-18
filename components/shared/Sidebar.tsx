'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Map, AlertTriangle, Brain, BarChart3, Users,
  Truck, Building2, Cpu, Bell, FileText, Activity, Shield,
  Settings, ClipboardList, HeartPulse, Package, Radio, UserCheck,
  Navigation, Waves, ChevronLeft, ChevronRight, UtensilsCrossed,
  Menu, X, MessageCircle, Bot
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { UserRole } from '@/types';
import { useTranslation } from '@/lib/i18n';
import { useNovaStore } from '@/lib/store/nova-store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'critical' | 'blue' | 'warning';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface BadgeCounts {
  officerIncidents: number;
  officerAlerts: number;
  rescueIncidents: number;
  hospitalEmergencies: number;
}

function getNavSections(role: UserRole, badges: BadgeCounts, t: (k: string) => string): NavSection[] {
  switch (role) {
    case 'officer':
      return [
        {
          title: t('section.command_center') || 'Command Center',
          items: [
            { href: '/command',           label: t('nav.dashboard') || 'Dashboard',   icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: '/command/map',       label: t('nav.map') || 'Live Map',    icon: <Map className="w-4 h-4" /> },
            {
              href: '/command/incidents', label: t('nav.incidents') || 'Incidents',   icon: <AlertTriangle className="w-4 h-4" />,
              badge: badges.officerIncidents > 0 ? badges.officerIncidents : undefined,
              badgeVariant: 'critical',
            },
            { href: '/command/ai-analysis', label: t('nav.ai_analysis') || 'AI Analysis', icon: <Brain className="w-4 h-4" /> },
          ],
        },
        {
          title: t('section.operations') || 'Operations',
          items: [
            { href: '/command/prediction', label: t('nav.prediction') || 'Prediction',  icon: <Waves className="w-4 h-4" /> },
            { href: '/command/rescue',     label: t('nav.rescue_ops') || 'Rescue Ops',  icon: <Truck className="w-4 h-4" /> },
            { href: '/command/resources',  label: t('nav.resources') || 'Resources',   icon: <Package className="w-4 h-4" /> },
            { href: '/command/hospitals',  label: t('nav.hospitals') || 'Hospitals',   icon: <HeartPulse className="w-4 h-4" /> },
          ],
        },
        {
          title: t('section.intelligence') || 'Intelligence',
          items: [
            { href: '/command/copilot',   label: t('nav.copilot') || 'AI Copilot',  icon: <Cpu className="w-4 h-4" /> },
            {
              href: '/command/alerts',    label: t('nav.alerts') || 'Alerts',       icon: <Bell className="w-4 h-4" />,
              badge: badges.officerAlerts > 0 ? badges.officerAlerts : undefined,
              badgeVariant: 'critical',
            },
            { href: '/command/analytics', label: t('nav.analytics') || 'Analytics',   icon: <BarChart3 className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Relief Logistics',
          items: [
            { href: '/relief',              label: 'Relief Dashboard', icon: <UtensilsCrossed className="w-4 h-4" /> },
            { href: '/relief/food-sources', label: 'Food Sources',     icon: <Package className="w-4 h-4" /> },
            { href: '/relief/missions',     label: 'Missions',         icon: <Truck className="w-4 h-4" /> },
          ],
        },
      ];

    case 'citizen':
      return [
        {
          items: [
            { href: '/citizen',          label: t('nav.dashboard') || 'Dashboard',       icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: '/citizen/report',   label: t('btn.submit_report') || 'Report Emergency', icon: <AlertTriangle className="w-4 h-4" /> },
            { href: '/citizen/sos',      label: t('nav.sos') || 'SOS',             icon: <Radio className="w-4 h-4" /> },
            { href: '/citizen/reports',  label: t('nav.reports') || 'My Reports',      icon: <ClipboardList className="w-4 h-4" /> },
            { href: '/citizen/safety',   label: t('nav.safety') || 'Safety Guide',    icon: <Shield className="w-4 h-4" /> },
            { href: '/command/ai-analysis', label: t('nav.ai_analysis') || 'AI Analysis', icon: <MessageCircle className="w-4 h-4" /> },
          ],
        },
      ];

    case 'rescue_team':
      return [
        {
          items: [
            { href: '/rescue',           label: t('nav.dashboard') || 'Dashboard',       icon: <LayoutDashboard className="w-4 h-4" /> },
            {
              href: '/rescue/incidents', label: t('heading.assigned_incidents') || 'Assigned Incidents', icon: <AlertTriangle className="w-4 h-4" />,
              badge: badges.rescueIncidents > 0 ? badges.rescueIncidents : undefined,
              badgeVariant: 'critical',
            },
            { href: '/rescue/navigation', label: t('nav.navigation') || 'Navigation',    icon: <Navigation className="w-4 h-4" /> },
            { href: '/rescue/team',       label: t('nav.team_status') || 'Team Status',   icon: <Users className="w-4 h-4" /> },
            { href: '/relief/missions',   label: 'Relief Missions', icon: <Truck className="w-4 h-4" /> },
            { href: '/command/ai-analysis', label: t('nav.ai_analysis') || 'AI Analysis', icon: <MessageCircle className="w-4 h-4" /> },
          ],
        },
      ];

    case 'hospital':
      return [
        {
          items: [
            { href: '/hospital',              label: t('nav.dashboard') || 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: '/hospital/triage',      label: t('nav.triage') || 'Triage Queue',  icon: <ClipboardList className="w-4 h-4" /> },
            { href: '/hospital/ambulances',  label: t('nav.ambulances') || 'Ambulances',     icon: <Truck className="w-4 h-4" /> },
            { href: '/command/ai-analysis',  label: t('nav.ai_analysis') || 'AI Analysis', icon: <MessageCircle className="w-4 h-4" /> },
          ],
        },
      ];

    case 'admin':
      return [
        {
          title: t('section.system') || 'System',
          items: [
            { href: '/admin',               label: t('nav.dashboard') || 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: '/admin/users',         label: t('nav.users') || 'Users',        icon: <Users className="w-4 h-4" /> },
            { href: '/admin/organizations', label: t('nav.organizations') || 'Organizations', icon: <Building2 className="w-4 h-4" /> },
          ],
        },
        {
          title: t('section.configuration') || 'Configuration',
          items: [
            { href: '/admin/resources',   label: t('nav.resources') || 'Resources',  icon: <Package className="w-4 h-4" /> },
            { href: '/admin/ai-config',   label: t('nav.ai_config') || 'AI Config',  icon: <Cpu className="w-4 h-4" /> },
            { href: '/admin/monitoring',  label: t('nav.monitoring') || 'Monitoring', icon: <Activity className="w-4 h-4" /> },
            { href: '/admin/audit-logs',  label: t('nav.audit_logs') || 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
            { href: '/command/ai-analysis', label: t('nav.ai_analysis') || 'AI Analysis', icon: <MessageCircle className="w-4 h-4" /> },
          ],
        },
      ];

    default:
      return [];
  }
}

// ── Role display config ───────────────────────────────────────

export interface RoleTheme {
  icon: string;
  badgeClass: string;
  label: string;
  accentHex: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  activeIcon: string;
  activeIndicator: string; // The side bar color
}

export const ROLE_THEME: Record<UserRole, RoleTheme> = {
  citizen: {
    icon: '👤',
    badgeClass: 'text-er-blue bg-er-blue-light border-er-blue/30',
    label: 'CITIZEN',
    accentHex: '#1565C0',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-900',
    activeBorder: 'border-blue-200',
    activeIcon: 'text-blue-600',
    activeIndicator: 'bg-blue-600',
  },
  officer: {
    icon: '🛡️',
    badgeClass: 'text-purple-700 bg-purple-50 border-purple-300',
    label: 'OFFICER',
    accentHex: '#7C3AED',
    activeBg: 'bg-purple-50',
    activeText: 'text-purple-900',
    activeBorder: 'border-purple-200',
    activeIcon: 'text-purple-600',
    activeIndicator: 'bg-purple-600',
  },
  rescue_team: {
    icon: '🚒',
    badgeClass: 'text-er-orange bg-er-orange-light border-er-orange/30',
    label: 'RESCUE',
    accentHex: '#F57C00',
    activeBg: 'bg-orange-50',
    activeText: 'text-orange-900',
    activeBorder: 'border-orange-200',
    activeIcon: 'text-orange-600',
    activeIndicator: 'bg-orange-500',
  },
  hospital: {
    icon: '🏥',
    badgeClass: 'text-pink-700 bg-pink-50 border-pink-300',
    label: 'HOSPITAL',
    accentHex: '#BE185D',
    activeBg: 'bg-pink-50',
    activeText: 'text-pink-900',
    activeBorder: 'border-pink-200',
    activeIcon: 'text-pink-600',
    activeIndicator: 'bg-pink-600',
  },
  admin: {
    icon: '⚙️',
    badgeClass: 'text-er-red-dark bg-er-red-light border-er-red/30',
    label: 'ADMIN',
    accentHex: '#D32F2F',
    activeBg: 'bg-red-50',
    activeText: 'text-red-900',
    activeBorder: 'border-red-200',
    activeIcon: 'text-red-600',
    activeIndicator: 'bg-red-600',
  },
};

// Root dashboard paths that require exact match to prevent greedy prefix highlighting
const ROOT_PATHS = new Set(['/command', '/citizen', '/rescue', '/hospital', '/admin', '/relief']);

function isItemActive(pathname: string | null, itemHref: string): boolean {
  if (!pathname) return false;
  if (pathname === itemHref) return true;
  // If item is a root section dashboard, only highlight if exactly matched
  if (ROOT_PATHS.has(itemHref)) return false;
  // For subroutes (e.g. /command/incidents), match child routes like /command/incidents/123
  return pathname.startsWith(`${itemHref}/`) || pathname.startsWith(`${itemHref}?`);
}

// ── Sidebar Component ─────────────────────────────────────────

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
}

export function Sidebar({ role, collapsed = false, onToggle, onNavigate, isMobileDrawer = false }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { incidents, notifications, unreadCount, rescueTeams, currentUser, isAuthenticated } = useNovaStore();
  const isCitizenGuest = role === 'citizen' && (!isAuthenticated || currentUser?.role !== 'citizen');

  const badges: BadgeCounts = useMemo(() => {
    const officerIncidents = incidents.filter(
      (i) => i.status !== 'resolved' && i.status !== 'closed' && i.status !== 'cancelled'
    ).length;
    const officerAlerts = unreadCount || notifications.filter((n) => !n.read).length;

    const myTeam = rescueTeams.find((t) => t.id === 'RT-ALPHA-02') || rescueTeams[0];
    const rescueIncidents = incidents.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed' || i.status === 'cancelled') return false;
      const isAssignedToMe = i.assignedTeamId === myTeam?.id || i.assignedTeam === myTeam?.id;
      const isAvailableForRescue =
        !i.assignedTeamId &&
        (i.recommendedAgencies?.includes('search_rescue') ||
          i.recommendedAgencies?.includes('fire_rescue') ||
          i.recommendedAgencies?.includes('disaster_response') ||
          ['flood', 'landslide', 'fire', 'building_collapse', 'road_accident', 'unknown'].includes(i.type));
      return isAssignedToMe || isAvailableForRescue;
    }).length;

    const hospitalEmergencies = incidents.filter(
      (i) =>
        (i.type === 'medical' || i.type === 'road_accident' || i.type === 'building_collapse' || i.type === 'fire') &&
        i.status !== 'resolved' &&
        i.status !== 'closed' &&
        i.status !== 'cancelled'
    ).length;

    return { officerIncidents, officerAlerts, rescueIncidents, hospitalEmergencies };
  }, [incidents, notifications, unreadCount, rescueTeams]);

  const sections = getNavSections(role, badges, t);

  if (isCitizenGuest && sections[0]?.items) {
    sections[0].items = sections[0].items.map((it) => {
      if (it.href === '/citizen' || it.href === '/citizen/reports') {
        return { ...it, badge: '🔒', badgeVariant: 'warning' as const };
      }
      if (it.href === '/citizen/sos') {
        return { ...it, badge: 'OPEN', badgeVariant: 'critical' as const };
      }
      return it;
    });
  }

  const roleMeta = ROLE_THEME[role] || ROLE_THEME.citizen;
  const userOriginalRole = currentUser?.role;
  const isVisitingCommand = role === 'officer' && Boolean(
    userOriginalRole && ['hospital', 'rescue_team'].includes(userOriginalRole)
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-em-border h-full transition-all duration-300 shadow-em-sm',
        isMobileDrawer ? 'w-full' : collapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Navigation sidebar"
    >
      {/* Role Badge */}
      {(!collapsed || isMobileDrawer) && (
        <div className="px-4 py-3 border-b border-em-border">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border',
            isCitizenGuest ? 'text-er-orange bg-er-orange-light border-er-orange/30' : roleMeta.badgeClass
          )}>
            {!isCitizenGuest && <span>{roleMeta.icon}</span>}
            {isCitizenGuest ? '👋 GUEST REPORTING' : `${roleMeta.label} PORTAL`}
          </span>
          {isCitizenGuest && (
            <Link
              href="/login?portal=citizen"
              onClick={() => { if (onNavigate) onNavigate(); }}
              className="block mt-2 text-xs text-er-blue hover:underline font-bold"
            >
              Sign in to save reports →
            </Link>
          )}
        </div>
      )}

      {/* Back to original portal banner */}
      {(!collapsed || isMobileDrawer) && isVisitingCommand && (
        <div className="px-3 py-2.5 bg-er-blue-light border-b border-er-blue/20 flex items-center justify-between">
          <Link
            href={userOriginalRole === 'hospital' ? '/hospital' : '/rescue'}
            onClick={() => { if (onNavigate) onNavigate(); }}
            className="flex items-center gap-1 text-xs font-bold text-er-blue hover:underline"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to {userOriginalRole === 'hospital' ? 'Hospital' : 'Rescue'}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Portal navigation">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-5">
            {section.title && (!collapsed || isMobileDrawer) && (
              <p className="text-[10px] font-black text-em-text-disabled uppercase tracking-widest px-3 mb-2">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isItemActive(pathname, item.href);
                const isSOS = item.href === '/citizen/sos';

                // Determine active styling based on portal role theme or emergency SOS
                const activeClasses = isSOS
                  ? 'bg-er-red-light text-er-red-dark border-er-red/30 font-bold shadow-xs'
                  : cn(roleMeta.activeBg, roleMeta.activeText, roleMeta.activeBorder, 'border font-bold shadow-xs');
                const iconActiveClass = isSOS ? 'text-er-red' : roleMeta.activeIcon;
                const sideIndicatorColor = isSOS ? 'bg-er-red' : roleMeta.activeIndicator;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { if (onNavigate) onNavigate(); }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative min-h-[44px]',
                      isActive
                        ? activeClasses
                        : 'text-em-text-dim hover:bg-em-subtle hover:text-em-text border border-transparent'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive ? iconActiveClass : 'text-em-text-muted group-hover:text-em-text'
                    )}>
                      {item.icon}
                    </span>
                    {(!collapsed || isMobileDrawer) && (
                      <>
                        <span className="flex-1 text-[13px]">{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            'text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0',
                            item.badgeVariant === 'critical' ? 'bg-er-red text-white' :
                            item.badgeVariant === 'warning'  ? 'bg-er-orange text-white' :
                            'bg-er-blue text-white'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isActive && (
                      <motion.div
                        className={cn(
                          'absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full shadow-xs',
                          sideIndicatorColor
                        )}
                        layoutId={`sidebar-indicator-${role}`}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      {!isMobileDrawer && (
        <div className="border-t border-em-border p-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center h-10 rounded-xl hover:bg-em-subtle text-em-text-muted hover:text-em-text transition-colors border border-transparent hover:border-em-border"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>
      )}
    </aside>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const roleMeta = ROLE_THEME[role] || ROLE_THEME.citizen;

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] overflow-hidden relative">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer (Slide from left) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col lg:hidden border-r border-em-border"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-em-border bg-em-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{roleMeta.icon}</span>
                  <div>
                    <span className="text-sm font-black text-em-text block">{roleMeta.label} PORTAL</span>
                    <span className="text-[10px] text-em-text-muted font-semibold">Navigation Menu</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-em-border text-em-text-dim hover:text-em-text transition-colors shadow-em-xs"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  role={role}
                  collapsed={false}
                  onNavigate={() => setMobileDrawerOpen(false)}
                  isMobileDrawer
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Mobile Portal Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-em-border sticky top-0 z-20 shadow-em-xs">
          <button
            id="mobile-portal-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-em-text bg-em-subtle border border-em-border px-3 py-2 rounded-xl hover:bg-em-muted transition-colors min-h-[40px] shadow-em-xs"
            aria-label="Open portal navigation"
            aria-expanded={mobileDrawerOpen}
          >
            <Menu className={cn('w-4 h-4', roleMeta.activeIcon)} />
            <span>{roleMeta.label} MENU</span>
          </button>
          <div className="flex items-center gap-2">
            <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-lg border', roleMeta.badgeClass)}>
              {roleMeta.icon} {roleMeta.label}
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-em-bg" role="main">
          {children}
        </main>
      </div>

      {/* Floating ADRIAN Copilot button — jump straight to AI Analysis */}
      {pathname !== '/command/ai-analysis' && (
        <Link
          href="/command/ai-analysis"
          aria-label="Open ADRIAN Copilot"
          title="ADRIAN Copilot"
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Bot className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
