'use client';

import React, { useState, useEffect } from 'react';
import { KPICard } from '../ui/Card';
import { LoadingSpinner, ErrorMessage } from '../ui/Loading';
import { FilterPanel } from './FilterPanel';
import { TabNavigation, TabType } from '../ui/TabNavigation';
import { OverviewTab } from '../tabs/OverviewTab';
import { MentalHealthTab } from '../tabs/MentalHealthTab';
import { ComplianceTab } from '../tabs/ComplianceTab';
import { covidApi } from '@/lib/api';
import type { 
  OverviewStats, 
  TimelineData, 
  RegionData, 
  Demographics,
  HealthMentalData,
  MentalHealthGovernmentData,
  ComplianceKnowledgeData,
  Filters 
} from '@/lib/types';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Overview data
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [regions, setRegions] = useState<RegionData | null>(null);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [healthMental, setHealthMental] = useState<HealthMentalData | null>(null);
  
  // Mental Health & Government data
  const [mentalHealthGov, setMentalHealthGov] = useState<MentalHealthGovernmentData | null>(null);
  
  // Compliance & Knowledge data
  const [complianceKnowledge, setComplianceKnowledge] = useState<ComplianceKnowledgeData | null>(null);

  const fetchData = async (currentFilters: Filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Always fetch overview data + compliance for awareness metric
      const overviewPromises = [
        covidApi.getOverview(currentFilters),
        covidApi.getTimeline(currentFilters),
        covidApi.getRegions(currentFilters),
        covidApi.getDemographics(currentFilters),
        covidApi.getHealthMental(currentFilters),
        covidApi.getComplianceKnowledge(currentFilters), // Always fetch for awareness KPI
      ];

      // Add tab-specific data based on active tab
      if (activeTab === 'mental-health') {
        overviewPromises.push(covidApi.getMentalHealthGovernment(currentFilters) as any);
      }

      const results = await Promise.all(overviewPromises);
      
      setStats(results[0]);
      setTimeline(results[1]);
      setRegions(results[2]);
      setDemographics(results[3]);
      setHealthMental(results[4]);
      setComplianceKnowledge(results[5] as ComplianceKnowledgeData);

      // Set tab-specific data
      if (activeTab === 'mental-health' && results[6]) {
        setMentalHealthGov(results[6] as MentalHealthGovernmentData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [activeTab]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Đang tải dữ liệu COVID-19..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={() => fetchData(filters)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 COVID-19 Dashboard - Việt Nam
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dữ liệu khảo sát tháng 4-9/2020 • {stats?.total_surveys.toLocaleString()} khảo sát
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Filter Panel */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-40">
              <FilterPanel 
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </div>
          </aside>

          {/* Mobile Filter */}
          <div className="lg:hidden w-full mb-6">
            <FilterPanel 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>

          {/* Main Dashboard Content */}
          <main className="flex-1">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Đang tải dữ liệu {
                    activeTab === 'overview' ? 'tổng quan' : 
                    activeTab === 'mental-health' ? 'sức khỏe tinh thần' : 
                    'tuân thủ & kiến thức'
                  }...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="py-20">
                <ErrorMessage message={error} onRetry={() => fetchData(filters)} />
              </div>
            )}

            {/* Content with fade-in animation */}
            {!loading && !error && (
              <div className="animate-fade-in">
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && timeline && regions && demographics && healthMental && (
                  <OverviewTab
                    stats={stats}
                    timeline={timeline}
                    regions={regions}
                    demographics={demographics}
                    healthMental={healthMental}
                    complianceKnowledge={complianceKnowledge}
                  />
                )}

                {/* Mental Health & Government Tab */}
                {activeTab === 'mental-health' && mentalHealthGov && (
                  <MentalHealthTab data={mentalHealthGov} />
                )}

                {/* Compliance & Knowledge Tab */}
                {activeTab === 'compliance' && complianceKnowledge && (
                  <ComplianceTab data={complianceKnowledge} />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
