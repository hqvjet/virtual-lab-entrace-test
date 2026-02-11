'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { Demographics } from '@/lib/types';

interface DemographicPieChartProps {
  data: Demographics;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DemographicPieChart: React.FC<DemographicPieChartProps> = ({ data }) => {
  // Gender data
  const genderData = data.gender.labels.map((label, index) => ({
    name: label || 'Không rõ',
    value: data.gender.values[index]
  }));

  // Age groups data
  const ageData = data.age_groups.labels.map((label, index) => ({
    name: label,
    value: data.age_groups.values[index]
  }));

  return (
    <Card className="col-span-full lg:col-span-1">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        👥 Nhân khẩu học
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Giới tính</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Độ tuổi</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
