'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { TimelineData } from '@/lib/types';

interface ComplianceAreaChartProps {
  data: TimelineData;
}

export const ComplianceAreaChart: React.FC<ComplianceAreaChartProps> = ({ data }) => {
  // Transform data for Area Chart
  const chartData = data.weeks.map((week, index) => ({
    week,
    'Số khảo sát': data.survey_counts[index],
    'Điểm sức khỏe': data.avg_health[index] || 0,
    'Sức khỏe tinh thần': data.avg_mental_health[index] || 0,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Diễn biến sức khỏe cộng đồng (Area Chart)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorMental" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorSurveys" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Số khảo sát"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorSurveys)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Điểm sức khỏe"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorHealth)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Sức khỏe tinh thần"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorMental)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Biểu đồ diện tích cho thấy xu hướng tổng thể theo thời gian
      </p>
    </Card>
  );
};
