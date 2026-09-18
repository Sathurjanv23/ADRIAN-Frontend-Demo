'use client';

import { motion } from 'framer-motion';
import { cn, getEmergencyTypeIcon } from '@/lib/utils';
import { SeverityBadge } from './SeverityBadge';
import type { Incident } from '@/types';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface EmergencyCardProps {
  incident: Incident;
  onClick?: () => void;
  variant?: 'feed' | 'list' | 'compact';
  href?: string;
}

export function EmergencyCard({ incident, onClick, variant = 'feed', href }: EmergencyCardProps) {
  const { t, localize, timeAgo } = useTranslation();
  const isCritical = incident.severity === 'critical';

  const content = (
    <motion.div
      className={cn(
        'bg-white rounded-2xl border p-4 cursor-pointer transition-all duration-200 shadow-em-sm',
        isCritical
          ? 'border-er-red/30 hover:border-er-red/60 hover:shadow-em-red'
          : 'border-em-border hover:border-em-border-strong hover:shadow-em-md',
        variant === 'compact' && 'p-3'
      )}
      onClick={onClick}
      whileHover={{ y: -1 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      layout
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0',
              isCritical ? 'bg-red-500/15' : 'bg-em-subtle'
            )}
          >
            {getEmergencyTypeIcon(incident.type)}
          </div>
          <div>
            <p className="text-xs font-mono text-em-text-muted">{incident.id}</p>
            <p className={cn('text-sm font-semibold leading-tight mt-0.5', isCritical ? 'text-er-red-dark' : 'text-em-text')}>
              {localize(incident.title)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <SeverityBadge severity={incident.severity} pulse={isCritical} size="sm" />
          {isCritical && (
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Location, Time & Evidence Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5 text-xs text-em-text-dim">
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-er-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{localize(incident.location?.district || 'GPS')} {incident.location?.zone && `· ${localize(incident.location.zone)}`}</span>
          </span>
          <span>·</span>
          <span>{timeAgo(incident.reportedAt)}</span>
        </div>

        {/* Evidence Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {incident.audioUrl && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-er-blue-light text-er-blue font-mono" title="Voice recording attached">
              🎙️ Voice
            </span>
          )}
          {incident.photoUrls && incident.photoUrls.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono" title="Photo evidence attached">
              📷 Photo
            </span>
          )}
          {incident.isSilentSos && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold" title="Silent SOS mode">
              🤫 Silent
            </span>
          )}
        </div>
      </div>

      {/* AI Analysis Row */}
      {incident.aiAnalysis && variant !== 'compact' && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200">
          <div className="w-5 h-5 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zM8 10a2 2 0 104 0 2 2 0 00-4 0z"/>
            </svg>
          </div>
          <p className="text-xs text-purple-700 font-semibold">
            AI: {incident.aiAnalysis.confidenceScore}% confidence — {localize(incident.aiAnalysis.recommendedAction).slice(0, 60)}...
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-em-text-dim">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {incident.peopleAffected} {t('common.affected')}
          </span>
          {incident.assignedTeamName && (
            <span className="flex items-center gap-1 text-er-blue font-semibold">
              <span className="w-2 h-2 rounded-full bg-er-blue inline-block" />
              {localize(incident.assignedTeamName)}
            </span>
          )}
        </div>
        {incident.eta !== undefined && incident.status === 'en_route' && (
          <span className="text-xs font-semibold text-er-orange bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            {t('common.eta')} {incident.eta}{t('common.min')}
          </span>
        )}
      </div>
    </motion.div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
