'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Camera, Mic, MapPin, ChevronRight, AlertTriangle, Brain, CheckCircle,
  XCircle, Square, Play, Trash2, RefreshCw, SwitchCamera, Upload, ExternalLink,
  Volume2, ShieldAlert, Navigation, Eye, EyeOff, Loader2, Info
} from 'lucide-react';
import { cn, getEmergencyTypeIcon } from '@/lib/utils';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { EmergencyType, Incident, SeverityLevel, AgencyType } from '@/types';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  EMERGENCY_ROUTING_RULES,
  AGENCY_METADATA,
  generateAgencyNotifications,
  findNearestResponders,
} from '@/lib/emergency-routing';
import { incidentsApi } from '@/lib/api/client';
import { validatePhone, isSriLankanPhone } from '@/lib/auth';
import dynamic from 'next/dynamic';

const LazyCameraModal = dynamic(() => import('@/components/sos/LazyCameraModal'), { ssr: false });

const EMERGENCY_TYPES: { type: EmergencyType; label: string; icon: string; defaultSeverity: SeverityLevel }[] = [
  { type: 'medical', label: 'Medical Emergency', icon: '🚑', defaultSeverity: 'high' },
  { type: 'road_accident', label: 'Road Accident', icon: '🚗', defaultSeverity: 'high' },
  { type: 'fire', label: 'Fire Outbreak', icon: '🔥', defaultSeverity: 'critical' },
  { type: 'crime', label: 'Crime / Personal Threat', icon: '🚨', defaultSeverity: 'high' },
  { type: 'building_collapse', label: 'Building Collapse', icon: '🏚️', defaultSeverity: 'critical' },
  { type: 'flood', label: 'Flood Inundation', icon: '🌊', defaultSeverity: 'high' },
  { type: 'landslide', label: 'Landslide', icon: '⛰️', defaultSeverity: 'critical' },
  { type: 'missing_person', label: 'Missing Person', icon: '👤', defaultSeverity: 'medium' },
  { type: 'severe_weather', label: 'Severe Weather / Storm', icon: '🌪️', defaultSeverity: 'medium' },
  { type: 'other', label: 'Other Critical SOS', icon: '⚠️', defaultSeverity: 'critical' },
];

const TRANSLATIONS = {
  en: {
    title: 'Report Emergency',
    sos: 'SOS',
    placeholder: 'Describe the emergency, injuries, immediate danger, or trapped persons...',
    submit: 'Submit Emergency Report',
    aiPreview: 'AI Pre-Analysis & Multi-Agency Dispatch',
    sending: 'Dispatching Emergency Alert...',
    audioRecord: 'Voice Evidence',
    cameraEvidence: 'Camera Evidence',
    locationGps: 'Live GPS Location',
  },
  ta: {
    title: 'அவசர தகவல் தெரிவிக்க',
    sos: 'SOS',
    placeholder: 'என்ன நடக்கிறது, காயங்கள், உடனடி ஆபத்து பற்றி விவரிக்கவும்...',
    submit: 'அவசர அறிக்கை சமர்ப்பிக்கவும்',
    aiPreview: 'AI முன் பகுப்பாய்வு மற்றும் அனுப்புதல்',
    sending: 'அவசர எச்சரிக்கை அனுப்பப்படுகிறது...',
    audioRecord: 'குரல் பதிவு',
    cameraEvidence: 'புகைப்பட ஆதாரம்',
    locationGps: 'நேரடி GPS இருப்பிடம்',
  },
  si: {
    title: 'හදිසි තත්ත්වය වාර්තා කරන්න',
    sos: 'SOS',
    placeholder: 'සිදු වන දෙය, තුවාල, හදිසි අනතුර හෝ සිරවී සිටින පුද්ගලයින් විස්තර කරන්න...',
    submit: 'හදිසි වාර්තාව ඉදිරිපත් කරන්න',
    aiPreview: 'AI පූර්ව විශ්ලේෂණය සහ යොමු කිරීම',
    sending: 'හදිසි දැනුම්දීම යවමින් පවතී...',
    audioRecord: 'හඬ පටිගත කිරීම',
    cameraEvidence: 'කැමරා සාක්ෂි',
    locationGps: 'සජීවී GPS ස්ථානය',
  },
};

export default function SOSPage() {
  const { language, addIncident, addNotification, currentUser, rescueTeams, hospitals } = useNovaStore();
  const router = useRouter();
  const t = (TRANSLATIONS as any)[language] || TRANSLATIONS.en;

  // Form State
  const [selectedType, setSelectedType] = useState<EmergencyType>('medical');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterPhone, setReporterPhone] = useState(currentUser?.phone || '');
  const [isSilentSos, setIsSilentSos] = useState(false);
  const [step, setStep] = useState<'form' | 'ai_preview'>('form');
  const [submitting, setSubmitting] = useState(false);

  // Custom Hardware Hooks
  const audio = useAudioRecorder();
  const camera = useCameraCapture();
  const geo = useCurrentLocation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Determine Severity based on type & silent SOS
  const computedSeverity: SeverityLevel = isSilentSos
    ? 'critical'
    : (EMERGENCY_TYPES.find((t) => t.type === selectedType)?.defaultSeverity || 'high');

  // Multi-agency routing
  const recommendedAgencies: AgencyType[] = EMERGENCY_ROUTING_RULES[selectedType] || EMERGENCY_ROUTING_RULES.unknown;

  const phoneError = validatePhone(reporterPhone);

  const handleStepToAIPreview = () => {
    if (reporterPhone.trim() && phoneError) {
      toast.error('Invalid Phone Number', { description: phoneError });
      return;
    }
    if (!description.trim() && !audio.audioBlob && !camera.photoBlob) {
      toast.warning('Please provide an emergency description or audio/photo evidence.');
    }
    setStep('ai_preview');
  };

  const handleFinalEmergencySubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const trackingCode = `NOV-${Math.floor(1000 + Math.random() * 9000)}`;
      const lat = geo.latitude || 6.9271;
      const lng = geo.longitude || 79.8612;

      // Find nearest team & hospital with Haversine distance
      const responders = findNearestResponders(lat, lng, rescueTeams, hospitals);

      // Generate agency notifications
      const notifications = generateAgencyNotifications(selectedType, true);

      // Prepare Multipart FormData
      const formData = new FormData();
      formData.append('emergencyType', selectedType);
      formData.append('type', selectedType);
      formData.append('description', description.trim() || `${selectedType.replace('_', ' ')} emergency reported via Citizen SOS`);
      formData.append('severity', computedSeverity);
      formData.append('reporterName', reporterName.trim() || 'Citizen Responder');
      if (reporterPhone.trim()) formData.append('reporterPhone', reporterPhone.trim());
      formData.append('latitude', String(lat));
      formData.append('longitude', String(lng));
      if (geo.accuracy) formData.append('locationAccuracy', String(geo.accuracy));
      if (geo.capturedAt) formData.append('locationCapturedAt', geo.capturedAt);
      if (geo.manualAddress.trim()) formData.append('manualAddress', geo.manualAddress.trim());
      formData.append('isSilentSos', String(isSilentSos));

      if (audio.audioFile) {
        formData.append('audio', audio.audioFile, audio.audioFile.name || 'voice-note.webm');
        formData.append('audioFile', audio.audioFile, audio.audioFile.name || 'voice-note.webm');
      }
      if (camera.photoFile) {
        formData.append('photo', camera.photoFile, camera.photoFile.name || 'evidence-photo.jpg');
        formData.append('photoFile', camera.photoFile, camera.photoFile.name || 'evidence-photo.jpg');
      }

      // 1. Demo mode: no backend to submit to — this intentionally rejects
      //    so the local fallback below always builds the incident client-side.
      let backendIncident: any = null;
      try {
        backendIncident = await incidentsApi.reportEmergency(formData);
      } catch (err: any) {
        console.warn('Backend multipart submission error (falling back to local store):', err.message);
      }

      // 2. Build complete Incident for Client Store & Local State
      const incidentId = backendIncident?.id || trackingCode;
      const newIncident: Incident = {
        id: incidentId,
        trackingCode: backendIncident?.trackingCode || trackingCode,
        type: selectedType,
        severity: computedSeverity,
        status: 'submitted',
        title: description.slice(0, 60) || `${selectedType.replace('_', ' ')} Emergency Report`,
        description: description.trim() || `${selectedType.replace('_', ' ')} emergency reported.`,
        location: {
          lat,
          lng,
          address: geo.manualAddress || (geo.isDetected ? `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})` : 'Colombo District'),
          district: 'Colombo',
          accuracy: geo.accuracy || undefined,
          capturedAt: geo.capturedAt || undefined,
        },
        reportedBy: currentUser?.email || 'citizen-001',
        reporterName: reporterName.trim() || currentUser?.name || 'Citizen Witness',
        reporterPhone: reporterPhone.trim() || currentUser?.phone || undefined,
        reportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        peopleAffected: 1,
        isSilentSos,
        isSimulation: false,
        audioUrl: backendIncident?.audioUrl || (audio.audioUrl ? audio.audioUrl : undefined),
        audioTranscript: audio.transcript || undefined,
        photoUrls: (backendIncident?.photoUrls && backendIncident.photoUrls.length > 0)
          ? backendIncident.photoUrls
          : (camera.photoUrl ? [camera.photoUrl] : []),
        attachments: backendIncident?.attachments || [
          ...(audio.audioUrl ? [{ id: `att-aud-${Date.now()}`, type: 'audio', url: audio.audioUrl, name: 'Voice Note', size: 1024 }] : []),
          ...(camera.photoUrl ? [{ id: `att-img-${Date.now()}`, type: 'image', url: camera.photoUrl, name: 'Evidence Photo', size: 2048 }] : []),
        ],
        manualAddress: geo.manualAddress || undefined,
        locationAccuracy: geo.accuracy || undefined,
        locationCapturedAt: geo.capturedAt || undefined,
        recommendedAgencies,
        notifiedAgencies: notifications,
        assignedUnits: responders.assignedUnits,
        assignedTeam: responders.assignedTeam?.id,
        assignedTeamName: responders.assignedTeam?.name,
        assignedHospital: responders.assignedHospital?.name,
        eta: responders.etaMinutes,
        aiAnalysis: {
          id: `ai-${Date.now()}`,
          incidentId,
          emergencyType: selectedType,
          severity: computedSeverity,
          confidenceScore: 94,
          peopleAffected: 1,
          vulnerablePersons: isSilentSos ? [{ type: 'medical', count: 1 }] : [],
          requiredResources: [{ type: 'Primary Responder Unit', quantity: 1, priority: 'immediate' }],
          recommendedAction: `Deploy ${recommendedAgencies.map((a) => AGENCY_METADATA[a].name).join(', ')} immediately.`,
          detectedLanguage: language,
          processedAt: new Date().toISOString(),
          inputModalities: [
            ...(description ? (['text'] as const) : []),
            ...(audio.audioBlob ? (['voice'] as const) : []),
            ...(camera.photoBlob ? (['image'] as const) : []),
          ],
          riskFactors: isSilentSos ? ['Silent SOS: Reporter unable to speak safely', 'High personal risk'] : ['Urgent tactical dispatch required'],
          estimatedResponseTime: responders.etaMinutes,
          recommendedAgencies,
          voiceTranscript: audio.transcript || undefined,
        },
        updates: [
          {
            id: `upd-${Date.now()}`,
            status: 'submitted',
            message: `Emergency report submitted. Multi-agency notification sent to ${recommendedAgencies.length} authorities.`,
            updatedBy: 'ADRIAN Automated Dispatch',
            updatedAt: new Date().toISOString(),
            isAI: true,
          },
        ],
        notes: [],
        resourcesAllocated: [],
        priority: computedSeverity === 'critical' ? 1 : 2,
      };

      addIncident(newIncident);

      // Add Notification
      addNotification({
        id: `notif-sos-${Date.now()}`,
        type: 'critical_incident',
        title: `🚨 ${newIncident.title}`,
        message: `Emergency (${newIncident.trackingCode || newIncident.id}) received. Authorities notified.`,
        severity: computedSeverity,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: newIncident.id,
        relatedType: 'incident',
      });

      toast.success('Emergency Dispatched Successfully!', {
        description: `Tracking Code: ${newIncident.trackingCode || newIncident.id}`,
      });

      router.push(`/citizen/tracking/${newIncident.trackingCode || newIncident.id}`);
    } catch (err: any) {
      toast.error('Failed to submit emergency report', { description: err.message });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-em-bg text-nova-text">
      <TopNav role="citizen" showTicker={false} />
      <DashboardShell role="citizen">
        <div className="max-w-xl mx-auto p-4 space-y-6">

          {/* SIMULATION Watermark Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs">
            <div className="flex items-center gap-2 text-orange-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              SIMULATION MODE ACTIVE
            </div>
            <span className="text-[11px] text-em-text-muted">Internal portal dispatch only</span>
          </div>

          {/* Guest Emergency Mode Banner */}
          {(!currentUser || currentUser.role !== 'citizen') && (
            <div className="p-4 rounded-xl bg-em-subtle border border-er-blue/30 text-xs flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-er-blue flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-nova-text text-sm">Emergency Reporting Mode</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                      Open to All
                    </span>
                  </div>
                  <p className="text-em-text-dim text-xs mt-1 leading-relaxed">
                    Emergency reporting is open to all citizens without signing in. To access full Citizen Portal features (personal dashboard, track all submitted reports, and safety resources), please sign in.
                  </p>
                </div>
              </div>
              <Link
                href="/login?portal=citizen"
                className="flex items-center gap-1 text-xs font-bold text-er-blue hover:text-er-blue-dim bg-er-blue-light border border-er-blue/30 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex-shrink-0"
              >
                Sign In <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {step === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* SOS Emergency Header with Pulsing Glow */}
              <div className="text-center py-4 relative">
                <motion.div
                  className="relative w-28 h-28 mx-auto cursor-pointer"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    toast.info('SOS Emergency reporting initiated.');
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-500/40"
                    animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border border-red-500/60"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-nova-critical">
                    <span className="text-white font-black text-2xl tracking-widest">{t.sos}</span>
                  </div>
                </motion.div>
                <h1 className="text-2xl font-black text-nova-text mt-4">{t.title}</h1>
                <p className="text-xs text-em-text-dim mt-1">AI-Powered Rapid Emergency Response & Multi-Agency Dispatch</p>
              </div>

              {/* Silent SOS Toggle */}
              <div className="p-3.5 rounded-2xl bg-white border border-em-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl transition-colors', isSilentSos ? 'bg-red-500/20 text-red-400' : 'bg-em-subtle text-em-text-muted')}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-nova-text">Silent SOS (I cannot speak safely)</p>
                    <p className="text-[11px] text-em-text-muted">Direct high-priority stealth alert without audio callbacks</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSilentSos(!isSilentSos);
                    if (!isSilentSos) toast.info('Silent SOS mode enabled — High Priority Police/Rescue stealth alert');
                  }}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5',
                    isSilentSos ? 'bg-red-500' : 'bg-nova-border'
                  )}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ x: isSilentSos ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Emergency Category Selection */}
              <div>
                <label className="text-xs font-bold text-em-text-muted uppercase tracking-wider block mb-2.5">
                  1. Select Emergency Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EMERGENCY_TYPES.map(({ type, label, icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                        selectedType === type
                          ? 'border-nova-cyan bg-er-blue-light text-nova-text shadow-sm'
                          : 'border-em-border bg-white/60 text-em-text-dim hover:border-em-border-strong hover:text-nova-text'
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <span className="text-xs font-semibold line-clamp-1">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Evidence Capture (Voice, Camera, Location) */}
              <div>
                <label className="text-xs font-bold text-em-text-muted uppercase tracking-wider block mb-2.5">
                  2. Attach Real-Time Evidence (Optional but Recommended)
                </label>
                <div className="grid grid-cols-3 gap-3">

                  {/* ── Microphone Card ── */}
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all min-h-[120px]',
                      audio.isRecording
                        ? 'border-red-500 bg-red-500/10 shadow-lg'
                        : audio.audioBlob
                        ? 'border-green-500/60 bg-green-500/10'
                        : 'border-em-border bg-white hover:border-em-border-strong'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      {audio.isRecording ? (
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white mb-1.5"
                        >
                          <Mic className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Mic className={cn('w-7 h-7 mb-1.5', audio.audioBlob ? 'text-green-400' : 'text-er-blue')} />
                      )}
                      <span className="text-xs font-bold">
                        {audio.isRecording ? audio.formattedTime : audio.audioBlob ? 'Voice Saved' : 'Voice'}
                      </span>
                    </div>

                    {audio.isRecording ? (
                      <button
                        type="button"
                        onClick={audio.stopRecording}
                        className="mt-2 w-full py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Square className="w-3 h-3 fill-current" /> Stop
                      </button>
                    ) : audio.audioBlob ? (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={audio.resetRecording}
                          title="Record Again"
                          className="p-1 text-em-text-muted hover:text-red-400 rounded-lg hover:bg-em-subtle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={audio.startRecording}
                          title="Re-record"
                          className="p-1 text-er-blue hover:underline text-[10px] font-semibold"
                        >
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={audio.startRecording}
                        className="mt-2 w-full py-1 bg-em-subtle hover:bg-er-blue-light text-er-blue border border-er-blue/30 rounded-lg text-[11px] font-bold"
                      >
                        Record
                      </button>
                    )}
                  </div>

                  {/* ── Camera Card ── */}
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all min-h-[120px]',
                      camera.photoBlob
                        ? 'border-green-500/60 bg-green-500/10'
                        : 'border-em-border bg-white hover:border-em-border-strong'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <Camera className={cn('w-7 h-7 mb-1.5', camera.photoBlob ? 'text-green-400' : 'text-purple-400')} />
                      <span className="text-xs font-bold">
                        {camera.photoBlob ? 'Photo Saved' : 'Camera'}
                      </span>
                    </div>

                    {camera.photoBlob ? (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={camera.removePhoto}
                          title="Remove Photo"
                          className="p-1 text-em-text-muted hover:text-red-400 rounded-lg hover:bg-em-subtle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={camera.openCamera}
                          className="p-1 text-purple-400 hover:underline text-[10px] font-semibold"
                        >
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={camera.openCamera}
                        className="mt-2 w-full py-1 bg-em-subtle hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[11px] font-bold"
                      >
                        Open Cam
                      </button>
                    )}
                  </div>

                  {/* ── Live GPS Card ── */}
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all min-h-[120px]',
                      geo.isDetecting
                        ? 'border-nova-cyan bg-er-blue-light'
                        : geo.isDetected
                        ? 'border-green-500/60 bg-green-500/10'
                        : 'border-em-border bg-white hover:border-em-border-strong'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      {geo.isDetecting ? (
                        <Loader2 className="w-7 h-7 mb-1.5 text-er-blue animate-spin" />
                      ) : (
                        <MapPin className={cn('w-7 h-7 mb-1.5', geo.isDetected ? 'text-green-400' : 'text-orange-400')} />
                      )}
                      <span className="text-xs font-bold">
                        {geo.isDetecting ? 'Detecting...' : geo.isDetected ? 'Located ✓' : 'GPS Location'}
                      </span>
                    </div>

                    {geo.isDetected ? (
                      <button
                        type="button"
                        onClick={geo.detectLocation}
                        title="Refresh Location"
                        className="mt-2 flex items-center gap-1 text-[10px] text-green-400 hover:underline font-semibold"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={geo.detectLocation}
                        disabled={geo.isDetecting}
                        className="mt-2 w-full py-1 bg-em-subtle hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-[11px] font-bold"
                      >
                        Get GPS
                      </button>
                    )}
                  </div>
                </div>

                {/* Evidence Previews (Audio Player & Captured Photo Thumbnail) */}
                {(audio.audioUrl || camera.photoUrl || geo.isDetected) && (
                  <div className="mt-3 space-y-2.5 p-3.5 rounded-2xl bg-white border border-em-border">
                    {/* Audio Player */}
                    {audio.audioUrl && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-nova-text flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-er-blue" /> Voice Recording Preview
                          </span>
                          <span className="text-em-text-muted font-mono">{audio.formattedTime}</span>
                        </div>
                        <audio controls src={audio.audioUrl} className="w-full h-8 rounded-lg mt-1" />
                        {audio.transcript && (
                          <p className="text-[11px] text-em-text-dim italic bg-em-subtle p-2 rounded-lg mt-1">
                            &quot;{audio.transcript}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Photo Preview */}
                    {camera.photoUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-em-border/60">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40 flex-shrink-0">
                          <Image src={camera.photoUrl} alt="Emergency Evidence" fill unoptimized className="object-cover" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-nova-text">Photo Attached</p>
                          <p className="text-[11px] text-em-text-muted">1 image file ready for authority triage</p>
                        </div>
                        <button
                          type="button"
                          onClick={camera.removePhoto}
                          className="text-red-400 hover:text-red-300 p-1 rounded-lg text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* GPS Coordinates Badge */}
                    {geo.isDetected && geo.latitude && geo.longitude && (
                      <div className="flex items-center justify-between pt-2 border-t border-em-border/60 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="font-mono text-em-text-dim">
                            {geo.latitude.toFixed(5)}° N, {geo.longitude.toFixed(5)}° E (±{geo.accuracy}m)
                          </span>
                        </div>
                        {geo.mapsUrl && (
                          <a
                            href={geo.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-er-blue hover:underline font-semibold"
                          >
                            Open Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description & Manual Location */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-em-text-muted uppercase tracking-wider block mb-2">
                    3. Emergency Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-em-border rounded-xl px-4 py-3 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/30 resize-none"
                    placeholder={t.placeholder}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-em-text-muted uppercase tracking-wider block mb-2">
                    Manual Address / Landmark (Fallback)
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-em-text-muted" />
                    <input
                      type="text"
                      value={geo.manualAddress}
                      onChange={(e) => geo.setManualAddress(e.target.value)}
                      placeholder="e.g. Near Kaduwela Bridge, Kelani River Bank, Colombo"
                      className="w-full bg-white border border-em-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/30"
                    />
                  </div>
                </div>

                {/* Reporter Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-em-text-muted block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Amal Perera"
                      className="w-full bg-white border border-em-border rounded-xl px-3.5 py-2 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/30"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-em-text-muted">Contact Phone</label>
                      {reporterPhone.trim() && (
                        <span className={cn(
                          'text-[10px] font-medium font-mono px-1.5 py-0.2 rounded',
                          phoneError ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'
                        )}>
                          {phoneError ? 'Invalid' : isSriLankanPhone(reporterPhone) ? '✓ Sri Lanka (+94)' : '✓ Valid'}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className={cn(
                        "w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none transition-colors",
                        reporterPhone.trim() && phoneError ? "border-red-500/60 focus:border-red-500" : "border-em-border focus:border-er-blue/30"
                      )}
                    />
                    {reporterPhone.trim() && phoneError && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3 flex-shrink-0" /> {phoneError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit to AI Pre-Analysis Button */}
              <motion.button
                type="button"
                onClick={handleStepToAIPreview}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-nova-critical text-base transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Brain className="w-5 h-5 text-yellow-300" />
                Analyze &amp; Review Emergency Dispatch
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              <p className="text-center text-xs text-em-text-muted">
                Your report triggers AI-assisted severity assessment and simultaneous multi-agency alerting.
              </p>
            </motion.div>
          )}

          {/* ── Step 2: AI Pre-Analysis & Multi-Agency Dispatch Review ── */}
          {step === 'ai_preview' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-7 h-7 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-nova-text">{t.aiPreview}</h2>
                <p className="text-xs text-em-text-dim mt-1">Review tactical routing and emergency units to be alerted</p>
              </div>

              <div className="em-card border border-purple-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-em-border/70">
                  <span className="text-xs text-em-text-muted">Emergency Category</span>
                  <span className="text-sm font-bold text-nova-text flex items-center gap-1.5">
                    {getEmergencyTypeIcon(selectedType)} {selectedType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-em-border/70">
                  <span className="text-xs text-em-text-muted">Assessed Severity</span>
                  <SeverityBadge severity={computedSeverity} pulse />
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-em-border/70">
                  <span className="text-xs text-em-text-muted">GPS Location</span>
                  <span className="text-xs font-semibold text-er-blue">
                    {geo.latitude ? `${geo.latitude.toFixed(4)}° N, ${geo.longitude?.toFixed(4)}° E` : geo.manualAddress || 'Colombo District'}
                  </span>
                </div>

                {/* Multi-Agency Routing Matrix Preview */}
                <div>
                  <span className="text-xs text-em-text-muted block mb-2">Authorities to be Alerted Simultaneously:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recommendedAgencies.map((agency) => {
                      const meta = AGENCY_METADATA[agency];
                      return (
                        <div key={agency} className="flex items-center gap-2 p-2.5 rounded-xl bg-em-subtle/60 border border-em-border text-xs">
                          <span className="text-base">{meta.icon}</span>
                          <span className="font-semibold text-nova-text">{meta.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                  <p className="font-bold text-purple-400">🤖 AI Recommendation</p>
                  <p className="text-em-text-dim leading-relaxed">
                    Immediate dispatch requested. Incident assigned high operational priority with simultaneous tactical unit notification.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={submitting}
                  className="flex-1 py-3.5 border border-em-border text-em-text-dim rounded-xl hover:border-em-border-strong transition-all font-semibold text-sm"
                >
                  ← Edit Details
                </button>
                <motion.button
                  type="button"
                  onClick={handleFinalEmergencySubmit}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-nova-critical text-sm"
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Confirm &amp; Alert Authorities
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </DashboardShell>

      {/* ── Camera Capture Modal Dialog (Dynamically Imported) ── */}
      <LazyCameraModal camera={camera} />
    </div>
  );
}
