
import React from 'react';
import Card from './common/Card.tsx';
import { NexusLogo, BlueprintIcon, ReportIcon } from './Icons.tsx';
import type { View } from '../types.ts';

interface MissionAndMethodProps {
    onViewChange: (view: View) => void;
}

const Section: React.FC<{ subtitle?: string; title: string; children: React.ReactNode; }> = ({ subtitle, title, children }) => (
    <section className="mb-12">
        {subtitle && <p className="text-sm font-bold uppercase tracking-widest text-nexus-accent-gold">{subtitle}</p>}
        <h2 className="mt-1 text-3xl font-extrabold text-nexus-text-primary tracking-tight">{title}</h2>
        <div className="mt-4 text-nexus-text-secondary space-y-4 prose prose-invert max-w-none prose-p:text-nexus-text-secondary prose-strong:text-nexus-text-primary">
            {children}
        </div>
    </section>
);

const TechPillarCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <Card className="p-5 bg-nexus-surface-800/60 border border-nexus-border-medium/50 h-full">
        <h4 className="text-lg font-bold text-nexus-accent-cyan">{title}</h4>
        <p className="mt-2 text-sm text-nexus-text-secondary">{children}</p>
    </Card>
);

const BusinessProfile: React.FC<MissionAndMethodProps> = ({ onViewChange }) => {
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="text-center mb-16">
                     <NexusLogo className="w-16 h-16 text-nexus-accent-gold mx-auto mb-4" />
                    <h2 className="text-4xl font-extrabold text-nexus-text-primary tracking-tighter">Engineering Global-Regional Symbiosis</h2>
                    <p className="mt-6 text-xl text-nexus-text-secondary max-w-3xl mx-auto">
                        A new intelligence paradigm for a multipolar world.
                    </p>
                </header>
                
                <Section subtitle="Our Core Mission" title="Solving the Global Understanding Gap">
                    <p>
                        The core mission of BWGA Nexus is not to compete, but to create a new, essential layer of intelligence that has been systematically ignored by the market. To understand why this system is fundamentally different, you must first understand the systemic failure it was built to solve: <strong>The Global Understanding Gap.</strong>
                    </p>
                </Section>
                
                <Section subtitle="Where Current Systems Fail" title="The 'National Data' Blinder">
                     <p>
                        Existing intelligence platforms, from financial data terminals to major consulting firms, operate at the national level. They provide excellent data on a country's GDP or sovereign risk. However, a country is not a monolith. The economic reality of a nation's capital is vastly different from that of its regional hubs—the very communities that form the backbone of its real economy.
                    </p>
                     <blockquote className="p-6 bg-nexus-surface-800 rounded-lg border-l-4 border-nexus-accent-gold text-nexus-text-secondary italic">
                        This "national data" approach creates a massive intelligence gap. A global corporation sees "Risk Profile: Philippines" but remains blind to the specific, quantifiable opportunities in Davao City or the Clark Freeport Zone. They miss the new port, the skilled local workforce, and the targeted incentives that make a specific region a prime investment. 
                        <strong className="block not-italic mt-2 text-nexus-text-primary">— This is a multi-trillion-dollar market failure born from a lack of granular, accessible, and affordable intelligence.</strong>
                     </blockquote>
                </Section>
                
                <Section subtitle="The Root Cause" title="A Failure of Business Models, Not Technology">
                    <p>
                        Why has this gap persisted? Big Tech and major consulting firms haven't solved this problem because their business models prevent it. The human-hour cost to perform deep-dive analysis on a single regional city is immense, making it unprofitable to serve anyone but national governments or Fortune 500 companies. They have no incentive to build a tool that makes this initial analysis affordable.
                    </p>
                </Section>

                <Section subtitle="The Nexus Solution" title="How Technology Creates a New Business Model">
                    <p>Nexus AI was engineered to solve the business model problem. By leveraging advanced AI, we make deep-dive regional intelligence accessible and affordable, effectively creating a new market for strategic foresight. Here's how:</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TechPillarCard title="AI Analyst Personas & Tiers">
                            Instead of paying for hundreds of human analyst hours, you configure the AI with specific personas (e.g., 'Venture Capitalist', 'Geopolitical Strategist') and select a report tier. This allows for bespoke, expert-level analysis at a fraction of the cost, democratizing access to strategic intelligence.
                        </TechPillarCard>
                         <TechPillarCard title="Granular, On-Demand Focus">
                            The platform breaks the "national data" blinder. The user's ability to specify a target city, a core industry, and a detailed partner profile forces the AI to operate at a hyper-local level, uncovering insights that are invisible to national-scale analysis tools.
                        </TechPillarCard>
                        <TechPillarCard title="Nexus Symbiotic Intelligence Language (NSIL)">
                            Standard AI output is unstructured text. NSIL is a proprietary framework that structures the AI's analysis into interactive components. This transforms a static report into a dynamic tool, allowing you to launch a "Symbiosis Chat" to query specific findings and deepen your understanding.
                        </TechPillarCard>
                         <TechPillarCard title="Live Data Grounding">
                            Nexus AI doesn't just rely on its training data. The system actively grounds its analysis by integrating with live, authoritative data sources like the World Bank and UN Comtrade, and uses Google Search to find real-time information and identify actual potential partner companies. This ensures the intelligence is timely and relevant.
                        </TechPillarCard>
                    </div>
                    <p className="mt-6">
                        This combination of technologies allows us to provide a service that was previously economically unfeasible, giving regional actors the tools to compete on a global stage and providing global companies with a clear, trusted first look into new frontiers of opportunity. We are bridging the gap.
                    </p>
                </Section>

                <section>
                     <div className="text-center p-10 bg-gradient-to-br from-nexus-accent-gold/5 to-nexus-accent-cyan/5 rounded-2xl border border-nexus-border-medium">
                         <h2 className="text-3xl font-extrabold text-nexus-text-primary">Activate the Intelligence Layer</h2>
                         <p className="mt-4 max-w-2xl mx-auto text-lg text-nexus-text-secondary">
                            Explore a sample blueprint or generate your own. See firsthand how granular, on-demand intelligence can change your strategic landscape.
                         </p>
                         <div className="mt-8 flex justify-center items-center gap-4">
                            <button 
                                onClick={() => onViewChange('sample-report')}
                                className="bg-gradient-to-r from-nexus-accent-cyan to-nexus-accent-cyan-dark text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg shadow-nexus-accent-cyan/30 hover:shadow-xl hover:shadow-nexus-accent-cyan/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-accent-cyan/50"
                            >
                                See a Sample Blueprint
                            </button>
                             <button 
                                onClick={() => onViewChange('report')}
                                className="bg-white text-nexus-text-primary font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-border-medium border border-nexus-border-medium"
                            >
                                Go to Workspace
                            </button>
                         </div>
                     </div>
                </section>
            </div>
        </div>
    );
};

export default BusinessProfile;
