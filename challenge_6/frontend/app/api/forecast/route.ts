/**
 * Next.js API route — Proxy to FastAPI DeepAR backend.
 *
 * Acts as a BFF (Backend for Frontend) to:
 * 1. Avoid CORS issues
 * 2. Centralize backend URL configuration
 * 3. Provide graceful fallback when backend is unavailable
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const targetYear = searchParams.get('target_year');
  const numSamples = searchParams.get('num_samples') || '200';

  if (!country || !targetYear) {
    return NextResponse.json(
      { error: 'Missing required params: country, target_year' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        target_year: parseInt(targetYear),
        num_samples: parseInt(numSamples),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || `Backend error: ${res.status}`, forecasts: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Backend unavailable — frontend will fall back to mock data
    return NextResponse.json(
      { error: 'AI backend unavailable', forecasts: [] },
      { status: 503 }
    );
  }
}
