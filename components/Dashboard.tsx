


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchIntelligenceForCategory } from '../services/geminiService.ts';
import type { DashboardIntelligence, SymbiosisContext } from '../types.ts';
import Loader from './common/Loader.tsx';
import Card from './common/Card.tsx';
import { DASHBOARD_CATEGORIES } from '../constants.tsx';
import { ExternalLinkIcon, SymbiosisIcon, AnalyzeIcon } from './Icons.tsx';

interface DashboardProps {
    onAnalyze: (item: DashboardIntelligence['items'][0]) => void;
    onStartSymbiosis: (context: SymbiosisContext) => void;
}

const IntelligenceCard: React.FC<{ 
    item: DashboardIntelligence['items'][0]; 
    onAnalyze: DashboardProps['onAnalyze'];
    onStartSymbiosis: DashboardProps['onStartSymbiosis'];
}> = ({ item, onAnalyze, onStartSymbiosis }) => {
    
    const handleSymbiosisClick = (event: React.MouseEvent, topic: string, content: string) => {
        event.stopPropagation();
        onStartSymbiosis({
            topic: topic,
            originalContent: content,
        });
    };

    return (
        <Card className="flex flex-col h-full group border-nexus-border-medium hover:border-nexus-accent-cyan/50">
            <h3 className="text-lg font-bold text-nexus-text-primary mb-3 group-hover:text-nexus-accent-cyan transition-colors duration-300">{item.company}</h3>
            <p className="text-sm text-nexus-text-secondary mb-4 flex-grow">{item.details}</p>
            
            <div className="mt-auto pt-4 border-t border-nexus-border-medium space-y-4">
                <div className="relative">
                    <p className="text-xs text-nexus-accent-gold font-semibold uppercase tracking-wider mb-1">Strategic Implication</p>
                    <p className="text-sm text-nexus-text-primary pr-8">{item.implication}</p>
                    <button 
                        onClick={(e) => handleSymbiosisClick(e, `Strategic Implication for: ${item.company}`, item.implication)}
                        className="absolute top-0 right-0 p-1 text-nexus-accent-gold hover:text-nexus-accent-cyan rounded-full hover:bg-nexus-surface-700 transition-all opacity-50 group-hover:opacity-100"
                        title="Start Symbiosis Chat"
                    >
                        <SymbiosisIcon className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex justify-between items-center">
                     <span className="text-xs text-nexus-text-muted">Source: {item.source}</span>
                     <div className="flex items-center gap-3">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-nexus-text-secondary hover:text-nexus-accent-cyan transition-colors">
                          Source <ExternalLinkIcon className="w-3 h-3 ml-1" />
                        </a>
                        <button onClick={() => onAnalyze(item)} className="inline-flex items-center text-xs font-semibold text-nexus-text-primary bg-nexus-surface-700 px-2 py-1 rounded-md hover:bg-nexus-accent-cyan hover:text-nexus-primary-900 transition-all">
                          Analyze <AnalyzeIcon className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onAnalyze, onStartSymbiosis }) => {
  const [intelligence, setIntelligence] = useState<DashboardIntelligence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const hasFetched = useRef(false);

  const loadIntelligence = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIntelligence([]);
    setActiveCategory('All');
    let hasFetchError = false;

    const fetchPromises = DASHBOARD_CATEGORIES.map(category =>
      fetchIntelligenceForCategory(category)
        .then(data => {
          setIntelligence(prev => {
            const newIntelligence = [...prev, data];
            newIntelligence.sort((a, b) => DASHBOARD_CATEGORIES.indexOf(a.category) - DASHBOARD_CATEGORIES.indexOf(b.category));
            return newIntelligence;
          });
        })
        .catch(err => {
          console.error(`Failed to fetch category '${category}':`, err);
          hasFetchError = true;
        })
    );

    await Promise.all(fetchPromises);
    
    if (hasFetchError) {
      setError("Failed to load some intelligence categories. The feed may be incomplete.");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadIntelligence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueCategories = useMemo(() => 
    ['All', ...DASHBOARD_CATEGORIES],
  []);

  const filteredIntelligence = useMemo(() => 
    intelligence.filter(categoryData => 
        activeCategory === 'All' || categoryData.category === activeCategory
    ),
  [intelligence, activeCategory]);

  if (isLoading && intelligence.length === 0) {
    return <Loader message="Fetching Live Global Intelligence..." />;
  }

  if (!isLoading && intelligence.length === 0) {
     return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-yellow-300 p-8 bg-yellow-900/20 rounded-lg border border-yellow-400/30 max-w-lg">
          <h3 className="text-xl font-bold text-nexus-warning">Intelligence Service Error</h3>
          <p className="mt-2 text-nexus-text-secondary">Could not connect to the live global intelligence feed. The AI service may be temporarily unavailable or returned no data.</p>
          <p className="text-xs text-yellow-500 mt-2">({error || "No data received."})</p>
          <button onClick={loadIntelligence} className="mt-6 px-5 py-2.5 bg-gradient-to-r from-nexus-accent-cyan to-nexus-accent-cyan-dark text-nexus-primary-900 font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6">
      <header className="max-w-7xl w-full mx-auto">
        <h2 className="text-3xl font-extrabold text-nexus-text-primary tracking-tighter">Live Intelligence Dashboard</h2>
        <p className="text-nexus-text-secondary mt-2 max-w-4xl">
            A real-time feed of global events with strategic implications. Use these signals as a starting point for a deeper investigation with a full <span className="font-semibold text-nexus-accent-cyan">BWGA Nexus Report</span>.
        </p>
        <div className="mt-6 border-b border-nexus-border-medium">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {uniqueCategories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all
                    ${activeCategory === cat
                        ? 'border-nexus-accent-gold text-nexus-accent-gold'
                        : 'border-transparent text-nexus-text-secondary hover:text-nexus-text-primary hover:border-nexus-text-muted'
                    }`}
                >
                {cat}
                </button>
            ))}
            </nav>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto max-w-7xl w-full mx-auto pr-2 -mr-2">
        {error && <p className="text-nexus-warning text-center my-4">{error}</p>}
        {filteredIntelligence.length > 0 ? (
             <div className="space-y-10">
                {filteredIntelligence.map((categoryData) => (
                    <section key={categoryData.category}>
                        <h3 className="text-2xl font-bold text-nexus-text-primary mb-4">{categoryData.category}</h3>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {categoryData.items.map((item, index) => (
                                <IntelligenceCard 
                                    key={`${item.url}-${index}`}
                                    item={item} 
                                    onAnalyze={onAnalyze} 
                                    onStartSymbiosis={onStartSymbiosis}
                                />
                            ))}
                        </div>
                    </section>
                ))}
                {isLoading && (
                    <div className="flex justify-center items-center p-4 mt-6">
                        <div className="w-8 h-8 border-4 border-nexus-accent-cyan/50 border-dashed rounded-full animate-spin"></div>
                        <p className="ml-4 text-nexus-text-secondary">Loading more categories...</p>
                    </div>
                )}
             </div>
        ) : (
            <div className="flex items-center justify-center h-full">
                <Card className="text-center">
                    <h3 className="text-xl font-bold">No Intelligence Found</h3>
                    <p className="text-nexus-text-secondary mt-2">No items match the current filter. Try reloading or selecting another category.</p>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;