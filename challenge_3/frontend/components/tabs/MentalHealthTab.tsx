'use client';

import React from 'react';
import { Brain, Heart, TrendingUp, AlertCircle } from 'lucide-react';
import { KPICard } from '../ui/Card';
import type { MentalHealthGovernmentData } from '@/lib/types';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from 'recharts';

interface MentalHealthTabProps {
  data: MentalHealthGovernmentData;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const MentalHealthTab: React.FC<MentalHealthTabProps> = ({ data }) => {
  // Prepare PHQ4 radar chart data
  const phq4RadarData = data.phq4_metrics.map(metric => {
    const totalCount = metric.distribution.reduce((sum, d) => sum + d.count, 0);
    const highStress = metric.distribution
      .filter(d => ['Not at all', 'Several days'].includes(d.level))
      .reduce((sum, d) => sum + d.count, 0);
    const stressRate = totalCount > 0 ? (highStress / totalCount * 100) : 0;
    
    return {
      metric: metric.metric,
      value: stressRate
    };
  });

  // Prepare correlation scatter data
  const correlationData = data.correlation_data.slice(0, 200);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">🧠 Sức Khỏe Tinh Thần & Phản Ứng Chính Phủ</h2>
        <p className="text-white/90">
          Phân tích sâu về tình trạng tâm lý người dân và đánh giá chính sách ứng phó đại dịch
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Hạnh phúc TB"
          value={data.cantril_summary.average.toFixed(1)}
          subtitle="/10 điểm"
          icon={<Heart className="w-5 h-5" />}
          trend={{ value: 0, isPositive: data.cantril_summary.average > 5 }}
          color="blue"
        />
        
        <KPICard
          title="Tin tưởng Y tế"
          value={data.government_trust.average.toFixed(1)}
          subtitle="/10 điểm"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 0, isPositive: data.government_trust.average > 5 }}
          color="green"
        />
        
        <KPICard
          title="Đánh giá Chính phủ"
          value={data.pandemic_handling.average.toFixed(1)}
          subtitle="/10 điểm"
          icon={<Brain className="w-5 h-5" />}
          trend={{ value: 0, isPositive: data.pandemic_handling.average > 5 }}
          color="purple"
        />
        
        <KPICard
          title="Mức độ lo sợ"
          value={data.fear_level.average.toFixed(1)}
          subtitle="/10 điểm"
          icon={<AlertCircle className="w-5 h-5" />}
          trend={{ value: 0, isPositive: data.fear_level.average < 5 }}
          color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cantril Ladder Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-pink-500" />
            Phân phối mức độ hạnh phúc (Cantril Ladder)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.cantril_summary.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score" label={{ value: 'Điểm hạnh phúc (0-10)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Số người', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]}>
                {data.cantril_summary.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PHQ4 Stress Radar */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-500" />
            Chỉ số stress PHQ4
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={phq4RadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Tỷ lệ stress (%)" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Government Trust Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Phân phối mức tin tưởng hệ thống y tế
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.government_trust.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pandemic Handling */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
            Đánh giá xử lý đại dịch của Chính phủ
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.pandemic_handling.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation Scatter */}
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-indigo-500" />
          Tương quan: Sức khỏe tinh thần vs Đánh giá Chính phủ
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="mental_health" 
              name="Sức khỏe tinh thần"
              domain={[0, 10]}
              label={{ value: 'Mức độ hạnh phúc (Cantril Ladder)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="gov_response" 
              name="Đánh giá CP"
              domain={[0.5, 4.5]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(value) => {
                const labels: Record<number, string> = {
                  1: 'Very badly',
                  2: 'Somewhat badly',
                  3: 'Somewhat well',
                  4: 'Very well'
                };
                return labels[value] || '';
              }}
              label={{ value: 'Đánh giá Chính phủ', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900">{data.category}</p>
                      <p className="text-sm text-gray-600">Hạnh phúc TB: {data.mental_health}/10</p>
                      <p className="text-sm text-gray-600">Số người: {data.count?.toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Scatter 
              name="Đánh giá Chính phủ" 
              data={correlationData} 
              fill="#6366f1"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 mb-2">
            <strong>📈 Cách đọc biểu đồ:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• Mỗi điểm = trung bình happiness của nhóm người có cùng đánh giá chính phủ</li>
            <li>• Trục Y: Ordinal scale 1-4 (Very badly → Very well)</li>
            <li>• Trục X: Cantril Ladder 0-10 (không hạnh phúc → rất hạnh phúc)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
