

import React, { useState } from 'react';
import type { LiveOpportunityItem } from '../types.ts';
import useEscapeKey from '../hooks/useEscapeKey.ts';
import { CloseIcon, PlusCircleIcon } from './Icons.tsx';
import { COUNTRIES, INDUSTRIES } from '../constants.tsx';

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<LiveOpportunityItem, 'isUserAdded' | 'ai_feasibility_score' | 'ai_risk_assessment'>) => void;
}

export const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({ isOpen, onClose, onSave }) => {
    useEscapeKey(onClose);

    const [projectName, setProjectName] = useState('');
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [sector, setSector] = useState(INDUSTRIES[0].id);
    const [value, setValue] = useState('');
    const [summary, setSummary] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!projectName.trim() || !summary.trim()) {
            setError('Project Name and Summary are required.');
            return;
        }
        onSave({
            project_name: projectName,
            country: country,
            sector: sector,
            value: value,
            summary: summary,
            source_url: sourceUrl,
        });
        // Clear form for next time
        setProjectName('');
        setCountry(COUNTRIES[0]);
        setSector(INDUSTRIES[0].id);
        setValue('');
        setSummary('');
        setSourceUrl('');
    };
    
    if (!isOpen) return null;

    const inputStyles = "w-full p-3 bg-nexus-primary-900 border border-nexus-border-medium rounded-lg focus:ring-2 focus:ring-nexus-accent-gold focus:outline-none transition placeholder:text-nexus-text-muted text-nexus-text-primary";
    const labelStyles = "block text-sm font-medium text-nexus-text-secondary mb-2";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog">
            <div 
                className="bg-gradient-to-br from-nexus-surface-800 to-nexus-primary-800 border border-nexus-border-medium rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex justify-between items-center border-b border-nexus-border-medium flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PlusCircleIcon className="w-8 h-8 text-nexus-accent-emerald" />
                        <div>
                        <h2 className="text-xl font-bold text-nexus-text-primary">List a New Project or Opportunity</h2>
                        <p className="text-sm text-nexus-text-secondary">Add an initiative to your private watchlist.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-nexus-text-secondary hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="projectName" className={labelStyles}>Project Name *</label>
                            <input type="text" id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} className={inputStyles} placeholder="e.g., National Fiber Optic Backbone Expansion" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="country" className={labelStyles}>Country *</label>
                                <select id="country" value={country} onChange={e => setCountry(e.target.value)} className={inputStyles} required>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="sector" className={labelStyles}>Sector *</label>
                                <select id="sector" value={sector} onChange={e => setSector(e.target.value)} className={inputStyles} required>
                                    {INDUSTRIES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="value" className={labelStyles}>Project Value (Optional)</label>
                            <input type="text" id="value" value={value} onChange={e => setValue(e.target.value)} className={inputStyles} placeholder="e.g., $250 Million" />
                        </div>
                        <div>
                            <label htmlFor="summary" className={labelStyles}>Summary / Project Notes *</label>
                            <textarea id="summary" value={summary} onChange={e => setSummary(e.target.value)} rows={4} className={inputStyles} placeholder="Provide a brief overview of the project, its goals, and current status." required />
                        </div>
                         <div>
                            <label htmlFor="sourceUrl" className={labelStyles}>Source URL (Optional)</label>
                            <input type="url" id="sourceUrl" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className={inputStyles} placeholder="https://example.gov/project-details" />
                        </div>
                        {error && <p className="text-nexus-error text-sm text-center">{error}</p>}
                    </main>

                    <footer className="p-4 border-t border-nexus-border-medium flex-shrink-0 flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="nexus-button-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="nexus-button-primary">
                            Save Project
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};