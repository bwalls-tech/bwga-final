import React, { useState, useEffect } from 'react';
import { fetchEconomicDataForCountry } from '../services/nexusService.ts';
import type { EconomicData } from '../types.ts';
import Spinner from './Spinner.tsx';

interface EconomicSnapshotProps {
    country: string;
    isRefining: boolean;
    onRefineObjective: (data: EconomicData) => void;
}

const formatValue = (data: { value: number; year: string } | undefined, type: 'currency' | 'number' | 'percent') => {
    if (!data || data.value === null) return { value: 'N/A', year: '' };
    
    let formattedValue: string;
    const value = data.value;

    if (type === 'currency') {
        if (value >= 1_000_000_000_000) {
            formattedValue = `$${(value / 1_000_000_000_000).toFixed(2)}T`;
        } else if (value >= 1_000_000_000) {
            formattedValue = `$${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            formattedValue = `$${(value / 1_000_000).toFixed(2)}M`;
        } else {
            formattedValue = `$${value.toLocaleString()}`;
        }
    } else if (type === 'number') {
        if (value >= 1_000_000_000) {
             formattedValue = `${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            formattedValue = `${(value / 1_000_000).toFixed(2)}M`;
        } else {
            formattedValue = value.toLocaleString();
        }
    } else { // percent
        formattedValue = `${value.toFixed(2)}%`;
    }
    
    return { value: formattedValue, year: `(${data.year})` };
};

const DataPoint: React.FC<{ label: string; data: { value: number; year: string } | undefined; type: 'currency' | 'number' | 'percent' }> = ({ label, data, type }) => {
    const { value, year } = formatValue(data, type);
    return (
        <div className="flex justify-between items-baseline text-sm">
            <span className="text-nexus-text-secondary">{label}</span>
            <div className="text-right">
                <span className="font-semibold text-nexus-text-primary">{value}</span>
                <span className="ml-1 text-xs text-nexus-text-muted">{year}</span>
            </div>
        </div>
    );
};


export const EconomicSnapshot: React.FC<EconomicSnapshotProps> = ({ country, isRefining, onRefineObjective }) => {
    const [data, setData] = useState<EconomicData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!country) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setData(null);
            try {
                const result = await fetchEconomicDataForCountry(country);
                setData(result);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [country]);

    if (!country) return null;

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-nexus-border-subtle">
            <h3 className="font-semibold text-nexus-text-primary text-md mb-1">
                Economic Snapshot: <span className="text-nexus-accent-cyan">{country}</span>
            </h3>
             <p className="text-xs text-nexus-text-secondary mb-3">Live economic indicators to provide real-world context for your report.</p>
            {isLoading && (
                <div className="flex items-center justify-center py-4">
                    <Spinner />
                </div>
            )}
            {error && <p className="text-xs text-red-500 bg-red-100 p-2 rounded-md">Could not load economic data.</p>}
            {!isLoading && !error && data && (
                <div className="space-y-2">
                    <DataPoint label="GDP (current USD)" data={data.gdp} type="currency" />
                    <DataPoint label="Population" data={data.population} type="number" />
                    <DataPoint label="Inflation (annual %)" data={data.inflation} type="percent" />
                    <DataPoint label="FDI, net inflows (USD)" data={data.fdi} type="currency" />
                    <button
                        onClick={() => onRefineObjective(data)}
                        disabled={isRefining}
                        className="!mt-4 w-full text-xs font-semibold p-2 rounded-md bg-nexus-accent-cyan/10 text-nexus-accent-cyan hover:bg-nexus-accent-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRefining ? 'Refining...' : 'Refine Objective with this Data'}
                    </button>
                </div>
            )}
        </div>
    );
};