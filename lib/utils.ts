import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SeverityLevel, IncidentStatus, TeamStatus, EmergencyType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Severity Utilities ──────────────────────────────────────

export function getSeverityColor(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: 'text-er-red-dark',
    high:     'text-er-orange',
    medium:   'text-yellow-700',
    low:      'text-er-green',
  };
  return map[severity] || 'text-em-text-muted';
}

export function getSeverityBg(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: 'bg-er-red-light border-er-red/30 text-er-red-dark',
    high:     'bg-er-orange-light border-er-orange/30 text-er-orange',
    medium:   'bg-yellow-50 border-yellow-300 text-yellow-700',
    low:      'bg-er-green-light border-er-green/30 text-er-green',
  };
  return map[severity] || '';
}

export function getSeverityDot(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    critical: 'bg-er-red',
    high:     'bg-er-orange',
    medium:   'bg-yellow-400',
    low:      'bg-er-green',
  };
  return map[severity] || 'bg-gray-400';
}

import { localizeText, formatTimeAgo as i18nTimeAgo, getSeverityLabel as i18nSeverityLabel, getStatusLabel as i18nStatusLabel, getEmergencyTypeLabel as i18nEmergencyTypeLabel, getRiskLabel as i18nRiskLabel } from './i18n';

export function getSeverityLabel(severity: SeverityLevel, lang: string = 'en'): string {
  return i18nSeverityLabel(severity, lang);
}

// ─── Status Utilities ────────────────────────────────────────

export function getStatusLabel(status: IncidentStatus | TeamStatus | string, lang: string = 'en'): string {
  return i18nStatusLabel(status, lang);
}

export function getStatusColor(status: IncidentStatus): string {
  const colors: Record<IncidentStatus, string> = {
    submitted:    'text-em-text-muted',
    analysing:    'text-er-blue',
    verified:     'text-yellow-700',
    dispatched:   'text-er-blue',
    acknowledged: 'text-er-blue',
    en_route:     'text-er-orange',
    on_scene:     'text-er-red-dark',
    transporting: 'text-purple-700',
    resolved:     'text-er-green',
    cancelled:    'text-em-text-disabled',
    reported:     'text-em-text-muted',
    ai_analyzed:  'text-er-blue',
    prioritized:  'text-yellow-700',
    assigned:     'text-er-blue',
    responding:   'text-er-red',
    closed:       'text-em-text-disabled',
  };
  return colors[status] || 'text-em-text-muted';
}

export function getTeamStatusColor(status: TeamStatus): string {
  const colors: Record<TeamStatus, string> = {
    available:   'text-er-green',
    assigned:    'text-er-blue',
    en_route:    'text-er-orange',
    on_scene:    'text-er-red-dark',
    unavailable: 'text-em-text-disabled',
  };
  return colors[status] || 'text-em-text-muted';
}

// ─── Emergency Type Utilities ────────────────────────────────

export function getEmergencyTypeLabel(type: EmergencyType, lang: string = 'en'): string {
  return i18nEmergencyTypeLabel(type, lang);
}

export function getEmergencyTypeIcon(type: EmergencyType): string {
  const icons: Record<EmergencyType, string> = {
    flood: '🌊',
    landslide: '⛰️',
    fire: '🔥',
    road_accident: '🚗',
    medical: '🚑',
    crime: '🚨',
    missing_person: '👤',
    building_collapse: '🏚️',
    severe_weather: '🌪️',
    other: '⚠️',
    unknown: '⚠️',
  };
  return icons[type] || '⚠️';
}

// ─── Time Utilities ──────────────────────────────────────────

export function formatTimeAgo(dateStr: string, lang: string = 'en'): string {
  return i18nTimeAgo(dateStr, lang);
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-LK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Number Utilities ────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ─── Risk Level ──────────────────────────────────────────────

export function getRiskColor(riskPercent: number): string {
  if (riskPercent >= 80) return 'text-er-red-dark';
  if (riskPercent >= 60) return 'text-er-orange';
  if (riskPercent >= 40) return 'text-yellow-700';
  return 'text-er-green';
}

export function getRiskBg(riskPercent: number): string {
  if (riskPercent >= 80) return 'bg-er-red';
  if (riskPercent >= 60) return 'bg-er-orange';
  if (riskPercent >= 40) return 'bg-yellow-400';
  return 'bg-er-green';
}

export function getRiskLabel(riskPercent: number, lang: string = 'en'): string {
  return i18nRiskLabel(riskPercent, lang);
}

// ─── Media URL Resolver ──────────────────────────────────────

export function resolveMediaUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim() || url === 'null' || url === 'undefined' || url.endsWith('/null') || url.endsWith('/undefined')) {
    return '';
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  // Frontend-only demo build: there's no backend host to resolve relative
  // media paths against (all captured photos/audio use blob:/data: URLs
  // already handled above), so just return the value unchanged.
  return trimmed;
}
