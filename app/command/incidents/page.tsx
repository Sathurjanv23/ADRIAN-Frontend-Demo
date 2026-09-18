'use client';

import { useState, useMemo, useEffect } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, Filter, AlertTriangle, Shield, MapPin, Clock, ChevronRight, CheckCircle2, User, RefreshCw, BarChart2 } from 'lucide-react';
import { cn, formatDateTime, getEmergencyTypeIcon } from '@/lib/utils';
import type { SeverityLevel, IncidentStatus, EmergencyType } from '@/types';
import { useTranslation } from '@/lib/i18n';

// Filters
const SEVERITIES: (SeverityLevel | 'all')[] = ['all', 'critical', 'high', 'medium', 'low'];
const STATUSES: (IncidentStatus | 'all')[] = ['all', 'reported', 'ai_analyzed', 'prioritized', 'assigned', 'en_route', 'responding', 'resolved'];
const TYPES: (EmergencyType | 'all')[] = ['all', 'flood', 'landslide', 'fire', 'road_accident', 'medical', 'missing_person', 'building_collapse'];

export default function IncidentsQueuePage() {
  const { incidents, fetchIncidents } = useNovaStore();
  const { t, localize, statusLabel, severityLabel, emergencyTypeLabel, timeAgo } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<EmergencyType | 'all'>('all');

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const activeIncidentsCount = useMemo(() => {
    return incidents.filter((i) => !['resolved', 'closed', 'cancelled'].includes(i.status?.toLowerCase())).length;
  }, [incidents]);

  const criticalActiveCount = useMemo(() => {
    return incidents.filter((i) => !['resolved', 'closed', 'cancelled'].includes(i.status?.toLowerCase()) && i.severity === 'critical').length;
  }, [incidents]);

  const resolvedCount = useMemo(() => {
    return incidents.filter((i) => ['resolved', 'closed'].includes(i.status?.toLowerCase())).length;
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (incident.location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus;
      const matchesType = selectedType === 'all' || incident.type === selectedType;

      return matchesSearch && matchesSeverity && matchesStatus && matchesType;
    });
  }, [incidents, searchTerm, selectedSeverity, selectedStatus, selectedType]);

  return (
    <AuthGuard allowedRoles={['officer', 'hospital', 'rescue_team', 'admin', 'citizen']} allowGuestCommander={true}>
      <div className="min-h-screen bg-em-bg">
        <TopNav role="officer" />
        <DashboardShell role="officer">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display text-nova-text">{t('heading.queue')}</h1>
                <p className="text-sm text-em-text-dim mt-0.5">{t('heading.authority_dashboard')} · Live incident tracking & triage queue</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-center px-3.5 py-2 bg-white border border-em-border rounded-xl">
                  <div className="text-[10px] text-er-blue uppercase font-bold tracking-wider">{t('stats.active_incidents')}</div>
                  <div className="text-lg font-bold text-er-blue font-mono">{activeIncidentsCount}</div>
                </div>
                <div className="text-center px-3.5 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Critical Active</div>
                  <div className="text-lg font-bold text-red-400 font-mono">{criticalActiveCount}</div>
                </div>
                <div className="text-center px-3.5 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Resolved</div>
                  <div className="text-lg font-bold text-green-400 font-mono">{resolvedCount}</div>
                </div>
                <div className="text-center px-3.5 py-2 bg-white border border-em-border rounded-xl">
                  <div className="text-[10px] text-em-text-muted uppercase font-bold tracking-wider">Total in DB</div>
                  <div className="text-lg font-bold text-nova-text font-mono">{incidents.length}</div>
                </div>
                <button
                  onClick={() => fetchIncidents()}
                  className="px-3 py-2 bg-white border border-em-border rounded-xl text-xs text-nova-text hover:border-er-blue/40 hover:text-er-blue transition-colors flex items-center gap-1.5 self-center"
                  title="Refresh incidents"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          {/* Search & Filter Bar */}
          <div className="em-card border border-em-border rounded-xl p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-em-text-muted" />
                <input
                  type="text"
                  placeholder={t('common.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-em-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/40 transition-colors"
                />
              </div>

              {/* Filters dropdown row */}
              <div className="grid grid-cols-3 gap-2 lg:w-96">
                <div>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as SeverityLevel | 'all')}
                    className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-xs text-nova-text focus:outline-none focus:border-er-blue/40"
                  >
                    <option value="all">{t('btn.filter')}: {severityLabel('critical')}/{severityLabel('low')}</option>
                    <option value="critical">🔴 {severityLabel('critical')}</option>
                    <option value="high">🟠 {severityLabel('high')}</option>
                    <option value="medium">🟡 {severityLabel('medium')}</option>
                    <option value="low">🔵 {severityLabel('low')}</option>
                  </select>
                </div>
                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus | 'all')}
                    className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-xs text-nova-text focus:outline-none focus:border-er-blue/40"
                  >
                    <option value="all">{t('btn.filter')}: {t('stats.status')}</option>
                    <option value="reported">{statusLabel('reported')}</option>
                    <option value="ai_analyzed">{statusLabel('ai_analyzed')}</option>
                    <option value="prioritized">{statusLabel('prioritized')}</option>
                    <option value="assigned">{statusLabel('assigned')}</option>
                    <option value="en_route">{statusLabel('en_route')}</option>
                    <option value="responding">{statusLabel('responding')}</option>
                    <option value="resolved">{statusLabel('resolved')}</option>
                  </select>
                </div>
                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as EmergencyType | 'all')}
                    className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-xs text-nova-text focus:outline-none focus:border-er-blue/40"
                  >
                    <option value="all">{t('btn.filter')}: Type</option>
                    <option value="flood">{emergencyTypeLabel('flood')}</option>
                    <option value="landslide">{emergencyTypeLabel('landslide')}</option>
                    <option value="fire">{emergencyTypeLabel('fire')}</option>
                    <option value="road_accident">{emergencyTypeLabel('road_accident')}</option>
                    <option value="medical">{emergencyTypeLabel('medical')}</option>
                    <option value="missing_person">{emergencyTypeLabel('missing_person')}</option>
                    <option value="building_collapse">{emergencyTypeLabel('building_collapse')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Queue List Table */}
          <div className="em-card border border-em-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-em-border bg-white/40 text-[10px] font-bold text-em-text-muted uppercase tracking-wider">
                    <th className="p-4 w-28">ID</th>
                    <th className="p-4 w-28">{severityLabel('critical')}</th>
                    <th className="p-4">{t('heading.mission_details')}</th>
                    <th className="p-4 w-44">Location</th>
                    <th className="p-4 w-36">{t('stats.status')}</th>
                    <th className="p-4 w-28">Time</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nova-border/50 text-sm">
                  <AnimatePresence initial={false}>
                    {filteredIncidents.length > 0 ? (
                      filteredIncidents.map((incident) => (
                        <motion.tr
                          key={incident.id}
                          className="hover:bg-white/20 transition-colors group cursor-pointer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td className="p-4 font-mono font-bold text-er-blue group-hover:underline">
                            {incident.id}
                          </td>
                          <td className="p-4">
                            <SeverityBadge severity={incident.severity} size="sm" pulse={incident.severity === 'critical'} />
                          </td>
                          <td className="p-4 max-w-sm">
                            <p className="font-semibold text-nova-text truncate group-hover:text-er-blue transition-colors">
                              {getEmergencyTypeIcon(incident.type)} {localize(incident.title)}
                            </p>
                            <p className="text-xs text-em-text-dim truncate mt-0.5">{localize(incident.description)}</p>
                          </td>
                          <td className="p-4 text-xs text-em-text-muted">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-er-blue flex-shrink-0" />
                              <span className="truncate">{localize(incident.location.address || incident.location.district)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase', {
                              'bg-er-blue-light border-er-blue/30 text-er-blue': incident.status === 'ai_analyzed' || incident.status === 'prioritized',
                              'bg-yellow-500/10 border-yellow-500/30 text-yellow-400': incident.status === 'assigned' || incident.status === 'en_route',
                              'bg-red-500/10 border-red-500/30 text-red-400': incident.status === 'responding',
                              'bg-green-500/10 border-green-500/30 text-green-400': incident.status === 'resolved',
                              'bg-white border-em-border text-em-text-muted': incident.status === 'reported',
                            })}>
                              {statusLabel(incident.status)}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-em-text-muted whitespace-nowrap">
                            {timeAgo(incident.reportedAt)}
                          </td>
                          <td className="p-4 text-right">
                            <ChevronRight className="w-4 h-4 text-em-text-muted group-hover:text-er-blue transition-colors" />
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-em-text-muted">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-er-green" />
                          <p className="font-semibold text-nova-text">{t('common.no_active_incidents')}</p>
                          <p className="text-xs mt-1">Try adjusting your filters or search terms</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
    </AuthGuard>
  );
}
