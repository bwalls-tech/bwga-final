
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ReportParameters, UserProfile as UserProfileType, ReportSuggestions } from '../types.ts';
import { generateReportStream } from '../services/nexusService.ts';
import { REGIONS_AND_COUNTRIES, INDUSTRIES, AI_PERSONAS, ORGANIZATION_TYPES, ANALYTICAL_LENSES, TONES_AND_STYLES, TIERS_BY_ORG_TYPE } from '../constants.tsx';
import Card from './common/Card.tsx';
import Spinner from './Spinner.tsx';
import { Inquire } from './Inquire.tsx';
import { CustomPersonaIcon, CustomIndustryIcon, ArrowUpIcon } from './Icons.tsx';

type AiInteractionState = 'idle' | 'welcomed' | 'prompted' | 'answeredPrompt' | 'active';

interface ReportGeneratorProps {
    params: ReportParameters;
    onParamsChange: (params: ReportParameters) => void;
    onReportUpdate: (params: ReportParameters, content: string, error: string | null, generating: boolean) => void;
    onProfileUpdate: (profile: UserProfileType) => void;
    isGenerating: boolean;
    // Props for the Inquire Co-Pilot
    onApplySuggestions: (suggestions: ReportSuggestions) => void;
    savedReports: ReportParameters[];
    onSaveReport: (params: ReportParameters) => void;
    onLoadReport: (params: ReportParameters) => void;
    onDeleteReport: (reportName: string) => void;
}

const WIZARD_STEPS = [
    { id: 1, title: 'Profile' },
    { id: 2, title: 'Opportunity & Tiers' },
    { id: 3, title: 'Objective & Analyst' },
    { id: 4, title: 'Review & Generate' }
];

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
    params, 
    onParamsChange, 
    onReportUpdate, 
    onProfileUpdate, 
    isGenerating,
    ...inquireProps
}) => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [aiInteractionState, setAiInteractionState] = useState<AiInteractionState>('idle');
    
    // Local state for region/country dropdowns
    const [userRegion, setUserRegion] = useState('');
    const [targetRegion, setTargetRegion] = useState('');
    const [targetCountry, setTargetCountry] = useState('');
    const [targetCity, setTargetCity] = useState('');

    // State and ref for back-to-top button
    const [showScroll, setShowScroll] = useState(false);
    const scrollPanelRef = useRef<HTMLDivElement>(null);

    // Effect for scroll listener
    useEffect(() => {
        const panel = scrollPanelRef.current;
        if (!panel) return;

        const handleScroll = () => {
            if (panel.scrollTop > 300) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };

        panel.addEventListener('scroll', handleScroll);
        return () => panel.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        scrollPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // This effect triggers when the user starts typing their name
    useEffect(() => {
        if (params.userName.trim() && aiInteractionState === 'idle') {
            setAiInteractionState('welcomed');
        }
    }, [params.userName, aiInteractionState]);

    // This effect triggers when the user types a report name, making the AI fully active
    useEffect(() => {
        if (params.reportName.trim() && aiInteractionState !== 'active') {
            setAiInteractionState('active');
        }
    }, [params.reportName, aiInteractionState]);

    // This effect prompts the user if they've entered a name but paused without entering a report goal
    useEffect(() => {
        let timer: number;
        if (aiInteractionState === 'welcomed' && !params.reportName.trim()) {
            timer = window.setTimeout(() => {
                setAiInteractionState('prompted');
            }, 5000); // 5-second delay
        }
        return () => clearTimeout(timer);
    }, [aiInteractionState, params.reportName]);


    const handleChange = (field: keyof ReportParameters, value: any) => {
        onParamsChange({ ...params, [field]: value });
    };
    
    // Effect to find user's region when their country is set (e.g., from loading a report)
    useEffect(() => {
        if (params.userCountry) {
            const region = REGIONS_AND_COUNTRIES.find(r => r.countries.includes(params.userCountry));
            if (region && region.name !== userRegion) {
                setUserRegion(region.name);
            }
        }
    }, [params.userCountry]);

    // Effect to parse the `params.region` string into the UI fields for Step 2
    useEffect(() => {
        const regionValue = params.region;
        if (regionValue) {
            const parts = regionValue.split(',').map(p => p.trim());
            const potentialCountry = parts[parts.length - 1];
            const foundRegionData = REGIONS_AND_COUNTRIES.find(r => r.countries.includes(potentialCountry));

            if (foundRegionData) {
                setTargetRegion(foundRegionData.name);
                setTargetCountry(potentialCountry);
                setTargetCity(parts.slice(0, -1).join(', '));
            } else {
                setTargetRegion('');
                setTargetCountry('');
                setTargetCity(regionValue);
            }
        } else {
            setTargetRegion('');
            setTargetCountry('');
            setTargetCity('');
        }
    }, [params.region]);
    
    // Effect to combine the local city/country state back into `params.region`
    useEffect(() => {
        const combinedRegion = [targetCity, targetCountry].filter(Boolean).join(', ');
        if (combinedRegion !== params.region) {
            handleChange('region', combinedRegion);
        }
    }, [targetCity, targetCountry]);


    const handleMultiSelectToggle = (field: 'aiPersona' | 'analyticalLens' | 'toneAndStyle' | 'industry' | 'tier', value: string) => {
        const currentValues = params[field] as string[] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        
        // This logic is a UI enhancement to prevent unselecting the last item on required fields
        if ((field === 'aiPersona' || field === 'industry') && newValues.length === 0 && (params[field] as string[]).length > 0) {
            return; // Don't allow unselecting the last one if it's required to have at least one
        }

        onParamsChange({ ...params, [field]: newValues });
    };
    
    const getValidationErrors = useCallback((stepNum: number): string[] => {
        const errors: string[] = [];
        switch(stepNum) {
            case 1:
                if (!params.userName.trim()) errors.push("Your Name is required.");
                // Report Name validation is now handled in nextStep
                break;
            case 2:
                if (params.tier.length === 0) errors.push("At least one Report Tier must be selected.");
                if (!params.region.trim()) errors.push("A target location is required.");
                if (params.industry.length === 0) errors.push("At least one Core Industry must be selected.");
                if (params.industry.includes('Custom') && !params.customIndustry?.trim()) errors.push("Custom Industry Definition is required when 'Custom' is selected.");
                if (!params.idealPartnerProfile.trim()) errors.push("Ideal Partner Profile is required.");
                break;
            case 3:
                if (!params.problemStatement.trim()) errors.push("Core Objective is required.");
                if (params.aiPersona.length === 0) errors.push("At least one AI Analyst persona must be selected.");
                if (params.aiPersona.includes('Custom') && !params.customAiPersona?.trim()) errors.push("Custom Persona Definition is required when 'Custom' is selected.");
                break;
            default:
                break;
        }
        return errors;
    }, [params]);

    const nextStep = () => {
        setError(null);
        scrollToTop();

        // Custom validation for Step 1's interactive AI flow
        if (step === 1) {
            if (!params.reportName.trim() && aiInteractionState !== 'answeredPrompt' && aiInteractionState !== 'active') {
                setError("Please provide a Report Name or respond to the Nexus AI assistant's prompt before proceeding.");
                setAiInteractionState('prompted'); // Force the prompt if user clicks next too early
                return;
            }
        }

        const validationErrors = getValidationErrors(step);
        if (validationErrors.length === 0) {
            if (step < WIZARD_STEPS.length) setStep(s => s + 1);
        } else {
            setError(validationErrors.join(' '));
        }
    };

    const prevStep = () => {
        setError(null);
        scrollToTop();
        if (step > 1) setStep(s => s - 1);
    };

    const handleGenerateReport = useCallback(async () => {
        setError(null);
        const allErrors = [
            ...getValidationErrors(1),
            ...getValidationErrors(2),
            ...getValidationErrors(3),
        ];

        if (allErrors.length > 0) {
            setError("Some steps are incomplete. Please go back and fill all required fields. Missing: " + allErrors.join(', '));
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
    }, [params, onReportUpdate, onProfileUpdate, getValidationErrors]);

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
                        <div className="mt-4"><label className={labelStyles}>Report Name / Goal *</label><input type="text" value={params.reportName} onChange={e => handleChange('reportName', e.target.value)} className={inputStyles} placeholder="e.g., AgriTech Partners for Mindanao" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div><label className={labelStyles}>Organization Type</label><select value={params.organizationType} onChange={e => handleChange('organizationType', e.target.value)} className={inputStyles}>{ORGANIZATION_TYPES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                             <div>
                                <label className={labelStyles}>Your Region</label>
                                <select value={userRegion} onChange={e => { setUserRegion(e.target.value); handleChange('userCountry', ''); }} className={inputStyles}>
                                    <option value="">Select Region</option>
                                    {REGIONS_AND_COUNTRIES.map(region => <option key={region.name} value={region.name}>{region.name}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                             <div>
                                <label className={labelStyles}>Your Country</label>
                                <select value={params.userCountry} onChange={e => handleChange('userCountry', e.target.value)} disabled={!userRegion} className={`${inputStyles} disabled:bg-nexus-border-subtle`}>
                                    <option value="">Select Country</option>
                                    {REGIONS_AND_COUNTRIES.find(r => r.name === userRegion)?.countries.map(country => <option key={country} value={country}>{country}</option>)}
                                </select>
                            </div>
                        </div>
                    </Card>
                );
            case 2: // Opportunity & Tiers
                return (
                    <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">The Opportunity & Report Tiers</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">First, select the depth of analysis required, then define the "what" and "where" of the opportunity.</p>
                        
                        <div className="mt-4">
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

                        <div className="mt-6 pt-6 border-t border-nexus-border-medium">
                            <h4 className="text-lg font-semibold text-nexus-text-primary mb-3">Opportunity Details</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyles}>Target Region *</label>
                                    <select value={targetRegion} onChange={e => { setTargetRegion(e.target.value); setTargetCountry(''); setTargetCity(''); }} className={inputStyles}>
                                        <option value="">Select Region</option>
                                        {REGIONS_AND_COUNTRIES.map(region => <option key={region.name} value={region.name}>{region.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyles}>Target Country *</label>
                                     <select value={targetCountry} onChange={e => setTargetCountry(e.target.value)} disabled={!targetRegion} className={`${inputStyles} disabled:bg-nexus-border-subtle`}>
                                        <option value="">Select Country</option>
                                        {REGIONS_AND_COUNTRIES.find(r => r.name === targetRegion)?.countries.map(country => <option key={country} value={country}>{country}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                               <div>
                                    <label className={labelStyles}>Target City / Area</label>
                                    <input type="text" value={targetCity} onChange={e => setTargetCity(e.target.value)} className={inputStyles} placeholder="e.g., Davao City" />
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
                const isInvalid = (field: keyof ReportParameters, condition?: boolean) => {
                    const value = params[field];
                    if (condition === false) return false;
                    if (Array.isArray(value)) return value.length === 0;
                    if (typeof value === 'string') return !value.trim();
                    return false;
                };

                const summaryItemClasses = (invalid: boolean) =>
                    `p-2 rounded-md transition-colors ${invalid ? 'bg-red-50 border border-red-200 shadow-inner' : ''}`;


                const SummaryItem: React.FC<{label: string, value: React.ReactNode, invalid?: boolean}> = ({label, value, invalid = false}) => (
                    <div className={summaryItemClasses(invalid)}>
                        <p className="text-sm font-semibold text-nexus-text-secondary">{label}</p>
                        <div className="text-nexus-text-primary pl-2">{value || <span className="text-red-500 italic">Not Provided</span>}</div>
                    </div>
                );
                
                return (
                     <Card>
                        <h3 className="text-xl font-bold text-nexus-text-primary mb-1">Review & Generate</h3>
                        <p className="text-nexus-text-secondary mb-4 text-sm">Review your selections. The AI Co-pilot has provided a final quality score and recommendations.</p>
                        
                        <div className="space-y-4 p-4 bg-white border border-nexus-border-medium rounded-lg">
                            <SummaryItem label="Report Name" value={params.reportName} invalid={isInvalid('reportName')} />
                            <SummaryItem label="Operator" value={`${params.userName || 'N/A'} (${params.organizationType})`} invalid={isInvalid('userName')} />
                            <SummaryItem label="Report Tiers" value={<ul className="list-disc list-inside">{params.tier.map(t => <li key={t}>{currentTiers.find(tier => tier.id === t)?.title || t}</li>)}</ul>} invalid={isInvalid('tier')} />
                            <SummaryItem label="Target" value={`${params.region || 'N/A'} — ${params.industry.filter(i=>i !== 'Custom').join(', ') || 'N/A'}`} invalid={isInvalid('region') || isInvalid('industry')} />
                            <SummaryItem label="Custom Industry" value={params.customIndustry} invalid={isInvalid('customIndustry', params.industry.includes('Custom'))} />
                            <SummaryItem label="Core Objective" value={<p className="italic">"{params.problemStatement}"</p>} invalid={isInvalid('problemStatement')} />
                            <SummaryItem label="AI Personas" value={<ul className="list-disc list-inside">{params.aiPersona.filter(p=>p !== 'Custom').map(p => <li key={p}>{p}</li>)}</ul>} invalid={isInvalid('aiPersona')} />
                            <SummaryItem label="Custom Persona" value={params.customAiPersona} invalid={isInvalid('customAiPersona', params.aiPersona.includes('Custom'))} />
                        </div>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="generator-workspace">
            <div ref={scrollPanelRef} className="generator-panel">
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
                                <div key={s.id} className="wizard-progress-step" onClick={() => { if (!isGenerating) setStep(s.id); }}>
                                    <div className={`wizard-step-circle ${step === s.id ? 'active' : (step > s.id ? 'completed' : 'inactive')}`}>
                                        {step > s.id ? '✓' : s.id}
                                    </div>
                                    <span className={`wizard-step-label ${step >= s.id ? 'active' : 'inactive'}`}>{s.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Scrolling Content --- */}
                    <div className="flex-grow mt-8 pr-4 -mr-4">
                        {renderStepContent()}
                    </div>
                    
                    {/* --- Non-scrolling Footer --- */}
                    <div className="flex-shrink-0 pt-8 pb-4 md:pb-8">
                        {error && <p className="text-red-600 text-center mb-4 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
                        
                        <div className="wizard-nav" style={{ marginTop: 0 }}>
                            <button onClick={prevStep} disabled={step === 1 || isGenerating} className="nexus-button-secondary">Back</button>
                            
                            {step < WIZARD_STEPS.length ? (
                                <button onClick={nextStep} disabled={isGenerating} className="nexus-button-primary">Next</button>
                            ) : (
                                <button onClick={handleGenerateReport} disabled={isGenerating} className="w-full max-w-xs bg-gradient-to-r from-nexus-accent-gold to-nexus-accent-gold-dark text-black font-bold py-3 px-8 rounded-xl text-lg shadow-lg shadow-nexus-accent-gold/30 hover:shadow-xl hover:shadow-nexus-accent-gold/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-accent-gold/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                    {isGenerating ? <><Spinner /> Generating...</> : 'Generate Report'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="inquire-panel">
                <Inquire 
                    {...inquireProps} 
                    params={params} 
                    wizardStep={step}
                    aiInteractionState={aiInteractionState}
                    onAiInteractionStateChange={setAiInteractionState}
                />
            </div>

            <button
                onClick={scrollToTop}
                className={`back-to-top-btn ${showScroll ? 'visible' : ''}`}
                aria-label="Back to top"
            >
                <ArrowUpIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default ReportGenerator;
