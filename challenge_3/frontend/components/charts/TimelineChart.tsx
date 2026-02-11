'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { TimelineData } from '@/lib/types';

interface TimelineChartProps {
  data: TimelineData;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  // Transform data for Recharts
  const chartData = data.weeks.map((week, index) => ({
    week,
    'Số khảo sát': data.survey_counts[index],
    'Điểm sức khỏe': data.avg_health[index]?.toFixed(1) || 0,
    'Sức khỏe tinh thần': data.avg_mental_health[index]?.toFixed(1) || 0,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Xu hướng theo thời gian
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Số khảo sát" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Điểm sức khỏe" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Sức khỏe tinh thần" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
