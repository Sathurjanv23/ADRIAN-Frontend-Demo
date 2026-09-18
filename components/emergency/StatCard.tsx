'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'critical' | 'blue' | 'warning' | 'success' | 'cyan';
  animate?: boolean;
  className?: string;
  suffix?: string;
}

function useCountUp(target: number, duration = 1500) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number') return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return current;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  variant = 'default',
  animate = true,
  className,
  suffix,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value as string) || 0;
  const count = useCountUp(numericValue);
  const animatedValue = animate ? count : numericValue;

  const variantStyles: Record<string, string> = {
    default:  'border-em-border bg-white',
    critical: 'border-er-red/30 bg-er-red-light',
    blue:     'border-er-blue/20 bg-er-blue-light',
    // legacy alias
    cyan:     'border-er-blue/20 bg-er-blue-light',
    warning:  'border-er-orange/20 bg-er-orange-light',
    success:  'border-er-green/20 bg-er-green-light',
  };

  const iconStyles: Record<string, string> = {
    default:  'text-er-blue bg-er-blue-light border border-er-blue/20',
    critical: 'text-er-red bg-white border border-er-red/20',
    blue:     'text-er-blue bg-white border border-er-blue/20',
    cyan:     'text-er-blue bg-white border border-er-blue/20',
    warning:  'text-er-orange bg-white border border-er-orange/20',
    success:  'text-er-green bg-white border border-er-green/20',
  };

  const valueStyles: Record<string, string> = {
    default:  'text-em-text',
    critical: 'text-er-red-dark',
    blue:     'text-er-blue',
    cyan:     'text-er-blue',
    warning:  'text-er-orange',
    success:  'text-er-green',
  };

  return (
    <motion.div
      className={cn(
        'em-card rounded-2xl p-4 border flex flex-col gap-3 stat-card',
        variantStyles[variant],
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconStyles[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <AnimatePresence mode="wait">
          <motion.span
            key={animatedValue}
            className={cn('text-3xl font-black tabular-nums', valueStyles[variant])}
          >
            {typeof value === 'string' && !parseInt(value)
              ? value
              : animate
              ? animatedValue.toLocaleString()
              : numericValue.toLocaleString()}
          </motion.span>
        </AnimatePresence>
        {unit   && <span className="text-sm text-em-text-muted mb-1 font-semibold">{unit}</span>}
        {suffix && <span className="text-sm text-em-text-muted mb-1 font-semibold">{suffix}</span>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-bold', trend.value > 0 ? 'text-er-red' : 'text-er-green')}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-em-text-muted font-semibold">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
