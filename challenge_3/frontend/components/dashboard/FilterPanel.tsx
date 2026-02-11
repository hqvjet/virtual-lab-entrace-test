'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Filter, X } from 'lucide-react';
import type { Filters } from '@/lib/types';

interface FilterPanelProps {
  onFilterChange: (filters: Filters) => void;
  availableRegions?: string[];
  initialFilters?: Filters;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ 
  onFilterChange,
  availableRegions = [
    'Southeast',
    'Red River Delta',
    'Mekong River Delta',
    'Northern Midlands and Mountains',
    'North and South Central Coast'
  ],
  initialFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    week_start: initialFilters?.week_start ?? 1,
    week_end: initialFilters?.week_end ?? 12,
    age_min: initialFilters?.age_min ?? 18,
    age_max: initialFilters?.age_max ?? 70,
    gender: initialFilters?.gender,
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialFilters?.regions ?? []
  );

  // Sync with initialFilters when they change (stringify for deep comparison)
  useEffect(() => {
    if (initialFilters) {
      setFilters({
        week_start: initialFilters.week_start ?? 1,
        week_end: initialFilters.week_end ?? 12,
        age_min: initialFilters.age_min ?? 18,
        age_max: initialFilters.age_max ?? 70,
        gender: initialFilters.gender,
      });
      setSelectedRegions(initialFilters.regions ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFilters)]);

  const handleApplyFilters = () => {
    const appliedFilters: Filters = {
      ...filters,
      regions: selectedRegions.length > 0 ? selectedRegions : undefined,
    };
    onFilterChange(appliedFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: Filters = {
      week_start: 1,
      week_end: 12,
      age_min: 18,
      age_max: 70,
    };
    setFilters(resetFilters);
    setSelectedRegions([]);
    onFilterChange({});
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Filter size={24} />
      </button>

      {/* Filter Panel */}
      <Card className={`
        ${isOpen ? 'block' : 'hidden'} lg:block
        fixed lg:sticky top-0 right-0 z-40 
        w-80 h-screen lg:h-auto
        overflow-y-auto
        transition-transform
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter size={20} />
            Bộ lọc
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Week Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Tuần khảo sát
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max="12"
                value={filters.week_start}
                onChange={(e) => setFilters({ ...filters, week_start: parseInt(e.target.value) })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">đến</span>
              <input
                type="number"
                min="1"
                max="12"
                value={filters.week_end}
                onChange={(e) => setFilters({ ...filters, week_end: parseInt(e.target.value) })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 Độ tuổi: {filters.age_min} - {filters.age_max}
            </label>
            <input
              type="range"
              min="18"
              max="70"
              value={filters.age_min}
              onChange={(e) => setFilters({ ...filters, age_min: parseInt(e.target.value) })}
              className="w-full mb-2"
            />
            <input
              type="range"
              min="18"
              max="70"
              value={filters.age_max}
              onChange={(e) => setFilters({ ...filters, age_max: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚧ Giới tính
            </label>
            <select
              value={filters.gender || ''}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </div>

          {/* Regions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🗺️ Vùng miền
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableRegions.map(region => (
                <label key={region} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Áp dụng
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Active Filters Summary */}
          {(selectedRegions.length > 0 || filters.gender) && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Bộ lọc đang áp dụng:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegions.map(region => (
                  <span key={region} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {region}
                  </span>
                ))}
                {filters.gender && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {filters.gender === 'Male' ? 'Nam' : 'Nữ'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
