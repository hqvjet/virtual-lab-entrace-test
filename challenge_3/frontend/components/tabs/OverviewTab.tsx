'use client';

import React from 'react';
import { Users, Heart, Brain, CheckCircle } from 'lucide-react';
import { KPICard } from '../ui/Card';
import { TimelineChart } from '../charts/TimelineChart';
import { RegionBarChart } from '../charts/RegionBarChart';
import { DemographicPieChart } from '../charts/DemographicPieChart';
import { HealthScatterChart } from '../charts/HealthScatterChart';
import { ComplianceAreaChart } from '../charts/ComplianceAreaChart';
import type { 
  OverviewStats, 
  TimelineData, 
  RegionData, 
  Demographics,
  HealthMentalData,
  ComplianceKnowledgeData
} from '@/lib/types';

interface OverviewTabProps {
  stats: OverviewStats;
  timeline: TimelineData;
  regions: RegionData;
  demographics: Demographics;
  healthMental: HealthMentalData;
  complianceKnowledge: ComplianceKnowledgeData | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  timeline,
  regions,
  demographics,
  healthMental,
  complianceKnowledge
}) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">📊 Tổng Quan Dashboard</h2>
        <p className="text-white/90">
          Cái nhìn toàn diện về tình hình COVID-19 tại Việt Nam qua 12 tuần khảo sát
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng số khảo sát"
          value={stats.total_surveys.toLocaleString()}
          subtitle="người tham gia"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="blue"
        />
        <KPICard
          title="Nhận thức cao"
          value={`${complianceKnowledge?.awareness_level?.high_awareness?.toFixed(1) || 0}%`}
          subtitle="hiểu biết tốt về COVID"
          icon={<Brain className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="green"
        />
        <KPICard
          title="Điểm sức khỏe TB"
          value={stats.avg_health_score.toString()}
          subtitle="trên thang 10"
          icon={<Heart className="w-5 h-5" />}
          trend={{ value: 0, isPositive: stats.avg_health_score > 5 }}
          color="red"
        />
        <KPICard
          title="Tỷ lệ tuân thủ"
          value={`${stats.compliance_rate}%`}
          subtitle="tuân thủ phòng dịch"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2">
          <TimelineChart data={timeline} />
        </div>

        {/* Region Bar Chart */}
        <div className="lg:col-span-2">
          <RegionBarChart data={regions} />
        </div>

        {/* Area Chart - Compliance/Health Over Time */}
        <div className="lg:col-span-2">
          <ComplianceAreaChart data={timeline} />
        </div>

        {/* Demographics Pie Chart */}
        <DemographicPieChart data={demographics} />

        {/* Health Scatter Chart */}
        <HealthScatterChart data={healthMental} />
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Nguồn dữ liệu:</strong> COVID-19 Survey Data Vietnam (Tháng 4/2020)
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Dashboard được xây dựng với Next.js, FastAPI và Polars
        </p>
      </div>
    </div>
  );
};
