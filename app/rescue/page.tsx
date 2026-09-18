'use client';

import { useMemo, useEffect } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { StatCard } from '@/components/emergency/StatCard';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Navigation, Users, Package, CheckCircle, Radio, MapPin, Clock, Zap, ShieldAlert, RefreshCw, HeartPulse } from 'lucide-react';
import { cn, getTeamStatusColor, formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import type { RescueTeam, Incident } from '@/types';

import { useTranslation } from '@/lib/i18n';

export default function RescueDashboardPage() {
  const { rescueTeams, incidents, updateMissionStatus, acceptMission, currentUser, fetchTeams, fetchIncidents, loading, errors } = useNovaStore();
  const { t, localize, statusLabel } = useTranslation();

  useEffect(() => {
    fetchTeams();
    fetchIncidents();
  }, [fetchTeams, fetchIncidents]);

  const myTeam = useMemo<RescueTeam | null>(() => {
    if (currentUser?.rescueTeamId) {
      return (
        rescueTeams.find(
          (team) => team.id === currentUser.rescueTeamId
        ) ?? null
      );
    }

    return null;
  }, [rescueTeams, currentUser?.rescueTeamId]);

  const assignedIncident = incidents.find(
    (i) => (
      i.id === myTeam?.currentIncident ||
      i.trackingCode === myTeam?.currentIncident ||
      i.assignedTeamId === myTeam?.id ||
      i.assignedTeam === myTeam?.id ||
      (myTeam?.name && i.assignedTeamName === myTeam.name)
    ) && (i.status !== 'resolved' && i.status !== 'closed' && i.status !== 'cancelled')
  );

  // Available emergency dispatches for this team to accept: Priority Queue + First Come First Serve (FCFS)
  const availableDispatches = useMemo(() => {
    if (!myTeam) return [];
    const filtered = incidents.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed' || i.status === 'cancelled') return false;
      if (assignedIncident && (i.id === assignedIncident.id || i.trackingCode === assignedIncident.trackingCode)) return false;
      const isAssignedToMe = i.assignedTeamId === myTeam.id || i.assignedTeam === myTeam.id;
      if (isAssignedToMe) return false;
      const isUnassignedOrDispatched = !i.assignedTeamId || i.status === 'dispatched' || i.status === 'submitted' || i.status === 'reported';
      const isRescueType =
        i.recommendedAgencies?.includes('search_rescue') ||
        i.recommendedAgencies?.includes('fire_rescue') ||
        i.recommendedAgencies?.includes('disaster_response') ||
        ['flood', 'landslide', 'fire', 'building_collapse', 'road_accident', 'unknown', 'medical'].includes(i.type);
      return isUnassignedOrDispatched && isRescueType;
    });

    const priorityWeight: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return filtered.sort((a, b) => {
      const pA = priorityWeight[a.severity?.toLowerCase() || 'medium'] ?? 2;
      const pB = priorityWeight[b.severity?.toLowerCase() || 'medium'] ?? 2;
      if (pA !== pB) return pA - pB;
      // FCFS inside each priority tier: earliest reported incident first
      const timeA = new Date(a.reportedAt || 0).getTime();
      const timeB = new Date(b.reportedAt || 0).getTime();
      return timeA - timeB;
    });
  }, [incidents, myTeam, assignedIncident]);

  const handleStatusChange = async (status: 'available' | 'en_route' | 'on_scene') => {
    if (!myTeam) return;
    if (assignedIncident) {
      await updateMissionStatus(assignedIncident.id, status, myTeam.id);
    }
    toast.success(`Status updated: ${statusLabel(status)}`);
  };

  const handleMissionStatusTransition = async (newStatus: string) => {
    if (!myTeam || !assignedIncident) return;
    try {
      await updateMissionStatus(assignedIncident.id, newStatus, myTeam.id);
      const labels: Record<string, string> = {
        assigned: 'Mission Assigned',
        on_the_way: 'Tactical Squad On The Way',
        en_route: 'Tactical Squad On The Way',
        rescued: 'Victim Rescued',
        on_scene: 'Rescued on Scene',
        delivered_to_hospital: 'Victim Delivered to Hospital',
        completed: 'Mission Completed & Discharged',
        resolved: 'Mission Completed & Discharged',
      };
      toast.success(labels[newStatus] || `Status updated: ${newStatus}`);
    } catch (err: any) {
      toast.error('Could not update mission status', { description: err.message });
    }
  };

  const handleAcceptMission = async (incident: Incident) => {
    if (!myTeam) return;
    try {
      await acceptMission(incident.id, myTeam.id, myTeam.name);
      toast.success('பணி ஏற்றுக்கொள்ளப்பட்டது (Mission Accepted)', {
        description: `${incident.title} சம்பவத்திற்குப் புறப்படவும்.`,
      });
    } catch (err: any) {
      toast.error('Could not accept mission', { description: err.message });
    }
  };

  if (!currentUser || loading.teams || (Boolean(currentUser.rescueTeamId) && loading.incidents)) {
    return (
      <AuthGuard allowedRoles={['rescue_team']}>
        <div className="min-h-screen bg-em-bg">
          <TopNav role="rescue_team" />
          <DashboardShell role="rescue_team">
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-er-blue animate-spin" />
              <h3 className="text-base font-bold text-nova-text">Loading Squad Operations...</h3>
              <p className="text-xs text-em-text-muted">Fetching rescue teams and live dispatch queues...</p>
            </div>
          </DashboardShell>
        </div>
      </AuthGuard>
    );
  }

  if (errors.teams || (myTeam && errors.incidents)) {
    return (
      <AuthGuard allowedRoles={['rescue_team']}>
        <div className="min-h-screen bg-em-bg"><TopNav role="rescue_team" /><DashboardShell role="rescue_team"><div className="p-12 text-center"><ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" /><h3 className="text-base font-bold text-nova-text">Unable to load rescue operations</h3><p className="text-xs text-red-300 mt-2">{errors.teams || errors.incidents}</p><button type="button" onClick={() => { fetchTeams(); }} className="mt-4 px-4 py-2 bg-white text-nova-text border border-em-border rounded-xl text-xs"><RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry</button></div></DashboardShell></div>
      </AuthGuard>
    );
  }

  if (currentUser.approvalStatus !== 'APPROVED') {
    return <AuthGuard allowedRoles={['rescue_team']}><div className="min-h-screen bg-em-bg"><TopNav role="rescue_team" /><DashboardShell role="rescue_team"><div className="p-12 text-center"><ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-3" /><h3 className="text-base font-bold text-nova-text">Approval Pending</h3><p className="text-xs text-em-text-muted mt-2">Your rescue role is awaiting administrator approval.</p></div></DashboardShell></div></AuthGuard>;
  }

  if (currentUser.rescueTeamId && !myTeam) {
    return <AuthGuard allowedRoles={['rescue_team']}><div className="min-h-screen bg-em-bg"><TopNav role="rescue_team" /><DashboardShell role="rescue_team"><div className="p-12 text-center"><ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" /><h3 className="text-base font-bold text-nova-text">Linked rescue team unavailable</h3><p className="text-xs text-red-300 mt-2">The assigned team {currentUser.rescueTeamId} could not be loaded.</p></div></DashboardShell></div></AuthGuard>;
  }

  if (!myTeam) {
    return (
      <AuthGuard allowedRoles={['rescue_team']}>
        <div className="min-h-screen bg-em-bg">
          <TopNav role="rescue_team" />
          <DashboardShell role="rescue_team">
            <div className="p-6">
              <div className="em-card border border-amber-500/30 bg-amber-500/5 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4 my-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-nova-text">
                  No Rescue Team Linked
                </h3>
                <p className="text-xs text-em-text-dim leading-relaxed">
                  {`No rescue team is linked to this account (${currentUser.email}). Please contact your dispatch administrator to link your responder credentials to an active squad.`}
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fetchTeams()}
                    className="px-4 py-2 bg-white hover:bg-em-subtle text-nova-text border border-em-border font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-nova-cyan hover:bg-nova-cyan-dim text-nova-bg font-bold rounded-xl text-xs transition-all inline-block"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            </div>
          </DashboardShell>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['rescue_team']}>
      <div className="min-h-screen bg-em-bg">
        <TopNav role="rescue_team" />
        <DashboardShell role="rescue_team">
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-nova-text">{t('heading.rescue_dashboard')}</h1>
                <p className="text-sm text-em-text-dim">{localize(myTeam.name)} · {localize(myTeam.district)}</p>
              </div>
              <div className={cn('px-3 py-1.5 rounded-full text-xs font-bold border', {
                'bg-green-500/10 border-green-500/30 text-green-400': myTeam.status === 'available',
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400': myTeam.status === 'assigned',
                'bg-orange-500/10 border-orange-500/30 text-orange-400': myTeam.status === 'en_route',
                'bg-red-500/10 border-red-500/30 text-red-400': myTeam.status === 'on_scene',
              })}>
                {statusLabel(myTeam.status)}
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label={t('stats.team_members')} value={myTeam.members.length} icon={<Users className="w-4 h-4" />} variant="cyan" />
              <StatCard label={t('stats.equipment_items')} value={myTeam.equipment.length} icon={<Package className="w-4 h-4" />} />
              <StatCard label={t('stats.active_assignment')} value={myTeam.currentIncident ? 1 : 0} icon={<Activity className="w-4 h-4" />} variant={myTeam.currentIncident ? 'warning' : 'default'} />
              {myTeam.eta !== undefined && myTeam.status === 'en_route' ? (
                <StatCard label={t('stats.eta_minutes')} value={myTeam.eta} icon={<Clock className="w-4 h-4" />} variant="warning" />
              ) : (
                <StatCard label={t('stats.status')} value={statusLabel(myTeam.status)} icon={<Radio className="w-4 h-4" />} variant={myTeam.status === 'available' ? 'success' : 'warning'} animate={false} />
              )}
            </div>

            {/* Status Controls */}
            <div className="em-card border border-em-border rounded-xl p-4">
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">{t('heading.team_status')}</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { status: 'available', label: statusLabel('available'), color: 'border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20' },
                  { status: 'en_route', label: statusLabel('en_route'), color: 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20' },
                  { status: 'on_scene', label: statusLabel('on_scene'), color: 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' },
                ].map((opt) => (
                  <motion.button
                    key={opt.status}
                    onClick={() => handleStatusChange(opt.status as 'available' | 'en_route' | 'on_scene')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all',
                      opt.color,
                      myTeam.status === opt.status && 'ring-1 ring-current'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {myTeam.status === opt.status && <CheckCircle className="w-3.5 h-3.5" />}
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Assigned Incident */}
            {assignedIncident ? (
              <div className="em-card border border-red-500/25 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-red-400 mb-1">🔴 {t('heading.assigned_incidents')}</p>
                    <p className="text-xs font-mono text-em-text-muted">{assignedIncident.id}</p>
                    <h3 className="text-sm font-bold text-nova-text mt-1">{localize(assignedIncident.title)}</h3>
                  </div>
                  <SeverityBadge severity={assignedIncident.severity} pulse />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-em-text-dim">
                    <MapPin className="w-4 h-4 text-er-blue" />
                    <span>{localize(assignedIncident.location.district)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-em-text-dim">
                    <Users className="w-4 h-4 text-er-blue" />
                    <span>{assignedIncident.peopleAffected} {t('common.affected')}</span>
                  </div>
                  {assignedIncident.eta !== undefined && (
                    <div className="flex items-center gap-2 text-er-orange font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>{t('common.eta')}: {assignedIncident.eta} {t('common.min')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-em-text-dim">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>AI: {assignedIncident.aiAnalysis?.confidenceScore}%</span>
                  </div>
                </div>

                {assignedIncident.aiAnalysis?.recommendedAction && (
                  <div className="p-3 rounded-xl bg-er-blue-light border border-er-blue/30 text-xs text-em-text-dim">
                    <strong className="text-er-blue">{t('copilot.recommendation')}: </strong>
                    {localize(assignedIncident.aiAnalysis.recommendedAction)}
                  </div>
                )}

                {/* 5-Step Mission Status Lifecycle Controls */}
                <div className="mt-4 pt-3 border-t border-em-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider">
                      Update Mission Status
                    </span>
                    <span className="text-[10px] font-mono text-er-blue">
                      Current: {assignedIncident.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { key: 'assigned', label: '1. Assigned', color: 'hover:bg-blue-500/20 text-blue-300 border-blue-500/30' },
                      { key: 'on_the_way', label: '2. On The Way', color: 'hover:bg-amber-500/20 text-amber-300 border-amber-500/30' },
                      { key: 'rescued', label: '3. Rescued', color: 'hover:bg-red-500/20 text-red-300 border-red-500/30' },
                      { key: 'delivered_to_hospital', label: '4. Delivered to Hospital', color: 'hover:bg-purple-500/20 text-purple-300 border-purple-500/30' },
                      { key: 'completed', label: '5. Completed', color: 'hover:bg-green-500/20 text-green-300 border-green-500/30' },
                    ].map((step) => {
                      const isActive = assignedIncident.status === step.key ||
                        (step.key === 'on_the_way' && (assignedIncident.status === 'en_route' || assignedIncident.status === 'dispatched')) ||
                        (step.key === 'rescued' && assignedIncident.status === 'on_scene') ||
                        (step.key === 'delivered_to_hospital' && assignedIncident.status === 'transporting') ||
                        (step.key === 'completed' && assignedIncident.status === 'resolved');

                      return (
                        <button
                          key={step.key}
                          type="button"
                          onClick={() => handleMissionStatusTransition(step.key)}
                          className={cn(
                            'px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center',
                            step.color,
                            isActive
                              ? 'bg-er-blue-light border-nova-cyan text-er-blue shadow-sm'
                              : 'bg-em-subtle/50 border-em-border/60'
                          )}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href="/rescue/navigation"
                    className="flex-1 flex items-center justify-center gap-2 bg-nova-cyan text-nova-bg font-bold py-2.5 rounded-xl hover:bg-nova-cyan-dim transition-all text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate to Victim
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleMissionStatusTransition('delivered_to_hospital')}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold py-2.5 rounded-xl hover:bg-purple-500/30 transition-all text-sm"
                  >
                    <HeartPulse className="w-4 h-4" />
                    Delivered to Hospital
                  </button>
                </div>
              </div>
            ) : (
              <div className="em-card border border-em-border rounded-xl p-8 text-center">
                <CheckCircle className="w-10 h-10 text-er-green mx-auto mb-3" />
                <p className="text-base font-bold text-nova-text">{t('common.no_active_incidents')}</p>
                <p className="text-sm text-em-text-dim mt-1">{t('heading.authority_dashboard')}</p>
              </div>
            )}

            {/* Available Unassigned Emergency Dispatches Waiting for Rescue */}
            {availableDispatches.length > 0 && (
              <div className="em-card border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 space-y-4 shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <span>🚨 அவசர அழைப்புகள் & புதிய சம்பவங்கள்</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 font-mono">
                        {availableDispatches.length}
                      </span>
                    </h3>
                  </div>
                  <Link href="/rescue/incidents" className="text-xs text-er-blue hover:underline font-semibold flex items-center gap-1">
                    {t('heading.view_all')} →
                  </Link>
                </div>

                <div className="space-y-3">
                  {availableDispatches.slice(0, 4).map((inc) => (
                    <div
                      key={inc.id}
                      className="p-4 rounded-xl bg-white/80 border border-em-border hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-er-blue font-bold bg-er-blue-light px-2 py-0.5 rounded">
                            {inc.trackingCode || inc.id}
                          </span>
                          <SeverityBadge severity={inc.severity} />
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-em-subtle border border-em-border text-em-text-muted">
                            {localize(inc.type)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-nova-text">{localize(inc.title)}</h4>
                        <div className="flex items-center gap-4 text-xs text-em-text-dim flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-er-blue" />
                            {localize(inc.location?.address || inc.location?.district || 'Colombo')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-er-blue" />
                            {inc.peopleAffected} {t('common.affected')}
                          </span>
                          {inc.aiAnalysis?.confidenceScore && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Zap className="w-3.5 h-3.5" />
                              AI: {inc.aiAnalysis.confidenceScore}%
                            </span>
                          )}
                        </div>
                        {inc.aiAnalysis?.recommendedAction && (
                          <p className="text-[11px] text-em-text-muted italic line-clamp-1">
                            "{localize(inc.aiAnalysis.recommendedAction)}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptMission(inc)}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle className="w-4 h-4" />
                          பணியை ஏற்கவும் (Accept Mission)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            <div className="em-card border border-em-border rounded-xl p-4">
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">{t('heading.roster')}</p>
              <div className="space-y-2">
                {myTeam.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-em-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nova-cyan/30 to-nova-blue/30 border border-er-blue/20 flex items-center justify-center text-xs font-bold text-er-blue">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-nova-text">{member.name}</p>
                        <p className="text-[10px] text-em-text-muted">{member.role}</p>
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
                      'text-green-400 bg-green-400/10': member.status === 'active',
                      'text-yellow-400 bg-yellow-400/10': member.status === 'standby',
                      'text-em-text-muted bg-nova-border': member.status === 'off_duty',
                    })}>
                      {statusLabel(member.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="em-card border border-em-border rounded-xl p-4">
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">{t('stats.equipment_items')}</p>
              <div className="grid grid-cols-2 gap-2">
                {myTeam.equipment.map((eq, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-em-border">
                    <div>
                      <p className="text-xs font-medium text-nova-text">{eq.type}</p>
                      <p className="text-[10px] text-em-text-muted">Qty: {eq.quantity}</p>
                    </div>
                    <span className={cn('text-[10px] font-bold', {
                      'text-green-400': eq.status === 'available',
                      'text-orange-400': eq.status === 'in_use',
                      'text-red-400': eq.status === 'maintenance',
                    })}>
                      {statusLabel(eq.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardShell>
      </div>
    </AuthGuard>
  );
}
