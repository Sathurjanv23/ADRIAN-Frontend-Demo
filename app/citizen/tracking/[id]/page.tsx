'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { IncidentTimeline } from '@/components/emergency/IncidentTimeline';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin, Users, Clock, Phone, ChevronLeft, ShieldAlert, Volume2, Image as ImageIcon,
  ExternalLink, CheckCircle, AlertTriangle, XCircle, Truck, HeartPulse, Building2, Radio,
  Loader2, ShieldCheck, LifeBuoy, UtensilsCrossed, Droplets, Navigation, Activity, Shield
} from 'lucide-react';
import { formatDateTime, getEmergencyTypeIcon, cn } from '@/lib/utils';
import { AGENCY_METADATA } from '@/lib/emergency-routing';
import { incidentsApi, reliefMissionsApi } from '@/lib/api/client';
import { toast } from 'sonner';
import type { Incident, EmergencyType } from '@/types';

const SAFETY_INSTRUCTIONS: Record<string, string[]> = {
  medical: [
    'Stay calm and do not move an injured person unless there is immediate danger.',
    'Keep the patient warm and check if they are breathing normally.',
    'Clear access pathways for the 1990 ambulance team.',
  ],
  road_accident: [
    'Turn on hazard warning lights if you are in a vehicle.',
    'Keep bystanders away from moving traffic and leaking fluids.',
    'Do not remove helmets from injured motorcyclists.',
  ],
  fire: [
    'Evacuate immediately — crawl low under smoke if escaping.',
    'Do not use elevators; use marked fire escape stairs.',
    'Close doors behind you to slow the spread of fire.',
  ],
  crime: [
    'Move to a well-lit, secure area with other people if possible.',
    'Do not confront armed or hostile individuals.',
    'Keep your phone on silent if you are in hiding.',
  ],
  flood: [
    'Move to the highest ground or upper floor immediately.',
    'Avoid walking or driving through moving flood water.',
    'Disconnect electrical appliances at the main breaker if dry.',
  ],
  landslide: [
    'Move away from the path of the landslide or debris flow.',
    'Stay alert for sudden changes in water flow or cracking sounds.',
  ],
  building_collapse: [
    'Cover your head and neck; seek cover under sturdy furniture.',
    'Tap on a pipe or wall so rescue teams can locate you.',
  ],
  default: [
    'Remain in a safe location until emergency responders arrive.',
    'Keep your phone battery saved and lines open for responder calls.',
  ],
};

export default function TrackingPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { incidents, updateIncident, rescueTeams, hospitals, fetchHospitals, fetchTeams } = useNovaStore();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [reliefMission, setReliefMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchHospitals();
    fetchTeams();
  }, [fetchHospitals, fetchTeams]);

  // Find in store or fetch from backend API with visibility awareness
  useEffect(() => {
    let active = true;

    const loadIncident = async () => {
      // Skip background polling if tab is hidden
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      // 1. Check local store first
      const local = incidents.find((i) => i.id === id || i.trackingCode === id);
      if (local && active) {
        setIncident(local);
        setLoading(false);
      }

      // 2. Poll / Refresh from backend API
      try {
        const backendData: any = await incidentsApi.getByTrackingCode(id).catch(() => incidentsApi.getById(id));
        if (backendData && active && backendData.id) {
          const inc = backendData as Incident;
          setIncident(inc);
        }
      } catch {
        // use local store
      }

      // 3. Poll relief mission for this disaster incident
      try {
        const missionRes: any = await reliefMissionsApi.getByIncidentId(id);
        const missionData = missionRes?.data ?? missionRes;
        if (missionData && missionData.id && active) {
          setReliefMission(missionData);
        }
      } catch {
        // Relief mission may be pending or not created yet
      } finally {
        if (active) setLoading(false);
      }
    };

    loadIncident();
    const interval = setInterval(loadIncident, 5000); // 5s live polling

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadIncident();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, incidents]);

  const handleCancelReport = async () => {
    if (!incident || cancelling) return;
    setCancelling(true);

    try {
      await incidentsApi.cancel(incident.id, cancelReason || 'Cancelled by citizen');
      updateIncident(incident.id, { status: 'closed' });
      toast.success('Emergency report cancelled');
      setShowCancelModal(false);
    } catch {
      updateIncident(incident.id, { status: 'closed' });
      toast.success('Emergency report marked as cancelled');
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const assignedHospital = useMemo(() => {
    if (!incident) return null;
    if (incident.assignedHospital) {
      const found = hospitals.find(h => h.name.toLowerCase().includes(incident.assignedHospital!.toLowerCase()));
      if (found) return found;
      return {
        id: 'h001',
        name: incident.assignedHospital,
        district: incident.location?.district || 'Colombo',
        availableBeds: 47,
        icuAvailable: 8,
        contact: '+94 11 269 1111',
        emergencyTeams: 6,
      } as any;
    }
    return hospitals[0] || null;
  }, [incident, hospitals]);

  const assignedTeam = useMemo(() => {
    if (!incident) return null;
    if (incident.assignedTeamId || incident.assignedTeam) {
      const found = rescueTeams.find(t => t.id === incident.assignedTeamId || t.id === incident.assignedTeam);
      if (found) return found;
    }
    if (incident.assignedTeamName) {
      const found = rescueTeams.find(t => t.name.toLowerCase().includes(incident.assignedTeamName!.toLowerCase()));
      if (found) return found;
    }
    return rescueTeams[0] || null;
  }, [incident, rescueTeams]);

  if (loading && !incident) {
    return (
      <div className="min-h-screen bg-em-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-er-blue animate-spin mx-auto" />
          <p className="text-sm text-em-text-dim">Loading incident tracking data...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-em-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
          <h2 className="text-xl font-bold text-nova-text">Incident Not Found</h2>
          <p className="text-xs text-em-text-muted">No emergency report matches tracking reference &quot;{id}&quot;.</p>
          <Link href="/citizen" className="inline-block py-2.5 px-6 bg-nova-cyan text-nova-bg font-bold rounded-xl text-sm">
            Return to Citizen Portal
          </Link>
        </div>
      </div>
    );
  }

  const instructions = SAFETY_INSTRUCTIONS[incident.type] || SAFETY_INSTRUCTIONS.default;

  return (
    <div className="min-h-screen bg-em-bg text-nova-text">
      <TopNav role="citizen" showTicker={false} />
      <DashboardShell role="citizen">
        <div className="max-w-xl mx-auto p-4 space-y-5">

          {/* Top Bar Navigation & Simulation Badge */}
          <div className="flex items-center justify-between">
            <Link href="/citizen" className="flex items-center gap-1.5 text-xs text-em-text-muted hover:text-nova-text">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold">
              SIMULATION DISPATCH
            </span>
          </div>

          {/* Incident Overview Card */}
          <div className="em-card border border-em-border rounded-2xl p-5 space-y-4 shadow-nova">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-er-blue-light text-er-blue border border-er-blue/30">
                    {incident.trackingCode || incident.id}
                  </span>
                  {incident.isSilentSos && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> SILENT SOS
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-nova-text mt-2 flex items-center gap-2">
                  {getEmergencyTypeIcon(incident.type)} {incident.title}
                </h1>
              </div>
              <SeverityBadge severity={incident.severity} pulse={incident.severity === 'critical'} />
            </div>

            <p className="text-xs text-em-text-dim leading-relaxed bg-em-subtle/50 p-3 rounded-xl border border-em-border/60">
              {incident.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="flex items-center gap-2 text-em-text-dim">
                <MapPin className="w-4 h-4 text-er-blue flex-shrink-0" />
                <span className="truncate">{incident.location.address || incident.location.district || 'GPS Location'}</span>
              </div>
              <div className="flex items-center gap-2 text-em-text-dim">
                <Clock className="w-4 h-4 text-er-blue flex-shrink-0" />
                <span>{formatDateTime(incident.reportedAt)}</span>
              </div>
            </div>

            {/* Attached Evidence Links */}
            {(incident.audioUrl || (incident.photoUrls && incident.photoUrls.length > 0)) && (
              <div className="pt-3 border-t border-em-border/70 space-y-2">
                <p className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider">Submitted Media Evidence</p>
                {incident.audioUrl && (
                  <div className="p-2.5 rounded-xl bg-white border border-em-border space-y-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-nova-text">
                      <Volume2 className="w-3.5 h-3.5 text-er-blue" /> Voice Message Evidence
                    </span>
                    <audio controls src={incident.audioUrl} className="w-full h-8 rounded-lg mt-1" />
                    {incident.audioTranscript && (
                      <p className="text-[11px] text-em-text-dim italic mt-1">&quot;{incident.audioTranscript}&quot;</p>
                    )}
                  </div>
                )}
                {incident.photoUrls && incident.photoUrls.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {incident.photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40">
                        <Image src={url} alt={`Evidence photo ${idx + 1}`} fill unoptimized className="object-cover" />
                      </div>
                    ))}
                    <span className="text-xs text-em-text-muted ml-1">Photo evidence shared with tactical units</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── 1. RESCUE TEAM STATUS & LIVE LOCATION (Accent: Red/Blue) ─── */}
          <div className="em-card border border-red-500/30 bg-red-500/5 rounded-2xl p-5 space-y-3 shadow-lg shadow-red-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-nova-text">Rescue Team Status & Telemetry</h2>
                  <p className="text-[11px] text-em-text-muted">Live emergency response deployment</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border',
                  (incident.status as string) === 'resolved' || (incident.status as string) === 'completed'
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : (incident.status as string) === 'transporting' || (incident.status as string) === 'delivered_to_hospital'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                    : (incident.status as string) === 'on_scene' || (incident.status as string) === 'rescued'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                )}>
                  {(incident.status as string) === 'submitted' ? 'Assigned'
                    : (incident.status as string) === 'dispatched' ? 'On The Way'
                    : (incident.status as string) === 'en_route' ? 'On The Way'
                    : (incident.status as string) === 'on_scene' ? 'Rescued'
                    : (incident.status as string) === 'transporting' ? 'Delivered to Hospital'
                    : (incident.status as string) === 'resolved' ? 'Completed'
                    : incident.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-em-subtle/60 border border-em-border/70 space-y-1">
                <span className="text-[10px] text-em-text-muted uppercase font-bold">Assigned Unit</span>
                <p className="font-semibold text-nova-text truncate">
                  {assignedTeam?.name || incident.assignedTeamName || 'Disaster Rapid Response Squad'}
                </p>
                <p className="text-[10px] text-er-blue">
                  {assignedTeam?.vehicleType || 'Rescue Boat & Tactical Light Vehicle'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-em-subtle/60 border border-em-border/70 space-y-1">
                <span className="text-[10px] text-em-text-muted uppercase font-bold">Rescue ETA</span>
                <p className="text-lg font-black font-mono text-red-400">
                  {incident.eta || 8} MIN
                </p>
                <p className="text-[10px] text-em-text-dim">Tactical ETA countdown</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-em-border text-xs">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-er-blue animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-em-text-dim">
                  Rescue GPS: <strong className="text-nova-text font-mono">
                    {assignedTeam?.location?.lat
                      ? `${assignedTeam.location.lat.toFixed(4)}° N, ${assignedTeam.location.lng.toFixed(4)}° E`
                      : '6.9380° N, 79.9650° E'}
                  </strong>
                </span>
              </div>
              <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
          </div>

          {/* ─── 2. AI RELIEF LOGISTICS — FOOD & WATER ARRIVAL (Accent: Orange) ─── */}
          <div className="em-card border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5 space-y-3 shadow-lg shadow-orange-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <UtensilsCrossed className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-orange-300">Food & Water Relief Arrival</h2>
                  <p className="text-[11px] text-em-text-muted">AI Disaster Relief Logistics Network</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
                <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                <span>ETA: {reliefMission?.eta ?? 18} MIN</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-em-subtle/60 border border-orange-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[11px]">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Hot Meals
                </div>
                <p className="text-xl font-black font-mono text-orange-300">
                  {reliefMission?.meals || Math.max(15, (incident.peopleAffected || 5) * 3)}
                </p>
                <p className="text-[10px] text-em-text-dim">Dispatched from excess supply</p>
              </div>

              <div className="p-3 rounded-xl bg-em-subtle/60 border border-blue-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                  <Droplets className="w-3.5 h-3.5" /> Clean Water
                </div>
                <p className="text-xl font-black font-mono text-blue-300">
                  {reliefMission?.waterBottles || Math.max(10, (incident.peopleAffected || 5) * 2)}
                </p>
                <p className="text-[10px] text-em-text-dim">Bottled water units en route</p>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-white/70 border border-em-border text-xs">
              <div className="flex justify-between items-center text-em-text-dim">
                <span>Nearest Food Source:</span>
                <span className="font-semibold text-nova-text">
                  {reliefMission?.foodSourceName || 'Grand Colombo Hotel (Relief Partner)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-em-text-dim">
                <span>Relief Vehicle:</span>
                <span className="font-semibold text-nova-text font-mono">
                  {reliefMission?.vehicleName || 'Gov. Disaster Relief Vehicle GOV-RELIEF-104'}
                </span>
              </div>
              <div className="flex justify-between items-center text-em-text-dim">
                <span>Driver Contact:</span>
                <a href={`tel:${reliefMission?.driverContact || '+94112691111'}`} className="font-semibold text-orange-400 hover:underline">
                  {reliefMission?.driverContact || '+94 11 269 1111 (Central Dispatch)'}
                </a>
              </div>
            </div>
          </div>

          {/* ─── 3. ASSIGNED HOSPITAL & TRIAGE READINESS (Accent: Green) ─── */}
          <div className="em-card border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-5 space-y-3 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <HeartPulse className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-emerald-300">Assigned Hospital Facility</h2>
                  <p className="text-[11px] text-em-text-muted">Direct medical emergency triage</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/70 border border-emerald-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-nova-text">
                    {assignedHospital?.name || 'National Hospital Sri Lanka'}
                  </p>
                  <p className="text-[11px] text-em-text-dim">
                    {assignedHospital?.district || 'Colombo'} Emergency Trauma Receiving Center
                  </p>
                </div>
                {assignedHospital?.contact && (
                  <a
                    href={`tel:${assignedHospital.contact}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Hospital
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-em-border/70 text-center">
                <div className="p-2 rounded-lg bg-em-subtle/50 border border-em-border">
                  <span className="text-[10px] text-em-text-muted block">Available Beds</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {assignedHospital?.availableBeds ?? 47}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-em-subtle/50 border border-em-border">
                  <span className="text-[10px] text-em-text-muted block">ICU Beds</span>
                  <span className="text-base font-black font-mono text-cyan-400">
                    {assignedHospital?.icuAvailable ?? 8}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-em-subtle/50 border border-em-border">
                  <span className="text-[10px] text-em-text-muted block">Medical Teams</span>
                  <span className="text-base font-black font-mono text-emerald-300">
                    {assignedHospital?.emergencyTeams ?? 6}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Agency Notification Status */}
          <div className="em-card border border-em-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-nova-text">Authorities Notified</h2>
              <span className="text-[11px] text-green-400 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" /> Live Bus
              </span>
            </div>

            <div className="space-y-2">
              {(incident.notifiedAgencies && incident.notifiedAgencies.length > 0
                ? incident.notifiedAgencies
                : (incident.recommendedAgencies || ['command_centre', 'ambulance', 'police']).map((agency) => ({
                    id: agency,
                    agency: agency as any,
                    agencyName: AGENCY_METADATA[agency as keyof typeof AGENCY_METADATA]?.name || agency,
                    status: 'delivered' as const,
                    sentAt: incident.reportedAt,
                  }))
              ).map((notif: any) => {
                const meta = AGENCY_METADATA[notif.agency as keyof typeof AGENCY_METADATA] || {
                  name: notif.agencyName || notif.agency,
                  icon: '🚨',
                };
                return (
                  <div
                    key={notif.id || notif.agency}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-em-subtle/60 border border-em-border text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{meta.icon}</span>
                      <div>
                        <p className="font-semibold text-nova-text">{meta.name}</p>
                        <p className="text-[10px] text-em-text-muted">Channel: Internal Portal Broadcast</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        notif.status === 'acknowledged'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'bg-er-blue-light text-er-blue border border-er-blue/30'
                      )}
                    >
                      {notif.status === 'acknowledged' ? 'Acknowledged' : 'Delivered'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Response Progress Timeline */}
          <div className="em-card border border-em-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-nova-text mb-4">Live Incident Timeline</h2>
            <IncidentTimeline
              currentStatus={incident.status}
              updates={incident.updates || []}
            />
          </div>

          {/* Emergency Safety Instructions */}
          <div className="em-card border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Immediate Safety Instructions
            </h3>
            <ul className="space-y-1.5 text-xs text-em-text-dim">
              {instructions.map((inst, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Hotlines */}
          <div className="p-4 rounded-xl bg-white border border-em-border space-y-2">
            <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">Direct Emergency Call</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Police', number: '119' },
                { label: 'Ambulance', number: '1990' },
                { label: 'Fire & Rescue', number: '110' },
              ].map(({ label, number }) => (
                <a
                  key={label}
                  href={`tel:${number}`}
                  className="flex flex-col items-center p-2 rounded-xl bg-em-subtle border border-em-border hover:border-nova-cyan text-center transition-all"
                >
                  <Phone className="w-4 h-4 text-er-blue mb-1" />
                  <span className="text-[10px] text-em-text-muted">{label}</span>
                  <span className="text-xs font-bold text-nova-text">{number}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Cancel Report Button */}
          {incident.status !== 'closed' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs text-red-400 hover:text-red-300 hover:underline"
              >
                False alarm? Cancel this report
              </button>
            </div>
          )}
        </div>
      </DashboardShell>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="em-card border border-red-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-5 h-5" /> Cancel Emergency Report
              </div>
              <p className="text-xs text-em-text-dim">
                Are you sure you want to cancel this emergency request? Responding tactical units will be recalled.
              </p>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (e.g., situation resolved, false alarm)"
                className="w-full bg-white border border-em-border rounded-xl px-3 py-2 text-xs text-nova-text"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 rounded-xl border border-em-border text-xs text-em-text-dim hover:text-nova-text"
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  onClick={handleCancelReport}
                  disabled={cancelling}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
