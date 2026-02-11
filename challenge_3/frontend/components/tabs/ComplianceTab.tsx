'use client';

import React from 'react';
import { Shield, CheckCircle, Award, BookOpen } from 'lucide-react';
import { KPICard } from '../ui/Card';
import type { ComplianceKnowledgeData } from '@/lib/types';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface ComplianceTabProps {
  data: ComplianceKnowledgeData;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
const HEATMAP_COLORS = ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626'];

export const ComplianceTab: React.FC<ComplianceTabProps> = ({ data }) => {
  // Prepare top 10 behaviors for bar chart
  const top10Behaviors = data.top_behaviors.slice(0, 10);

  // Prepare awareness pie chart
  const awarenessData = [
    { name: 'Nhận thức cao', value: data.awareness_level.high_awareness, color: '#10b981' },
    { name: 'Nhận thức trung bình', value: data.awareness_level.medium_awareness, color: '#f59e0b' },
    { name: 'Nhận thức thấp', value: data.awareness_level.low_awareness, color: '#ef4444' }
  ];

  // Prepare behavior clusters for radar
  const clusterRadarData = data.behavior_clusters.map(cluster => ({
    cluster: cluster.cluster,
    compliance: cluster.avg_compliance
  }));

  // Heatmap rendering
  const renderHeatmap = () => {
    const weeks = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    
    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Hành vi</th>
                {weeks.map(week => (
                  <th key={week} className="px-2 py-2 text-center text-xs font-semibold text-gray-700">{week}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.top_behaviors.slice(0, 10).map((behavior, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-200">
                  <td className="px-2 py-2 text-xs text-gray-900 truncate max-w-[150px]" title={behavior.behavior}>
                    {behavior.behavior}
                  </td>
                  {data.compliance_heatmap[rowIndex]?.slice(0, 12).map((value, colIndex) => {
                    const colorIndex = Math.min(Math.floor(value / 20), 5);
                    return (
                      <td 
                        key={colIndex}
                        className="px-2 py-2 text-center text-xs font-medium transition-all duration-200 hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: HEATMAP_COLORS[colorIndex] }}
                        title={`${value.toFixed(1)}%`}
                      >
                        {value.toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">🛡️ Tuân Thủ & Kiến Thức Phòng Ngừa</h2>
        <p className="text-white/90">
          Đánh giá hành vi tuân thủ các biện pháp phòng dịch và mức độ nhận thức về COVID-19
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tỷ lệ tuân thủ"
          value={data.compliance_overview.overall_rate.toFixed(1)}
          subtitle="%"
          icon={<Shield className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="blue"
        />
        
        <KPICard
          title="Hành vi theo dõi"
          value={data.compliance_overview.total_behaviors_tracked.toString()}
          subtitle="hành vi"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="green"
        />
        
        <KPICard
          title="Nhận thức cao"
          value={data.awareness_level.high_awareness.toFixed(1)}
          subtitle="%"
          icon={<Award className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="purple"
        />
        
        <KPICard
          title="Câu hỏi kiến thức"
          value={data.knowledge_scores.length.toString()}
          subtitle="câu hỏi"
          icon={<BookOpen className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Top Behaviors Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Top 10 Hành vi tuân thủ phòng dịch
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={top10Behaviors} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} label={{ value: 'Tỷ lệ tuân thủ (%)', position: 'insideBottom', offset: -5 }} />
            <YAxis type="category" dataKey="behavior" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="compliance_rate" fill="#10b981" radius={[0, 8, 8, 0]}>
              {top10Behaviors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Awareness Level Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
            Phân bố mức độ nhận thức
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={awarenessData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {awarenessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Behavior Clusters Radar */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-500" />
            Nhóm hành vi tuân thủ
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={clusterRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="cluster" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Tỷ lệ tuân thủ (%)" dataKey="compliance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Heatmap */}
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-500" />
          Heatmap: Tuân thủ theo tuần
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Biểu đồ nhiệt thể hiện tỷ lệ tuân thủ từng hành vi qua 12 tuần khảo sát
        </p>
        {renderHeatmap()}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <span className="text-xs text-gray-600">Thấp</span>
          <div className="flex space-x-1">
            {HEATMAP_COLORS.map((color, i) => (
              <div key={i} className="w-6 h-4" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-xs text-gray-600">Cao</span>
        </div>
      </div>

      {/* Knowledge Scores */}
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
          Kiến thức về COVID-19
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.knowledge_scores.map((question, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors duration-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">{question.question}</h4>
              <div className="space-y-2">
                {question.distribution.map((item, idx) => {
                  const total = question.distribution.reduce((sum, d) => sum + d.count, 0);
                  const percentage = total > 0 ? (item.count / total * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 w-20 truncate" title={item.answer}>{item.answer}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 w-12 text-right">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
