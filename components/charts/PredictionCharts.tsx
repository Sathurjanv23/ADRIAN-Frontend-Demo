'use client';

import { memo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface RiverTrendProps {
  data: { time: string; level: number; alert?: number; threshold?: number; critical?: number }[];
}

export const RiverLevelTrendChart = memo(function RiverLevelTrendChart({ data }: RiverTrendProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No river level trend data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
        <XAxis dataKey="time" tick={{ fill: '#4a5a7a', fontSize: 10 }} />
        <YAxis domain={[3, 8]} tick={{ fill: '#4a5a7a', fontSize: 10 }} unit="m" />
        <Tooltip
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '10px',
            color: '#0D1B2A',
          }}
        />
        <Area
          type="monotone"
          dataKey="level"
          stroke="#3b82f6"
          fill="rgba(59,130,246,0.15)"
          strokeWidth={2}
          name="River Level (m)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="alert"
          stroke="#ff3b3b"
          fill="none"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          name="Alert Threshold"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

interface ZoneRiskProps {
  data: { name: string; Flood: number; Landslide: number; Fire: number }[];
}

export const ZoneRiskBreakdownChart = memo(function ZoneRiskBreakdownChart({ data }: ZoneRiskProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No verified zone risk data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
        <XAxis dataKey="name" tick={{ fill: '#4a5a7a', fontSize: 9 }} />
        <YAxis tick={{ fill: '#4a5a7a', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '10px',
            color: '#0D1B2A',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        <Bar dataKey="Flood" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Landslide" fill="#ff7a00" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Fire" fill="#ff3b3b" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});
