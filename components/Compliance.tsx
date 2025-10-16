import React from 'react';
import Card from './common/Card.tsx';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card className="mb-6">
        <h3 className="text-xl font-bold text-nexus-accent-gold mb-4">{title}</h3>
        <div className="prose prose-invert max-w-none text-nexus-text-secondary text-sm prose-p:my-2 prose-strong:text-nexus-text-primary">
            {children}
        </div>
    </Card>
);

const Compliance: React.FC = () => {
    return (
        <div className="p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-nexus-text-primary">Compliance, Security, and Data Governance</h2>
                
                <Section title="Ethical AI & Data Governance Framework">
                    <p>
                        BWGA is unequivocally committed to the responsible development and deployment of AI. Our operational methodologies are governed by the <strong>Ethical AI & Data Governance Framework v1.0</strong>. This framework outlines our core principles for Human-Centricity, Fairness/Non-Discrimination, Transparency/Explainability, Accountability/Human Oversight, and Security/Safety.
                    </p>
                    <p>
                        Our practices are designed to align with global best practices and established international standards, including the OECD AI Principles, to ensure our services are not only powerful but also ethically sound and socially responsible.
                    </p>
                </Section>
                
                <Section title="Data Privacy & User Control">
                    <p>
                        We operate on a principle of data minimization and user privacy. <strong>The Nexus AI platform does not store your personal information or the contents of your generated reports by default.</strong> Your session is stateless.
                    </p>
                    <p>
                        If future functionality allows for saving reports to a user account, any such data will be encrypted and stored securely. You are the only person who will have access to this information. Your reports and proprietary data will never be shared with third parties or used to train our AI models.
                    </p>
                </Section>
                
                <Section title="Analytical Integrity & Anti-Manipulation">
                    <p>
                        The Nexus AI engine is engineered for objective, data-driven analysis. It cannot be influenced to produce deliberately false reports. The system is designed with safeguards to identify and reject prompts that are nonsensical, unethical, or appear to be malicious attempts to generate misinformation.
                    </p>
                    <p>
                        Our AI's core instructions prioritize factual grounding and analytical rigor over fulfilling requests that fall outside its designated function as a strategic intelligence tool. If a query is determined to be questionable or an attempt to trick the system, the engine is instructed to refuse the request and state that it cannot produce the report.
                    </p>
                </Section>

                <Section title="Data Sourcing & Analytical Integrity">
                    <p>
                        The analytical insights provided in BWGA Nexus reports are generated from a multi-level process involving publicly available data, information from official government sources, reputable global databases, and proprietary AI-assisted processing. All information is sourced and analyzed to the best of our ability at the date of generation.
                    </p>
                    <p>
                        Our system is designed to meet high standards of analytical rigor. Data is run through multiple AI programs to cross-reference and validate information, ensuring the highest possible degree of accuracy from publicly available information. This process is intended to help in clarifying and contextualizing information to support regional competitiveness.
                    </p>
                </Section>

                <Section title="System & Report Security">
                    <p>
                        We employ robust security measures to protect the integrity of our systems and the confidentiality of our reports. This includes utilizing <strong>industry-standard encryption protocols</strong> for data in transit and at rest. The generated reports are designed to be secure, ensuring that the intelligence provided is delivered exclusively to the intended recipient and protected against unauthorized modification or tampering.
                    </p>
                </Section>
                
                <Section title="Confidentiality & Intellectual Property">
                    <p>
                        All information disclosed by BWGA is provided on a <strong>STRICTLY CONFIDENTIAL BASIS</strong>. All concepts, methodologies, and the "BWGA Nexus™" name and system constitute the developing and proprietary intellectual property of BW Global Advisory (Brayden Walls, ABN 55 978 113 300). Engagements are governed by service agreements detailing IP considerations.
                    </p>
                </Section>

                <Section title="Information for Guidance & Decision Support Only">
                    <p>
                        The Information provided by BWGA is intended to serve as <strong>advanced decision-support</strong>. It is not a substitute for the Recipient's own comprehensive internal assessments, independent feasibility studies, or professional financial/legal advice. The user is solely responsible for all decisions made and actions taken based on their interpretation of the generated report.
                    </p>
                </Section>

                <Section title="Limitation of Liability & No Warranties">
                    <p>
                        Information is provided <strong>"as is" and "as available."</strong> Given the developmental nature of the platform and its reliance on public data, BWGA makes no warranties as to its absolute completeness or accuracy. The Recipient's use of the Information is solely at their own risk.
                    </p>
                </Section>
            </div>
        </div>
    );
};

export default Compliance;