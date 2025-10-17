import { getGDPData, getPopulationData, getInflationData, getFDIData } from '../services/worldBankService.ts';
import { COUNTRY_CODES } from '../data/country-codes.ts';
import type { EconomicData, WorldBankResponse } from '../types.ts';

export const config = {
  runtime: 'edge',
};

const getLatestData = (data: WorldBankResponse[]): { value: number; year: string } | undefined => {
    if (!data || data.length === 0) return undefined;
    const sortedData = data.sort((a, b) => parseInt(b.date) - parseInt(a.date));
    const latest = sortedData[0];
    return { value: latest.value, year: latest.date };
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryName = searchParams.get('country');

  if (!countryName) {
    return new Response(JSON.stringify({ error: 'Country parameter is required.' }), { status: 400 });
  }

  const countryCode = COUNTRY_CODES[countryName];
  if (!countryCode) {
    return new Response(JSON.stringify({ error: `Invalid or unsupported country: ${countryName}` }), { status: 404 });
  }

  try {
    const results = await Promise.allSettled([
        getGDPData(countryCode),
        getPopulationData(countryCode),
        getInflationData(countryCode),
        getFDIData(countryCode),
    ]);
    
    const economicData: EconomicData = {
        gdp: results[0].status === 'fulfilled' ? getLatestData(results[0].value) : undefined,
        population: results[1].status === 'fulfilled' ? getLatestData(results[1].value) : undefined,
        inflation: results[2].status === 'fulfilled' ? getLatestData(results[2].value) : undefined,
        fdi: results[3].status === 'fulfilled' ? getLatestData(results[3].value) : undefined,
    };
    
    return new Response(JSON.stringify(economicData), {
      status: 200,
      headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error(`Error fetching World Bank data for ${countryName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Failed to fetch economic data. Details: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}