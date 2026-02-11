'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { RegionData } from '@/lib/types';

interface RegionBarChartProps {
  data: RegionData;
}

export const RegionBarChart: React.FC<RegionBarChartProps> = ({ data }) => {
  // Transform data for Recharts
  const chartData = data.regions.map((region, index) => ({
    region: region.length > 20 ? region.substring(0, 20) + '...' : region,
    fullRegion: region,
    'Số ca': data.counts[index],
    'Sức khỏe TB': data.avg_health[index]?.toFixed(1) || 0,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🗺️ Phân bố theo vùng miền
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="region" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold text-gray-900">{payload[0].payload.fullRegion}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="Số ca" fill="#3b82f6" />
          <Bar yAxisId="right" dataKey="Sức khỏe TB" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
