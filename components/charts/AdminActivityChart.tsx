'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UserCountDataProps {
  data: { role: string; count: number }[];
}

export const UserRoleDistributionChart = memo(function UserRoleDistributionChart({ data }: UserCountDataProps) {
  if (!data || data.length === 0) {
    return <div className="text-xs text-em-text-dim text-center py-4">No user distribution data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data}>
        <XAxis dataKey="role" tick={{ fill: '#4a5a7a', fontSize: 10 }} />
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
        <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Users" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});
