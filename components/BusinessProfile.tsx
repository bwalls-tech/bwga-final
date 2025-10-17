import React from 'react';
import Card from './common/Card.tsx';
import { SymbiosisGraphicIcon, BlueprintIcon, ReportIcon, ManualIcon } from './Icons.tsx';
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
                     <SymbiosisGraphicIcon className="w-24 h-24 text-nexus-accent-cyan mx-auto mb-4" />
                    <h2 className="text-4xl font-extrabold text-nexus-text-primary tracking-tighter">Engineering Global-Regional Symbiosis</h2>
                    <p className="mt-6 text-xl text-nexus-text-secondary max-w-3xl mx-auto">
                        A new intelligence paradigm for a multipolar world.
                    </p>
                </header>
                
                <Section subtitle="Our Core Mission" title="Solving the Global Understanding Gap">
                    <p>
                        Across the world, decision-makers face a critical blind spot. National-level data is plentiful — but it overlooks the heartbeat of real economic growth: the regional cities, provinces, and communities where innovation, production, and opportunity truly begin.
                    </p>
                    <p>
                        This missing layer of insight creates what we call the <strong>Global Understanding Gap</strong> — a silent yet costly divide between global capital and regional potential. The result is a multi-trillion-dollar inefficiency: promising regions remain unseen, investment capital is misdirected, and partnerships that could transform local and global economies are never realized.
                    </p>
                    <p>
                        It is critical to understand that the Nexus Brain is designed to be a powerful <strong>assistant, not a replacement</strong> for human expertise. Its purpose is to augment strategic planners, economists, and government officials by performing complex, multi-source research and analysis in <strong>minutes, not months</strong>. This radical speed allows leaders to test more hypotheses, explore more scenarios, and make faster, more informed decisions.
                    </p>
                </Section>
                
                <Section subtitle="The Nexus Method" title="System Architecture: The Nexus Brain">
                    <p>Nexus AI solves the business model problem that makes deep regional intelligence inaccessible. By leveraging a multi-layered AI, we create a "synthetic strategist" that replicates the workflow of a consulting team, making strategic foresight affordable and on-demand. The architecture is composed of three core layers:</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TechPillarCard title="Layer 1: The Diagnostic Engine (RROI)">
                           The <strong>Regional Resilience & Opportunity Index</strong> is our proprietary diagnostic tool. It generates a multi-dimensional "health score" for a region by applying foundational economic principles like Shift-Share Analysis (to identify competitive advantages), Location Quotient (to map industrial clusters), and Agglomeration theory (to score connectivity and talent density).
                        </TechPillarCard>
                         <TechPillarCard title="Layer 2: The Predictive Engine (TPT)">
                            The <strong>Transformation Pathway Tracer</strong> simulates future outcomes. Using the RROI diagnosis, it applies principles of endogenous growth theory to model the potential impact of strategic interventions (e.g., "building a new university"), allowing users to "war-game" different development paths and preview their long-term effects.
                        </TechPillarCard>
                        <TechPillarCard title="Layer 3: The Prescriptive Engine (SEAM)">
                           The <strong>Symbiotic Ecosystem Architecture Modeler</strong> is the strategy architect. It moves beyond single-partner matchmaking to design a holistic, multi-partner ecosystem required to solve a region's core challenges. It prescribes a portfolio of symbiotic partners (Anchor, Innovation, Capital, etc.) to trigger a virtuous cycle of development.
                        </TechPillarCard>
                         <TechPillarCard title="The Lingua Franca: NSIL v4.0">
                            The <strong>Nexus Symbiotic Intelligence Language</strong> is the grammar of the Nexus Brain. It structures the AI's complex analysis into logical, interactive components. This transforms a static report into a dynamic asset where every finding can be queried and expanded upon via our "Symbiosis Chat" feature, enabling a true dialogue between human and machine intelligence.
                        </TechPillarCard>
                    </div>
                    <p className="mt-6">
                        This integrated architecture allows us to provide a service that was previously economically unfeasible, giving regional actors the tools to compete on a global stage and providing global companies with a clear, trusted first look into new frontiers of opportunity.
                    </p>
                </Section>

                <section>
                     <div className="text-center p-10 bg-gradient-to-br from-nexus-accent-gold/5 to-nexus-accent-cyan/5 rounded-2xl border border-nexus-border-medium">
                         <h2 className="text-3xl font-extrabold text-nexus-text-primary">Activate the Intelligence Layer</h2>
                         <p className="mt-4 max-w-2xl mx-auto text-lg text-nexus-text-secondary">
                            Explore a sample report or generate your own blueprint to see how on-demand intelligence can change your strategic landscape.
                         </p>
                         <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button 
                                onClick={() => onViewChange('sample-report')}
                                className="bg-gradient-to-r from-nexus-accent-cyan to-nexus-accent-cyan-dark text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg shadow-nexus-accent-cyan/30 hover:shadow-xl hover:shadow-nexus-accent-cyan/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-accent-cyan/50 flex items-center gap-2"
                            >
                                <ManualIcon className="w-6 h-6" />
                                View Sample Report
                            </button>
                             <button 
                                onClick={() => onViewChange('report')}
                                className="bg-white text-nexus-text-primary font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-border-medium border border-nexus-border-medium flex items-center gap-2"
                            >
                                <ReportIcon className="w-6 h-6" />
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