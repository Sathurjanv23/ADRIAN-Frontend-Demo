'use client';

import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { EmergencyCard } from '@/components/emergency/EmergencyCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Radio, ClipboardList, Shield, MapPin, Clock, ChevronRight, AlertTriangle, Phone, RefreshCw } from 'lucide-react';
import { IncidentTimeline } from '@/components/emergency/IncidentTimeline';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function CitizenDashboardPage() {
  const { incidents } = useNovaStore();
  const { t, localize } = useTranslation();
  const myReports = incidents.slice(0, 2);
  const activeReport = incidents.find((i) => i.id === 'NOV-1042');

  return (
    <AuthGuard allowedRoles={['citizen']}>
      <div className="min-h-screen bg-em-bg">
        <TopNav role="citizen" showTicker={false} />
        <DashboardShell role="citizen">
          <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">

            {/* ── SOS Quick Launch (Hero action) ── */}
            <motion.div
              className="bg-er-red rounded-2xl p-6 text-center shadow-em-red"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-white/80 text-sm font-semibold mb-2">Need help right now?</p>
              <h2 className="text-2xl font-black text-white mb-5">Send Emergency Report</h2>

              {/* SOS Button — 96px tap target */}
              <Link
                href="/citizen/sos"
                id="citizen-sos-btn"
                className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white text-er-red font-black text-2xl shadow-em-xl hover:scale-105 transition-transform sos-pulse mx-auto"
                aria-label="Send SOS emergency report"
              >
                SOS
              </Link>

              <div className="flex justify-center gap-5 mt-5 text-white/80 text-sm font-semibold">
                <span className="flex items-center gap-1">📱 Text</span>
                <span className="flex items-center gap-1">🎙️ Voice</span>
                <span className="flex items-center gap-1">📷 Photo</span>
                <span className="flex items-center gap-1">📍 GPS</span>
              </div>
            </motion.div>

            {/* ── Emergency Hotline ── */}
            <a
              href="tel:119"
              id="citizen-hotline-btn"
              className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-er-red/20 shadow-em-sm hover:border-er-red/40 hover:shadow-em-md transition-all group"
              aria-label="Call emergency hotline 119"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-er-red-light flex items-center justify-center">
                  <Phone className="w-5 h-5 text-er-red" />
                </div>
                <div>
                  <p className="font-black text-em-text">Emergency Hotline</p>
                  <p className="text-sm text-em-text-muted">Call 119 — Available 24/7</p>
                </div>
              </div>
              <div className="text-3xl font-black text-er-red group-hover:scale-105 transition-transform">119</div>
            </a>

            {/* ── Quick Actions Grid ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  href: '/citizen/report',
                  icon: <AlertTriangle className="w-6 h-6" />,
                  label: t('btn.report'),
                  bg: 'bg-er-red-light',
                  color: 'text-er-red',
                  border: 'border-er-red/20',
                  id: 'citizen-report-btn',
                },
                {
                  href: '/citizen/reports',
                  icon: <ClipboardList className="w-6 h-6" />,
                  label: t('heading.my_reports') || 'My Reports',
                  bg: 'bg-er-blue-light',
                  color: 'text-er-blue',
                  border: 'border-er-blue/20',
                  id: 'citizen-my-reports-btn',
                },
                {
                  href: '/citizen/safety',
                  icon: <Shield className="w-6 h-6" />,
                  label: t('nav.safety'),
                  bg: 'bg-er-green-light',
                  color: 'text-er-green',
                  border: 'border-er-green/20',
                  id: 'citizen-safety-btn',
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  id={action.id}
                  className={cn(
                    'flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 bg-white shadow-em-sm hover:shadow-em-md transition-all hover:scale-105 min-h-[80px] justify-center',
                    action.border
                  )}
                >
                  <span className={cn('p-2 rounded-xl', action.bg, action.color)}>
                    {action.icon}
                  </span>
                  <span className="text-xs font-bold text-em-text text-center leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* ── Active Report Tracker ── */}
            {activeReport && (
              <motion.div
                className="bg-white rounded-2xl border border-em-border shadow-em-sm overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 px-5 py-4 border-b border-em-border bg-er-blue-light">
                  <div className="w-2 h-2 rounded-full bg-er-blue animate-[status-pulse_1.5s_ease-in-out_infinite]" />
                  <h3 className="text-sm font-black text-er-blue">{t('btn.track_dispatch') || 'Track Rescue Status'}</h3>
                  <span className="ml-auto text-xs font-mono text-er-blue font-bold">{activeReport.id}</span>
                </div>
                <div className="p-5">
                  <div className="mb-4 p-4 rounded-xl bg-em-subtle border border-em-border">
                    <p className="text-sm font-semibold text-em-text">{localize(activeReport.title)}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-em-text-muted font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-er-red" />
                      <span>{localize(activeReport.location.address || activeReport.location.district)}</span>
                    </div>
                    {activeReport.eta !== undefined && (
                      <div className="flex items-center gap-2 mt-1.5 text-sm">
                        <Clock className="w-3.5 h-3.5 text-er-orange" />
                        <span className="text-er-orange font-black">
                          Team en route — ETA {activeReport.eta} min
                        </span>
                      </div>
                    )}
                  </div>
                  <IncidentTimeline
                    currentStatus={activeReport.status}
                    updates={activeReport.updates}
                    compact
                  />
                </div>
              </motion.div>
            )}

            {/* ── Weather / Flood Warning ── */}
            <div className="alert-warning rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-black mb-1">Flood Warning — Your Area</p>
                  <p className="text-sm leading-relaxed opacity-80">
                    Meteorological Department has issued a <strong>Red Alert</strong> for the Western Province.
                    Kelani River levels are above the alert threshold. Stay on higher ground.
                  </p>
                  <Link href="/citizen/safety" className="inline-flex items-center gap-1 text-sm font-bold mt-2 hover:underline">
                    View Safety Instructions <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Preparedness Tip ── */}
            <div className="bg-white rounded-2xl border border-em-border shadow-em-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <p className="text-xs font-black text-em-text-muted uppercase tracking-wider">Preparedness Tip</p>
              </div>
              <p className="text-sm text-em-text-dim leading-relaxed">
                Prepare an emergency kit: Water (1L per person per day), Food for 3 days,
                First aid kit, Flashlight, and important documents in a waterproof bag.
              </p>
              <Link
                href="/citizen/safety"
                id="citizen-safety-guide-link"
                className="inline-flex items-center gap-1 text-sm text-er-blue font-bold mt-3 hover:underline"
              >
                Full Safety Guide <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </DashboardShell>
      </div>
    </AuthGuard>
  );
}
