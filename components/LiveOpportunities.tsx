import React, { useState, useEffect, useCallback } from 'react';
import { fetchLiveOpportunities, saveUserOpportunity, getUserOpportunities, fetchPredictiveAnalysis } from '../services/nexusService.ts';
import type { LiveOpportunityItem, SymbiosisContext, FeedPost, PredictiveAnalysis } from '../types.ts';
import { PlusCircleIcon, GeospatialIcon, ShieldCheckIcon, BookmarkIcon, BriefcaseIcon, NexusLogo } from './Icons.tsx';
import Loader from './common/Loader.tsx';
import { AddOpportunityModal } from './AddOpportunityModal.tsx';
import { RegionalSnapshot } from './RegionalSnapshot.tsx';
import { DataFeedItem } from './DataFeedItem.tsx';
import Card from './common/Card.tsx';

const PredictiveHorizonScan: React.FC<{ feed: FeedPost[] }> = ({ feed }) => {
    const [analysis, setAnalysis] = useState<PredictiveAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const opportunities = feed.filter(p => p.type === 'opportunity');
        if (opportunities.length < 3) { // Only run if there's enough data
            setIsLoading(false);
            return;
        }

        const runAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchPredictiveAnalysis(feed);
                setAnalysis(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load predictive analysis.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        
        const timer = setTimeout(runAnalysis, 1000); // Debounce to prevent rapid calls
        return () => clearTimeout(timer);

    }, [feed]);
    
    const hasContent = analysis && (analysis.emergingTrends.length > 0 || analysis.futureOpportunities.length > 0 || analysis.potentialDisruptions.length > 0);

    if (isLoading) {
        return (
            <Card className="nexus-card-glass p-6 mb-6 animate-fadeIn animation-delay-400 border-nexus-accent-cyan/30 bg-nexus-accent-cyan/5">
                <div className="flex items-center gap-3 mb-2">
                    <NexusLogo className="w-8 h-8 text-nexus-accent-cyan animate-pulse" />
                    <h3 className="font-semibold text-nexus-text-primary text-lg">Nexus Brain: Predictive Scan</h3>
                </div>
                <p className="text-sm text-nexus-text-secondary">Analyzing feed for future trends and opportunities...</p>
            </Card>
        );
    }
    
    if (error || !hasContent) {
        return null; // Don't render if there's an error or no content
    }

    const AnalysisSection: React.FC<{ title: string, items: { title: string, content: string }[] }> = ({ title, items }) => {
        if (items.length === 0) return null;
        return (
             <div>
                <h4 className="text-base font-semibold text-nexus-text-primary mb-2">{title}</h4>
                <ul className="space-y-2">
                    {items.map((item, i) => (
                        <li key={i} className="text-sm p-3 bg-white/60 border border-nexus-border-medium rounded-md shadow-sm">
                            <strong className="text-nexus-text-primary block">{item.title}</strong>
                            <p className="text-nexus-text-secondary mt-1">{item.content}</p>
                        </li>
                    ))}
                </ul>
            </div>
        )
    };
    
    return (
        <Card className="nexus-card-glass p-6 mb-6 animate-fadeIn animation-delay-400 border-nexus-accent-cyan/50 bg-nexus-accent-cyan/5">
            <div className="flex items-center gap-3 mb-2">
                <NexusLogo className="w-8 h-8 text-nexus-accent-cyan" />
                <h3 className="font-semibold text-nexus-text-primary text-lg">Nexus Brain: Predictive Horizon Scan</h3>
            </div>
            <p className="text-sm text-nexus-text-secondary mb-4">AI-driven analysis of emerging trends based on the current data feed.</p>
            <div className="grid md:grid-cols-3 gap-6">
                <AnalysisSection title="Emerging Trends" items={analysis.emergingTrends.map(t => ({ title: t.trend, content: t.justification }))} />
                <AnalysisSection title="Future Opportunities" items={analysis.futureOpportunities.map(o => ({ title: o.opportunity, content: o.rationale }))} />
                <AnalysisSection title="Potential Disruptions" items={analysis.potentialDisruptions.map(d => ({ title: d.disruption, content: d.impact }))} />
            </div>
        </Card>
    );
};


const ConnectionGuide: React.FC = () => (
    <Card className="nexus-card-error mb-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="nexus-icon-circle-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Action Required: Connection Failure</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-red-200">
          The application is running in <strong>offline/fallback mode</strong> because it failed to connect to the live AI service.
        </p>
        <p className="text-red-200">
          This typically happens when the server-side component is unresponsive or not configured correctly. The most common cause is a missing API Key.
        </p>
        
        <div className="p-4 bg-nexus-primary-900/50 rounded-lg border border-nexus-border-medium">
          <h4 className="text-white mb-3 font-semibold">How to Fix This:</h4>
          <p className="text-amber-200 mb-4 text-sm">
            The application administrator must configure the backend service with a valid API Key by setting a server-side environment variable.
          </p>
          
          <div className="p-3 bg-nexus-primary-900 rounded text-sm font-mono text-nexus-text-secondary">
            <div><strong>Variable Name:</strong> <code className="text-white">API_KEY</code></div>
            <div className="mt-2"><strong>Variable Value:</strong> <code className="text-white">[Your Google Gemini API Key]</code></div>
          </div>
        </div>
      </div>
    </Card>
);

const IntelligenceToolItem: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="nexus-icon-circle-accent">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-nexus-text-primary mb-1">{title}</h4>
            <p className="text-sm text-nexus-text-secondary">{children}</p>
        </div>
    </div>
);

interface LiveOpportunitiesProps {
    onAnalyze: (item: LiveOpportunityItem) => void;
    onStartSymbiosis: (context: SymbiosisContext) => void;
}

export const LiveOpportunities: React.FC<LiveOpportunitiesProps> = ({ onAnalyze, onStartSymbiosis }) => {
    const [feed, setFeed] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnectionError, setIsConnectionError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsConnectionError(false);

        const liveData = await fetchLiveOpportunities();
        
        if (liveData.isMockData) {
            setIsConnectionError(true);
            setError("Server is in fallback mode. Live data unavailable.");
        }
        
        const userAdded = getUserOpportunities();
        const combinedFeed = [
            ...userAdded.map(item => ({
                id: item.project_name + item.summary + Math.random().toString(),
                timestamp: new Date().toISOString(),
                type: 'opportunity',
                content: item,
            } as FeedPost)),
            ...(liveData.feed || []),
        ];
        
        const sortedFeed = combinedFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setFeed(sortedFeed);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveNewOpportunity = (newItem: Omit<LiveOpportunityItem, 'isUserAdded' | 'ai_feasibility_score' | 'ai_risk_assessment'>) => {
        saveUserOpportunity(newItem);
        setIsModalOpen(false);
        loadData();
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="grid lg:grid-cols-5 gap-8 mb-8">
                    <div className="lg:col-span-3">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-4 animate-fadeIn text-nexus-text-primary">
                            Global Data Hub
                        </h2>
                        <p className="text-lg text-nexus-text-secondary max-w-2xl animate-fadeIn animation-delay-200">
                            The Nexus clearinghouse for live development opportunities, news, and economic indicators. Our AI provides an initial feasibility and risk assessment on aggregated tenders and projects.
                        </p>
                    </div>
                    <Card className="nexus-card-glass p-4 lg:col-span-2 animate-fadeIn animation-delay-400">
                         <h3 className="font-semibold text-nexus-accent-gold mb-3">Sector Focus Snapshot</h3>
                         <RegionalSnapshot feed={feed} />
                    </Card>
                </header>
                
                <PredictiveHorizonScan feed={feed} />

                <Card className="nexus-card-glass p-6 mb-6 animate-fadeIn animation-delay-600">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <IntelligenceToolItem icon={<BriefcaseIcon className="w-7 h-7" />} title="Identify Opportunities">
                            Scan live tenders and projects aggregated from global development banks and government sources.
                        </IntelligenceToolItem>
                        <IntelligenceToolItem icon={<ShieldCheckIcon className="w-7 h-7" />} title="Assess Risk & Feasibility">
                            Our AI provides a preliminary score and qualitative risk summary for each opportunity.
                        </IntelligenceToolItem>
                        <IntelligenceToolItem icon={<GeospatialIcon className="w-7 h-7" />} title="Contextualize with News">
                            Stay informed with a curated feed of relevant geopolitical and economic news impacting key regions.
                        </IntelligenceToolItem>
                        <IntelligenceToolItem icon={<BookmarkIcon className="w-7 h-7" />} title="Build Your Watchlist">
                           List your own private opportunities or projects to keep them organized and ready for deep-dive analysis.
                        </IntelligenceToolItem>
                    </div>
                </Card>

                {isConnectionError && <ConnectionGuide />}

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-nexus-text-primary">Live Intelligence Feed</h3>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="nexus-button-primary flex items-center gap-2"
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        List New Project
                    </button>
                </div>

                {isLoading ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <Loader message="Connecting to Global Data Hub..." />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {feed.map((post, index) => (
                           <DataFeedItem 
                             key={post.id} 
                             post={post}
                             onAnalyze={onAnalyze}
                             onStartSymbiosis={onStartSymbiosis} 
                           />
                       ))}
                    </div>
                )}
                 
                 {!isLoading && feed.length === 0 && (
                    <div className="text-center py-16">
                        <div className="nexus-icon-circle-accent mx-auto mb-4">
                            <BriefcaseIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-nexus-text-primary mb-2">No opportunities found</h3>
                        <p className="text-nexus-text-secondary">
                            Start by adding your first opportunity or check back later for new data.
                        </p>
                    </div>
                )}
            </div>

            <AddOpportunityModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveNewOpportunity}
            />
        </div>
    );
};