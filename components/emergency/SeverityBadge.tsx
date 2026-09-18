'use client';

import { motion } from 'framer-motion';
import { cn, getSeverityBg } from '@/lib/utils';
import type { SeverityLevel } from '@/types';
import { useTranslation } from '@/lib/i18n';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const dotColors: Record<SeverityLevel, string> = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

export function SeverityBadge({ severity, className, pulse = false, size = 'md' }: SeverityBadgeProps) {
  const { severityLabel } = useTranslation();
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border',
        getSeverityBg(severity),
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex">
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[severity])} />
        {pulse && severity === 'critical' && (
          <motion.span
            className={cn('absolute inset-0 rounded-full', dotColors[severity])}
            animate={{ scale: [1, 2.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </span>
      {severityLabel(severity)}
    </span>
  );
}
