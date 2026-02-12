'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { REGIONS, COUNTRY_FLAGS, COUNTRY_COORDS, CSV_TO_GEOJSON, GEOJSON_TO_CSV } from './data/countryMapping';
import PopulationChart from './components/PopulationChart';
import ForecastPanel from './components/ForecastPanel';

const GlobeScene = dynamic(() => import('./components/GlobeScene'), { ssr: false });

interface PopulationRecord {
  country: string;
  year: number;
  population: number;
}

interface SummaryRecord {
  country: string;
  year: number;
  population: number;
}

export default function Home() {
  const [countries, setCountries] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryRecord[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<PopulationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/population?type=countries').then(r => r.json()),
      fetch('/api/population?type=summary').then(r => r.json()),
    ]).then(([countriesList, summary]) => {
      setCountries(countriesList);
      setSummaryData(summary);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCountry) return;
    fetch(`/api/population?country=${encodeURIComponent(selectedCountry)}`)
      .then(r => r.json())
      .then((data: PopulationRecord[]) => {
        setCountryData(data.sort((a, b) => a.year - b.year));
        setShowDetail(true);
      });
  }, [selectedCountry]);

  const handleCountrySelect = useCallback((country: string) => {
    setSelectedCountry(country);
    const coords = COUNTRY_COORDS[country];
    if (coords) {
      setFocusCoords({ lat: coords[0], lng: coords[1] });
    }
  }, []);

  const handleGlobeCountryClick = useCallback((geoJsonName: string) => {
    const csvName = GEOJSON_TO_CSV[geoJsonName] || geoJsonName;
    if (countries.includes(csvName)) {
      handleCountrySelect(csvName);
    } else {
      const match = countries.find(c =>
        c.toLowerCase() === geoJsonName.toLowerCase() ||
        CSV_TO_GEOJSON[c]?.toLowerCase() === geoJsonName.toLowerCase()
      );
      if (match) handleCountrySelect(match);
    }
  }, [countries, handleCountrySelect]);

  const filteredRegions = searchQuery
    ? Object.entries(REGIONS).reduce((acc, [region, regionCountries]) => {
      const filtered = regionCountries.filter(c =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) acc[region] = filtered;
      return acc;
    }, {} as Record<string, string[]>)
    : REGIONS;

  const latestPopulation = selectedCountry
    ? countryData.find(d => d.year === 2023)?.population
    : null;

  const populationMap = new Map<string, number>();
  summaryData.forEach(d => populationMap.set(d.country, d.population));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#040714]">
      <div className="stars-bg" />

      <div className="absolute inset-0 z-0">
        {!isLoading && (
          <GlobeScene
            populationMap={populationMap}
            onCountryClick={handleGlobeCountryClick}
            selectedCountry={selectedCountry}
            focusCoords={focusCoords}
            onReady={() => setGlobeReady(true)}
          />
        )}
      </div>

      <AnimatePresence>
        {(isLoading || !globeReady) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#040714]"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="globe-loader" />
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-lg font-light tracking-[0.3em] text-cyan-400"
              >
                LOADING WORLD DATA
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">
              World Population <span className="text-cyan-400">Explorer</span>
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-white/40">POWERED BY DEEPAR MODEL</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-xl">
            <span className="text-xs text-white/60">{countries.length} Countries</span>
            <span className="mx-2 text-white/20">|</span>
            <span className="text-xs text-white/60">1950 - 2023</span>
          </div>
        </div>
      </motion.div>

      {/* Left Sidebar */}
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        className="absolute top-20 left-4 bottom-4 z-20 w-72 overflow-hidden"
      >
        <div className="glass-panel flex h-full flex-col rounded-2xl">
          <div className="border-b border-white/10 p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {Object.entries(filteredRegions).map(([region, regionCountries]) => (
              <div key={region} className="mb-1">
                <button
                  onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-white/80">{region}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{regionCountries.length}</span>
                    <motion.svg
                      animate={{ rotate: expandedRegion === region ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"
                    ><path d="m6 9 6 6 6-6" /></motion.svg>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedRegion === region && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {regionCountries.map(country => (
                        <button
                          key={country}
                          onClick={() => handleCountrySelect(country)}
                          className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm transition-all hover:bg-white/10 ${
                            selectedCountry === country ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/60'
                          }`}
                        >
                          <span className="text-base">{COUNTRY_FLAGS[country] || '🏳️'}</span>
                          <span className="truncate">{country}</span>
                          {selectedCountry === country && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Country Detail */}
      <AnimatePresence>
        {showDetail && selectedCountry && countryData.length > 0 && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-20 right-4 bottom-4 z-20 w-[420px] overflow-hidden"
          >
            <div className="glass-panel flex h-full flex-col rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{COUNTRY_FLAGS[selectedCountry] || '🏳️'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedCountry}</h2>
                    <p className="text-xs text-white/40">
                      {Object.entries(REGIONS).find(([, cs]) => cs.includes(selectedCountry))?.[0] || 'Unknown Region'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetail(false); setSelectedCountry(null); setFocusCoords(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <div className="mb-6">
                  <p className="mb-1 text-xs font-medium tracking-wider text-white/40">CURRENT POPULATION (2023)</p>
                  <div className="flex items-baseline gap-2">
                    <AnimatedNumber value={latestPopulation || 0} />
                    <span className="text-sm text-white/40">people</span>
                  </div>
                  {countryData.length >= 2 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {(() => {
                        const latest = countryData[countryData.length - 1]?.population || 0;
                        const prev = countryData[countryData.length - 2]?.population || 0;
                        const growth = prev > 0 ? ((latest - prev) / prev * 100) : 0;
                        const isPositive = growth >= 0;
                        return (
                          <>
                            <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}%
                            </span>
                            <span className="text-xs text-white/30">annual growth</span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[10px] tracking-wider text-white/40">PEAK POPULATION</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatPopulation(Math.max(...countryData.map(d => d.population)))}
                    </p>
                    <p className="text-[10px] text-cyan-400/60">
                      Year {countryData.reduce((a, b) => a.population > b.population ? a : b).year}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-[10px] tracking-wider text-white/40">GROWTH SINCE 1950</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {countryData.length >= 2
                        ? `${((countryData[countryData.length - 1].population / countryData[0].population - 1) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </p>
                    <p className="text-[10px] text-purple-400/60">
                      {countryData.length >= 2
                        ? `${formatPopulation(countryData[countryData.length - 1].population - countryData[0].population)} added`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-medium tracking-wider text-white/40">POPULATION TREND</h3>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <PopulationChart data={countryData} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-medium tracking-wider text-white/40">AI FORECAST</h3>
                  <ForecastPanel country={selectedCountry} historicalData={countryData} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom stats bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
      >
        <div className="glass-panel flex items-center gap-6 rounded-2xl px-6 py-3">
          <div className="text-center">
            <p className="text-[10px] tracking-wider text-white/40">WORLD POPULATION</p>
            <p className="text-sm font-bold text-cyan-400">8.09B</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] tracking-wider text-white/40">COUNTRIES</p>
            <p className="text-sm font-bold text-purple-400">{countries.length}</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] tracking-wider text-white/40">DATA RANGE</p>
            <p className="text-sm font-bold text-emerald-400">1950 — 2023</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] tracking-wider text-white/40">AI MODEL</p>
            <p className="text-sm font-bold text-orange-400">DeepAR</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
    prevValue.current = value;
  }, [value]);

  return <span className="text-2xl font-bold tabular-nums text-white">{displayValue.toLocaleString()}</span>;
}

function formatPopulation(pop: number): string {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(2)}B`;
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(2)}M`;
  if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
  return pop.toLocaleString();
}
