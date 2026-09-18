'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion } from 'framer-motion';
import { Truck, Package, HeartPulse, Bell, Users, Clock, Shield, MapPin, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn, formatDateTime, getTeamStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

import { useTranslation } from '@/lib/i18n';

export default function CommandOperationsCatchAll() {
  const params = useParams<{ slug: string[] }>();
  const router = useRouter();
  const slug = params?.slug?.[0] || '';
  const { t, localize, statusLabel, timeAgo } = useTranslation();

  const {
    rescueTeams, resources, hospitals, alerts, notifications,
    loading, errors,
    fetchTeams, fetchResources, fetchHospitals, fetchAlerts, fetchNotifications,
    markNotificationRead, markAllRead,
    updateTeam, updateResource, updateHospital
  } = useNovaStore();

  const [filterTerm, setFilterTerm] = useState('');

  const operationalKey = slug === 'rescue' ? 'teams' : slug === 'resources' ? 'resources' : slug === 'hospitals' ? 'hospitals' : slug === 'alerts' ? 'alerts' : null;
  const operationalLoading = operationalKey ? loading[operationalKey] : false;
  const operationalError = operationalKey ? errors[operationalKey] : null;

  // Automatically fetch the active operational resource whenever slug changes or on mount
  useEffect(() => {
    if (slug === 'rescue') {
      fetchTeams();
    } else if (slug === 'resources') {
      fetchResources();
    } else if (slug === 'hospitals') {
      fetchHospitals();
    } else if (slug === 'alerts') {
      fetchAlerts();
      fetchNotifications();
    }
  }, [slug, fetchTeams, fetchResources, fetchHospitals, fetchAlerts, fetchNotifications]);

  const handleRefreshCurrent = () => {
    if (slug === 'rescue') fetchTeams();
    else if (slug === 'resources') fetchResources();
    else if (slug === 'hospitals') fetchHospitals();
    else if (slug === 'alerts') fetchAlerts();
  };

  if (operationalLoading) {
    return (
      <AuthGuard allowedRoles={['officer', 'hospital', 'rescue_team', 'admin', 'citizen']} allowGuestCommander={true}>
        <div className="min-h-screen bg-em-bg">
          <TopNav role="officer" />
          <DashboardShell role="officer">
            <div className="p-12 text-center text-em-text-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-er-blue" />
              <span>Loading operational data...</span>
            </div>
          </DashboardShell>
        </div>
      </AuthGuard>
    );
  }

  if (operationalError) {
    return (
      <AuthGuard allowedRoles={['officer', 'hospital', 'rescue_team', 'admin', 'citizen']} allowGuestCommander={true}>
        <div className="min-h-screen bg-em-bg">
          <TopNav role="officer" />
          <DashboardShell role="officer">
            <div className="p-12 text-center space-y-4">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <h2 className="text-base font-bold text-nova-text">Unable to load operational data</h2>
              <p className="text-xs text-red-300 max-w-md mx-auto">{operationalError}</p>
              <button
                onClick={handleRefreshCurrent}
                className="px-4 py-2 bg-nova-cyan text-nova-bg font-bold rounded-lg hover:bg-nova-cyan-dim transition-colors text-xs inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
              </button>
            </div>
          </DashboardShell>
        </div>
      </AuthGuard>
    );
  }

  // ─── Render Panels based on slug ─────────────────────────────

  // 1. RESCUE OPERATIONS
  const renderRescueOps = () => {
    const filteredTeams = rescueTeams.filter(t => t.name.toLowerCase().includes(filterTerm.toLowerCase()));
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
            <Truck className="w-5 h-5 text-er-blue" /> {t('heading.rescue_deployments')}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-em-text-muted">{rescueTeams.length} {t('common.active')}</span>
            <button
              onClick={fetchTeams}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white border border-em-border text-nova-text hover:border-er-blue/40 hover:text-er-blue transition-colors"
              title="Refresh Rescue Operations"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((team) => (
            <div key={team.id} className="em-card border border-em-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-nova-text">{localize(team.name)}</p>
                  <p className="text-xs text-em-text-dim mt-0.5">{localize(team.district)} · {team.capabilities.join(', ')}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase', {
                  'bg-green-500/10 border-green-500/30 text-green-400': team.status === 'available',
                  'bg-yellow-500/10 border-yellow-500/30 text-yellow-400': team.status === 'assigned',
                  'bg-orange-500/10 border-orange-500/30 text-orange-400': team.status === 'en_route',
                  'bg-red-500/10 border-red-500/30 text-red-400': team.status === 'on_scene',
                })}>
                  {statusLabel(team.status)}
                </span>
              </div>
              <div className="text-xs text-em-text-muted flex justify-between pt-2.5 border-t border-em-border">
                <span>{t('common.eta')}: {team.eta !== undefined ? `${team.eta}${t('common.min')}` : 'N/A'}</span>
                <span>Incident: {team.currentIncident || 'None'}</span>
              </div>
            </div>
          ))}
          {filteredTeams.length === 0 && <p className="text-sm text-em-text-muted py-8 text-center">No rescue deployments returned by the backend.</p>}
        </div>
      </div>
    );
  };

  // 2. RESOURCE MANAGEMENT
  const renderResources = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
            <Package className="w-5 h-5 text-er-blue" /> {t('heading.resources_inventory')}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-em-text-muted">{resources.length} {t('nav.resources')}</span>
            <button
              onClick={fetchResources}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white border border-em-border text-nova-text hover:border-er-blue/40 hover:text-er-blue transition-colors"
              title="Refresh Resources"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
        <div className="em-card border border-em-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-em-border bg-white/40 text-[10px] font-bold text-em-text-muted uppercase tracking-wider">
                  <th className="p-4">{t('nav.resources')}</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">{t('status.available')}</th>
                  <th className="p-4">{t('stats.status')}</th>
                  <th className="p-4">Low Stock Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nova-border/50 text-sm">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-white/10 transition-colors">
                    <td className="p-4 font-semibold text-nova-text">{localize(res.name)}</td>
                    <td className="p-4 text-xs text-em-text-muted capitalize">{res.category}</td>
                    <td className="p-4 font-mono text-nova-text">{res.available} {res.unit}</td>
                    <td className="p-4">
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', {
                        'bg-green-500/10 border-green-500/30 text-green-400': res.status === 'available',
                        'bg-orange-500/10 border-orange-500/30 text-orange-400': res.status === 'low_stock',
                        'bg-red-500/10 border-red-500/30 text-red-400': res.status === 'critical_stock',
                      })}>
                        {statusLabel(res.status)}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-em-text-muted">{res.lowStockThreshold} {res.unit}</td>
                  </tr>
                ))}
                {resources.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-em-text-muted">No resources returned by the backend.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 3. HOSPITALS CAPACITY
  const renderHospitals = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-er-blue" /> {t('heading.hospital_capacity')}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-em-text-muted">{hospitals.length} {t('nav.hospitals')}</span>
            <button
              onClick={fetchHospitals}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white border border-em-border text-nova-text hover:border-er-blue/40 hover:text-er-blue transition-colors"
              title="Refresh Hospital Capacity"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hosp) => {
            const occupiedPercent = Math.round(((hosp.totalBeds - hosp.availableBeds) / hosp.totalBeds) * 100);
            return (
              <div key={hosp.id} className="em-card border border-em-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-nova-text">{localize(hosp.name)}</p>
                    <p className="text-xs text-em-text-muted mt-0.5">{localize(hosp.district)}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', {
                    'bg-red-500/10 border-red-500/30 text-red-400': hosp.availableBeds < 30,
                    'bg-green-500/10 border-green-500/30 text-green-400': hosp.availableBeds >= 30,
                  })}>
                    {hosp.availableBeds} {t('stats.available_beds')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-em-text-muted">
                    <span>Bed Occupancy</span>
                    <span>{occupiedPercent}% ({hosp.totalBeds - hosp.availableBeds}/{hosp.totalBeds})</span>
                  </div>
                  <div className="h-2 bg-nova-border rounded-full overflow-hidden">
                    <div className={cn('h-full', occupiedPercent > 90 ? 'bg-red-500' : 'bg-nova-cyan')} style={{ width: `${occupiedPercent}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-2.5 border-t border-em-border text-em-text-muted">
                  <span>{t('stats.icu_available')}: <strong className="text-nova-text">{hosp.icuAvailable}/{hosp.icuTotal}</strong></span>
                  <span>Ambulance Status: <strong className="text-nova-text">{t('common.ready')}</strong></span>
                </div>
              </div>
            );
          })}
          {hospitals.length === 0 && <p className="text-sm text-em-text-muted py-8 text-center">No hospitals returned by the backend.</p>}
        </div>
      </div>
    );
  };

  // 4. LIVE ALERTS & EMERGENCY LOGS
  const renderAlerts = () => {
    // Merge backend live alerts with store notifications for a comprehensive, real-time list
    const combinedList = (() => {
      const map = new Map<string, any>();

      // 1. Add alerts from /api/alerts/live
      alerts.forEach((a) => {
        map.set(a.id, {
          id: a.id,
          title: a.title && a.title.toLowerCase() !== 'notification' ? a.title : null,
          message: a.message,
          severity: a.severity || 'medium',
          timestamp: a.timestamp || new Date().toISOString(),
          type: a.type || 'alert',
          read: false,
          relatedId: (a as any).relatedId,
        });
      });

      // 2. Merge notifications (which come from DB and have real read status & titles)
      notifications.forEach((n) => {
        const existing = map.get(n.id);
        const bestTitle = n.title && n.title.toLowerCase() !== 'notification'
          ? n.title
          : existing?.title || null;

        map.set(n.id, {
          id: n.id,
          title: bestTitle,
          message: n.message || existing?.message || '',
          severity: n.severity || existing?.severity || 'medium',
          timestamp: n.createdAt || existing?.timestamp || new Date().toISOString(),
          type: n.type || existing?.type || 'notification',
          read: n.read ?? false,
          relatedId: n.relatedId || existing?.relatedId,
        });
      });

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    })();

    const totalAlertsCount = combinedList.length;
    const unreadAlertsCount = combinedList.filter((item) => !item.read).length;
    const criticalCount = combinedList.filter((item) => item.severity === 'critical').length;

    // Smart title generator if title is missing or generic "notification"
    const getCleanAlertTitle = (item: any) => {
      if (item.title && item.title.toLowerCase() !== 'notification') {
        return item.title;
      }
      const msg = item.message || '';
      const upperMsg = msg.toUpperCase();

      if (item.relatedId) {
        return `🚨 Emergency Alert: ${item.relatedId}`;
      }
      if (upperMsg.includes('FIRE')) {
        return '🔥 Fire Emergency Alert';
      }
      if (upperMsg.includes('FLOOD')) {
        return '🌊 Flood Threat Warning';
      }
      if (upperMsg.includes('MEDICAL')) {
        return '🚑 Urgent Medical Request';
      }
      if (upperMsg.includes('LANDSLIDE')) {
        return '⚠️ Landslide Hazard Notification';
      }
      if (upperMsg.includes('MISSING PERSON') || upperMsg.includes('MISSING')) {
        return '🔍 Missing Person Advisory';
      }
      if (upperMsg.includes('ACCIDENT')) {
        return '💥 Road Accident Incident';
      }
      if (item.severity === 'critical') {
        return '🔴 Critical Priority Emergency';
      }
      if (item.severity === 'high') {
        return '🟠 High Priority Incident Alert';
      }
      return '⚠️ Emergency Operational Alert';
    };

    return (
      <div className="space-y-4">
        {/* Header & Stats Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
              <Bell className="w-5 h-5 text-er-blue" /> {t('heading.alert_logs')}
            </h2>
            <p className="text-xs text-em-text-muted mt-0.5">
              Live operational dispatches and emergency notifications from field teams
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadAlertsCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] px-2.5 py-1 rounded-md bg-er-blue-light border border-er-blue/30 text-er-blue hover:bg-er-blue-light transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={() => {
                fetchAlerts();
                fetchNotifications();
              }}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white border border-em-border text-nova-text hover:border-er-blue/40 hover:text-er-blue transition-colors"
              title="Refresh Live Alerts"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Real Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="em-card border border-em-border rounded-xl p-3 bg-white/30">
            <p className="text-[11px] text-em-text-muted">Total Alerts</p>
            <p className="text-xl font-mono font-bold text-nova-text mt-0.5">{totalAlertsCount}</p>
          </div>
          <div className="em-card border border-em-border rounded-xl p-3 bg-white/30">
            <p className="text-[11px] text-em-text-muted">Unread Active</p>
            <p className="text-xl font-mono font-bold text-er-blue mt-0.5">{unreadAlertsCount}</p>
          </div>
          <div className="em-card border border-em-border rounded-xl p-3 bg-white/30">
            <p className="text-[11px] text-em-text-muted">Critical Priority</p>
            <p className="text-xl font-mono font-bold text-red-400 mt-0.5">{criticalCount}</p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="em-card border border-em-border rounded-xl divide-y divide-nova-border/50 overflow-hidden">
          {combinedList.map((item) => {
            const cleanTitle = getCleanAlertTitle(item);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) markNotificationRead(item.id);
                }}
                className={cn(
                  'p-4 flex items-start gap-3.5 transition-colors cursor-pointer',
                  !item.read ? 'bg-er-blue-light[0.03] hover:bg-er-blue-light[0.06]' : 'hover:bg-white/20 opacity-80 hover:opacity-100'
                )}
              >
                <div className="mt-1 flex-shrink-0">
                  {item.severity === 'critical' ? (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  ) : item.severity === 'high' ? (
                    <span className="inline-flex rounded-full h-3 w-3 bg-orange-400"></span>
                  ) : (
                    <span className="inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-nova-text flex items-center gap-2">
                      {localize(cleanTitle)}
                      {item.relatedId && (
                        <span className="font-mono text-[10px] font-normal px-1.5 py-0.5 rounded bg-em-subtle border border-em-border text-er-blue">
                          {item.relatedId}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                          item.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : item.severity === 'high'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        )}
                      >
                        {item.severity}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-nova-cyan flex-shrink-0" title="Unread" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-em-text-dim mt-1 leading-relaxed">
                    {localize(item.message)}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-em-text-muted">
                    <span>{timeAgo(item.timestamp)}</span>
                    <span>•</span>
                    <span className="capitalize">{item.type?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {combinedList.length === 0 && (
            <p className="p-8 text-center text-sm text-em-text-muted">
              No live alerts or notifications currently in system.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['officer', 'hospital', 'rescue_team', 'admin', 'citizen']} allowGuestCommander={true}>
      <div className="min-h-screen bg-em-bg">
        <TopNav role="officer" />
        <DashboardShell role="officer">
          <div className="p-6 space-y-6">
            {slug === 'rescue' && renderRescueOps()}
            {slug === 'resources' && renderResources()}
            {slug === 'hospitals' && renderHospitals()}
            {slug === 'alerts' && renderAlerts()}
            {!['rescue', 'resources', 'hospitals', 'alerts'].includes(slug) && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-er-blue mx-auto mb-3" />
                <p className="text-lg font-bold text-nova-text">Operational View Not Found</p>
                <p className="text-sm text-em-text-muted mt-1">This module is under development or has been relocated.</p>
                <button onClick={() => router.push('/command')} className="mt-4 px-4 py-2 bg-nova-cyan text-nova-bg font-bold rounded-lg hover:bg-nova-cyan-dim transition-colors text-sm">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </DashboardShell>
      </div>
    </AuthGuard>
  );
}
