'use client';

import { motion } from 'framer-motion';
import { cn, getRiskColor, getRiskBg, getRiskLabel } from '@/lib/utils';

interface RiskGaugeProps {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function RiskGauge({ value, label, size = 'md', className, animated = true }: RiskGaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const sizeMap = {
    sm: { svgSize: 80, r: 30, strokeW: 4, fontSize: 'text-sm', labelSize: 'text-[9px]' },
    md: { svgSize: 120, r: 44, strokeW: 6, fontSize: 'text-xl', labelSize: 'text-[10px]' },
    lg: { svgSize: 160, r: 60, strokeW: 8, fontSize: 'text-3xl', labelSize: 'text-xs' },
  };

  const { svgSize, r, strokeW, fontSize, labelSize } = sizeMap[size];
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clampedValue / 100) * circ;

  const colorClass = getRiskColor(clampedValue);
  const riskLabel = getRiskLabel(clampedValue);

  const strokeColor = clampedValue >= 80 ? '#ff3b3b' : clampedValue >= 60 ? '#ff7a00' : clampedValue >= 40 ? '#ffd700' : '#22c55e';

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(26, 39, 68, 0.8)"
            strokeWidth={strokeW}
          />
          {/* Progress arc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: animated ? offset : offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}80)`,
            }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('font-bold font-mono', fontSize, colorClass)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {clampedValue}%
          </motion.span>
          <span className={cn(labelSize, 'text-em-text-muted font-medium mt-0.5')}>
            {riskLabel}
          </span>
        </div>
      </div>
      {label && (
        <p className="text-xs text-em-text-dim text-center font-medium">{label}</p>
      )}
    </div>
  );
}
