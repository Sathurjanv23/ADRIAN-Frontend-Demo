'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Cpu,
  Mic,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  AlertTriangle,
  Zap,
  Play,
  Square,
  RotateCcw,
  Volume2,
  Upload,
  Trash2,
  ShieldAlert,
  Send,
  ArrowRight,
  Eye,
  Sparkles,
  Layers,
  Radio,
  Check,
  Copy,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import type { AIAnalysis, Incident, EmergencyType, SeverityLevel, AgencyType, VulnerablePerson, ResourceRequirement, ImageAnalysisResult, RescueTeam } from '@/types';
import { getEmergencyTypeIcon } from '@/lib/utils';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { toast } from 'sonner';

// ─── Preset Image Data URLs (High-contrast emergency vector scenes) ──────────

const PRESET_IMAGES = [
  {
    id: 'flood',
    title: 'Severe Flood Waters',
    tag: 'Flood Ingress',
    type: 'flood' as EmergencyType,
    conditions: ['Water Ingress Depth: ~1.7m', 'Current Velocity: 1.4 m/s', 'Submerged Ground Floor'],
    hazards: ['Drowning hazard', 'Electrical grid shorting', 'Contaminated water'],
    accessibility: 'blocked' as const,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23111b27'/%3E%3Cstop offset='100%25' stop-color='%231e3347'/%3E%3C/linearGradient%3E%3ClinearGradient id='water' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%230f4c64'/%3E%3Cstop offset='100%25' stop-color='%23062635'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='340' fill='url(%23sky)'/%3E%3Cpath d='M100 180 L220 100 L340 180 Z' fill='%238d3838'/%3E%3Crect x='130' y='180' width='180' height='100' fill='%23d9b48f'/%3E%3Crect x='150' y='195' width='40' height='40' fill='%23507d99'/%3E%3Crect x='250' y='195' width='40' height='40' fill='%23507d99'/%3E%3Crect y='220' width='600' height='120' fill='url(%23water)' opacity='0.92'/%3E%3Cpath d='M0 220 Q150 205 300 220 T600 220 L600 340 L0 340 Z' fill='%230b5e7e' opacity='0.6'/%3E%3Ccircle cx='220' cy='150' r='14' fill='%23e25555'/%3E%3Ctext x='220' y='155' font-family='sans-serif' font-size='14' font-weight='bold' fill='white' text-anchor='middle'%3ESOS%3C/text%3E%3Ctext x='300' y='40' font-family='sans-serif' font-size='18' font-weight='bold' fill='%2367e8f9' text-anchor='middle'%3EAI VISION: FLOOD INUNDATION DETECTED%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'fire',
    title: 'Multi-Story Structural Fire',
    tag: 'Combustion & Smoke',
    type: 'fire' as EmergencyType,
    conditions: ['Active Class-A Combustion', 'Dense Toxic Smoke Plume', 'Thermal Radiation: >650°C'],
    hazards: ['Structural collapse hazard', 'Flashover potential', 'Toxic inhalation'],
    accessibility: 'blocked' as const,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='fsky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23190808'/%3E%3Cstop offset='100%25' stop-color='%2338120a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='340' fill='url(%23fsky)'/%3E%3Crect x='180' y='70' width='240' height='270' fill='%232b2b36'/%3E%3Crect x='210' y='100' width='35' height='45' fill='%23f97316'/%3E%3Crect x='270' y='100' width='35' height='45' fill='%23ef4444'/%3E%3Crect x='330' y='100' width='35' height='45' fill='%23f59e0b'/%3E%3Crect x='210' y='180' width='35' height='45' fill='%23475569'/%3E%3Crect x='270' y='180' width='35' height='45' fill='%23f97316'/%3E%3Crect x='330' y='180' width='35' height='45' fill='%23475569'/%3E%3Cpath d='M250 80 Q290 20 330 80 Q370 10 320 0 Q260 20 250 80 Z' fill='%23ea580c' opacity='0.8'/%3E%3Cpath d='M280 60 Q300 15 320 60 Z' fill='%23fbbf24'/%3E%3Ccircle cx='300' cy='45' r='55' fill='%23334155' opacity='0.45' filter='blur(6px)'/%3E%3Ctext x='300' y='320' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23f87171' text-anchor='middle'%3EAI VISION: MULTI-STORY STRUCTURAL FIRE%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'landslide',
    title: 'Hillside Slope Landslide',
    tag: 'Slope Collapse',
    type: 'landslide' as EmergencyType,
    conditions: ['Mass Earth Movement: ~450 m³', 'Road Corridor Severed', 'Active Mud Flow'],
    hazards: ['Secondary slope slip', 'Trapped vehicle hazard', 'Downed power lines'],
    accessibility: 'blocked' as const,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='lsky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23131c18'/%3E%3Cstop offset='100%25' stop-color='%23223024'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='340' fill='url(%23lsky)'/%3E%3Cpolygon points='0,40 380,240 600,200 600,340 0,340' fill='%231e2920'/%3E%3Cpolygon points='40,100 320,290 480,250 200,120' fill='%235c4033'/%3E%3Cpolygon points='120,160 300,320 400,280 240,170' fill='%2378553e'/%3E%3Crect x='310' y='270' width='45' height='25' rx='4' fill='%2338bdf8' transform='rotate(-12 310 270)'/%3E%3Ctext x='300' y='50' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23fde047' text-anchor='middle'%3EAI VISION: HILLSIDE LANDSLIDE & DEBRIS%3C/text%3E%3C/svg%3E",
  },
  {
    id: 'medical',
    title: 'Mass Casualty / Crash',
    tag: 'Trauma & Impact',
    type: 'road_accident' as EmergencyType,
    conditions: ['High-Velocity Kinetic Impact', 'Cabin Intrusion: Extreme', 'Multiple Entrapped Victims'],
    hazards: ['Fuel leak ignition hazard', 'Extrication delay', 'Spinal injury trauma'],
    accessibility: 'partially_blocked' as const,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340' width='100%25' height='100%25'%3E%3Crect width='600' height='340' fill='%23111827'/%3E%3Crect x='0' y='180' width='600' height='160' fill='%231f2937'/%3E%3Cline x1='0' y1='260' x2='600' y2='260' stroke='%23eab308' stroke-width='6' stroke-dasharray='30 20'/%3E%3Crect x='180' y='200' width='110' height='55' rx='6' fill='%23dc2626'/%3E%3Cpolygon points='280,215 360,230 330,255 270,240' fill='%2394a3b8'/%3E%3Ccircle cx='235' cy='185' r='12' fill='%2338bdf8' opacity='0.8'/%3E%3Ctext x='300' y='60' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23fca5a5' text-anchor='middle'%3EAI VISION: TRAFFIC COLLISION & ENTRAPMENT%3C/text%3E%3C/svg%3E",
  },
];

// ─── Text & Voice Presets for Instant 1-Click Testing ────────────────────────

const QUICK_TEXT_PRESETS = [
  {
    label: '🌊 தமிழ் வெள்ளம் (Flood TA)',
    lang: 'ta',
    text: 'கடும் வெள்ள நீர் சூழ்ந்துள்ளது. நடக்க முடியாத முதியவர் மற்றும் 3 குழந்தைகள் வீட்டில் உள்ளனர். உடனடியாக மீட்புப் படகு மற்றும் உணவு தேவை.',
  },
  {
    label: '🔥 தமிழ் தீ விபத்து (Fire TA)',
    lang: 'ta',
    text: 'தொழிற்சாலையின் 3வது மாடியில் திடீர் தீ விபத்து. கரும்புகை பரவுகிறது, இரண்டு தொழிலாளர்கள் தீக்காயங்களுடன் உள்ளே மாட்டிக்கொண்டுள்ளனர்.',
  },
  {
    label: '🌊 Kelani Flood (EN)',
    lang: 'en',
    text: 'Kelani river breached the embankment. Water level at 5 feet and rising fast. 4 family members including elderly father trapped on roof.',
  },
  {
    label: '🔥 Commercial Fire (EN)',
    lang: 'en',
    text: 'Major commercial warehouse fire on Galle Road. Heavy black smoke, explosion sounds heard, 2 workers trapped near storage bay.',
  },
  {
    label: '🏔️ නායයාම (Landslide SI)',
    lang: 'si',
    text: 'කඳුකර ප්‍රදේශයේ දැවැන්ත නායයාමක් සිදුවී මාර්ග අවහිර වී නිවාස 2ක් යටවී ඇත. වහාම ගලවා ගැනීමේ කණ්ඩායම් එවන්න.',
  },
  {
    label: '🚑 Medical Trauma (EN)',
    lang: 'en',
    text: 'Severe cardiac arrest and unconscious individual at Central Bus Terminal. Unresponsive, needs immediate CPR and ambulance defibrillator.',
  },
];

const QUICK_VOICE_SAMPLES = [
  {
    title: '🎙️ Tamil Emergency Audio (வெள்ளம்)',
    transcript: 'எங்கள் வீட்டைச் சுற்றி வெள்ள நீர் வேகமாக உயர்கிறது. எனது வயதான தந்தையும் இரண்டு சிறு குழந்தைகளும் வீட்டில் உள்ளனர். தயவுசெய்து எங்களை காப்பாற்றுங்கள்.',
    lang: 'ta',
  },
  {
    title: '🎙️ English Emergency Audio (Explosion)',
    transcript: 'Explosion at the local chemical plant! Intense flames spreading to adjacent buildings, multiple casualties with severe burns and smoke inhalation!',
    lang: 'en',
  },
  {
    title: '🎙️ Sinhala Emergency Audio (ගංවතුර)',
    transcript: 'ගංවතුර නිවස වටකර ඇත. වතුර මට්ටම වැඩි වෙමින් පවතී. වැඩිහිටියන් දෙදෙනෙකු සහ දරුවෙකු සිරවී සිටිති. කඩිනමින් පිහිට වන්න.',
    lang: 'si',
  },
];

// ─── AI Processing Animation ─────────────────────────────────────────────────

function AIProcessingAnimation({ stage, modalities }: { stage: string; modalities: string[] }) {
  const stages = [
    { id: 'language', label: 'Language Detection & NLP Tokenization', icon: '🌐' },
    { id: 'speech', label: 'Speech-to-Text & Acoustic Urgency Analysis', icon: '🎙️' },
    { id: 'image', label: 'Computer Vision & Scene Understanding', icon: '👁️' },
    { id: 'classify', label: 'Multi-Hazard Emergency Classification', icon: '📋' },
    { id: 'severity', label: 'Severity Matrix & Triage Scoring', icon: '⚡' },
    { id: 'vulnerability', label: 'Vulnerability & Life-Safety Scan', icon: '🛡️' },
    { id: 'resources', label: 'Resource Allocation & Agency Routing', icon: '📍' },
  ];

  const currentIdx = stages.findIndex((s) => s.id === stage);

  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <motion.div
          key={s.id}
          className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
            i === currentIdx ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/40'
          }`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
              i < currentIdx
                ? 'bg-nova-low/20 border border-nova-low text-er-green'
                : i === currentIdx
                ? 'bg-er-blue-light border border-nova-cyan text-er-blue'
                : 'bg-nova-border border border-em-border text-em-text-muted'
            }`}
          >
            {i < currentIdx ? (
              <CheckCircle className="w-3.5 h-3.5 text-er-green" />
            ) : i === currentIdx ? (
              <motion.div
                className="w-2 h-2 rounded-full bg-nova-cyan"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            ) : (
              <span>{i + 1}</span>
            )}
          </div>
          <span className={`text-xs ${i <= currentIdx ? 'text-nova-text font-medium' : 'text-em-text-muted'}`}>
            {s.icon} {s.label}
          </span>
          {i === currentIdx && (
            <div className="ml-auto typing-dots">
              <span />
              <span />
              <span />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Analysis Result Component ───────────────────────────────────────────────

function AnalysisResult({
  analysis,
  imagePreviewUrl,
  audioPreviewUrl,
  onDispatch,
  dispatched,
  targetTeam,
}: {
  analysis: AIAnalysis;
  imagePreviewUrl: string | null;
  audioPreviewUrl: string | null;
  onDispatch: () => void;
  dispatched: boolean;
  targetTeam?: RescueTeam | null;
}) {
  const [copied, setCopied] = useState(false);

  const langNames: Record<string, string> = {
    ta: 'தமிழ் (Tamil)',
    si: 'සිංහල (Sinhala)',
    en: 'English (EN)',
  };

  const copyDiagnostic = () => {
    const text = `ADRIAN - AI EMERGENCY ANALYSIS REPORT
---------------------------------------------
Emergency Type: ${analysis.emergencyType.toUpperCase()}
Severity: ${analysis.severity.toUpperCase()}
Confidence: ${analysis.confidenceScore}%
Detected Language: ${langNames[analysis.detectedLanguage] || analysis.detectedLanguage}
People Affected: ${analysis.peopleAffected}
Vulnerabilities: ${analysis.vulnerablePersons.map((v) => `${v.count} ${v.type}`).join(', ') || 'None'}
Required Resources: ${analysis.requiredResources.map((r) => `${r.quantity}x ${r.type} (${r.priority})`).join(', ')}
Recommended Action: ${analysis.recommendedAction}
Response Time: ${analysis.estimatedResponseTime} mins
Risk Factors: ${analysis.riskFactors.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('AI Diagnostic report copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top Banner Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/15 via-purple-500/10 to-nova-surface border border-red-500/30 relative overflow-hidden shadow-lg shadow-red-950/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-3xl">{getEmergencyTypeIcon(analysis.emergencyType)}</span>
              <span className="text-xl font-black text-nova-text uppercase tracking-wide">
                {analysis.emergencyType.replace('_', ' ')}
              </span>
              <SeverityBadge severity={analysis.severity} pulse size="lg" />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-em-border text-er-blue font-mono font-medium">
                🌐 {langNames[analysis.detectedLanguage] || analysis.detectedLanguage}
              </span>
              {analysis.inputModalities.map((mod) => (
                <span
                  key={mod}
                  className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono capitalize"
                >
                  {mod === 'text' && '📄 Text NLP'}
                  {mod === 'voice' && '🎙️ Voice Audio'}
                  {mod === 'image' && '👁️ Vision AI'}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black font-mono text-er-blue tracking-tight">
              {analysis.confidenceScore}%
            </div>
            <div className="text-[11px] uppercase tracking-wider text-em-text-muted font-bold">AI Confidence</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
          <div className="p-3 rounded-xl bg-white/80 border border-em-border/70 backdrop-blur-sm">
            <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1">People Affected</p>
            <p className="text-2xl font-black text-nova-text">{analysis.peopleAffected}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/80 border border-em-border/70 backdrop-blur-sm">
            <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1">Vulnerable Persons</p>
            <div className="space-y-0.5">
              {analysis.vulnerablePersons.length > 0 ? (
                analysis.vulnerablePersons.map((vp) => (
                  <span
                    key={vp.type}
                    className="inline-block mr-2 text-xs font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 capitalize"
                  >
                    ⚠️ {vp.count} {vp.type}
                  </span>
                ))
              ) : (
                <p className="text-sm text-em-text-dim">None detected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Vision Analysis Preview (if image provided) */}
      {analysis.imageAnalysis && (
        <div className="em-card border border-em-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-er-blue" />
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
                Computer Vision Analysis
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                analysis.imageAnalysis.accessibility === 'blocked'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : analysis.imageAnalysis.accessibility === 'partially_blocked'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : 'bg-green-500/20 text-green-400 border-green-500/40'
              }`}
            >
              Access: {analysis.imageAnalysis.accessibility.replace('_', ' ')}
            </span>
          </div>

          <div className="flex gap-4 items-start">
            {imagePreviewUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-em-border flex-shrink-0 bg-black">
                <img src={imagePreviewUrl} alt="Visual Evidence" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-nova-text">Visual Indicators Detected:</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.imageAnalysis.conditions.map((c, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded bg-er-blue-light border border-er-blue/30 text-er-blue"
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
              {analysis.imageAnalysis.hazards.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.imageAnalysis.hazards.map((h, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-300"
                    >
                      ⚠️ {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Transcript Preview (if voice provided) */}
      {analysis.voiceTranscript && (
        <div className="em-card border border-em-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
              Speech-to-Text Acoustic Record
            </p>
          </div>
          {audioPreviewUrl && (
            <div className="mb-2">
              <audio controls src={audioPreviewUrl} className="w-full h-9 rounded-lg" />
            </div>
          )}
          <blockquote className="text-sm italic text-nova-text p-2.5 rounded-lg bg-white/60 border border-em-border">
            "{analysis.voiceTranscript}"
          </blockquote>
        </div>
      )}

      {/* Required Resources */}
      <div className="em-card border border-em-border rounded-xl p-4">
        <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">
          Triage Required Resources
        </p>
        <div className="space-y-2">
          {analysis.requiredResources.map((res, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 border border-em-border/60"
            >
              <span className="text-sm font-medium text-nova-text">
                {res.quantity}× {res.type}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  res.priority === 'immediate'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : res.priority === 'urgent'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-er-blue-light text-er-blue border border-er-blue/20'
                }`}
              >
                {res.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <div className="em-card border border-em-border rounded-xl p-4">
          <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-2.5">
            Key Environmental & Life Risks
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.riskFactors.map((factor) => (
              <span
                key={factor}
                className="text-xs bg-orange-500/10 border border-orange-500/25 text-orange-300 px-2.5 py-1 rounded-lg"
              >
                ⚠️ {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendation */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-purple-300" />
          <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Tactical AI Recommendation</p>
        </div>
        <p className="text-sm text-nova-text font-medium leading-relaxed">"{analysis.recommendedAction}"</p>
        <div className="flex items-center justify-between mt-3 text-xs text-em-text-muted border-t border-purple-500/20 pt-2">
          <span>Estimated Response Time: <strong className="text-er-blue">{analysis.estimatedResponseTime} mins</strong></span>
          <span>Processed: {new Date(analysis.processedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Designated Rescue Squad */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-blue-300">Designated Rescue Squad</p>
            <p className="text-xs font-bold text-nova-text">{targetTeam?.name || 'Team Alpha'} · {targetTeam?.district || 'Colombo'}</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-green-500/15 border border-green-500/30 text-green-400">
          ✓ RESCUE PORTAL READY
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          onClick={onDispatch}
          disabled={dispatched}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
            dispatched
              ? 'bg-green-600/30 border border-green-500/50 text-green-300 cursor-default'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30 active:scale-[0.98]'
          }`}
        >
          {dispatched ? (
            <>
              <Check className="w-4 h-4" /> Dispatched to Rescue Squad
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Dispatch Responders & Create Incident
            </>
          )}
        </button>
        {dispatched && (
          <Link
            href="/rescue"
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
          >
            Open in Rescue Portal →
          </Link>
        )}
        <button
          onClick={copyDiagnostic}
          className="px-4 py-3 rounded-xl border border-em-border bg-white hover:bg-white/80 text-nova-text text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          title="Copy Diagnostic Summary"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main AI Analysis Page ───────────────────────────────────────────────────

export default function AIAnalysisPage() {
  const { incidents, rescueTeams, addIncident, addNotification, fetchTeams } = useNovaStore();

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const targetTeam =
    rescueTeams.find((t) => t.id === 'RT-ALPHA-01') ||
    rescueTeams.find((t) => t.status === 'available') ||
    rescueTeams[0] ||
    null;

  // Mode Selection: 'new' (analyze text/voice/image report) vs 'existing' (analyze registered incident)
  const [analysisSource, setAnalysisSource] = useState<'new' | 'existing'>('new');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  // Multimodal Input Tabs
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'image'>('text');

  // Text Input State
  const [inputText, setInputText] = useState(
    'House surrounded by flood water. Elderly father cannot walk. 3 children at home.'
  );

  // Audio Recording Hook
  const audio = useAudioRecorder();
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Synchronize audio transcript from hook if generated
  useEffect(() => {
    if (audio.transcript && audio.transcript.trim()) {
      setVoiceTranscript(audio.transcript.trim());
    }
  }, [audio.transcript]);

  // Image State
  const [selectedPresetImage, setSelectedPresetImage] = useState<typeof PRESET_IMAGES[0] | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageNotes, setImageNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Pipeline Execution States
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [result, setResult] = useState<AIAnalysis | null>(null);
  const [dispatched, setDispatched] = useState(false);

  // Handle uploaded image file
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    setUploadedImageFile(file);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setSelectedPresetImage(null);
    toast.success('Image loaded for Computer Vision analysis');
  };

  const removeUploadedImage = () => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }
    setUploadedImageFile(null);
    setUploadedImageUrl(null);
    setSelectedPresetImage(null);
  };

  // Determine active visual preview URL
  const activeImagePreview = uploadedImageUrl || selectedPresetImage?.url || null;

  // Comprehensive Multilingual Heuristic NLP & Computer Vision Analyzer
  const executeMultimodalAnalysis = async () => {
    setAnalyzing(true);
    setResult(null);
    setDispatched(false);

    // Determine modalities being processed
    const activeModalities: ('text' | 'voice' | 'image')[] = [];
    if (analysisSource === 'existing') {
      activeModalities.push('text');
    } else {
      if (inputText.trim()) activeModalities.push('text');
      if (voiceTranscript.trim() || audio.audioBlob) activeModalities.push('voice');
      if (activeImagePreview) activeModalities.push('image');
      if (activeModalities.length === 0) {
        // Default to active tab modality
        activeModalities.push(inputMode);
      }
    }

    // Step-by-step pipeline visualizer
    const stages = ['language', 'speech', 'image', 'classify', 'severity', 'vulnerability', 'resources'];
    for (const stage of stages) {
      setAnalysisStage(stage);
      await new Promise((r) => setTimeout(r, 380));
    }

    // If analyzing an existing registered incident
    if (analysisSource === 'existing' && selectedIncidentId) {
      const inc = incidents.find((i) => i.id === selectedIncidentId);
      if (inc) {
        if (inc.aiAnalysis) {
          setResult(inc.aiAnalysis);
          setAnalyzing(false);
          return;
        }
      }
    }

    // Combine textual tokens from text, voice transcript, and image notes
    const combinedCorpus = [
      analysisSource === 'existing' ? incidents.find((i) => i.id === selectedIncidentId)?.description || '' : inputText,
      voiceTranscript,
      imageNotes,
    ]
      .filter(Boolean)
      .join(' ');

    const lower = combinedCorpus.toLowerCase();

    // 1. Language Detection
    const hasTamil = /[\u0B80-\u0BFF]/.test(combinedCorpus);
    const hasSinhala = /[\u0D80-\u0DFF]/.test(combinedCorpus);
    const detectedLanguage = hasTamil ? 'ta' : hasSinhala ? 'si' : 'en';

    // 2. Emergency Classification across English, Tamil & Sinhala
    const floodKeywords = [
      'flood', 'water', 'river', 'submerg', 'drown', 'rain', 'overflow', 'kelani',
      'வெள்ளம்', 'தண்ணீர்', 'ஆறு', 'மழை', 'மூழ்கிய', 'நீர்ப்பெருக்கு',
      'ගංවතුර', 'වතුර', 'ගඟ', 'වැසි', 'යටවී'
    ];
    const fireKeywords = [
      'fire', 'smoke', 'burn', 'flame', 'explosion', 'blaze', 'gas',
      'தீ', 'நெருப்பு', 'புகை', 'வெடிப்பு', 'எரிகிற', 'தீக்காயம்',
      'ගින්න', 'දුම', 'දැවීම', 'පිපිරීම'
    ];
    const landslideKeywords = [
      'landslide', 'mud', 'rockfall', 'slope', 'earthslip', 'hill',
      'மண்சரிவு', 'மண்', 'பாறை', 'மலை',
      'නායයාම', 'පස්', 'කන්ද', 'ගල්'
    ];
    const medicalKeywords = [
      'heart', 'bleed', 'stroke', 'unconscious', 'breath', 'injured', 'victim', 'fracture', 'cpr', 'cardiac',
      'மருத்துவம்', 'காயம்', 'மயக்கம்', 'நெஞ்சுவலி', 'ரத்தம்', 'நோயாளி', 'ஆம்புலன்ஸ்',
      'රෝහල', 'අසනීප', 'තුවාල', 'හෘදයාබාධ', 'ලේ', 'සිහිසුන්'
    ];
    const accidentKeywords = [
      'accident', 'crash', 'collision', 'collapse', 'rubble', 'vehicle', 'stair',
      'விபத்து', 'இடிந்து', 'கட்டிடம்', 'வாகனம்',
      'අනතුර', 'කඩා වැටීම', 'පෙරලී'
    ];

    let emergencyType: EmergencyType = 'other';
    if (selectedPresetImage) {
      emergencyType = selectedPresetImage.type;
    } else if (floodKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k))) {
      emergencyType = 'flood';
    } else if (fireKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k))) {
      emergencyType = 'fire';
    } else if (landslideKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k))) {
      emergencyType = 'landslide';
    } else if (medicalKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k))) {
      emergencyType = 'medical';
    } else if (accidentKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k))) {
      emergencyType = 'road_accident';
    } else {
      emergencyType = 'flood'; // Fallback sensible default for humanitarian disaster
    }

    // 3. Vulnerability Detection (Elderly, Child, Disabled, Medical)
    const elderlyTerms = [
      'elderly', 'old', 'father', 'mother', 'grandfather', 'grandmother', 'senior', 'aged',
      'முதியவர்', 'தாத்தா', 'பாட்டி', 'அப்பா', 'அம்மா', 'வயதான',
      'වැඩිහිටි', 'සීයා', 'ආච්චි'
    ];
    const childTerms = [
      'child', 'children', 'baby', 'infant', 'kid', 'toddler', 'son', 'daughter',
      'குழந்தை', 'பிள்ளைகள்', 'பாப்பா', 'சிறுவர்',
      'ළමයා', 'දරුවන්', 'බිළිඳා'
    ];
    const mobilityTerms = [
      'cannot walk', 'walk', 'wheelchair', 'paralyzed', 'bedridden', 'disabled', 'handicapped',
      'நடக்க முடியாத', 'ஊனமுற்ற', 'படுக்கை',
      'ඇවිදීමට නොහැකි', 'ආබාධිත'
    ];

    const hasElderly = elderlyTerms.some((k) => lower.includes(k) || combinedCorpus.includes(k));
    const hasChild = childTerms.some((k) => lower.includes(k) || combinedCorpus.includes(k));
    const hasMobility = mobilityTerms.some((k) => lower.includes(k) || combinedCorpus.includes(k));

    const vulnerable: VulnerablePerson[] = [];
    if (hasElderly) vulnerable.push({ type: 'elderly', count: 1 });
    if (hasChild) {
      // Look for digit near child terms, else 2
      const match = lower.match(/(\d+)\s*(children|child|குழந்தை|ළමයා)/);
      vulnerable.push({ type: 'child', count: match ? parseInt(match[1], 10) : 2 });
    }
    if (hasMobility) vulnerable.push({ type: 'disabled', count: 1 });

    // 4. Severity & Criticality Assessment
    const criticalKeywords = [
      'trapped', 'sinking', 'roof', 'unconscious', 'urgent', 'critical', 'immediate', 'bleed', 'explosion', 'cannot walk',
      'சிக்கியுள்ளனர்', 'மாட்டிக்கொண்டு', 'அவசரம்', 'ஆபத்து', 'நடக்க முடியாத',
      'සිරවී', 'හදිසි', 'මරණීය', 'අනතුරුදායක'
    ];
    const isCritical =
      vulnerable.length > 1 ||
      criticalKeywords.some((k) => lower.includes(k) || combinedCorpus.includes(k)) ||
      emergencyType === 'fire' ||
      emergencyType === 'landslide';

    const severity: SeverityLevel = isCritical ? 'critical' : 'high';

    // 5. Dynamic Resources based on disaster modality & type
    const requiredResources: ResourceRequirement[] = [];
    if (emergencyType === 'flood') {
      requiredResources.push({ type: 'Rigid Inflatable Rescue Boat', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Swift Water Rescue Specialists', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Emergency Ration Pack (Family)', quantity: 8, priority: 'urgent' });
      requiredResources.push({ type: 'High-Volume Drainage Pump', quantity: 1, priority: 'normal' });
    } else if (emergencyType === 'fire') {
      requiredResources.push({ type: 'Major Fire Engine / Water Bowzer', quantity: 2, priority: 'immediate' });
      requiredResources.push({ type: 'Breathing Apparatus Hazmat Squad', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Trauma Burn Ambulatory Unit', quantity: 1, priority: 'immediate' });
    } else if (emergencyType === 'landslide') {
      requiredResources.push({ type: 'Heavy Hydraulic Excavation Unit', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Urban Search & Rescue (USAR) Canine Team', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Structural Stabilization Squad', quantity: 1, priority: 'urgent' });
    } else if (emergencyType === 'road_accident') {
      requiredResources.push({ type: 'Hydraulic Extrication Jaws-of-Life', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Advanced Life Support (ALS) Ambulance', quantity: 2, priority: 'immediate' });
    } else {
      requiredResources.push({ type: 'Advanced Life Support Ambulance', quantity: 1, priority: 'immediate' });
      requiredResources.push({ type: 'Critical Care Paramedic Unit', quantity: 1, priority: 'immediate' });
    }

    // 6. Computer Vision Tag Synthesis
    let imageAnalysisResult: ImageAnalysisResult | undefined = undefined;
    if (activeImagePreview) {
      if (selectedPresetImage) {
        imageAnalysisResult = {
          conditions: selectedPresetImage.conditions,
          hazards: selectedPresetImage.hazards,
          structuralDamage: selectedPresetImage.type === 'fire' || selectedPresetImage.type === 'landslide',
          waterPresence: selectedPresetImage.type === 'flood',
          crowding: false,
          accessibility: selectedPresetImage.accessibility,
        };
      } else {
        imageAnalysisResult = {
          conditions: ['Visual Pattern Match: Emergency Scene', 'Optical Anomaly Detected'],
          hazards: ['Debris obstruction', 'Active physical hazard'],
          structuralDamage: true,
          waterPresence: emergencyType === 'flood',
          crowding: false,
          accessibility: 'partially_blocked',
        };
      }
    }

    // 7. Recommended Action & Risk Factors
    const riskFactors = [
      ...(emergencyType === 'flood' ? ['Water ingress danger', 'Submerged power grid hazard'] : []),
      ...(emergencyType === 'fire' ? ['Smoke asphyxiation hazard', 'Structural flashover potential'] : []),
      ...(emergencyType === 'landslide' ? ['Secondary slope collapse risk', 'Access route severed'] : []),
      ...(hasElderly ? ['Mobility-impaired individual on scene'] : []),
      ...(hasChild ? ['Minors vulnerable to environmental exposure'] : []),
    ];

    const recommendedAction = isCritical
      ? `Dispatch immediate priority tactical rescue unit. Initiate multi-agency triage protocol and clear direct evacuation route.`
      : `Dispatch standard emergency response team to assess site stabilization and provide medical/relief supplies.`;

    const recommendedAgencies: AgencyType[] =
      emergencyType === 'flood'
        ? ['search_rescue', 'disaster_response', 'command_centre']
        : emergencyType === 'fire'
        ? ['fire_rescue', 'hospital', 'police']
        : emergencyType === 'landslide'
        ? ['search_rescue', 'disaster_response', 'hospital']
        : ['hospital', 'ambulance', 'police'];

    // Boost confidence if multiple modalities are present
    const confidenceScore = Math.min(97, 85 + activeModalities.length * 4 + (vulnerable.length > 0 ? 3 : 1));

    const totalAffected = Math.max(1, (hasElderly ? 1 : 0) + (hasChild ? 2 : 1));

    const newAnalysis: AIAnalysis = {
      id: `analysis-${Date.now()}`,
      incidentId: selectedIncidentId || `INC-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      emergencyType,
      severity,
      confidenceScore,
      peopleAffected: totalAffected,
      vulnerablePersons: vulnerable,
      requiredResources,
      recommendedAction,
      detectedLanguage,
      processedAt: new Date().toISOString(),
      inputModalities: activeModalities,
      imageAnalysis: imageAnalysisResult,
      riskFactors,
      estimatedResponseTime: isCritical ? 7 : 14,
      recommendedAgencies,
      voiceTranscript: voiceTranscript || undefined,
    };

    setResult(newAnalysis);
    setAnalyzing(false);
    toast.success('AI Multimodal Analysis Complete', {
      description: `${emergencyType.toUpperCase()} emergency triaged with ${confidenceScore}% confidence.`,
    });
  };

  // Dispatch incident directly into store & backend
  const handleDispatchIncident = async () => {
    if (!result) return;
    const newIncId = result.incidentId.startsWith('INC-') ? result.incidentId : `NOV-${Math.floor(1000 + Math.random() * 9000)}`;

    const designatedTeam = targetTeam || {
      id: 'RT-ALPHA-01',
      name: 'Team Alpha',
      district: 'Colombo',
    };

    const newIncident: Incident = {
      id: newIncId,
      trackingCode: newIncId,
      type: result.emergencyType,
      severity: result.severity,
      status: 'assigned',
      title: `${result.emergencyType.replace('_', ' ').toUpperCase()} — Multi-agency Response Needed`,
      description:
        inputText || voiceTranscript || `AI-analyzed ${result.emergencyType} emergency with ${result.peopleAffected} affected.`,
      location: {
        lat: 6.9271 + (Math.random() - 0.5) * 0.04,
        lng: 79.8612 + (Math.random() - 0.5) * 0.04,
        address: 'Live Incident Zone — Multi-Agency Dispatch',
        district: 'Colombo',
        zone: 'Zone 01',
      },
      assignedTeamId: designatedTeam.id,
      assignedTeam: designatedTeam.id,
      assignedTeamName: designatedTeam.name,
      recommendedAgencies: result.recommendedAgencies || ['search_rescue', 'disaster_response'],
      reportedBy: 'NOVA Tactical AI',
      reporterName: 'AI Multi-Modal Dispatch Engine',
      reporterPhone: '+94 11 243 4242',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      peopleAffected: result.peopleAffected,
      aiAnalysis: result,
      notes: [],
      attachments: [],
      updates: [
        {
          id: `upd-${Date.now()}`,
          status: 'assigned',
          message: `Incident analyzed via AI Emergency Network and dispatched directly to ${designatedTeam.name}.`,
          updatedBy: 'NOVA Tactical AI',
          updatedAt: new Date().toISOString(),
        },
      ],
      resourcesAllocated: [],
      priority: result.severity === 'critical' ? 1 : 2,
    };

    // Demo mode: the local store is the single source of truth, so the
    // incident is simply added there directly (no backend round-trip).
    addIncident(newIncident);
    addNotification({
      id: `notif-${Date.now()}`,
      type: 'critical_incident',
      title: `🚨 Dispatched to ${designatedTeam.name}: ${newIncident.title}`,
      message: `${result.emergencyType.toUpperCase()} at ${newIncident.location.address}. AI Confidence: ${result.confidenceScore}%.`,
      severity: result.severity,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: newIncident.id,
      relatedType: 'incident',
    });

    // Cross-tab broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('nova-emergency-bus');
        bc.postMessage({ type: 'incident_created', data: newIncident });
        bc.postMessage({
          type: 'mission_assigned',
          data: {
            incidentId: newIncident.id,
            teamId: designatedTeam.id,
            teamName: designatedTeam.name,
          },
        });
        bc.close();
      } catch {}
    }

    setDispatched(true);
    toast.success('Incident Dispatched to Rescue Squad!', {
      description: `Assigned ID: ${newIncident.trackingCode || newIncident.id} to ${designatedTeam.name}. Live in Rescue Portal.`,
    });
  };

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="officer" />
      <DashboardShell role="officer">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold font-display text-nova-text">AI Emergency Analysis</h1>
              </div>
              <p className="text-sm text-em-text-dim mt-1">
                Multimodal AI triages and cross-references Text, Voice Audio, and Computer Vision reports
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-em-border text-xs text-em-text-muted">
              <Sparkles className="w-3.5 h-3.5 text-er-blue" />
              <span>Tri-Lingual NLP (EN / தமிழ் / සිංහල)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ─── Left Column: Source Selection & Multimodal Inputs ─── */}
            <div className="space-y-4">
              {/* Source Mode Toggle */}
              <div className="em-card border border-em-border rounded-xl p-1.5 flex gap-1 bg-white/60">
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisSource('new');
                    setResult(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    analysisSource === 'new'
                      ? 'bg-er-blue-light border border-er-blue/40 text-er-blue shadow-sm'
                      : 'text-em-text-dim hover:text-nova-text hover:bg-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze New Multimodal Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisSource('existing');
                    if (!selectedIncidentId && incidents.length > 0) {
                      setSelectedIncidentId(incidents[0].id);
                    }
                    setResult(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    analysisSource === 'existing'
                      ? 'bg-er-blue-light border border-er-blue/40 text-er-blue shadow-sm'
                      : 'text-em-text-dim hover:text-nova-text hover:bg-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Analyze Registered Incident
                </button>
              </div>

              {/* If Existing Incident Mode */}
              {analysisSource === 'existing' && (
                <div className="em-card border border-em-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
                    Select Incident from Registry
                  </p>
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => {
                      setSelectedIncidentId(e.target.value);
                      setResult(null);
                    }}
                    className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-sm text-nova-text focus:outline-none focus:border-er-blue/40"
                  >
                    {incidents.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.id} — {i.title} [{i.severity.toUpperCase()}]
                      </option>
                    ))}
                  </select>

                  {selectedIncidentId && (
                    <div className="p-3 rounded-lg bg-white/50 border border-em-border text-xs space-y-1">
                      <p className="text-nova-text font-medium">
                        {incidents.find((i) => i.id === selectedIncidentId)?.description}
                      </p>
                      <p className="text-em-text-muted">
                        Location: {incidents.find((i) => i.id === selectedIncidentId)?.location?.address || 'GPS Coordinates logged'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* If New Multimodal Report Mode */}
              {analysisSource === 'new' && (
                <div className="em-card border border-em-border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
                      Multimodal Evidence Inputs
                    </p>
                    <span className="text-[11px] text-er-blue font-mono font-medium">
                      Select tab to provide or edit input
                    </span>
                  </div>

                  {/* Mode Tab Switchers */}
                  <div className="flex gap-2">
                    {[
                      {
                        mode: 'text',
                        label: 'Text NLP',
                        icon: <FileText className="w-3.5 h-3.5" />,
                        badge: inputText.trim() ? '✓ Ready' : null,
                      },
                      {
                        mode: 'voice',
                        label: 'Voice Audio',
                        icon: <Mic className="w-3.5 h-3.5" />,
                        badge: audio.audioBlob || voiceTranscript ? '✓ Ready' : audio.isRecording ? '🔴 REC' : null,
                      },
                      {
                        mode: 'image',
                        label: 'Computer Vision',
                        icon: <ImageIcon className="w-3.5 h-3.5" />,
                        badge: activeImagePreview ? '✓ Loaded' : null,
                      },
                    ].map((m) => (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setInputMode(m.mode as 'text' | 'voice' | 'image')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          inputMode === m.mode
                            ? 'bg-er-blue-light border-er-blue/30 text-er-blue shadow-sm'
                            : 'border-em-border text-em-text-dim hover:border-em-border-strong hover:text-nova-text'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                        {m.badge && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              m.badge.includes('REC')
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-green-500/20 text-green-300'
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* ──── Tab 1: Text Input ──── */}
                  {inputMode === 'text' && (
                    <div className="space-y-3">
                      <div>
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-em-border rounded-xl px-4 py-3 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/30 resize-none transition-all leading-relaxed"
                          placeholder="Type or paste emergency situation report in English, Tamil, or Sinhala..."
                        />
                        <div className="flex items-center justify-between text-[11px] text-em-text-muted mt-1 px-1">
                          <span>Tri-lingual auto-detection enabled</span>
                          <span>{inputText.length} characters</span>
                        </div>
                      </div>

                      {/* Quick Text Preset Chips */}
                      <div>
                        <p className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider mb-1.5">
                          Quick Scenario Presets (Click to Test):
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {QUICK_TEXT_PRESETS.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setInputText(p.text);
                                toast.info(`Loaded scenario: ${p.label}`);
                              }}
                              className="text-left text-xs p-2 rounded-lg bg-white/70 border border-em-border/70 hover:border-er-blue/40 hover:bg-white text-em-text-dim hover:text-nova-text transition-all truncate"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ──── Tab 2: Voice Audio Recording ──── */}
                  {inputMode === 'voice' && (
                    <div className="space-y-4 py-2">
                      {/* Interactive Mic Recorder */}
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/50 border border-em-border">
                        <div className="relative">
                          <motion.button
                            type="button"
                            onClick={() => {
                              if (audio.isRecording) {
                                audio.stopRecording();
                              } else {
                                audio.startRecording();
                              }
                            }}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                              audio.isRecording
                                ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                                : 'bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {audio.isRecording ? (
                              <Square className="w-8 h-8 fill-current" />
                            ) : (
                              <Mic className="w-8 h-8" />
                            )}
                          </motion.button>
                          {audio.isRecording && (
                            <motion.div
                              className="absolute -inset-2 rounded-full border-2 border-red-500/40 pointer-events-none"
                              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            />
                          )}
                        </div>

                        {/* Status label & timer */}
                        <div className="text-center">
                          {audio.isRecording ? (
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-red-400 flex items-center justify-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                Recording Voice ({audio.formattedTime})... Click to Stop
                              </p>
                              <div className="flex justify-center gap-1 py-1">
                                {[...Array(8)].map((_, i) => (
                                  <motion.span
                                    key={i}
                                    className="w-1 bg-red-400 rounded-full"
                                    animate={{ height: ['8px', '24px', '8px'] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                      delay: i * 0.08,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : audio.audioUrl ? (
                            <p className="text-xs font-bold text-green-400">
                              ✓ Voice Audio Captured ({audio.formattedTime || '00:04'})
                            </p>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-nova-text">
                                Click red button to record voice note
                              </p>
                              <p className="text-xs text-em-text-muted">
                                Live speech-to-text with language recognition
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Audio Preview if recorded */}
                        {audio.audioUrl && (
                          <div className="w-full flex items-center gap-2 pt-1">
                            <audio controls src={audio.audioUrl} className="flex-1 h-9 rounded-lg" />
                            <button
                              type="button"
                              onClick={() => audio.resetRecording()}
                              className="p-2 rounded-lg border border-em-border bg-white hover:bg-white/80 text-em-text-muted hover:text-red-400 text-xs"
                              title="Delete Audio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Transcribed Speech Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-em-text-muted uppercase tracking-wider">
                            Speech-to-Text Transcript (Editable):
                          </label>
                          {voiceTranscript && (
                            <button
                              type="button"
                              onClick={() => setVoiceTranscript('')}
                              className="text-[11px] text-em-text-muted hover:text-nova-text"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <textarea
                          value={voiceTranscript}
                          onChange={(e) => setVoiceTranscript(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-em-border rounded-xl px-4 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/30 resize-none"
                          placeholder="Transcribed words appear here automatically, or you can use simulated audio samples below..."
                        />
                      </div>

                      {/* Simulated Audio Presets */}
                      <div>
                        <p className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider mb-1.5">
                          Simulate Voice Samples (No mic required):
                        </p>
                        <div className="space-y-1.5">
                          {QUICK_VOICE_SAMPLES.map((sample, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setVoiceTranscript(sample.transcript);
                                toast.info(`Loaded audio transcript: ${sample.title}`);
                              }}
                              className="w-full text-left text-xs p-2.5 rounded-lg bg-white/70 border border-em-border/70 hover:border-purple-500/40 hover:bg-white text-em-text-dim hover:text-nova-text transition-all flex items-center justify-between"
                            >
                              <span className="font-medium text-nova-text">{sample.title}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                {sample.lang}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ──── Tab 3: Computer Vision Image Upload ──── */}
                  {inputMode === 'image' && (
                    <div className="space-y-4">
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                          }
                        }}
                      />

                      {/* Upload / Preview Area */}
                      {activeImagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-er-blue/40 bg-black/60 group">
                          <div className="aspect-video w-full max-h-52 overflow-hidden flex items-center justify-center bg-black">
                            <img
                              src={activeImagePreview}
                              alt="Visual Evidence"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="p-3 bg-white/90 border-t border-em-border flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-nova-text">
                                {selectedPresetImage ? selectedPresetImage.title : uploadedImageFile?.name || 'Uploaded Image'}
                              </p>
                              <p className="text-[11px] text-er-blue">
                                {selectedPresetImage
                                  ? `Preset: ${selectedPresetImage.tag}`
                                  : `${((uploadedImageFile?.size || 0) / 1024).toFixed(1)} KB — Ready for CV`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeUploadedImage}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleImageUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className="border-2 border-dashed border-em-border rounded-xl p-6 text-center hover:border-er-blue/30 hover:bg-er-blue-light transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white border border-em-border mx-auto mb-2.5 flex items-center justify-center text-em-text-muted group-hover:text-er-blue">
                            <Upload className="w-6 h-6 text-er-blue" />
                          </div>
                          <p className="text-sm font-semibold text-nova-text">
                            Drop incident image or click to upload
                          </p>
                          <p className="text-xs text-em-text-muted mt-1">
                            Supports PNG, JPG, WEBP. AI detects flood water level, fire plumes, rubble & crowds.
                          </p>
                        </div>
                      )}

                      {/* Preset Visual Disaster Presets */}
                      <div>
                        <p className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider mb-2">
                          Or Select an Incident Visual Preset:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {PRESET_IMAGES.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setSelectedPresetImage(preset);
                                setUploadedImageFile(null);
                                setUploadedImageUrl(null);
                                toast.info(`Selected Preset: ${preset.title}`);
                              }}
                              className={`text-left p-2.5 rounded-xl border transition-all ${
                                selectedPresetImage?.id === preset.id
                                  ? 'bg-er-blue-light border-nova-cyan text-nova-text shadow-sm'
                                  : 'bg-white/70 border-em-border/70 hover:border-em-border-strong text-em-text-dim'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">{getEmergencyTypeIcon(preset.type)}</span>
                                <span className="text-xs font-bold text-nova-text">{preset.title}</span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-em-border text-er-blue">
                                {preset.tag}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional Context Notes */}
                      <div>
                        <label className="text-[11px] font-bold text-em-text-muted uppercase tracking-wider block mb-1">
                          Field Notes for Visual (Optional):
                        </label>
                        <input
                          type="text"
                          value={imageNotes}
                          onChange={(e) => setImageNotes(e.target.value)}
                          placeholder="e.g., Flood reaching rooftop level, power lines sparking..."
                          className="w-full bg-white border border-em-border rounded-xl px-3 py-2 text-xs text-nova-text focus:outline-none focus:border-er-blue/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Multimodal Active Status Summary */}
                  <div className="p-3 rounded-xl bg-white/40 border border-em-border text-xs flex items-center justify-between">
                    <span className="text-em-text-muted">Active Modalities for Synthesis:</span>
                    <div className="flex gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                          inputText.trim() ? 'bg-er-blue-light text-er-blue font-bold' : 'text-em-text-muted opacity-40'
                        }`}
                      >
                        📄 Text
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                          voiceTranscript.trim() || audio.audioBlob
                            ? 'bg-purple-500/20 text-purple-300 font-bold'
                            : 'text-em-text-muted opacity-40'
                        }`}
                      >
                        🎙️ Voice
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                          activeImagePreview ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-em-text-muted opacity-40'
                        }`}
                      >
                        👁️ Vision
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Trigger Button ─── */}
              <motion.button
                type="button"
                onClick={executeMultimodalAnalysis}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
                whileHover={!analyzing ? { scale: 1.01 } : {}}
                whileTap={!analyzing ? { scale: 0.99 } : {}}
              >
                {analyzing ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    Analyzing Multimodal Stream...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 text-purple-200" />
                    Run AI Multimodal Analysis
                  </>
                )}
              </motion.button>

              {/* Pipeline Processing Stages */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    className="em-card border border-purple-500/30 rounded-xl p-4 scan-line"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-purple-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        NOVA Neural Pipeline Active...
                      </p>
                    </div>
                    <AIProcessingAnimation
                      stage={analysisStage}
                      modalities={[
                        ...(inputText.trim() ? ['text'] : []),
                        ...(voiceTranscript.trim() ? ['voice'] : []),
                        ...(activeImagePreview ? ['image'] : []),
                      ]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Right Column: Results Panel ─── */}
            <div>
              {result ? (
                <AnalysisResult
                  analysis={result}
                  imagePreviewUrl={activeImagePreview}
                  audioPreviewUrl={audio.audioUrl}
                  onDispatch={handleDispatchIncident}
                  dispatched={dispatched}
                  targetTeam={targetTeam}
                />
              ) : (
                <div className="em-card border border-em-border rounded-xl p-8 h-full min-h-[420px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-base font-bold text-nova-text mb-2">Multimodal AI Ready</h3>
                  <p className="text-sm text-em-text-dim max-w-sm">
                    Enter text in English, Tamil, or Sinhala, record voice, or attach an image. Then click{' '}
                    <strong className="text-purple-300">"Run AI Multimodal Analysis"</strong> to generate life-safety triage.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-em-text-muted w-full max-w-md">
                    <div className="p-2.5 rounded-lg bg-white border border-em-border">
                      <div className="font-bold text-er-blue">&lt; 3 sec</div>
                      <div className="text-[10px] mt-0.5">Pipeline Latency</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-em-border">
                      <div className="font-bold text-er-blue">3 Languages</div>
                      <div className="text-[10px] mt-0.5">EN / தமிழ் / සිංහල</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-em-border">
                      <div className="font-bold text-er-blue">3 Modalities</div>
                      <div className="text-[10px] mt-0.5">Text, Voice, Vision</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
