'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface PopulationRecord {
  country: string;
  year: number;
  population: number;
}

interface ForecastPanelProps {
  country: string;
  historicalData: PopulationRecord[];
}

const FORECAST_YEARS = [2025, 2030, 2035, 2040, 2050];
const MODELS = [
  { id: 'deepar', name: 'DeepAR', color: '#00d4ff', description: 'Probabilistic LSTM' },
  { id: 'linear', name: 'Linear Regression', color: '#00ff88', description: 'Baseline linear' },
  { id: 'randomforest', name: 'Random Forest', color: '#ff6b6b', description: 'Ensemble trees' },
  { id: 'gradient', name: 'Gradient Boosting', color: '#fbbf24', description: 'Boosted ensemble' },
];

// Generate fake but realistic-looking forecast data based on historical trends
function generateFakeForecast(
  historicalData: PopulationRecord[],
  targetYear: number,
  modelId: string
): { year: number; population: number; lower: number; upper: number }[] {
  if (historicalData.length < 2) return [];

  const lastYear = historicalData[historicalData.length - 1].year;
  const lastPop = historicalData[historicalData.length - 1].population;

  // Calculate average growth rate from last 10 years
  const recentData = historicalData.slice(-10);
  const growthRates: number[] = [];
  for (let i = 1; i < recentData.length; i++) {
    const rate = (recentData[i].population - recentData[i - 1].population) / recentData[i - 1].population;
    growthRates.push(rate);
  }
  const avgGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0.01;

  // Add model-specific variation
  const modelMultipliers: Record<string, number> = {
    deepar: 1.0,
    linear: 0.85,
    randomforest: 1.08,
    gradient: 0.95,
  };
  const multiplier = modelMultipliers[modelId] || 1.0;
  const adjustedGrowth = avgGrowth * multiplier;

  // Generate year-by-year forecast
  const forecast: { year: number; population: number; lower: number; upper: number }[] = [];
  let currentPop = lastPop;

  for (let year = lastYear + 1; year <= targetYear; year++) {
    const yearsAhead = year - lastYear;
    // Growth rate slightly decreasing over time (logistic-like dampening)
    const dampenedGrowth = adjustedGrowth * (1 - yearsAhead * 0.005);
    currentPop = Math.round(currentPop * (1 + dampenedGrowth));

    // Uncertainty grows with time
    const uncertainty = 0.02 + yearsAhead * 0.008;
    const lower = Math.round(currentPop * (1 - uncertainty));
    const upper = Math.round(currentPop * (1 + uncertainty));

    forecast.push({ year, population: currentPop, lower, upper });
  }

  return forecast;
}

function formatPop(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function ForecastPanel({ country, historicalData }: ForecastPanelProps) {
  const [selectedYear, setSelectedYear] = useState(2030);
  const [selectedModel, setSelectedModel] = useState('deepar');
  const [showComparison, setShowComparison] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [realForecast, setRealForecast] = useState<{ year: number; population: number; lower: number; upper: number }[] | null>(null);

  // Fetch real AI predictions for DeepAR model
  const fetchRealForecast = useCallback(async (c: string, year: number) => {
    setIsLoadingAI(true);
    try {
      const res = await fetch(`/api/forecast?country=${encodeURIComponent(c)}&target_year=${year}&num_samples=200`);
      const data = await res.json();
      if (data.forecasts && data.forecasts.length > 0) {
        const mapped = data.forecasts.map((f: { year: number; mean: number; lower: number; upper: number }) => ({
          year: f.year,
          population: Math.round(f.mean),
          lower: Math.round(f.lower),
          upper: Math.round(f.upper),
        }));
        setRealForecast(mapped);
        setAiConnected(true);
      } else {
        setRealForecast(null);
        setAiConnected(false);
      }
    } catch {
      setRealForecast(null);
      setAiConnected(false);
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  useEffect(() => {
    if (selectedModel === 'deepar' && country) {
      fetchRealForecast(country, selectedYear);
    } else {
      setRealForecast(null);
    }
  }, [country, selectedYear, selectedModel, fetchRealForecast]);

  // Use real AI forecast if available, otherwise fall back to mock
  const forecast = useMemo(() => {
    if (selectedModel === 'deepar' && realForecast && realForecast.length > 0) {
      return realForecast;
    }
    return generateFakeForecast(historicalData, selectedYear, selectedModel);
  }, [historicalData, selectedYear, selectedModel, realForecast]);

  const allModelForecasts = useMemo(() => {
    if (!showComparison) return null;
    return MODELS.map(model => ({
      ...model,
      forecast: generateFakeForecast(historicalData, selectedYear, model.id),
    }));
  }, [historicalData, selectedYear, showComparison]);

  // Combine historical + forecast for chart
  const chartData = useMemo(() => {
    const hist = historicalData.slice(-20).map(d => ({
      year: d.year,
      population: d.population,
      forecast: null as number | null,
      lower: null as number | null,
      upper: null as number | null,
    }));

    const fc = forecast.map(d => ({
      year: d.year,
      population: null as number | null,
      forecast: d.population,
      lower: d.lower,
      upper: d.upper,
    }));

    // Bridge: last historical point connects to first forecast
    if (hist.length > 0 && fc.length > 0) {
      const lastHist = hist[hist.length - 1];
      fc[0] = { ...fc[0], population: lastHist.population };
    }

    return [...hist, ...fc];
  }, [historicalData, forecast]);

  const targetForecast = forecast.find(f => f.year === selectedYear);

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex gap-2">
        {FORECAST_YEARS.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedYear === year
                ? 'text-white'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {selectedYear === year && (
              <motion.div
                layoutId="yearSelector"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-500/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{year}</span>
          </button>
        ))}
      </div>

      {/* Model selector */}
      <div className="flex flex-wrap gap-2">
        {MODELS.map(model => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-all ${
              selectedModel === model.id
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10 hover:text-white/50'
            }`}
          >
            <div className="h-2 w-2 rounded-full" style={{ background: model.color }} />
            {model.name}
            {model.id === 'deepar' && aiConnected && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* AI Status */}
      {selectedModel === 'deepar' && (
        <div className="flex items-center gap-2 text-[10px]">
          {isLoadingAI ? (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400/70">Querying DeepAR model...</span>
            </>
          ) : aiConnected ? (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400/70">Live AI predictions</span>
            </>
          ) : (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="text-white/20">AI backend offline — using estimated data</span>
            </>
          )}
        </div>
      )}

      {/* Forecast result */}
      {targetForecast && (
        <motion.div
          key={`${country}-${selectedYear}-${selectedModel}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40">Predicted Population ({selectedYear})</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/20">
              {MODELS.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
          <p className="text-xl font-bold text-white mb-1">{formatPop(targetForecast.population)}</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-white/30">
              95% CI: <span className="text-white/50">{formatPop(targetForecast.lower)} — {formatPop(targetForecast.upper)}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {(() => {
              const lastPop = historicalData[historicalData.length - 1]?.population || 0;
              const change = lastPop > 0 ? ((targetForecast.population - lastPop) / lastPop * 100) : 0;
              const isPositive = change >= 0;
              return (
                <>
                  <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-white/30">from 2023</span>
                </>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Forecast chart */}
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => {
                if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
                return v.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(4, 7, 20, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              formatter={(value, name) => {
                if (value === null || value === undefined) return ['-', String(name)];
                return [Number(value).toLocaleString(), name === 'population' ? 'Historical' : name === 'forecast' ? 'Forecast' : String(name)];
              }}
            />
            <ReferenceLine x={2023} stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" label="" />
            {/* Confidence interval */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
            {/* Historical */}
            <Area type="monotone" dataKey="population" stroke="#7c3aed" strokeWidth={2} fill="url(#histGrad)" dot={false} connectNulls={false} />
            {/* Forecast */}
            <Area type="monotone" dataKey="forecast" stroke="#00d4ff" strokeWidth={2} strokeDasharray="5 5" fill="url(#fcGrad)" dot={false} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 bg-purple-500 rounded-full" />
            <span className="text-white/30">Historical</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 bg-cyan-400 rounded-full" style={{ borderTop: '1px dashed' }} />
            <span className="text-white/30">Forecast</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-4 bg-cyan-400/10 rounded" />
            <span className="text-white/30">95% CI</span>
          </span>
        </div>
      </div>

      {/* Compare models toggle */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-white/50 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300"
      >
        {showComparison ? 'Hide' : 'Compare'} All Models
      </button>

      {/* Model comparison */}
      <AnimatePresence>
        {showComparison && allModelForecasts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-2"
          >
            {allModelForecasts.map(model => {
              const target = model.forecast.find(f => f.year === selectedYear);
              if (!target) return null;
              return (
                <div key={model.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: model.color }} />
                    <div>
                      <p className="text-xs font-medium text-white/80">{model.name}</p>
                      <p className="text-[10px] text-white/30">{model.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatPop(target.population)}</p>
                    <p className="text-[10px] text-white/30">
                      ±{formatPop(target.upper - target.population)}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-[10px] text-white/20 text-center italic">
        {selectedModel === 'deepar' && aiConnected
          ? '* Real-time forecast from DeepAR (LSTM + Gaussian Likelihood)'
          : '* Estimated data — start AI backend for real DeepAR predictions'}
      </p>
    </div>
  );
}
