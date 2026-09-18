'use client';

import { memo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#00d4ff', '#3b82f6', '#ff7a00', '#22c55e', '#ff3b3b', '#ffd700', '#a855f7', '#ec4899'];

interface ResponseTrendProps {
  data: { date: string; avgTime: number }[];
}

export const ResponseTimeChart = memo(function ResponseTimeChart({ data }: ResponseTrendProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No response time telemetry available.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
        <XAxis dataKey="date" tick={{ fill: '#4a5a7a', fontSize: 9 }} interval={0} />
        <YAxis tick={{ fill: '#4a5a7a', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '10px', color: '#0D1B2A' }} />
        <Area type="monotone" dataKey="avgTime" stroke="#00d4ff" fill="rgba(0,212,255,0.1)" strokeWidth={2} name="Response Time (min)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

interface IncidentsByTypeProps {
  data: { type: string; count: number }[];
}

export const IncidentsByTypeChart = memo(function IncidentsByTypeChart({ data }: IncidentsByTypeProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No incident type distribution available.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={60}
          paddingAngle={3}
          dataKey="count"
          nameKey="type"
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '10px', color: '#0D1B2A' }}
          formatter={(v, n) => [v, String(n).replace('_', ' ')]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

interface IncidentsByRegionProps {
  data: { region: string; count: number }[];
}

export const IncidentsByRegionChart = memo(function IncidentsByRegionChart({ data }: IncidentsByRegionProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No regional incident data available.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fill: '#4a5a7a', fontSize: 10 }} />
        <YAxis type="category" dataKey="region" tick={{ fill: '#4a5a7a', fontSize: 10 }} width={70} />
        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '10px', color: '#0D1B2A' }} />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} name="Incidents" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});

interface HospitalCapacityProps {
  data: { name: string; occupancy: number }[];
}

export const HospitalCapacityChart = memo(function HospitalCapacityChart({ data }: HospitalCapacityProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-6">No hospital capacity telemetry available.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,39,68,0.6)" />
        <XAxis dataKey="name" tick={{ fill: '#4a5a7a', fontSize: 9 }} interval={0} />
        <YAxis tick={{ fill: '#4a5a7a', fontSize: 10 }} unit="%" domain={[0, 100]} />
        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '10px', color: '#0D1B2A' }} />
        <Bar dataKey="occupancy" fill="#a855f7" radius={[4, 4, 0, 0]} name="Bed Occupancy %" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});
