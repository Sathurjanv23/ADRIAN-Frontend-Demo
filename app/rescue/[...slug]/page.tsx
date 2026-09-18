'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore, ApiError } from '@/lib/store/nova-store';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Users, MapPin, AlertTriangle, Navigation, Clock, CheckCircle,
  ArrowRight, Play, Volume2, Camera, ShieldCheck, CheckCheck, Eye, RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { cn, formatDateTime, getEmergencyTypeIcon, resolveMediaUrl } from '@/lib/utils';
import { calculateDistanceKm, calculateEtaMinutes } from '@/lib/emergency-routing';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import type { Incident, IncidentStatus, RescueTeam } from '@/types';
import dynamic from 'next/dynamic';

const LazyEmergencyMap = dynamic(
  () => import('@/components/map/EmergencyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#070b14] flex flex-col items-center justify-center text-xs text-er-blue space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-er-blue-light border border-er-blue/40 animate-spin" />
        <p className="font-semibold tracking-wider">LOADING MISSION GPS ROUTING...</p>
      </div>
    ),
  }
);

export default function RescueOperationsCatchAll() {
  const params = useParams<{ slug: string[] }>();
  const router = useRouter();
  const slug = params?.slug?.[0] || 'incidents';
  const { t, localize, timeAgo, statusLabel } = useTranslation();

  const { rescueTeams, incidents, acceptMission, updateMissionStatus, currentUser, fetchIncidents, fetchTeams, loading, errors } = useNovaStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Live-fetched incident from backend — guarantees per-incident media isolation
  const [liveIncident, setLiveIncident] = useState<Incident | null>(null);
  const [fetchingLiveIncident, setFetchingLiveIncident] = useState(false);

  // Synchronous request lock — prevents double-click from firing two POSTs
  const acceptLockRef = useRef<boolean>(false);
  const statusLockRef = useRef<boolean>(false);

  // Derive the active rescue team from the authenticated user.
  // Strictly typed as RescueTeam | null. No unsafe fake fallback objects.
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

  // Active accepted mission — strictly matched by currentIncident ID first, then by assignedTeamId
  const activeMission = useMemo(() => {
    if (!myTeam) return undefined;

    const ongoingStatuses = ['acknowledged', 'assigned', 'en_route', 'on_scene', 'transporting', 'responding'];

    // Priority 1: Match by the exact currentIncident tracking code or ID the team accepted
    if (myTeam.currentIncident) {
      const byCurrentIncident = incidents.find(
        (inc) =>
          (inc.id === myTeam.currentIncident || inc.trackingCode === myTeam.currentIncident) &&
          ongoingStatuses.includes(inc.status)
      );
      if (byCurrentIncident) return byCurrentIncident;
    }

    // Priority 2: Fallback — match by assignedTeamId (only if team has no currentIncident set)
    if (!myTeam.currentIncident) {
      return incidents.find(
        (inc) =>
          (inc.assignedTeamId === myTeam.id || inc.assignedTeam === myTeam.id) &&
          ongoingStatuses.includes(inc.status)
      );
    }

    return undefined;
  }, [incidents, myTeam]);

  // Demo mode: the "live" incident is just looked up from the local store —
  // it's already the single source of truth, so there's nothing to fetch.
  useEffect(() => {
    if (!activeMission?.id && !myTeam?.currentIncident) return;
    const incidentId = myTeam?.currentIncident || activeMission?.id;
    if (!incidentId) return;

    let cancelled = false;

    const fetchLive = async () => {
      setFetchingLiveIncident(true);
      try {
        const data = incidents.find((i) => i.id === incidentId || i.trackingCode === incidentId);
        if (!cancelled && data?.id) {
          setLiveIncident(data);
        }
      } finally {
        if (!cancelled) setFetchingLiveIncident(false);
      }
    };

    fetchLive();
    // Re-check every 30s in case the store updates (mirrors the original polling cadence)
    const interval = setInterval(fetchLive, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeMission?.id, myTeam?.currentIncident, incidents]);

  // Assigned/Available rescue incidents list guarded by non-null myTeam
  const rescueIncidents = useMemo(() => {
    if (!myTeam) {
      return [];
    }

    return incidents.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed' || i.status === 'cancelled') return false;
      const isAssignedToMe = i.assignedTeamId === myTeam.id || i.assignedTeam === myTeam.id;
      const isAvailableForRescue = !i.assignedTeamId && (
        i.recommendedAgencies?.includes('search_rescue') ||
        i.recommendedAgencies?.includes('fire_rescue') ||
        i.recommendedAgencies?.includes('disaster_response') ||
        ['flood', 'landslide', 'fire', 'building_collapse', 'road_accident', 'unknown', 'medical'].includes(i.type)
      );
      return isAssignedToMe || isAvailableForRescue;
    });
  }, [incidents, myTeam]);

  // Handle Accept Mission
  const handleAcceptMission = async (incident: Incident) => {
    if (!myTeam) {
      toast.error('No rescue team is linked to this account.');
      return;
    }
    // Synchronous lock check — prevents a rapid double-click from sending two POSTs
    if (acceptLockRef.current) return;
    acceptLockRef.current = true;
    setAcceptingId(incident.id);
    try {
      await acceptMission(incident.id, myTeam.id, myTeam.name);
      toast.success(`Mission Accepted!`, {
        description: `Navigating to ${incident.title}...`,
      });
      router.push('/rescue/navigation');
    } catch (err: any) {
      // Determine if this is an expected business conflict (409) or an unexpected failure
      const isApiError = err instanceof ApiError;
      const status = isApiError ? err.status : null;
      const code = isApiError ? err.code : null;

      if (status === 409) {
        // Expected conflict — show as warning, not crash
        if (code === 'INCIDENT_ALREADY_ASSIGNED') {
          toast.warning('Mission Already Assigned', {
            description: err.message || 'This mission has been assigned to another team.',
          });
        } else if (code === 'TEAM_BUSY') {
          toast.warning('Team Busy', {
            description: err.message || 'Your team is already on another active mission.',
          });
        } else if (code === 'INVALID_STATUS_TRANSITION') {
          toast.warning('Invalid Mission State', {
            description: err.message || 'This mission cannot be accepted in its current state.',
          });
        } else {
          toast.warning('Mission Conflict', {
            description: err.message || 'Mission state has changed. Refreshing...',
          });
        }
        // Refresh server state to clear stale frontend data
        await Promise.allSettled([fetchIncidents(), fetchTeams()]);
      } else {
        // Unexpected failure
        toast.error('Could not accept mission', {
          description: err.message || 'Mission acceptance failed. The mission status was not changed.',
        });
      }
    } finally {
      acceptLockRef.current = false;
      setAcceptingId(null);
    }
  };

  // Handle Status Update (en_route -> on_scene -> transporting -> resolved)
  const handleStatusTransition = async (targetStatus: IncidentStatus) => {
    if (!myTeam || !activeMission) return;
    // Synchronous lock to prevent double-submit
    if (statusLockRef.current) return;
    statusLockRef.current = true;
    setUpdatingStatus(targetStatus);
    try {
      await updateMissionStatus(activeMission.id, targetStatus, myTeam.id);
      toast.success(`Mission Status Updated: ${statusLabel(targetStatus)}`);
      if (targetStatus === 'resolved') {
        // Refresh to ensure team is shown as available
        await Promise.allSettled([fetchIncidents(), fetchTeams()]);
        router.push('/rescue/incidents');
      }
    } catch (err: any) {
      const isApiError = err instanceof ApiError;
      const status = isApiError ? err.status : null;
      const code = isApiError ? err.code : null;

      if (status === 409) {
        if (code === 'INVALID_STATUS_TRANSITION') {
          toast.warning('Invalid Transition', {
            description: err.message || 'Status transition not allowed from current state.',
          });
        } else {
          toast.warning('Status Conflict', {
            description: err.message || 'Mission state has changed. Refreshing...',
          });
        }
        await Promise.allSettled([fetchIncidents(), fetchTeams()]);
      } else {
        toast.error('Status update failed', {
          description: err.message || 'Status update failed. The mission status was not changed.',
        });
      }
    } finally {
      statusLockRef.current = false;
      setUpdatingStatus(null);
    }
  };

  // ─── 1. ASSIGNED INCIDENTS QUEUE PANEL ──────────────────────
  const renderIncidents = () => {
    if (!myTeam) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-nova-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" /> {t('heading.assigned_incidents')}
            </h2>
            <p className="text-xs text-em-text-dim mt-0.5">
              Live multi-agency emergency queue routed to {myTeam.name}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {rescueIncidents.length} Active Dispatch Alert{rescueIncidents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {rescueIncidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rescueIncidents.map((inc) => {
              const incLat = inc.location?.lat || 6.9271;
              const incLng = inc.location?.lng || 79.8612;
              const teamLat = myTeam.location?.lat || 6.9271;
              const teamLng = myTeam.location?.lng || 79.8612;
              const distanceKm = calculateDistanceKm(teamLat, teamLng, incLat, incLng);
              const etaMins = calculateEtaMinutes(distanceKm);
              const isAcceptedByMe = (inc.assignedTeamId === myTeam.id || inc.assignedTeam === myTeam.id) &&
                inc.status !== 'reported' && inc.status !== 'submitted';
              const isAcceptedByOther = Boolean(
                (inc.assignedTeamId && inc.assignedTeamId !== myTeam.id) ||
                (inc.assignedTeam && inc.assignedTeam !== myTeam.id && !isAcceptedByMe)
              );

              return (
                <div
                  key={inc.id}
                  className={cn(
                    'em-card border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all',
                    isAcceptedByMe
                      ? 'border-er-blue/30 bg-er-blue-light shadow-lg'
                      : 'border-em-border hover:border-em-border-strong'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-em-border text-em-text-muted">
                            {inc.trackingCode || inc.id}
                          </span>
                          {inc.isSilentSos && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              🤫 SILENT SOS
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-nova-text mt-1.5 line-clamp-1">
                          {getEmergencyTypeIcon(inc.type)} {localize(inc.title)}
                        </h3>
                      </div>
                      <SeverityBadge severity={inc.severity} size="sm" pulse={inc.severity === 'critical'} />
                    </div>

                    <p className="text-xs text-em-text-dim line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    {/* Media attachments indicators */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {inc.audioUrl && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-er-blue/30 text-er-blue flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> Voice Note
                        </span>
                      )}
                      {inc.photoUrls && inc.photoUrls.length > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-purple-500/30 text-purple-400 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Photo Attached
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-em-text-muted">
                        ⏱ {timeAgo(inc.reportedAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-em-border/60 text-xs text-em-text-muted">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-er-blue flex-shrink-0" />
                        <span className="truncate">{inc.location?.address || 'Colombo District'}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-er-orange flex-shrink-0" />
                        <span className="text-er-orange font-bold">~{etaMins}m ({distanceKm} km)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isAcceptedByMe ? (
                      <button
                        type="button"
                        onClick={() => router.push('/rescue/navigation')}
                        className="w-full flex items-center justify-center gap-2 bg-nova-cyan hover:bg-nova-cyan-dim text-nova-bg font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
                      >
                        <Navigation className="w-4 h-4" /> Open Mission Navigation
                      </button>
                    ) : isAcceptedByOther ? (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-white text-em-text-muted font-semibold py-2.5 rounded-xl text-xs border border-em-border cursor-not-allowed"
                      >
                        Assigned to {inc.assignedTeamName || 'Other Team'}
                      </button>
                    ) : myTeam.currentIncident && myTeam.currentIncident !== inc.id && myTeam.currentIncident !== inc.trackingCode ? (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-amber-500/10 text-amber-400 font-semibold py-2.5 rounded-xl text-xs border border-amber-500/30 cursor-not-allowed"
                        title={`Your team is active on mission ${myTeam.currentIncident}`}
                      >
                        Complete Current Mission First
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcceptMission(inc)}
                        disabled={acceptingId === inc.id}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg disabled:opacity-50"
                      >
                        {acceptingId === inc.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        Accept Mission &amp; Deploy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="em-card border border-em-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-nova-text">No Pending Rescue Incidents</h3>
            <p className="text-xs text-em-text-muted leading-relaxed">
              Your squad is on standby with zero pending alerts. Newly dispatched citizen SOS reports will appear here automatically.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── 2. MISSION NAVIGATION PANEL ───────────────────────────
  const renderNavigation = () => {
    if (!myTeam) return null;
    if (!activeMission) {
      return (
        <div className="em-card border border-em-border rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-em-subtle border border-em-border flex items-center justify-center mx-auto text-em-text-muted">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-nova-text">No Active Mission</h3>
          <p className="text-xs text-em-text-muted leading-relaxed max-w-sm mx-auto">
            No active mission. Accept an assigned incident to begin navigation.
          </p>
          <button
            type="button"
            onClick={() => router.push('/rescue/incidents')}
            className="px-5 py-2.5 bg-nova-cyan hover:bg-nova-cyan-dim text-nova-bg font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 mx-auto shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" /> View Assigned Incidents
          </button>
        </div>
      );
    }

    const incLat = activeMission.location?.lat || 6.9271;
    const incLng = activeMission.location?.lng || 79.8612;
    const teamLat = myTeam.location?.lat || 6.9271;
    const teamLng = myTeam.location?.lng || 79.8612;
    const distanceKm = calculateDistanceKm(teamLat, teamLng, incLat, incLng);
    const etaMins = calculateEtaMinutes(distanceKm);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-nova-text flex items-center gap-2">
              <Compass className="w-5 h-5 text-er-blue" /> {t('heading.mission_navigation')}
            </h2>
            <p className="text-xs text-em-text-dim mt-0.5">
              Active Mission: <span className="font-mono font-bold text-er-blue">{activeMission.trackingCode || activeMission.id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-white border border-em-border text-nova-text">
              Status: <span className="text-er-blue capitalize">{statusLabel(activeMission.status)}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tactical Map Container */}
          <div className="lg:col-span-2 em-card border border-em-border rounded-2xl h-[420px] relative overflow-hidden flex flex-col bg-[#070b14]">
            <LazyEmergencyMap
              incidents={[activeMission]}
              rescueTeams={[myTeam]}
              hospitals={[]}
              activeFilters={['incidents', 'teams']}
              selectedIncident={activeMission}
              onSelectIncident={() => { }}
            />

            {/* Tactical GPS Overlay */}
            <div className="absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur-md border border-em-border rounded-xl p-3 shadow-xl space-y-1">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-er-blue animate-pulse" />
                <span className="text-xs font-bold text-nova-text">TACTICAL ROUTE ACTIVE</span>
              </div>
              <p className="text-[11px] text-em-text-dim">
                Destination: <span className="font-semibold text-nova-text">{activeMission.location?.address || 'Colombo District'}</span>
              </p>
              <div className="flex gap-2 pt-1 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-em-subtle border border-em-border text-em-text-muted">
                  Dist: {distanceKm} km (Haversine)
                </span>
                <span className="px-2 py-0.5 rounded bg-em-subtle border border-em-border text-er-orange font-bold">
                  ETA: ~{etaMins} mins (Est.)
                </span>
              </div>
            </div>
          </div>

          {/* Mission Details & Action Stepper */}
          <div className="space-y-4">
            {/* Mission Summary Card */}
            <div className="em-card border border-em-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
                  Emergency Details
                </span>
                <SeverityBadge severity={activeMission.severity} size="sm" pulse={activeMission.severity === 'critical'} />
              </div>

              <h3 className="text-sm font-bold text-nova-text">
                {getEmergencyTypeIcon(activeMission.type)} {activeMission.title}
              </h3>
              <p className="text-xs text-em-text-dim leading-relaxed">
                {activeMission.description}
              </p>

              <div className="p-3 rounded-xl bg-em-subtle/60 border border-em-border text-xs space-y-1">
                <div className="flex justify-between text-em-text-muted">
                  <span>Destination GPS:</span>
                  <span className="font-mono text-er-blue">{incLat.toFixed(4)}° N, {incLng.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between text-em-text-muted">
                  <span>Reporter:</span>
                  <span className="font-medium text-nova-text">{activeMission.reporterName}</span>
                </div>
              </div>

              {/* Media Attachments — Strictly fetched from backend for THIS specific accepted mission */}
              {(() => {
                // Always source from liveIncident (backend fetch) — never from store cache
                // This guarantees only the citizen who submitted THIS incident's media is shown
                const sourceIncident = liveIncident?.id === activeMission.id ? liveIncident : activeMission;

                const photo = (sourceIncident.photoUrls && sourceIncident.photoUrls.length > 0 && sourceIncident.photoUrls[0])
                  ? sourceIncident.photoUrls[0]
                  : sourceIncident.attachments?.find(a => ((a.type as string) === 'image' || (a.type as string) === 'photo') && a.url)?.url;

                const audio = (sourceIncident.audioUrl && sourceIncident.audioUrl.trim() !== '')
                  ? sourceIncident.audioUrl
                  : sourceIncident.attachments?.find(a => a.type === 'audio' && a.url)?.url;

                const resolvedPhoto = resolveMediaUrl(photo);
                const resolvedAudio = resolveMediaUrl(audio);

                const hasPhoto = Boolean(resolvedPhoto && resolvedPhoto.length > 5);
                const hasAudio = Boolean(resolvedAudio && resolvedAudio.length > 5);

                // Show live location from the fetched incident
                const liveAddress = sourceIncident.location?.address || sourceIncident.manualAddress;
                const liveLat = sourceIncident.location?.lat;
                const liveLng = sourceIncident.location?.lng;
                const liveAccuracy = sourceIncident.location?.accuracy || sourceIncident.locationAccuracy;

                return (
                  <div className="space-y-3 pt-1">
                    {/* Live Location Strip */}
                    {liveLat && liveLng && (
                      <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] space-y-1">
                        <span className="font-bold text-green-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Citizen Live Location
                        </span>
                        <p className="font-mono text-em-text-dim">
                          {liveLat.toFixed(5)}° N, {liveLng.toFixed(5)}° E
                          {liveAccuracy ? ` (±${Math.round(liveAccuracy)}m accuracy)` : ''}
                        </p>
                        {liveAddress && <p className="text-em-text-dim truncate">{liveAddress}</p>}
                      </div>
                    )}

                    {fetchingLiveIncident && !hasPhoto && !hasAudio && (
                      <div className="p-3 rounded-xl bg-white/40 border border-em-border text-[11px] text-em-text-muted text-center flex items-center justify-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Loading citizen evidence...
                      </div>
                    )}

                    {!fetchingLiveIncident && !hasPhoto && !hasAudio && (
                      <div className="p-3 rounded-xl bg-white/40 border border-em-border text-[11px] text-em-text-muted text-center italic">
                        No photo or voice evidence uploaded for this incident.
                      </div>
                    )}

                    {hasPhoto && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-em-text-muted flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-purple-400" /> Citizen Evidence Photo
                        </span>
                        <div className="relative rounded-xl overflow-hidden border border-em-border h-36 bg-black/40">
                          <Image
                            src={resolvedPhoto}
                            alt="Incident Evidence"
                            fill
                            unoptimized
                            className="object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedPhoto(resolvedPhoto)}
                          />
                        </div>
                      </div>
                    )}

                    {hasAudio && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-em-text-muted flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-er-blue" /> Citizen Voice Recording
                        </span>
                        <audio
                          key={resolvedAudio}
                          controls
                          className="w-full h-9 rounded-lg"
                          src={resolvedAudio}
                          preload="metadata"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Tactical Responder Lifecycle Actions */}
            <div className="em-card border border-em-border rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-em-text-muted uppercase tracking-wider block">
                Mission Execution Actions
              </span>

              {(activeMission.status === 'acknowledged' || activeMission.status === 'assigned') && (
                <button
                  type="button"
                  onClick={() => handleStatusTransition('en_route')}
                  disabled={updatingStatus !== null}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Navigation className="w-4 h-4" /> Start Journey → Mark En Route
                </button>
              )}

              {activeMission.status === 'en_route' && (
                <button
                  type="button"
                  onClick={() => handleStatusTransition('on_scene')}
                  disabled={updatingStatus !== null}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <MapPin className="w-4 h-4" /> Report Arrival On Scene
                </button>
              )}

              {activeMission.status === 'on_scene' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('transporting')}
                    disabled={updatingStatus !== null}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    🏥 Transport Patient / Victims
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('resolved')}
                    disabled={updatingStatus !== null}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCheck className="w-4 h-4" /> Complete Mission &amp; Resolve
                  </button>
                </div>
              )}

              {activeMission.status === 'transporting' && (
                <button
                  type="button"
                  onClick={() => handleStatusTransition('resolved')}
                  disabled={updatingStatus !== null}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCheck className="w-4 h-4" /> Complete Mission &amp; Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── 3. TEAM ROSTER PANEL ──────────────────────────────────
  const renderTeam = () => {
    if (!myTeam) return null;
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-nova-text flex items-center gap-2">
          <Users className="w-5 h-5 text-er-blue" /> {t('heading.roster')}
        </h2>
        <div className="em-card border border-em-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-em-border/60">
            <div>
              <h3 className="text-sm font-bold text-nova-text">{myTeam.name}</h3>
              <p className="text-xs text-em-text-dim">{myTeam.district} Operational Base</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
              {myTeam.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myTeam.members.map((member) => (
              <div key={member.id} className="p-3.5 rounded-xl bg-white border border-em-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nova-cyan/20 to-nova-blue/20 border border-er-blue/30 flex items-center justify-center text-xs font-bold text-er-blue">
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-nova-text">{member.name}</p>
                    <p className="text-[10px] text-em-text-muted">{member.role}</p>
                  </div>
                </div>
                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase', {
                  'bg-green-500/10 border-green-500/20 text-green-400': member.status === 'active',
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400': member.status === 'standby',
                })}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Do not interpret an empty response as an unlinked account until all required requests finish.
  if (!currentUser || loading.teams || (Boolean(currentUser.rescueTeamId) && loading.incidents)) {
    return (
      <div className="min-h-screen bg-em-bg">
        <TopNav role="rescue_team" />
        <DashboardShell role="rescue_team">
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-er-blue animate-spin" />
            <h3 className="text-base font-bold text-nova-text">Loading Rescue Operations...</h3>
            <p className="text-xs text-em-text-muted">Fetching rescue teams and live dispatch queues...</p>
          </div>
        </DashboardShell>
      </div>
    );
  }

  if (errors.teams || (myTeam && errors.incidents)) {
    const message = errors.teams || errors.incidents;
    return (
      <div className="min-h-screen bg-em-bg">
        <TopNav role="rescue_team" />
        <DashboardShell role="rescue_team">
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-400" />
            <h3 className="text-base font-bold text-nova-text">Unable to load rescue operations</h3>
            <p className="text-xs text-red-300 max-w-md">{message}</p>
            <button type="button" onClick={() => { fetchTeams(); fetchIncidents(); }} className="px-4 py-2 bg-white text-nova-text border border-em-border font-semibold rounded-xl text-xs">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
            </button>
          </div>
        </DashboardShell>
      </div>
    );
  }

  if (currentUser.approvalStatus !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-em-bg">
        <TopNav role="rescue_team" />
        <DashboardShell role="rescue_team">
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-nova-text">Approval Pending</h3>
            <p className="text-xs text-em-text-muted">Your rescue role is awaiting administrator approval.</p>
          </div>
        </DashboardShell>
      </div>
    );
  }

  if (currentUser.rescueTeamId && !myTeam) {
    return (
      <div className="min-h-screen bg-em-bg">
        <TopNav role="rescue_team" />
        <DashboardShell role="rescue_team">
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-400" />
            <h3 className="text-base font-bold text-nova-text">Linked rescue team unavailable</h3>
            <p className="text-xs text-red-300">The assigned team {currentUser.rescueTeamId} could not be loaded from the backend.</p>
            <button type="button" onClick={() => fetchTeams()} className="px-4 py-2 bg-white text-nova-text border border-em-border font-semibold rounded-xl text-xs"><RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry</button>
          </div>
        </DashboardShell>
      </div>
    );
  }

  // Guard: if authenticated rescue user has no linked team
  if (!myTeam) {
    return (
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
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-nova-cyan hover:bg-nova-cyan-dim text-nova-bg font-bold rounded-xl text-xs transition-all"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </DashboardShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="rescue_team" />
      <DashboardShell role="rescue_team">
        <div className="p-6 space-y-6">
          {slug === 'incidents' && renderIncidents()}
          {slug === 'navigation' && renderNavigation()}
          {(slug === 'team' || slug === 'team-status') && renderTeam()}
        </div>
      </DashboardShell>

      {/* Photo Modal Preview */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative w-[90vw] max-w-2xl h-[70vh] rounded-2xl overflow-hidden border border-white/20">
              <Image src={selectedPhoto} alt="Evidence Full Preview" fill unoptimized className="object-contain" />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
