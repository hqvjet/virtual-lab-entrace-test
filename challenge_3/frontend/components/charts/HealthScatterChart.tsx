'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Card } from '../ui/Card';
import type { HealthMentalData } from '@/lib/types';

interface HealthScatterChartProps {
  data: HealthMentalData;
}

export const HealthScatterChart: React.FC<HealthScatterChartProps> = ({ data }) => {
  // Transform Cantril Ladder data for scatter plot
  const scatterData = data.cantril_ladder.scores.map((score, index) => ({
    score: score,
    count: data.cantril_ladder.counts[index],
    z: data.cantril_ladder.counts[index] // For bubble size
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        😊 Phân bố điểm hạnh phúc (Cantril Ladder)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="score" 
            name="Điểm hạnh phúc"
            domain={[0, 10]}
          />
          <YAxis 
            type="number" 
            dataKey="count" 
            name="Số người"
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-semibold">Điểm: {payload[0].payload.score}</p>
                    <p className="text-blue-600">Số người: {payload[0].payload.count}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            name="Cantril Ladder" 
            data={scatterData} 
            fill="#3b82f6"
            opacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Kích thước bong bóng thể hiện số lượng người
      </p>
    </Card>
  );
};
