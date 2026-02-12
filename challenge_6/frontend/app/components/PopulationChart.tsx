'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PopulationRecord {
  country: string;
  year: number;
  population: number;
}

interface PopulationChartProps {
  data: PopulationRecord[];
}

function formatPop(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toString();
}

export default function PopulationChart({ data }: PopulationChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="year"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={14}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatPop}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(4, 7, 20, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            padding: '10px 14px',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}
          formatter={(value) => [Number(value).toLocaleString(), 'Population']}
          itemStyle={{ color: '#00d4ff', fontSize: 13, fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="population"
          stroke="url(#lineGradient)"
          strokeWidth={2.5}
          fill="url(#popGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: '#00d4ff',
            stroke: '#040714',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
