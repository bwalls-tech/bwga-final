
import React, { useState, useEffect, useCallback } from 'react';
import type { ReportParameters, UserProfile as UserProfileType } from '../types.ts';
import { generateReportStream } from '../services/nexusService.ts';
import { COUNTRIES, INDUSTRIES, AI_PERSONAS, ANALYTICAL_MODULES, ORGANIZATION_TYPES, ANALYTICAL_LENSES, TONES_AND_STYLES, TIERS_BY_ORG_TYPE } from '../constants.tsx';
import Card from './common/Card.tsx';
import Spinner from './Spinner.tsx';
import { QuestionMarkCircleIcon, CustomPersonaIcon, CustomIndustryIcon } from './Icons.tsx';

interface ReportGeneratorProps {
    params: ReportParameters;
    onParamsChange: (params: ReportParameters) => void;
    onReportUpdate: (params: ReportParameters, content: string, error: string | null, generating: boolean) => void;
    onProfileUpdate: (profile: UserProfileType) => void;
    isGenerating: boolean;
}

const WIZARD_STEPS = [
    { id: 1, title: 'Profile' },
    { id: 2, title: 'Opportunity & Tiers' },
    { id: 3, title: 'Objective & Analyst' },
    { id: 4, title: 'Review & Generate' }
];

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ params, onParamsChange, onReportUpdate, onProfileUpdate, isGenerating }) => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [coPilotSuggestion, setCoPilotSuggestion] = useState<string | null>(null);
    const [qualityScore, setQualityScore] = useState<{ score: number; recommendations: string[] } | null>(null);


    const handleChange = (field: keyof ReportParameters, value: any) => {
        onParamsChange({ ...params, [field]: value });
    };

    const handleMultiSelectToggle = (field: 'aiPersona' | 'analyticalLens' | 'toneAndStyle' | 'industry' | 'tier', value: string) => {
        const currentValues = params[field] as string[] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        
        if ((field === 'aiPersona' || field === 'industry' || field === 'tier') && newValues.length === 0) {
            return;
        }

        onParamsChange({ ...params, [field]: newValues });
    };
    
    const handleAddPersona = (persona: string) => {
        const currentPersonas = params.aiPersona || [];
        if (!currentPersonas.includes(persona)) {
            onParamsChange({ ...params, aiPersona: [...currentPersonas, persona] });
        }
    };

    const calculateQualityScore = useCallback(() => {
        let score = 0;
        const recommendations: string[] = [];
    
        if (params.reportName.trim()) score += 10;
        else recommendations.push("Provide a descriptive Report Name.");
    
        if (params.tier.length > 0) score += 15;
        else recommendations.push("Select at least one Report Tier to define the scope.");
    
        if (params.region.trim()) score += 10;
        else recommendations.push("Specify a Target Region for focused analysis.");
    
        if (params.industry.length > 0) score += 10;
        else recommendations.push("Choose a Core Industry to guide the search.");
    
        if (params.idealPartnerProfile.trim().length > 50) score += 20;
        else if (params.idealPartnerProfile.trim().length > 0) {
            score += 10;
            recommendations.push("Your 'Ideal Partner Profile' is brief. More detail will improve partner matching.");
        } else {
            recommendations.push("Describe your Ideal Partner for effective matchmaking.");
        }
    
        if (params.problemStatement.trim().length > 50) score += 25;
        else if (params.problemStatement.trim().length > 0) {
            score += 10;
            recommendations.push("Your 'Core Objective' is concise. Expanding on it can enhance strategic alignment.");
        } else {
            recommendations.push("Define a Core Objective to guide the AI's analysis.");
        }
    
        if (params.aiPersona.length > 0) score += 10;
        else recommendations.push("Select an AI Persona to frame the analysis.");
    
        setQualityScore({ score: Math.min(100, score), recommendations });
    }, [params]);

    useEffect(() => {
        if (params.problemStatement.length < 30) {
            setCoPilotSuggestion(null);
            return;
        }
        const statement = params.problemStatement.toLowerCase();
        let suggestion: string | null = null;
        if (statement.includes('policy') || statement.includes('risk') || statement.includes('stability')) {
            suggestion = 'Geopolitical Strategist';
        } else if (statement.includes('investment') || statement.includes('market') || statement.includes('roi') || statement.includes('scale')) {
            suggestion = 'Venture Capitalist';
        } else if (statement.includes('economic') || statement.includes('supply chain') || statement.includes('workforce') || statement.includes('gdp')) {
            suggestion = 'Regional Economist';
        }

        if (suggestion && !params.aiPersona.includes(suggestion)) {
            setCoPilotSuggestion(suggestion);
        } else {
            setCoPilotSuggestion(null);
        }
    }, [params.problemStatement, params.aiPersona]);
    
    useEffect(() => {
        if (step === 4) {
            calculateQualityScore();
        }
    }, [params, step, calculateQualityScore]);


    const isStepValid = (stepNum: number) => {
        switch(stepNum) {
            case 1: return params.reportName.trim() !== '' && params.userName.trim() !== '';
            case 2: return params.tier.length > 0 && params.region.trim() !== '' && params.industry.length > 0 && params.idealPartnerProfile.trim() !== '' && (!params.industry.includes('Custom') || !!params.customIndustry?.trim());
            case 3: return params.problemStatement.trim() !== '' && params.aiPersona.length > 0 && (!params.aiPersona.includes('Custom') || !!params.customAiPersona?.trim());
            default: return true;
        }
    };

    const nextStep = () => {
        if (isStepValid(step)) {
            setError(null);
            if (step < WIZARD_STEPS.length) setStep(s => s + 1);
        } else {
            setError("Please complete all required fields before proceeding.");
        }
    };

    const prevStep = () => {
        setError(null);
        if (step > 1) setStep(s => s - 1);
    };

    const handleGenerateReport = useCallback(async () => {
        setError(null);
        if (!isStepValid(1) || !isStepValid(2) || !isStepValid(3)) {
            setError("Some steps are incomplete. Please go back and fill all required fields.");
            return;
        }
        
        onProfileUpdate({ userName: params.userName, userDepartment: params.userDepartment, organizationType: params.organizationType, userCountry: params.userCountry });
        onReportUpdate(params, '', null, true);

        try {
            const stream = await generateReportStream(params);
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let content = '';
            let decodedChunk = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                decodedChunk = decoder.decode(value, { stream: true });
                content += decodedChunk;
                onReportUpdate(params, content, null, true);
            }
            onReportUpdate(params, content, null, false);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            console.error("Report generation failed:", errorMessage);
            setError(errorMessage);
            onReportUpdate(params, '', errorMessage, false);
        }
    }, [params, onReportUpdate, onProfileUpdate]);

    const inputStyles = "w-full p-3 bg-nexus-surface-700 border border-nexus-border-medium rounded-lg focus:ring-2 focus:ring-nexus-accent-gold focus:outline-none transition placeholder:text-nexus-text-muted";
    const labelStyles = "block text-sm font-medium text-nexus-text-secondary mb-2";
    const currentTiers = TIERS_BY_ORG_TYPE[params.organizationType] || TIERS_BY_ORG_TYPE['Default'];

    const renderStepContent = () => {
        switch (step) {
            case 1: // Profile
                return (
                    <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">Your Profile (The Operator)</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">This context frames the analysis from your unique strategic perspective.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelStyles}>Your Name *</label><input type="text" value={params.userName} onChange={e => handleChange('userName', e.target.value)} className={inputStyles} placeholder="e.g., Jane Doe" /></div>
                            <div><label className={labelStyles}>Department</label><input type="text" value={params.userDepartment} onChange={e => handleChange('userDepartment', e.target.value)} className={inputStyles} placeholder="e.g., Investment Promotion" /></div>
                        </div>
                        <div className="mt-4"><label className={labelStyles}>Report Name *</label><input type="text" value={params.reportName} onChange={e => handleChange('reportName', e.target.value)} className={inputStyles} placeholder="e.g., AgriTech Partners for Mindanao" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div><label className={labelStyles}>Organization Type</label><select value={params.organizationType} onChange={e => handleChange('organizationType', e.target.value)} className={inputStyles}>{ORGANIZATION_TYPES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                            <div><label className={labelStyles}>Your Country</label><select value={params.userCountry} onChange={e => handleChange('userCountry', e.target.value)} className={inputStyles}>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                    </Card>
                );
            case 2: // Opportunity & Tiers
                return (
                    <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">The Opportunity & Report Tiers</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">Define the "what" and "where" of the opportunity, then select the depth of analysis required.</p>
                        
                        <h4 className="text-lg font-semibold text-nexus-text-primary mb-3 mt-4">Opportunity Details</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyles}>Target Regional City / Area *</label>
                                <input type="text" value={params.region} onChange={e => handleChange('region', e.target.value)} className={inputStyles} placeholder="e.g., Davao City, Philippines" />
                            </div>
                            <div>
                                <label className={labelStyles}>Analysis Timeframe</label>
                                <select value={params.analysisTimeframe} onChange={e => handleChange('analysisTimeframe', e.target.value)} className={inputStyles}>
                                    <option>Any Time</option><option>Last 6 Months</option><option>Last 12 Months</option><option>Last 2 Years</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className={labelStyles}>Core Industry Focus (Select one or more) *</label>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {INDUSTRIES.map((industry) => (
                                    <button key={industry.id} onClick={() => handleMultiSelectToggle('industry', industry.id)} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center h-full group ${params.industry.includes(industry.id) ? 'border-nexus-accent-gold bg-nexus-accent-gold/5 scale-105 shadow-md' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`}>
                                        <industry.icon className={`w-8 h-8 mb-2 transition-colors ${params.industry.includes(industry.id) ? 'text-nexus-accent-gold' : 'text-nexus-text-secondary group-hover:text-nexus-text-primary'}`} />
                                        <span className="font-semibold text-nexus-text-primary text-xs leading-tight">{industry.title}</span>
                                    </button>
                                ))}
                                <button onClick={() => handleMultiSelectToggle('industry', 'Custom')} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center h-full group ${params.industry.includes('Custom') ? 'border-nexus-accent-gold bg-nexus-accent-gold/5 scale-105 shadow-md' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`} title="Define a custom industry">
                                    <CustomIndustryIcon className={`w-8 h-8 mb-2 transition-colors ${params.industry.includes('Custom') ? 'text-nexus-accent-gold' : 'text-nexus-text-secondary group-hover:text-nexus-text-primary'}`} />
                                    <span className="font-semibold text-nexus-text-primary text-xs leading-tight">Custom</span>
                                </button>
                            </div>
                        </div>
                        {params.industry.includes('Custom') && (
                            <div className="mt-4">
                                <label className={labelStyles}>Custom Industry Definition *</label>
                                <textarea value={params.customIndustry} onChange={e => handleChange('customIndustry', e.target.value)} rows={2} className={inputStyles} placeholder="Describe the custom industry or niche sector..." />
                            </div>
                        )}
                        <div className="mt-6">
                            <label className={labelStyles}>Ideal Partner Profile *</label>
                            <textarea value={params.idealPartnerProfile} onChange={e => handleChange('idealPartnerProfile', e.target.value)} rows={4} className={inputStyles} placeholder="Describe your ideal partner in detail (e.g., size, technologies, target markets)..." />
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-nexus-border-medium">
                            <h4 className="text-lg font-semibold text-nexus-text-primary mb-3">Report Tiers (The 'How') *</h4>
                            <p className="text-nexus-text-secondary mb-4 text-sm">Select one or more report types. The AI will synthesize them into a single, comprehensive blueprint.</p>
                            <div className="grid md:grid-cols-2 gap-4">
                            {currentTiers.map((tier) => (
                                    <label key={tier.id} className={`p-4 rounded-lg text-left border-2 transition-all w-full flex flex-col h-full cursor-pointer ${params.tier.includes(tier.id) ? 'border-nexus-accent-cyan bg-nexus-accent-cyan/5 scale-105 shadow-md' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`}>
                                        <div className="flex justify-between items-center">
                                        <span className="font-bold text-nexus-text-primary text-lg">{tier.title}</span>
                                            <input
                                                type="checkbox"
                                                checked={params.tier.includes(tier.id)}
                                                onChange={() => handleMultiSelectToggle('tier', tier.id)}
                                                className="h-5 w-5 rounded border-gray-300 text-nexus-accent-cyan focus:ring-nexus-accent-cyan"
                                            />
                                        </div>
                                        <p className="text-xs text-nexus-text-secondary mt-1 mb-3 flex-grow">{tier.desc}</p>
                                        <ul className="text-xs text-nexus-text-secondary space-y-1">
                                            {tier.features.map(f => <li key={f} className="flex items-center gap-2"><span className="text-nexus-accent-cyan">✓</span> {f}</li>)}
                                        </ul>
                                    </label>
                            ))}
                            </div>
                        </div>
                    </Card>
                );
             case 3: // Objective & AI Analyst
                return (
                    <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">The Objective & AI Analyst (The 'Why' & 'How')</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">Articulate your core objective and configure the AI's analytical perspective.</p>
                        
                        <div className="mt-4">
                            <label className={labelStyles}>Define Core Objective (The 'Why') *</label>
                            <textarea value={params.problemStatement} onChange={e => handleChange('problemStatement', e.target.value)} rows={5} className={inputStyles} placeholder="Describe the primary goal. What problem are you trying to solve or what opportunity are you trying to capture?" />
                            {coPilotSuggestion && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <QuestionMarkCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-blue-800">AI Co-pilot Suggestion</h4>
                                        <p className="text-sm text-blue-700">Based on your objective, consider adding the <strong>{coPilotSuggestion}</strong> persona for a more aligned analysis.</p>
                                        <div className="mt-2 space-x-3">
                                            <button onClick={() => { handleAddPersona(coPilotSuggestion); setCoPilotSuggestion(null); }} className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">Add Persona</button>
                                            <button onClick={() => setCoPilotSuggestion(null)} className="text-xs text-blue-600 hover:underline">Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-nexus-border-medium">
                            <label className={labelStyles}>Configure AI Analyst *</label>
                            <div className="grid grid-cols-4 gap-2">
                                {AI_PERSONAS.map((persona) => (
                                    <button key={persona.id} onClick={() => handleMultiSelectToggle('aiPersona', persona.id)} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center h-full group ${params.aiPersona.includes(persona.id) ? 'border-nexus-accent-gold bg-nexus-accent-gold/5 scale-105 shadow-md' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`} title={persona.description}>
                                        <persona.icon className={`w-8 h-8 mb-2 transition-colors ${params.aiPersona.includes(persona.id) ? 'text-nexus-accent-gold' : 'text-nexus-text-secondary group-hover:text-nexus-text-primary'}`} />
                                        <span className="font-semibold text-nexus-text-primary text-xs leading-tight">{persona.title}</span>
                                    </button>
                                ))}
                                <button onClick={() => handleMultiSelectToggle('aiPersona', 'Custom')} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center h-full group ${params.aiPersona.includes('Custom') ? 'border-nexus-accent-gold bg-nexus-accent-gold/5 scale-105 shadow-md' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`} title="Define a custom persona">
                                    <CustomPersonaIcon className={`w-8 h-8 mb-2 transition-colors ${params.aiPersona.includes('Custom') ? 'text-nexus-accent-gold' : 'text-nexus-text-secondary group-hover:text-nexus-text-primary'}`} />
                                    <span className="font-semibold text-nexus-text-primary text-xs leading-tight">Custom</span>
                                </button>
                            </div>

                            {params.aiPersona.includes('Custom') && (
                                <div className="mt-4">
                                    <label className={labelStyles}>Custom Persona Definition *</label>
                                    <textarea value={params.customAiPersona} onChange={e => handleChange('customAiPersona', e.target.value)} rows={3} className={inputStyles} placeholder="Describe the persona's expertise, focus, and tone..." />
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className={labelStyles}>Analytical Lenses</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {ANALYTICAL_LENSES.map(lens => (
                                        <label key={lens} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${params.analyticalLens?.includes(lens) ? 'border-nexus-accent-cyan bg-nexus-accent-cyan/5 shadow-sm' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`}>
                                            <input type="checkbox" checked={params.analyticalLens?.includes(lens)} onChange={() => handleMultiSelectToggle('analyticalLens', lens)} className="h-4 w-4 rounded border-gray-300 text-nexus-accent-cyan focus:ring-nexus-accent-cyan" />
                                            <span className="text-sm font-medium text-nexus-text-primary">{lens}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelStyles}>Tones & Styles</label>
                                    <div className="grid grid-cols-1 gap-2">
                                    {TONES_AND_STYLES.map(style => (
                                        <label key={style} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${params.toneAndStyle?.includes(style) ? 'border-nexus-accent-cyan bg-nexus-accent-cyan/5 shadow-sm' : 'border-nexus-border-medium hover:border-nexus-border-subtle bg-white hover:bg-nexus-surface-800'}`}>
                                            <input type="checkbox" checked={params.toneAndStyle?.includes(style)} onChange={() => handleMultiSelectToggle('toneAndStyle', style)} className="h-4 w-4 rounded border-gray-300 text-nexus-accent-cyan focus:ring-nexus-accent-cyan"/>
                                            <span className="text-sm font-medium text-nexus-text-primary">{style}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            case 4: // Review & Generate
                const SummaryItem: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
                    <div>
                        <p className="text-sm font-semibold text-nexus-text-secondary">{label}</p>
                        <div className="text-nexus-text-primary pl-2">{value}</div>
                    </div>
                );
                const scoreColor = qualityScore && qualityScore.score > 80 ? 'text-green-500' : qualityScore && qualityScore.score > 60 ? 'text-yellow-500' : 'text-red-500';

                return (
                     <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">Review & Generate</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">Review your selections and the configuration quality score before generating the blueprint.</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4 p-4 bg-white border border-nexus-border-medium rounded-lg">
                                <SummaryItem label="Report Name" value={params.reportName} />
                                <SummaryItem label="Operator" value={`${params.userName} (${params.organizationType})`} />
                                <SummaryItem label="Report Tiers" value={<ul className="list-disc list-inside">{params.tier.map(t => <li key={t}>{currentTiers.find(tier => tier.id === t)?.title || t}</li>)}</ul>} />
                                <SummaryItem label="Target" value={`${params.region} — ${params.industry.filter(i=>i !== 'Custom').join(', ')}`} />
                                {params.industry.includes('Custom') && <SummaryItem label="Custom Industry" value={params.customIndustry} />}
                                <SummaryItem label="Core Objective" value={<p className="italic">"{params.problemStatement}"</p>} />
                                <SummaryItem label="AI Personas" value={<ul className="list-disc list-inside">{params.aiPersona.filter(p=>p !== 'Custom').map(p => <li key={p}>{p}</li>)}</ul>} />
                                {params.aiPersona.includes('Custom') && <SummaryItem label="Custom Persona" value={params.customAiPersona} />}
                            </div>
                            <div className="p-4 bg-white border border-nexus-border-medium rounded-lg flex flex-col items-center justify-center text-center">
                                {qualityScore && (
                                    <>
                                        <p className="text-sm font-semibold text-nexus-text-secondary">Configuration Quality</p>
                                        <p className={`text-7xl font-bold ${scoreColor}`}>{qualityScore.score}</p>
                                        <p className="text-nexus-text-secondary text-sm font-semibold">out of 100</p>
                                        {qualityScore.recommendations.length > 0 && (
                                            <div className="mt-4 text-left w-full">
                                                <h4 className="text-xs font-bold uppercase text-nexus-text-secondary">Recommendations:</h4>
                                                <ul className="text-xs list-disc list-inside text-nexus-text-secondary mt-1 space-y-1">
                                                    {qualityScore.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-full flex flex-col">
            {/* --- Non-scrolling Header --- */}
            <div className="flex-shrink-0 pt-4 md:pt-8">
                <header className="text-center mb-8">
                    <h2 className="text-4xl font-extrabold text-nexus-text-primary tracking-tighter">Intelligence Blueprint Generator</h2>
                    <p className="mt-2 text-lg text-nexus-text-secondary max-w-2xl mx-auto">Follow the steps to configure and generate your strategic report.</p>
                </header>

                <div className="wizard-progress-bar">
                    <div className="wizard-progress-line"></div>
                    <div className="wizard-progress-line-filled" style={{ width: `${((step - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}></div>
                    {WIZARD_STEPS.map(s => (
                        <div key={s.id} className="wizard-progress-step" onClick={() => setStep(s.id)}>
                            <div className={`wizard-step-circle ${step === s.id ? 'active' : (step > s.id ? 'completed' : 'inactive')}`}>
                                {step > s.id ? '✓' : s.id}
                            </div>
                            <span className={`wizard-step-label ${step >= s.id ? 'active' : 'inactive'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Scrolling Content --- */}
            <div className="flex-grow overflow-y-auto mt-8 pr-4 -mr-4">
                {renderStepContent()}
            </div>
            
            {/* --- Non-scrolling Footer --- */}
            <div className="flex-shrink-0 pt-8 pb-4 md:pb-8">
                {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}
                
                <div className="wizard-nav" style={{ marginTop: 0 }}>
                    <button onClick={prevStep} disabled={step === 1 || isGenerating} className="nexus-button-secondary">Back</button>
                    
                    {step < WIZARD_STEPS.length ? (
                        <button onClick={nextStep} disabled={!isStepValid(step) || isGenerating} className="nexus-button-primary">Next</button>
                    ) : (
                        <button onClick={handleGenerateReport} disabled={isGenerating || !isStepValid(1) || !isStepValid(2) || !isStepValid(3)} className="w-full max-w-xs bg-gradient-to-r from-nexus-accent-gold to-nexus-accent-gold-dark text-black font-bold py-3 px-8 rounded-xl text-lg shadow-lg shadow-nexus-accent-gold/30 hover:shadow-xl hover:shadow-nexus-accent-gold/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-accent-gold/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                            {isGenerating ? <><Spinner /> Generating...</> : 'Generate Report'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;