'use client';

import React from 'react';
import { Activity, Brain, Shield } from 'lucide-react';

export type TabType = 'overview' | 'mental-health' | 'compliance';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: <Activity className="w-5 h-5" />,
    description: 'Thống kê và xu hướng chung'
  },
  {
    id: 'mental-health',
    label: 'Sức khỏe & Chính phủ',
    icon: <Brain className="w-5 h-5" />,
    description: 'Tâm lý và phản ứng chính phủ'
  },
  {
    id: 'compliance',
    label: 'Tuân thủ & Kiến thức',
    icon: <Shield className="w-5 h-5" />,
    description: 'Hành vi và nhận thức phòng dịch'
  }
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white border-b sticky top-[73px] z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative group flex-1 py-4 px-6 text-sm font-medium text-center
                  border-b-2 transition-all duration-300 ease-in-out
                  ${isActive 
                    ? 'border-blue-600 text-blue-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`
                    flex items-center space-x-2 transition-transform duration-300
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    <div className={`
                      ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                      transition-colors duration-300
                    `}>
                      {tab.icon}
                    </div>
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  <span className={`
                    text-xs transition-opacity duration-300
                    ${isActive ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-70 text-gray-500'}
                  `}>
                    {tab.description}
                  </span>
                </div>
                
                {/* Active indicator with animation */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
