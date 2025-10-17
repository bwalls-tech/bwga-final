import React, { useState, useEffect, useRef } from 'react';
// FIX: Imported RROI_Component to be used for type safety in the RROIResultDisplay component.
import type { ReportParameters, ReportSuggestions, AiCapability, AiCapabilitiesResponse, EconomicData, NexusBrainState, RROI_Index, TPT_Simulation, SEAM_Blueprint, RROI_Component } from '../types.ts';
import { fetchResearchAndScope, fetchCapabilities, refineObjectiveWithContext, diagnoseRegion, simulatePathway, architectEcosystem } from '../services/nexusService.ts';
import { EconomicSnapshot } from './EconomicSnapshot.tsx';
import { SavedWorkManager } from './SavedWorkManager.tsx';
import Spinner from './Spinner.tsx';
import { ChatBubbleLeftRightIcon, QuestionMarkCircleIcon, NexusLogo } from './Icons.tsx';

// Declare global marked for markdown parsing
declare var marked: any;

type AiInteractionState = 'idle' | 'welcomed' | 'prompted' | 'answeredPrompt' | 'active';
type BrainCommand = 'diagnose' | 'simulate' | 'architect';

interface InquireProps {
    params: ReportParameters;
    onApplySuggestions: (suggestions: ReportSuggestions) => void;
    savedReports: ReportParameters[];
    onSaveReport: (params: ReportParameters) => void;
    onLoadReport: (params: ReportParameters) => void;
    onDeleteReport: (reportName: string) => void;
    wizardStep?: number;
    aiInteractionState?: AiInteractionState;
    onAiInteractionStateChange?: (state: AiInteractionState) => void;
}

const WIZARD_HELP_TEXT: Record<number, string> = {
    1: "Define your role and the high-level goal of your report.",
    2: "Detail the opportunity. Tell me about the region, industry, and ideal partner you have in mind.",
    3: "Describe your core objective. What problem are you trying to solve? This is crucial for the AI Analyst.",
    4: "Review your blueprint. You can now use the Nexus Brain to run advanced analysis on your defined region and objective before generating the final report.",
};

const RROIResultDisplay: React.FC<{ rroi: RROI_Index }> = ({ rroi }) => (
    <div className="space-y-3">
        <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-sm font-semibold text-nexus-text-secondary">Overall Score</p>
            <p className="text-4xl font-bold text-nexus-accent-cyan">{rroi.overallScore}</p>
        </div>
        <p className="text-sm italic text-nexus-text-secondary">{rroi.summary}</p>
        {/* FIX: Explicitly type the mapped variable 'c' as RROI_Component to resolve type errors. */}
        {Object.values(rroi.components).map((c: RROI_Component) => (
            <div key={c.name} className="p-2 border-l-2 border-nexus-border-medium">
                <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-sm text-nexus-text-primary">{c.name}</p>
                    <p className="font-bold text-sm text-nexus-accent-cyan">{c.score}/100</p>
                </div>
                <p className="text-xs text-nexus-text-secondary mt-1">{c.analysis}</p>
            </div>
        ))}
    </div>
);

const TPTResultDisplay: React.FC<{ sim: TPT_Simulation }> = ({ sim }) => (
    <div className="space-y-3">
        <p className="text-sm italic text-nexus-text-secondary">{sim.impactAnalysis}</p>
        {sim.predictedOutcomes.map(o => (
            <div key={o.metric} className="p-2 border-l-2 border-nexus-border-medium">
                <p className="font-semibold text-sm text-nexus-text-primary">{o.metric}</p>
                <p className="text-xs text-nexus-text-secondary">Predicted Change: <span className="font-bold text-lg text-nexus-accent-cyan">{o.startValue} &rarr; {o.endValue}</span></p>
            </div>
        ))}
    </div>
);

const SEAMResultDisplay: React.FC<{ seam: SEAM_Blueprint }> = ({ seam }) => (
     <div className="space-y-3">
        <p className="text-sm italic text-nexus-text-secondary">{seam.ecosystemSummary}</p>
        {seam.partners.map(p => (
            <div key={p.entity} className="p-2 border-l-2 border-nexus-border-medium">
                 <p className="font-semibold text-sm text-nexus-text-primary">{p.entity} <span className="text-xs font-bold uppercase text-nexus-accent-gold">({p.type})</span></p>
                 <p className="text-xs text-nexus-text-secondary mt-1">{p.rationale}</p>
            </div>
        ))}
    </div>
);


export const Inquire: React.FC<InquireProps> = ({
    params,
    onApplySuggestions,
    savedReports,
    onSaveReport,
    onLoadReport,
    onDeleteReport,
    wizardStep,
    aiInteractionState,
    onAiInteractionStateChange,
}) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capabilities, setCapabilities] = useState<AiCapabilitiesResponse | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [researchSummary, setResearchSummary] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryTextAreaRef = useRef<HTMLTextAreaElement>(null);
    
    // Nexus Brain state
    const [brainResults, setBrainResults] = useState<NexusBrainState>({ diagnosis: null, simulation: null, ecosystem: null });
    const [activeCommand, setActiveCommand] = useState<BrainCommand | null>(null);
    const [simulationInput, setSimulationInput] = useState('');


    useEffect(() => {
        const getCapabilities = async () => {
            try {
                const caps = await fetchCapabilities();
                setCapabilities(caps);
            } catch (e) {
                console.error("Failed to fetch capabilities:", e);
                setError(e instanceof Error ? e.message : 'Could not load AI capabilities.');
            }
        };
        getCapabilities();
    }, []);

    // Clear brain results when wizard step changes
    useEffect(() => {
        setResearchSummary(null);
        setBrainResults({ diagnosis: null, simulation: null, ecosystem: null });
        setActiveCommand(null);
    }, [wizardStep]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileContent(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    };
    
    const handleQuickScope = async (e?: React.FormEvent, prompt?: string) => {
        e?.preventDefault();
        const inquiry = prompt || query;
        if (!inquiry.trim()) return;

        setIsLoading(true);
        setError(null);
        setResearchSummary(null);
        try {
            const result = await fetchResearchAndScope(inquiry, fileContent);
            onApplySuggestions(result.suggestions);
            setResearchSummary(result.summary);
            setQuery(''); // Clear query on success
            setFileContent(null); // Clear file content
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBrainCommand = async (command: BrainCommand) => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (command === 'diagnose') {
                if (!params.region || !params.problemStatement) {
                    throw new Error("Target Region and Core Objective must be filled out to run a diagnosis.");
                }
                const result = await diagnoseRegion(params.region, params.problemStatement);
                setBrainResults({ diagnosis: result, simulation: null, ecosystem: null });
            } else if (command === 'simulate' && brainResults.diagnosis) {
                if (!simulationInput.trim()) throw new Error("Please describe an intervention to simulate.");
                const result = await simulatePathway(brainResults.diagnosis, simulationInput);
                setBrainResults(prev => ({ ...prev, simulation: result }));
            } else if (command === 'architect' && brainResults.diagnosis) {
                if (!params.problemStatement) throw new Error("A Core Objective is required to architect an ecosystem.");
                const result = await architectEcosystem(brainResults.diagnosis, params.problemStatement);
                setBrainResults(prev => ({ ...prev, ecosystem: result }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setActiveCommand(null);
            setSimulationInput('');
        }
    };

    const handleRefineObjective = async (context: EconomicData) => {
        if (!params.problemStatement.trim()) {
            setError("Please write an initial Core Objective in Step 3 before refining it.");
            return;
        }
        setIsRefining(true);
        setError(null);
        try {
            const refined = await refineObjectiveWithContext(params.problemStatement, context);
            onApplySuggestions({ problemStatement: refined });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refine objective.');
        } finally {
            setIsRefining(false);
        }
    };

    const handleCapabilityClick = (prompt: string) => {
        setQuery(prompt);
        queryTextAreaRef.current?.focus();
    };

    const renderGuidanceContent = () => {
        if (!wizardStep || !aiInteractionState || !onAiInteractionStateChange) {
            return <p>{capabilities?.greeting || "How can I help you build your report?"}</p>;
        }

        switch (aiInteractionState) {
            case 'idle':
                return <p>I'm ready to assist. Start by entering your name in the profile section.</p>;
            case 'welcomed':
                return <p>Hello, <strong>{params.userName}</strong>. What is the primary goal of your report? You can describe it in the 'Report Name' field to get started.</p>;
            case 'prompted':
                return (
                    <div>
                        <p>It looks like you've paused. Do you want to tell me what you need assistance with?</p>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => { onAiInteractionStateChange('answeredPrompt'); queryTextAreaRef.current?.focus(); }} className="text-sm font-bold py-1 px-3 rounded-md bg-nexus-accent-gold text-black hover:bg-nexus-accent-gold-dark transition-colors">Yes, let's talk</button>
                            <button onClick={() => onAiInteractionStateChange('answeredPrompt')} className="text-sm font-semibold py-1 px-3 rounded-md bg-nexus-surface-700 text-nexus-text-primary hover:bg-nexus-border-medium transition-colors">No, I'm okay</button>
                        </div>
                    </div>
                );
            case 'answeredPrompt':
                 return <p>Understood. Please complete the required fields to continue.</p>;
            case 'active':
            default:
                return <p>{WIZARD_HELP_TEXT[wizardStep]}</p>;
        }
    };
    
    return (
        <div className="bg-white p-4 h-full flex flex-col">
            <header className="flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-nexus-accent-cyan/10 p-2 rounded-lg">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-nexus-accent-cyan"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-nexus-text-primary">Nexus Inquire AI</h2>
                        <p className="text-sm text-nexus-text-secondary">Your Strategic Co-Pilot</p>
                    </div>
                </div>
            </header>

            <div className="mt-4 flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                 {wizardStep === 4 && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-nexus-border-subtle space-y-3 animate-fadeIn">
                         <h3 className="font-semibold text-nexus-text-primary text-md flex items-center gap-2">
                            <NexusLogo className="w-5 h-5" />
                            Nexus Brain Commands
                        </h3>
                        
                        {/* --- DIAGNOSE --- */}
                        <button onClick={() => setActiveCommand('diagnose')} className="w-full text-left p-2 bg-white border border-nexus-border-medium rounded-lg hover:border-nexus-accent-cyan hover:bg-nexus-accent-cyan/5 transition-all text-sm font-semibold" disabled={isLoading}>Diagnose Region (RROI)</button>
                        {activeCommand === 'diagnose' && (
                            <div className="p-3 border-t">
                                <p className="text-xs text-nexus-text-secondary mb-2">This will generate a detailed economic diagnosis for the region defined in Step 2. Proceed?</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBrainCommand('diagnose')} className="nexus-button-primary text-xs !py-1" disabled={isLoading}>{isLoading ? 'Diagnosing...' : 'Confirm'}</button>
                                    <button onClick={() => setActiveCommand(null)} className="nexus-button-secondary text-xs !py-1" disabled={isLoading}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {brainResults.diagnosis && <div className="p-3 border-t animate-fadeIn"><RROIResultDisplay rroi={brainResults.diagnosis} /></div>}

                        {/* --- SIMULATE --- */}
                        <button onClick={() => setActiveCommand('simulate')} className="w-full text-left p-2 bg-white border border-nexus-border-medium rounded-lg hover:border-nexus-accent-cyan hover:bg-nexus-accent-cyan/5 transition-all text-sm font-semibold disabled:opacity-50" disabled={isLoading || !brainResults.diagnosis}>Simulate Pathway (TPT)</button>
                        {activeCommand === 'simulate' && brainResults.diagnosis && (
                            <div className="p-3 border-t space-y-2">
                                <p className="text-xs text-nexus-text-secondary">Describe the strategic intervention to simulate (e.g., "build a new university science park").</p>
                                <input type="text" value={simulationInput} onChange={e => setSimulationInput(e.target.value)} className="w-full text-xs p-2 bg-white border border-nexus-border-medium rounded-md" />
                                <div className="flex gap-2">
                                    <button onClick={() => handleBrainCommand('simulate')} className="nexus-button-primary text-xs !py-1" disabled={isLoading}>{isLoading ? 'Simulating...' : 'Run'}</button>
                                    <button onClick={() => setActiveCommand(null)} className="nexus-button-secondary text-xs !py-1" disabled={isLoading}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {brainResults.simulation && <div className="p-3 border-t animate-fadeIn"><TPTResultDisplay sim={brainResults.simulation} /></div>}
                        
                        {/* --- ARCHITECT --- */}
                        <button onClick={() => setActiveCommand('architect')} className="w-full text-left p-2 bg-white border border-nexus-border-medium rounded-lg hover:border-nexus-accent-cyan hover:bg-nexus-accent-cyan/5 transition-all text-sm font-semibold disabled:opacity-50" disabled={isLoading || !brainResults.diagnosis}>Architect Ecosystem (SEAM)</button>
                         {activeCommand === 'architect' && brainResults.diagnosis && (
                            <div className="p-3 border-t">
                                <p className="text-xs text-nexus-text-secondary mb-2">This will design a partner ecosystem based on the diagnosis and your Core Objective. Proceed?</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBrainCommand('architect')} className="nexus-button-primary text-xs !py-1" disabled={isLoading}>{isLoading ? 'Architecting...' : 'Confirm'}</button>
                                    <button onClick={() => setActiveCommand(null)} className="nexus-button-secondary text-xs !py-1" disabled={isLoading}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {brainResults.ecosystem && <div className="p-3 border-t animate-fadeIn"><SEAMResultDisplay seam={brainResults.ecosystem} /></div>}

                        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                    </div>
                )}
                
                {wizardStep === 1 && aiInteractionState === 'idle' && capabilities ? (
                    <div className="p-3 text-sm text-nexus-text-secondary bg-gray-50 rounded-lg border border-nexus-border-subtle animate-fadeIn">
                        <p className="mb-3">{capabilities.greeting}</p>
                        <h4 className="font-semibold text-nexus-text-primary mb-2">Here are some things I can help with:</h4>
                        <div className="space-y-2">
                            {capabilities.capabilities.map((cap: AiCapability) => (
                                <button key={cap.title} onClick={() => handleCapabilityClick(cap.prompt)} className="w-full text-left p-3 bg-white border border-nexus-border-medium rounded-lg hover:border-nexus-accent-cyan hover:bg-nexus-accent-cyan/5 transition-all">
                                    <p className="font-semibold text-nexus-text-primary">{cap.title}</p>
                                    <p className="text-xs text-nexus-text-secondary mt-1">{cap.description}</p>
                                    <p className="text-xs text-nexus-accent-cyan font-mono mt-2 p-2 bg-nexus-surface-700 rounded-md">Try: "{cap.prompt}"</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-3 text-sm text-nexus-text-secondary bg-gray-50 rounded-lg border border-nexus-border-subtle">
                        <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${aiInteractionState === 'idle' ? 'bg-gray-400' : 'bg-green-400 animate-pulse-green'}`}></div>
                            <div className="flex-grow">
                                {renderGuidanceContent()}
                            </div>
                        </div>
                    </div>
                )}
                
                {researchSummary && (
                    <div className="p-3 bg-nexus-accent-cyan/5 rounded-lg border border-nexus-accent-cyan/20 animate-fadeIn">
                        <h4 className="font-semibold text-nexus-accent-cyan text-md mb-2 flex items-center gap-2">
                            <NexusLogo className="w-5 h-5" />
                            Nexus Brain: Initial Scoping
                        </h4>
                        <div className="prose prose-sm max-w-none text-nexus-text-secondary" dangerouslySetInnerHTML={{ __html: new (window as any).marked.Marked().parse(researchSummary) }}></div>
                    </div>
                )}

                {params.userCountry && (
                    <EconomicSnapshot 
                        country={params.userCountry}
                        isRefining={isRefining}
                        onRefineObjective={handleRefineObjective}
                    />
                )}
                
                <SavedWorkManager 
                    currentParams={params}
                    savedReports={savedReports}
                    onSave={onSaveReport}
                    onLoad={onLoadReport}
                    onDelete={onDeleteReport}
                />
            </div>
            
            <div className="flex-shrink-0 pt-4 mt-4 border-t border-nexus-border-subtle">
                 <form onSubmit={handleQuickScope} className="space-y-3">
                    <label className="text-xs font-semibold text-nexus-text-secondary">Quick Scope</label>
                    <textarea
                        ref={queryTextAreaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Or, start with a high-level goal to auto-fill..."
                        className="w-full p-3 bg-white border border-nexus-border-medium rounded-lg focus:ring-2 focus:ring-nexus-accent-gold focus:outline-none transition placeholder:text-nexus-text-muted text-sm"
                        rows={4}
                        disabled={isLoading}
                    />
                    
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="w-full p-2 bg-nexus-accent-gold text-black font-bold rounded-lg hover:bg-nexus-accent-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <><Spinner /> Researching...</> : 'Research & Scope Blueprint'}
                    </button>
                </form>
            </div>
        </div>
    );
};
