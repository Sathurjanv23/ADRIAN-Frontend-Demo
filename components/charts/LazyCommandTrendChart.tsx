'use client';

import { memo } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

interface LazyCommandTrendChartProps {
  data: { date: string; avgTime: number }[];
  minLabel?: string;
  responseLabel?: string;
}

function CommandTrendChartComponent({
  data,
  minLabel = 'min',
  responseLabel = 'Avg Response',
}: LazyCommandTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-em-text-dim text-center py-4">
        No response time trend data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={96}>
      <LineChart data={data}>
        <Tooltip
          contentStyle={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '10px',
            color: '#0D1B2A',
          }}
          formatter={(v: any) => [`${parseFloat(v).toFixed(1)} ${minLabel}`, responseLabel]}
        />
        <Line
          type="monotone"
          dataKey="avgTime"
          stroke="#1565C0"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export const LazyCommandTrendChart = memo(CommandTrendChartComponent);
export default LazyCommandTrendChart;
