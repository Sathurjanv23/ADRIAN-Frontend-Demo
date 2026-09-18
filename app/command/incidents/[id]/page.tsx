'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { IncidentTimeline } from '@/components/emergency/IncidentTimeline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, MapPin, Users, Clock, ShieldAlert, Cpu, HeartPulse, Truck, Package, Phone, CheckCircle, Navigation } from 'lucide-react';
import { cn, formatDateTime, getEmergencyTypeIcon } from '@/lib/utils';
import { toast } from 'sonner';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { incidents, rescueTeams, hospitals, updateIncident, updateTeam } = useNovaStore();

  const incident = incidents.find((i) => i.id === id) || incidents[0];
  const assignedTeam = rescueTeams.find((t) => t.id === incident?.assignedTeamId || t.currentIncident === incident?.id);

  const [dispatching, setDispatching] = useState(false);
  const [resolving, setResolving] = useState(false);

  if (!incident) {
    return (
      <div className="min-h-screen bg-em-bg flex items-center justify-center">
        <p className="text-em-text-dim">Incident not found.</p>
      </div>
    );
  }

  const handleAutoAssign = async () => {
    // Find closest available team
    const availableTeam = rescueTeams.find((t) => t.status === 'available');
    if (!availableTeam) {
      toast.error('No rescue teams are currently available.');
      return;
    }

    try {
      await (await import('@/lib/api/client')).incidentsApi.assignTeam(incident.id, availableTeam.id, availableTeam.name);
      
      updateIncident(incident.id, {
        status: 'assigned',
        assignedTeamId: availableTeam.id,
        assignedTeamName: availableTeam.name,
        eta: 8,
      });

      updateTeam(availableTeam.id, {
        status: 'assigned',
        currentIncident: incident.id,
      });

      toast.success(`Assigned ${availableTeam.name} to this incident.`);
    } catch (err: any) {
      toast.error('Failed to assign team', { description: err.message });
    }
  };

  const handleDispatch = async () => {
    if (!assignedTeam) return;
    setDispatching(true);
    
    try {
      await (await import('@/lib/api/client')).incidentsApi.updateMissionStatus(incident.id, 'en_route', assignedTeam.id);
      
      updateIncident(incident.id, {
        status: 'en_route',
        updates: [
          { id: `upd-${Date.now()}`, status: 'en_route', message: `Rescue Team ${assignedTeam.name} dispatched.`, updatedBy: 'Dispatcher', updatedAt: new Date().toISOString() },
          ...incident.updates,
        ],
      });

      updateTeam(assignedTeam.id, { status: 'en_route' });
      toast.success('Rescue team dispatched.');
    } catch (err: any) {
      toast.error('Failed to dispatch team', { description: err.message });
    } finally {
      setDispatching(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    
    try {
      await (await import('@/lib/api/client')).incidentsApi.resolve(incident.id, 'Emergency fully resolved on-scene.');
      
      updateIncident(incident.id, {
        status: 'resolved',
        updates: [
          { id: `upd-${Date.now()}`, status: 'resolved', message: 'Emergency fully resolved on-scene.', updatedBy: 'On-scene Lead', updatedAt: new Date().toISOString() },
          ...incident.updates,
        ],
      });

      if (assignedTeam) {
        updateTeam(assignedTeam.id, { status: 'available', currentIncident: undefined });
      }

      toast.success('Incident status updated: RESOLVED');
      router.push('/command/incidents');
    } catch (err: any) {
      toast.error('Failed to resolve incident', { description: err.message });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="officer" />
      <DashboardShell role="officer">
        <div className="p-6 space-y-6">
          {/* Back Navigation */}
          <Link href="/command/incidents" className="flex items-center gap-2 text-xs text-em-text-muted hover:text-nova-text w-max transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Priority Queue
          </Link>

          {/* Title Area */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-em-border/60 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-er-blue">{incident.id}</span>
                <SeverityBadge severity={incident.severity} size="sm" pulse={incident.severity === 'critical'} />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold font-display text-nova-text flex items-center gap-2">
                <span>{getEmergencyTypeIcon(incident.type)}</span>
                <span>{incident.title}</span>
              </h1>
              <p className="text-xs text-em-text-dim flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-er-blue" />
                <span>{incident.location.address || incident.location.district}</span>
              </p>
            </div>

            {/* Actions Block */}
            <div className="flex gap-2">
              {incident.status === 'resolved' ? (
                <div className="flex items-center gap-2 px-4 py-2 border border-green-500/30 bg-green-500/10 rounded-xl text-green-400 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Resolved
                </div>
              ) : (
                <>
                  {!assignedTeam && (
                    <button
                      onClick={handleAutoAssign}
                      className="bg-nova-cyan text-nova-bg font-bold px-4 py-2.5 rounded-xl hover:bg-nova-cyan-dim transition-all text-sm shadow-nova flex items-center gap-1.5"
                    >
                      <Cpu className="w-4 h-4" /> Auto-Assign Team
                    </button>
                  )}
                  {assignedTeam && incident.status === 'assigned' && (
                    <button
                      onClick={handleDispatch}
                      disabled={dispatching}
                      className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-all text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" /> Dispatch Team
                    </button>
                  )}
                  {incident.status !== 'reported' && incident.status !== 'ai_analyzed' && (
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-all text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Resolved
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS — Incident specifics & AI insights */}
            <div className="xl:col-span-2 space-y-6">
              {/* Description card */}
              <div className="em-card border border-em-border rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Report Description</h3>
                <p className="text-sm text-nova-text leading-relaxed">{incident.description}</p>
                <div className="flex items-center gap-4 text-xs text-em-text-dim pt-3 border-t border-em-border">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-er-blue" />
                    <span>Reported: {formatDateTime(incident.reportedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-er-blue" />
                    <span>{incident.peopleAffected} civilians affected</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis and Triage */}
              {incident.aiAnalysis && (
                <div className="em-card border border-purple-500/25 bg-purple-500/3 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-nova-text">NOVA AI Incident Triage</h3>
                    <span className="text-xs font-mono text-purple-400 ml-auto">{incident.aiAnalysis.confidenceScore}% confidence</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-white/60 border border-em-border">
                      <p className="text-[10px] text-em-text-muted uppercase font-semibold">Severity recommendation</p>
                      <p className="text-sm font-bold text-nova-text mt-1 capitalize">{incident.aiAnalysis.severity}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 border border-em-border">
                      <p className="text-[10px] text-em-text-muted uppercase font-semibold">Detected Language</p>
                      <p className="text-sm font-bold text-nova-text mt-1 uppercase">{incident.aiAnalysis.detectedLanguage}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 border border-em-border">
                      <p className="text-[10px] text-em-text-muted uppercase font-semibold">Vulnerable Persons</p>
                      <p className="text-sm font-bold text-red-400 mt-1">
                        {incident.aiAnalysis.vulnerablePersons?.map((v) => `${v.count} ${v.type}`).join(', ') || 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-purple-500/5 border border-purple-500/15">
                    <p className="text-xs font-semibold text-purple-300">Recommended Action Plan</p>
                    <p className="text-xs text-em-text-dim mt-1.5">{incident.aiAnalysis.recommendedAction}</p>
                  </div>
                </div>
              )}

              {/* Resource Requirements */}
              <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Required Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {incident.aiAnalysis?.requiredResources.map((res, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-em-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-er-blue" />
                        <div>
                          <p className="text-xs font-bold text-nova-text">{res.type}</p>
                          <p className="text-[10px] text-em-text-muted">Quantity: {res.quantity}</p>
                        </div>
                      </div>
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase', {
                        'text-red-400 border-red-500/20 bg-red-500/5': res.priority === 'immediate',
                        'text-yellow-400 border-yellow-500/20 bg-yellow-500/5': res.priority === 'urgent',
                        'text-em-text-muted border-em-border bg-em-subtle': res.priority === 'normal',
                      })}>
                        {res.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Active Ops, Timeline, Team assignments */}
            <div className="space-y-6">
              {/* Assigned Team */}
              <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Assigned Rescue Team</h3>
                {assignedTeam ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-nova-text">{assignedTeam.name}</p>
                        <p className="text-xs text-em-text-dim mt-0.5">{assignedTeam.district} · {assignedTeam.capabilities.join(', ')}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', {
                        'bg-green-500/10 border-green-500/30 text-green-400': assignedTeam.status === 'available',
                        'bg-yellow-500/10 border-yellow-500/30 text-yellow-400': assignedTeam.status === 'assigned',
                        'bg-orange-500/10 border-orange-500/30 text-orange-400': assignedTeam.status === 'en_route',
                        'bg-red-500/10 border-red-500/30 text-red-400': assignedTeam.status === 'on_scene',
                      })}>
                        {assignedTeam.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 border border-em-border text-em-text-dim hover:text-nova-text py-2 rounded-xl text-xs font-semibold hover:border-em-border-strong transition-all">
                        <Phone className="w-3.5 h-3.5" /> Call Squad
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 bg-er-blue-light text-er-blue hover:bg-er-blue/25 py-2 rounded-xl text-xs font-semibold transition-all">
                        <Navigation className="w-3.5 h-3.5" /> Locate GPS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-em-text-dim space-y-3">
                    <p>No rescue team assigned to this incident yet.</p>
                    <button
                      onClick={handleAutoAssign}
                      className="border border-er-blue/30 text-er-blue px-4 py-2 rounded-lg font-semibold hover:bg-er-blue-light transition-colors"
                    >
                      Assign Nearest Team
                    </button>
                  </div>
                )}
              </div>

              {/* Hospital Capacity & Ambulance Routing */}
              <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Hospital Triage Routing</h3>
                <div className="space-y-2">
                  {hospitals.slice(0, 2).map((hosp) => {
                    const icuOccupiedPercent = Math.round(((hosp.icuTotal - hosp.icuAvailable) / hosp.icuTotal) * 100);
                    return (
                      <div key={hosp.id} className="p-3 rounded-lg bg-white/50 border border-em-border flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-nova-text">{hosp.name}</p>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', {
                            'bg-red-500/10 border-red-500/20 text-red-400': hosp.icuAvailable <= 2,
                            'bg-green-500/10 border-green-500/20 text-green-400': hosp.icuAvailable > 2,
                          })}>
                            {hosp.icuAvailable} ICU Beds Left
                          </span>
                        </div>
                        <div className="h-1.5 bg-nova-border rounded-full overflow-hidden">
                          <div className={cn('h-full', icuOccupiedPercent > 90 ? 'bg-red-500' : 'bg-nova-cyan')} style={{ width: `${icuOccupiedPercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Timeline */}
              <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Real-time Response Log</h3>
                <IncidentTimeline currentStatus={incident.status} updates={incident.updates} />
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
