import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface PopulationRecord {
  country: string;
  year: number;
  population: number;
}

// Non-country entities to filter out
const NON_COUNTRIES = new Set([
  'Africa (UN)',
  'Americas (UN)',
  'Asia (UN)',
  'Europe (UN)',
  'Oceania (UN)',
  'Northern America (UN)',
  'Latin America and the Caribbean (UN)',
  'World',
  'High-income countries',
  'Low-income countries',
  'Lower-middle-income countries',
  'Upper-middle-income countries',
  'Least developed countries',
  'Less developed regions',
  'More developed regions',
  'Land-locked developing countries (LLDC)',
  'Small island developing states (SIDS)',
]);

let cachedData: PopulationRecord[] | null = null;

function parseCSV(): PopulationRecord[] {
  if (cachedData) return cachedData;

  const csvPath = path.join(process.cwd(), '..', 'data', 'population-and-demography new.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n');

  const records: PopulationRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with possible quoted fields
    let country = '';
    let rest = line;

    if (line.startsWith('"')) {
      // Quoted country name
      const endQuote = line.indexOf('"', 1);
      country = line.substring(1, endQuote);
      rest = line.substring(endQuote + 2); // skip quote and comma
    } else {
      const firstComma = line.indexOf(',');
      country = line.substring(0, firstComma);
      rest = line.substring(firstComma + 1);
    }

    if (NON_COUNTRIES.has(country)) continue;

    const parts = rest.split(',');
    const year = parseInt(parts[0]);
    const population = parseInt(parts[1]);

    if (!isNaN(year) && !isNaN(population)) {
      records.push({ country, year, population });
    }
  }

  cachedData = records;
  return records;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const type = searchParams.get('type');

    const data = parseCSV();

    if (type === 'countries') {
      const countries = [...new Set(data.map(d => d.country))].sort();
      return NextResponse.json(countries);
    }

    if (country) {
      const filtered = data.filter(d => d.country === country);
      return NextResponse.json(filtered);
    }

    // Return summary: latest year data for all countries
    if (type === 'summary') {
      const latest: Record<string, PopulationRecord> = {};
      for (const record of data) {
        if (!latest[record.country] || record.year > latest[record.country].year) {
          latest[record.country] = record;
        }
      }
      return NextResponse.json(Object.values(latest));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading population data:', error);
    return NextResponse.json({ error: 'Failed to load population data' }, { status: 500 });
  }
}
